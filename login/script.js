// login/script.js - Simplified Discord Auth
console.log('Script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready');
    
    // Get elements safely
    const loginBtn = document.getElementById('loginBtn');
    const loading = document.getElementById('loading');
    const loginBox = document.getElementById('loginBox');
    const profileBox = document.getElementById('profileBox');
    const logoutBtn = document.getElementById('logoutBtn');
    
    console.log('Elements found:', {
        loginBtn: !!loginBtn,
        loading: !!loading,
        loginBox: !!loginBox,
        profileBox: !!profileBox,
        logoutBtn: !!logoutBtn
    });

    // Check URL for auth result first
    checkAuthResult();
    
    // Check if already logged in
    checkExistingLogin();
    
    // Bind events
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    function handleLogin() {
        console.log('Login button clicked');
        showLoading(true);
        window.location.href = '/api/auth?action=login';
    }

    function handleLogout() {
        if (confirm('Bạn có chắc muốn đăng xuất không?')) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('discord_user');
            window.location.reload();
        }
    }

    function showLoading(show) {
        if (!loginBtn || !loading) return;
        
        if (show) {
            loginBtn.style.display = 'none';
            loading.style.display = 'flex';
        } else {
            loginBtn.style.display = 'flex';
            loading.style.display = 'none';
        }
    }

    function checkAuthResult() {
        const urlParams = new URLSearchParams(window.location.search);
        console.log('URL params:', Object.fromEntries(urlParams));
        
        if (urlParams.get('success') === 'true') {
            const token = urlParams.get('token');
            console.log('Success with token:', !!token);
            
            if (token) {
                handleLoginSuccess(token);
            }
        } else if (urlParams.get('error')) {
            const error = urlParams.get('error');
            console.log('Auth error:', error);
            showError(error);
        }
        
        // Clean URL
        if (urlParams.get('success') || urlParams.get('error')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    function handleLoginSuccess(token) {
        console.log('Processing login success');
        
        try {
            const userData = JSON.parse(atob(token));
            console.log('User data decoded:', userData);
            
            localStorage.setItem('discord_user', JSON.stringify(userData));
            localStorage.setItem('auth_token', token);
            
            showProfile(userData);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công!',
                    text: `Chào mừng ${userData.globalName || userData.username}!`,
                    background: '#1a1a1a',
                    color: '#ffffff',
                    confirmButtonColor: '#5865f2',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            
        } catch (error) {
            console.error('Error parsing login data:', error);
            showError('Có lỗi khi xử lý thông tin đăng nhập');
        }
    }

    function checkExistingLogin() {
        console.log('Checking existing login');
        
        const token = localStorage.getItem('auth_token');
        const userDataStr = localStorage.getItem('discord_user');
        
        if (!token || !userDataStr) {
            console.log('No existing login found');
            return;
        }
        
        try {
            const userData = JSON.parse(userDataStr);
            const tokenAge = Date.now() - userData.timestamp;
            
            // Check if token is still valid (24 hours)
            if (tokenAge < 24 * 60 * 60 * 1000) {
                console.log('Existing login is valid, showing profile');
                showProfile(userData);
            } else {
                console.log('Existing login expired');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('discord_user');
            }
        } catch (error) {
            console.error('Error checking existing login:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('discord_user');
        }
    }

    function showProfile(userData) {
        console.log('Showing profile for:', userData.username);
        
        if (!loginBox || !profileBox) {
            console.error('Login/Profile boxes not found');
            return;
        }
        
        // Hide login, show profile
        loginBox.style.display = 'none';
        profileBox.style.display = 'block';
        
        // Update profile info
        updateProfileInfo(userData);
    }

    function updateProfileInfo(userData) {
        console.log('Updating profile info');
        
        // Update avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (userData.avatar) {
                userAvatar.src = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`;
            } else {
                userAvatar.src = `https://cdn.discordapp.com/embed/avatars/0.png`;
            }
            
            userAvatar.onerror = function() {
                this.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
            };
        }
        
        // Update username
        const userName = document.getElementById('userName');
        if (userName) {
            let displayName = userData.globalName || userData.username;
            if (userData.discriminator && userData.discriminator !== '0') {
                displayName += `#${userData.discriminator}`;
            }
            userName.textContent = displayName;
        }
        
        // Update days in server
        const daysInServer = document.getElementById('daysInServer');
        if (daysInServer) {
            if (userData.daysInServer !== undefined && userData.daysInServer !== null) {
                daysInServer.textContent = `${userData.daysInServer} ngày`;
            } else {
                daysInServer.textContent = 'Không xác định';
            }
        }
        
        // Update join date
        const joinDate = document.getElementById('joinDate');
        if (joinDate) {
            if (userData.joinedAt) {
                try {
                    const date = new Date(userData.joinedAt);
                    joinDate.textContent = date.toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } catch (error) {
                    joinDate.textContent = 'Không xác định';
                }
            } else {
                joinDate.textContent = 'Không xác định';
            }
        }
        
        console.log('Profile info updated');
    }

    function showError(error) {
        let message = 'Có lỗi xảy ra khi đăng nhập';
        
        switch (error) {
            case 'no_code':
                message = 'Không nhận được mã xác thực từ Discord';
                break;
            case 'token_error':
                message = 'Có lỗi khi xử lý token từ Discord';
                break;
            case 'not_in_server':
                message = 'Bạn cần tham gia server Discord để đăng nhập';
                break;
            case 'auth_failed':
                message = 'Xác thực thất bại, vui lòng thử lại';
                break;
        }
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi đăng nhập',
                text: message,
                background: '#1a1a1a',
                color: '#ffffff',
                confirmButtonColor: '#5865f2',
            });
        } else {
            alert('Lỗi: ' + message);
        }
    }
});