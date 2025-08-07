import { createClient } from '@supabase/supabase-js'

// ====================================
// CONFIGURATION
// ====================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: { headers: { 'x-application-name': 'ddos-protection' } }
})

// Rate limiting config
const RATE_LIMITS = {
  VN_NORMAL: 15,           // Request/phút cho IP VN bình thường
  VN_SUSPICIOUS: 5,        // Request/phút cho IP VN nghi ngờ
  FOREIGN_MAX: 1,          // Request/phút cho IP nước ngoài (nghiêm ngặt)
  WINDOW_MS: 60 * 1000,    // 1 phút
  MAX_VIOLATIONS: 25,      // Số lần vi phạm tối đa trước khi ban
  BAN_DURATION: 24 * 60 * 60 * 1000,        // 24 giờ
  PERMANENT_BAN_DURATION: 365 * 24 * 60 * 60 * 1000 // 1 năm
}

// Security patterns
const SECURITY_PATTERNS = {
  SUSPICIOUS_USER_AGENTS: [
    'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto', 'sqlmap', 
    'python', 'curl', 'wget', 'java', 'go-http-client', 'okhttp', 'postman', 
    'insomnia', 'masscan', 'nmap', 'dirbuster', 'gobuster', 'dirb'
  ],
  SUSPICIOUS_PATHS: [
    '/admin', '/wp-admin', '/wp-login', '/phpmyadmin', '/cpanel', '/cgi-bin',
    '/.env', '/config', '/backup', '/test', '/api/v1', '/graphql', '/swagger'
  ],
  MALICIOUS_EXTENSIONS: [
    '.php', '.asp', '.jsp', '.cgi', '.sh', '.bat', '.cmd', '.sql', '.bak'
  ]
}

// Cache for Vietnam IP ranges
let VIETNAM_IP_CACHE = {
  ranges: [],
  lastUpdate: 0,
  CACHE_DURATION: 60 * 60 * 1000 // 1 giờ
}

const VIETNAM_IP_LIST_URL = 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/vietnam_proxy.txt'

// ====================================
// UTILITY FUNCTIONS
// ====================================

function logSecurity(eventType, ip, severity = 'LOW', metadata = {}) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${severity}] ${eventType} - IP: ${ip}`, metadata)
  
  // Log to database (fire and forget)
  supabase.from('security_logs').insert({
    ip_address: ip,
    event_type: eventType,
    severity,
    path: metadata.path || null,
    user_agent: metadata.userAgent || null,
    country_code: metadata.country || null,
    headers: metadata.headers || null,
    metadata: metadata
  }).then(({ error }) => {
    if (error) console.error('[LOG ERROR]', error.message)
  })
}

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  // Prioritize Cloudflare IP if available
  let ip = cfConnectingIP || realIP || forwarded?.split(',')[0]?.trim() || 'unknown'
  
  // Clean IP
  if (ip.includes(':')) {
    ip = ip.split(':')[0] // Remove port if present
  }
  
  return ip
}

function createFingerprint(request, ip) {
  const userAgent = request.headers.get('user-agent') || ''
  const accept = request.headers.get('accept') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  
  const fingerprint = `${ip}:${userAgent}:${accept}:${acceptEncoding}:${acceptLanguage}`
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet), 0) >>> 0
}

async function fetchVietnamIPRanges() {
  try {
    const now = Date.now()
    
    // Check cache
    if (VIETNAM_IP_CACHE.ranges.length > 0 && 
        (now - VIETNAM_IP_CACHE.lastUpdate) < VIETNAM_IP_CACHE.CACHE_DURATION) {
      return VIETNAM_IP_CACHE.ranges
    }
    
    console.log('[IP LIST] Fetching Vietnam IP ranges...')
    
    const response = await fetch(VIETNAM_IP_LIST_URL, {
      headers: { 'User-Agent': 'Vietnam-Protection/2.0' },
      signal: AbortSignal.timeout(10000) // 10s timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    const ranges = []
    
    for (const line of lines) {
      const match = line.match(/^(\d+\.\d+\.\d+\.\d+)\s*-\s*(\d+\.\d+\.\d+\.\d+)$/)
      if (match) {
        ranges.push([match[1], match[2]])
      }
    }
    
    if (ranges.length > 0) {
      VIETNAM_IP_CACHE.ranges = ranges
      VIETNAM_IP_CACHE.lastUpdate = now
      
      // Update database cache
      await updateVietnamIPDatabase(ranges)
      
      console.log(`[IP LIST] Loaded ${ranges.length} IP ranges`)
      return ranges
    }
    
    throw new Error('No valid ranges found')
    
  } catch (error) {
    console.error('[IP LIST] Fetch error:', error.message)
    
    // Fallback to database cache
    const dbRanges = await getVietnamIPFromDatabase()
    if (dbRanges.length > 0) {
      VIETNAM_IP_CACHE.ranges = dbRanges
      return dbRanges
    }
    
    // Ultimate fallback - hardcoded ranges
    const backupRanges = [
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
    
    VIETNAM_IP_CACHE.ranges = backupRanges
    console.log('[IP LIST] Using backup ranges')
    return backupRanges
  }
}

async function updateVietnamIPDatabase(ranges) {
  try {
    // Clear old ranges
    await supabase.from('vietnam_ip_ranges').delete().neq('id', 0)
    
    // Insert new ranges
    const records = ranges.map(([start, end]) => ({
      start_ip: start,
      end_ip: end,
      start_numeric: ipToNumber(start),
      end_numeric: ipToNumber(end)
    }))
    
    await supabase.from('vietnam_ip_ranges').insert(records)
    console.log('[DB] Updated Vietnam IP ranges in database')
  } catch (error) {
    console.error('[DB] Error updating IP ranges:', error.message)
  }
}

async function getVietnamIPFromDatabase() {
  try {
    const { data, error } = await supabase
      .from('vietnam_ip_ranges')
      .select('start_ip, end_ip')
    
    if (error) throw error
    
    return data.map(row => [row.start_ip, row.end_ip])
  } catch (error) {
    console.error('[DB] Error getting IP ranges:', error.message)
    return []
  }
}

async function isVietnamIP(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === 'localhost') {
    return false
  }
  
  // Allow private IPs for development
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
      ip.startsWith('172.16.') || ip.startsWith('127.') || ip === '::1') {
    return true
  }
  
  // IPv6 to IPv4 mapping
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7)
  }
  
  const ranges = await fetchVietnamIPRanges()
  const ipNum = ipToNumber(ip)
  
  for (const [start, end] of ranges) {
    const startNum = ipToNumber(start)
    const endNum = ipToNumber(end)
    if (ipNum >= startNum && ipNum <= endNum) {
      return true
    }
  }
  
  return false
}

// ====================================
// DATABASE FUNCTIONS
// ====================================

async function getRateLimitRecord(ip) {
  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ip)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('[DB] Get record error:', error.message)
    return null
  }
}

async function createRateLimitRecord(ip, isVietnam, fingerprint, userAgent, country) {
  try {
    const now = new Date()
    const resetTime = new Date(now.getTime() + RATE_LIMITS.WINDOW_MS)
    
    const record = {
      ip_address: ip,
      request_count: 1,
      foreign_request_count: isVietnam ? 0 : 1,
      violations: 0,
      is_banned: false,
      reset_time: resetTime.toISOString(),
      first_foreign_request: isVietnam ? null : now.toISOString(),
      user_agent_hash: fingerprint,
      country_code: country,
      last_activity: now.toISOString(),
      updated_at: now.toISOString()
    }
    
    const { data, error } = await supabase
      .from('rate_limits')
      .insert(record)
      .select()
      .single()
    
    if (error) throw error
    
    logSecurity('NEW_IP_TRACKED', ip, 'INFO', { 
      isVietnam, fingerprint, userAgent: userAgent?.substring(0, 100) 
    })
    
    return data
  } catch (error) {
    console.error('[DB] Create record error:', error.message)
    return null
  }
}

async function updateRateLimitRecord(ip, updates) {
  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .update({
        ...updates,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('ip_address', ip)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('[DB] Update record error:', error.message)
    return null
  }
}

async function performCleanup() {
  try {
    // Call the database cleanup function
    const { error } = await supabase.rpc('cleanup_old_records')
    
    if (error) throw error
    
    logSecurity('CLEANUP_COMPLETED', 'system', 'INFO')
  } catch (error) {
    console.error('[CLEANUP] Error:', error.message)
  }
}

// ====================================
// SECURITY CHECKS
// ====================================

function checkSuspiciousUserAgent(userAgent, ip) {
  if (!userAgent) return true
  
  const ua = userAgent.toLowerCase()
  const suspicious = SECURITY_PATTERNS.SUSPICIOUS_USER_AGENTS.some(pattern => 
    ua.includes(pattern)
  )
  
  if (suspicious) {
    logSecurity('SUSPICIOUS_USER_AGENT', ip, 'HIGH', { userAgent })
  }
  
  return suspicious
}

function checkSuspiciousPath(path, ip) {
  const suspicious = SECURITY_PATTERNS.SUSPICIOUS_PATHS.some(pattern =>
    path.toLowerCase().includes(pattern)
  ) || SECURITY_PATTERNS.MALICIOUS_EXTENSIONS.some(ext =>
    path.toLowerCase().endsWith(ext)
  )
  
  if (suspicious) {
    logSecurity('SUSPICIOUS_PATH', ip, 'HIGH', { path })
  }
  
  return suspicious
}

function checkMaliciousRequest(request, ip) {
  const url = new URL(request.url)
  const path = url.pathname
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check for common attack patterns
  const maliciousPatterns = [
    /[<>\"']/,  // XSS attempts
    /union.*select/i,  // SQL injection
    /\.\.\//,  // Directory traversal
    /evalKATEX_INLINE_OPEN/i,  // Code injection
    /base64_decode/i,  // Suspicious functions
  ]
  
  const queryString = url.search
  const isMalicious = maliciousPatterns.some(pattern => 
    pattern.test(path) || pattern.test(queryString) || pattern.test(userAgent)
  )
  
  if (isMalicious) {
    logSecurity('MALICIOUS_REQUEST', ip, 'CRITICAL', { 
      path, query: queryString, userAgent: userAgent.substring(0, 100) 
    })
  }
  
  return isMalicious
}

// ====================================
// MAIN MIDDLEWARE
// ====================================

export default async function middleware(request) {
  const startTime = Date.now()
  
  try {
    // Random cleanup (0.1% of requests)
    if (Math.random() < 0.001) {
      performCleanup().catch(console.error)
    }

    const ip = getClientIP(request)
    const url = new URL(request.url)
    const path = url.pathname
    const userAgent = request.headers.get('user-agent') || ''
    const method = request.method
    const country = request.headers.get('cf-ipcountry') || 'UNKNOWN'
    const fingerprint = createFingerprint(request, ip)
    
    const now = Date.now()
    const nowDate = new Date(now)
    
    // === SECURITY CHECKS ===
    
    // 1. Check for malicious requests
    if (checkMaliciousRequest(request, ip)) {
      return new Response('Forbidden', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': 'Malicious Request Pattern'
        }
      })
    }
    
    // 2. Check suspicious paths
    if (checkSuspiciousPath(path, ip)) {
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': 'Suspicious Path'
        }
      })
    }
    
    // 3. Check Vietnam IP
    const isVN = await isVietnamIP(ip)
    
    // 4. Check Cloudflare country (if available)
    if (country && country !== 'UNKNOWN' && country !== 'VN' && country !== 'XX') {
      logSecurity('NON_VN_COUNTRY', ip, 'HIGH', { country, path, method })
      
      return new Response('Access Denied - Vietnam Only', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': `Non-Vietnam Country: ${country}`,
          'X-Country': country
        }
      })
    }
    
    // 5. Check suspicious user agent for foreign IPs
    if (!isVN && checkSuspiciousUserAgent(userAgent, ip)) {
      return new Response('Forbidden', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': 'Suspicious Activity from Foreign IP'
        }
      })
    }
    
    // === RATE LIMITING ===
    
    logSecurity(isVN ? 'VN_REQUEST' : 'FOREIGN_REQUEST', ip, 'INFO', {
      method, path, userAgent: userAgent.substring(0, 100), isVietnam: isVN, country
    })
    
    // Get or create rate limit record
    let record = await getRateLimitRecord(ip)
    
    if (!record) {
      record = await createRateLimitRecord(ip, isVN, fingerprint, userAgent, country)
      if (!record) {
        return new Response('Service Temporarily Unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain', 'Retry-After': '60' }
        })
      }
    }
    
    const resetTime = new Date(record.reset_time).getTime()
    
    // === FOREIGN IP HANDLING ===
    if (!isVN) {
      // Check if banned
      if (record.is_banned) {
        const bannedUntil = record.banned_until ? new Date(record.banned_until).getTime() : null
        
        if (bannedUntil && now > bannedUntil) {
          // Unban expired
          await updateRateLimitRecord(ip, {
            is_banned: false,
            banned_until: null,
            violations: Math.max(0, record.violations - 1), // Reduce violations on unban
            request_count: 1,
            foreign_request_count: (record.foreign_request_count || 0) + 1,
            reset_time: new Date(now + RATE_LIMITS.WINDOW_MS).toISOString()
          })
          
          logSecurity('FOREIGN_IP_UNBANNED', ip, 'INFO')
        } else {
          // Still banned
          logSecurity('BANNED_FOREIGN_ACCESS_ATTEMPT', ip, 'HIGH', { 
            path, bannedUntil: bannedUntil ? new Date(bannedUntil).toISOString() : 'permanent' 
          })
          
          // Extend ban for persistent attempts
          if (bannedUntil) {
            await updateRateLimitRecord(ip, {
              banned_until: new Date(now + RATE_LIMITS.BAN_DURATION * 2).toISOString()
            })
          }
          
          return new Response('IP Banned', {
            status: 403,
            headers: {
              'Content-Type': 'text/plain',
              'X-Ban-Reason': 'Foreign IP Violations',
              'X-Ban-Status': bannedUntil ? 'TEMPORARY' : 'PERMANENT'
            }
          })
        }
      } else {
        // Count request
        let newCount = record.request_count
        let newForeignCount = (record.foreign_request_count || 0) + 1
        
        // Reset window if expired
        if (now > resetTime) {
          newCount = 1
          await updateRateLimitRecord(ip, {
            request_count: newCount,
            foreign_request_count: newForeignCount,
            reset_time: new Date(now + RATE_LIMITS.WINDOW_MS).toISOString()
          })
        } else {
          newCount = record.request_count + 1
          await updateRateLimitRecord(ip, {
            request_count: newCount,
            foreign_request_count: newForeignCount
          })
        }
        
        // Check rate limit
        if (newCount > RATE_LIMITS.FOREIGN_MAX) {
          const violations = record.violations + 1
          const bannedUntil = violations >= 3 ? 
            now + RATE_LIMITS.PERMANENT_BAN_DURATION : 
            now + RATE_LIMITS.BAN_DURATION
          
          await updateRateLimitRecord(ip, {
            is_banned: true,
            banned_until: new Date(bannedUntil).toISOString(),
            violations: violations
          })
          
          logSecurity('FOREIGN_IP_BANNED', ip, 'CRITICAL', {
            count: newCount, limit: RATE_LIMITS.FOREIGN_MAX, violations, 
            totalForeignRequests: newForeignCount
          })
          
          return new Response('Rate Limit Exceeded - IP Banned', {
            status: 403,
            headers: {
              'Content-Type': 'text/plain',
              'X-Ban-Reason': 'Foreign IP Rate Limit Exceeded',
              'X-Ban-Until': new Date(bannedUntil).toISOString()
            }
          })
        }
        
        // Block all foreign requests (after counting)
        logSecurity('FOREIGN_IP_BLOCKED', ip, 'MEDIUM', {
          path, method, count: newCount, maxAllowed: RATE_LIMITS.FOREIGN_MAX,
          totalForeignRequests: newForeignCount
        })
        
        return new Response('Access Denied - Vietnam Only\nThis service is restricted to Vietnam IP addresses.', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'X-Block-Reason': 'Non-Vietnam IP Address',
            'X-Request-Count': newCount.toString(),
            'X-Requests-Remaining': Math.max(0, RATE_LIMITS.FOREIGN_MAX - newCount).toString()
          }
        })
      }
    }
    
    // === VIETNAM IP HANDLING ===
    else {
      // Check if banned
      if (record.is_banned) {
        const bannedUntil = record.banned_until ? new Date(record.banned_until).getTime() : null
        
        if (bannedUntil && now > bannedUntil) {
          // Unban expired
          await updateRateLimitRecord(ip, {
            is_banned: false,
            banned_until: null,
            violations: Math.max(0, record.violations - 5), // Bigger reduction for VN IPs
            request_count: 1,
            reset_time: new Date(now + RATE_LIMITS.WINDOW_MS).toISOString()
          })
          
          logSecurity('VN_IP_UNBANNED', ip, 'INFO')
        } else {
          // Still banned
          logSecurity('BANNED_VN_ACCESS_ATTEMPT', ip, 'MEDIUM', { 
            path, bannedUntil: bannedUntil ? new Date(bannedUntil).toISOString() : 'permanent' 
          })
          
          return new Response(JSON.stringify({
            error: 'IP Banned',
            message: 'Too many violations detected',
            bannedUntil: bannedUntil ? new Date(bannedUntil).toISOString() : 'permanent',
            appeal: 'Contact support if you believe this is an error'
          }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'X-Ban-Reason': 'Rate Limit Violations'
            }
          })
        }
      } else {
        // Count request
        let newCount = record.request_count
        
        // Reset window if expired
        if (now > resetTime) {
          newCount = 1
          await updateRateLimitRecord(ip, {
            request_count: newCount,
            reset_time: new Date(now + RATE_LIMITS.WINDOW_MS).toISOString()
          })
          logSecurity('VN_WINDOW_RESET', ip, 'INFO', { previousCount: record.request_count })
        } else {
          newCount = record.request_count + 1
          await updateRateLimitRecord(ip, { request_count: newCount })
        }
        
        // Determine rate limit based on suspicion level
        const isSuspicious = checkSuspiciousUserAgent(userAgent, ip) || 
                           checkSuspiciousPath(path, ip)
        const rateLimit = isSuspicious ? RATE_LIMITS.VN_SUSPICIOUS : RATE_LIMITS.VN_NORMAL
        
        // Check rate limit
        if (newCount > rateLimit) {
          const violations = record.violations + 1
          
          logSecurity('VN_RATE_LIMIT_EXCEEDED', ip, 'MEDIUM', {
            path, count: newCount, limit: rateLimit, violations, suspicious: isSuspicious,
            userAgent: userAgent?.substring(0, 50)
          })
          
          // Ban if too many violations
          if (violations >= RATE_LIMITS.MAX_VIOLATIONS) {
            const bannedUntil = now + RATE_LIMITS.BAN_DURATION
            
            await updateRateLimitRecord(ip, {
              is_banned: true,
              banned_until: new Date(bannedUntil).toISOString(),
              violations: violations
            })
            
            logSecurity('VN_IP_BANNED', ip, 'HIGH', {
              totalViolations: violations, maxViolations: RATE_LIMITS.MAX_VIOLATIONS,
              bannedUntil: new Date(bannedUntil).toISOString(), lastPath: path
            })
            
            return new Response(JSON.stringify({
              error: 'IP Banned',
              message: 'Maximum violations exceeded',
              violations: violations,
              maxViolations: RATE_LIMITS.MAX_VIOLATIONS,
              bannedUntil: new Date(bannedUntil).toISOString()
            }), {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'X-Ban-Reason': 'Exceeded violation limit',
                'X-Ban-Until': new Date(bannedUntil).toISOString()
              }
            })
          } else {
            await updateRateLimitRecord(ip, { violations })
          }
          
          return new Response(JSON.stringify({
            error: 'Rate Limit Exceeded',
            message: 'Too many requests',
            violations: violations,
            maxViolations: RATE_LIMITS.MAX_VIOLATIONS,
            retryAfter: Math.ceil((resetTime - now) / 1000),
            rateLimit: rateLimit,
            suspicious: isSuspicious
          }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(resetTime).toISOString(),
              'X-Violations': violations.toString(),
              'Retry-After': Math.ceil((resetTime - now) / 1000).toString()
            }
          })
        }
        
        // ✅ Request allowed
        const processingTime = Date.now() - startTime
        
        logSecurity('VN_REQUEST_ALLOWED', ip, 'INFO', {
          path, method, count: newCount, limit: rateLimit, violations: record.violations,
          remaining: rateLimit - newCount, processingTime: `${processingTime}ms`,
          suspicious: isSuspicious
        })
        
        // Add security headers to response
        const response = NextResponse.next()
        response.headers.set('X-RateLimit-Limit', rateLimit.toString())
        response.headers.set('X-RateLimit-Remaining', (rateLimit - newCount).toString())
        response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())
        response.headers.set('X-Processing-Time', `${processingTime}ms`)
        
        return response
      }
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('[MIDDLEWARE CRITICAL ERROR]', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      processingTime: `${processingTime}ms`
    })
    
    logSecurity('MIDDLEWARE_ERROR', 'unknown', 'CRITICAL', {
      error: error.message, processingTime: `${processingTime}ms`
    })
    
    // Fail securely - block on error
    return new Response('Service Temporarily Unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60',
        'X-Error': 'Middleware Error'
      }
    })
  }
}

export const config = {
  runtime: 'edge',
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (if any)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
