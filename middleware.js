// middleware.js - Version hoàn chỉnh với Vietnam IP từ GitHub
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Security configs
const RATE_LIMIT_VN = 30
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
    
    const { data: result, error } = await supabase.rpc('handle_rate_limit', {
      input_ip: ip,
      input_limit: isVN ? RATE_LIMIT_VN : RATE_LIMIT_FOREIGN,
      input_window_ms: WINDOW_MS,
      input_ban_duration: BAN_DURATION,
      input_is_vn: isVN,
      input_country: country,
      input_ua_hash: uaHash
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

export default async function middleware(request) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const path = url.pathname
    
    // Skip static files
    if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map)$/)) {
      return
    }
    
    // Extract và validate IP
    const ip = getClientIP(request)
    
    // FAIL-SECURE: Block nếu không thể xác định IP thật
    if (!ip) {
      logSecurity('BLOCKED_NO_IP', 'unknown', { path })
      return new Response('Access Denied', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    const userAgent = request.headers.get('user-agent') || ''
    const country = request.headers.get('cf-ipcountry') || ''
    const method = request.method
    
    logSecurity('REQUEST', ip, { 
      path, 
      method, 
      country 
    })
    
    // Country-based blocking (Cloudflare header)
    if (country && country !== 'VN' && country !== 'XX' && country !== '') {
      logSecurity('BLOCKED_COUNTRY', ip, { country, path })
      
      // Log security event if DB available
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'COUNTRY_BLOCK', 'MEDIUM', {
          country, path, userAgent: userAgent.substring(0, 100)
        })
      }
      
      return new Response('Access Denied - Vietnam Only', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // Suspicious User Agent check
    const isSuspiciousUA = SUSPICIOUS_UAS.some(ua => 
      userAgent.toLowerCase().includes(ua)
    )
    
    // Vietnam IP validation
    const isVN = await isVietnamIP(ip)
    
    // Block suspicious foreign requests immediately
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
      
      return new Response('Forbidden', { status: 403 })
    }
    
    // Rate limiting với Supabase
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
        return new Response('IP Banned', { status: 403 })
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
        
        return new Response(JSON.stringify({
          error: 'Rate Limit Exceeded',
          retryAfter: 60
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        })
      }
    }
    
    // Final foreign IP block (sau khi đã count request)
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
      
      return new Response('Access Denied - Vietnam Only', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // Allow request
    const processingTime = Date.now() - startTime
    logSecurity('ALLOWED', ip, { 
      path, 
      time: `${processingTime}ms` 
    })
    
  } catch (error) {
    console.error('Middleware critical error:', error.message)
    
    // FAIL-SECURE: Block request khi có lỗi
    return new Response('Service Temporarily Unavailable', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

export const config = {
  runtime: 'edge',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
