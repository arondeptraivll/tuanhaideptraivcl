const loginPrompt = document.getElementById('loginPrompt');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userMenuBtn = document.getElementById('userMenuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');
const AUTH_API = '/api/auth';

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    checkLoginWelcome();
    setupUserMenu();
});

async function checkLoginStatus() {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!sessionToken) {
        showLoginButton();
        return;
    }

    try {
        const response = await fetch(AUTH_API + '?action=check_session');
        if (response.ok) {
            const data = await response.json();
            if (data.has_session && data.user) {
                console.log('Found IP session');
                showUserInfo(data.user);
                return;
            }
        }

        const verifyResponse = await fetch(AUTH_API + '?action=verify', {
            'headers': {
                'Authorization': 'Bearer ' + sessionToken,
                'Content-Type': 'application/json'
            }
        });

        if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.valid && verifyData.user) {
                showUserInfo(verifyData.user);
                return;
            }
        }

        localStorage.removeItem('sessionToken');
        showLoginButton();
    } catch (error) {
        console.error('Error checking login:', error);
        
        try {
            const tokenData = JSON.parse(atob(sessionToken));
            if (tokenData.id && tokenData.username) {
                showUserInfo(tokenData);
                return;
            }
        } catch (e) {}
        
        showLoginButton();
    }
}

function showLoginButton() {
    loginPrompt.style.display = 'block';
    userInfo.style.display = 'none';
}

function showUserInfo(userData) {
    loginPrompt.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = userData.globalName || userData.global_name || userData.username;
    
    // ✅ Cập nhật xử lý avatar - PHẦN QUAN TRỌNG
    setUserAvatar(userData);
}

// ✅ THÊM HÀM MỚI XỬ LÝ AVATAR
function setUserAvatar(userData) {
    const userId = userData.discord_id || userData.id;
    const avatarHash = userData.avatar;
    
    if (avatarHash && userId) {
        // Tạo URL avatar Discord đầy đủ
        const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
        const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=256`;
        userAvatar.src = avatarUrl;
        
        // Xử lý lỗi fallback
        userAvatar.onerror = function() {
            const defaultNum = parseInt(userId) % 5;
            userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${defaultNum}.png`;
        };
    } else {
        // Sử dụng default avatar nếu không có avatar
        const defaultNum = userId ? parseInt(userId) % 5 : 0;
        userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${defaultNum}.png`;
    }
}

function setupUserMenu() {
    userMenuBtn?.addEventListener('click', event => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdownMenu?.classList.remove('show');
    });

    logoutBtn?.addEventListener('click', async () => {
        const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất?');
        if (!confirmed) return;

        localStorage.removeItem('sessionToken');

        try {
            await fetch(AUTH_API + '?action=clear_session', {
                'method': 'POST'
            });
        } catch (error) {
            console.log('Error clearing session:', error);
        }

        showLoginButton();
        showNotification('Đã đăng xuất thành công', 'info');
    });
}

function checkLoginWelcome() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login_success');
    const username = urlParams.get('username');
    const userId = urlParams.get('user_id');
    const avatar = urlParams.get('avatar'); // ✅ LẤY AVATAR TỪ URL

    console.log('🔍 URL params:', {
        loginSuccess,
        username,
        userId,
        avatar
    });

    if (loginSuccess === 'true' && username) {
        const pathname = window.location.pathname;
        window.history.replaceState({}, document.title, pathname);
        
        showNotification('Chào mừng ' + decodeURIComponent(username) + ' trở lại!', 'success');

        if (userId) {
            const userData = {
                id: userId,
                username: decodeURIComponent(username),
                globalName: decodeURIComponent(username),
                avatar: null // ✅ SẼ XỬ LÝ TRONG setUserAvatar
            };

            // ✅ XỬ LÝ AVATAR TỪ URL PARAMS
            if (avatar) {
                // Nếu avatar từ URL là full URL
                if (avatar.startsWith('https://')) {
                    userAvatar.src = decodeURIComponent(avatar);
                } else {
                    // Nếu avatar là hash
                    userData.avatar = avatar;
                }
            }

            showUserInfo(userData);

            const sessionToken = btoa(JSON.stringify(userData));
            localStorage.setItem('sessionToken', sessionToken);
        }

        setTimeout(() => {
            checkLoginStatus();
        }, 1000);
    }
}

function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.auth-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'auth-notification';
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${type === 'success' ? 
            'linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,204,255,0.9))' : 
            'rgba(20,20,20,0.95)'};
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

    const icon = type === 'success' ? '✅' : type === 'info' ? 'ℹ️' : '❌';
    notification.innerHTML = `<span style="font-size: 16px">${icon}</span><span>${message}</span>`;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Login button rainbow animation
const loginButton = document.querySelector('.login-button');
if (loginButton) {
    let loginDeg = 0;
    let loginAnimationId;

    const animateLoginRainbow = () => {
        loginDeg = (loginDeg + 2) % 360;
        loginButton.style.backgroundImage = `
            linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)),
            conic-gradient(
                from ${loginDeg}deg,
                #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
            )
        `;
        loginAnimationId = requestAnimationFrame(animateLoginRainbow);
    };

    loginButton.addEventListener('mouseenter', () => {
        loginButton.classList.add('rainbow-border');
        animateLoginRainbow();
    });

    loginButton.addEventListener('mouseleave', () => {
        cancelAnimationFrame(loginAnimationId);
        loginButton.classList.remove('rainbow-border');
        loginButton.style.backgroundImage = '';
        loginButton.style.border = '2px solid rgba(255, 255, 255, 0.1)';
        loginDeg = 0;
    });
}

// Avatar border rainbow animation
const avatarBorder = document.querySelector('.avatar-border');
let deg = 0;
let rainbowAnimId;

function animateRainbowBorder() {
    deg = (deg + 1) % 360;
    avatarBorder.style.background = `conic-gradient(from ${deg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000)`;
    rainbowAnimId = requestAnimationFrame(animateRainbowBorder);
}

document.addEventListener('visibilitychange', () => {
    document.hidden ? cancelAnimationFrame(rainbowAnimId) : animateRainbowBorder();
});

animateRainbowBorder();

// Welcome screen functionality
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.querySelector('.enter-btn');
const bgAudio = document.getElementById('bg-audio');
const bgVideo = document.getElementById('bg-video');
const loadingSpinner = document.createElement('div');

loadingSpinner.className = 'loading-spinner';
document.body.appendChild(loadingSpinner);
loadingSpinner.style.display = 'none';

enterBtn.addEventListener('click', function() {
    loadingSpinner.style.display = 'block';
    
    setTimeout(() => {
        welcomeOverlay.classList.add('hidden');
        loadingSpinner.style.display = 'none';
    }, 500);
    
    playAudio();
    playVideo();
});

function playAudio() {
    bgAudio.currentTime = 0;
    bgAudio.play().catch(error => {
        console.log('Lỗi phát âm thanh:', error);
    });
}

function playVideo() {
    bgVideo.style.opacity = '1';
    bgVideo.play().catch(error => {
        console.log('Lỗi phát video:', error);
    });
}

// Top buttons rainbow animation
const topButtons = document.querySelectorAll('.top-button');
topButtons.forEach(button => {
    let deg = 0;
    let animationId;

    const animateRainbow = () => {
        deg = (deg + 2) % 360;
        button.style.backgroundImage = `
            linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)),
            conic-gradient(
                from ${deg}deg,
                #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
            )
        `;
        animationId = requestAnimationFrame(animateRainbow);
    };

    button.addEventListener('mouseenter', () => {
        button.classList.add('rainbow-border');
        animateRainbow();
    });

    button.addEventListener('mouseleave', () => {
        cancelAnimationFrame(animationId);
        button.classList.remove('rainbow-border');
        button.style.backgroundImage = '';
        button.style.border = '2px solid rgba(255, 255, 255, 0.1)';
        deg = 0;
    });
});

// Audio/video pause on visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (bgAudio && !bgAudio.paused) {
            bgAudio.pause();
        }
    } else {
        if (bgAudio && bgAudio.paused && !welcomeOverlay.classList.contains('hidden')) {
            bgAudio.play().catch(error => {
                console.log('Không thể resume audio:', error);
            });
        }
    }
});

// Export functions to global scope
window.authModule = {
    checkLoginStatus: checkLoginStatus,
    showLoginButton: showLoginButton,
    showUserInfo: showUserInfo,
    showNotification: showNotification,
    setUserAvatar: setUserAvatar, // ✅ THÊM HÀM MỚI
    bgVideo: bgVideo,
    bgAudio: bgAudio
};

console.log('🎉 Script loaded successfully!');
