const rateLimit = new Map()
const RATE_LIMIT = 20
const WINDOW_MS = 60 * 1000
const MAX_VIOLATIONS = 100
const BAN_DURATION = 24 * 60 * 60 * 1000

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
  // Dọn dẹp IP cũ
  const now = Date.now()
  for (const [ip, record] of rateLimit) {
    if (
      (!record.isBanned && now > record.resetTime + 60 * 1000) ||
      (record.isBanned && record.bannedUntil && now > record.bannedUntil + 60 * 1000)
    ) {
      rateLimit.delete(ip)
      logActivity('🗑️  CLEANUP - Removed expired IP record', ip)
    }
  }

  const ip = getClientIP(request)
  const url = new URL(request.url)
  const path = url.pathname
  const userAgent = request.headers.get('user-agent')

  // Log mọi request
  logActivity('📨 INCOMING REQUEST', ip, {
    method: request.method,
    path,
    userAgent: userAgent?.substring(0, 100) // Cắt ngắn user agent
  })

  // Tạo record nếu chưa có
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, {
      count: 0,
      resetTime: now + WINDOW_MS,
      violations: 0,
      isBanned: false
    })
    logActivity('🆕 NEW IP - Created tracking record', ip)
  }

  const record = rateLimit.get(ip)

  // Kiểm tra ban
  if (record.isBanned) {
    if (record.bannedUntil && now > record.bannedUntil) {
      // Hết ban
      record.isBanned = false
      record.violations = 0
      record.count = 1
      record.resetTime = now + WINDOW_MS
      delete record.bannedUntil
      logActivity('✅ IP UNBANNED - Ban period expired, access restored', ip)
    } else {
      // Vẫn bị ban
      logActivity('🚫 BLOCKED - IP is still banned', ip, {
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
    logActivity('🔄 WINDOW RESET - Starting new rate limit window', ip, {
      previousCount: record.count,
      previousViolations: record.violations
    })
    record.count = 1
    record.resetTime = now + WINDOW_MS
  } else {
    record.count++
  }

  // Kiểm tra rate limit
  if (record.count > RATE_LIMIT) {
    record.violations++
    
    logActivity('⚠️  RATE LIMIT EXCEEDED', ip, {
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
      
      logActivity('🚨 IP BANNED - Maximum violations reached', ip, {
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

  // ✅ QUAN TRỌNG: Không return gì cả, để request đi tiếp đến API thực!
  logActivity('✅ REQUEST ALLOWED', ip, {
    path,
    count: record.count,
    limit: RATE_LIMIT,
    violations: record.violations,
    remaining: RATE_LIMIT - record.count
  })

  // Thêm header thông tin rate limit vào request
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString())
  response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT - record.count).toString())
  response.headers.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString())
  response.headers.set('X-Violations', record.violations.toString())
  
  return response
}

export const config = {
  runtime: 'edge'
}
