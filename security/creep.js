(function() {
  'use strict';

  // ===========================================
  // 🕵️ CREEP.JS - Advanced Bot Detection System
  // ===========================================
  
  const CONFIG = {
    CHECK_INTERVAL: 3000,        // Kiểm tra mỗi 3 giây
    BLOCK_THRESHOLD: 100,        // Điểm tối thiểu để block
    SESSION_TIMEOUT: 300000,     // 5 phút reset session
    STORAGE_KEY: 'creep_score'
  };

  let state = {
    score: parseInt(localStorage.getItem(CONFIG.STORAGE_KEY)) || 0,
    lastActivity: Date.now(),
    sessionStart: Date.now(),
    
    // Tracking variables
    mouseEvents: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    clickEvents: 0,
    focusEvents: 0,
    touchEvents: 0,
    resizeEvents: 0,
    
    // Behavior patterns
    mousePath: [],
    clickPattern: [],
    scrollPattern: [],
    timeSpent: 0,
    
    // Suspicious behaviors
    noMovementCycles: 0,
    perfectScrolls: 0,
    roboticClicks: 0,
    impossibleSpeed: 0,
    
    // Last positions
    lastMouseX: 0,
    lastMouseY: 0,
    lastScrollY: 0,
    lastActiveTime: Date.now()
  };

  // ===========================================
  // 📊 Event Listeners & Tracking
  // ===========================================

  // Mouse tracking
  document.addEventListener('mousemove', (e) => {
    state.mouseEvents++;
    state.lastActivity = Date.now();
    
    // Check mouse speed (too fast = suspicious)
    const speed = Math.sqrt(
      Math.pow(e.clientX - state.lastMouseX, 2) + 
      Math.pow(e.clientY - state.lastMouseY, 2)
    );
    
    if (speed > 500) state.impossibleSpeed++;
    
    // Track mouse path
    state.mousePath.push({
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    });
    
    // Keep only last 10 points
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
    
    const clickTime = Date.now();
    state.clickPattern.push({
      x: e.clientX,
      y: e.clientY,
      time: clickTime
    });
    
    // Check for robotic clicking (same position, regular interval)
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
    
    // Keep only last 5 clicks
    if (state.clickPattern.length > 5) {
      state.clickPattern.shift();
    }
  });

  // Scroll tracking
  document.addEventListener('scroll', () => {
    state.scrollEvents++;
    state.lastActivity = Date.now();
    
    const currentScrollY = window.scrollY;
    const scrollDiff = Math.abs(currentScrollY - state.lastScrollY);
    
    // Check for perfect scrolls (exactly same distance)
    if (scrollDiff > 0) {
      state.scrollPattern.push(scrollDiff);
      
      if (state.scrollPattern.length >= 5) {
        const allSame = state.scrollPattern.slice(-5).every(diff => 
          Math.abs(diff - state.scrollPattern[state.scrollPattern.length - 1]) < 2
        );
        
        if (allSame) state.perfectScrolls++;
        
        if (state.scrollPattern.length > 10) {
          state.scrollPattern.shift();
        }
      }
    }
    
    state.lastScrollY = currentScrollY;
  });

  // Keyboard tracking
  document.addEventListener('keydown', () => {
    state.keyboardEvents++;
    state.lastActivity = Date.now();
  });

  // Focus/blur tracking
  window.addEventListener('focus', () => {
    state.focusEvents++;
    state.lastActivity = Date.now();
  });

  window.addEventListener('blur', () => {
    state.focusEvents++;
  });

  // Touch tracking (mobile)
  document.addEventListener('touchstart', () => {
    state.touchEvents++;
    state.lastActivity = Date.now();
  });

  // Resize tracking
  window.addEventListener('resize', () => {
    state.resizeEvents++;
  });

  // Page visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      state.lastActiveTime = Date.now();
    } else {
      state.lastActivity = Date.now();
    }
  });

  // ===========================================
  // 🔍 Analysis Functions
  // ===========================================

  function analyzeMouseBehavior() {
    let suspiciousPoints = 0;
    
    // Check for linear mouse movement (bot-like)
    if (state.mousePath.length >= 5) {
      const path = state.mousePath.slice(-5);
      let linearCount = 0;
      
      for (let i = 2; i < path.length; i++) {
        const slope1 = (path[i-1].y - path[i-2].y) / (path[i-1].x - path[i-2].x);
        const slope2 = (path[i].y - path[i-1].y) / (path[i].x - path[i-1].x);
        
        if (Math.abs(slope1 - slope2) < 0.1) linearCount++;
      }
      
      if (linearCount >= 3) suspiciousPoints += 10;
    }
    
    return suspiciousPoints;
  }

  function analyzeActivityPattern() {
    let suspiciousPoints = 0;
    const now = Date.now();
    const timeSinceLastActivity = now - state.lastActivity;
    
    // No activity for too long
    if (timeSinceLastActivity > 10000) {
      suspiciousPoints += 15;
    }
    
    // Too many perfect scrolls
    if (state.perfectScrolls > 3) {
      suspiciousPoints += 20;
    }
    
    // Robotic clicking
    if (state.roboticClicks > 2) {
      suspiciousPoints += 25;
    }
    
    // Impossible mouse speed
    if (state.impossibleSpeed > 5) {
      suspiciousPoints += 15;
    }
    
    // No mouse movement at all
    if (state.mouseEvents === 0 && (now - state.sessionStart) > 30000) {
      suspiciousPoints += 30;
    }
    
    return suspiciousPoints;
  }

  function analyzeBrowserFingerprint() {
    let suspiciousPoints = 0;
    
    // WebDriver
    if (navigator.webdriver) suspiciousPoints += 25;
    
    // Headless indicators
    if (!window.chrome || !window.chrome.webstore) suspiciousPoints += 10;
    
    // No plugins
    if (!navigator.plugins || navigator.plugins.length === 0) suspiciousPoints += 5;
    
    // WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer && renderer.toLowerCase().includes('swiftshader')) {
            suspiciousPoints += 20;
          }
        }
      }
    } catch (_) {}
    
    return suspiciousPoints;
  }

  // ===========================================
  // ⚡ Main Detection Logic
  // ===========================================

  function performCheck() {
    const now = Date.now();
    state.timeSpent = now - state.sessionStart;
    
    // Reset session if too old
    if (state.timeSpent > CONFIG.SESSION_TIMEOUT) {
      state = { ...state, score: 0, sessionStart: now };
      localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
    
    let cycleScore = 0;
    
    // Analyze current cycle
    cycleScore += analyzeMouseBehavior();
    cycleScore += analyzeActivityPattern();
    cycleScore += analyzeBrowserFingerprint();
    
    // Check for no movement in this cycle
    const timeSinceLastActivity = now - state.lastActivity;
    if (timeSinceLastActivity >= CONFIG.CHECK_INTERVAL) {
      state.noMovementCycles++;
      cycleScore += 10; // Penalty for no activity
    } else {
      state.noMovementCycles = Math.max(0, state.noMovementCycles - 1);
    }
    
    // Progressive penalty for consecutive no-movement cycles
    if (state.noMovementCycles >= 3) {
      cycleScore += state.noMovementCycles * 5;
    }
    
    // Add to total score
    state.score += cycleScore;
    
    // Save to localStorage
    localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
    
    // Debug log (remove in production)
    console.log(`🕵️ Creep Check - Score: ${state.score}/${CONFIG.BLOCK_THRESHOLD}, Cycle: +${cycleScore}, No Movement: ${state.noMovementCycles}`);
    
    // Block if threshold reached
    if (state.score >= CONFIG.BLOCK_THRESHOLD) {
      blockUser();
    }
    
    // Reset cycle counters
    resetCycleCounters();
  }

  function resetCycleCounters() {
    // Keep cumulative data, reset only cycle-specific counters
    state.impossibleSpeed = 0;
  }

  function blockUser() {
    console.log('🚫 Bot detected - Redirecting...');
    
    // Clear storage
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    
    // Redirect
    window.location.href = `/security/blocked.html?reason=bot_behavior&score=${state.score}`;
  }

  // ===========================================
  // 🚀 Initialize
  // ===========================================

  function init() {
    console.log('🕵️ Creep.js initialized - Behavioral tracking active');
    
    // Start monitoring
    setInterval(performCheck, CONFIG.CHECK_INTERVAL);
    
    // Immediate browser fingerprint check
    const browserScore = analyzeBrowserFingerprint();
    if (browserScore > 50) {
      state.score += browserScore;
      localStorage.setItem(CONFIG.STORAGE_KEY, state.score.toString());
    }
  }

  // Wait for DOM and start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===========================================
  // 🛡️ NoScript Fallback
  // ===========================================
  
  const noScript = document.createElement('noscript');
  noScript.innerHTML = `<meta http-equiv="refresh" content="0;url=/security/blocked.html?reason=noscript">`;
  document.head.appendChild(noScript);

})();