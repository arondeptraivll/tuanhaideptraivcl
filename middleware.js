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

const SUSPICIOUS_UAS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto', 'curl', 'wget', 
  'python', 'go-http', 'masscan', 'nmap', 'sqlmap', 'fuzz', 'attack', 'exploit', 
  'penetration', 'test', 'probe', 'automation', 'headless', 'phantom'
];

const SUSPICIOUS_PATHS = [
  '/admin', '/wp-admin', '/phpmyadmin', '/.env', '/config', '/api/v1', 
  '/wp-content', '/wp-includes', '/.git', '/backup', '/database'
];

const ADMIN_IPS = ['42.118.42.236'];

const ipCache = new Map();
const suspiciousCache = new Map();
const bannedIPs = new Set();
const stats = { 
  requests: 0, 
  blocked: 0, 
  suspicious: 0,
  startTime: Date.now()
};

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

function detectSuspiciousActivity(ip, userAgent, path, method) {
  let suspicionScore = 0;
  const reasons = [];
  
  if (SUSPICIOUS_UAS.some(ua => userAgent.toLowerCase().includes(ua))) {
    suspicionScore += 3;
    reasons.push('suspicious_ua');
  }
  
  if (SUSPICIOUS_PATHS.some(p => path.toLowerCase().includes(p))) {
    suspicionScore += 2;
    reasons.push('suspicious_path');
  }
  
  if (method !== 'GET' && method !== 'POST') {
    suspicionScore += 1;
    reasons.push('unusual_method');
  }
  
  if (!userAgent || userAgent.length < 10) {
    suspicionScore += 2;
    reasons.push('minimal_ua');
  }
  
  if (userAgent.length > 500) {
    suspicionScore += 1;
    reasons.push('oversized_ua');
  }
  
  const existing = suspiciousCache.get(ip) || { score: 0, reasons: [], count: 0 };
  existing.score = Math.max(existing.score, suspicionScore);
  existing.reasons = [...new Set([...existing.reasons, ...reasons])];
  existing.count++;
  existing.lastSeen = Date.now();
  
  if (existing.score >= 3 || existing.count >= 5) {
    suspiciousCache.set(ip, existing);
    return { suspicious: true, score: existing.score, reasons: existing.reasons };
  }
  
  if (suspicionScore > 0) {
    suspiciousCache.set(ip, existing);
  }
  
  return { suspicious: false, score: suspicionScore, reasons };
}

function checkRateLimit(ip, isVietnam, suspicious = false) {
  const now = Date.now();
  let limit = isVietnam ? 20 : 3;
  
  if (suspicious) limit = Math.floor(limit * 0.5);
  if (bannedIPs.has(ip)) return { allowed: false, banned: true };
  
  const window = Math.floor(now / 60000);
  const key = `${ip}_${window}`;
  
  const current = ipCache.get(key) || 0;
  ipCache.set(key, current + 1);
  
  if (ipCache.size > 100000) {
    const expired = Array.from(ipCache.keys()).filter(k => 
      parseInt(k.split('_')[1]) < window - 5
    );
    expired.forEach(k => ipCache.delete(k));
  }
  
  const allowed = current + 1 <= limit;
  
  if (!allowed && current + 1 > limit * 2) {
    bannedIPs.add(ip);
    return { allowed: false, banned: true, violations: current + 1 };
  }
  
  return { 
    allowed, 
    count: current + 1, 
    limit, 
    violations: allowed ? 0 : current + 1 - limit 
  };
}

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
    },
    503: {
      gradient: 'linear-gradient(135deg, #d1a3ff 0%, #a8e6cf 100%)',
      icon: '🚧',
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again later.',
      primaryColor: '#a8e6cf',
      accentColor: '#d1a3ff'
    }
  };
  
  return themes[code] || themes[500];
}

function createAdvancedErrorPage(code, customMessage = null) {
  const theme = getThemeConfig(code);
  const message = customMessage || theme.message;
  
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

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }

        .btn:active {
            transform: translateY(0);
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
    
    ${Array.from({length: 8}, (_, i) => `
        <div class="particle" style="
            left: ${10 + i * 11}%; 
            width: ${3 + Math.random() * 4}px; 
            height: ${3 + Math.random() * 4}px; 
            animation-delay: ${i * 1.5}s;
        "></div>
    `).join('')}

    <div class="container">
        <div class="error-icon">${theme.icon}</div>
        <div class="error-code">${code}</div>
        <h1 class="error-title">${theme.title}</h1>
        <div class="divider"></div>
        <p class="error-message">${message}</p>
        
        <div class="status-grid">
            <div class="status-item">
                <div class="status-label">Status</div>
                <div class="status-value">Restricted</div>
            </div>
            <div class="status-item">
                <div class="status-label">Time</div>
                <div class="status-value">${new Date().toLocaleTimeString()}</div>
            </div>
        </div>

        <div class="security-notice">
            <span style="font-size: 1.2rem;">🔒</span>
            <span>This site is protected by advanced security systems</span>
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
            <p><strong>Need assistance?</strong></p>
            <p>If you continue to experience issues, please contact our support team.</p>
            <p style="margin-top: 0.75rem; opacity: 0.7;">
                ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}
                <br>Request ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
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

            ${code === 429 ? `
                let countdown = 60;
                const retryBtn = document.getElementById('retryBtn');
                
                function updateCountdown() {
                    if (countdown > 0) {
                        retryBtn.innerHTML = \`<span>⏳</span><span class="countdown">Wait \${countdown}s</span>\`;
                        retryBtn.disabled = true;
                        retryBtn.style.opacity = '0.6';
                        retryBtn.style.cursor = 'not-allowed';
                        countdown--;
                        setTimeout(updateCountdown, 1000);
                    } else {
                        retryBtn.innerHTML = '<span>🔄</span><span>Try Again</span>';
                        retryBtn.disabled = false;
                        retryBtn.style.opacity = '1';
                        retryBtn.style.cursor = 'pointer';
                    }
                }
                
                updateCountdown();
            ` : ''}
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
      'Referrer-Policy': 'no-referrer'
    }
  });
}

export default async function middleware(request) {
  try {
    stats.requests++;
    
    const url = new URL(request.url);
    const { pathname, search } = url;
    const method = request.method;
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    if (pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map|txt|xml|pdf|zip|rar|mp4|mp3|avi|mov)$/)) {
      return;
    }

    if (pathname === '/api/admin/stats') {
      const ip = getIP(request);
      if (ADMIN_IPS.includes(ip) || !ip) {
        return new Response(JSON.stringify({
          stats,
          activeConnections: ipCache.size,
          suspiciousIPs: suspiciousCache.size,
          bannedIPs: bannedIPs.size,
          uptime: Math.floor((Date.now() - stats.startTime) / 1000)
        }), { headers: { 'Content-Type': 'application/json' } });
      }
      return createAdvancedErrorPage(401);
    }
    
    const ip = getIP(request);
    if (!ip || !isValidIP(ip)) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] INVALID_IP: ${ip || 'null'} - ${pathname} - ${userAgent.substring(0, 100)}`);
      return createAdvancedErrorPage(400, 'Invalid or missing IP address in request.');
    }
    
    if (ADMIN_IPS.includes(ip)) {
      console.log(`[${new Date().toISOString()}] ADMIN_ACCESS: ${ip} - ${method} ${pathname}`);
      return;
    }
    
    if (bannedIPs.has(ip)) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] BANNED_IP: ${ip} - ${pathname}`);
      return createAdvancedErrorPage(403, 'Your IP address has been permanently blocked due to suspicious activity.');
    }
    
    const suspiciousActivity = detectSuspiciousActivity(ip, userAgent, pathname, method);
    if (suspiciousActivity.suspicious) {
      stats.suspicious++;
      console.log(`[${new Date().toISOString()}] SUSPICIOUS: ${ip} - Score: ${suspiciousActivity.score} - Reasons: ${suspiciousActivity.reasons.join(',')} - ${pathname} - ${userAgent.substring(0, 100)}`);
    }
    
    const vietnam = isVN(ip);
    const rateResult = checkRateLimit(ip, vietnam, suspiciousActivity.suspicious);
    
    if (rateResult.banned) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] AUTO_BAN: ${ip} - Violations: ${rateResult.violations} - Type: ${vietnam ? 'VN' : 'FOREIGN'} - ${pathname}`);
      return createAdvancedErrorPage(403, 'Access denied due to repeated policy violations.');
    }
    
    if (!rateResult.allowed) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] RATE_LIMIT: ${ip} - ${rateResult.count}/${rateResult.limit} - Violations: ${rateResult.violations} - Type: ${vietnam ? 'VN' : 'FOREIGN'} - Suspicious: ${suspiciousActivity.suspicious} - ${pathname} - ${userAgent.substring(0, 100)}`);
      return createAdvancedErrorPage(429, `Request rate exceeded. You have made ${rateResult.count} requests when the limit is ${rateResult.limit} per minute.`);
    }
    
    if (!vietnam) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] GEO_BLOCK: ${ip} - Country: ${request.headers.get('cf-ipcountry') || 'Unknown'} - ${pathname} - ${userAgent.substring(0, 100)}`);
      return createAdvancedErrorPage(403, 'This service is currently only available to users located in Vietnam.');
    }
    
    if (pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    if (Math.random() < 0.005) {
      console.log(`[${new Date().toISOString()}] ALLOW: ${ip} - ${method} ${pathname} - ${rateResult.count}/${rateResult.limit} - ${userAgent.substring(0, 50)}`);
    }
    
  } catch (error) {
    stats.blocked++;
    console.log(`[${new Date().toISOString()}] CRITICAL_ERROR: ${error.message} - Stack: ${error.stack?.substring(0, 200)}`);
    return createAdvancedErrorPage(500, 'An unexpected error occurred while processing your request.');
  }
}

export const config = {
  runtime: 'edge',
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
