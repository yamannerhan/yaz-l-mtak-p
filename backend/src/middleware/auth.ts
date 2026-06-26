import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  deviceId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    if ('type' in payload && payload.type === 'device') {
      return res.status(401).json({ error: 'Kullanıcı token gerekli' });
    }
    req.user = payload as JwtPayload;
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    }
    next();
  });
}

export function requireDevice(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Cihaz token gerekli' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    if (!('type' in payload) || payload.type !== 'device') {
      return res.status(401).json({ error: 'Geçersiz cihaz token' });
    }
    req.deviceId = payload.deviceId;
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}
