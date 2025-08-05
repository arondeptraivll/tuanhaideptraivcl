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
    try {
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
        
        // Lấy config từ backend
        const configResponse = await fetch('/api/config');
        if (!configResponse.ok) {
            throw new Error('Không thể lấy config từ server');
        }
        
        const config = await configResponse.json();
        
        // Tạo Discord OAuth URL
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: 'identify guilds.members.read'
        });
        
        const discordAuthUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
        
        console.log('Redirecting to:', discordAuthUrl);
        console.log('Config:', config);
        
        window.location.href = discordAuthUrl;
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Không thể kết nối đến Discord. Vui lòng thử lại!');
    }
}

async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn('Cannot get IP:', error);
        return 'unknown';
    }
}

// Xử lý callback khi Discord redirect về
window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // Xử lý lỗi từ Discord
    if (error) {
        let errorMessage = 'Đăng nhập thất bại';
        
        switch (error) {
            case 'access_denied':
                errorMessage = 'Bạn đã từ chối quyền truy cập';
                break;
            case 'invalid_request':
                errorMessage = 'Yêu cầu không hợp lệ';
                break;
            case 'unauthorized_client':
                errorMessage = 'Ứng dụng không được phép';
                break;
            case 'unsupported_response_type':
                errorMessage = 'Lỗi cấu hình OAuth';
                break;
            default:
                errorMessage = errorDescription || 'Lỗi không xác định từ Discord';
        }
        
        showError(errorMessage);
        // Xóa error params khỏi URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    if (code) {
        await handleDiscordCallback(code);
    } else {
        // Check if user already logged in
        checkExistingLogin();
    }
});

async function handleDiscordCallback(code) {
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
        
        if (response.ok && data.success) {
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
            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Có lỗi xảy ra khi đăng nhập';
            
            if (data.message === 'User not in server') {
                errorMessage = 'Tài khoản bạn không tồn tại trong server chúng tôi';
            } else if (data.message === 'Rate limited') {
                errorMessage = 'Quá nhiều yêu cầu, vui lòng thử lại sau';
            } else if (data.message === 'Invalid code') {
                errorMessage = 'Mã xác thực không hợp lệ hoặc đã hết hạn';
            } else if (data.message === 'Discord API error') {
                errorMessage = 'Lỗi kết nối đến Discord, vui lòng thử lại';
            } else if (data.message) {
                errorMessage = data.message;
            }
            
            showError(errorMessage);
        }
        
    } catch (error) {
        console.error('Auth callback error:', error);
        showError('Lỗi kết nối server, vui lòng thử lại');
    }
    
    // Xóa code khỏi URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

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
// Thêm vào cuối script.js

function goHome() {
    Swal.fire({
        title: 'Quay về trang chủ?',
        text: 'Bạn sẽ được chuyển hướng về bio',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#00d4aa',
        cancelButtonColor: '#5865f2',
        confirmButtonText: 'Đi thôi!',
        cancelButtonText: 'Ở lại',
        background: '#1a1a1a',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            // Chuyển về trang chủ - thay đổi URL này theo trang chủ của bạn
            window.location.href = '/'; // hoặc '/bio' hoặc trang chủ của bạn
        }
    });
}

async function deleteAccount() {
    const user = window.checkUserAuth();
    if (!user) {
        showError('Không tìm thấy thông tin tài khoản');
        return;
    }

    Swal.fire({
        title: '⚠️ Xóa tài khoản?',
        html: `
            <p>Bạn có chắc muốn xóa tài khoản <strong>${user.username}</strong>?</p>
            <p style="color: #ff6b6b; margin-top: 10px;">⚠️ Hành động này không thể hoàn tác!</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ed4245',
        cancelButtonColor: '#5865f2',
        confirmButtonText: 'Xóa tài khoản',
        cancelButtonText: 'Hủy bỏ',
        background: '#1a1a1a',
        color: '#fff',
        focusCancel: true
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const userIP = await getUserIP();
                
                const response = await fetch('/api/auth', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        userId: user.id,
                        ip: userIP 
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Clear local storage
                    localStorage.removeItem('discordAuth');
                    
                    // Show success and redirect to login
                    Swal.fire({
                        title: 'Đã xóa tài khoản! 🗑️',
                        text: 'Tài khoản của bạn đã được xóa khỏi hệ thống',
                        icon: 'success',
                        background: '#1a1a1a',
                        color: '#fff',
                        confirmButtonColor: '#5865f2',
                        timer: 3000,
                        timerProgressBar: true
                    }).then(() => {
                        // Reset UI
                        document.getElementById('userInfo').style.display = 'none';
                        document.getElementById('loginSection').style.display = 'block';
                        
                        // Trigger logout event
                        window.dispatchEvent(new CustomEvent('userLoggedOut'));
                    });
                } else {
                    showError(data.message || 'Không thể xóa tài khoản');
                }
                
            } catch (error) {
                console.error('Delete account error:', error);
                showError('Lỗi kết nối server');
            }
        }
    });
}

// Update logout function để phù hợp với style mới
function logout() {
    Swal.fire({
        title: 'Đăng xuất? 🚪',
        text: 'Bạn có chắc muốn đăng xuất không?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ffa726',
        cancelButtonColor: '#5865f2',
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Ở lại',
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
                title: 'Đã đăng xuất! 👋',
                text: 'Hẹn gặp lại bạn!',
                icon: 'success',
                timer: 2000,
                background: '#1a1a1a',
                color: '#fff',
                confirmButtonColor: '#5865f2',
                timerProgressBar: true
            });
        }
    });
}