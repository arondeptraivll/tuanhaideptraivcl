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

// ⭐ CRITICAL: Bắt code ngay khi page load, TRƯỚC KHI LÀM GÌ KHÁC
window.addEventListener('DOMContentLoaded', async () => {
    log('DOM loaded, checking for Discord code IMMEDIATELY');
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    // PRIORITY 1: Xử lý Discord code ngay lập tức
    if (code) {
        log('🚨 CRITICAL: Discord code detected: ' + code.substring(0, 10) + '...');
        log('🚨 Processing auth IMMEDIATELY to prevent code loss');
        
        // Hiển thị loading ngay
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('loading').style.display = 'block';
        document.querySelector('#loading p').textContent = 'Đang xử lý Discord code...';
        
        // Block navigation để không bị mất code
        window.onbeforeunload = function() {
            return 'Đang xử lý đăng nhập, vui lòng đợi...';
        };
        
        // Process auth ngay lập tức
        await handleDiscordCallback(code);
        
        // Clear code khỏi URL để tránh re-process
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Unblock navigation
        window.onbeforeunload = null;
        
        return; // STOP HERE, không chạy checkExistingLogin
    }
    
    // PRIORITY 2: Xử lý Discord error
    if (error) {
        log('Discord error detected: ' + error);
        showDiscordError(error, urlParams.get('error_description'));
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    // PRIORITY 3: Không có code, check existing login
    log('No Discord code, proceeding with normal auth check');
    await checkExistingLogin();
});

function showDiscordError(error, description) {
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
        default:
            errorMessage = description || 'Lỗi không xác định từ Discord';
    }
    
    showError(errorMessage);
}

async function handleDiscordCallback(code) {
    try {
        log('🔥 PROCESSING DISCORD CALLBACK - NO INTERRUPTION ALLOWED');
        
        const userIP = await getUserIP();
        log('Processing auth for IP: ' + userIP);
        
        // Gọi auth API với retry mechanism
        let authSuccess = false;
        let authData = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!authSuccess && attempts < maxAttempts) {
            attempts++;
            log(`Auth attempt ${attempts}/${maxAttempts}`);
            
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code, ip: userIP })
                });
                
                log('Auth API response status: ' + response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    log('Auth API error: ' + errorText);
                    throw new Error(`Auth API failed: ${response.status} - ${errorText}`);
                }
                
                authData = await response.json();
                log('Auth response: ' + JSON.stringify(authData));
                
                if (authData.success) {
                    authSuccess = true;
                    break;
                } else {
                    log('Auth failed: ' + authData.message);
                    if (attempts === maxAttempts) {
                        throw new Error(authData.message || 'Authentication failed');
                    }
                }
            } catch (error) {
                log(`Auth attempt ${attempts} failed: ${error.message}`);
                if (attempts === maxAttempts) {
                    throw error;
                }
                // Wait 1 second before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        if (authSuccess && authData.success) {
            log('🎉 AUTH SUCCESS for: ' + authData.user.username);
            
            // FORCE SAVE ngay lập tức
            const authObj = {
                user: authData.user,
                timestamp: Date.now(),
                ip: userIP
            };
            
            // Triple save cho chắc chắn
            localStorage.setItem('discordAuth', JSON.stringify(authObj));
            sessionStorage.setItem('discordAuthBackup', JSON.stringify(authObj));
            sessionStorage.setItem('discordAuthUltimate', JSON.stringify(authObj));
            
            log('🔒 FORCE SAVED auth data to ALL storages');
            
            // Verify save
            const saved1 = localStorage.getItem('discordAuth');
            const saved2 = sessionStorage.getItem('discordAuthBackup');
            log('Verify save - LocalStorage: ' + (saved1 ? 'OK' : 'FAIL'));
            log('Verify save - SessionStorage: ' + (saved2 ? 'OK' : 'FAIL'));
            
            showUserInfo(authData.user);
            
            Swal.fire({
                icon: 'success',
                title: '🎉 Đăng nhập thành công!',
                text: `Chào mừng ${authData.user.username}! Tài khoản đã được lưu an toàn.`,
                background: '#1a1a1a',
                color: '#fff',
                confirmButtonColor: '#5865f2',
                timer: 4000,
                timerProgressBar: true
            });
        } else {
            throw new Error('Authentication failed after all attempts');
        }
        
    } catch (error) {
        log('🚨 CRITICAL AUTH ERROR: ' + error.message);
        console.error('Auth callback error:', error);
        
        let errorMessage = 'Có lỗi xảy ra khi đăng nhập';
        if (error.message.includes('User not in server')) {
            errorMessage = 'Tài khoản bạn không tồn tại trong server chúng tôi';
        } else if (error.message.includes('Rate limited')) {
            errorMessage = 'Quá nhiều yêu cầu, vui lòng thử lại sau';
        } else if (error.message.includes('Invalid code')) {
            errorMessage = 'Mã xác thực đã hết hạn, vui lòng thử lại';
        }
        
        showError(errorMessage);
    }
}

async function checkExistingLogin() {
    try {
        log('Starting existing login check');
        
        document.getElementById('loading').style.display = 'block';
        document.querySelector('#loading p').textContent = 'Đang kiểm tra tài khoản';
        
        // Check ALL storage locations
        const savedAuth = localStorage.getItem('discordAuth');
        const savedBackup = sessionStorage.getItem('discordAuthBackup');
        const savedUltimate = sessionStorage.getItem('discordAuthUltimate');
        
        log('LocalStorage auth: ' + (savedAuth ? 'EXISTS' : 'NONE'));
        log('SessionStorage backup: ' + (savedBackup ? 'EXISTS' : 'NONE'));
        log('SessionStorage ultimate: ' + (savedUltimate ? 'EXISTS' : 'NONE'));
        
        const authSource = savedAuth || savedBackup || savedUltimate;
        
        if (authSource) {
            try {
                const authData = JSON.parse(authSource);
                const oneHour = 60 * 60 * 1000;
                const age = Date.now() - authData.timestamp;
                
                log('Saved auth age: ' + Math.floor(age / 1000) + ' seconds');
                log('Auth valid: ' + (age < oneHour));
                
                if (age < oneHour) {
                    log('✅ Using saved auth for: ' + authData.user.username);
                    showUserInfo(authData.user);
                    return;
                }
                log('⏰ Saved auth expired, clearing');
            } catch (error) {
                log('❌ Error parsing saved auth: ' + error.message);
            }
            
            // Clear expired auth
            localStorage.removeItem('discordAuth');
            sessionStorage.removeItem('discordAuthBackup');
            sessionStorage.removeItem('discordAuthUltimate');
        }

        // Check IP trong database
        log('🔍 Checking IP in database');
        const userIP = await getUserIP();
        log('Current IP: ' + userIP);
        
        log('📡 Calling /api/check-ip endpoint');
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
            log('🎯 IP check successful, auto login for: ' + data.user.username);
            showUserInfo(data.user);
            
            // Save to storage for next time
            const authObj = {
                user: data.user,
                timestamp: Date.now(),
                ip: userIP
            };
            localStorage.setItem('discordAuth', JSON.stringify(authObj));
            sessionStorage.setItem('discordAuthBackup', JSON.stringify(authObj));
            sessionStorage.setItem('discordAuthUltimate', JSON.stringify(authObj));
            
            log('💾 Saved IP-based auth data to all storages');
            
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
            log('❌ No user found for IP, showing login form');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
        }
    } catch (error) {
        log('💥 Error in checkExistingLogin: ' + error.message);
        console.error('Error checking existing login:', error);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loginSection').style.display = 'block';
        
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

// Debug functions (giữ nguyên)
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
    sessionStorage.removeItem('discordAuthUltimate');
    log('Cleared ALL auth data');
    
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
    const savedUltimate = sessionStorage.getItem('discordAuthUltimate');
    
    let stateInfo = 'CURRENT AUTH STATE:\n\n';
    stateInfo += 'LocalStorage: ' + (savedAuth ? 'EXISTS' : 'NONE') + '\n';
    stateInfo += 'SessionStorage Backup: ' + (savedBackup ? 'EXISTS' : 'NONE') + '\n';
    stateInfo += 'SessionStorage Ultimate: ' + (savedUltimate ? 'EXISTS' : 'NONE') + '\n\n';
    
    const authSource = savedAuth || savedBackup || savedUltimate;
    if (authSource) {
        try {
            const authData = JSON.parse(authSource);
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

// Các functions khác giữ nguyên...
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
            sessionStorage.removeItem('discordAuthUltimate');
            
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
                    sessionStorage.removeItem('discordAuthUltimate');
                    
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
    const savedAuth = localStorage.getItem('discordAuth') || 
                     sessionStorage.getItem('discordAuthBackup') || 
                     sessionStorage.getItem('discordAuthUltimate');
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

// Make functions available globally
window.testAPI = testAPI;
window.clearAllAuth = clearAllAuth;
window.showCurrentState = showCurrentState;