// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

// Lưu trữ thông tin rate limit và ban status
const rateLimit = new Map<string, {
  count: number
  resetTime: number
  violations: number
  isBanned: boolean
  bannedUntil?: number
}>()

const RATE_LIMIT = 20 // 20 requests per minute
const WINDOW_MS = 60 * 1000 // 1 phút
const MAX_VIOLATIONS = 100 // Ban sau 100 lần vi phạm
const BAN_DURATION = 24 * 60 * 60 * 1000 // Ban 24 giờ

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  return cfConnectingIP || realIP || forwarded?.split(',')[0] || 'unknown'
}

function logActivity(message: string, ip: string, extra?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message} - IP: ${ip}`, extra ? JSON.stringify(extra) : '')
}

export function middleware(request: NextRequest) {
  const ip = getClientIP(request)
  const now = Date.now()
  const path = request.nextUrl.pathname

  // Lấy hoặc tạo record cho IP
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, {
      count: 0,
      resetTime: now + WINDOW_MS,
      violations: 0,
      isBanned: false
    })
  }

  const record = rateLimit.get(ip)!

  // Kiểm tra nếu IP đã bị ban
  if (record.isBanned) {
    if (record.bannedUntil && now > record.bannedUntil) {
      // Hết thời gian ban, reset
      record.isBanned = false
      record.violations = 0
      record.count = 0
      record.resetTime = now + WINDOW_MS
      delete record.bannedUntil
      logActivity('IP UNBANNED - Ban period expired', ip)
    } else {
      logActivity('BLOCKED REQUEST - IP is banned', ip, {
        path,
        userAgent: request.headers.get('user-agent'),
        bannedUntil: record.bannedUntil ? new Date(record.bannedUntil).toISOString() : 'permanent'
      })
      return new NextResponse('IP Banned - Too many violations', { 
        status: 403,
        headers: {
          'X-Ban-Reason': 'Exceeded violation limit',
          'X-Ban-Until': record.bannedUntil ? new Date(record.bannedUntil).toISOString() : 'permanent'
        }
      })
    }
  }

  // Reset counter nếu hết window
  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + WINDOW_MS
    return NextResponse.next()
  }

  // Tăng counter
  record.count++

  // Kiểm tra rate limit
  if (record.count > RATE_LIMIT) {
    record.violations++
    
    logActivity('RATE LIMIT EXCEEDED', ip, {
      path,
      count: record.count,
      limit: RATE_LIMIT,
      violations: record.violations,
      userAgent: request.headers.get('user-agent')
    })

    // Kiểm tra nếu đạt ngưỡng ban
    if (record.violations >= MAX_VIOLATIONS) {
      record.isBanned = true
      record.bannedUntil = now + BAN_DURATION
      
      logActivity('🚨 IP BANNED - Exceeded violation limit', ip, {
        totalViolations: record.violations,
        maxViolations: MAX_VIOLATIONS,
        bannedUntil: new Date(record.bannedUntil).toISOString(),
        userAgent: request.headers.get('user-agent'),
        lastPath: path
      })

      return new NextResponse('IP Banned - Too many violations', { 
        status: 403,
        headers: {
          'X-Ban-Reason': 'Exceeded violation limit',
          'X-Ban-Until': new Date(record.bannedUntil).toISOString(),
          'X-Violations': record.violations.toString()
        }
      })
    }

    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        'X-Violations': record.violations.toString(),
        'X-Violations-Limit': MAX_VIOLATIONS.toString(),
        'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
      }
    })
  }

  // Log normal requests (optional, có thể bỏ để giảm log)
  if (record.count === 1) {
    logActivity('New request window started', ip, {
      path,
      violations: record.violations
    })
  }

  return NextResponse.next({
    headers: {
      'X-RateLimit-Limit': RATE_LIMIT.toString(),
      'X-RateLimit-Remaining': (RATE_LIMIT - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
      'X-Violations': record.violations.toString()
    }
  })
}

// Cấu hình matcher - áp dụng cho tất cả routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
