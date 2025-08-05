// script.js
class DiscordAuth {
    constructor() {
        this.init();
    }

    init() {
        this.loginBtn = document.getElementById('loginBtn');
        this.loading = document.getElementById('loading');
        this.loginBox = document.getElementById('loginBox');
        this.profileBox = document.getElementById('profileBox');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Kiểm tra URL params cho kết quả auth
        this.checkAuthResult();
        
        // Kiểm tra user đã đăng nhập chưa
        this.checkExistingLogin();
    }

    async handleLogin() {
        try {
            this.showLoading(true);
            
            // Redirect đến Discord OAuth
            window.location.href = '/api/auth?action=login';
            
        } catch (error) {
            this.showLoading(false);
            this.showError('Có lỗi xảy ra khi đăng nhập');
            console.error('Login error:', error);
        }
    }

    handleLogout() {
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
                DiscordAuth.logout();
            }
        });
    }

    checkExistingLogin() {
        if (DiscordAuth.isLoggedIn()) {
            const userData = DiscordAuth.getUserData();
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
            // Giải mã user data từ token
            const userData = JSON.parse(atob(token));
            
            // Lưu vào localStorage
            localStorage.setItem('discord_user', JSON.stringify(userData));
            localStorage.setItem('auth_token', token);
            
            // Hiển thị thông báo thành công
            Swal.fire({
                icon: 'success',
                title: 'Đăng nhập thành công!',
                text: `Chào mừng ${userData.username}!`,
                background: '#1a1a1a',
                color: '#ffffff',
                confirmButtonColor: '#5865f2',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Hiển thị profile thay vì redirect
                this.showProfile(userData);
            });
            
        } catch (error) {
            this.showError('Có lỗi khi xử lý thông tin đăng nhập');
        }
    }

    showProfile(userData) {
        // Ẩn login box, hiện profile box
        this.loginBox.style.display = 'none';
        this.profileBox.style.display = 'block';
        
        // Cập nhật thông tin user
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const daysInServer = document.getElementById('daysInServer');
        const joinDate = document.getElementById('joinDate');
        
        // Set avatar
        if (userData.avatar) {
            userAvatar.src = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`;
        } else {
            // Default avatar
            userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${userData.discriminator % 5}.png`;
        }
        
        // Set username
        userName.textContent = userData.discriminator && userData.discriminator !== '0' 
            ? `${userData.username}#${userData.discriminator}` 
            : userData.username;
        
        // Set days in server
        if (userData.daysInServer !== undefined && userData.daysInServer !== null) {
            daysInServer.textContent = `${userData.daysInServer} ngày`;
        } else {
            daysInServer.textContent = 'Không xác định';
        }
        
        // Set join date
        if (userData.joinedAt) {
            const joinDateTime = new Date(userData.joinedAt);
            joinDate.textContent = joinDateTime.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            joinDate.textContent = 'Không xác định';
        }
    }

    hideProfile() {
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
        }
        
        this.showError(errorMessage);
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi đăng nhập',
            text: message,
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonColor: '#5865f2',
        });
    }

    showLoading(show) {
        if (show) {
            this.loginBtn.style.display = 'none';
            this.loading.style.display = 'flex';
        } else {
            this.loginBtn.style.display = 'flex';
            this.loading.style.display = 'none';
        }
    }

    // Static methods
    static isLoggedIn() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('discord_user');
        
        if (!token || !userData) return false;
        
        try {
            const user = JSON.parse(userData);
            // Kiểm tra token còn hạn không (24h)
            const tokenAge = Date.now() - user.timestamp;
            return tokenAge < 24 * 60 * 60 * 1000;
        } catch {
            return false;
        }
    }

    static getUserData() {
        if (!this.isLoggedIn()) return null;
        
        try {
            return JSON.parse(localStorage.getItem('discord_user'));
        } catch {
            return null;
        }
    }

    static logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('discord_user');
        window.location.reload();
    }
}

// Khởi tạo khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    new DiscordAuth();
});

// Expose globally
window.DiscordAuth = DiscordAuth;