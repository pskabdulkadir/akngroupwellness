import type { Request, Response } from 'express';
import { serverAppPromise } from '../server';

export default async function handler(req: Request, res: Response) {
  try {
    const app = await serverAppPromise;
    app(req, res);
  } catch (error) {
    console.error('[Vercel Function] API başlatılamadı:', error);
    res.status(503).json({ status: 'error', message: 'API geçici olarak kullanılamıyor.' });
  }
}
