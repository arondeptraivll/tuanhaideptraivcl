const rateLimit = new Map()
const RATE_LIMIT = 20 // Cho IP VN
const FOREIGN_MAX_REQUESTS = 3 // Chỉ 3 request cho IP nước ngoài trước khi BAN
const WINDOW_MS = 60 * 1000
const MAX_VIOLATIONS = 100
const BAN_DURATION = 24 * 60 * 60 * 1000
const PERMANENT_BAN_DURATION = 365 * 24 * 60 * 60 * 1000 // Ban 1 năm cho foreign IP vi phạm nhiều

// IP Ranges Việt Nam - CẬP NHẬT FULL
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
  ['104.28.0.0', '104.28.255.255'],
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
  ['192.168.0.0', '192.168.255.255'], // Local IPs cho dev
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

// Thêm các User-Agent đáng ngờ để block
const SUSPICIOUS_USER_AGENTS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 
  'nikto', 'sqlmap', 'python', 'curl', 'wget', 'java',
  'go-http-client', 'okhttp', 'postman', 'insomnia'
]

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet), 0) >>> 0
}

function isVietnamIP(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === 'localhost') {
    return false // Từ chối unknown/localhost
  }
  
  // Cho phép IP private cho development
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return true
  }
  
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
    
    if (suspiciousUA && !isVietnamIP(ip)) {
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
    const isVN = isVietnamIP(ip)
    
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
