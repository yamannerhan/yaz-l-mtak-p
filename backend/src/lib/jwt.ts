import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'parent' | 'admin';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function signDeviceToken(deviceId: string): string {
  return jwt.sign({ deviceId, type: 'device' }, JWT_SECRET, { expiresIn: '365d' });
}

export function verifyToken(token: string): JwtPayload | { deviceId: string; type: string } {
  return jwt.verify(token, JWT_SECRET) as JwtPayload | { deviceId: string; type: string };
}

export function generateDeviceToken(): string {
  return `dt_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}
