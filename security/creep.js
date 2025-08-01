(function () {
  const noScript = document.createElement('noscript');
  noScript.innerHTML = `<meta http-equiv="refresh" content="0;url=/security/blocked.html?reason=bot">`;
  document.body.appendChild(noScript);

  function redirect() {
    window.location.href = `/security/blocked.html?reason=bot`;
  }

  async function detectHeadless() {
    let score = 0;

    try {
      if (navigator.webdriver) score++;
      if (!navigator.plugins || navigator.plugins.length === 0) score++;
      if (!navigator.languages || navigator.languages.length < 1) score++;
      if (!window.chrome || !window.chrome.runtime) score++;

      try {
        const perm = await navigator.permissions.query({ name: 'notifications' });
        if (Notification.permission === 'denied' && perm.state === 'prompt') score++;
      } catch (_) {
        score++;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('test', 2, 2);
      const canvasData = canvas.toDataURL();
      if (canvasData.length < 3000) score++;

      try {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (vendor.toLowerCase().includes('google') || renderer.toLowerCase().includes('swiftshader')) score++;
      } catch (_) {
        score++;
      }

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const analyser = audioCtx.createAnalyser();
        const gain = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start(0);
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        oscillator.stop();
        if (freqData[0] === 0) score++;
      } catch (_) {
        score++;
      }

      const funcStr = Function.prototype.toString;
      if (funcStr.call(navigator.permissions.query).indexOf('[native code]') === -1) score++;

      const start = performance.now();
      eval('');
      const diff = performance.now() - start;
      if (diff > 100) score++;

      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('headless') || ua.includes('phantom')) score++;

      if (window.top !== window.self) score++;

      if (score >= 4) redirect();

    } catch (err) {
      redirect();
    }
  }

  window.addEventListener('load', () => {
    setTimeout(detectHeadless, 500);
  });
})();
