export function getClientIPv4(req: any): string {
  const xf = (req.headers?.['x-forwarded-for'] as string) || '';
  let ip = (xf.split(',')[0] || '').trim() || req.socket?.remoteAddress || '';

  if (!ip) return '127.0.0.1';
  ip = ip.replace('::ffff:', '');
  if (ip === '::1') return '127.0.0.1';

  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
  return isIPv4 ? ip : '127.0.0.1';
}
