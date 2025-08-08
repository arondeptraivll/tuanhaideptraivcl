import { createClient } from '@supabase/supabase-js'

// ==================== CONFIG ====================
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
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto', 
  'curl', 'wget', 'python', 'go-http', 'masscan', 'nmap', 'sqlmap',
  'fuzz', 'attack', 'exploit', 'penetration'
];

const ADMIN_IPS = ['127.0.0.1']; // Thêm admin IPs ở đây

// ==================== IN-MEMORY STORAGE ====================
const ipData = new Map(); // {ip: {count, window, violations, lastSeen, totalRequests}}
const ipGeoCache = new Map(); // {ip: {isVN, cachedAt}}
const blockedIPs = new Set(); // Permanently blocked IPs
const suspiciousIPs = new Set(); // IPs được theo dõi đặc biệt

// ==================== GLOBAL STATS ====================
const stats = {
  requestsPerSecond: 0,
  totalRequests: 0,
  totalBlocked: 0,
  lastSecond: Date.now(),
  emergencyLevel: 0, // 0=normal, 1=caution, 2=emergency, 3=lockdown
  startTime: Date.now(),
  peakRPS: 0
};

let NUCLEAR_LOCKDOWN = false;

// ==================== UTILITY FUNCTIONS ====================
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
    // Vercel
    const vercelIP = request.headers.get('x-vercel-forwarded-for');
    if (vercelIP) {
      const cleanIP = sanitizeIP(vercelIP.split(',')[0]);
      if (cleanIP && !isPrivateIP(cleanIP)) return cleanIP;
    }

    // Cloudflare
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) {
      const cleanIP = sanitizeIP(cfIP);
      if (cleanIP && !isPrivateIP(cleanIP)) return cleanIP;
    }
    
    // Standard headers
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
  
  if (cached && (now - cached.cachedAt) < 3600000) { // 1 hour cache
    return cached.isVN;
  }
  
  const isVN = isVietnamIP(ip);
  
  ipGeoCache.set(ip, {
    isVN,
    cachedAt: now
  });
  
  // Cleanup cache nếu quá lớn
  if (ipGeoCache.size > 10000) {
    const oldestEntries = Array.from(ipGeoCache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
      .slice(0, 2000);
      
    oldestEntries.forEach(([ip]) => ipGeoCache.delete(ip));
  }
  
  return isVN;
}

// ==================== EMERGENCY SYSTEM ====================
function updateEmergencyLevel() {
  const now = Date.now();
  
  if (now - stats.lastSecond > 1000) {
    const rps = stats.requestsPerSecond;
    stats.peakRPS = Math.max(stats.peakRPS, rps);
    
    // Auto-adjust emergency level
    if (rps > 20000) {
      stats.emergencyLevel = 3; // Lockdown
      console.log(`🚨 LOCKDOWN MODE: ${rps} RPS`);
    } else if (rps > 10000) {
      stats.emergencyLevel = 2; // Emergency
      console.log(`⚠️ EMERGENCY MODE: ${rps} RPS`);
    } else if (rps > 2000) {
      stats.emergencyLevel = 1; // Caution
      console.log(`⚡ CAUTION MODE: ${rps} RPS`);
    } else if (rps < 100) {
      stats.emergencyLevel = 0; // Normal
    }
    
    // Nuclear lockdown
    if (rps > 50000) {
      NUCLEAR_LOCKDOWN = true;
      console.log('☢️ NUCLEAR LOCKDOWN ACTIVATED');
      
      setTimeout(() => {
        NUCLEAR_LOCKDOWN = false;
        console.log('✅ Nuclear lockdown deactivated');
      }, 300000); // 5 phút
    }
    
    stats.requestsPerSecond = 0;
    stats.lastSecond = now;
  }
  
  stats.requestsPerSecond++;
  stats.totalRequests++;
}

// ==================== RATE LIMITING ====================
function ultraFastRateLimit(ip, isVN, userAgent) {
  const now = Date.now();
  updateEmergencyLevel();
  
  // Nuclear lockdown
  if (NUCLEAR_LOCKDOWN && !ADMIN_IPS.includes(ip)) {
    stats.totalBlocked++;
    return { allowed: false, reason: 'NUCLEAR_LOCKDOWN', code: 503 };
  }
  
  // Permanent block list
  if (blockedIPs.has(ip)) {
    stats.totalBlocked++;
    return { allowed: false, reason: 'BLACKLISTED', code: 403 };
  }
  
  // Emergency limits
  const limits = {
    0: isVN ? 60 : 5,   // Normal
    1: isVN ? 30 : 3,   // Caution  
    2: isVN ? 10 : 1,   // Emergency
    3: isVN ? 3 : 1     // Lockdown
  };
  
  const limit = limits[stats.emergencyLevel];
  const windowMs = 60000; // 1 minute
  
  let data = ipData.get(ip);
  
  if (!data || (now - data.window) > windowMs) {
    // New window
    data = { 
      count: 1, 
      window: now, 
      violations: data?.violations || 0, 
      lastSeen: now,
      totalRequests: (data?.totalRequests || 0) + 1
    };
    ipData.set(ip, data);
    return { allowed: true, reason: 'NEW_WINDOW', count: 1 };
  }
  
  data.count++;
  data.lastSeen = now;
  data.totalRequests++;
  
  // Suspicious behavior detection
  const isSuspiciousUA = SUSPICIOUS_UAS.some(ua => 
    userAgent.toLowerCase().includes(ua)
  );
  
  if (isSuspiciousUA && !isVN) {
    data.violations += 2; // Double penalty for foreign suspicious
    suspiciousIPs.add(ip);
  }
  
  if (data.count > limit) {
    data.violations++;
    stats.totalBlocked++;
    
    // Auto-blacklist logic
    let blacklistThreshold;
    if (stats.emergencyLevel >= 2) {
      blacklistThreshold = 2; // Strict during emergency
    } else if (suspiciousIPs.has(ip)) {
      blacklistThreshold = 3; // Suspicious IPs
    } else {
      blacklistThreshold = 5; // Normal IPs
    }
    
    if (data.violations >= blacklistThreshold) {
      blockedIPs.add(ip);
      ipData.delete(ip);
      suspiciousIPs.delete(ip);
      
      console.log(`🔨 BLACKLISTED: ${ip} (${data.violations} violations, emergency: ${stats.emergencyLevel})`);
      return { allowed: false, reason: 'AUTO_BLACKLISTED', code: 403 };
    }
    
    return { 
      allowed: false, 
      reason: 'RATE_LIMITED', 
      code: 429, 
      count: data.count,
      violations: data.violations,
      limit
    };
  }
  
  return { allowed: true, reason: 'ALLOWED', count: data.count };
}

// ==================== RESPONSE FUNCTIONS ====================
function createFastResponse(message, code = 403) {
  return new Response(message, {
    status: code,
    headers: { 
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Emergency-Level': stats.emergencyLevel.toString(),
      'X-Block-Time': new Date().toISOString()
    }
  });
}

function createDetailedResponse(statusCode, reason, details = {}) {
  const isEmergency = stats.emergencyLevel >= 2;
  
  if (isEmergency) {
    return createFastResponse(`${statusCode}: ${reason}`, statusCode);
  }
  
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Truy cập bị từ chối</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
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
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
            background-size: 300% 300%;
            animation: gradient 3s ease infinite;
        }
        
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .title {
            font-size: 2.5rem;
            color: #2c3e50;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .status-code {
            display: inline-block;
            background: linear-gradient(45deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }
        
        .reason {
            font-size: 1.2rem;
            color: #555;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }
        
        .details {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1.5rem;
            border-left: 4px solid #007bff;
        }
        
        .details-title {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 0.5rem;
        }
        
        .details-item {
            display: flex;
            justify-content: space-between;
            padding: 0.3rem 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .details-item:last-child {
            border-bottom: none;
        }
        
        .stats {
            background: #e9ecef;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
        
        .emergency-indicator {
            display: inline-block;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        
        .emergency-0 { background: #d4edda; color: #155724; }
        .emergency-1 { background: #fff3cd; color: #856404; }
        .emergency-2 { background: #f8d7da; color: #721c24; }
        .emergency-3 { background: #f5c6cb; color: #721c24; animation: pulse 1s infinite; }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .refresh-btn {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 50px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin-top: 1rem;
        }
        
        .refresh-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3);
        }
        
        .footer {
            color: #777;
            font-size: 0.9rem;
            margin-top: 1rem;
        }
        
        @media (max-width: 480px) {
            .title { font-size: 2rem; }
            .container { padding: 1.5rem; }
            .emoji { font-size: 3rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">${getEmojiForStatus(statusCode)}</div>
        <h1 class="title">Access Denied</h1>
        
        <div class="emergency-indicator emergency-${stats.emergencyLevel}">
            ${getEmergencyText(stats.emergencyLevel)}
        </div>
        
        <div class="status-code">ERROR ${statusCode}</div>
        <div class="reason">${reason}</div>
        
        ${Object.keys(details).length > 0 ? `
        <div class="details">
            <div class="details-title">📋 Chi tiết:</div>
            ${Object.entries(details).map(([key, value]) => `
                <div class="details-item">
                    <span>${key}:</span>
                    <strong>${value}</strong>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="stats">
            <strong>🛡️ System Status:</strong><br>
            Emergency Level: ${stats.emergencyLevel}/3 | 
            RPS: ${stats.requestsPerSecond} | 
            Blocked: ${stats.totalBlocked} | 
            Peak: ${stats.peakRPS}
        </div>
        
        ${statusCode === 429 ? `
        <div style="background: #fff3cd; padding: 1rem; border-radius: 10px; margin: 1rem 0; color: #856404;">
            ⏱️ <strong>Rate limit exceeded!</strong><br>
            Vui lòng chờ 60 giây trước khi thử lại.
        </div>
        ` : ''}
        
        <button class="refresh-btn" onclick="window.location.reload()">
            🔄 Thử lại
        </button>
        
        <div class="footer">
            <p>🛡️ Protected by Ultra DDoS Shield</p>
            <p>Timestamp: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
    </div>

    <script>
        ${statusCode === 429 ? `
        let countdown = 60;
        const btn = document.querySelector('.refresh-btn');
        const interval = setInterval(() => {
            countdown--;
            btn.textContent = \`🔄 Thử lại (\${countdown}s)\`;
            if (countdown <= 0) {
                clearInterval(interval);
                window.location.reload();
            }
        }, 1000);
        ` : ''}
    </script>
</body>
</html>`;

  return new Response(html, {
    status: statusCode,
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Emergency-Level': stats.emergencyLevel.toString(),
      'X-Block-Time': new Date().toISOString()
    }
  });
}

function getEmojiForStatus(statusCode) {
  switch(statusCode) {
    case 403: return '🚫';
    case 429: return '⏱️';
    case 503: return '🔧';
    default: return '❌';
  }
}

function getEmergencyText(level) {
  switch(level) {
    case 0: return '🟢 NORMAL';
    case 1: return '🟡 CAUTION';
    case 2: return '🟠 EMERGENCY';
    case 3: return '🔴 LOCKDOWN';
    default: return '⚪ UNKNOWN';
  }
}

// ==================== CLEANUP & MONITORING ====================
function cleanupMemory() {
  const now = Date.now();
  const fiveMinutesAgo = now - 300000;
  let cleaned = 0;
  
  // Cleanup old IP data
  for (const [ip, data] of ipData.entries()) {
    if (data.lastSeen < fiveMinutesAgo) {
      ipData.delete(ip);
      cleaned++;
    }
  }
  
  // Cleanup geo cache if too large
  if (ipGeoCache.size > 20000) {
    const oldEntries = Array.from(ipGeoCache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
      .slice(0, 5000);
    
    oldEntries.forEach(([ip]) => ipGeoCache.delete(ip));
  }
  
  console.log(`🧹 Cleanup: ${cleaned} IPs removed, ${ipData.size} active, ${blockedIPs.size} blocked, ${suspiciousIPs.size} suspicious`);
}

// Auto cleanup every 2 minutes
setInterval(cleanupMemory, 120000);

// ==================== STATS ENDPOINT ====================
function createStatsResponse() {
  const uptime = Date.now() - stats.startTime;
  const uptimeHours = (uptime / 3600000).toFixed(2);
  
  return new Response(JSON.stringify({
    stats: {
      emergencyLevel: stats.emergencyLevel,
      rps: stats.requestsPerSecond,
      totalRequests: stats.totalRequests,
      totalBlocked: stats.totalBlocked,
      peakRPS: stats.peakRPS,
      uptime: `${uptimeHours}h`,
      nuclearLockdown: NUCLEAR_LOCKDOWN
    },
    memory: {
      activeIPs: ipData.size,
      blacklistedIPs: blockedIPs.size,
      suspiciousIPs: suspiciousIPs.size,
      geoCache: ipGeoCache.size
    },
    recentBlocked: Array.from(blockedIPs).slice(-10),
    recentSuspicious: Array.from(suspiciousIPs).slice(-10)
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ==================== MAIN MIDDLEWARE ====================
export default async function middleware(request) {
  const startTime = performance.now();
  
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Stats endpoint (admin only)
    if (path === '/api/ddos-stats') {
      const ip = getClientIP(request);
      if (ADMIN_IPS.includes(ip) || !ip) {
        return createStatsResponse();
      }
      return createFastResponse('Unauthorized', 403);
    }
    
    // Static files bypass
    if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map|txt|xml)$/)) {
      return;
    }
    
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const method = request.method;
    
    // No IP = instant block
    if (!ip) {
      stats.totalBlocked++;
      return createFastResponse('No IP detected', 403);
    }
    
    // Admin bypass
    if (ADMIN_IPS.includes(ip)) {
      console.log(`👑 Admin access: ${ip} - ${path}`);
      return;
    }
    
    // Vietnam IP check (cached)
    const isVN = isVietnamIPCached(ip);
    
    // Non-Vietnam = instant block
    if (!isVN) {
      stats.totalBlocked++;
      const country = request.headers.get('cf-ipcountry') || 'Unknown';
      
      console.log(`🌍 Foreign blocked: ${ip} (${country}) - ${path}`);
      
      return stats.emergencyLevel >= 2 
        ? createFastResponse('VN Only', 403)
        : createDetailedResponse(403, 'Chỉ cho phép truy cập từ Việt Nam', {
            'IP': ip,
            'Country': country,
            'Policy': 'Vietnam Only'
          });
    }
    
    // Rate limit check
    const rateLimitResult = ultraFastRateLimit(ip, isVN, userAgent);
    
    if (!rateLimitResult.allowed) {
      console.log(`🚫 ${rateLimitResult.reason}: ${ip} - ${path} (${rateLimitResult.count || 'N/A'}/${rateLimitResult.limit || 'N/A'})`);
      
      if (rateLimitResult.code === 503) {
        return createFastResponse('Service temporarily unavailable during emergency', 503);
      }
      
      if (rateLimitResult.code === 403) {
        return createFastResponse('IP permanently blocked', 403);
      }
      
      // Rate limited
      return stats.emergencyLevel >= 2
        ? createFastResponse(`Rate Limited: ${rateLimitResult.count}/${rateLimitResult.limit}`, 429)
        : createDetailedResponse(429, 'Quá nhiều request trong thời gian ngắn', {
            'Requests': `${rateLimitResult.count}/${rateLimitResult.limit}`,
            'Violations': rateLimitResult.violations,
            'Emergency Level': stats.emergencyLevel,
            'Window': '60 seconds'
          });
    }
    
    // Success
    const processingTime = performance.now() - startTime;
    
    // Async logging (không block response)
    if (processingTime > 10 || Math.random() < 0.01) { // Log slow requests hoặc 1% random
      setImmediate(() => {
        console.log(`✅ ${ip} - ${path} (${processingTime.toFixed(2)}ms, ${rateLimitResult.count}/min)`);
      });
    }
    
  } catch (error) {
    console.error('🔥 Critical middleware error:', error.message);
    stats.totalBlocked++;
    return createFastResponse('Internal Server Error', 503);
  }
}

export const config = {
  runtime: 'edge',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
