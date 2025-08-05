// API endpoint
const AUTH_API = '/api/auth';

// DOM elements
let loginPrompt, userInfo, userAvatar, userName, userMenuBtn, dropdownMenu, logoutBtn;
let welcomeOverlay, enterBtn, bgAudio, bgVideo, loadingSpinner;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing...');
    
    // Get DOM elements
    initializeElements();
    
    // Setup functionality
    checkLoginWelcome();
    checkLoginStatus();
    setupUserMenu();
    setupWelcomeOverlay();
    setupAnimations();
});

// Initialize DOM elements
function initializeElements() {
    loginPrompt = document.getElementById('loginPrompt');
    userInfo = document.getElementById('userInfo');
    userAvatar = document.getElementById('userAvatar');
    userName = document.getElementById('userName');
    userMenuBtn = document.getElementById('userMenuBtn');
    dropdownMenu = document.getElementById('dropdownMenu');
    logoutBtn = document.getElementById('logoutBtn');
    welcomeOverlay = document.getElementById('welcome-overlay');
    enterBtn = document.querySelector('.enter-btn');
    bgAudio = document.getElementById('bg-audio');
    bgVideo = document.getElementById('bg-video');
    loadingSpinner = document.getElementById('loading-spinner');
}

// Setup welcome overlay
function setupWelcomeOverlay() {
    if (enterBtn) {
        enterBtn.addEventListener('click', function() {
            console.log('🎬 Entering website...');
            
            if (loadingSpinner) {
                loadingSpinner.style.display = 'block';
            }
            
            setTimeout(() => {
                if (welcomeOverlay) {
                    welcomeOverlay.classList.add('hidden');
                }
                if (loadingSpinner) {
                    loadingSpinner.style.display = 'none';
                }
                playAudio();
                playVideo();
            }, 500);
        });
    }
}

// Play background audio
function playAudio() {
    if (bgAudio) {
        bgAudio.currentTime = 0;
        bgAudio.play().catch(error => {
            console.log('🔊 Audio autoplay prevented:', error);
        });
    }
}

// Play background video
function playVideo() {
    if (bgVideo) {
        bgVideo.classList.add('playing');
        bgVideo.play().catch(error => {
            console.log('🎥 Video play failed:', error);
        });
    }
}

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

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Apply styles directly since we don't have CSS class
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

// Setup animations
function setupAnimations() {
    // Top buttons rainbow effect
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

// Export functions for global use if needed
window.authModule = {
    checkLoginStatus,
    showNotification,
    showUserInfo,
    showLoginButton
};
