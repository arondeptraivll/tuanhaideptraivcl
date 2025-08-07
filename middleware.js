// middleware.js (ở root, thay thế api/protection.js)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Simple config
const RATE_LIMIT_VN = 30
const RATE_LIMIT_FOREIGN = 3
const WINDOW_MS = 60 * 1000
const BAN_DURATION = 24 * 60 * 60 * 1000

let VIETNAM_IP_RANGES = []
let lastFetchTime = 0

const SUSPICIOUS_UAS = ['bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto', 'curl', 'wget', 'python']

function getClientIP(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 'unknown'
}

function logSecurity(type, ip, data = {}) {
  console.log(`[${new Date().toISOString()}] ${type} - ${ip}`, JSON.stringify(data))
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet), 0) >>> 0
}

async function fetchVietnamIPs() {
  try {
    const now = Date.now()
    if (VIETNAM_IP_RANGES.length > 0 && (now - lastFetchTime) < 3600000) {
      return VIETNAM_IP_RANGES
    }
    
    const response = await fetch('https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/vietnam_proxy.txt', {
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) throw new Error('Fetch failed')
    
    const text = await response.text()
    const ranges = []
    
    for (const line of text.split('\n')) {
      const match = line.match(/^(\d+\.\d+\.\d+\.\d+)\s*-\s*(\d+\.\d+\.\d+\.\d+)$/)
      if (match) ranges.push([match[1], match[2]])
    }
    
    if (ranges.length > 0) {
      VIETNAM_IP_RANGES = ranges
      lastFetchTime = now
    }
    
    return ranges
  } catch (error) {
    console.error('IP fetch error:', error.message)
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
  if (!ip || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'localhost') {
    return true
  }
  
  const ranges = await fetchVietnamIPs()
  const ipNum = ipToNumber(ip)
  
  for (const [start, end] of ranges) {
    if (ipNum >= ipToNumber(start) && ipNum <= ipToNumber(end)) {
      return true
    }
  }
  
  return false
}

export default async function middleware(request) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const country = request.headers.get('cf-ipcountry') || ''
    const path = url.pathname
    
    // Skip static files
    if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf)$/)) {
      return
    }
    
    logSecurity('REQUEST', ip, { path, method: request.method, ua: userAgent.substring(0, 50) })
    
    // Country check
    if (country && country !== 'VN' && country !== 'XX' && country !== '') {
      logSecurity('BLOCKED_COUNTRY', ip, { country, path })
      return new Response('Access Denied - Vietnam Only', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // Suspicious UA check
    const isSuspiciousUA = SUSPICIOUS_UAS.some(ua => userAgent.toLowerCase().includes(ua))
    
    // Vietnam IP check
    const isVN = await isVietnamIP(ip)
    
    if (!isVN && isSuspiciousUA) {
      logSecurity('BLOCKED_SUSPICIOUS_FOREIGN', ip, { ua: userAgent.substring(0, 100) })
      return new Response('Forbidden', { status: 403 })
    }
    
    // Simple rate limiting with Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        
        const now = Date.now()
        const { data: record } = await supabase
          .from('rate_limits')
          .select('*')
          .eq('ip_address', ip)
          .single()
        
        let newCount = 1
        let violations = 0
        
        if (record) {
          const resetTime = new Date(record.reset_time).getTime()
          
          // Check ban
          if (record.is_banned) {
            const bannedUntil = record.banned_until ? new Date(record.banned_until).getTime() : null
            
            if (!bannedUntil || now < bannedUntil) {
              logSecurity('BLOCKED_BANNED', ip, { path })
              return new Response('IP Banned', { status: 403 })
            } else {
              // Unban
              await supabase.from('rate_limits').update({
                is_banned: false,
                banned_until: null,
                violations: 0,
                request_count: 1,
                reset_time: new Date(now + WINDOW_MS).toISOString()
              }).eq('ip_address', ip)
              
              logSecurity('UNBANNED', ip)
            }
          } else {
            // Count request
            if (now > resetTime) {
              newCount = 1
              await supabase.from('rate_limits').update({
                request_count: newCount,
                reset_time: new Date(now + WINDOW_MS).toISOString()
              }).eq('ip_address', ip)
            } else {
              newCount = record.request_count + 1
              await supabase.from('rate_limits').update({
                request_count: newCount
              }).eq('ip_address', ip)
            }
            
            violations = record.violations
            const rateLimit = isVN ? RATE_LIMIT_VN : RATE_LIMIT_FOREIGN
            
            // Check rate limit
            if (newCount > rateLimit) {
              violations++
              
              logSecurity('RATE_LIMIT_EXCEEDED', ip, { 
                count: newCount, limit: rateLimit, violations 
              })
              
              // Ban if too many violations
              if (violations >= (isVN ? 50 : 3)) {
                await supabase.from('rate_limits').update({
                  is_banned: true,
                  banned_until: new Date(now + BAN_DURATION).toISOString(),
                  violations: violations
                }).eq('ip_address', ip)
                
                logSecurity('BANNED', ip, { violations })
                
                return new Response('Rate Limit Exceeded - IP Banned', { status: 403 })
              } else {
                await supabase.from('rate_limits').update({ violations }).eq('ip_address', ip)
              }
              
              return new Response(JSON.stringify({
                error: 'Rate Limit Exceeded',
                retryAfter: 60
              }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
              })
            }
          }
        } else {
          // Create new record
          await supabase.from('rate_limits').insert({
            ip_address: ip,
            request_count: 1,
            violations: 0,
            is_banned: false,
            reset_time: new Date(now + WINDOW_MS).toISOString(),
            foreign_request_count: isVN ? 0 : 1
          })
          
          logSecurity('NEW_IP', ip, { isVN })
        }
        
        // Block foreign IPs after counting
        if (!isVN) {
          logSecurity('BLOCKED_FOREIGN', ip, { path, count: newCount })
          return new Response('Access Denied - Vietnam Only', {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
          })
        }
        
      } catch (dbError) {
        console.error('DB Error:', dbError.message)
        // Fallback: block foreign IPs without DB
        if (!isVN) {
          return new Response('Access Denied - Vietnam Only', { status: 403 })
        }
      }
    } else {
      // No DB - simple Vietnam-only check
      if (!isVN) {
        logSecurity('BLOCKED_NO_DB', ip, { path })
        return new Response('Access Denied - Vietnam Only', { status: 403 })
      }
    }
    
    // Allow request
    const processingTime = Date.now() - startTime
    logSecurity('ALLOWED', ip, { path, time: `${processingTime}ms` })
    
  } catch (error) {
    console.error('Middleware error:', error.message)
    logSecurity('ERROR', 'unknown', { error: error.message })
    
    // Fail open - allow request on error
    return
  }
}

export const config = {
  runtime: 'edge',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
