import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const RATE_LIMIT_VN = 50
const RATE_LIMIT_FOREIGN = 3
const WINDOW_MS = 60 * 1000
const BAN_DURATION = 24 * 60 * 60 * 1000

const TRUSTED_PROXIES = [
  '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '104.16.0.0/13', '108.162.192.0/18', '131.0.72.0/22',
  '141.101.64.0/18', '162.158.0.0/15', '172.64.0.0/13',
  '173.245.48.0/20', '188.114.96.0/20', '190.93.240.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '76.76.19.0/24'
]

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

let VIETNAM_IP_RANGES = []
let lastFetchTime = 0
let fetchAttempts = 0
const MAX_FETCH_ATTEMPTS = 3
const CACHE_DURATION = 6 * 60 * 60 * 1000

const SUSPICIOUS_UAS = [
  'bot', 'spider', 'crawl', 'scraper', 'scan', 'hack', 'nikto',
  'curl', 'wget', 'python', 'go-http', 'masscan', 'nmap', 'sqlmap'
]

class BehaviorAnalyzer {
  constructor() {
    this.patterns = new Map()
    this.cleanup()
  }

  cleanup() {
    setInterval(() => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      for (const [ip, pattern] of this.patterns) {
        if (pattern.lastRequest < cutoff) {
          this.patterns.delete(ip)
        }
      }
    }, 60 * 60 * 1000)
  }

  createNewPattern() {
    return {
      lastRequest: 0,
      paths: [],
      userAgents: [],
      timings: [],
      intervals: [],
      session: {
        startTime: Date.now(),
        pageViews: 0,
        backNavigation: 0,
        uniquePaths: new Set()
      }
    }
  }

  analyzeRequest(ip, request, timing) {
    const pattern = this.patterns.get(ip) || this.createNewPattern()
    const now = Date.now()
    
    const metrics = {
      requestInterval: this.calculateInterval(pattern.lastRequest, now),
      pathPattern: this.analyzePathPattern(new URL(request.url).pathname, pattern.paths),
      userAgentConsistency: this.checkUAConsistency(request.headers.get('user-agent'), pattern.userAgents),
      timingPattern: this.analyzeTimingPattern(timing, pattern.timings),
      sessionBehavior: this.analyzeSessionBehavior(request, pattern.session)
    }

    this.updatePattern(ip, pattern, request, timing, now)
    return this.calculateBotScore(metrics)
  }

  calculateInterval(lastRequest, now) {
    if (!lastRequest) return 0
    
    const interval = now - lastRequest
    
    if (interval < 1000) return 30
    if (interval % 1000 === 0) return 25
    if (interval < 3000) return 15
    if (interval > 60000) return 5
    
    return 0
  }

  analyzePathPattern(currentPath, previousPaths) {
    if (previousPaths.length < 5) return 0
    
    const isSequential = this.checkSequentialAccess(previousPaths)
    const isAlphabetical = this.checkAlphabeticalOrder(previousPaths)
    const hasBackBehavior = this.checkBackBehavior(previousPaths)
    const repeatPattern = this.checkRepeatPattern(previousPaths)
    
    let score = 0
    if (isSequential) score += 20
    if (isAlphabetical) score += 15
    if (!hasBackBehavior) score += 10
    if (repeatPattern > 3) score += 25
    
    return Math.min(score, 50)
  }

  checkSequentialAccess(paths) {
    if (paths.length < 3) return false
    const numbers = paths.map(p => {
      const match = p.match(/(\d+)/)
      return match ? parseInt(match[1]) : null
    }).filter(n => n !== null)
    
    if (numbers.length < 3) return false
    
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i-1] + 1) return false
    }
    return true
  }

  checkAlphabeticalOrder(paths) {
    if (paths.length < 3) return false
    const sortedPaths = [...paths].sort()
    return JSON.stringify(paths) === JSON.stringify(sortedPaths)
  }

  checkBackBehavior(paths) {
    if (paths.length < 5) return true
    const uniquePaths = new Set(paths)
    return uniquePaths.size < paths.length * 0.8
  }

  checkRepeatPattern(paths) {
    const pathCounts = {}
    paths.forEach(path => {
      pathCounts[path] = (pathCounts[path] || 0) + 1
    })
    return Math.max(...Object.values(pathCounts))
  }

  checkUAConsistency(userAgent, previousUAs) {
    if (!userAgent || previousUAs.length === 0) return 0
    
    const lastUA = previousUAs[previousUAs.length - 1]
    if (userAgent !== lastUA) return 20
    
    const uniqueUAs = new Set(previousUAs)
    if (uniqueUAs.size > 1) return 15
    
    return 0
  }

  analyzeTimingPattern(currentTiming, previousTimings) {
    if (previousTimings.length < 10) return 0
    
    const variance = this.calculateVariance(previousTimings)
    const avgTime = previousTimings.reduce((a, b) => a + b, 0) / previousTimings.length
    
    if (variance < 50 && avgTime < 200) return 30
    if (variance < 100) return 15
    
    return 0
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
  }

  analyzeSessionBehavior(request, session) {
    const url = new URL(request.url)
    const path = url.pathname
    
    session.pageViews++
    session.uniquePaths.add(path)
    
    const pathRatio = session.uniquePaths.size / session.pageViews
    const sessionDuration = Date.now() - session.startTime
    
    if (pathRatio < 0.3 && session.pageViews > 10) return 20
    if (sessionDuration < 10000 && session.pageViews > 20) return 25
    
    return 0
  }

  updatePattern(ip, pattern, request, timing, now) {
    const url = new URL(request.url)
    const userAgent = request.headers.get('user-agent') || ''
    
    pattern.lastRequest = now
    pattern.paths.push(url.pathname)
    pattern.userAgents.push(userAgent)
    pattern.timings.push(timing)
    
    if (pattern.paths.length > 50) pattern.paths = pattern.paths.slice(-25)
    if (pattern.userAgents.length > 20) pattern.userAgents = pattern.userAgents.slice(-10)
    if (pattern.timings.length > 30) pattern.timings = pattern.timings.slice(-15)
    
    this.patterns.set(ip, pattern)
  }

  calculateBotScore(metrics) {
    const weights = {
      requestInterval: 0.3,
      pathPattern: 0.25,
      userAgentConsistency: 0.15,
      timingPattern: 0.2,
      sessionBehavior: 0.1
    }
    
    let totalScore = 0
    for (const [metric, score] of Object.entries(metrics)) {
      totalScore += score * weights[metric]
    }
    
    return Math.min(Math.round(totalScore), 100)
  }
}

class DeviceFingerprinter {
  generateFingerprint(request) {
    const headers = {
      userAgent: request.headers.get('user-agent'),
      acceptLanguage: request.headers.get('accept-language'),
      acceptEncoding: request.headers.get('accept-encoding'),
      connection: request.headers.get('connection'),
      upgradeInsecureRequests: request.headers.get('upgrade-insecure-requests'),
      secFetchSite: request.headers.get('sec-fetch-site'),
      secFetchMode: request.headers.get('sec-fetch-mode'),
      secFetchDest: request.headers.get('sec-fetch-dest')
    }
    
    const fingerprint = this.hashFingerprint(headers)
    const suspiciousScore = this.analyzeSuspiciousHeaders(headers)
    
    return {
      fingerprint,
      suspiciousScore,
      isBot: suspiciousScore > 50
    }
  }

  hashFingerprint(headers) {
    const sorted = Object.keys(headers).sort().reduce((result, key) => {
      result[key] = headers[key] || ''
      return result
    }, {})
    
    const str = JSON.stringify(sorted)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  analyzeSuspiciousHeaders(headers) {
    let score = 0
    
    const botUserAgents = [
      'headless', 'phantom', 'selenium', 'webdriver',
      'chrome-lighthouse', 'bot', 'crawler', 'spider'
    ]
    
    const ua = (headers.userAgent || '').toLowerCase()
    if (botUserAgents.some(bot => ua.includes(bot))) score += 40
    
    if (!headers.acceptLanguage) score += 15
    if (!headers.acceptEncoding) score += 10
    if (!headers.secFetchSite) score += 20
    
    if (ua.includes('chrome') && !headers.secFetchSite) score += 25
    if (headers.connection === 'close') score += 10
    
    return score
  }

  async trackFingerprintUsage(supabase, fingerprint, ip) {
    try {
      const { data } = await supabase.rpc('track_fingerprint', {
        p_fingerprint: fingerprint,
        p_ip: ip,
        p_window_minutes: 60
      })
      
      return {
        uniqueIPs: data?.unique_ips || 1,
        totalRequests: data?.total_requests || 1,
        isBotFarm: (data?.unique_ips || 0) > 10
      }
    } catch {
      return { uniqueIPs: 1, totalRequests: 1, isBotFarm: false }
    }
  }
}

class ChallengeSystem {
  constructor() {
    this.activeChallenges = new Map()
    this.verifiedIPs = new Map()
    this.cleanup()
  }

  cleanup() {
    setInterval(() => {
      const cutoff = Date.now() - 30 * 60 * 1000
      for (const [id, challenge] of this.activeChallenges) {
        if (challenge.startTime < cutoff) {
          this.activeChallenges.delete(id)
        }
      }
    }, 5 * 60 * 1000)
  }

  shouldChallenge(ip, botScore, fingerprintData) {
    const verified = this.verifiedIPs.get(ip)
    if (verified && Date.now() - verified < 60 * 60 * 1000) return false
    
    const triggers = [
      botScore > 30,
      fingerprintData.isBotFarm,
      fingerprintData.suspiciousScore > 40
    ]
    
    return triggers.some(trigger => trigger)
  }

  generateChallenge(difficulty = 'medium') {
    const challenges = {
      easy: () => this.generateMathChallenge(),
      medium: () => this.generateProofOfWork(),
      hard: () => this.generateComplexMath(),
      extreme: () => this.generateMultiStepChallenge()
    }
    
    return challenges[difficulty]()
  }

  generateMathChallenge() {
    const a = Math.floor(Math.random() * 20) + 1
    const b = Math.floor(Math.random() * 20) + 1
    const operations = ['+', '-', '*']
    const op = operations[Math.floor(Math.random() * operations.length)]
    
    let answer
    switch(op) {
      case '+': answer = a + b; break
      case '-': answer = a - b; break
      case '*': answer = a * b; break
    }
    
    const challengeId = crypto.randomUUID()
    const challenge = {
      id: challengeId,
      type: 'math',
      question: `${a} ${op} ${b} = ?`,
      answer: answer.toString(),
      startTime: Date.now(),
      timeout: 15000
    }
    
    this.activeChallenges.set(challengeId, challenge)
    return challenge
  }

  generateProofOfWork(difficulty = 4) {
    const challenge = crypto.randomUUID()
    const target = '0'.repeat(difficulty)
    const challengeId = crypto.randomUUID()
    
    const challengeObj = {
      id: challengeId,
      type: 'proof_of_work',
      challenge,
      target,
      startTime: Date.now(),
      timeout: 30000
    }
    
    this.activeChallenges.set(challengeId, challengeObj)
    return challengeObj
  }

  generateComplexMath() {
    const operations = [
      { question: 'Find the sum of first 5 prime numbers', answer: '28' },
      { question: 'What is 7! (7 factorial)?', answer: '5040' },
      { question: 'Square root of 144', answer: '12' },
      { question: '2^8 = ?', answer: '256' }
    ]
    
    const selected = operations[Math.floor(Math.random() * operations.length)]
    const challengeId = crypto.randomUUID()
    
    const challenge = {
      id: challengeId,
      type: 'complex_math',
      question: selected.question,
      answer: selected.answer,
      startTime: Date.now(),
      timeout: 60000
    }
    
    this.activeChallenges.set(challengeId, challenge)
    return challenge
  }

  generateMultiStepChallenge() {
    const steps = [
      { question: 'What is 5 + 3?', answer: '8' },
      { question: 'Multiply previous answer by 2', answer: '16' },
      { question: 'Subtract 6 from result', answer: '10' }
    ]
    
    const challengeId = crypto.randomUUID()
    const challenge = {
      id: challengeId,
      type: 'multi_step',
      steps,
      currentStep: 0,
      startTime: Date.now(),
      timeout: 120000
    }
    
    this.activeChallenges.set(challengeId, challenge)
    return challenge
  }

  async verifyChallenge(challengeId, response, ip) {
    const challenge = this.activeChallenges.get(challengeId)
    if (!challenge) return { valid: false, reason: 'Challenge not found' }
    
    if (Date.now() - challenge.startTime > challenge.timeout) {
      this.activeChallenges.delete(challengeId)
      return { valid: false, reason: 'Challenge expired' }
    }
    
    const isValid = await this.validateResponse(challenge, response)
    const timeTaken = Date.now() - challenge.startTime
    const isHumanTiming = this.analyzeResponseTiming(challenge.type, timeTaken)
    
    if (isValid && isHumanTiming) {
      this.verifiedIPs.set(ip, Date.now())
      this.activeChallenges.delete(challengeId)
      return { valid: true, timeTaken }
    }
    
    return { valid: false, reason: isValid ? 'Timing suspicious' : 'Wrong answer' }
  }

  async validateResponse(challenge, response) {
    switch (challenge.type) {
      case 'math':
      case 'complex_math':
        return response.trim() === challenge.answer
      
      case 'proof_of_work':
        return this.validateProofOfWork(challenge.challenge, challenge.target, response)
      
      case 'multi_step':
        const step = challenge.steps[challenge.currentStep]
        if (response.trim() === step.answer) {
          challenge.currentStep++
          return challenge.currentStep >= challenge.steps.length
        }
        return false
      
      default:
        return false
    }
  }

  async validateProofOfWork(challenge, target, nonce) {
    try {
      const input = challenge + nonce
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return hashHex.startsWith(target)
    } catch {
      return false
    }
  }

  analyzeResponseTiming(challengeType, timeTaken) {
    const expectedTimes = {
      math: { min: 2000, max: 30000 },
      proof_of_work: { min: 1000, max: 60000 },
      complex_math: { min: 5000, max: 120000 },
      multi_step: { min: 10000, max: 300000 }
    }
    
    const expected = expectedTimes[challengeType]
    if (!expected) return true
    
    return timeTaken >= expected.min && timeTaken <= expected.max
  }
}

class AdaptiveRateLimit {
  constructor() {
    this.trustScores = new Map()
    this.ipHistory = new Map()
  }

  calculateDynamicLimit(ip, baseLimit, trustScore, botScore) {
    let multiplier = 1.0
    
    if (trustScore > 80) multiplier *= 1.5
    else if (trustScore > 60) multiplier *= 1.2
    else if (trustScore < 20) multiplier *= 0.5
    
    if (botScore > 70) multiplier *= 0.2
    else if (botScore > 50) multiplier *= 0.4
    else if (botScore > 30) multiplier *= 0.7
    
    const finalLimit = Math.max(1, Math.floor(baseLimit * multiplier))
    
    return {
      limit: finalLimit,
      trustScore,
      botScore,
      multiplier
    }
  }

  buildTrustScore(ip, history) {
    let score = 50
    
    if (history.successfulChallenges > 2) score += 20
    if (history.consistentBehavior) score += 15
    if (history.naturalTiming) score += 10
    if (history.diversePages) score += 10
    if (history.noViolations) score += 15
    
    if (history.failedChallenges > 1) score -= 30
    if (history.rateViolations > 0) score -= 25
    if (history.suspiciousPatterns) score -= 20
    
    const finalScore = Math.max(0, Math.min(100, score))
    this.trustScores.set(ip, finalScore)
    return finalScore
  }

  updateHistory(ip, event) {
    const history = this.ipHistory.get(ip) || {
      successfulChallenges: 0,
      failedChallenges: 0,
      rateViolations: 0,
      consistentBehavior: true,
      naturalTiming: true,
      diversePages: true,
      noViolations: true,
      lastUpdate: Date.now()
    }
    
    switch (event.type) {
      case 'challenge_success':
        history.successfulChallenges++
        break
      case 'challenge_fail':
        history.failedChallenges++
        break
      case 'rate_violation':
        history.rateViolations++
        history.noViolations = false
        break
      case 'suspicious_behavior':
        history.consistentBehavior = false
        break
    }
    
    history.lastUpdate = Date.now()
    this.ipHistory.set(ip, history)
    return history
  }

  getHistory(ip) {
    return this.ipHistory.get(ip) || {
      successfulChallenges: 0,
      failedChallenges: 0,
      rateViolations: 0,
      consistentBehavior: true,
      naturalTiming: true,
      diversePages: true,
      noViolations: true
    }
  }
}

class EmergencyResponse {
  constructor() {
    this.alertThresholds = {
      requestsPerMinute: 1000,
      uniqueIPsPerMinute: 100,
      botScoreAverage: 60,
      challengeFailureRate: 0.8
    }
    
    this.emergencyMode = false
    this.emergencyStartTime = null
    this.emergencyLevel = 0
    this.circuitBreakers = new Map()
  }

  analyzeGlobalThreat(metrics) {
    const threats = [
      metrics.rpm > this.alertThresholds.requestsPerMinute,
      metrics.uniqueIPs > this.alertThresholds.uniqueIPsPerMinute,
      metrics.avgBotScore > this.alertThresholds.botScoreAverage,
      metrics.challengeFailRate > this.alertThresholds.challengeFailureRate
    ]
    
    const threatLevel = threats.filter(Boolean).length
    
    if (threatLevel >= 2 && !this.emergencyMode) {
      this.activateEmergencyMode(threatLevel, metrics)
    } else if (threatLevel === 0 && this.emergencyMode) {
      this.deactivateEmergencyMode()
    }
    
    return {
      threatLevel,
      emergencyMode: this.emergencyMode,
      emergencyLevel: this.emergencyLevel,
      actions: this.getEmergencyActions(threatLevel)
    }
  }

  activateEmergencyMode(threatLevel, metrics) {
    this.emergencyMode = true
    this.emergencyLevel = Math.min(threatLevel, 3)
    this.emergencyStartTime = Date.now()
    
    console.log(`🚨 EMERGENCY MODE ACTIVATED - Level: ${this.emergencyLevel}`)
  }

  deactivateEmergencyMode() {
    this.emergencyMode = false
    this.emergencyLevel = 0
    this.emergencyStartTime = null
    console.log('✅ Emergency mode deactivated')
  }

  getEmergencyActions(threatLevel) {
    const actions = {
      1: {
        rateLimitReduction: 0.7,
        challengeIncrease: 'medium',
        foreignBlock: true
      },
      2: {
        rateLimitReduction: 0.4,
        challengeIncrease: 'hard',
        newIPBlock: true
      },
      3: {
        rateLimitReduction: 0.1,
        challengeIncrease: 'extreme',
        temporaryWhitelist: true
      }
    }
    
    return actions[Math.min(threatLevel, 3)] || actions[1]
  }

  createIPCircuitBreaker() {
    return {
      states: new Map(),
      
      checkState(ip) {
        const state = this.states.get(ip) || {
          state: 'CLOSED', failures: 0, lastFailure: 0
        }
        
        if (state.state === 'OPEN') {
          if (Date.now() - state.lastFailure > 300000) {
            state.state = 'HALF_OPEN'
            this.states.set(ip, state)
          }
        }
        
        return state
      },
      
      recordFailure(ip) {
        const state = this.states.get(ip) || {
          state: 'CLOSED', failures: 0, lastFailure: 0
        }
        
        state.failures++
        state.lastFailure = Date.now()
        
        if (state.failures >= 5) {
          state.state = 'OPEN'
        }
        
        this.states.set(ip, state)
      },
      
      recordSuccess(ip) {
        const state = this.states.get(ip)
        if (state && state.state === 'HALF_OPEN') {
          state.state = 'CLOSED'
          state.failures = 0
          this.states.set(ip, state)
        }
      }
    }
  }
}

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
    
    if (VIETNAM_IP_RANGES.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      return VIETNAM_IP_RANGES
    }
    
    if (fetchAttempts >= MAX_FETCH_ATTEMPTS) {
      return FALLBACK_VN_RANGES
    }
    
    fetchAttempts++
    
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
    
    const text = await response.text()
    
    if (text.length > 1024 * 1024) {
      throw new Error('File too large')
    }
    
    const ranges = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      let match = trimmed.match(/^(\d+\.\d+\.\d+\.\d+)\s*[-\/]\s*(\d+\.\d+\.\d+\.\d+)$/)
      if (!match) {
        match = trimmed.match(/^(\d+\.\d+\.\d+\.\d+)\/\d+$/)
        if (match) {
          ranges.push([match[1], match[1]])
          continue
        }
      }
      
      if (match && match.length >= 3) {
        const startIP = sanitizeIP(match[1])
        const endIP = sanitizeIP(match[2])
        
        if (startIP && endIP) {
          const startNum = ipToNumber(startIP)
          const endNum = ipToNumber(endIP)
          
          if (startNum <= endNum && startNum > 0) {
            ranges.push([startIP, endIP])
          }
        }
      }
    }
    
    if (ranges.length < 10) {
      throw new Error('Too few IP ranges parsed')
    }
    
    if (ranges.length > 10000) {
      throw new Error('Too many IP ranges parsed')
    }
    
    VIETNAM_IP_RANGES = ranges
    lastFetchTime = now
    fetchAttempts = 0
    
    return ranges
    
  } catch (error) {
    if (VIETNAM_IP_RANGES.length > 0) {
      return VIETNAM_IP_RANGES
    }
    
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

async function checkRateLimit(supabase, ip, isVN, country, userAgent, customLimit = null) {
  try {
    const limit = customLimit || (isVN ? RATE_LIMIT_VN : RATE_LIMIT_FOREIGN)
    
    const { data: result, error } = await supabase.rpc('handle_rate_limit_v3', {
      p_ip: ip,
      p_limit: limit,
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
    return { allowed: false, banned: false, count: 0, violations: 0 }
  }
}

async function logSecurityEvent(supabase, ip, eventType, severity = 'LOW', metadata = {}) {
  try {
    await supabase.rpc('log_security_event_v2', {
      input_ip: ip,
      input_event_type: eventType,
      input_severity: severity,
      input_path: metadata.path,
      input_user_agent: metadata.userAgent?.substring(0, 500),
      input_country: metadata.country,
      input_bot_score: metadata.botScore,
      input_trust_score: metadata.trustScore,
      input_fingerprint: metadata.fingerprint,
      input_metadata: metadata
    })
  } catch (error) {
    console.error('Security logging error:', error.message)
  }
}

function createChallengeResponse(challenge) {
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Challenge</title>
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
        }
        
        .title {
            font-size: 2rem;
            color: #2c3e50;
            margin-bottom: 1rem;
        }
        
        .challenge-box {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            margin: 1rem 0;
            border-left: 4px solid #007bff;
        }
        
        .question {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        input[type="text"] {
            width: 100%;
            padding: 0.8rem;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
            margin-bottom: 1rem;
        }
        
        .submit-btn {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 50px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3);
        }
        
        .timer {
            background: #fff3cd;
            padding: 0.5rem;
            border-radius: 5px;
            margin-top: 1rem;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🛡️ Security Verification</h1>
        <p>Please complete this challenge to continue:</p>
        
        <div class="challenge-box">
            <div class="question">${challenge.question || 'Complete the challenge'}</div>
            <form id="challengeForm" method="POST">
                <input type="hidden" name="challengeId" value="${challenge.id}">
                <input type="text" name="response" placeholder="Enter your answer" required>
                <button type="submit" class="submit-btn">Submit</button>
            </form>
        </div>
        
        <div class="timer" id="timer">Time remaining: ${Math.floor(challenge.timeout/1000)}s</div>
    </div>

    <script>
        let timeLeft = ${Math.floor(challenge.timeout/1000)};
        const timer = document.getElementById('timer');
        
        const countdown = setInterval(() => {
            timeLeft--;
            timer.textContent = \`Time remaining: \${timeLeft}s\`;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                timer.textContent = 'Challenge expired. Refreshing...';
                setTimeout(() => window.location.reload(), 2000);
            }
        }, 1000);
        
        document.getElementById('challengeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert('Incorrect answer. Please try again.');
                }
            });
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
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
        }
        
        .emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
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
        
        .details-item {
            display: flex;
            justify-content: space-between;
            padding: 0.3rem 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .details-item:last-child {
            border-bottom: none;
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
        
        .footer {
            color: #777;
            font-size: 0.9rem;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🚫</div>
        <h1 class="title">Access Denied</h1>
        <div class="status-code">ERROR ${statusCode}</div>
        <div class="reason">${reason}</div>
        
        ${details && Object.keys(details).length > 0 ? `
        <div class="details">
            ${Object.entries(details).map(([key, value]) => `
                <div class="details-item">
                    <span>${key}:</span>
                    <strong>${value}</strong>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <button class="refresh-btn" onclick="window.location.reload()">
            🔄 Try Again
        </button>
        
        <div class="footer">
            <p>🛡️ Protected by Advanced Security System</p>
            <p>Timestamp: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Block-Type': blockType,
      'X-Block-Time': new Date().toISOString()
    }
  })
}

const behaviorAnalyzer = new BehaviorAnalyzer()
const fingerprinter = new DeviceFingerprinter()
const challengeSystem = new ChallengeSystem()
const adaptiveLimit = new AdaptiveRateLimit()
const emergency = new EmergencyResponse()

export default async function middleware(request) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const path = url.pathname
    
    if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map)$/)) {
      return
    }
    
    if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.json()
        if (body.challengeId && body.response) {
          const ip = getClientIP(request)
          const result = await challengeSystem.verifyChallenge(body.challengeId, body.response, ip)
          
          if (result.valid) {
            adaptiveLimit.updateHistory(ip, { type: 'challenge_success' })
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          } else {
            adaptiveLimit.updateHistory(ip, { type: 'challenge_fail' })
            return new Response(JSON.stringify({ success: false, reason: result.reason }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          }
        }
      } catch {
        
      }
    }
    
    const ip = getClientIP(request)
    
    if (!ip) {
      return createBlockedResponse(403, 'Cannot determine real IP address', {}, 'NO_IP')
    }
    
    const userAgent = request.headers.get('user-agent') || ''
    const country = request.headers.get('cf-ipcountry') || ''
    const method = request.method
    
    const processingTime = Date.now() - startTime
    const botScore = behaviorAnalyzer.analyzeRequest(ip, request, processingTime)
    const fingerprintData = fingerprinter.generateFingerprint(request)
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      })
      
      const farmData = await fingerprinter.trackFingerprintUsage(
        supabase, 
        fingerprintData.fingerprint, 
        ip
      )
      fingerprintData.isBotFarm = farmData.isBotFarm
    }
    
    if (country && country !== 'VN' && country !== 'XX' && country !== '') {
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'COUNTRY_BLOCK', 'MEDIUM', {
          country, path, userAgent: userAgent.substring(0, 100),
          botScore, fingerprint: fingerprintData.fingerprint
        })
      }
      
      return createBlockedResponse(403, 'Access from this country is not allowed', {
        'Country': country,
        'Bot Score': botScore
      }, 'BLOCKED_COUNTRY')
    }
    
    const isSuspiciousUA = SUSPICIOUS_UAS.some(ua => 
      userAgent.toLowerCase().includes(ua)
    )
    
    const isVN = await isVietnamIP(ip)
    
    if (!isVN && isSuspiciousUA) {
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'SUSPICIOUS_UA', 'HIGH', {
          path, userAgent: userAgent.substring(0, 200), country,
          botScore, fingerprint: fingerprintData.fingerprint
        })
      }
      
      return createBlockedResponse(403, 'Suspicious activity detected', {
        'Bot Score': botScore,
        'Reason': 'Suspicious User Agent + Foreign IP'
      }, 'BLOCKED_SUSPICIOUS')
    }
    
    if (challengeSystem.shouldChallenge(ip, botScore, fingerprintData)) {
      const difficulty = botScore > 70 ? 'hard' : botScore > 50 ? 'medium' : 'easy'
      const challenge = challengeSystem.generateChallenge(difficulty)
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'CHALLENGE_ISSUED', 'MEDIUM', {
          path, botScore, difficulty, fingerprint: fingerprintData.fingerprint
        })
      }
      
      return createChallengeResponse(challenge)
    }
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      })
      
      const history = adaptiveLimit.getHistory(ip)
      const trustScore = adaptiveLimit.buildTrustScore(ip, history)
      const dynamicLimits = adaptiveLimit.calculateDynamicLimit(ip, RATE_LIMIT_VN, trustScore, botScore)
      
      const rateLimitResult = await checkRateLimit(
        supabase, 
        ip, 
        isVN, 
        country, 
        userAgent, 
        dynamicLimits.limit
      )
      
      if (rateLimitResult.banned) {
        await logSecurityEvent(supabase, ip, 'BANNED_ACCESS', 'HIGH', {
          path, country, userAgent: userAgent.substring(0, 100),
          botScore, trustScore, fingerprint: fingerprintData.fingerprint
        })
        
        return createBlockedResponse(403, 'IP address is banned', {
          'Ban Reason': 'Multiple rate limit violations',
          'Bot Score': botScore,
          'Trust Score': trustScore
        }, 'BLOCKED_BANNED')
      }
      
      if (!rateLimitResult.allowed) {
        adaptiveLimit.updateHistory(ip, { type: 'rate_violation' })
        
        await logSecurityEvent(supabase, ip, 'RATE_LIMIT', 'MEDIUM', {
          path, count: rateLimitResult.count,
          violations: rateLimitResult.violations,
          botScore, trustScore, dynamicLimit: dynamicLimits.limit
        })
        
        return createBlockedResponse(429, 'Rate limit exceeded', {
          'Current Requests': rateLimitResult.count,
          'Dynamic Limit': dynamicLimits.limit,
          'Bot Score': botScore,
          'Trust Score': trustScore,
          'Violations': rateLimitResult.violations
        }, 'RATE_LIMIT_EXCEEDED')
      }
    }
    
    if (!isVN) {
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })
        await logSecurityEvent(supabase, ip, 'FOREIGN_BLOCK', 'LOW', {
          path, country, userAgent: userAgent.substring(0, 100),
          botScore, fingerprint: fingerprintData.fingerprint
        })
      }
      
      return createBlockedResponse(403, 'Access from foreign IP addresses is not allowed', {
        'IP': ip,
        'Bot Score': botScore,
        'Policy': 'Vietnam Only'
      }, 'BLOCKED_FOREIGN')
    }
    
    const finalProcessingTime = Date.now() - startTime
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      })
      
      await logSecurityEvent(supabase, ip, 'ALLOWED_REQUEST', 'LOW', {
        path, processingTime: finalProcessingTime,
        botScore, trustScore: adaptiveLimit.trustScores.get(ip) || 50,
        fingerprint: fingerprintData.fingerprint
      })
    }
    
  } catch (error) {
    console.error('Enhanced middleware critical error:', error.message)
    
    return createBlockedResponse(503, 'Service temporarily unavailable', {
      'Error': 'Internal processing error',
      'Time': new Date().toLocaleTimeString('vi-VN')
    }, 'SERVICE_ERROR')
  }
}

export const config = {
  runtime: 'edge',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
