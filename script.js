// --- PHẦN HIỆU ỨNG VIỀN CẦU VỒNG CHO AVATAR ---
// Thêm vào đầu file script.js (sau các biến hiện có)

// --- PHẦN QUẢN LÝ ĐĂNG NHẬP ---
const loginPrompt = document.getElementById('loginPrompt');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userMenuBtn = document.getElementById('userMenuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');

// API endpoints
const AUTH_API = '/api/auth';

// Check login status khi load trang
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    checkLoginWelcome();
    setupUserMenu();
});

// Check login status từ localStorage và API
async function checkLoginStatus() {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!sessionToken) {
        showLoginButton();
        return;
    }

    try {
        // Check IP session first
        const ipResponse = await fetch(`${AUTH_API}?action=check_session`);
        if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            
            if (ipData.has_session && ipData.user) {
                console.log('Found IP session');
                showUserInfo(ipData.user);
                return;
            }
        }

        // Fallback to token verification
        const verifyResponse = await fetch(`${AUTH_API}?action=verify`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (verifyResponse.ok) {
            const data = await verifyResponse.json();
            if (data.valid && data.user) {
                showUserInfo(data.user);
                return;
            }
        }

        // Token invalid
        localStorage.removeItem('sessionToken');
        showLoginButton();
        
    } catch (error) {
        console.error('Error checking login:', error);
        // Try to parse local token
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

// Show login button
function showLoginButton() {
    loginPrompt.style.display = 'block';
    userInfo.style.display = 'none';
}

// Show user info
function showUserInfo(userData) {
    loginPrompt.style.display = 'none';
    userInfo.style.display = 'flex';
    
    // Update user name
    userName.textContent = userData.globalName || userData.username;
    
    // Update avatar
    if (userData.avatar) {
        userAvatar.src = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`;
    } else {
        // Default avatar
        const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${(userData.discriminator || 0) % 5}.png`;
        userAvatar.src = defaultAvatar;
    }
}

// Setup user menu
function setupUserMenu() {
    // Toggle dropdown
    userMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu?.classList.remove('show');
    });

    // Logout functionality
    logoutBtn?.addEventListener('click', async () => {
        const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất?');
        if (!confirmed) return;

        // Clear localStorage
        localStorage.removeItem('sessionToken');
        
        // Clear IP session
        try {
            await fetch(`${AUTH_API}?action=clear_session`, {
                method: 'POST'
            });
        } catch (error) {
            console.log('Error clearing session:', error);
        }
        
        // Show login button
        showLoginButton();
        
        // Show notification
        showNotification('Đã đăng xuất thành công', 'info');
    });
}

// Check welcome message từ login redirect
function checkLoginWelcome() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login_success');
    const welcomeName = urlParams.get('welcome');
    
    if (loginSuccess === 'true' && welcomeName) {
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Show welcome notification
        showNotification(`Chào mừng ${decodeURIComponent(welcomeName)} trở lại!`, 'success');
        
        // Check login status to update UI
        checkLoginStatus();
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${type === 'success' ? 'linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,204,255,0.9))' : 'rgba(20,20,20,0.95)'};
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
    `;
    
    const icon = type === 'success' ? '✓' : 'ℹ';
    notification.innerHTML = `<span style="font-size: 20px">${icon}</span><span>${message}</span>`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Thêm rainbow effect cho login button
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

const avatarBorder = document.querySelector('.avatar-border');
let deg = 0;
let rainbowAnimId;

function animateRainbowBorder() {
    deg = (deg + 1) % 360;
    // Thay đổi góc của conic-gradient để tạo hiệu ứng xoay
    avatarBorder.style.background = `conic-gradient(from ${deg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000)`;
    rainbowAnimId = requestAnimationFrame(animateRainbowBorder);
}

// Tạm dừng animation nếu tab không được hiển thị để tiết kiệm tài nguyên
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(rainbowAnimId);
    } else {
        animateRainbowBorder();
    }
});

// Bắt đầu animation
animateRainbowBorder();


// --- PHẦN XỬ LÝ MÀN HÌNH CHÀO MỪNG VÀ PHÁT MEDIA ---

const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.querySelector('.enter-btn');
const bgAudio = document.getElementById('bg-audio');
const bgVideo = document.getElementById('bg-video');

// Tạo và chuẩn bị spinner
const loadingSpinner = document.createElement('div');
loadingSpinner.className = 'loading-spinner';
document.body.appendChild(loadingSpinner);
loadingSpinner.style.display = 'none'; // Ẩn ban đầu

// Khi người dùng nhấn nút ENTER
enterBtn.addEventListener('click', function() {
    loadingSpinner.style.display = 'block'; // Hiển thị spinner

    // Dùng setTimeout để đảm bảo spinner hiển thị trước khi tác vụ nặng bắt đầu
    setTimeout(() => {
        welcomeOverlay.classList.add('hidden'); // Ẩn màn hình chào
        loadingSpinner.style.display = 'none';   // Ẩn spinner
    }, 500); // 0.5 giây chờ

    playAudio();
    playVideo();
});

function playAudio() {
    bgAudio.currentTime = 0; // Tua lại đầu
    bgAudio.play().catch(error => {
        console.log("Lỗi phát âm thanh:", error);
    });
}

function playVideo() {
    bgVideo.style.opacity = '1'; // Làm video hiện ra
    bgVideo.play().catch(error => {
        console.log("Lỗi phát video:", error);
    });
}


// --- PHẦN HIỆU ỨNG VIỀN CẦU VỒNG CHO CÁC NÚT Ở GÓC ---

const topButtons = document.querySelectorAll('.top-button');

// Lặp qua mỗi nút tìm được (HAIGPT và TOOLS)
topButtons.forEach(button => {
    let tabDeg = 0;
    let animationFrameId;

    // Hàm animation cho từng nút
    const animateTabRainbow = () => {
        tabDeg = (tabDeg + 2) % 360;
        button.style.backgroundImage = `
            linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)),
            conic-gradient(
                from ${tabDeg}deg,
                #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
            )
        `;
        animationFrameId = requestAnimationFrame(animateTabRainbow);
    };

    // Khi di chuột vào nút
    button.addEventListener('mouseenter', () => {
        button.classList.add('rainbow-border');
        animateTabRainbow();
    });

    // Khi di chuột ra khỏi nút
    button.addEventListener('mouseleave', () => {
        cancelAnimationFrame(animationFrameId); // Dừng animation
        button.classList.remove('rainbow-border');
        // Trả lại style ban đầu
        button.style.backgroundImage = '';
        button.style.border = '2px solid rgba(255, 255, 255, 0.1)';
        tabDeg = 0;
    });
});