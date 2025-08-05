const loginCache = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_ATTEMPTS = 3;

function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = loginCache.get(ip) || [];
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
        document.querySelector('#loading p').textContent = 'Đang chuyển hướng đến Discord';
        
        const configResponse = await fetch('/api/config');
        const config = await configResponse.json();
        
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: 'identify guilds.members.read'
        });
        
        const discordAuthUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
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
        return 'unknown';
    }
}

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Có code từ Discord, xử lý đăng nhập
        await handleDiscordCallback(code);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Không có code, check IP trong database
        await checkExistingLogin();
    }
});

async function handleDiscordCallback(code) {
    try {
        document.getElementById('loading').style.display = 'block';
        document.querySelector('#loading p').textContent = 'Đang xác thực với Discord';
        
        const userIP = await getUserIP();
        
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, ip: userIP })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showUserInfo(data.user);
            
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
            let errorMessage = 'Có lỗi xảy ra khi đăng nhập';
            if (data.message === 'User not in server') {
                errorMessage = 'Tài khoản bạn không tồn tại trong server chúng tôi';
            } else if (data.message) {
                errorMessage = data.message;
            }
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Auth callback error:', error);
        showError('Lỗi kết nối server, vui lòng thử lại');
    }
}

async function checkExistingLogin() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.querySelector('#loading p').textContent = 'Đang kiểm tra tài khoản';
        
        // Check localStorage trước
        const savedAuth = localStorage.getItem('discordAuth');
        if (savedAuth) {
            const authData = JSON.parse(savedAuth);
            const oneHour = 60 * 60 * 1000;
            
            if (Date.now() - authData.timestamp < oneHour) {
                showUserInfo(authData.user);
                return;
            }
            localStorage.removeItem('discordAuth');
        }

        // Check IP trong database
        const userIP = await getUserIP();
        const response = await fetch('/api/check-ip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ip: userIP })
        });
        
        const data = await response.json();
        
        if (data.success && data.user) {
            showUserInfo(data.user);
            localStorage.setItem('discordAuth', JSON.stringify({
                user: data.user,
                timestamp: Date.now()
            }));
            
            Swal.fire({
                icon: 'info',
                title: 'Chào mừng trở lại! 👋',
                text: `Xin chào ${data.user.username}!`,
                background: '#1a1a1a',
                color: '#fff',
                confirmButtonColor: '#5865f2',
                timer: 3000,
                timerProgressBar: true,
                toast: true,
                position: 'top-end',
                showConfirmButton: false
            });
        } else {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking existing login:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loginSection').style.display = 'block';
    }
}

function showUserInfo(user) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('loginSection').style.display = 'none';
    
    document.getElementById('userAvatar').src = user.avatar;
    document.getElementById('userName').textContent = user.username;
    document.getElementById('daysInfo').textContent = `${user.daysInServer} ngày trong server`;
    document.getElementById('userInfo').style.display = 'block';
    
    window.dispatchEvent(new CustomEvent('userAuthenticated', {
        detail: { user: user }
    }));
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
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
            window.location.href = '/';
        }
    });
}

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
                    body: JSON.stringify({ userId: user.id, ip: userIP })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.removeItem('discordAuth');
                    
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
                        document.getElementById('userInfo').style.display = 'none';
                        document.getElementById('loginSection').style.display = 'block';
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