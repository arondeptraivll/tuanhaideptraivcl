import { createClient } from '@supabase/supabase-js'

const VIETNAM_IP_RANGES = [
  ['1.52.0.0', '1.55.255.255'],
  ['14.160.0.0', '14.191.255.255'],
  ['27.64.0.0', '27.79.255.255'],
  ['42.112.0.0', '42.119.255.255'],
  ['45.117.76.0', '45.117.79.255'],
  ['45.119.80.0', '45.119.83.255'],
  ['45.121.24.0', '45.121.27.255'],
  ['45.122.220.0', '45.122.223.255'],
  ['45.124.84.0', '45.124.95.255'],
  ['45.125.200.0', '45.125.207.255'],
  ['49.236.208.0', '49.236.223.255'],
  ['49.246.128.0', '49.246.191.255'],
  ['58.186.0.0', '58.187.255.255'],
  ['61.14.232.0', '61.14.239.255'],
  ['101.53.0.0', '101.53.255.255'],
  ['101.96.12.0', '101.96.15.255'],
  ['101.96.64.0', '101.96.95.255'],
  ['101.99.0.0', '101.99.63.255'],
  ['103.1.200.0', '103.1.239.255'],
  ['103.9.196.0', '103.9.203.255'],
  ['103.35.64.0', '103.35.67.255'],
  ['103.37.28.0', '103.37.31.255'],
  ['103.53.88.0', '103.53.91.255'],
  ['103.56.156.0', '103.56.159.255'],
  ['103.63.104.0', '103.63.111.255'],
  ['103.68.240.0', '103.68.255.255'],
  ['103.74.100.0', '103.74.119.255'],
  ['103.75.176.0', '103.75.191.255'],
  ['103.89.88.0', '103.89.91.255'],
  ['103.90.220.0', '103.90.227.255'],
  ['103.92.24.0', '103.92.31.255'],
  ['103.98.160.0', '103.98.163.255'],
  ['103.107.180.0', '103.107.183.255'],
  ['103.114.104.0', '103.114.107.255'],
  ['103.130.212.0', '103.130.215.255'],
  ['103.139.80.0', '103.139.87.255'],
  ['103.141.140.0', '103.141.143.255'],
  ['103.151.120.0', '103.151.127.255'],
  ['103.153.248.0', '103.153.255.255'],
  ['103.155.160.0', '103.155.167.255'],
  ['103.157.144.0', '103.157.151.255'],
  ['103.160.0.0', '103.160.7.255'],
  ['103.161.16.0', '103.161.19.255'],
  ['103.162.16.0', '103.162.23.255'],
  ['103.163.212.0', '103.163.215.255'],
  ['103.166.180.0', '103.166.183.255'],
  ['103.167.84.0', '103.167.87.255'],
  ['103.168.72.0', '103.168.75.255'],
  ['103.169.32.0', '103.169.39.255'],
  ['103.170.20.0', '103.170.23.255'],
  ['103.172.76.0', '103.172.79.255'],
  ['103.173.152.0', '103.173.159.255'],
  ['103.176.104.0', '103.176.111.255'],
  ['103.178.232.0', '103.178.235.255'],
  ['103.179.188.0', '103.179.191.255'],
  ['103.180.112.0', '103.180.119.255'],
  ['103.181.12.0', '103.181.15.255'],
  ['103.184.108.0', '103.184.111.255'],
  ['103.186.62.0', '103.186.63.255'],
  ['103.187.4.0', '103.187.7.255'],
  ['103.188.80.0', '103.188.87.255'],
  ['103.192.232.0', '103.192.239.255'],
  ['103.194.188.0', '103.194.191.255'],
  ['103.195.236.0', '103.195.239.255'],
  ['103.196.244.0', '103.196.247.255'],
  ['103.199.4.0', '103.199.19.255'],
  ['103.200.20.0', '103.200.31.255'],
  ['103.204.168.0', '103.204.175.255'],
  ['103.205.96.0', '103.205.111.255'],
  ['103.206.208.0', '103.206.223.255'],
  ['103.207.32.0', '103.207.47.255'],
  ['103.216.112.0', '103.216.127.255'],
  ['103.220.80.0', '103.220.87.255'],
  ['103.221.212.0', '103.221.223.255'],
  ['103.226.248.0', '103.226.255.255'],
  ['103.227.112.0', '103.227.119.255'],
  ['103.228.20.0', '103.228.23.255'],
  ['103.229.40.0', '103.229.43.255'],
  ['103.232.48.0', '103.232.63.255'],
  ['103.233.48.0', '103.233.51.255'],
  ['103.234.88.0', '103.234.91.255'],
  ['103.237.60.0', '103.237.99.255'],
  ['103.238.68.0', '103.238.107.255'],
  ['103.239.28.0', '103.239.31.255'],
  ['103.241.248.0', '103.241.251.255'],
  ['103.243.216.0', '103.243.219.255'],
  ['103.245.244.0', '103.245.251.255'],
  ['103.248.160.0', '103.248.167.255'],
  ['103.249.100.0', '103.249.103.255'],
  ['103.252.0.0', '103.252.7.255'],
  ['103.253.88.0', '103.253.91.255'],
  ['103.254.12.0', '103.254.47.255'],
  ['103.255.84.0', '103.255.87.255'],
  ['111.65.240.0', '111.65.255.255'],
  ['112.72.0.0', '112.79.255.255'],
  ['112.137.128.0', '112.137.191.255'],
  ['112.197.0.0', '112.197.15.255'],
  ['112.213.80.0', '112.213.95.255'],
  ['113.20.96.0', '113.20.127.255'],
  ['113.22.0.0', '113.23.255.255'],
  ['113.52.32.0', '113.52.47.255'],
  ['113.61.108.0', '113.61.111.255'],
  ['113.160.0.0', '113.191.255.255'],
  ['115.72.0.0', '115.87.255.255'],
  ['115.146.120.0', '115.146.127.255'],
  ['116.96.0.0', '116.111.255.255'],
  ['116.118.0.0', '116.119.255.255'],
  ['116.193.64.0', '116.193.95.255'],
  ['117.0.0.0', '117.7.255.255'],
  ['117.103.200.0', '117.103.207.255'],
  ['117.122.120.0', '117.122.127.255'],
  ['118.68.0.0', '118.71.255.255'],
  ['118.107.64.0', '118.107.127.255'],
  ['119.15.160.0', '119.15.191.255'],
  ['119.17.192.0', '119.17.255.255'],
  ['119.82.128.0', '119.82.143.255'],
  ['120.72.80.0', '120.72.127.255'],
  ['120.138.64.0', '120.138.127.255'],
  ['122.129.0.0', '122.129.127.255'],
  ['123.16.0.0', '123.31.255.255'],
  ['123.136.96.0', '123.136.127.255'],
  ['124.157.96.0', '124.157.127.255'],
  ['124.158.0.0', '124.158.15.255'],
  ['125.58.0.0', '125.58.255.255'],
  ['125.212.128.0', '125.212.255.255'],
  ['125.214.0.0', '125.214.255.255'],
  ['125.234.0.0', '125.235.255.255'],
  ['125.253.112.0', '125.253.127.255'],
  ['171.224.0.0', '171.255.255.255'],
  ['175.103.24.0', '175.103.31.255'],
  ['180.93.0.0', '180.93.255.255'],
  ['180.148.128.0', '180.148.255.255'],
  ['182.161.80.0', '182.161.95.255'],
  ['183.80.0.0', '183.91.255.255'],
  ['202.9.76.0', '202.9.79.255'],
  ['202.37.80.0', '202.37.95.255'],
  ['202.43.108.0', '202.43.111.255'],
  ['202.44.136.0', '202.44.139.255'],
  ['202.47.142.0', '202.47.143.255'],
  ['202.52.39.0', '202.52.39.255'],
  ['202.55.132.0', '202.55.135.255'],
  ['202.56.56.0', '202.56.59.255'],
  ['202.58.244.0', '202.58.247.255'],
  ['202.59.252.0', '202.59.255.255'],
  ['202.60.104.0', '202.60.111.255'],
  ['202.74.56.0', '202.74.59.255'],
  ['202.78.224.0', '202.78.231.255'],
  ['202.79.232.0', '202.79.235.255'],
  ['202.87.212.0', '202.87.215.255'],
  ['202.92.4.0', '202.92.7.255'],
  ['202.94.80.0', '202.94.95.255'],
  ['202.124.204.0', '202.124.207.255'],
  ['202.130.16.0', '202.130.31.255'],
  ['202.134.16.0', '202.134.19.255'],
  ['202.134.54.0', '202.134.55.255'],
  ['202.143.108.0', '202.143.111.255'],
  ['202.149.204.0', '202.149.207.255'],
  ['202.151.160.0', '202.151.175.255'],
  ['202.158.244.0', '202.158.247.255'],
  ['202.160.124.0', '202.160.127.255'],
  ['202.168.12.0', '202.168.15.255'],
  ['202.172.4.0', '202.172.7.255'],
  ['202.191.56.0', '202.191.63.255'],
  ['203.8.172.0', '203.8.175.255'],
  ['203.9.156.0', '203.9.159.255'],
  ['203.34.144.0', '203.34.159.255'],
  ['203.41.48.0', '203.41.63.255'],
  ['203.77.176.0', '203.77.191.255'],
  ['203.79.28.0', '203.79.31.255'],
  ['203.80.128.0', '203.80.131.255'],
  ['203.89.136.0', '203.89.143.255'],
  ['203.99.248.0', '203.99.255.255'],
  ['203.113.128.0', '203.113.191.255'],
  ['203.119.8.0', '203.119.63.255'],
  ['203.119.72.0', '203.119.79.255'],
  ['203.128.240.0', '203.128.255.255'],
  ['203.160.0.0', '203.163.255.255'],
  ['203.167.8.0', '203.167.15.255'],
  ['203.170.26.0', '203.170.27.255'],
  ['203.171.16.0', '203.171.31.255'],
  ['203.176.160.0', '203.176.191.255'],
  ['203.189.24.0', '203.189.31.255'],
  ['203.190.160.0', '203.190.175.255'],
  ['203.191.8.0', '203.191.63.255'],
  ['203.192.32.0', '203.192.63.255'],
  ['203.195.0.0', '203.195.127.255'],
  ['203.196.24.0', '203.196.31.255'],
  ['203.201.56.0', '203.201.63.255'],
  ['203.205.0.0', '203.205.63.255'],
  ['203.209.176.0', '203.209.191.255'],
  ['203.210.128.0', '203.210.255.255'],
  ['210.2.64.0', '210.2.127.255'],
  ['210.4.64.0', '210.4.127.255'],
  ['210.86.224.0', '210.86.239.255'],
  ['210.211.96.0', '210.211.127.255'],
  ['210.245.0.0', '210.245.127.255'],
  ['218.100.10.0', '218.100.15.255'],
  ['220.231.64.0', '220.231.127.255'],
  ['221.121.0.0', '221.121.63.255'],
  ['221.132.0.0', '221.133.255.255'],
  ['222.252.0.0', '222.255.255.255']
];

const ADMIN_IPS = ['127.0.0.1'];
const LIMITS = { VN: 20, OTHER: 3 };
const BAN_DURATION = 30 * 60 * 1000;

const ipData = new Map();
const ipGeoCache = new Map();
const blockedIPs = new Set();
const tempBannedIPs = new Map();

const stats = {
  totalRequests: 0,
  totalBlocked: 0,
  totalTempBanned: 0,
  totalPermBanned: 0,
  startTime: Date.now()
};

function sanitizeIP(ip) {
  if (!ip || typeof ip !== 'string') return null;
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const cleaned = ip.trim();
  if (!ipv4Regex.test(cleaned)) return null;
  const parts = cleaned.split('.');
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) return null;
  }
  return cleaned;
}

function isPrivateIP(ip) {
  if (!ip) return false;
  const parts = ip.split('.').map(Number);
  const [a, b, c, d] = parts;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 127) ||
    (a === 169 && b === 254)
  );
}

function getClientIP(request) {
  try {
    const vercelIP = request.headers.get('x-vercel-forwarded-for');
    if (vercelIP) {
      const cleanIP = sanitizeIP(vercelIP.split(',')[0]);
      if (cleanIP && !isPrivateIP(cleanIP)) return cleanIP;
    }
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) {
      const cleanIP = sanitizeIP(cfIP);
      if (cleanIP && !isPrivateIP(cleanIP)) return cleanIP;
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      const cleanIP = sanitizeIP(realIP);
      if (cleanIP && !isPrivateIP(cleanIP)) return cleanIP;
    }
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const firstIP = sanitizeIP(forwarded.split(',')[0]);
      if (firstIP && !isPrivateIP(firstIP)) return firstIP;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function ipToNumber(ip) {
  if (!ip) return 0;
  try {
    return ip.split('.').reduce((acc, octet) => {
      const num = parseInt(octet, 10);
      return (acc << 8) | num;
    }, 0) >>> 0;
  } catch {
    return 0;
  }
}

function isVietnamIP(ip) {
  if (!ip) return false;
  const ipNum = ipToNumber(ip);
  if (ipNum === 0) return false;
  for (const [start, end] of VIETNAM_IP_RANGES) {
    const startNum = ipToNumber(start);
    const endNum = ipToNumber(end);
    if (ipNum >= startNum && ipNum <= endNum) {
      return true;
    }
  }
  return false;
}

function isVietnamIPCached(ip) {
  const cached = ipGeoCache.get(ip);
  const now = Date.now();
  if (cached && (now - cached.cachedAt) < 3600000) {
    return cached.isVN;
  }
  const isVN = isVietnamIP(ip);
  ipGeoCache.set(ip, { isVN, cachedAt: now });
  if (ipGeoCache.size > 10000) {
    const oldestEntries = Array.from(ipGeoCache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
      .slice(0, 2000);
    oldestEntries.forEach(([ip]) => ipGeoCache.delete(ip));
  }
  return isVN;
}

function logAction(action, ip, details = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${action}: ${ip} ${details}`);
}

function addTempBan(ip, reason, isVN) {
  const now = Date.now();
  const unbanTime = now + BAN_DURATION;
  tempBannedIPs.set(ip, { unbanTime, reason, bannedAt: now, isVN });
  stats.totalTempBanned++;
  logAction('TEMP_BAN', ip, `| Reason: ${reason} | Duration: 30min | Type: ${isVN ? 'VN' : 'FOREIGN'}`);
}

function checkTempBan(ip) {
  const banInfo = tempBannedIPs.get(ip);
  if (!banInfo) return null;
  const now = Date.now();
  if (now >= banInfo.unbanTime) {
    tempBannedIPs.delete(ip);
    logAction('UNBAN', ip, '| Reason: Temp ban expired');
    return null;
  }
  return { ...banInfo, remainingTime: banInfo.unbanTime - now };
}

function checkRateLimit(ip, isVN) {
  const now = Date.now();
  const limit = isVN ? LIMITS.VN : LIMITS.OTHER;
  const windowMs = 60000;
  
  let data = ipData.get(ip);
  if (!data || (now - data.window) > windowMs) {
    data = { count: 1, window: now, lastSeen: now };
    ipData.set(ip, data);
    return { allowed: true, count: 1, limit };
  }
  
  data.count++;
  data.lastSeen = now;
  
  if (data.count > limit) {
    addTempBan(ip, `Rate limit exceeded (${data.count}/${limit})`, isVN);
    ipData.delete(ip);
    return { allowed: false, reason: 'RATE_LIMIT_EXCEEDED', count: data.count, limit };
  }
  
  return { allowed: true, count: data.count, limit };
}

function createBlockedResponse(statusCode, reason) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Denied</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            background: white;
            padding: 3rem 2rem;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .icon { font-size: 4rem; margin-bottom: 1rem; color: #e74c3c; }
        .title { font-size: 2rem; color: #2c3e50; margin-bottom: 1rem; font-weight: 700; }
        .code { 
            display: inline-block;
            background: #e74c3c;
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
        }
        .reason { font-size: 1.1rem; color: #555; margin-bottom: 2rem; line-height: 1.4; }
        .footer { color: #777; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🚫</div>
        <h1 class="title">Access Denied</h1>
        <div class="code">ERROR ${statusCode}</div>
        <div class="reason">${reason}</div>
        <div class="footer">
            <p>If you believe this is an error, please contact support.</p>
            <p>${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

function createStatsResponse() {
  const uptime = Date.now() - stats.startTime;
  const uptimeHours = (uptime / 3600000).toFixed(2);
  
  const activeTempBans = Array.from(tempBannedIPs.entries()).map(([ip, info]) => ({
    ip,
    reason: info.reason,
    bannedAt: new Date(info.bannedAt).toISOString(),
    unbanAt: new Date(info.unbanTime).toISOString(),
    remainingMinutes: Math.ceil((info.unbanTime - Date.now()) / 60000),
    type: info.isVN ? 'VN' : 'FOREIGN'
  }));
  
  return new Response(JSON.stringify({
    stats: {
      totalRequests: stats.totalRequests,
      totalBlocked: stats.totalBlocked,
      totalTempBanned: stats.totalTempBanned,
      totalPermBanned: stats.totalPermBanned,
      uptime: `${uptimeHours}h`
    },
    limits: {
      vietnam: `${LIMITS.VN}/min`,
      other: `${LIMITS.OTHER}/min`,
      banDuration: '30 minutes'
    },
    memory: {
      activeIPs: ipData.size,
      blacklistedIPs: blockedIPs.size,
      tempBannedIPs: tempBannedIPs.size,
      geoCache: ipGeoCache.size
    },
    activeTempBans,
    recentBlocked: Array.from(blockedIPs).slice(-10)
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function cleanupMemory() {
  const now = Date.now();
  const fiveMinutesAgo = now - 300000;
  let cleaned = 0;
  let tempBansExpired = 0;
  
  for (const [ip, data] of ipData.entries()) {
    if (data.lastSeen < fiveMinutesAgo) {
      ipData.delete(ip);
      cleaned++;
    }
  }
  
  for (const [ip, banInfo] of tempBannedIPs.entries()) {
    if (now >= banInfo.unbanTime) {
      tempBannedIPs.delete(ip);
      tempBansExpired++;
      logAction('UNBAN', ip, '| Reason: Temp ban expired during cleanup');
    }
  }
  
  if (ipGeoCache.size > 15000) {
    const oldEntries = Array.from(ipGeoCache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
      .slice(0, 7500);
    oldEntries.forEach(([ip]) => ipGeoCache.delete(ip));
  }
  
  logAction('CLEANUP', 'SYSTEM', `| IPs removed: ${cleaned} | Temp bans expired: ${tempBansExpired} | Active: ${ipData.size} | Blocked: ${blockedIPs.size} | Temp banned: ${tempBannedIPs.size}`);
}

setInterval(cleanupMemory, 300000);

export default async function middleware(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path === '/api/ddos-stats') {
      const ip = getClientIP(request);
      if (ADMIN_IPS.includes(ip) || !ip) {
        return createStatsResponse();
      }
      return new Response('Unauthorized', { status: 403 });
    }
    
    if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map|txt|xml)$/)) {
      return;
    }
    
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    stats.totalRequests++;
    
    if (!ip) {
      stats.totalBlocked++;
      logAction('BLOCK', 'NO_IP', '| Reason: No IP detected');
      return createBlockedResponse(403, 'No IP address detected');
    }
    
    if (ADMIN_IPS.includes(ip)) {
      logAction('ADMIN_ACCESS', ip, `| Path: ${path}`);
      return;
    }
    
    const isVN = isVietnamIPCached(ip);
    
    if (!isVN) {
      stats.totalBlocked++;
      const country = request.headers.get('cf-ipcountry') || 'Unknown';
      logAction('BLOCK', ip, `| Reason: Non-VN access | Country: ${country} | Path: ${path}`);
      return createBlockedResponse(403, 'Access restricted to Vietnam only');
    }
    
    const tempBan = checkTempBan(ip);
    if (tempBan) {
      stats.totalBlocked++;
      const remainingMin = Math.ceil(tempBan.remainingTime / 60000);
      logAction('BLOCK', ip, `| Reason: Temp banned | Remaining: ${remainingMin}min | Path: ${path}`);
      return createBlockedResponse(429, 'Too many requests - temporarily banned');
    }
    
    if (blockedIPs.has(ip)) {
      stats.totalBlocked++;
      logAction('BLOCK', ip, `| Reason: Permanently banned | Path: ${path}`);
      return createBlockedResponse(403, 'IP address permanently blocked');
    }
    
    const rateLimitResult = checkRateLimit(ip, isVN);
    
    if (!rateLimitResult.allowed) {
      stats.totalBlocked++;
      logAction('RATE_LIMIT', ip, `| Requests: ${rateLimitResult.count}/${rateLimitResult.limit} | Path: ${path} | UA: ${userAgent.substring(0, 50)}`);
      return createBlockedResponse(429, 'Rate limit exceeded');
    }
    
    if (Math.random() < 0.01) {
      logAction('ALLOW', ip, `| Requests: ${rateLimitResult.count}/${rateLimitResult.limit} | Path: ${path}`);
    }
    
  } catch (error) {
    stats.totalBlocked++;
    logAction('ERROR', 'SYSTEM', `| Error: ${error.message}`);
    return createBlockedResponse(503, 'Service temporarily unavailable');
  }
}

export const config = {
  runtime: 'edge',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
