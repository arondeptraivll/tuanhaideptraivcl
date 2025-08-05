// blacklist.js - Complete blacklist handling system

(function() {
    'use strict';
    
    // Configuration
    const BLACKLIST_CONFIG = {
        checkInterval: 60000, // Check blacklist every 60 seconds
        apiEndpoint: '/api/auth',
        messages: {
            blocked: 'Bạn đã bị chặn',
            buttonText: 'OK'
        }
    };
    
    // Load SweetAlert2 if not already loaded
    if (typeof Swal === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        script.onload = initializeBlacklistSystem;
        document.head.appendChild(script);
    } else {
        initializeBlacklistSystem();
    }
    
    function initializeBlacklistSystem() {
        // Add required styles
        addBlockingStyles();
        
        // Check on page load
        checkBlacklistStatus();
        
        // Check URL parameters
        checkURLParameters();
        
        // Set up periodic checks
        setInterval(checkBlacklistStatus, BLACKLIST_CONFIG.checkInterval);
        
        // Override existing auth functions if needed
        overrideAuthFunctions();
    }
    
    function addBlockingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Blacklist blocking styles */
            .blacklist-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.95) !important;
                z-index: 999999 !important;
                pointer-events: all !important;
                display: none;
            }
            
            .blacklist-overlay.active {
                display: block !important;
            }
            
            body.user-blocked {
                overflow: hidden !important;
                pointer-events: none !important;
                user-select: none !important;
            }
            
            body.user-blocked * {
                pointer-events: none !important;
                user-select: none !important;
            }
            
            .swal2-container.blacklist-alert {
                z-index: 1000000 !important;
            }
            
            .swal2-container.blacklist-alert .swal2-popup {
                pointer-events: all !important;
            }
            
            .swal2-container.blacklist-alert .swal2-confirm {
                pointer-events: all !important;
                cursor: pointer !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const isBlacklisted = urlParams.get('blacklisted') === 'true';
        const username = urlParams.get('user');
        
        if (isBlacklisted) {
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Show blocking message
            activateBlocking(username);
        }
    }
    
    async function checkBlacklistStatus() {
        try {
            const response = await fetch(`${BLACKLIST_CONFIG.apiEndpoint}?action=check_session`);
            const data = await response.json();
            
            if (data.blacklisted) {
                activateBlocking(data.user?.username);
            }
            
            // Also check if token is blacklisted
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            if (token) {
                const verifyResponse = await fetch(`${BLACKLIST_CONFIG.apiEndpoint}?action=verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const verifyData = await verifyResponse.json();
                if (verifyData.blacklisted) {
                    activateBlocking();
                }
            }
        } catch (error) {
            console.error('Blacklist check error:', error);
        }
    }
    
    function activateBlocking(username) {
        // Create or show overlay
        let overlay = document.querySelector('.blacklist-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'blacklist-overlay';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
        
        // Add blocked class to body
        document.body.classList.add('user-blocked');
        
        // Disable all interactions
        disableAllInteractions();
        
        // Show infinite alert
        showBlockedAlert();
        
        // Clear all auth data
        clearAuthData();
    }
    
    function showBlockedAlert() {
        Swal.fire({
            title: BLACKLIST_CONFIG.messages.blocked,
            icon: 'error',
            confirmButtonText: BLACKLIST_CONFIG.messages.buttonText,
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showCancelButton: false,
            showCloseButton: false,
            customClass: {
                container: 'blacklist-alert'
            },
            didOpen: () => {
                // Ensure only the button is clickable
                const popup = Swal.getPopup();
                const confirmButton = Swal.getConfirmButton();
                
                if (popup) popup.style.pointerEvents = 'all';
                if (confirmButton) confirmButton.style.pointerEvents = 'all';
            },
            didClose: () => {
                // Immediately show again when closed
                setTimeout(showBlockedAlert, 10);
            }
        }).then((result) => {
            // Show alert again when OK is clicked
            if (result.isConfirmed || result.isDismissed) {
                setTimeout(showBlockedAlert, 10);
            }
        });
    }
    
    function disableAllInteractions() {
        // Prevent all keyboard events
        const preventEvent = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        };
        
        // Block keyboard
        document.addEventListener('keydown', preventEvent, true);
        document.addEventListener('keyup', preventEvent, true);
        document.addEventListener('keypress', preventEvent, true);
        
        // Block mouse events
        document.addEventListener('click', preventEvent, true);
        document.addEventListener('mousedown', preventEvent, true);
        document.addEventListener('mouseup', preventEvent, true);
        document.addEventListener('contextmenu', preventEvent, true);
        document.addEventListener('dblclick', preventEvent, true);
        
        // Block touch events
        document.addEventListener('touchstart', preventEvent, true);
        document.addEventListener('touchend', preventEvent, true);
        document.addEventListener('touchmove', preventEvent, true);
        
        // Block selection
        document.addEventListener('selectstart', preventEvent, true);
        document.addEventListener('select', preventEvent, true);
        
        // Block drag
        document.addEventListener('dragstart', preventEvent, true);
        document.addEventListener('drag', preventEvent, true);
        document.addEventListener('dragend', preventEvent, true);
        
        // Block copy/paste
        document.addEventListener('copy', preventEvent, true);
        document.addEventListener('cut', preventEvent, true);
        document.addEventListener('paste', preventEvent, true);
        
        // Disable all links and buttons
        document.querySelectorAll('a, button, input, select, textarea').forEach(el => {
            el.style.pointerEvents = 'none';
            el.disabled = true;
        });
        
        // Override console methods to prevent debugging
        const noop = () => {};
        ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
            console[method] = noop;
        });
        
        // Prevent developer tools shortcuts
        document.addEventListener('keydown', function(e) {
            // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
            if (e.keyCode === 123 || 
                (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67))) {
                e.preventDefault();
                return false;
            }
        }, true);
    }
    
    function clearAuthData() {
        // Clear all storage
        sessionStorage.clear();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Clear cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear session via API
        fetch(`${BLACKLIST_CONFIG.apiEndpoint}?action=clear_session`, {
            method: 'POST'
        }).catch(() => {});
    }
    
    function overrideAuthFunctions() {
        // Override global auth check function if it exists
        if (typeof window.checkAuthStatus === 'function') {
            const originalCheckAuth = window.checkAuthStatus;
            window.checkAuthStatus = async function() {
                await checkBlacklistStatus();
                return originalCheckAuth.apply(this, arguments);
            };
        }
        
        // Override login function if it exists
        if (typeof window.login === 'function') {
            const originalLogin = window.login;
            window.login = async function() {
                await checkBlacklistStatus();
                return originalLogin.apply(this, arguments);
            };
        }
    }
    
    // Expose functions for external use
    window.BlacklistSystem = {
        check: checkBlacklistStatus,
        activate: activateBlocking,
        isBlocked: () => document.body.classList.contains('user-blocked')
    };
    
})();