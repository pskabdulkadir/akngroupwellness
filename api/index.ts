import type { Request, Response } from 'express';
import { serverAppPromise } from '../server.ts';

export default async function handler(req: Request, res: Response) {
  try {
    const requestUrl = new URL(req.url || '/', 'https://vercel.internal');
    const apiPath = requestUrl.searchParams.get('__api_path');
    if (apiPath) {
      requestUrl.searchParams.delete('__api_path');
      req.url = `/api/${apiPath.replace(/^\/+/, '')}${requestUrl.search}`;
    }

    const app = await serverAppPromise;
    app(req, res);
  } catch (error) {
    console.error('[Vercel Function] API başlatılamadı:', error);
    res.status(503).json({ status: 'error', message: 'API geçici olarak kullanılamıyor.' });
  }
}
