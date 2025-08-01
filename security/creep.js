(function () {
  // Nếu JS không chạy, redirect (chặn BeautifulSoup4, curl, ...)
  const noScript = document.createElement('noscript');
  noScript.innerHTML = `<meta http-equiv="refresh" content="0;url=/security/blocked.html?reason=noscript">`;
  document.body.appendChild(noScript);

  function redirect(reason) {
    window.location.href = `/security/blocked.html?reason=${reason}`;
  }

  async function detectBot() {
    let score = 0;
    let reasons = [];

    // 1. Check navigator.webdriver (rất ít user thật bị dính)
    if (navigator.webdriver) {
      score += 2;
      reasons.push('webdriver');
    }

    // 2. Check headless user-agent
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('headless') || ua.includes('phantom')) {
      score += 2;
      reasons.push('ua_headless');
    }

    // 3. Check Chrome object (hạn chế false positive)
    if (!window.chrome || !window.chrome.webstore) {
      score += 1;
      reasons.push('chrome_obj');
    }

    // 4. Check WebGL renderer (chỉ cộng điểm nếu đúng headless)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer && (renderer.toLowerCase().includes('swiftshader') || renderer.toLowerCase().includes('llvmpipe'))) {
            score += 2;
            reasons.push('webgl_renderer');
          }
        }
      }
    } catch (_) {}

    // 5. Check permissions (ít false positive)
    try {
      const perm = await navigator.permissions.query({ name: 'notifications' });
      if (Notification.permission === 'denied' && perm.state === 'prompt') {
        score += 1;
        reasons.push('perm_notification');
      }
    } catch (_) {}

    // 6. Check Function.toString (anti-tamper)
    try {
      const funcStr = Function.prototype.toString;
      if (funcStr.call(navigator.permissions.query).indexOf('[native code]') === -1) {
        score += 1;
        reasons.push('func_tostring');
      }
    } catch (_) {}

    // 7. Check if in iframe (ít false positive)
    if (window.top !== window.self) {
      score += 1;
      reasons.push('iframe');
    }

    // 8. Check JS execution time (chỉ cộng điểm nếu quá chậm)
    const start = performance.now();
    eval('');
    const diff = performance.now() - start;
    if (diff > 200) {
      score += 1;
      reasons.push('js_slow');
    }

    // 9. Check touch support (user thật mobile thường có)
    if ('ontouchstart' in window === false && /mobile|android|iphone|ipad/.test(ua)) {
      score += 1;
      reasons.push('no_touch');
    }

    // 10. Check timezone (headless thường UTC)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'UTC') {
      score += 1;
      reasons.push('timezone_utc');
    }

    // 11. Check screen size (headless thường 800x600 hoặc 1920x1080)
    if (
      (screen.width === 800 && screen.height === 600) ||
      (screen.width === 1920 && screen.height === 1080)
    ) {
      score += 1;
      reasons.push('screen_size');
    }

    // 12. Check for languages (nhiều user thật có, nhưng headless thường thiếu)
    if (!navigator.languages || navigator.languages.length === 0) {
      score += 1;
      reasons.push('no_languages');
    }

    // 13. Check for plugins (nhiều user thật không có, nên chỉ cộng nhẹ)
    if (!navigator.plugins || navigator.plugins.length === 0) {
      score += 0.5;
      reasons.push('no_plugins');
    }

    // 14. Check for hardwareConcurrency (headless thường là 2)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      score += 0.5;
      reasons.push('low_cpu');
    }

    // 15. Check for deviceMemory (headless thường là 0 hoặc 2)
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
      score += 0.5;
      reasons.push('low_mem');
    }

    // 16. Check for WebRTC leak (headless thường không có)
    if (!window.RTCPeerConnection) {
      score += 0.5;
      reasons.push('no_webrtc');
    }

    // 17. Check for mouse movement (user thật sẽ di chuột)
    let mouseMoved = false;
    window.addEventListener('mousemove', function handler() {
      mouseMoved = true;
      window.removeEventListener('mousemove', handler);
    });

    // Đợi 1s để xem có di chuột không (chỉ cộng điểm nếu không di chuột)
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!mouseMoved) {
      score += 1;
      reasons.push('no_mousemove');
    }

    // Nếu tổng điểm >= 5 thì mới redirect (giảm false positive)
    if (score >= 5) {
      redirect(reasons.join(','));
    }
  }

  window.addEventListener('load', () => {
    setTimeout(detectBot, 500);
  });
})();