// middleware.js - Version đã sửa lỗi header
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Security configs - Giảm rate limit cho VN
const RATE_LIMIT_VN = 50          
const RATE_LIMIT_FOREIGN = 3      
const WINDOW_MS = 60 * 1000
const BAN_DURATION = 24 * 60 * 60 * 1000

// Trusted proxy IPs (Vercel, Cloudflare, etc.)
const TRUSTED_PROXIES = [
  '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '104.16.0.0/13', '108.162.192.0/18', '131.0.72.0/22',
  '141.101.64.0/18', '162.158.0.0/15', '172.64.0.0/13',
  '173.245.48.0/20', '188.114.96.0/20', '190.93.240.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '76.76.19.0/24'
]

// Fallback Vietnam IP ranges nếu không fetch được
const FALLBACK_VN_RANGES = [
  ['1.52.0.0', '1.55.255.255'],
  ['14.160.0.0', '14.191.255.255'],
  ['27.64.0.0', '27.79.255.255'],
  ['42.112.0.0', '42.127.255.255'],
  ['45.112.0.0', '45.127.255.255'],
  ['103.1.16.0', '103.1.31.255'],
  ['113.160.0.0', '113.191.255.255'],
  ['115.84.64.0', '115.84.95.255'],
  ['116.96.0.0', '116.103.255.255'],
  ['171.224.0.0', '171.255.255.255']
]

// Global cache cho Vietnam IP ranges
let VIETNAM_IP_RANGES = []
let lastFetchTime = 0
let fetchAttempts = 0
const MAX_FETCH_ATTEMPTS = 3
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

const SUSPICIOUS_UAS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto', 
  'curl', 'wget', 'python', 'go-http', 'masscan', 'nmap', 'sqlmap'
]

function sanitizeIP(ip) {
  if (!ip || typeof ip !== 'string') return null
  
  // Basic IP validation
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
    (a === 169 && b === 254) // Link-local
  )
}

function isTrustedProxy(proxyIP) {
  if (!proxyIP) return false
  
  // Simplified CIDR matching
  const commonProxies = [
    '76.76.19', '162.158', '172.64', '104.16', '103.21',
    '173.245', '188.114', '190.93', '197.234', '198.41'
  ]
  
  return commonProxies.some(prefix => proxyIP.startsWith(prefix))
}

function getClientIP(request) {
  try {
    // Ưu tiên Cloudflare connecting IP
    const cfIP = request.headers.get('cf-connecting-ip')
    if (cfIP) {
      const cleanIP = sanitizeIP(cfIP)
      if (cleanIP && !isPrivateIP(cleanIP)) {
        return cleanIP
      }
    }
    
    // Fallback to x-real-ip từ trusted source
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      const cleanIP = sanitizeIP(realIP)
      if (cleanIP && !isPrivateIP(cleanIP)) {
        return cleanIP
      }
    }
    
    // Cuối cùng check x-forwarded-for
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      const firstIP = sanitizeIP(forwarded.split(',')[0])
      if (firstIP && !isPrivateIP(firstIP)) {
        return firstIP
      }
    }
    
    // FAIL-SECURE: Không thể xác định IP thật
    return null
    
  } catch (error) {
    console.error('IP extraction error:', error.message)
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

async function fetchVietnamIPs() {
  try {
    const now = Date.now()
    
    // Check cache first
    if (VIETNAM_IP_RANGES.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      return VIETNAM_IP_RANGES
    }
    
    // Limit fetch attempts để tránh spam
    if (fetchAttempts >= MAX_FETCH_ATTEMPTS) {
      console.warn('Max fetch attempts reached, using fallback ranges')
      return FALLBACK_VN_RANGES
    }
    
    fetchAttempts++
    
    // Fetch với security headers và timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(
      'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/vietnam_proxy.txt',
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Security-Middleware/1.0',
          'Accept': 'text/plain',
          'Cache-Control': 'no-cache'
        },
        method: 'GET',
        mode: 'cors'
      }
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    // Validate content-type
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/plain') && !contentType?.includes('text/')) {
      throw new Error('Invalid content type received')
    }
    
    const text = await response.text()
    
    // Validate file size (không quá 1MB)
    if (text.length > 1024 * 1024) {
      throw new Error('File too large')
    }
    
    const ranges = []
    const lines = text.split('\n')
    
    // Validate format và parse
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      // Support multiple formats
      let match = trimmed.match(/^(\d+\.\d+\.\d+\.\d+)\s*[-\/]\s*(\d+\.\d+\.\d+\.\d+)$/)
      if (!match) {
        // Try CIDR format
        match = trimmed.match(/^(\d+\.\d+\.\d+\.\d+)\/\d+$/)
        if (match) {
          // Convert CIDR to range (simplified)
          ranges.push([match[1], match[1]])
          continue
        }
      }
      
      if (match && match.length >= 3) {
        const startIP = sanitizeIP(match[1])
        const endIP = sanitizeIP(match[2])
        
        if (startIP && endIP) {
          // Validate IP range
          const startNum = ipToNumber(startIP)
          const endNum = ipToNumber(endIP)
          
          if (startNum <= endNum && startNum > 0) {
            ranges.push([startIP, endIP])
          }
        }
      }
    }
    
    // Validate parsed ranges
    if (ranges.length < 10) {
      throw new Error('Too few IP ranges parsed')
    }
    
    if (ranges.length > 10000) {
      throw new Error('Too many IP ranges parsed')
    }
    
    // Success - update cache
    VIETNAM_IP_RANGES = ranges
    lastFetchTime = now
    fetchAttempts = 0 // Reset attempts on success
    
    console.log(`Successfully loaded ${ranges.length} Vietnam IP ranges`)
    return ranges
    
  } catch (error) {
    console.error('Vietnam IP fetch error:', error.message)
    
    // Use cached data if available
    if (VIETNAM_IP_RANGES.length > 0) {
      console.log('Using cached Vietnam IP ranges')
      return VIETNAM_IP_RANGES
    }
    
    // Final fallback
    console.log('Using fallback Vietnam IP ranges')
    VIETNAM_IP_RANGES = FALLBACK_VN_RANGES
    lastFetchTime = Date.now()
    
    return FALLBACK_VN_RANGES
  }
}

async function isVietnamIP(ip) {
  if (!ip) return false
  
  const ranges = await fetchVietnamIPs()
  const ipNum = ipToNumber(ip)
  
  if (ipNum === 0) return false
  
  for (const [start, end] of ranges) {
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
    // FAIL-SECURE: Block khi không thể check
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

// Hàm tạo ASCII-safe block reason cho header
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
        
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
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
        // Auto refresh sau 60s nếu là rate limit
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
        
        // Easter egg - Konami code
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
      'X-Block-Type': createBlockReason(blockType), // Sử dụng ASCII-safe reason
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
        'Giới hạn': metadata.isVN ? '20/phút' : '3/phút',
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
    
    // Skip static files
    if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map)$/)) {
      return
    }
    
    const ip = getClientIP(request)
    
    // FAIL-SECURE: Block nếu không thể xác định IP thật
    if (!ip) {
      logSecurity('BLOCKED_NO_IP', 'unknown', { path })
      const reasonData = getDetailedReason('BLOCKED_NO_IP')
      return createBlockedResponse(403, reasonData.reason, reasonData.details, 'BLOCKED_NO_IP')
    }
    
    const userAgent = request.headers.get('user-agent') || ''
    const country = request.headers.get('cf-ipcountry') || ''
    const method = request.method
    
    logSecurity('REQUEST', ip, { path, method, country })
    
    // Country-based blocking
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
    
    const isVN = await isVietnamIP(ip)
    
    // Block suspicious foreign requests
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
    
    // Rate limiting
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
    
    // Final foreign IP block
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
    
    // Allow request
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
