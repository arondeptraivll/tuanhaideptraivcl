(function() {
  'use strict';

  // ===========================================
  // 🛡️ ENHANCED CREEP.JS - hCAPTCHA INTEGRATION
  // ===========================================
  
  const CONFIG = {
    CHECK_INTERVAL: 5000,        // Kiểm tra mỗi 5 giây
    REDIRECT_THRESHOLD: 60,      // Điểm để redirect đi kiểm tra lại
    BLOCK_THRESHOLD: 100,        // Điểm để block hẳn
    SESSION_TIMEOUT: 1800000,    // 30 phút
    STORAGE_KEY: 'creep_score',
    VERIFIED_KEY: 'security_verified',
    LAST_CHECK_KEY: 'last_security_check'
  };

  let state = {
    score: parseInt(localStorage.getItem(CONFIG.STORAGE_KEY)) || 0,
    verified: false,
    lastCheck: parseInt(localStorage.getItem(CONFIG.LAST_CHECK_KEY)) || 0,
    sessionStart: Date.now(),
    lastActivity: Date.now(),
    
    // Tracking
    mouseEvents: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    clickEvents: 0,
    
    // Suspicious behaviors
    noMovementCycles: 0,
    roboticClicks: 0,
    impossibleSpeed: 0,
    
    // Control flags
    redirecting: false,
    monitoringActive: false,
    
    // Mouse tracking
    lastMouseX: 0,
    lastMouseY: 0,
    mousePath: [],
    clickPattern: []
  };

  // ===========================================
  // 🔍 VERIFICATION STATUS CHECK
  // ===========================================

  function checkVerificationStatus() {
    // Check sessionStorage first
    const sessionVerified = sessionStorage.getItem(CONFIG.VERIFIED_KEY) === 'true';
    
    // Check if we have a server-side session (via cookie or API call)
    const cookieVerified = document.cookie.includes('sec_verified=true');
    
    state.verified = sessionVerified || cookieVerified;
    
    console.log('🔍 Verification status check:');
    console.log(`Session verified: ${sessionVerified}`);
    console.log(`Cookie verified: ${cookieVerified}`);
    console.log(`Overall verified: ${state.verified}`);
    
    return state.verified;
  }

  function checkInitialVerification() {
    const now = Date.now();
    const timeSinceLastCheck = now - state.lastCheck;
    
    console.log('🔍 Checking initial verification...');
    console.log(`Score: ${state.score}, Time since last: ${timeSinceLastCheck}ms`);
    
    // Check current verification status
    if (!checkVerificationStatus()) {
      console.log('🚨 Not verified - redirecting to security check');
      redirectToSecurityCheck('not_verified');
      return false;
    }
    
    // Force re-verification if too long since last check (30 min)
    if (timeSinceLastCheck > CONFIG.SESSION_TIMEOUT) {
      console.log('🚨 Session timeout - redirecting to security check');
      redirectToSecurityCheck('session_timeout');
      return false;
    }
    
    // Force re-verification if score too high
    if (state.score >= CONFIG.REDIRECT_THRESHOLD) {
      console.log('🚨 Score too high - redirecting to security check');
      redirectToSecurityCheck('high_score');
      return false;
    }
    
    return true;
  }

  // ===========================================
  // 🔄 REDIRECT FUNCTIONS
  // ===========================================

  function redirectToSecurityCheck(reason) {
    if (state.redirecting) return;
    if (window.location.pathname.includes('security/')) return; // Avoid loops
    
    state.redirecting = true;
    console.log(`🚨 Redirecting for security check: ${reason}`);
    
    const currentUrl = window.location.href;
    const returnUrl = encodeURIComponent(currentUrl);
    
    // Clear verification status
    sessionStorage.removeItem(CONFIG.VERIFIED_KEY);
    
    // Always use reason=bot for security
    window.location.href = `security/turnstile.html?return=${returnUrl}&reason=bot&score=${state.score}`;
  }

  function markAsVerified() {
    console.log('✅ Marking as verified');
    sessionStorage.setItem(CONFIG.VERIFIED_KEY, 'true');
    localStorage.setItem(CONFIG.LAST_CHECK_KEY, Date.now().toString());
    state.verified = true;
    
    // Reset score after successful verification
    state.score = Math.max(0, state.score - 30);
    localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
  }

  // ===========================================
  // 📊 EVENT LISTENERS
  // ===========================================

  function setupEventListeners() {
    console.log('🕵️ Setting up behavior monitoring...');
    
    // Mouse movement tracking
    document.addEventListener('mousemove', (e) => {
      state.mouseEvents++;
      state.lastActivity = Date.now();
      
      // Calculate speed
      const speed = Math.sqrt(
        Math.pow(e.clientX - state.lastMouseX, 2) + 
        Math.pow(e.clientY - state.lastMouseY, 2)
      );
      
      if (speed > 500) state.impossibleSpeed++;
      
      // Track path
      state.mousePath.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
      });
      
      if (state.mousePath.length > 10) {
        state.mousePath.shift();
      }
      
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    });

    // Click tracking
    document.addEventListener('click', (e) => {
      state.clickEvents++;
      state.lastActivity = Date.now();
      
      state.clickPattern.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
      });
      
      // Check for robotic clicking
      if (state.clickPattern.length >= 3) {
        const last3 = state.clickPattern.slice(-3);
        const samePosition = last3.every(click => 
          Math.abs(click.x - last3[0].x) < 5 && 
          Math.abs(click.y - last3[0].y) < 5
        );
        
        const regularInterval = Math.abs(
          (last3[2].time - last3[1].time) - (last3[1].time - last3[0].time)
        ) < 100;
        
        if (samePosition && regularInterval) {
          state.roboticClicks++;
        }
      }
      
      if (state.clickPattern.length > 5) {
        state.clickPattern.shift();
      }
    });

    // Other events
    document.addEventListener('scroll', () => {
      state.scrollEvents++;
      state.lastActivity = Date.now();
    });

    document.addEventListener('keydown', () => {
      state.keyboardEvents++;
      state.lastActivity = Date.now();
    });

    window.addEventListener('focus', () => {
      state.lastActivity = Date.now();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        state.lastActivity = Date.now();
      }
    });
  }

  // ===========================================
  // 🔍 BEHAVIOR ANALYSIS
  // ===========================================

  function analyzeBehavior() {
    let suspiciousPoints = 0;
    const now = Date.now();
    const timeSinceLastActivity = now - state.lastActivity;
    
    // No activity for extended period
    if (timeSinceLastActivity > 15000) {
      suspiciousPoints += 15;
    }
    
    // No mouse movement at all
    if (state.mouseEvents === 0 && (now - state.sessionStart) > 30000) {
      suspiciousPoints += 25;
    }
    
    // Robotic behaviors
    if (state.roboticClicks > 2) suspiciousPoints += 20;
    if (state.impossibleSpeed > 3) suspiciousPoints += 10;
    
    // Browser checks
    if (navigator.webdriver) suspiciousPoints += 30;
    if (!window.chrome || !window.chrome.webstore) suspiciousPoints += 10;
    
    return suspiciousPoints;
  }

  // ===========================================
  // ⚡ MONITORING LOGIC
  // ===========================================

  function performBehaviorCheck() {
    if (!state.monitoringActive || state.redirecting) return;
    
    const now = Date.now();
    
    // Check if session expired
    if (now - state.sessionStart > CONFIG.SESSION_TIMEOUT) {
      console.log('🔄 Session expired, forcing re-verification');
      redirectToSecurityCheck('session_expired');
      return;
    }
    
    // Re-verify verification status periodically
    if (!checkVerificationStatus()) {
      console.log('🚨 Verification status lost, redirecting');
      redirectToSecurityCheck('verification_lost');
      return;
    }
    
    let cycleScore = 0;
    
    // Analyze current behavior
    cycleScore += analyzeBehavior();
    
    // Check for no movement in this cycle
    const timeSinceLastActivity = now - state.lastActivity;
    if (timeSinceLastActivity >= CONFIG.CHECK_INTERVAL) {
      state.noMovementCycles++;
      cycleScore += 5;
    } else {
      state.noMovementCycles = Math.max(0, state.noMovementCycles - 1);
    }
    
    // Progressive penalty
    if (state.noMovementCycles >= 4) {
      cycleScore += state.noMovementCycles * 2;
    }
    
    // Add to total score
    state.score += cycleScore;
    state.score = Math.max(0, state.score);
    
    // Save score
    localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
    
    console.log(`🕵️ Behavior Check - Score: ${state.score}/${CONFIG.REDIRECT_THRESHOLD}, Cycle: +${cycleScore}`);
    
    // Check thresholds
    if (state.score >= CONFIG.BLOCK_THRESHOLD) {
      blockUser();
    } else if (state.score >= CONFIG.REDIRECT_THRESHOLD) {
      redirectToSecurityCheck('suspicious_behavior');
    }
    
    // Reset cycle counters
    state.impossibleSpeed = 0;
  }

  function blockUser() {
    console.log('🚫 User blocked due to extremely suspicious behavior');
    
    // Clear all verification data
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    localStorage.removeItem(CONFIG.LAST_CHECK_KEY);
    sessionStorage.removeItem(CONFIG.VERIFIED_KEY);
    
    // Clear cookie
    document.cookie = 'sec_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    window.location.href = `security/blocked.html?reason=bot&score=${state.score}`;
  }

  // ===========================================
  // 🎯 URL PARAMETER HANDLING
  // ===========================================

  function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    if (verified === 'true') {
      console.log('✅ Security check passed - marking as verified');
      markAsVerified();
      
      // Clean URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      return true;
    }
    
    return false;
  }

  // ===========================================
  // 🚀 INITIALIZATION
  // ===========================================

  function startMonitoring() {
    console.log('🕵️ Starting behavior monitoring system...');
    
    state.monitoringActive = true;
    
    // Set up event listeners
    setupEventListeners();
    
    // Start periodic checks
    setInterval(performBehaviorCheck, CONFIG.CHECK_INTERVAL);
    
    // Immediate browser checks
    const browserScore = analyzeBehavior();
    if (browserScore > 30) {
      state.score += browserScore;
      localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
      console.log(`⚠️ High initial browser risk score: ${browserScore}`);
    }
  }

  function init() {
    console.log('🛡️ Creep.js Enhanced with hCaptcha - Initializing...');
    
    // Skip if we're in security folder to avoid loops
    if (window.location.pathname.includes('security/')) {
      console.log('📍 In security folder, skipping initialization');
      return;
    }
    
    // Check URL parameters first (returning from verification)
    if (checkUrlParameters()) {
      console.log('✅ Returning from successful verification');
    }
    
    // Check if verification is needed
    if (!checkInitialVerification()) {
      return; // Will redirect
    }
    
    // Start monitoring if everything is OK
    console.log('✅ Initial verification passed, starting monitoring...');
    startMonitoring();
  }

  // ===========================================
  // 🛡️ NOSCRIPT FALLBACK
  // ===========================================
  
  const noScript = document.createElement('noscript');
  noScript.innerHTML = `<meta http-equiv="refresh" content="0;url=security/blocked.html?reason=bot">`;
  if (document.head) {
    document.head.appendChild(noScript);
  }

  // ===========================================
  // 🎬 START SYSTEM
  // ===========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();