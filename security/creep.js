(function() {
  'use strict';

  // ===========================================
  // 🛡️ CREEP.JS IN SECURITY FOLDER
  // ===========================================
  
  const CONFIG = {
    CHECK_INTERVAL: 5000,        
    REDIRECT_THRESHOLD: 60,      
    BLOCK_THRESHOLD: 100,        
    SESSION_TIMEOUT: 1800000,
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
    
    redirecting: false,
    monitoringActive: false,
    justVerified: false,
    
    mouseEvents: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    clickEvents: 0,
    noMovementCycles: 0,
    roboticClicks: 0,
    impossibleSpeed: 0,
    
    lastMouseX: 0,
    lastMouseY: 0,
    mousePath: [],
    clickPattern: []
  };

  // ===========================================
  // 🗂️ PATH UTILITIES
  // ===========================================

  function getSecurityUrl(page) {
    // creep.js is already in security folder, so relative path
    return page;
  }

  // ===========================================
  // 🎯 URL PARAMETER HANDLING
  // ===========================================

  function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    if (verified === 'true') {
      console.log('✅ Just returned from successful verification');
      markAsVerified();
      cleanUrl();
      state.justVerified = true;
      return true;
    }
    
    return false;
  }

  function cleanUrl() {
    try {
      const url = new URL(window.location);
      url.searchParams.delete('verified');
      window.history.replaceState({}, document.title, url.toString());
      console.log('🧹 URL cleaned');
    } catch (e) {
      console.log('⚠️ Could not clean URL:', e);
    }
  }

  function markAsVerified() {
    console.log('✅ Marking as verified');
    const now = Date.now();
    
    sessionStorage.setItem(CONFIG.VERIFIED_KEY, 'true');
    localStorage.setItem(CONFIG.LAST_CHECK_KEY, now.toString());
    state.verified = true;
    state.lastCheck = now;
    
    state.score = Math.max(0, state.score - 30);
    localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
    
    console.log('📊 Score after verification:', state.score);
  }

  // ===========================================
  // 🔍 VERIFICATION STATUS CHECK
  // ===========================================

  function checkVerificationStatus() {
    if (state.justVerified) {
      console.log('✅ Just verified, skipping additional checks');
      return true;
    }
    
    const sessionVerified = sessionStorage.getItem(CONFIG.VERIFIED_KEY) === 'true';
    const cookieVerified = document.cookie.includes('sec_verified=true');
    
    state.verified = sessionVerified || cookieVerified;
    
    console.log('🔍 Verification status:', {
      session: sessionVerified,
      cookie: cookieVerified,
      overall: state.verified
    });
    
    return state.verified;
  }

  function checkInitialVerification() {
    if (state.justVerified) {
      console.log('✅ Just verified, skipping initial verification check');
      return true;
    }
    
    const now = Date.now();
    const timeSinceLastCheck = now - state.lastCheck;
    
    console.log('🔍 Checking initial verification...');
    console.log(`Score: ${state.score}, Time since last: ${timeSinceLastCheck}ms`);
    
    if (!checkVerificationStatus()) {
      console.log('🚨 Not verified - redirecting to security check');
      redirectToSecurityCheck('not_verified');
      return false;
    }
    
    if (timeSinceLastCheck > CONFIG.SESSION_TIMEOUT) {
      console.log('🚨 Session timeout - redirecting to security check');
      redirectToSecurityCheck('session_timeout');
      return false;
    }
    
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
    
    const currentUrl = window.location.origin + window.location.pathname;
    const returnUrl = encodeURIComponent(currentUrl);
    
    sessionStorage.removeItem(CONFIG.VERIFIED_KEY);
    
    // From any folder to security/turnstile.html
    const securityUrl = getSecurityUrl('turnstile.html');
    const fullSecurityUrl = `${securityUrl}?return=${returnUrl}&reason=bot&score=${state.score}`;
    
    console.log('🚀 Redirecting to:', fullSecurityUrl);
    
    setTimeout(() => {
      window.location.href = fullSecurityUrl;
    }, 100);
  }

  // ===========================================
  // 📊 MONITORING (Simplified)
  // ===========================================

  function setupEventListeners() {
    console.log('🕵️ Setting up behavior monitoring...');
    
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

    document.addEventListener('click', (e) => {
      state.clickEvents++;
      state.lastActivity = Date.now();
    });

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

  function analyzeBehavior() {
    let suspiciousPoints = 0;
    const now = Date.now();
    const timeSinceLastActivity = now - state.lastActivity;
    
    if (timeSinceLastActivity > 30000) suspiciousPoints += 10;
    if (state.mouseEvents === 0 && (now - state.sessionStart) > 120000) suspiciousPoints += 15;
    if (navigator.webdriver) suspiciousPoints += 25;
    
    return suspiciousPoints;
  }

  function performBehaviorCheck() {
    if (!state.monitoringActive || state.redirecting) return;
    
    const now = Date.now();
    
    if (now - state.sessionStart > CONFIG.SESSION_TIMEOUT) {
      console.log('🔄 Session expired, forcing re-verification');
      redirectToSecurityCheck('session_expired');
      return;
    }
    
    let cycleScore = analyzeBehavior();
    
    const timeSinceLastActivity = now - state.lastActivity;
    if (timeSinceLastActivity >= CONFIG.CHECK_INTERVAL) {
      state.noMovementCycles++;
      cycleScore += 2; // Reduced penalty
    } else {
      state.noMovementCycles = Math.max(0, state.noMovementCycles - 1);
    }
    
    if (state.noMovementCycles >= 8) { // More lenient
      cycleScore += state.noMovementCycles * 1;
    }
    
    state.score += cycleScore;
    state.score = Math.max(0, state.score);
    
    localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
    
    console.log(`🕵️ Check - Score: ${state.score}/${CONFIG.REDIRECT_THRESHOLD}, Cycle: +${cycleScore}`);
    
    if (state.score >= CONFIG.BLOCK_THRESHOLD) {
      blockUser();
    } else if (state.score >= CONFIG.REDIRECT_THRESHOLD) {
      redirectToSecurityCheck('suspicious_behavior');
    }
    
    state.impossibleSpeed = 0;
  }

  function blockUser() {
    console.log('🚫 User blocked');
    
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    localStorage.removeItem(CONFIG.LAST_CHECK_KEY);
    sessionStorage.removeItem(CONFIG.VERIFIED_KEY);
    document.cookie = 'sec_verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    const blockedUrl = getSecurityUrl('blocked.html');
    window.location.href = `${blockedUrl}?reason=bot&score=${state.score}`;
  }

  // ===========================================
  // 🚀 INITIALIZATION
  // ===========================================

  function startMonitoring() {
    console.log('🕵️ Starting behavior monitoring...');
    
    state.monitoringActive = true;
    setupEventListeners();
    
    setTimeout(() => {
      setInterval(performBehaviorCheck, CONFIG.CHECK_INTERVAL);
    }, 3000); // Longer delay
    
    console.log('✅ Monitoring started successfully');
  }

  function init() {
    console.log('🛡️ Creep.js in Security Folder - Initializing...');
    console.log('📍 Current path:', window.location.pathname);
    
    if (window.location.pathname.includes('security/') && 
        window.location.pathname.includes('turnstile.html')) {
      console.log('📍 In turnstile page, skipping creep.js');
      return;
    }
    
    if (window.location.pathname.includes('security/') && 
        window.location.pathname.includes('blocked.html')) {
      console.log('📍 In blocked page, skipping creep.js');
      return;
    }
    
    const justVerified = checkUrlParameters();
    
    if (justVerified) {
      console.log('🎉 Just completed verification, starting monitoring');
      startMonitoring();
      return;
    }
    
    console.log('🔍 Checking if verification needed...');
    
    if (!checkInitialVerification()) {
      console.log('❌ Initial verification failed, will redirect');
      return;
    }
    
    console.log('✅ All checks passed, starting monitoring');
    startMonitoring();
  }

  // ===========================================
  // 🎬 START SYSTEM
  // ===========================================

  function safeInit() {
    try {
      init();
    } catch (error) {
      console.error('🚨 Creep.js initialization error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(safeInit, 1000); // Longer delay
    });
  } else {
    setTimeout(safeInit, 1000);
  }

})();