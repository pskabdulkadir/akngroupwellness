import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  BarChart3,
  Calendar,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  CommissionTransaction,
  MonolineMember,
} from '../types/monoline';
import { formatUsd } from '../utils/currency';

export interface DailySalesPoint {
  date: Date;
  dateKey: string;
  label: string;
  fullDateLabel: string;
  dailyVolume: number;
  cumulativeVolume: number;
  orderCount: number;
  creditsIssued: number;
  dealerCommissionsEarned: number;
}

interface SalesVolumeD3ChartProps {
  transactions: CommissionTransaction[];
  members: MonolineMember[];
  selectedMemberId: string;
  onSelectMember?: (userId: string) => void;
  onQuickTriggerOrder?: (member: MonolineMember, amount?: number) => Promise<void>;
  onRefreshLiveState?: () => Promise<void>;
  isSubmitting?: boolean;
  isLivePolling?: boolean;
  onToggleLivePolling?: () => void;
  lastUpdatedAt?: Date | null;
}

type ScopeMode = 'DEALER_NETWORK' | 'DEALER_PERSONAL' | 'GLOBAL_AUTHORIZED';
type MetricMode = 'CUMULATIVE' | 'DAILY' | 'BOTH';

export const SalesVolumeD3Chart: React.FC<SalesVolumeD3ChartProps> = ({
  transactions,
  members,
  selectedMemberId,
  onSelectMember,
  onQuickTriggerOrder,
  onRefreshLiveState,
  isSubmitting = false,
  isLivePolling = true,
  onToggleLivePolling,
  lastUpdatedAt,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(860);
  const [scopeMode, setScopeMode] = useState<ScopeMode>('GLOBAL_AUTHORIZED');
  const [metricMode, setMetricMode] = useState<MetricMode>('BOTH');
  const [hoveredPoint, setHoveredPoint] = useState<DailySalesPoint | null>(null);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.global_line_id - b.global_line_id),
    [members]
  );

  const activeDealer = useMemo(
    () =>
      sortedMembers.find((m) => m.user_id === selectedMemberId) ||
      sortedMembers[0] ||
      null,
    [sortedMembers, selectedMemberId]
  );

  // Observe responsive container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 240) {
        setContainerWidth(Math.floor(rect.width));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Filter transactions based on authorized dealer scope
  const scopedTransactions = useMemo(() => {
    if (!activeDealer || scopeMode === 'GLOBAL_AUTHORIZED') {
      return transactions;
    }

    if (scopeMode === 'DEALER_PERSONAL') {
      return transactions.filter((tx) => tx.buyer_user_id === activeDealer.user_id);
    }

    // DEALER_NETWORK: orders where activeDealer is buyer, direct sponsor, or in the 7-depth monoline payout chain
    return transactions.filter((tx) => {
      if (tx.buyer_user_id === activeDealer.user_id) return true;
      if (tx.direct_sponsor?.sponsor_user_id === activeDealer.user_id) return true;
      if (
        tx.monoline_upline_payouts?.some(
          (p) => p.recipient_user_id === activeDealer.user_id
        )
      ) {
        return true;
      }
      return false;
    });
  }, [transactions, activeDealer, scopeMode]);

  // Build 30-day time series for 'Toplam Paket Satış Hacmi'
  const seriesData: DailySalesPoint[] = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dayBuckets = new Map<
      string,
      {
        date: Date;
        dailyVolume: number;
        orderCount: number;
        creditsIssued: number;
        dealerCommissionsEarned: number;
      }
    >();

    // Initialize 30 days (from Day -29 to Today)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(todayStart.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      dayBuckets.set(key, {
        date: d,
        dailyVolume: 0,
        orderCount: 0,
        creditsIssued: 0,
        dealerCommissionsEarned: 0,
      });
    }

    // Baseline volume from transactions older than 30 days so cumulative volume is accurate
    const firstBucketDate = new Date(todayStart);
    firstBucketDate.setDate(todayStart.getDate() - 29);

    let runningCumulative = 0;

    // Sort transactions chronologically
    const chronological = [...scopedTransactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const tx of chronological) {
      const txDate = new Date(tx.timestamp);
      if (isNaN(txDate.getTime())) continue;

      const dayStart = new Date(
        txDate.getFullYear(),
        txDate.getMonth(),
        txDate.getDate()
      );
      const key = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(dayStart.getDate()).padStart(2, '0')}`;

      if (dayStart < firstBucketDate) {
        runningCumulative += Number(tx.order_amount) || 0;
        continue;
      }

      const bucket = dayBuckets.get(key);
      if (bucket) {
        const amt = Number(tx.order_amount) || 0;
        bucket.dailyVolume += amt;
        bucket.orderCount += 1;
        bucket.creditsIssued += Number(tx.session_credits_added) || 0;

        if (activeDealer && scopeMode !== 'GLOBAL_AUTHORIZED') {
          let earned = 0;
          if (tx.direct_sponsor?.sponsor_user_id === activeDealer.user_id) {
            earned += Number(tx.direct_sponsor.amount_paid) || 0;
          }
          for (const p of tx.monoline_upline_payouts || []) {
            if (
              p.recipient_user_id === activeDealer.user_id &&
              p.status === 'PAID_TO_MEMBER'
            ) {
              earned += Number(p.calculated_amount) || 0;
            }
          }
          bucket.dealerCommissionsEarned += earned;
        } else {
          bucket.dealerCommissionsEarned +=
            (Number(tx.direct_sponsor?.amount_paid) || 0) +
            (Number(tx.total_distributed_to_upline) || 0);
        }
      }
    }

    // If a member has personal_volume recorded on their profile that predates or isn't in transaction logs,
    // reflect it on their join date bucket so authorized dealers always see accurate volume on the chart
    if (chronological.length === 0 && members.length > 0) {
      const relevantMembers =
        scopeMode === 'GLOBAL_AUTHORIZED'
          ? members
          : activeDealer
          ? [activeDealer]
          : members;

      for (const m of relevantMembers) {
        if (m.personal_volume > 0) {
          const joinDate = new Date(m.joined_at);
          const validDate = isNaN(joinDate.getTime()) ? todayStart : joinDate;
          const dayStart = new Date(
            validDate.getFullYear(),
            validDate.getMonth(),
            validDate.getDate()
          );
          const key = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(
            2,
            '0'
          )}-${String(dayStart.getDate()).padStart(2, '0')}`;
          const bucket = dayBuckets.get(key) || dayBuckets.get(
            `${todayStart.getFullYear()}-${String(todayStart.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(todayStart.getDate()).padStart(2, '0')}`
          );
          if (bucket) {
            bucket.dailyVolume += m.personal_volume;
            bucket.orderCount += 1;
            bucket.creditsIssued += m.session_credits;
          }
        }
      }
    }

    const result: DailySalesPoint[] = [];
    for (const [key, bucket] of dayBuckets.entries()) {
      runningCumulative += bucket.dailyVolume;
      result.push({
        date: bucket.date,
        dateKey: key,
        label: bucket.date.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short',
        }),
        fullDateLabel: bucket.date.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        dailyVolume: Math.round(bucket.dailyVolume * 100) / 100,
        cumulativeVolume: Math.round(runningCumulative * 100) / 100,
        orderCount: bucket.orderCount,
        creditsIssued: bucket.creditsIssued,
        dealerCommissionsEarned: Math.round(bucket.dealerCommissionsEarned * 100) / 100,
      });
    }

    return result;
  }, [scopedTransactions, members, activeDealer, scopeMode]);

  // Summary statistics over the last 30 days
  const stats30d = useMemo(() => {
    const total30dVolume = seriesData.reduce((acc, d) => acc + d.dailyVolume, 0);
    const total30dOrders = seriesData.reduce((acc, d) => acc + d.orderCount, 0);
    const total30dCredits = seriesData.reduce((acc, d) => acc + d.creditsIssued, 0);
    const latestCumulative =
      seriesData.length > 0 ? seriesData[seriesData.length - 1].cumulativeVolume : 0;
    const todayPoint = seriesData.length > 0 ? seriesData[seriesData.length - 1] : null;
    const peakDay = seriesData.reduce(
      (max, d) => (d.dailyVolume > max.dailyVolume ? d : max),
      seriesData[0] || {
        dailyVolume: 0,
        label: '-',
        fullDateLabel: '-',
      }
    );

    // Compare last 7 days vs previous 7 days for momentum percentage
    const last7Volume = seriesData
      .slice(-7)
      .reduce((acc, d) => acc + d.dailyVolume, 0);
    const prev7Volume = seriesData
      .slice(-14, -7)
      .reduce((acc, d) => acc + d.dailyVolume, 0);
    const growthPct =
      prev7Volume > 0
        ? ((last7Volume - prev7Volume) / prev7Volume) * 100
        : last7Volume > 0
        ? 100
        : 0;

    return {
      total30dVolume,
      total30dOrders,
      total30dCredits,
      latestCumulative,
      todayVolume: todayPoint?.dailyVolume || 0,
      todayOrders: todayPoint?.orderCount || 0,
      peakDay,
      growthPct,
    };
  }, [seriesData]);

  // Render D3 SVG chart whenever seriesData, containerWidth, or metricMode changes
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || seriesData.length === 0) return;

    const height = 310;
    const margin = { top: 24, right: 28, bottom: 38, left: 76 };
    const innerWidth = Math.max(180, containerWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${containerWidth} ${height}`);

    // Definitions for gradients and glow filter
    const defs = svg.append('defs');

    // Cumulative Area Gradient (Emerald)
    const cumGrad = defs
      .append('linearGradient')
      .attr('id', 'monoline-cum-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    cumGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.32);
    cumGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.01);

    // Daily Area Gradient (Indigo / Cyan)
    const dailyGrad = defs
      .append('linearGradient')
      .attr('id', 'monoline-daily-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    dailyGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.28);
    dailyGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.01);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(seriesData, (d) => d.date) as [Date, Date];
    const xScale = d3.scaleTime().domain(xExtent).range([0, innerWidth]);

    const maxVal = d3.max(seriesData, (d) => {
      if (metricMode === 'DAILY') return d.dailyVolume;
      if (metricMode === 'CUMULATIVE') return d.cumulativeVolume;
      return Math.max(d.dailyVolume, d.cumulativeVolume);
    }) || 5000;

    const yMax = maxVal <= 0 ? 10000 : maxVal * 1.15;
    const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(5);
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1);

    // X Axis
    const xAxis = d3
      .axisBottom<Date>(xScale)
      .ticks(Math.min(8, Math.floor(innerWidth / 95)))
      .tickSizeOuter(0)
      .tickFormat((d) =>
        d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
      );

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace');

    // Y Axis
    const yAxis = d3
      .axisLeft<number>(yScale)
      .ticks(5)
      .tickSizeOuter(0)
      .tickFormat((d) => {
        if (d >= 1000000) return `$${(d / 1000000).toFixed(1)}M`;
        if (d >= 1000) return `$${(d / 1000).toFixed(0)}B`;
        return `$${d}`;
      });

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('line').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace');

    // Draw Cumulative Trend Line & Area
    if (metricMode === 'CUMULATIVE' || metricMode === 'BOTH') {
      const cumArea = d3
        .area<DailySalesPoint>()
        .x((d) => xScale(d.date))
        .y0(innerHeight)
        .y1((d) => yScale(d.cumulativeVolume))
        .curve(d3.curveMonotoneX);

      const cumLine = d3
        .line<DailySalesPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.cumulativeVolume))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(seriesData)
        .attr('fill', 'url(#monoline-cum-area-grad)')
        .attr('d', cumArea);

      g.append('path')
        .datum(seriesData)
        .attr('fill', 'none')
        .attr('stroke', '#059669')
        .attr('stroke-width', 2.75)
        .attr('d', cumLine);
    }

    // Draw Daily Sales Volume Line & Area
    if (metricMode === 'DAILY' || metricMode === 'BOTH') {
      const dailyArea = d3
        .area<DailySalesPoint>()
        .x((d) => xScale(d.date))
        .y0(innerHeight)
        .y1((d) => yScale(d.dailyVolume))
        .curve(d3.curveMonotoneX);

      const dailyLine = d3
        .line<DailySalesPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.dailyVolume))
        .curve(d3.curveMonotoneX);

      if (metricMode === 'DAILY') {
        g.append('path')
          .datum(seriesData)
          .attr('fill', 'url(#monoline-daily-area-grad)')
          .attr('d', dailyArea);
      }

      g.append('path')
        .datum(seriesData)
        .attr('fill', 'none')
        .attr('stroke', '#4f46e5')
        .attr('stroke-width', metricMode === 'DAILY' ? 2.75 : 2)
        .attr('stroke-dasharray', metricMode === 'BOTH' ? '5 3' : 'none')
        .attr('d', dailyLine);
    }

    // Data point dots for days with active orders or final day
    const activePoints = seriesData.filter(
      (d, idx) => d.orderCount > 0 || idx === seriesData.length - 1
    );

    if (metricMode === 'CUMULATIVE' || metricMode === 'BOTH') {
      g.selectAll('.cum-dot')
        .data(activePoints)
        .enter()
        .append('circle')
        .attr('class', 'cum-dot')
        .attr('cx', (d) => xScale(d.date))
        .attr('cy', (d) => yScale(d.cumulativeVolume))
        .attr('r', (d) => (d.orderCount > 0 ? 4.5 : 3.5))
        .attr('fill', '#10b981')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);
    }

    if (metricMode === 'DAILY' || metricMode === 'BOTH') {
      g.selectAll('.daily-dot')
        .data(activePoints)
        .enter()
        .append('circle')
        .attr('class', 'daily-dot')
        .attr('cx', (d) => xScale(d.date))
        .attr('cy', (d) => yScale(d.dailyVolume))
        .attr('r', (d) => (d.orderCount > 0 ? 4 : 3))
        .attr('fill', '#4f46e5')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
    }

    // Live pulsing beacon on the latest (Today) data point
    const lastPoint = seriesData[seriesData.length - 1];
    if (lastPoint) {
      const targetY =
        metricMode === 'DAILY'
          ? yScale(lastPoint.dailyVolume)
          : yScale(lastPoint.cumulativeVolume);
      const targetColor = metricMode === 'DAILY' ? '#4f46e5' : '#10b981';

      g.append('circle')
        .attr('cx', xScale(lastPoint.date))
        .attr('cy', targetY)
        .attr('r', 8)
        .attr('fill', targetColor)
        .attr('fill-opacity', 0.25);

      g.append('circle')
        .attr('cx', xScale(lastPoint.date))
        .attr('cy', targetY)
        .attr('r', 4.5)
        .attr('fill', targetColor)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);
    }

    // Interactive Crosshair & Hover Overlay using d3.bisector
    const hoverGroup = g.append('g').style('display', 'none');

    const hoverLine = hoverGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3 3');

    const hoverCumCircle = hoverGroup
      .append('circle')
      .attr('r', 6)
      .attr('fill', '#059669')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5);

    const hoverDailyCircle = hoverGroup
      .append('circle')
      .attr('r', 5.5)
      .attr('fill', '#4f46e5')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const bisectDate = d3.bisector<DailySalesPoint, Date>((d) => d.date).left;

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mouseenter', () => {
        hoverGroup.style('display', null);
      })
      .on('mouseleave', () => {
        hoverGroup.style('display', 'none');
        setHoveredPoint(null);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        const i = bisectDate(seriesData, x0, 1);
        const d0 = seriesData[i - 1];
        const d1 = seriesData[i];
        let d = d0;
        if (d0 && d1) {
          d =
            x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()
              ? d1
              : d0;
        }
        if (!d) return;

        const cx = xScale(d.date);
        hoverLine.attr('x1', cx).attr('x2', cx);

        if (metricMode === 'CUMULATIVE' || metricMode === 'BOTH') {
          hoverCumCircle
            .style('display', null)
            .attr('cx', cx)
            .attr('cy', yScale(d.cumulativeVolume));
        } else {
          hoverCumCircle.style('display', 'none');
        }

        if (metricMode === 'DAILY' || metricMode === 'BOTH') {
          hoverDailyCircle
            .style('display', null)
            .attr('cx', cx)
            .attr('cy', yScale(d.dailyVolume));
        } else {
          hoverDailyCircle.style('display', 'none');
        }

        setHoveredPoint(d);
      });
  }, [seriesData, containerWidth, metricMode]);

  const displayedPoint =
    hoveredPoint ||
    (seriesData.length > 0 ? seriesData[seriesData.length - 1] : null);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
      {/* Top Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CANLI D3.JS ANALİTİK · SON 30 GÜN
            </span>
            <span className="text-xs font-mono text-slate-500">
              POST /api/v1/integrations/order-commission
            </span>
            {lastUpdatedAt && (
              <span className="text-[11px] font-mono text-slate-400">
                Son Senkron: {lastUpdatedAt.toLocaleTimeString('tr-TR')}
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Toplam Paket Satış Hacmi — Son 30 Günlük Yetkili Bayi Trend Grafiği
            </span>
          </h3>
          <p className="text-xs text-slate-600">
            Yetkili bayilerin son 30 gündeki günlük ve kümülatif paket satış hacmi ($), dağıtılan seans kredileri ve komisyon akışı gerçek zamanlı olarak D3.js ile görselleştirilir.
          </p>
        </div>

        {/* Scope & Live Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {sortedMembers.length > 0 && onSelectMember && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={activeDealer?.user_id || ''}
                onChange={(e) => onSelectMember(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {sortedMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    Bayi #{m.global_line_id}: {m.full_name} (Kariyer Seviyesi {m.career_level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {onToggleLivePolling && (
            <button
              type="button"
              onClick={onToggleLivePolling}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isLivePolling
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isLivePolling ? 'Canlı Akış: Açık' : 'Canlı Akış: Duraklatıldı'}</span>
            </button>
          )}

          {onRefreshLiveState && (
            <button
              type="button"
              onClick={onRefreshLiveState}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Veriyi Yenile</span>
            </button>
          )}

          {activeDealer && onQuickTriggerOrder && (
            <button
              type="button"
              onClick={() => onQuickTriggerOrder(activeDealer, 5000)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+$101 Canlı Satış Tetikle</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar: Authorized Dealer Scope & Metric Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setScopeMode('GLOBAL_AUTHORIZED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              scopeMode === 'GLOBAL_AUTHORIZED'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tüm Yetkili Bayiler (Küresel Hat)
          </button>
          <button
            type="button"
            onClick={() => setScopeMode('DEALER_NETWORK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              scopeMode === 'DEALER_NETWORK'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Seçili Bayi &amp; 7 Derinlik Ağı ({activeDealer?.full_name || 'Bayi'})
          </button>
          <button
            type="button"
            onClick={() => setScopeMode('DEALER_PERSONAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              scopeMode === 'DEALER_PERSONAL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sadece Kişisel Satış Hacmi
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setMetricMode('BOTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              metricMode === 'BOTH'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kümülatif + Günlük Trend
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('CUMULATIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              metricMode === 'CUMULATIVE'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kümülatif Satış Hacmi ($)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('DAILY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              metricMode === 'DAILY'
                ? 'bg-white text-indigo-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Günlük Satış Hacmi ($)
          </button>
        </div>
      </div>

      {/* 4 KPI Strip for 30-Day Authorized Dealer Sales Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            Toplam Paket Satış Hacmi (Son 30 Gün)
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatUsd(stats30d.total30dVolume, 2)}
          </div>
          <div className="text-[11px] font-mono text-emerald-700">
            Kümülatif Toplam: {formatUsd(stats30d.latestCumulative)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            Bugünkü Canlı Paket Satış Hacmi
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-700">
            {formatUsd(stats30d.todayVolume, 2)}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Bugün: {stats30d.todayOrders} Onaylı Sipariş
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            30 Günlük İşlem &amp; Seans Kredisi
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {stats30d.total30dOrders}{' '}
            <span className="text-xs font-normal text-slate-500">Paket Siparişi</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            +{stats30d.total30dCredits.toLocaleString('tr-TR')} Seans Kredisi Yüklendi
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            En Yüksek Günlük Zirve &amp; İvme
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {formatUsd(stats30d.peakDay.dailyVolume, 2)}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Zirve Günü: {stats30d.peakDay.label} · 7G İvme: %
            {stats30d.growthPct >= 0 ? `+${stats30d.growthPct.toFixed(0)}` : stats30d.growthPct.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Main D3 SVG Canvas + Interactive Hover Readout Banner */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
        {/* Live Crosshair Readout Bar */}
        {displayedPoint && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{displayedPoint.fullDateLabel}</span>
              {hoveredPoint ? (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                  Seçili Gün Detayı
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px]">
                  Güncel Durum (Bugün)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span className="text-slate-500">Kümülatif Hacim:</span>
                <strong className="text-slate-900">
                  {formatUsd(displayedPoint.cumulativeVolume, 2)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span className="text-slate-500">Günlük Satış:</span>
                <strong className="text-indigo-700">
                  {formatUsd(displayedPoint.dailyVolume, 2)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">İşlem:</span>
                <strong className="text-slate-800">{displayedPoint.orderCount} Adet</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Dağıtılan Prim:</span>
                <strong className="text-emerald-700">
                  +{formatUsd(displayedPoint.dealerCommissionsEarned, 2)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Responsive D3 SVG Container */}
        <div ref={containerRef} className="w-full overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-[310px] select-none overflow-visible"
            role="img"
            aria-label="Son 30 Günlük Toplam Paket Satış Hacmi D3.js Çizgi Grafiği"
          />
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-200/70">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              30 Günlük Kümülatif Paket Satış Hacmi ($)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-3 h-0.5 bg-indigo-600 inline-block border-b border-dashed border-indigo-600" />
              Günlük Paket Satış Hacmi ($)
            </span>
          </div>
          <span className="font-mono">
            Grafik üzerinde fareyi gezdirerek günlük işlem ve komisyon kırılımını inceleyebilirsiniz.
          </span>
        </div>
      </div>
    </section>
  );
};
