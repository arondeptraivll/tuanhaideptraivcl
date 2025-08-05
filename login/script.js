// script.js - Discord Auth Handler
class DiscordAuth {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkAuthResult();
        this.checkExistingLogin();
    }

    initializeElements() {
        // Safely get elements with null checks
        this.loginBtn = document.getElementById('loginBtn');
        this.loading = document.getElementById('loading');
        this.loginBox = document.getElementById('loginBox');
        this.profileBox = document.getElementById('profileBox');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Profile elements
        this.userAvatar = document.getElementById('userAvatar');
        this.userName = document.getElementById('userName');
        this.daysInServer = document.getElementById('daysInServer');
        this.joinDate = document.getElementById('joinDate');

        // Check if essential elements exist
        if (!this.loginBtn || !this.loginBox || !this.profileBox) {
            console.error('Essential DOM elements not found');
            return;
        }
    }

    bindEvents() {
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin() {
        try {
            this.showLoading(true);
            
            // Redirect to Discord OAuth
            window.location.href = '/api/auth?action=login';
            
        } catch (error) {
            this.showLoading(false);
            this.showError('Có lỗi xảy ra khi đăng nhập');
            console.error('Login error:', error);
        }
    }

    handleLogout() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Đăng xuất?',
                text: "Bạn có chắc muốn đăng xuất không?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Đăng xuất',
                cancelButtonText: 'Hủy',
                background: '#1a1a1a',
                color: '#ffffff'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.logout();
                }
            });
        } else {
            if (confirm('Bạn có chắc muốn đăng xuất không?')) {
                this.logout();
            }
        }
    }

    checkExistingLogin() {
        if (this.isLoggedIn()) {
            const userData = this.getUserData();
            if (userData) {
                this.showProfile(userData);
            }
        }
    }

    checkAuthResult() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('success') === 'true') {
            const token = urlParams.get('token');
            if (token) {
                this.handleLoginSuccess(token);
            }
        } else if (urlParams.get('error')) {
            this.handleLoginError(urlParams.get('error'));
        }
        
        // Clear URL parameters
        if (urlParams.get('success') || urlParams.get('error')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    handleLoginSuccess(token) {
        try {
            // Decode user data from token
            const userData = JSON.parse(atob(token));
            
            // Save to localStorage
            localStorage.setItem('discord_user', JSON.stringify(userData));
            localStorage.setItem('auth_token', token);
            
            // Show success message
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
                }).then(() => {
                    this.showProfile(userData);
                });
            } else {
                alert(`Đăng nhập thành công! Chào mừng ${userData.globalName || userData.username}!`);
                this.showProfile(userData);
            }
            
        } catch (error) {
            console.error('Error parsing login data:', error);
            this.showError('Có lỗi khi xử lý thông tin đăng nhập');
        }
    }

    showProfile(userData) {
        if (!this.loginBox || !this.profileBox) return;
        
        // Hide login box, show profile box
        this.loginBox.style.display = 'none';
        this.profileBox.style.display = 'block';
        
        // Update user information
        this.updateUserAvatar(userData);
        this.updateUserName(userData);
        this.updateDaysInServer(userData);
        this.updateJoinDate(userData);
    }

    updateUserAvatar(userData) {
        if (!this.userAvatar) return;
        
        if (userData.avatar) {
            this.userAvatar.src = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`;
        } else {
            // Default avatar
            const discriminator = userData.discriminator || '0';
            this.userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
        }
        
        this.userAvatar.onerror = () => {
            this.userAvatar.src = `https://cdn.discordapp.com/embed/avatars/0.png`;
        };
    }

    updateUserName(userData) {
        if (!this.userName) return;
        
        let displayName = userData.globalName || userData.username;
        if (userData.discriminator && userData.discriminator !== '0') {
            displayName += `#${userData.discriminator}`;
        }
        
        this.userName.textContent = displayName;
    }

    updateDaysInServer(userData) {
        if (!this.daysInServer) return;
        
        if (userData.daysInServer !== undefined && userData.daysInServer !== null) {
            this.daysInServer.textContent = `${userData.daysInServer} ngày`;
        } else {
            this.daysInServer.textContent = 'Không xác định';
        }
    }

    updateJoinDate(userData) {
        if (!this.joinDate) return;
        
        if (userData.joinedAt) {
            try {
                const joinDateTime = new Date(userData.joinedAt);
                this.joinDate.textContent = joinDateTime.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                console.error('Error formatting join date:', error);
                this.joinDate.textContent = 'Không xác định';
            }
        } else {
            this.joinDate.textContent = 'Không xác định';
        }
    }

    hideProfile() {
        if (!this.loginBox || !this.profileBox) return;
        
        this.profileBox.style.display = 'none';
        this.loginBox.style.display = 'block';
    }

    handleLoginError(error) {
        let errorMessage = 'Có lỗi xảy ra khi đăng nhập';
        
        switch (error) {
            case 'no_code':
                errorMessage = 'Không nhận được mã xác thực từ Discord';
                break;
            case 'token_error':
                errorMessage = 'Có lỗi khi xử lý token từ Discord';
                break;
            case 'not_in_server':
                errorMessage = 'Bạn cần tham gia server Discord để đăng nhập';
                break;
            case 'auth_failed':
                errorMessage = 'Xác thực thất bại, vui lòng thử lại';
                break;
            case 'user_fetch_failed':
                errorMessage = 'Không thể lấy thông tin người dùng từ Discord';
                break;
            default:
                if (error.startsWith('discord_')) {
                    errorMessage = `Lỗi Discord: ${error.replace('discord_', '')}`;
                }
        }
        
        this.showError(errorMessage);
    }

    showError(message) {
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
            alert(`Lỗi: ${message}`);
        }
    }

    showLoading(show) {
        if (!this.loginBtn || !this.loading) return;
        
        if (show) {
            this.loginBtn.style.display = 'none';
            this.loading.style.display = 'flex';
        } else {
            this.loginBtn.style.display = 'flex';
            this.loading.style.display = 'none';
        }
    }

    // Static utility methods
    isLoggedIn() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('discord_user');
        
        if (!token || !userData) return false;
        
        try {
            const user = JSON.parse(userData);
            // Check if token is still valid (24 hours)
            const tokenAge = Date.now() - user.timestamp;
            return tokenAge < 24 * 60 * 60 * 1000;
        } catch {
            return false;
        }
    }

    getUserData() {
        if (!this.isLoggedIn()) return null;
        
        try {
            return JSON.parse(localStorage.getItem('discord_user'));
        } catch {
            return null;
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('discord_user');
        window.location.reload();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new DiscordAuth();
    } catch (error) {
        console.error('Failed to initialize Discord Auth:', error);
    }
});

// Expose for global access
window.DiscordAuth = DiscordAuth;