// Cache cho rate limiting
const loginCache = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 phút
const MAX_ATTEMPTS = 3;

// Rate limiting function
function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = loginCache.get(ip) || [];
    
    // Xóa attempts cũ hơn 1 phút
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
        return false;
    }
    
    recentAttempts.push(now);
    loginCache.set(ip, recentAttempts);
    return true;
}

async function loginWithDiscord() {
    // Check rate limit
    const userIP = await getUserIP();
    if (!checkRateLimit(userIP)) {
        Swal.fire({
            icon: 'warning',
            title: 'Quá nhiều lần thử!',
            text: 'Vui lòng đợi 1 phút trước khi thử lại',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#5865f2'
        });
        return;
    }

    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    
    // Redirect đến Discord OAuth
    const REDIRECT_URI = encodeURIComponent(window.location.origin);
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${await getClientId()}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds.members.read`;
    
    window.location.href = discordAuthUrl;
}

async function getClientId() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        return data.clientId;
    } catch (error) {
        console.error('Error getting client ID:', error);
        return null;
    }
}

async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// Xử lý callback khi Discord redirect về
window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
        showError('Đăng nhập bị hủy bởi người dùng');
        return;
    }
    
    if (code) {
        try {
            const userIP = await getUserIP();
            
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    code: code,
                    ip: userIP 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showUserInfo(data.user);
                
                // Save login state
                localStorage.setItem('discordAuth', JSON.stringify({
                    user: data.user,
                    timestamp: Date.now()
                }));
                
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công! 🎉',
                    text: `Chào mừng ${data.user.username}!`,
                    background: '#1a1a1a',
                    color: '#fff',
                    confirmButtonColor: '#5865f2',
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                if (data.message === 'User not in server') {
                    showError('Tài khoản bạn không tồn tại trong server chúng tôi');
                } else if (data.message === 'Rate limited') {
                    showError('Quá nhiều yêu cầu, vui lòng thử lại sau');
                } else {
                    showError(data.message || 'Có lỗi xảy ra khi đăng nhập');
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            showError('Có lỗi xảy ra khi đăng nhập');
        }
        
        // Xóa code khỏi URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Check if user already logged in
        checkExistingLogin();
    }
});

function checkExistingLogin() {
    const savedAuth = localStorage.getItem('discordAuth');
    if (savedAuth) {
        try {
            const authData = JSON.parse(savedAuth);
            const oneHour = 60 * 60 * 1000;
            
            // Check if login is still valid (1 hour)
            if (Date.now() - authData.timestamp < oneHour) {
                showUserInfo(authData.user);
                return;
            }
        } catch (error) {
            console.error('Error parsing saved auth:', error);
        }
        
        // Clear expired auth
        localStorage.removeItem('discordAuth');
    }
}

function showUserInfo(user) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('loginSection').style.display = 'none';
    
    document.getElementById('userAvatar').src = user.avatar;
    document.getElementById('userName').textContent = user.username;
    document.getElementById('daysInfo').textContent = `${user.daysInServer} ngày trong server`;
    document.getElementById('userInfo').style.display = 'block';
    
    // Trigger auth event cho các component khác
    window.dispatchEvent(new CustomEvent('userAuthenticated', {
        detail: { user: user }
    }));
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
    
    Swal.fire({
        icon: 'error',
        title: 'Lỗi đăng nhập! ❌',
        text: message,
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#ed4245'
    });
}

function logout() {
    Swal.fire({
        title: 'Đăng xuất?',
        text: 'Bạn có chắc muốn đăng xuất không?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ed4245',
        cancelButtonColor: '#5865f2',
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy',
        background: '#1a1a1a',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('discordAuth');
            
            document.getElementById('userInfo').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
            
            // Trigger logout event
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
            
            Swal.fire({
                title: 'Đã đăng xuất!',
                text: 'Bạn đã đăng xuất thành công',
                icon: 'success',
                timer: 2000,
                background: '#1a1a1a',
                color: '#fff',
                confirmButtonColor: '#5865f2'
            });
        }
    });
}

// Global functions để các file khác có thể sử dụng
window.checkUserAuth = function() {
    const savedAuth = localStorage.getItem('discordAuth');
    if (savedAuth) {
        try {
            const authData = JSON.parse(savedAuth);
            const oneHour = 60 * 60 * 1000;
            
            if (Date.now() - authData.timestamp < oneHour) {
                return authData.user;
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }
    return null;
};

window.requireAuth = function() {
    const user = window.checkUserAuth();
    if (!user) {
        Swal.fire({
            icon: 'warning',
            title: 'Cần đăng nhập!',
            text: 'Bạn cần đăng nhập để sử dụng tính năng này',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#5865f2'
        });
        return false;
    }
    return true;
};