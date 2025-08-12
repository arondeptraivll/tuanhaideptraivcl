
const VIETNAM_IP_RANGES = [
  ['1.52.0.0', '1.55.255.255'],
  ['14.160.0.0', '14.191.255.255'],
  ['27.64.0.0', '27.79.255.255'],
  ['14.224.0.0', '14.255.255.255'],
  ['27.3.0.0', '27.3.255.255'],
  ['14.0.16.0', '14.0.31.255'],
['27.2.0.0', '27.2.255.255'],        // Mở rộng dải 27.3.x.x hiện có
['27.118.16.0', '27.118.31.255'],
['42.1.64.0', '42.1.127.255'],
['42.96.16.0', '42.96.31.255'],
['42.96.32.0', '42.96.63.255'],
['49.213.64.0', '49.213.127.255'],
['49.246.192.0', '49.246.223.255'],
['61.11.224.0', '61.11.255.255'],
['61.28.224.0', '61.28.255.255'],
['101.53.64.0', '101.53.255.255'],   // Mở rộng dải 101.53.x.x hiện có
['101.96.12.0', '101.96.63.255'],    // Mở rộng dải hiện có
['101.96.128.0', '101.96.255.255'],  // Tiếp tục mở rộng
['112.72.64.0', '112.72.127.255'],   // Bổ sung cho dải 112.72-79
['112.78.0.0', '112.78.15.255'],
['112.137.144.0', '112.137.191.255'], // Mở rộng dải hiện có
['112.197.16.0', '112.197.255.255'], // Mở rộng dải hiện có
['113.23.0.0', '113.23.255.255'],    // Bổ sung cho dải 113.22-23
['115.80.0.0', '115.87.255.255'],    // Mở rộng dải 115.72-87
['116.118.128.0', '116.119.255.255'], // Mở rộng dải hiện có
['116.212.32.0', '116.212.63.255'],
['117.103.192.0', '117.103.199.255'], // Mở rộng dải hiện có
['117.122.0.0', '117.122.119.255'],   // Mở rộng dải hiện có
['118.27.192.0', '118.27.223.255'],
['119.18.128.0', '119.18.143.255'],
['120.72.96.0', '120.72.127.255'],    // Mở rộng dải hiện có
['120.138.80.0', '120.138.127.255'],  // Mở rộng dải hiện có
['124.157.64.0', '124.157.95.255'],   // Mở rộng dải hiện có
['124.157.128.0', '124.157.255.255'], // Tiếp tục mở rộng
['125.58.64.0', '125.58.255.255'],    // Mở rộng dải hiện có
['150.95.112.0', '150.95.127.255'],
['175.103.64.0', '175.103.127.255'],  // Mở rộng dải hiện có
['180.148.144.0', '180.148.255.255'], // Mở rộng dải hiện có
['183.81.0.0', '183.81.127.255'],     // Bổ sung cho dải 183.80-91
['183.91.32.0', '183.91.159.255'],    // Mở rộng dải hiện có
['183.91.192.0', '183.91.255.255'],   // Tiếp tục mở rộng
['203.113.160.0', '203.113.191.255'], // Mở rộng dải hiện có
['203.162.16.0', '203.162.255.255'],  // Dải lớn 203.162.x.x
['203.163.128.0', '203.163.255.255'], // Mở rộng dải hiện có
['210.2.128.0', '210.2.255.255'],     // Mở rộng dải hiện có
['210.245.32.0', '210.245.127.255'],  // Mở rộng dải hiện có
['221.133.0.0', '221.133.31.255'],
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

const SUSPICIOUS_UAS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto', 'curl', 'wget', 
  'python', 'go-http', 'masscan', 'nmap', 'sqlmap', 'fuzz', 'attack', 'exploit', 
  'penetration', 'test', 'probe', 'automation', 'headless', 'phantom', 'selenium',
  'puppeteer', 'playwright', 'requests', 'urllib', 'httpx', 'aiohttp', 'scrapy'
];

const SUSPICIOUS_PATHS = [
  '/admin', '/wp-admin', '/phpmyadmin', '/.env', '/config', '/api/v1', 
  '/wp-content', '/wp-includes', '/.git', '/backup', '/database', '/shell',
  '/phpinfo', '/info.php', '/test.php', '/debug', '/console', '/manager',
  '/xmlrpc.php', '/wp-login.php', '/administrator', '/cpanel', '/cgi-bin'
];

// DDoS pattern chỉ còn kiểm tra user-agent và headers, KHÔNG dùng path
const DDOS_CHECKS = {
  scriptTag: (str) => {
    const lower = str.toLowerCase();
    return lower.includes('<script') || lower.includes('</script');
  },
  sqlInjection: (str) => {
    const lower = str.toLowerCase();
    const sqlPatterns = [
      'union select', 'union all select', 'drop table', 'drop database',
      'insert into', 'delete from', 'update set', 'exec xp_', 'exec sp_'
    ];
    return sqlPatterns.some(pattern => lower.includes(pattern));
  },
  xssPatterns: (str) => {
    const lower = str.toLowerCase();
    const xssPatterns = [
      'javascript:', 'vbscript:', 'onload=', 'onerror=', 'onclick=',
      'onmouseover=', 'onfocus=', 'onblur=', '<iframe', '<object',
      '<embed', '<img src=', '<svg', '<body onload'
    ];
    return xssPatterns.some(pattern => lower.includes(pattern));
  },
  codeInjection: (str) => {
    const lower = str.toLowerCase();
    return lower.includes('eval(') || lower.includes('exec(') || 
           lower.includes('system(') || lower.includes('require(') ||
           lower.includes('import(') || lower.includes('include(');
  },
  commandInjection: (str) => {
    const dangerous = ['|', '&', ';', '$', '`', '||', '&&'];
    return dangerous.some(char => str.includes(char));
  },
  specialChars: (str) => {
    const count = (str.match(/[<>"'&]/g) || []).length;
    return count > 5;
  }
};

const ADMIN_IPS = ['123'];

const ipCache = new Map();
const burstCache = new Map();
const patternCache = new Map();
const fingerprints = new Map();
const suspiciousCache = new Map();
const bannedIPs = new Map();
const goodIPs = new Set();

const stats = { 
  requests: 0, 
  blocked: 0, 
  suspicious: 0,
  ddosBlocked: 0,
  burstBlocked: 0,
  patternBlocked: 0,
  vnBlocked: 0,
  foreignBlocked: 0,
  startTime: Date.now()
};

const BAN_DURATION = 15 * 60 * 1000;
const BURST_WINDOW = 10000;
const BURST_THRESHOLD = 50;
const PATTERN_THRESHOLD = 3;

function getIP(request) {
  const headers = [
    'x-vercel-forwarded-for',
    'cf-connecting-ip', 
    'x-real-ip',
    'x-forwarded-for'
  ];
  for (const h of headers) {
    const value = request.headers.get(h);
    if (value) {
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) return ip;
    }
  }
  return null;
}

function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function isVN(ip) {
  if (isPrivateIP(ip)) return false;
  const num = ip.split('.').reduce((a, b) => (a << 8) | parseInt(b), 0) >>> 0;
  return VIETNAM_IP_RANGES.some(([s, e]) => {
    const start = s.split('.').reduce((a, b) => (a << 8) | parseInt(b), 0) >>> 0;
    const end = e.split('.').reduce((a, b) => (a << 8) | parseInt(b), 0) >>> 0;
    return num >= start && num <= end;
  });
}

function createFingerprint(request, ip) {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLang = request.headers.get('accept-language') || '';
  const acceptEnc = request.headers.get('accept-encoding') || '';
  const connection = request.headers.get('connection') || '';
  return btoa(`${ip}:${userAgent.substring(0, 50)}:${acceptLang}:${acceptEnc}:${connection}`);
}

// DDoS patterns: chỉ dùng user-agent, KHÔNG kiểm tra path nữa!
function detectDDoSPatterns(ip, path, userAgent, headers) {
  const now = Date.now();
  let ddosScore = 0;
  const reasons = [];
  // Chỉ kiểm tra user-agent
  const checkString = userAgent;
  for (const [checkName, checkFunc] of Object.entries(DDOS_CHECKS)) {
    try {
      if (checkFunc(checkString)) {
        ddosScore += 5;
        reasons.push(checkName);
      }
    } catch (e) {}
  }
  // Kiểm tra kích thước userAgent
  if (userAgent.length > 1000) {
    ddosScore += 3;
    reasons.push('oversized_headers');
  }
  // Kiểm tra headers
  if (!headers.get('accept') || !headers.get('accept-language')) {
    ddosScore += 2;
    reasons.push('minimal_headers');
  }
  return { score: ddosScore, reasons };
}

function detectBurstTraffic(ip) {
  const now = Date.now();
  const burstKey = `${ip}_burst`;
  let bursts = burstCache.get(burstKey) || [];
  bursts = bursts.filter(timestamp => now - timestamp < BURST_WINDOW);
  bursts.push(now);
  burstCache.set(burstKey, bursts);
  if (bursts.length >= BURST_THRESHOLD) {
    return { burst: true, count: bursts.length };
  }
  return { burst: false, count: bursts.length };
}

function detectSuspiciousActivity(ip, userAgent, path, method) {
  let suspicionScore = 0;
  const reasons = [];
  const userAgentLower = userAgent.toLowerCase();
  const pathLower = path.toLowerCase();
  // Kiểm tra User-Agent đáng ngờ
  if (SUSPICIOUS_UAS.some(ua => userAgentLower.includes(ua))) {
    suspicionScore += 3;
    reasons.push('suspicious_ua');
  }
  // Kiểm tra path đáng ngờ
  if (SUSPICIOUS_PATHS.some(p => pathLower.includes(p))) {
    suspicionScore += 2;
    reasons.push('suspicious_path');
  }
  // Kiểm tra method bất thường
  if (!['GET', 'POST', 'HEAD', 'OPTIONS'].includes(method)) {
    suspicionScore += 2;
    reasons.push('unusual_method');
  }
  // Kiểm tra User-Agent
  if (!userAgent || userAgent.length < 10) {
    suspicionScore += 2;
    reasons.push('minimal_ua');
  }
  if (userAgent.length > 500) {
    suspicionScore += 1;
    reasons.push('oversized_ua');
  }
  // Kiểm tra path traversal
  if (path.includes('..') || path.includes('%2e%2e')) {
    suspicionScore += 4;
    reasons.push('path_traversal');
  }
  // Kiểm tra special chars
  const specialCount = (path.match(/[<>'"&]/g) || []).length;
  if (specialCount > 2) {
    suspicionScore += 2;
    reasons.push('special_chars');
  }
  // Cập nhật cache
  const existing = suspiciousCache.get(ip) || { score: 0, reasons: [], count: 0 };
  existing.score = Math.max(existing.score, suspicionScore);
  existing.reasons = [...new Set([...existing.reasons, ...reasons])];
  existing.count++;
  existing.lastSeen = Date.now();
  if (existing.score >= 4 || existing.count >= 10) {
    suspiciousCache.set(ip, existing);
    return { suspicious: true, score: existing.score, reasons: existing.reasons };
  }
  if (suspicionScore > 0) {
    suspiciousCache.set(ip, existing);
  }
  return { suspicious: false, score: suspicionScore, reasons };
}

function isIPBanned(ip) {
  const banInfo = bannedIPs.get(ip);
  if (!banInfo) return false;
  const now = Date.now();
  if (now - banInfo.timestamp > banInfo.duration) {
    bannedIPs.delete(ip);
    return false;
  }
  return {
    banned: true,
    timeLeft: banInfo.duration - (now - banInfo.timestamp),
    reason: banInfo.reason,
    level: banInfo.level
  };
}

function calculateBanDuration(violations, level = 1) {
  const baseDuration = BAN_DURATION;
  const multiplier = Math.min(level * 2, 8);
  return baseDuration * multiplier;
}

function banIP(ip, reason, violations = 1) {
  const existing = bannedIPs.get(ip);
  const level = existing ? existing.level + 1 : 1;
  const duration = calculateBanDuration(violations, level);
  bannedIPs.set(ip, {
    timestamp: Date.now(),
    reason,
    violations,
    level,
    duration
  });
  goodIPs.delete(ip);
  return { banned: true, level, duration };
}

function cleanExpiredEntries() {
  const now = Date.now();
  const expireTime = 300000;
  for (const [key, data] of ipCache) {
    if (Array.isArray(data)) {
      const filtered = data.filter(item => now - item.time < expireTime);
      if (filtered.length === 0) {
        ipCache.delete(key);
      } else {
        ipCache.set(key, filtered);
      }
    } else if (typeof data === 'object' && data.time && now - data.time > expireTime) {
      ipCache.delete(key);
    }
  }
  for (const [ip, banInfo] of bannedIPs) {
    if (now - banInfo.timestamp > banInfo.duration) {
      bannedIPs.delete(ip);
    }
  }
  for (const [key, data] of burstCache) {
    const filtered = data.filter(timestamp => now - timestamp < BURST_WINDOW);
    if (filtered.length === 0) {
      burstCache.delete(key);
    } else {
      burstCache.set(key, filtered);
    }
  }
  for (const [key, data] of patternCache) {
    const filtered = data.filter(item => now - item.time < 60000);
    if (filtered.length === 0) {
      patternCache.delete(key);
    } else {
      patternCache.set(key, filtered);
    }
  }
  for (const [key, data] of suspiciousCache) {
    if (now - data.lastSeen > 3600000) {
      suspiciousCache.delete(key);
    }
  }
}

function checkRateLimit(ip, suspicious = false, ddosScore = 0) {
  const now = Date.now();
  let baseLimit = 20;
  if (suspicious) baseLimit = Math.floor(baseLimit * 0.6);
  if (ddosScore >= 3) baseLimit = Math.floor(baseLimit * 0.3);
  const banStatus = isIPBanned(ip);
  if (banStatus.banned) {
    return { 
      allowed: false, 
      banned: true, 
      timeLeft: banStatus.timeLeft,
      reason: banStatus.reason,
      level: banStatus.level
    };
  }
  if (goodIPs.has(ip) && !suspicious && ddosScore === 0) {
    baseLimit = Math.floor(baseLimit * 1.5);
  }
  const window = Math.floor(now / 60000);
  const key = `${ip}_${window}`;
  const current = ipCache.get(key) || 0;
  ipCache.set(key, current + 1);
  const allowed = current + 1 <= baseLimit;
  if (!allowed) {
    const violations = current + 1 - baseLimit;
    if (violations >= baseLimit * 1.5) {
      const banResult = banIP(ip, 'rate_limit_exceeded', violations);
      return { 
        allowed: false, 
        banned: true, 
        violations,
        level: banResult.level,
        banDuration: banResult.duration
      };
    }
  } else if (current + 1 <= baseLimit * 0.5 && !suspicious && ddosScore === 0) {
    goodIPs.add(ip);
  }
  return { 
    allowed, 
    count: current + 1, 
    limit: baseLimit, 
    violations: allowed ? 0 : current + 1 - baseLimit 
  };
}

export default async function middleware(request) {
  try {
    stats.requests++;
    if (stats.requests % 500 === 0) {
      cleanExpiredEntries();
    }
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;
    const userAgent = request.headers.get('user-agent') || '';
    // Bỏ qua các file static
    const staticExts = ['ico', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'css', 'js', 
                       'woff', 'woff2', 'ttf', 'webp', 'map', 'txt', 'xml', 
                       'pdf', 'zip', 'rar', 'mp4', 'mp3', 'avi', 'mov'];
    const ext = pathname.split('.').pop().toLowerCase();
    if (staticExts.includes(ext)) {
      return;
    }
    // Admin stats endpoint
    if (pathname === '/api/admin/stats') {
      const ip = getIP(request);
      if (ADMIN_IPS.includes(ip) || !ip) {
        const banList = [];
        for (const [ip, info] of bannedIPs.entries()) {
          banList.push({
            ip: ip.substring(0, 8) + '***',
            timeLeft: Math.max(0, info.duration - (Date.now() - info.timestamp)),
            reason: info.reason,
            level: info.level
          });
          if (banList.length >= 50) break;
        }
        return new Response(JSON.stringify({
          stats,
          cacheStats: {
            ipCache: ipCache.size,
            burstCache: burstCache.size,
            patternCache: patternCache.size,
            suspiciousCache: suspiciousCache.size,
            bannedIPs: bannedIPs.size,
            goodIPs: goodIPs.size,
            fingerprints: fingerprints.size
          },
          banDetails: banList,
          uptime: Math.floor((Date.now() - stats.startTime) / 1000)
        }), { headers: { 'Content-Type': 'application/json' } });
      }
      return createAdvancedErrorPage(401);
    }
    // Lấy IP
    const ip = getIP(request);
    if (!ip || !isValidIP(ip)) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] INVALID_IP: ${ip || 'null'} - ${pathname}`);
      return createAdvancedErrorPage(400, 'Invalid or missing IP address in request.');
    }
    // Kiểm tra Admin IP
    if (ADMIN_IPS.includes(ip)) {
      console.log(`[${new Date().toISOString()}] ADMIN_ACCESS: ${ip} - ${method} ${pathname}`);
      return;
    }
    // Kiểm tra IP Việt Nam
    const vietnam = isVN(ip);
    if (!vietnam) {
      stats.blocked++;
      stats.foreignBlocked++;
      console.log(`[${new Date().toISOString()}] GEO_BLOCK: ${ip} - ${pathname}`);
      return createAdvancedErrorPage(403, 'This service is currently only available to users located in Vietnam.');
    }
    // Tạo fingerprint
    const fingerprint = createFingerprint(request, ip);
    fingerprints.set(ip, fingerprint);
    // Kiểm tra burst traffic
    const burstResult = detectBurstTraffic(ip);
    if (burstResult.burst) {
      stats.blocked++;
      stats.burstBlocked++;
      const banResult = banIP(ip, 'burst_traffic', burstResult.count);
      console.log(`[${new Date().toISOString()}] BURST_BLOCK: ${ip} - Count: ${burstResult.count} - Level: ${banResult.level} - ${pathname}`);
      return createAdvancedErrorPage(429, `Burst traffic detected. ${burstResult.count} requests in ${BURST_WINDOW/1000} seconds.`, banResult.duration, banResult.level);
    }
    
    // Kiểm tra hoạt động đáng ngờ
    const suspiciousActivity = detectSuspiciousActivity(ip, userAgent, pathname, method);
    if (suspiciousActivity.suspicious) {
      stats.suspicious++;
      console.log(`[${new Date().toISOString()}] SUSPICIOUS: ${ip} - Score: ${suspiciousActivity.score} - Reasons: ${suspiciousActivity.reasons.join(',')} - ${pathname}`);
    }
    // Kiểm tra rate limit
    const rateResult = checkRateLimit(ip, suspiciousActivity.suspicious, 0);

    if (rateResult.banned) {
      stats.blocked++;
      stats.vnBlocked++;
      const timeLeft = rateResult.timeLeft || 0;
      console.log(`[${new Date().toISOString()}] ${rateResult.timeLeft ? 'TEMP_BAN' : 'AUTO_BAN'}: ${ip} - Violations: ${rateResult.violations} - Level: ${rateResult.level || 1} - TimeLeft: ${Math.ceil(timeLeft/1000)}s - ${pathname}`);
      return createAdvancedErrorPage(403, 
        rateResult.timeLeft ? 
          `Security ban active. Multiple violations detected. Level ${rateResult.level || 1} offense.` :
          'Access denied due to repeated policy violations.', 
        timeLeft,
        rateResult.level || 1
      );
    }
    if (!rateResult.allowed) {
      stats.blocked++;
      stats.vnBlocked++;
      console.log(`[${new Date().toISOString()}] RATE_LIMIT: ${ip} - ${rateResult.count}/${rateResult.limit} - Violations: ${rateResult.violations} - ${pathname}`);
      return createAdvancedErrorPage(429, `Request rate exceeded. You have made ${rateResult.count} requests when the limit is ${rateResult.limit} per minute.`);
    }
    // Robots.txt
    if (pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    // Log ngẫu nhiên
    if (Math.random() < 0.001) {
      console.log(`[${new Date().toISOString()}] ALLOW: ${ip} - ${method} ${pathname} - ${rateResult.count}/${rateResult.limit}`);
    }
  } catch (error) {
    stats.blocked++;
    console.log(`[${new Date().toISOString()}] CRITICAL_ERROR: ${error.message}`);
    return createAdvancedErrorPage(500, 'An unexpected error occurred while processing your request.');
  }
}

export const config = {
  runtime: 'edge',
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};


function getThemeConfig(code) {
  const themes = {
    400: {
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: '⚠️',
      title: 'Bad Request',
      message: 'The request could not be understood by the server.',
      primaryColor: '#f5576c',
      accentColor: '#f093fb'
    },
    401: {
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      icon: '🔐',
      title: 'Unauthorized',
      message: 'Authentication is required to access this resource.',
      primaryColor: '#fcb69f',
      accentColor: '#ffecd2'
    },
    403: {
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
      icon: '🛡️',
      title: 'Access Forbidden',
      message: 'You do not have permission to access this resource.',
      primaryColor: '#ee5a52',
      accentColor: '#ff6b6b'
    },
    404: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '🔍',
      title: 'Not Found',
      message: 'The requested resource could not be found on this server.',
      primaryColor: '#764ba2',
      accentColor: '#667eea'
    },
    429: {
      gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
      icon: '⏰',
      title: 'Too Many Requests',
      message: 'You have exceeded the allowed number of requests. Please wait before trying again.',
      primaryColor: '#fab1a0',
      accentColor: '#ffeaa7'
    },
    500: {
      gradient: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)',
      icon: '🔧',
      title: 'Internal Server Error',
      message: 'An unexpected error occurred. Please try again later.',
      primaryColor: '#88d8a3',
      accentColor: '#a8e6cf'
    }
  };
  
  return themes[code] || themes[500];
}

function createAdvancedErrorPage(code, customMessage = null, timeLeft = null, level = 1) {
  const theme = getThemeConfig(code);
  const message = customMessage || theme.message;
  
  // Generate particles HTML
  const particlesHTML = [];
  for (let i = 0; i < 8; i++) {
    const left = 10 + i * 11;
    const size = 3 + Math.random() * 4;
    const delay = i * 1.5;
    particlesHTML.push(`
        <div class="particle" style="
            left: ${left}%; 
            width: ${size}px; 
            height: ${size}px; 
            animation-delay: ${delay}s;
        "></div>
    `);
  }
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${theme.title} - ${code}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${theme.primaryColor};
            --accent-color: ${theme.accentColor};
            --background: ${theme.gradient};
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--background);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #2d3748;
            overflow: hidden;
            position: relative;
        }
        .animated-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
            animation: float 15s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-20px) rotate(1deg); }
            66% { transform: translateY(-10px) rotate(-1deg); }
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 3rem 2.5rem;
            box-shadow: 
                0 32px 64px rgba(0, 0, 0, 0.15),
                0 0 0 1px rgba(255, 255, 255, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
            text-align: center;
            max-width: 500px;
            width: 90%;
            position: relative;
            z-index: 10;
            animation: slideIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(50px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        .error-icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            display: inline-block;
            animation: bounce 2s ease-in-out infinite;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        .error-code {
            font-size: 4rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            letter-spacing: -2px;
        }
        .error-title {
            font-size: 2rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 1rem;
            line-height: 1.3;
        }
        .divider {
            width: 100px;
            height: 3px;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            margin: 1.5rem auto;
            border-radius: 2px;
            position: relative;
            overflow: hidden;
        }
        .divider::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
            animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .error-message {
            font-size: 1.1rem;
            color: #718096;
            line-height: 1.6;
            margin-bottom: 2rem;
            font-weight: 400;
        }
        .ban-notice {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            color: #dc2626;
        }
        .ban-timer {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 1rem 0;
        }
        .ban-level {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            margin: 0.5rem 0;
        }
        .status-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 2rem 0;
            padding: 1.5rem;
            background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .status-item {
            text-align: center;
            padding: 0.5rem;
        }
        .status-label {
            font-size: 0.85rem;
            color: #a0aec0;
            margin-bottom: 0.5rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .status-value {
            font-size: 1.1rem;
            color: #4a5568;
            font-weight: 600;
        }
        .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin: 2rem 0;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.875rem 1.75rem;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        .btn-primary {
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            color: white;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.8);
            color: #4a5568;
            border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }
        .btn:active {
            transform: translateY(0);
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        .security-notice {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1));
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 12px;
            padding: 1rem;
            margin: 1.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.9rem;
            color: #059669;
        }
        .footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            font-size: 0.85rem;
            color: #a0aec0;
            line-height: 1.6;
        }
        .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            pointer-events: none;
            animation: particleFloat 12s linear infinite;
        }
        @keyframes particleFloat {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% {
                transform: translateY(-10vh) rotate(360deg);
                opacity: 0;
            }
        }
        @media (max-width: 640px) {
            .container {
                padding: 2rem 1.5rem;
                margin: 1rem;
            }
            .error-code {
                font-size: 3rem;
            }
            .error-title {
                font-size: 1.5rem;
            }
            .status-grid {
                grid-template-columns: 1fr;
            }
            .action-buttons {
                flex-direction: column;
                align-items: center;
            }
            .btn {
                width: 100%;
                max-width: 280px;
            }
        }
        .countdown {
            font-weight: 600;
            color: var(--primary-color);
        }
    </style>
</head>
<body>
    <div class="animated-bg"></div>
    ${particlesHTML.join('')}
    <div class="container">
        <div class="error-icon">${theme.icon}</div>
        <div class="error-code">${code}</div>
        <h1 class="error-title">${theme.title}</h1>
        <div class="divider"></div>
        <p class="error-message">${message}</p>
        ${timeLeft ? `
            <div class="ban-notice">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🚫</div>
                <div><strong>Security Ban Active</strong></div>
                ${level > 1 ? `<div class="ban-level">Level ${level} Offense</div>` : ''}
                <div style="margin: 0.5rem 0; font-size: 0.9rem;">Multiple violations detected. Access temporarily restricted.</div>
                <div class="ban-timer" id="banTimer">${Math.ceil(timeLeft / 1000)}s</div>
            </div>
        ` : ''}
        <div class="status-grid">
            <div class="status-item">
                <div class="status-label">Status</div>
                <div class="status-value">${timeLeft ? 'Security Ban' : 'Restricted'}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Time</div>
                <div class="status-value">${new Date().toLocaleTimeString()}</div>
            </div>
        </div>
        <div class="security-notice">
            <span style="font-size: 1.2rem;">🔒</span>
            <span>Protected by advanced DDoS protection and behavioral analysis</span>
        </div>
        <div class="action-buttons">
            <button class="btn btn-primary" onclick="handleRetry()" id="retryBtn">
                <span>🔄</span>
                <span>Try Again</span>
            </button>
            <button class="btn btn-secondary" onclick="window.history.back()">
                <span>←</span>
                <span>Go Back</span>
            </button>
        </div>
        <div class="footer">
            <p><strong>Security Notice</strong></p>
            <p>Our systems continuously monitor for suspicious activity to protect all users.</p>
            <p style="margin-top: 0.75rem; opacity: 0.7;">
                ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}
                <br>Incident ID: ${Math.random().toString(36).substring(2, 11).toUpperCase()}
            </p>
        </div>
    </div>
    <script>
        function handleRetry() {
            window.location.reload();
        }
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.container');
            container.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
                this.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            });
            container.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
            ${timeLeft ? `
                let timeLeft = ${Math.ceil(timeLeft / 1000)};
                const banTimer = document.getElementById('banTimer');
                const retryBtn = document.getElementById('retryBtn');
                function updateTimer() {
                    if (timeLeft > 0) {
                        const hours = Math.floor(timeLeft / 3600);
                        const minutes = Math.floor((timeLeft % 3600) / 60);
                        const seconds = timeLeft % 60;
                        let display = '';
                        if (hours > 0) display += hours + 'h ';
                        if (minutes > 0) display += minutes + 'm ';
                        display += seconds + 's';
                        banTimer.textContent = display;
                        retryBtn.innerHTML = '<span>⏳</span><span class="countdown">Wait ' + display + '</span>';
                        retryBtn.disabled = true;
                        timeLeft--;
                        setTimeout(updateTimer, 1000);
                    } else {
                        retryBtn.innerHTML = '<span>🔄</span><span>Try Again</span>';
                        retryBtn.disabled = false;
                        banTimer.textContent = 'Ban Expired';
                    }
                }
                updateTimer();
            ` : (code === 429 ? `
                let countdown = 60;
                const retryBtn = document.getElementById('retryBtn');
                function updateCountdown() {
                    if (countdown > 0) {
                        retryBtn.innerHTML = '<span>⏳</span><span class="countdown">Wait ' + countdown + 's</span>';
                        retryBtn.disabled = true;
                        countdown--;
                        setTimeout(updateCountdown, 1000);
                    } else {
                        retryBtn.innerHTML = '<span>🔄</span><span>Try Again</span>';
                        retryBtn.disabled = false;
                    }
                }
                updateCountdown();
            ` : '')}
        });
    </script>
</body>
</html>`, {
    status: code,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  });
}
