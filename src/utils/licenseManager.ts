import { UserMember } from './authManager';

import { ADMIN_PHONE } from './authManager';

export { ADMIN_PHONE };
export const ADMIN_NAME = 'Psikolog Abdülkadir Kan';

export interface DeviceLicense {
  deviceId: string;
  isApproved: boolean;
  licenseKey?: string;
  type: 'trial' | 'active' | 'expired' | 'master_admin';
  expiresAt?: number | null; // Timestamp
  userEmail?: string;
  userName?: string;
  createdAt: number;
}

export interface LicenseAccessCheck {
  isAllowed: boolean;
  isExpired: boolean;
  daysRemaining: number;
  message: string;
}

export interface LicenseStatus {
  isValid: boolean;
  type: 'trial' | 'active' | 'expired' | 'master_admin';
  daysRemaining: number;
  message: string;
}

export function checkLicenseAccess(license: DeviceLicense | null): LicenseAccessCheck {
  if (!license) {
    return {
      isAllowed: false,
      isExpired: false,
      daysRemaining: 0,
      message: 'Cihaz lisansı henüz onaylanmadı.'
    };
  }

  if (license.type === 'master_admin') {
    return {
      isAllowed: true,
      isExpired: false,
      daysRemaining: 9999,
      message: 'Master Lisans Aktif'
    };
  }

  if (license.isApproved) {
    if (license.expiresAt && license.expiresAt < Date.now()) {
      return {
        isAllowed: false,
        isExpired: true,
        daysRemaining: 0,
        message: 'Lisans süresi doldu.'
      };
    }
    const days = license.expiresAt ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : 365;
    return {
      isAllowed: true,
      isExpired: false,
      daysRemaining: days,
      message: `Lisans Aktif (${days} gün kaldı)`
    };
  }

  return {
    isAllowed: false,
    isExpired: false,
    daysRemaining: 0,
    message: 'Lisans onayı bekleniyor.'
  };
}

export function getWhatsAppContactUrl(deviceId: string, userName?: string): string {
  const text = encodeURIComponent(
    `Merhaba ${ADMIN_NAME},\nAuraBio Quantum Bio-Resonance lisans onayı ve aktivasyonu talep ediyorum.\n\nCihaz Kimliği: ${deviceId}\nİsim: ${userName || 'Kullanıcı'}`
  );
  const cleanPhone = ADMIN_PHONE.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

export async function activateDeviceViaKey(deviceId: string, key: string): Promise<{ success: boolean; message: string }> {
  const trimmed = key.trim().toUpperCase();
  // Support master keys or standard license format
  if (trimmed === 'AURA-MASTER-2026' || trimmed === 'AURABIO-VIP-2026' || trimmed.startsWith('AURA-')) {
    const stored = localStorage.getItem('aurabio_device_license');
    const existing = stored ? JSON.parse(stored) : {};
    const updated: DeviceLicense = {
      ...existing,
      deviceId,
      isApproved: true,
      licenseKey: trimmed,
      type: trimmed.includes('MASTER') ? 'master_admin' : 'active',
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      createdAt: existing.createdAt || Date.now()
    };
    localStorage.setItem('aurabio_device_license', JSON.stringify(updated));
    return {
      success: true,
      message: 'Lisansınız başarıyla aktifleştirildi! Biyo-rezonans alanı açıldı.'
    };
  }

  return {
    success: false,
    message: 'Geçersiz lisans anahtarı. Lütfen yöneticinizle iletişime geçiniz.'
  };
}

export function verifyUserLicense(user: UserMember | null): LicenseStatus {
  if (!user) {
    return {
      isValid: false,
      type: 'expired',
      daysRemaining: 0,
      message: 'Lütfen sisteme giriş yapınız.'
    };
  }

  if (user.role === 'admin' || user.email === 'psikologabdulkadirkan@gmail.com' || user.email === 'admin@aurabio.com') {
    return {
      isValid: true,
      type: 'master_admin',
      daysRemaining: 9999,
      message: 'Sistem Master Lisansı Aktif'
    };
  }

  if (user.isApproved) {
    return {
      isValid: true,
      type: 'active',
      daysRemaining: 365,
      message: 'Lisans Onaylı ve Aktif'
    };
  }

  return {
    isValid: false,
    type: 'trial',
    daysRemaining: 0,
    message: 'Lisans onayınız yönetici tarafından bekleniyor.'
  };
}
