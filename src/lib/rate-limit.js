// src/lib/rate-limit.js
const rateMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateMap.entries()) {
    if (now > record.resetAt + 60000) rateMap.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateMap.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + windowMs; }
  record.count++;
  rateMap.set(key, record);
  if (record.count > maxRequests) {
    return { limited: true, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  return { limited: false };
}
