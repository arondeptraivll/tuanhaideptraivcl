import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const RATE_LIMIT_VN = 50          
const RATE_LIMIT_FOREIGN = 3      
const WINDOW_MS = 60 * 1000
const BAN_DURATION = 24 * 60 * 60 * 1000

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
]

const SUSPICIOUS_UAS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto', 
  'curl', 'wget', 'python', 'go-http', 'masscan', 'nmap', 'sqlmap'
  'fuff',
]

function sanitizeIP(ip) {
  if (!ip || typeof ip !== 'string') return null
  
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const cleaned = ip.trim()
  
  if (!ipv4Regex.test(cleaned)) return null
  
  const parts = cleaned.split('.')
  for (const part of parts) {
    const num = parseInt(part, 10)
    if (num < 0 || num > 255) return null
  }
  
  return cleaned
}

function isPrivateIP(ip) {
  if (!ip) return false
  
  const parts = ip.split('.').map(Number)
  const [a, b, c, d] = parts
  
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 127) ||
    (a === 169 && b === 254)
  )
}

function getClientIP(request) {
  try {
    const cfIP = request.headers.get('cf-connecting-ip')
    if (cfIP) {
      const cleanIP = sanitizeIP(cfIP)
      if (cleanIP && !isPrivateIP(cleanIP)) {
        return cleanIP
      }
    }
    
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      const cleanIP = sanitizeIP(realIP)
      if (cleanIP && !isPrivateIP(cleanIP)) {
        return cleanIP
      }
    }
    
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      const firstIP = sanitizeIP(forwarded.split(',')[0])
      if (firstIP && !isPrivateIP(firstIP)) {
        return firstIP
      }
    }
    
    return null
    
  } catch (error) {
    return null
  }
}

function logSecurity(type, ip, data = {}) {
  const sanitizedData = {
    path: data.path?.substring(0, 100),
    method: data.method,
    country: data.country,
    time: data.time,
    count: data.count,
    violations: data.violations
  }
  
  console.log(`[${new Date().toISOString()}] ${type} - ${ip || 'unknown'}`, 
    JSON.stringify(sanitizedData))
}

function ipToNumber(ip) {
  if (!ip) return 0
  try {
    return ip.split('.').reduce((acc, octet) => {
      const num = parseInt(octet, 10)
      return (acc << 8) | num
    }, 0) >>> 0
  } catch {
    return 0
  }
}

function isVietnamIP(ip) {
  if (!ip) return false
  
  const ipNum = ipToNumber(ip)
  
  if (ipNum === 0) return false
  
  for (const [start, end] of VIETNAM_IP_RANGES) {
    const startNum = ipToNumber(start)
    const endNum = ipToNumber(end)
    
    if (ipNum >= startNum && ipNum <= endNum) {
      return true
    }
  }
  
  return false
}

async function hashUserAgent(userAgent) {
  if (!userAgent) return null
  
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(userAgent.substring(0, 200))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
  } catch {
    return null
  }
}

async function checkRateLimit(supabase, ip, isVN, country, userAgent) {
  try {
    const uaHash = await hashUserAgent(userAgent)
    
    const { data: result, error } = await supabase.rpc('handle_rate_limit_v2', {
      p_ip: ip,
      p_limit: isVN ? RATE_LIMIT_VN : RATE_LIMIT_FOREIGN,
      p_window_ms: WINDOW_MS,
      p_ban_duration: BAN_DURATION,
      p_is_vn: isVN
    })
    
    if (error) throw error
    
    return {
      allowed: result?.allowed || false,
      banned: result?.banned || false,
      count: result?.count || 0,
      violations: result?.violations || 0
    }
    
  } catch (error) {
    console.error('Rate limit check error:', error.message)
    return { allowed: false, banned: false, count: 0, violations: 0 }
  }
}

async function logSecurityEvent(supabase, ip, eventType, severity = 'LOW', metadata = {}) {
  try {
    await supabase.rpc('log_security_event', {
      input_ip: ip,
      input_event_type: eventType,
      input_severity: severity,
      input_path: metadata.path,
      input_user_agent: metadata.userAgent?.substring(0, 500),
      input_country: metadata.country,
      input_metadata: metadata
    })
  } catch (error) {
    console.error('Security logging error:', error.message)
  }
}

function createBlockReason(type) {
  const reasons = {
    'BLOCKED_NO_IP': 'NO_IP_DETECTED',
    'BLOCKED_COUNTRY': 'FOREIGN_COUNTRY',
    'BLOCKED_SUSPICIOUS_FOREIGN': 'SUSPICIOUS_FOREIGN',
    'BLOCKED_BANNED': 'IP_BANNED',
    'RATE_LIMIT_EXCEEDED': 'RATE_LIMIT',
    'BLOCKED_FOREIGN': 'FOREIGN_IP',
    'SERVICE_ERROR': 'SERVICE_ERROR'
  }
  return reasons[type] || 'ACCESS_DENIED'
}

function createBlockedResponse(statusCode, reason, details = {}, blockType = '') {
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
        
        .retry-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 1rem;
            border-radius: 10px;
            color: #856404;
            margin-bottom: 1rem;
        }
        
        .footer {
            color: #777;
            font-size: 0.9rem;
            margin-top: 1rem;
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
        <h1 class="title">Bạn đã bị chặn :v</h1>
        <div class="status-code">ERROR ${statusCode}</div>
        <div class="reason">${reason}</div>
        
        ${details && Object.keys(details).length > 0 ? `
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
        
        ${statusCode === 429 ? `
        <div class="retry-info">
            ⏱️ <strong>Rate limit exceeded!</strong><br>
            Vui lòng chờ 60 giây trước khi thử lại.
        </div>
        ` : ''}
        
        ${statusCode === 403 && reason.includes('Vietnam') ? `
        <div class="retry-info">
            🇻🇳 <strong>Chỉ cho phép truy cập từ Việt Nam</strong><br>
            Nếu bạn đang ở VN, hãy thử tắt VPN/Proxy.
        </div>
        ` : ''}
        
        <button class="refresh-btn" onclick="window.location.reload()">
            🔄 Thử lại
        </button>
        
        <div class="footer">
            <p>🛡️ Đừng có ddos em ạ, ko đủ cảnh</p>
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
        
        let konamiCode = [];
        const konami = [38,38,40,40,37,39,37,39,66,65];
        document.addEventListener('keydown', (e) => {
            konamiCode.push(e.keyCode);
            if (konamiCode.length > 10) konamiCode.shift();
            if (konamiCode.join(',') === konami.join(',')) {
                document.body.style.animation = 'rainbow 1s infinite';
                setTimeout(() => document.body.style.animation = '', 3000);
            }
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    status: statusCode,
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Block-Type': createBlockReason(blockType),
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

function getDetailedReason(type, metadata = {}) {
  const reasons = {
    'BLOCKED_NO_IP': {
      reason: 'Không thể xác định địa chỉ IP thực của bạn',
      details: {
        'Nguyên nhân': 'IP headers không hợp lệ hoặc bị thiếu',
        'Giải pháp': 'Tắt proxy/VPN và thử lại'
      }
    },
    'BLOCKED_COUNTRY': {
      reason: 'Truy cập từ quốc gia không được phép',
      details: {
        'Quốc gia': metadata.country || 'Unknown',
        'Chính sách': 'Chỉ cho phép truy cập từ Việt Nam'
      }
    },
    'BLOCKED_SUSPICIOUS_FOREIGN': {
      reason: 'Phát hiện hoạt động đáng nghi từ IP nước ngoài',
      details: {
        'Loại': 'Suspicious User Agent + Foreign IP',
        'Mức độ': 'Nguy hiểm cao'
      }
    },
    'BLOCKED_BANNED': {
      reason: 'IP của bạn đã bị cấm truy cập',
      details: {
        'Thời gian ban': '24 giờ',
        'Nguyên nhân': 'Vi phạm rate limit nhiều lần'
      }
    },
    'RATE_LIMIT_EXCEEDED': {
      reason: 'Bạn đã gửi quá nhiều request trong thời gian ngắn',
      details: {
        'Số request': metadata.count || 'N/A',
        'Giới hạn': metadata.isVN ? '50/phút' : '3/phút',
        'Thời gian reset': '60 giây'
      }
    },
    'BLOCKED_FOREIGN': {
      reason: 'Truy cập từ IP nước ngoài không được phép',
      details: {
        'IP': metadata.ip || 'Hidden',
        'Chính sách': 'Vietnam Only'
      }
    }
  };

  return reasons[type] || {
    reason: 'Truy cập bị từ chối',
    details: { 'Lý do': 'Không xác định' }
  };
}

export default async function middleware(request) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const path = url.pathname
    
    if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map)$/)) {
      return
    }
    
    const ip = getClientIP(request)
    
    if (!ip) {
      logSecurity('BLOCKED_NO_IP', 'unknown', { path })
      const reasonData = getDetailedReason('BLOCKED_NO_IP')
      return createBlockedResponse(403, reasonData.reason, reasonData.details, 'BLOCKED_NO_IP')
    }
    
    const userAgent = request.headers.get('user-agent') || ''
    const country = request.headers.get('cf-ipcountry') || ''
    const method = request.method
    
    logSecurity('REQUEST', ip, { path, method, country })
    
    if (country && country !== 'VN' && country !== 'XX' && country !== '') {
      logSecurity('BLOCKED_COUNTRY', ip, { country, path })
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'COUNTRY_BLOCK', 'MEDIUM', {
          country, path, userAgent: userAgent.substring(0, 100)
        })
      }
      
      const reasonData = getDetailedReason('BLOCKED_COUNTRY', { country })
      return createBlockedResponse(403, reasonData.reason, reasonData.details, 'BLOCKED_COUNTRY')
    }
    
    const isSuspiciousUA = SUSPICIOUS_UAS.some(ua => 
      userAgent.toLowerCase().includes(ua)
    )
    
    const isVN = isVietnamIP(ip)
    
    if (!isVN && isSuspiciousUA) {
      logSecurity('BLOCKED_SUSPICIOUS_FOREIGN', ip, { 
        suspicious: true,
        ua: userAgent.substring(0, 50)
      })
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'SUSPICIOUS_UA', 'HIGH', {
          path, userAgent: userAgent.substring(0, 200), country
        })
      }
      
      const reasonData = getDetailedReason('BLOCKED_SUSPICIOUS_FOREIGN')
      return createBlockedResponse(403, reasonData.reason, reasonData.details, 'BLOCKED_SUSPICIOUS_FOREIGN')
    }
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        db: { schema: 'public' }
      })
      
      const rateLimitResult = await checkRateLimit(supabase, ip, isVN, country, userAgent)
      
      if (rateLimitResult.banned) {
        logSecurity('BLOCKED_BANNED', ip, { path })
        await logSecurityEvent(supabase, ip, 'BANNED_ACCESS', 'HIGH', {
          path, country, userAgent: userAgent.substring(0, 100)
        })
        
        const reasonData = getDetailedReason('BLOCKED_BANNED')
        return createBlockedResponse(403, reasonData.reason, reasonData.details, 'BLOCKED_BANNED')
      }
      
      if (!rateLimitResult.allowed) {
        logSecurity('RATE_LIMIT_EXCEEDED', ip, { 
          count: rateLimitResult.count,
          violations: rateLimitResult.violations
        })
        
        await logSecurityEvent(supabase, ip, 'RATE_LIMIT', 'MEDIUM', {
          path, count: rateLimitResult.count, 
          violations: rateLimitResult.violations
        })
        
        const reasonData = getDetailedReason('RATE_LIMIT_EXCEEDED', {
          count: rateLimitResult.count,
          isVN: isVN
        })
        return createBlockedResponse(429, reasonData.reason, reasonData.details, 'RATE_LIMIT_EXCEEDED')
      }
    }
    
    if (!isVN) {
      logSecurity('BLOCKED_FOREIGN', ip, { path })
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'FOREIGN_BLOCK', 'LOW', {
          path, country, userAgent: userAgent.substring(0, 100)
        })
      }
      
      const reasonData = getDetailedReason('BLOCKED_FOREIGN', { ip })
      return createBlockedResponse(403, reasonData.reason, reasonData.details, 'BLOCKED_FOREIGN')
    }
    
    const processingTime = Date.now() - startTime
    logSecurity('ALLOWED', ip, { 
      path, 
      time: `${processingTime}ms` 
    })
    
  } catch (error) {
    console.error('Middleware critical error:', error.message)
    
    const reasonData = getDetailedReason('SERVICE_ERROR', { error: error.message })
    return createBlockedResponse(503, 'Dịch vụ tạm thời không khả dụng', {
      'Lỗi': 'Internal Server Error',
      'Thời gian': new Date().toLocaleTimeString('vi-VN')
    }, 'SERVICE_ERROR')
  }
}

export const config = {
  runtime: 'edge',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
