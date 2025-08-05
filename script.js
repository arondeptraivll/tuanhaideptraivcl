// ==================== AUTHENTICATION SYSTEM ====================
const AUTH_API = '/api/auth';

// DOM elements for auth
let loginPrompt, userInfo, userAvatar, userName, userMenuBtn, dropdownMenu, logoutBtn;

// ==================== BACKGROUND & WELCOME SYSTEM ====================
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.querySelector('.enter-btn');
const bgAudio = document.getElementById('bg-audio');
const bgVideo = document.getElementById('bg-video');
const loadingSpinner = document.createElement('div');

// ==================== MAIN INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing...');
    
    // Initialize all systems
    initializeElements();
    initializeLoadingSpinner();
    setupWelcomeOverlay();
    setupBackgroundMedia();
    setupAnimations();
    setupRainbowAnimations();
    
    // Auth system
    checkLoginWelcome();
    checkLoginStatus();
    setupUserMenu();
});

// ==================== ELEMENT INITIALIZATION ====================
function initializeElements() {
    // Auth elements
    loginPrompt = document.getElementById('loginPrompt');
    userInfo = document.getElementById('userInfo');
    userAvatar = document.getElementById('userAvatar');
    userName = document.getElementById('userName');
    userMenuBtn = document.getElementById('userMenuBtn');
    dropdownMenu = document.getElementById('dropdownMenu');
    logoutBtn = document.getElementById('logoutBtn');
}

function initializeLoadingSpinner() {
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.id = 'loading-spinner';
    document.body.appendChild(loadingSpinner);
}

// ==================== WELCOME OVERLAY SYSTEM ====================
function setupWelcomeOverlay() {
    if (enterBtn) {
        enterBtn.addEventListener('click', function() {
            console.log('🎬 Entering website...');
            
            // Show loading spinner
            loadingSpinner.style.display = 'block';
            
            setTimeout(() => {
                // Hide welcome overlay
                welcomeOverlay.classList.add('hidden');
                loadingSpinner.style.display = 'none';
                
                // Start background media
                playBackgroundMedia();
            }, 500);
        });
    }
}

// ==================== BACKGROUND MEDIA SYSTEM ====================
function setupBackgroundMedia() {
    // Setup video error handling
    if (bgVideo) {
        bgVideo.addEventListener('loadstart', () => {
            console.log('🎥 Video loading started');
        });
        
        bgVideo.addEventListener('canplay', () => {
            console.log('🎥 Video can play');
        });
        
        bgVideo.addEventListener('error', (e) => {
            console.error('🎥 Video error:', e);
        });
    }
    
    // Setup audio error handling
    if (bgAudio) {
        bgAudio.addEventListener('loadstart', () => {
            console.log('🔊 Audio loading started');
        });
        
        bgAudio.addEventListener('canplay', () => {
            console.log('🔊 Audio can play');
        });
        
        bgAudio.addEventListener('error', (e) => {
            console.error('🔊 Audio error:', e);
        });
    }
}

function playBackgroundMedia() {
    playVideo();
    playAudio();
}

function playVideo() {
    if (bgVideo) {
        console.log('🎥 Starting video...');
        bgVideo.classList.add('playing');
        bgVideo.play().catch(error => {
            console.log('🎥 Video autoplay prevented:', error);
        });
    }
}

function playAudio() {
    if (bgAudio) {
        console.log('🔊 Starting audio...');
        bgAudio.currentTime = 0;
        bgAudio.play().catch(error => {
            console.log('🔊 Audio autoplay prevented:', error);
        });
    }
}

// ==================== RAINBOW ANIMATIONS SYSTEM ====================
function setupRainbowAnimations() {
    setupAvatarBorderAnimation();
    setupTopButtonAnimations();
}

function setupAvatarBorderAnimation() {
    const avatarBorder = document.querySelector('.bio-container .avatar-border');
    if (!avatarBorder) return;
    
    let deg = 0;
    let animationId;

    function animateAvatarBorder() {
        deg = (deg + 1) % 360;
        avatarBorder.style.background = `conic-gradient(
            from ${deg}deg,
            #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
        )`;
        animationId = requestAnimationFrame(animateAvatarBorder);
    }

    // Start animation
    animateAvatarBorder();

    // Pause animation when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animateAvatarBorder();
        }
    });
}

function setupTopButtonAnimations() {
    const topButtons = document.querySelectorAll('.top-button');
    
    topButtons.forEach(button => {
        let buttonDeg = 0;
        let buttonAnimId;

        const animateButtonRainbow = () => {
            buttonDeg = (buttonDeg + 2) % 360;
            button.style.backgroundImage = `
                linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)),
                conic-gradient(
                    from ${buttonDeg}deg,
                    #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
                )
            `;
            buttonAnimId = requestAnimationFrame(animateButtonRainbow);
        };

        button.addEventListener('mouseenter', () => {
            button.classList.add('rainbow-border');
            animateButtonRainbow();
        });

        button.addEventListener('mouseleave', () => {
            cancelAnimationFrame(buttonAnimId);
            button.classList.remove('rainbow-border');
            button.style.backgroundImage = '';
            buttonDeg = 0;
        });
    });
}

// ==================== GENERAL ANIMATIONS ====================
function setupAnimations() {
    // Social icons already have CSS animations, just ensure they work
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach((icon, index) => {
        // Add staggered animation delay
        icon.style.animationDelay = `${index * 2}s`;
    });
    
    // Username rainbow text animation is handled by CSS
    
    // Add subtle entrance animations
    setTimeout(() => {
        const bioContainer = document.querySelector('.bio-container');
        if (bioContainer) {
            bioContainer.style.animation = 'fadeInUp 1s ease-out';
        }
        
        const socialIconsContainer = document.querySelector('.social-icons');
        if (socialIconsContainer) {
            socialIconsContainer.style.animation = 'fadeInUp 1s ease-out 0.5s both';
        }
    }, 1000);
}

// ==================== AUTHENTICATION SYSTEM ====================

// Check for login welcome message
function checkLoginWelcome() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login_success');
    const username = urlParams.get('username');
    const userId = urlParams.get('user_id');
    const avatar = urlParams.get('avatar');
    
    console.log('🔍 Checking URL params:', { loginSuccess, username, userId, avatar });
    
    if (loginSuccess === 'true' && username) {
        console.log('✅ Login success detected, processing...');
        
        // Clean URL immediately
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Show welcome notification
        showNotification('Chào mừng ' + decodeURIComponent(username) + ' trở lại!', 'success');
        
        // Create session data from URL params for immediate display
        if (userId) {
            const tempUserData = {
                id: userId,
                username: decodeURIComponent(username),
                globalName: decodeURIComponent(username),
                avatar: avatar || null
            };
            
            console.log('👤 Showing user info immediately:', tempUserData);
            showUserInfo(tempUserData);
            
            // Save to localStorage for persistence
            const sessionToken = btoa(JSON.stringify(tempUserData));
            localStorage.setItem('sessionToken', sessionToken);
        }
        
        // Then check for full session data
        setTimeout(() => {
            console.log('🔄 Checking full login status...');
            checkLoginStatus();
        }, 2000);
    }
}

// Check if user is logged in
async function checkLoginStatus() {
    console.log('🔍 Checking login status...');
    
    const sessionToken = localStorage.getItem('sessionToken');
    console.log('📱 Session token exists:', !!sessionToken);
    
    try {
        // Check IP session first
        console.log('🌐 Checking IP session...');
        const ipResponse = await fetch(AUTH_API + '?action=check_session');
        
        if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            console.log('🌐 IP session response:', ipData);
            
            if (ipData.has_session && ipData.user) {
                console.log('✅ Found IP session for user:', ipData.user.username);
                showUserInfo(ipData.user);
                
                // Save token to localStorage
                if (ipData.token) {
                    localStorage.setItem('sessionToken', ipData.token);
                }
                return;
            }
        }

        // If no IP session, check token
        if (sessionToken) {
            console.log('🔐 Verifying token...');
            const tokenResponse = await fetch(AUTH_API + '?action=verify', {
                headers: {
                    'Authorization': 'Bearer ' + sessionToken,
                    'Content-Type': 'application/json'
                }
            });

            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                console.log('🔐 Token verification response:', tokenData);
                
                if (tokenData.valid && tokenData.user) {
                    console.log('✅ Token valid for user:', tokenData.user.username);
                    showUserInfo(tokenData.user);
                    return;
                }
            }
        }

        // No valid session found
        console.log('❌ No valid session found');
        localStorage.removeItem('sessionToken');
        showLoginButton();

    } catch (error) {
        console.error('💥 Error checking login:', error);
        
        // Fallback: try to decode token manually
        if (sessionToken) {
            try {
                const tokenData = JSON.parse(atob(sessionToken));
                if (tokenData.id && tokenData.username) {
                    console.log('🔄 Using cached token data');
                    showUserInfo(tokenData);
                    return;
                }
            } catch (decodeError) {
                console.error('💥 Token decode error:', decodeError);
            }
        }
        
        showLoginButton();
    }
}

// Show login button
function showLoginButton() {
    console.log('👤 Showing login button');
    if (loginPrompt) loginPrompt.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
}

// Show user info
function showUserInfo(user) {
    console.log('✅ Showing user info for:', user);
    
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    
    // Set username
    if (userName) {
        userName.textContent = user.globalName || user.username;
    }
    
    // Set avatar
    if (userAvatar) {
        if (user.avatar) {
            userAvatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
        } else {
            // Default Discord avatar
            const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${(user.discriminator || 0) % 5}.png`;
            userAvatar.src = defaultAvatar;
        }
    }
    
    console.log('👤 User info updated successfully');
}

// Setup user menu functionality
function setupUserMenu() {
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('show');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (dropdownMenu) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const confirmLogout = confirm('Bạn có chắc chắn muốn đăng xuất?');
            if (!confirmLogout) return;

            console.log('🚪 Logging out...');
            
            // Clear localStorage
            localStorage.removeItem('sessionToken');
            
            // Clear server session
            try {
                await fetch(AUTH_API + '?action=clear_session', {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Error clearing session:', error);
            }
            
            // Update UI
            showLoginButton();
            showNotification('Đã đăng xuất thành công', 'success');
        });
    }
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Apply styles directly
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${type === 'success' ? 'linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,204,255,0.9))' : 'linear-gradient(135deg, rgba(255,68,68,0.9), rgba(255,107,107,0.9))'};
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        transition: transform 0.3s ease;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
    `;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notification.innerHTML = `<span style="font-size: 16px">${icon}</span><span>${message}</span>`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ==================== CSS ANIMATIONS (INJECTED) ====================
// Add missing CSS animations
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .notification {
        animation: slideInDown 0.3s ease-out;
    }
    
    @keyframes slideInDown {
        from {
            transform: translateX(-50%) translateY(-100px);
        }
        to {
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(additionalStyles);

// ==================== UTILITY FUNCTIONS ====================
function addGlobalEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause animations when tab is hidden
            if (bgAudio && !bgAudio.paused) {
                bgAudio.pause();
            }
        } else {
            // Resume when tab is visible
            if (bgAudio && bgAudio.paused && !welcomeOverlay.classList.contains('hidden')) {
                bgAudio.play().catch(e => console.log('Audio resume failed:', e));
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Adjust video size if needed
        if (bgVideo) {
            console.log('Window resized, video will auto-adjust');
        }
    });
}

// Initialize global event listeners
addGlobalEventListeners();

// ==================== EXPORT FOR DEBUGGING ====================
window.authModule = {
    checkLoginStatus,
    showNotification,
    showUserInfo,
    showLoginButton,
    playBackgroundMedia,
    bgVideo,
    bgAudio
};

// ==================== DEBUG FUNCTIONS ====================
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugAuth = {
        checkStatus: checkLoginStatus,
        clearStorage: () => localStorage.clear(),
        showLogin: showLoginButton,
        testNotification: (msg, type) => showNotification(msg, type)
    };
    console.log('🔧 Debug functions available: window.debugAuth');
}

console.log('🎉 Script fully loaded and initialized!');
