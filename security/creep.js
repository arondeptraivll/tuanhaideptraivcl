(function() {
  'use strict';

  // ===========================================
  // 🛡️ ENHANCED CREEP.JS - LOOP-FREE VERSION
  // ===========================================
  
  const CONFIG = {
    CHECK_INTERVAL: 5000,        
    REDIRECT_THRESHOLD: 60,      
    BLOCK_THRESHOLD: 100,        
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
    
    // Control flags
    redirecting: false,
    monitoringActive: false,
    justVerified: false, // NEW: Track if just verified
    
    // Tracking
    mouseEvents: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    clickEvents: 0,
    noMovementCycles: 0,
    roboticClicks: 0,
    impossibleSpeed: 0,
    
    // Mouse tracking
    lastMouseX: 0,
    lastMouseY: 0,
    mousePath: [],
    clickPattern: []
  };

  // ===========================================
  // 🎯 URL PARAMETER HANDLING (PRIORITY 1)
  // ===========================================

  function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    if (verified === 'true') {
      console.log('✅ Just returned from successful verification');
      markAsVerified();
      cleanUrl();
      state.justVerified = true; // Mark as just verified
      return true;
    }
    
    return false;
  }

  function cleanUrl() {
    // Remove verification parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('verified');
    window.history.replaceState({}, document.title, url.toString());
  }

  function markAsVerified() {
    console.log('✅ Marking as verified');
    const now = Date.now();
    
    // Set all verification flags
    sessionStorage.setItem(CONFIG.VERIFIED_KEY, 'true');
    localStorage.setItem(CONFIG.LAST_CHECK_KEY, now.toString());
    state.verified = true;
    state.lastCheck = now;
    
    // Reset score after successful verification
    state.score = Math.max(0, state.score - 30);
    localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
    
    console.log('📊 Score after verification:', state.score);
  }

  // ===========================================
  // 🔍 VERIFICATION STATUS CHECK
  // ===========================================

  function checkVerificationStatus() {
    // If just verified, return true immediately
    if (state.justVerified) {
      console.log('✅ Just verified, skipping additional checks');
      return true;
    }
    
    // Check sessionStorage
    const sessionVerified = sessionStorage.getItem(CONFIG.VERIFIED_KEY) === 'true';
    
    // Check cookie as backup
    const cookieVerified = document.cookie.includes('sec_verified=true');
    
    state.verified = sessionVerified || cookieVerified;
    
    console.log('🔍 Verification status:', {
      session: sessionVerified,
      cookie: cookieVerified,
      overall: state.verified,
      justVerified: state.justVerified
    });
    
    return state.verified;
  }

  function checkInitialVerification() {
    // IMPORTANT: Skip if just verified from URL parameter
    if (state.justVerified) {
      console.log('✅ Just verified, skipping initial verification check');
      return true;
    }
    
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
    if (state.redirecting) {
      console.log('🔄 Already redirecting, skipping...');
      return;
    }
    
    if (window.location.pathname.includes('security/')) {
      console.log('📍 Already in security folder, avoiding loop');
      return;
    }
    
    state.redirecting = true;
    console.log(`🚨 Redirecting for security check: ${reason}`);
    
    const currentUrl = window.location.href;
    // Clean URL before encoding (remove any existing verification params)
    const cleanCurrentUrl = currentUrl.split('?')[0];
    const returnUrl = encodeURIComponent(cleanCurrentUrl);
    
    // Clear verification status when redirecting
    sessionStorage.removeItem(CONFIG.VERIFIED_KEY);
    
    // Add small delay to prevent race conditions
    setTimeout(() => {
      window.location.href = `security/turnstile.html?return=${returnUrl}&reason=bot&score=${state.score}`;
    }, 100);
  }

  // ===========================================
  // 📊 EVENT LISTENERS (Simplified)
  // ===========================================

  function setupEventListeners() {
    console.log('🕵️ Setting up behavior monitoring...');
    
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      state.mouseEvents++;
      state.lastActivity = Date.now();
      
      const speed = Math.sqrt(
        Math.pow(e.clientX - state.lastMouseX, 2) + 
        Math.pow(e.clientY - state.lastMouseY, 2)
      );
      
      if (speed > 500) state.impossibleSpeed++;
      
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
      
      if (state.clickPattern.length > 5) {
        state.clickPattern.shift();
      }
      
      // Simple robotic click detection
      if (state.clickPattern.length >= 3) {
        const last3 = state.clickPattern.slice(-3);
        const samePosition = last3.every(click => 
          Math.abs(click.x - last3[0].x) < 5 && 
          Math.abs(click.y - last3[0].y) < 5
        );
        
        if (samePosition) {
          state.roboticClicks++;
        }
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
  }

  // ===========================================
  // 🔍 BEHAVIOR ANALYSIS (Simplified)
  // ===========================================

  function analyzeBehavior() {
    let suspiciousPoints = 0;
    const now = Date.now();
    const timeSinceLastActivity = now - state.lastActivity;
    
    // No activity for extended period
    if (timeSinceLastActivity > 20000) suspiciousPoints += 10;
    
    // No mouse movement at all
    if (state.mouseEvents === 0 && (now - state.sessionStart) > 60000) {
      suspiciousPoints += 15;
    }
    
    // Robotic behaviors
    if (state.roboticClicks > 3) suspiciousPoints += 15;
    if (state.impossibleSpeed > 5) suspiciousPoints += 10;
    
    // Browser checks (only major ones)
    if (navigator.webdriver) suspiciousPoints += 25;
    
    return suspiciousPoints;
  }

  // ===========================================
  // ⚡ MONITORING LOGIC (Simplified)
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
    
    let cycleScore = analyzeBehavior();
    
    // Check for no movement
    const timeSinceLastActivity = now - state.lastActivity;
    if (timeSinceLastActivity >= CONFIG.CHECK_INTERVAL) {
      state.noMovementCycles++;
      cycleScore += 3; // Reduced penalty
    } else {
      state.noMovementCycles = Math.max(0, state.noMovementCycles - 1);
    }
    
    // Progressive penalty (reduced)
    if (state.noMovementCycles >= 6) {
      cycleScore += state.noMovementCycles * 2;
    }
    
    // Add to total score
    state.score += cycleScore;
    state.score = Math.max(0, state.score);
    
    // Save score
    localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
    
    console.log(`🕵️ Check - Score: ${state.score}/${CONFIG.REDIRECT_THRESHOLD}, Cycle: +${cycleScore}, NoMove: ${state.noMovementCycles}`);
    
    // Check thresholds (more lenient)
    if (state.score >= CONFIG.BLOCK_THRESHOLD) {
      blockUser();
    } else if (state.score >= CONFIG.REDIRECT_THRESHOLD) {
      redirectToSecurityCheck('suspicious_behavior');
    }
    
    // Reset cycle counters
    state.impossibleSpeed = 0;
  }

  function blockUser() {
    console.log('🚫 User blocked');
    
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    localStorage.removeItem(CONFIG.LAST_CHECK_KEY);
    sessionStorage.removeItem(CONFIG.VERIFIED_KEY);
    document.cookie = 'sec_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    window.location.href = `security/blocked.html?reason=bot&score=${state.score}`;
  }

  // ===========================================
  // 🚀 INITIALIZATION (Fixed Order)
  // ===========================================

  function startMonitoring() {
    console.log('🕵️ Starting behavior monitoring...');
    
    state.monitoringActive = true;
    setupEventListeners();
    
    // Start periodic checks after a delay
    setTimeout(() => {
      setInterval(performBehaviorCheck, CONFIG.CHECK_INTERVAL);
    }, 2000); // 2 second delay before starting checks
    
    console.log('✅ Monitoring started successfully');
  }

  function init() {
    console.log('🛡️ Creep.js Enhanced - Initializing...');
    
    // Skip if in security folder
    if (window.location.pathname.includes('security/')) {
      console.log('📍 In security folder, skipping initialization');
      return;
    }
    
    // STEP 1: Check URL parameters FIRST (highest priority)
    const justVerified = checkUrlParameters();
    
    if (justVerified) {
      console.log('🎉 Just completed verification, starting monitoring');
      startMonitoring();
      return;
    }
    
    // STEP 2: Only check initial verification if NOT just verified
    console.log('🔍 Checking if verification needed...');
    
    if (!checkInitialVerification()) {
      console.log('❌ Initial verification failed, will redirect');
      return; // Will redirect
    }
    
    // STEP 3: Start monitoring if all checks passed
    console.log('✅ All checks passed, starting monitoring');
    startMonitoring();
  }

  // ===========================================
  // 🛡️ NOSCRIPT FALLBACK
  // ===========================================
  
  const noScript = document.createElement('noscript');
  noScript.innerHTML = `<meta http-equiv="refresh" content="0;url=security/blocked.html?reason=bot">`;
  
  // Safe DOM insertion
  if (document.head) {
    document.head.appendChild(noScript);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.head) {
        document.head.appendChild(noScript);
      }
    });
  }

  // ===========================================
  // 🎬 START SYSTEM
  // ===========================================

  // Add delay to prevent race conditions
  function safeInit() {
    try {
      init();
    } catch (error) {
      console.error('🚨 Creep.js initialization error:', error);
      // Fallback: redirect to security if there's an error
      if (!window.location.pathname.includes('security/')) {
        setTimeout(() => {
          window.location.href = 'security/turnstile.html?reason=bot';
        }, 1000);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(safeInit, 500); // 500ms delay
    });
  } else {
    setTimeout(safeInit, 500); // 500ms delay
  }

})();