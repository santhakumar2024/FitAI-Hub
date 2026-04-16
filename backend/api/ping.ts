import { VercelRequest, VercelResponse } from '@vercel/node';

export default function (req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'pong', timestamp: new Date().toISOString() });
}
