import { createClient } from '@supabase/supabase-js'

// Config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

const RATE_LIMITS = {
  VN_NORMAL: 20,
  FOREIGN_MAX: 2,
  WINDOW_MS: 60 * 1000,
  MAX_VIOLATIONS: 50,
  BAN_DURATION: 24 * 60 * 60 * 1000
}

const SUSPICIOUS_USER_AGENTS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 
  'nikto', 'sqlmap', 'python', 'curl', 'wget', 'java'
]

// Cache for Vietnam IP ranges
let VIETNAM_IP_CACHE = { ranges: [], lastUpdate: 0 }
const VIETNAM_IP_LIST_URL = 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/vietnam_proxy.txt'

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  return cfConnectingIP || realIP || forwarded?.split(',')[0]?.trim() || 'unknown'
}

function logSecurity(eventType, ip, severity = 'LOW', metadata = {}) {
  console.log(`[${new Date().toISOString()}] [${severity}] ${eventType} - IP: ${ip}`, metadata)
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet), 0) >>> 0
}

async function fetchVietnamIPRanges() {
  try {
    const now = Date.now()
    if (VIETNAM_IP_CACHE.ranges.length > 0 && (now - VIETNAM_IP_CACHE.lastUpdate) < 3600000) {
      return VIETNAM_IP_CACHE.ranges
    }
    
    const response = await fetch(VIETNAM_IP_LIST_URL, {
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    const ranges = []
    
    for (const line of lines) {
      const match = line.match(/^(\d+\.\d+\.\d+\.\d+)\s*-\s*(\d+\.\d+\.\d+\.\d+)$/)
      if (match) ranges.push([match[1], match[2]])
    }
    
    if (ranges.length > 0) {
      VIETNAM_IP_CACHE.ranges = ranges
      VIETNAM_IP_CACHE.lastUpdate = now
    }
    
    return ranges
  } catch (error) {
    console.error('[IP LIST] Error:', error.message)
    // Fallback ranges
    return [
      ['1.52.0.0', '1.55.255.255'],
      ['14.160.0.0', '14.191.255.255'],
      ['27.64.0.0', '27.79.255.255'],
      ['113.160.0.0', '113.191.255.255'],
      ['171.224.0.0', '171.255.255.255']
    ]
  }
}

async function isVietnamIP(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === 'localhost') return false
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return true
  
  const ranges = await fetchVietnamIPRanges()
  const ipNum = ipToNumber(ip)
  
  for (const [start, end] of ranges) {
    const startNum = ipToNumber(start)
    const endNum = ipToNumber(end)
    if (ipNum >= startNum && ipNum <= endNum) return true
  }
  
  return false
}

async function getRateLimitRecord(ip) {
  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ip)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('[DB] Get record error:', error.message)
    return null
  }
}

async function updateRateLimitRecord(ip, updates) {
  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .upsert({
        ip_address: ip,
        ...updates,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'ip_address'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('[DB] Update record error:', error.message)
    return null
  }
}

export default async function handler(request) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const originalPath = url.searchParams.get('originalPath') || '/'
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const country = request.headers.get('cf-ipcountry') || 'UNKNOWN'
    
    logSecurity('REQUEST', ip, 'INFO', {
      path: originalPath,
      method: request.method,
      userAgent: userAgent.substring(0, 50),
      country
    })
    
    // === SECURITY CHECKS ===
    
    // 1. Suspicious User Agent
    const isSuspiciousUA = SUSPICIOUS_USER_AGENTS.some(ua => 
      userAgent.toLowerCase().includes(ua)
    )
    
    // 2. Vietnam IP Check
    const isVN = await isVietnamIP(ip)
    
    // 3. Country Check (if Cloudflare)
    if (country && country !== 'UNKNOWN' && country !== 'VN' && country !== 'XX') {
      logSecurity('NON_VN_COUNTRY', ip, 'HIGH', { country, path: originalPath })
      
      return new Response('Access Denied - Vietnam Only', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Block-Reason': `Non-Vietnam Country: ${country}`
        }
      })
    }
    
    // 4. Suspicious UA + Foreign IP
    if (!isVN && isSuspiciousUA) {
      logSecurity('SUSPICIOUS_FOREIGN_IP', ip, 'HIGH', {
        userAgent: userAgent.substring(0, 100),
        path: originalPath
      })
      
      return new Response('Forbidden', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // === RATE LIMITING ===
    
    const now = Date.now()
    let record = await getRateLimitRecord(ip)
    
    if (!record) {
      record = {
        request_count: 1,
        violations: 0,
        is_banned: false,
        reset_time: new Date(now + RATE_LIMITS.WINDOW_MS).toISOString(),
        foreign_request_count: isVN ? 0 : 1
      }
      
      await updateRateLimitRecord(ip, record)
      logSecurity('NEW_IP_TRACKED', ip, 'INFO', { isVietnam: isVN })
    }
    
    const resetTime = new Date(record.reset_time).getTime()
    
    // Check ban status
    if (record.is_banned) {
      const bannedUntil = record.banned_until ? new Date(record.banned_until).getTime() : null
      
      if (bannedUntil && now > bannedUntil) {
        // Unban
        await updateRateLimitRecord(ip, {
          is_banned: false,
          banned_until: null,
          violations: Math.max(0, record.violations - 1),
          request_count: 1,
          reset_time: new Date(now + RATE_LIMITS.WINDOW_MS).toISOString()
        })
        logSecurity('IP_UNBANNED', ip, 'INFO')
      } else {
        logSecurity('BANNED_IP_BLOCKED', ip, 'HIGH', { path: originalPath })
        
        return new Response('IP Banned', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
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
      } else {
        newCount = record.request_count + 1
        await updateRateLimitRecord(ip, { request_count: newCount })
      }
      
      // Check rate limits
      const rateLimit = isVN ? RATE_LIMITS.VN_NORMAL : RATE_LIMITS.FOREIGN_MAX
      
      if (newCount > rateLimit) {
        const violations = record.violations + 1
        
        // Ban if too many violations
        if (violations >= RATE_LIMITS.MAX_VIOLATIONS || (!isVN && violations >= 3)) {
          const bannedUntil = now + RATE_LIMITS.BAN_DURATION
          
          await updateRateLimitRecord(ip, {
            is_banned: true,
            banned_until: new Date(bannedUntil).toISOString(),
            violations: violations
          })
          
          logSecurity('IP_BANNED', ip, 'CRITICAL', {
            violations, path: originalPath, isVietnam: isVN
          })
          
          return new Response('Rate Limit Exceeded - IP Banned', {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
          })
        } else {
          await updateRateLimitRecord(ip, { violations })
        }
        
        logSecurity('RATE_LIMIT_EXCEEDED', ip, 'MEDIUM', {
          count: newCount, limit: rateLimit, violations, path: originalPath
        })
        
        return new Response(JSON.stringify({
          error: 'Rate Limit Exceeded',
          retryAfter: Math.ceil((resetTime - now) / 1000)
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((resetTime - now) / 1000).toString()
          }
        })
      }
      
      // Block foreign IPs (after counting)
      if (!isVN) {
        logSecurity('FOREIGN_IP_BLOCKED', ip, 'MEDIUM', {
          path: originalPath, count: newCount
        })
        
        return new Response('Access Denied - Vietnam Only', {
          status: 403,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
    }
    
    // === SERVE CONTENT ===
    
    const processingTime = Date.now() - startTime
    logSecurity('REQUEST_ALLOWED', ip, 'INFO', {
      path: originalPath, processingTime: `${processingTime}ms`
    })
    
    // Handle API requests
    if (originalPath.startsWith('/api/') && originalPath !== '/api/protection') {
      const apiPath = originalPath.replace('/api/', '')
      
      try {
        // Dynamic import API function
        const apiFunction = await import(`./${apiPath}.js`)
        
        if (apiFunction.default) {
          // Convert to standard request/response for API functions
          const response = await apiFunction.default(request)
          return response
        } else {
          return new Response('API function not found', { status: 404 })
        }
      } catch (importError) {
        console.error('[API] Import error:', importError.message)
        return new Response('API not found', { status: 404 })
      }
    }
    
    // Handle static files - redirect to actual file
    return Response.redirect(new URL(originalPath, url.origin), 302)
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('[PROTECTION ERROR]', {
      message: error.message,
      processingTime: `${processingTime}ms`
    })
    
    // Allow request on error (fail open)
    const url = new URL(request.url)
    const originalPath = url.searchParams.get('originalPath') || '/'
    
    return Response.redirect(new URL(originalPath, url.origin), 302)
  }
}
