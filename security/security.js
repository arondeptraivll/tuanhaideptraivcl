(function() {
    'use strict';
    
    // Function to redirect to blocked page
    function redirectToBlocked(reason = 'default') {
        window.location.href = '../security/blocked.html?reason=' + reason;
    }

    // Disable right-click context menu
    document.addEventListener('contextmenu', event => event.preventDefault(), false);
    
    // Disable drag and drop
    document.addEventListener('dragstart', event => event.preventDefault(), false);

    // Continuously disable context menu and drag events
    setInterval(() => {
        document.oncontextmenu = () => false;
        document.ondragstart = () => false;
    }, 1000);

    // Detect developer tools hotkeys and specific shortcuts
    document.addEventListener('keydown', function(event) {
        // F12 key
        if (event.key === 'F12' || 
            // F12 keyCode
            event.keyCode === 123 || 
            // Ctrl+Shift+I/J/C/K (DevTools shortcuts)
            (event.ctrlKey && event.shiftKey && ['I', 'J', 'C', 'K'].includes(event.key)) ||
            // Ctrl+U (View Source) - BLOCKED
            (event.ctrlKey && event.key.toLowerCase() === 'u') ||
            // Ctrl+S (Save Page) - BLOCKED
            (event.ctrlKey && event.key.toLowerCase() === 's')) {
            
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true);

    // DevTools detection by window size difference
    let devToolsOpen = false;
    
    function checkDevTools() {
        const threshold = 200; // 0xc8 in hex
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        
        if (widthDiff > threshold && heightDiff > threshold) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                redirectToBlocked('devtools');
            }
        } else {
            devToolsOpen = false;
        }
    }

    // Console detection using getter trap
    let consoleAccessCount = 0;
    let fakeImage = new Image();
    
    Object.defineProperty(fakeImage, 'id', {
        'get': function() {
            consoleAccessCount++;
            if (consoleAccessCount > 3) {
                redirectToBlocked('console');
            }
        }
    });

    // Console timing detection
    function detectConsoleByTiming() {
        let startTime = performance.now();
        console.log('%c', '');
        let endTime = performance.now();
        
        if (endTime - startTime > 200) { // 0xc8 in hex
            redirectToBlocked('timing');
        }
    }

    // Main detection loop
    setInterval(() => {
        checkDevTools();
        
        // Randomly trigger console detection
        if (Math.random() > 0.7) {
            console.dir(fakeImage);
        }
        
        if (Math.random() > 0.8) {
            detectConsoleByTiming();
        }
    }, 1000);

    // Mobile device detection
    function detectMobileDevTools() {
        if (window.screen.width > 1024 && // 0x400 in hex
            window.innerWidth < 500 &&    // 0x1f4 in hex
            !navigator.userAgent.includes('Mobile')) {
            redirectToBlocked('mobile');
        }
    }

    // Iframe detection
    if (window.self !== window.top) {
        redirectToBlocked('iframe');
    }

    // Window focus/blur detection
    let windowFocused = false;
    
    window.addEventListener('focus', () => {
        windowFocused = true;
    });
    
    window.addEventListener('blur', () => {
        if (windowFocused) {
            setTimeout(checkDevTools, 2000); // 0x7d0 in hex
        }
        windowFocused = false;
    });

    // Periodic mobile detection
    setInterval(() => {
        if (Math.random() > 0.9) {
            detectMobileDevTools();
        }
    }, 5000); // 0x1388 in hex

    // Initial check after page load
    setTimeout(() => {
        checkDevTools();
    }, 3000); // 0xbb8 in hex

})();

// Fallback noscript redirect
document.write('<noscript><meta http-equiv="refresh" content="0;url=../security/blocked.html?reason=default"></noscript>');
