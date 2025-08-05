// Debug system
let debugMode = false;
const debugLogs = [];

function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    debugLogs.push(logEntry);
    console.log(logEntry, data);
    
    if (debugMode) {
        updateDebugPanel();
    }
}

function toggleDebug() {
    debugMode = !debugMode;
    const panel = document.getElementById('debugPanel');
    if (debugMode) {
        panel.style.display = 'block';
        updateDebugPanel();
    } else {
        panel.style.display = 'none';
    }
}

function updateDebugPanel() {
    const debugInfo = document.getElementById('debugInfo');
    debugInfo.textContent = debugLogs.slice(-15).join('\n');
    debugInfo.scrollTop = debugInfo.scrollHeight;
}

// Cache cho rate limiting
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
        log('Starting Discord login process');
        
        const userIP = await getUserIP();
        log('Got user IP: ' + userIP);
        
        if (!checkRateLimit(userIP)) {
            log('Rate limited for IP: ' + userIP);
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
        
        log('Getting Discord config');
        const configResponse = await fetch('/api/config');
        if (!configResponse.ok) {
            throw new Error(`Config API failed: ${configResponse.status}`);
        }
        const config = await configResponse.json();
        log('Got config: ' + JSON.stringify(config));
        
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: 'identify guilds.members.read'
        });
        
        const discordAuthUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
        log('Redirecting to: ' + discordAuthUrl);
        
        window.location.href = discordAuthUrl;
        
    } catch (error) {
        log('Login error: ' + error.message);
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
        log('IP fetch error: ' + error.message);
        return 'unknown';
    }
}

window.addEventListener('load', async () => {
    log('Page loaded, starting auth check');
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        log('Found Discord code: ' + code.substring(0, 10) + '...');
        await handleDiscordCallback(code);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        log('No code found, checking existing login');
        await checkExistingLogin();
    }
});

async function handleDiscordCallback(code) {
    try {
        log('Processing Discord callback');
        
        document.getElementById('loading').style.display = 'block';
        document.querySelector('#loading p').textContent = 'Đang xác thực với Discord';
        
        const userIP = await getUserIP();
        log('Processing auth for IP: ' + userIP);
        
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, ip: userIP })
        });
        
        log('Auth API response status: ' + response.status);
        
        if (!response.ok) {
            throw new Error(`Auth API failed: ${response.status}`);
        }
        
        const data = await response.json();
        log('Auth response: ' + JSON.stringify(data));
        
        if (data.success) {
            log('Auth successful for: ' + data.user.username);
            showUserInfo(data.user);
            
            // Force save to both localStorage AND sessionStorage
            const authData = {
                user: data.user,
                timestamp: Date.now(),
                ip: userIP
            };
            
            localStorage.setItem('discordAuth', JSON.stringify(authData));
            sessionStorage.setItem('discordAuthBackup', JSON.stringify(authData));
            
            log('Saved auth data to both storages');
            
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
            log('Auth failed: ' + data.message);
            let errorMessage = 'Có lỗi xảy ra khi đăng nhập';
            if (data.message === 'User not in server') {
                errorMessage = 'Tài khoản bạn không tồn tại trong server chúng tôi';
            } else if (data.message) {
                errorMessage = data.message;
            }
            showError(errorMessage);
        }
    } catch (error) {
        log('Auth callback error: ' + error.message);
        console.error('Auth callback error:', error);
        showError('Lỗi kết nối server, vui lòng thử lại');
    }
}

async function checkExistingLogin() {
    try {
        log('Starting existing login check');
        
        document.getElementById('loading').style.display = 'block';
        document.querySelector('#loading p').textContent = 'Đang kiểm tra tài khoản';
        
        // Check localStorage và sessionStorage
        const savedAuth = localStorage.getItem('discordAuth');
        const savedBackup = sessionStorage.getItem('discordAuthBackup');
        
        log('LocalStorage auth: ' + (savedAuth ? 'EXISTS' : 'NONE'));
        log('SessionStorage backup: ' + (savedBackup ? 'EXISTS' : 'NONE'));
        
        if (savedAuth || savedBackup) {
            try {
                const authData = JSON.parse(savedAuth || savedBackup);
                const oneHour = 60 * 60 * 1000;
                const age = Date.now() - authData.timestamp;
                
                log('Saved auth age: ' + Math.floor(age / 1000) + ' seconds');
                log('Auth valid: ' + (age < oneHour));
                
                if (age < oneHour) {
                    log('Using saved auth for: ' + authData.user.username);
                    showUserInfo(authData.user);
                    return;
                }
                log('Saved auth expired, clearing');
            } catch (error) {
                log('Error parsing saved auth: ' + error.message);
            }
            
            localStorage.removeItem('discordAuth');
            sessionStorage.removeItem('discordAuthBackup');
        }

        // Check IP trong database
        log('Checking IP in database');
        const userIP = await getUserIP();
        log('Current IP: ' + userIP);
        
        log('Calling /api/check-ip endpoint');
        const response = await fetch('/api/check-ip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ip: userIP })
        });
        
        log('Check-IP API status: ' + response.status);
        
        if (!response.ok) {
            throw new Error(`Check-IP API failed: ${response.status}`);
        }
        
        const data = await response.json();
        log('Check-IP response: ' + JSON.stringify(data));
        
        if (data.success && data.user) {
            log('IP check successful, auto login for: ' + data.user.username);
            showUserInfo(data.user);
            
            // Save to storage for next time
            const authData = {
                user: data.user,
                timestamp: Date.now(),
                ip: userIP
            };
            localStorage.setItem('discordAuth', JSON.stringify(authData));
            sessionStorage.setItem('discordAuthBackup', JSON.stringify(authData));
            
            log('Saved new auth data to storages');
            
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
            log('No user found for IP, showing login form');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
        }
    } catch (error) {
        log('Error in checkExistingLogin: ' + error.message);
        console.error('Error checking existing login:', error);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loginSection').style.display = 'block';
        
        // Show error in debug mode
        if (debugMode) {
            Swal.fire({
                icon: 'error',
                title: 'Debug: API Error',
                text: error.message,
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    }
}

// Debug functions
async function testAPI() {
    try {
        log('=== API TEST START ===');
        const userIP = await getUserIP();
        log('Testing with IP: ' + userIP);
        
        // Test config endpoint
        log('Testing /api/config...');
        const configResp = await fetch('/api/config');
        log('Config status: ' + configResp.status);
        
        if (configResp.ok) {
            const configData = await configResp.json();
            log('Config data: ' + JSON.stringify(configData));
        } else {
            log('Config error: ' + await configResp.text());
        }
        
        // Test check-ip endpoint
        log('Testing /api/check-ip...');
        const ipResp = await fetch('/api/check-ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: userIP })
        });
        log('Check-IP status: ' + ipResp.status);
        
        if (ipResp.ok) {
            const ipData = await ipResp.json();
            log('Check-IP data: ' + JSON.stringify(ipData));
        } else {
            log('Check-IP error: ' + await ipResp.text());
        }
        
        log('=== API TEST END ===');
        
        // Show result
        Swal.fire({
            title: 'API Test Complete',
            text: 'Check debug panel for detailed results',
            icon: 'info',
            background: '#1a1a1a',
            color: '#fff'
        });
        
    } catch (error) {
        log('API test error: ' + error.message);
        console.error('API test error:', error);
    }
}

function clearAllAuth() {
    localStorage.removeItem('discordAuth');
    sessionStorage.removeItem('discordAuthBackup');
    log('Cleared all auth data');
    
    Swal.fire({
        title: 'Auth Cleared',
        text: 'All authentication data has been cleared',
        icon: 'success',
        background: '#1a1a1a',
        color: '#fff',
        timer: 2000
    }).then(() => {
        location.reload();
    });
}

function showCurrentState() {
    const savedAuth = localStorage.getItem('discordAuth');
    const savedBackup = sessionStorage.getItem('discordAuthBackup');
    
    let stateInfo = 'CURRENT AUTH STATE:\n\n';
    stateInfo += 'LocalStorage: ' + (savedAuth ? 'EXISTS' : 'NONE') + '\n';
    stateInfo += 'SessionStorage: ' + (savedBackup ? 'EXISTS' : 'NONE') + '\n\n';
    
    if (savedAuth) {
        try {
            const authData = JSON.parse(savedAuth);
            const age = Date.now() - authData.timestamp;
            stateInfo += 'User: ' + authData.user.username + '\n';
            stateInfo += 'Age: ' + Math.floor(age / 1000) + ' seconds\n';
            stateInfo += 'Valid: ' + (age < 3600000) + '\n';
        } catch (e) {
            stateInfo += 'Parse error: ' + e.message + '\n';
        }
    }
    
    log(stateInfo);
    
    Swal.fire({
        title: 'Current State',
        text: 'Check debug panel for current authentication state',
        icon: 'info',
        background: '#1a1a1a',
        color: '#fff'
    });
}

function showUserInfo(user) {
    log('Showing user info for: ' + user.username);
    
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
    log('Showing error: ' + message);
    
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
            sessionStorage.removeItem('discordAuthBackup');
            
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
                    sessionStorage.removeItem('discordAuthBackup');
                    
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
    const savedAuth = localStorage.getItem('discordAuth') || sessionStorage.getItem('discordAuthBackup');
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

// Make functions available globally for debug panel
window.testAPI = testAPI;
window.clearAllAuth = clearAllAuth;
window.showCurrentState = showCurrentState;