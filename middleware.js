const rateLimit = new Map()
const RATE_LIMIT = 20 // Cho IP VN
const FOREIGN_MAX_REQUESTS = 3 // Chỉ 3 request cho IP nước ngoài trước khi BAN
const WINDOW_MS = 60 * 1000
const MAX_VIOLATIONS = 100
const BAN_DURATION = 24 * 60 * 60 * 1000
const PERMANENT_BAN_DURATION = 365 * 24 * 60 * 60 * 1000

// Cache cho Vietnam IP ranges
let VIETNAM_IP_RANGES = []
let lastFetchTime = 0
const CACHE_DURATION = 60 * 60 * 1000 // Cache 1 giờ

// URL danh sách IP VN từ GitHub
const VIETNAM_IP_LIST_URL = 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/vietnam_proxy.txt'

// Thêm các User-Agent đáng ngờ để block
const SUSPICIOUS_USER_AGENTS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 
  'nikto', 'sqlmap', 'python', 'curl', 'wget', 'java',
  'go-http-client', 'okhttp', 'postman', 'insomnia'
]

// Fetch và parse danh sách IP từ GitHub
async function fetchVietnamIPRanges() {
  try {
    const now = Date.now()
    
    // Nếu cache còn mới, không cần fetch
    if (VIETNAM_IP_RANGES.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      return
    }
    
    console.log('[IP LIST] Fetching Vietnam IP ranges from GitHub...')
    
    const response = await fetch(VIETNAM_IP_LIST_URL, {
      headers: {
        'User-Agent': 'Vietnam-IP-Middleware/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch IP list: ${response.status}`)
    }
    
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    const newRanges = []
    
    for (const line of lines) {
      // Parse format: "1.52.0.0 - 1.55.255.255"
      const match = line.match(/^(\d+\.\d+\.\d+\.\d+)\s*-\s*(\d+\.\d+\.\d+\.\d+)$/)
      if (match) {
        newRanges.push([match[1], match[2]])
      }
    }
    
    if (newRanges.length > 0) {
      VIETNAM_IP_RANGES = newRanges
      lastFetchTime = now
      console.log(`[IP LIST] Successfully loaded ${VIETNAM_IP_RANGES.length} IP ranges`)
    } else {
      throw new Error('No valid IP ranges found')
    }
    
  } catch (error) {
    console.error('[IP LIST] Error fetching Vietnam IP ranges:', error)
    
    // Nếu chưa có data và fetch fail, dùng backup ranges
    if (VIETNAM_IP_RANGES.length === 0) {
      console.log('[IP LIST] Using backup IP ranges')
      VIETNAM_IP_RANGES = [
        ['1.52.0.0', '1.55.255.255'],
        ['14.160.0.0', '14.191.255.255'],
        ['27.64.0.0', '27.79.255.255'],
        ['42.112.0.0', '42.119.255.255'],
        ['113.160.0.0', '113.191.255.255'],
        ['115.72.0.0', '115.87.255.255'],
        ['116.96.0.0', '116.111.255.255'],
        ['117.0.0.0', '117.7.255.255'],
        ['118.68.0.0', '118.71.255.255'],
        ['123.16.0.0', '123.31.255.255'],
        ['171.224.0.0', '171.255.255.255'],
        ['183.80.0.0', '183.91.255.255']
      ]
    }
  }
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet), 0) >>> 0
}

async function isVietnamIP(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === 'localhost') {
    return false
  }
  
  // Cho phép IP private cho development
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return true
  }
  
  // Đảm bảo đã load IP ranges
  await fetchVietnamIPRanges()
  
  const ipNum = ipToNumber(ip)
  
  for (const [start, end] of VIETNAM_IP_RANGES) {
    const startNum = ipToNumber(start)
    const endNum = ipToNumber(end)
    if (ipNum >= startNum && ipNum <= endNum) {
      return true
    }
  }
  
  return false
}

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  return cfConnectingIP || realIP || forwarded?.split(',')[0] || 'unknown'
}

function logActivity(message, ip, extra) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message} - IP: ${ip}`, extra ? JSON.stringify(extra) : '')
}

export default async function middleware(request) {
  try {
    const now = Date.now()
    
    // Dọn dẹp IP cũ (chỉ 0.1% request để tránh overhead)
    if (Math.random() < 0.001) {
      for (const [ip, record] of rateLimit) {
        if (
          (!record.isBanned && now > record.resetTime + 300000) || // 5 phút sau reset
          (record.isBanned && record.bannedUntil && now > record.bannedUntil + 3600000) // 1 giờ sau ban
        ) {
          rateLimit.delete(ip)
          logActivity('🗑️  CLEANUP - Removed expired IP record', ip)
        }
      }
    }

    const ip = getClientIP(request)
    const url = new URL(request.url)
    const path = url.pathname
    const userAgent = request.headers.get('user-agent') || ''
    const method = request.method
    
    // KIỂM TRA 1: User-Agent đáng ngờ
    const suspiciousUA = SUSPICIOUS_USER_AGENTS.some(ua => 
      userAgent.toLowerCase().includes(ua)
    )
    
    if (suspiciousUA && !await isVietnamIP(ip)) {
      logActivity('🚨 SUSPICIOUS USER-AGENT FROM FOREIGN IP', ip, {
        userAgent,
        path,
        method
      })
      
      return new Response('Forbidden', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': 'Suspicious Activity'
        }
      })
    }
    
    // KIỂM TRA 2: Cloudflare Country (nếu có)
    const cfCountry = request.headers.get('cf-ipcountry')
    if (cfCountry && cfCountry !== 'VN') {
      logActivity('🌍 NON-VN COUNTRY DETECTED BY CLOUDFLARE', ip, {
        country: cfCountry,
        path,
        method
      })
      
      return new Response('Access Denied - Vietnam Only', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': 'Non-Vietnam Country',
          'X-Country': cfCountry
        }
      })
    }
    
    // KIỂM TRA 3: IP Việt Nam
    const isVN = await isVietnamIP(ip)
    
    // Log mọi request
    logActivity(isVN ? '📨 VN REQUEST' : '🌍 FOREIGN REQUEST', ip, {
      method,
      path,
      userAgent: userAgent.substring(0, 100),
      isVietnam: isVN
    })
    
    // XỬ LÝ IP NƯỚC NGOÀI NGHIÊM NGẶT
    if (!isVN) {
      // Tạo hoặc lấy record
      if (!rateLimit.has(ip)) {
        rateLimit.set(ip, {
          count: 0,
          resetTime: now + WINDOW_MS,
          violations: 0,
          isBanned: false,
          foreignRequestCount: 0,
          firstForeignRequest: now
        })
      }
      
      const record = rateLimit.get(ip)
      
      // Kiểm tra ban
      if (record.isBanned) {
        logActivity('🚫 BANNED FOREIGN IP TRYING TO ACCESS', ip, {
          path,
          bannedUntil: record.bannedUntil ? new Date(record.bannedUntil).toISOString() : 'permanent',
          totalAttempts: record.foreignRequestCount
        })
        
        // Tăng thời gian ban nếu cố gắng truy cập khi bị ban
        if (record.bannedUntil) {
          record.bannedUntil = now + BAN_DURATION * 2 // Gấp đôi thời gian ban
        }
        
        return new Response('IP PERMANENTLY BANNED', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'X-Ban-Reason': 'Foreign IP Multiple Violations',
            'X-Ban-Status': 'PERMANENT'
          }
        })
      }
      
      // Tăng số lượng request từ foreign IP
      record.foreignRequestCount++
      
      // Reset window nếu hết hạn
      if (now > record.resetTime) {
        record.count = 1
        record.resetTime = now + WINDOW_MS
      } else {
        record.count++
      }
      
      // BAN NGAY nếu vượt quá 3 request trong 1 phút
      if (record.count >= FOREIGN_MAX_REQUESTS) {
        record.isBanned = true
        record.bannedUntil = now + BAN_DURATION
        record.violations++
        
        // Ban vĩnh viễn nếu vi phạm nhiều lần
        if (record.violations >= 3 || record.foreignRequestCount >= 10) {
          record.bannedUntil = now + PERMANENT_BAN_DURATION
          logActivity('🚨🚨 FOREIGN IP PERMANENTLY BANNED', ip, {
            violations: record.violations,
            totalRequests: record.foreignRequestCount,
            bannedUntil: new Date(record.bannedUntil).toISOString()
          })
        } else {
          logActivity('🚨 FOREIGN IP BANNED - EXCEEDED LIMIT', ip, {
            requestCount: record.count,
            limit: FOREIGN_MAX_REQUESTS,
            bannedUntil: new Date(record.bannedUntil).toISOString()
          })
        }
        
        return new Response('IP BANNED - Too Many Requests', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'X-Ban-Reason': 'Foreign IP Rate Limit Exceeded',
            'X-Ban-Until': new Date(record.bannedUntil).toISOString()
          }
        })
      }
      
      // Chặn tất cả request từ foreign IP
      logActivity('❌ FOREIGN IP BLOCKED', ip, {
        path,
        method,
        requestCount: record.count,
        maxAllowed: FOREIGN_MAX_REQUESTS,
        totalForeignRequests: record.foreignRequestCount
      })
      
      return new Response('Access Denied - Vietnam Only\nThis service is restricted to Vietnam IP addresses only.', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': 'Non-Vietnam IP Address',
          'X-Request-Count': record.count.toString(),
          'X-Requests-Remaining': Math.max(0, FOREIGN_MAX_REQUESTS - record.count).toString()
        }
      })
    }
    
    // XỬ LÝ IP VIỆT NAM với rate limit thông thường
    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, {
        count: 0,
        resetTime: now + WINDOW_MS,
        violations: 0,
        isBanned: false
      })
      logActivity('🆕 NEW VIETNAM IP - Created tracking record', ip)
    }

    const record = rateLimit.get(ip)

    // Kiểm tra ban cho IP VN
    if (record.isBanned) {
      if (record.bannedUntil && now > record.bannedUntil) {
        // Hết ban
        record.isBanned = false
        record.violations = 0
        record.count = 1
        record.resetTime = now + WINDOW_MS
        delete record.bannedUntil
        logActivity('✅ VIETNAM IP UNBANNED - Ban period expired', ip)
      } else {
        // Vẫn bị ban
        logActivity('🚫 BLOCKED - Vietnam IP is banned', ip, {
          path,
          bannedUntil: record.bannedUntil ? new Date(record.bannedUntil).toISOString() : 'permanent',
          violations: record.violations
        })
        
        return new Response(JSON.stringify({
          error: 'IP Banned',
          message: 'Too many violations',
          bannedUntil: record.bannedUntil ? new Date(record.bannedUntil).toISOString() : 'permanent'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Ban-Reason': 'Exceeded violation limit',
            'X-Ban-Until': record.bannedUntil ? new Date(record.bannedUntil).toISOString() : 'permanent'
          }
        })
      }
    }

    // Reset window nếu hết hạn
    if (now > record.resetTime) {
      logActivity('🔄 WINDOW RESET - Starting new rate limit window for VN IP', ip, {
        previousCount: record.count,
        previousViolations: record.violations
      })
      record.count = 1
      record.resetTime = now + WINDOW_MS
    } else {
      record.count++
    }

    // Kiểm tra rate limit cho VN
    if (record.count > RATE_LIMIT) {
      record.violations++
      
      logActivity('⚠️  RATE LIMIT EXCEEDED - Vietnam IP', ip, {
        path,
        count: record.count,
        limit: RATE_LIMIT,
        violations: record.violations,
        userAgent: userAgent?.substring(0, 50)
      })

      // Ban nếu quá số lần vi phạm
      if (record.violations >= MAX_VIOLATIONS) {
        record.isBanned = true
        record.bannedUntil = now + BAN_DURATION
        
        logActivity('🚨 VIETNAM IP BANNED - Maximum violations reached', ip, {
          totalViolations: record.violations,
          maxViolations: MAX_VIOLATIONS,
          bannedUntil: new Date(record.bannedUntil).toISOString(),
          lastPath: path,
          banDurationHours: BAN_DURATION / (60 * 60 * 1000)
        })

        return new Response(JSON.stringify({
          error: 'IP Banned',
          message: 'Exceeded maximum violations',
          violations: record.violations,
          maxViolations: MAX_VIOLATIONS,
          bannedUntil: new Date(record.bannedUntil).toISOString()
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Ban-Reason': 'Exceeded violation limit',
            'X-Ban-Until': new Date(record.bannedUntil).toISOString(),
            'X-Violations': record.violations.toString()
          }
        })
      }

      return new Response(JSON.stringify({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests',
        violations: record.violations,
        maxViolations: MAX_VIOLATIONS,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
          'X-Violations': record.violations.toString(),
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
        }
      })
    }

    // ✅ Request từ VN được phép
    logActivity('✅ VIETNAM IP REQUEST ALLOWED', ip, {
      path,
      method,
      count: record.count,
      limit: RATE_LIMIT,
      violations: record.violations,
      remaining: RATE_LIMIT - record.count
    })

    // Cho phép request đi tiếp
    
  } catch (error) {
    // Trong trường hợp lỗi, block để an toàn
    console.error('[MIDDLEWARE CRITICAL ERROR]', error.message, error.stack)
    logActivity('❌ MIDDLEWARE ERROR - BLOCKING REQUEST FOR SAFETY', 'unknown', {
      error: error.message,
      stack: error.stack?.substring(0, 200)
    })
    
    return new Response('Service Temporarily Unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60'
      }
    })
  }
}

export const config = {
  runtime: 'edge'
}
