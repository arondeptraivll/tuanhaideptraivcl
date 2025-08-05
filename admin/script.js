// admin/script.js
class AdminDashboard {
    constructor() {
        this.adminPassword = null;
        this.users = [];
        this.filteredUsers = [];
        this.correctPassword = 'TuanHai45191'; // 🔑 HARDCODED PASSWORD
        this.init();
    }

    init() {
        console.log('🚀 Initializing Admin Dashboard...');
        console.log('🔑 Expected Password:', this.correctPassword);
        this.bindEvents();
        this.checkAdminAuth();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Quick login button
        const quickLoginBtn = document.getElementById('quickLoginBtn');
        if (quickLoginBtn) {
            quickLoginBtn.addEventListener('click', () => this.quickLogin());
        }

        // Admin logout
        const adminLogout = document.getElementById('adminLogout');
        if (adminLogout) {
            adminLogout.addEventListener('click', () => this.handleLogout());
        }

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Control buttons
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUsers());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportUsers());
        }

        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllUsers());
        }
    }

    quickLogin() {
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.value = this.correctPassword;
            passwordInput.focus();
            
            // Auto submit after 1 second
            setTimeout(() => {
                const loginForm = document.getElementById('loginForm');
                if (loginForm) {
                    loginForm.dispatchEvent(new Event('submit'));
                }
            }, 500);
        }
    }

    checkAdminAuth() {
        const savedPassword = localStorage.getItem('admin_auth');
        if (savedPassword === this.correctPassword) {
            console.log('✅ Found valid saved auth');
            this.adminPassword = savedPassword;
            this.showDashboard();
        } else {
            console.log('❌ No valid saved auth found');
            localStorage.removeItem('admin_auth'); // Clear invalid auth
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        const submitBtn = document.getElementById('loginSubmitBtn');
        const btnText = document.getElementById('loginBtnText');

        if (!password) {
            this.showError('Vui lòng nhập mật khẩu!');
            return;
        }

        // Show loading
        submitBtn.disabled = true;
        btnText.textContent = 'Đang xác thực...';

        console.log('🔐 Attempting login with password:', password);

        // 🔑 CHECK PASSWORD FIRST
        if (password !== this.correctPassword) {
            console.log('❌ Password mismatch');
            submitBtn.disabled = false;
            btnText.textContent = 'Đăng nhập Admin';
            this.showError(`Mật khẩu không đúng! Mật khẩu đúng là: ${this.correctPassword}`);
            return;
        }

        console.log('✅ Password correct, testing API...');

        try {
            // Test API connection
            const response = await fetch('/api/admin', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${password}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response Status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API Response:', data);
                
                this.adminPassword = password;
                localStorage.setItem('admin_auth', password);
                this.showSuccess('Đăng nhập admin thành công!');
                setTimeout(() => this.showDashboard(), 1000);
            } else {
                const errorData = await response.json();
                console.log('⚠️ API Error, but password is correct - using offline mode');
                console.error('API Error Details:', errorData);
                
                // Still allow login since password is correct
                this.adminPassword = password;
                localStorage.setItem('admin_auth', password);
                this.showSuccess('Đăng nhập thành công! (Chế độ offline)');
                setTimeout(() => this.showDashboard(), 1000);
            }
        } catch (error) {
            console.log('⚠️ API Connection failed, using offline mode');
            console.error('Connection Error:', error);
            
            // Allow login in offline mode since password is correct
            this.adminPassword = password;
            localStorage.setItem('admin_auth', password);
            this.showSuccess('Đăng nhập thành công! (Chế độ offline)');
            setTimeout(() => this.showDashboard(), 1000);
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Đăng nhập Admin';
        }
    }

    handleLogout() {
        Swal.fire({
            title: '🚪 Đăng xuất Admin?',
            text: "Bạn có chắc muốn đăng xuất khỏi panel admin không?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '✅ Đăng xuất',
            cancelButtonText: '❌ Hủy',
            background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
            color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('admin_auth');
                this.adminPassword = null;
                this.showLogin();
                this.showSuccess('Đã đăng xuất thành công!');
            }
        });
    }

    showDashboard() {
        console.log('📊 Showing dashboard...');
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'flex';
        this.loadUsers();
    }

    showLogin() {
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminPassword').value = '';
    }

    async loadUsers() {
        console.log('📊 Loading users...');
        this.showLoading(true);

        try {
            // Try API first
            const response = await fetch('/api/admin', {
                headers: {
                    'Authorization': `Bearer ${this.adminPassword}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Users from API:', data);
                this.users = data.users || [];
            } else {
                console.log('⚠️ API failed, using localStorage');
                this.users = this.getUsersFromLocalStorage();
            }
        } catch (error) {
            console.log('⚠️ API connection failed, using localStorage');
            this.users = this.getUsersFromLocalStorage();
        }

        this.filteredUsers = [...this.users];
        this.renderUsers();
        this.updateStats();
        this.showLoading(false);
    }

    getUsersFromLocalStorage() {
        try {
            const savedUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
            console.log('📦 Users from localStorage:', savedUsers.length);
            return savedUsers;
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            return [];
        }
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        tbody.innerHTML = this.filteredUsers.map(user => `
            <tr class="user-row" data-user-id="${user.discord_id || user.id}">
                <td>
                    <img src="${this.getAvatarUrl(user)}" alt="Avatar" class="user-avatar" 
                         onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-name">${this.getDisplayName(user)}</div>
                        <div class="user-id-small">${this.truncateId(user.discord_id || user.id)}</div>
                    </div>
                </td>
                <td>
                    <code class="discord-id">
                        ${user.discord_id || user.id || 'N/A'}
                    </code>
                </td>
                <td>
                    <div class="date-info">
                        <div class="join-date">${this.formatDate(user.joined_at || user.joinedAt)}</div>
                        <div class="relative-time">${this.getRelativeTime(user.joined_at || user.joinedAt)}</div>
                    </div>
                </td>
                <td>
                    <span class="days-badge ${this.getDaysBadgeClass(user.days_in_server || user.daysInServer)}">
                        <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                        </svg>
                        ${user.days_in_server || user.daysInServer || 0} ngày
                    </span>
                </td>
                <td>
                    <div class="status-info">
                        <span class="status-badge ${this.getStatusClass(user)}">
                            <span class="status-dot"></span>
                            ${this.getStatusText(user)}
                        </span>
                        <div class="last-seen">${this.getLastSeen(user)}</div>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="adminDashboard.viewUser('${user.discord_id || user.id}')" title="Xem chi tiết">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn" onclick="adminDashboard.deleteUser('${user.discord_id || user.id}')" title="Xóa user">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getAvatarUrl(user) {
        if (user.avatar) {
            return `https://cdn.discordapp.com/avatars/${user.discord_id || user.id}/${user.avatar}.png?size=256`;
        }
        return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }

    getDisplayName(user) {
        let name = user.global_name || user.globalName || user.username || 'Unknown';
        if (user.discriminator && user.discriminator !== '0') {
            name += `#${user.discriminator}`;
        }
        return name;
    }

    truncateId(id) {
        if (!id) return 'N/A';
        return id.length > 8 ? id.substring(0, 8) + '...' : id;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(typeof dateString === 'number' ? dateString : dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    }

    getRelativeTime(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(typeof dateString === 'number' ? dateString : dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return '1 ngày trước';
            if (diffDays < 30) return `${diffDays} ngày trước`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
            return `${Math.floor(diffDays / 365)} năm trước`;
        } catch (e) {
            return '';
        }
    }

    getDaysBadgeClass(days) {
        if (!days || days === 0) return 'low';
        if (days >= 90) return 'legendary';
        if (days >= 30) return 'high';
        if (days >= 7) return 'medium';
        return 'low';
    }

    getStatusClass(user) {
        const lastLogin = user.last_login || user.timestamp;
        if (!lastLogin) return 'offline';
        
        const loginTime = new Date(typeof lastLogin === 'number' ? lastLogin : lastLogin);
        const now = new Date();
        const diffMinutes = (now - loginTime) / (1000 * 60);
        
        if (diffMinutes < 5) return 'online';
        if (diffMinutes < 30) return 'away';
        return 'offline';
    }

    getStatusText(user) {
        const statusClass = this.getStatusClass(user);
        switch (statusClass) {
            case 'online': return 'Online';
            case 'away': return 'Away';
            default: return 'Offline';
        }
    }

    getLastSeen(user) {
        const lastLogin = user.last_login || user.timestamp;
        if (!lastLogin) return 'Chưa từng';
        
        const loginTime = new Date(typeof lastLogin === 'number' ? lastLogin : lastLogin);
        const now = new Date();
        const diffMinutes = Math.floor((now - loginTime) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
        return `${Math.floor(diffMinutes / 1440)} ngày trước`;
    }

    async viewUser(userId) {
        const user = this.users.find(u => (u.discord_id || u.id) === userId);
        if (!user) return;

        const loginCount = user.login_count || 1;
        const status = this.getStatusText(user);
        const lastSeen = this.getLastSeen(user);

        Swal.fire({
            title: `👤 ${this.getDisplayName(user)}`,
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${this.getAvatarUrl(user)}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #3b82f6;">
                    </div>
                    <p><strong>🆔 Discord ID:</strong> <code>${user.discord_id || user.id}</code></p>
                    <p><strong>📝 Username:</strong> ${user.username || 'N/A'}</p>
                    <p><strong>🎭 Display Name:</strong> ${user.global_name || user.globalName || 'N/A'}</p>
                    <p><strong>📅 Ngày tham gia:</strong> ${this.formatDate(user.joined_at || user.joinedAt)}</p>
                    <p><strong>⏰ Số ngày trong server:</strong> ${user.days_in_server || user.daysInServer || 0} ngày</p>
                    <p><strong>🔢 Số lần đăng nhập:</strong> ${loginCount}</p>
                    <p><strong>🌐 Status:</strong> <span style="color: ${status === 'Online' ? '#10b981' : status === 'Away' ? '#f59e0b' : '#ef4444'}">${status}</span></p>
                    <p><strong>👁️ Lần cuối:</strong> ${lastSeen}</p>
                    <p><strong>🎮 Số server:</strong> ${user.guilds_count || user.guilds || 'N/A'}</p>
                </div>
            `,
            width: 500,
            background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
            color: '#ffffff',
            confirmButtonColor: '#3b82f6',
            confirmButtonText: '👍 OK'
        });
    }

    async deleteUser(userId) {
        const user = this.users.find(u => (u.discord_id || u.id) === userId);
        if (!user) return;

        const result = await Swal.fire({
            title: '⚠️ Xóa người dùng?',
            html: `
                <div style="text-align: center; margin: 20px 0;">
                    <img src="${this.getAvatarUrl(user)}" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #ef4444; margin-bottom: 10px;">
                    <p>Bạn có chắc muốn xóa user <strong>${this.getDisplayName(user)}</strong> không?</p>
                    <p style="color: #ef4444; font-size: 14px;">Hành động này không thể hoàn tác!</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '🗑️ Xóa',
            cancelButtonText: '❌ Hủy',
            background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
            color: '#ffffff'
        });

        if (result.isConfirmed) {
            try {
                // Try API first
                const response = await fetch(`/api/admin?userId=${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.adminPassword}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.log('API delete failed, using localStorage');
                }
            } catch (error) {
                console.log('API not available, using localStorage');
            }

            // Remove from localStorage anyway
            this.users = this.users.filter(user => 
                (user.discord_id || user.id) !== userId
            );
            this.filteredUsers = [...this.users];
            this.saveUsersToLocalStorage();
            this.renderUsers();
            this.updateStats();
            this.showSuccess('Đã xóa user thành công!');
        }
    }

    async clearAllUsers() {
        const result = await Swal.fire({
            title: '🚨 XÓA TẤT CẢ?',
            html: `
                <p style="color: #ef4444; font-weight: 600; font-size: 18px;">⚠️ CẢNH BÁO NGHIÊM TRỌNG!</p>
                <p>Bạn sắp xóa <strong>${this.users.length}</strong> người dùng.</p>
                <p style="color: #ef4444;">Hành động này KHÔNG THỂ HOÀN TÁC!</p>
                <br>
                <p>Để xác nhận, hãy nhập: <strong style="color: #3b82f6;">XÓA TẤT CẢ</strong></p>
            `,
            input: 'text',
            inputPlaceholder: 'Nhập "XÓA TẤT CẢ" để xác nhận',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '🗑️ XÓA TẤT CẢ',
            cancelButtonText: '❌ HỦY',
            background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
            color: '#ffffff',
            inputValidator: (value) => {
                if (value !== 'XÓA TẤT CẢ') {
                    return 'Vui lòng nhập chính xác "XÓA TẤT CẢ"';
                }
            }
        });

        if (result.isConfirmed) {
            // Show progress
            Swal.fire({
                title: '🔄 Đang xóa tất cả...',
                html: 'Vui lòng đợi trong giây lát...',
                background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
                color: '#ffffff',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            setTimeout(() => {
                this.users = [];
                this.filteredUsers = [];
                this.saveUsersToLocalStorage();
                this.renderUsers();
                this.updateStats();
                
                Swal.fire({
                    icon: 'success',
                    title: '✅ Đã xóa tất cả!',
                    text: 'Tất cả người dùng đã được xóa khỏi hệ thống.',
                    background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
                    color: '#ffffff',
                    confirmButtonColor: '#10b981',
                    timer: 3000
                });
            }, 2000);
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredUsers = [...this.users];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredUsers = this.users.filter(user => {
                const name = this.getDisplayName(user).toLowerCase();
                const id = (user.discord_id || user.id || '').toString().toLowerCase();
                const username = (user.username || '').toLowerCase();
                return name.includes(searchTerm) || id.includes(searchTerm) || username.includes(searchTerm);
            });
        }
        this.renderUsers();
    }

    exportUsers() {
        if (this.users.length === 0) {
            this.showError('Không có dữ liệu để export!');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `gemlogin_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showSuccess(`Đã export ${this.users.length} users thành công!`);
    }

    generateCSV() {
        const headers = ['Tên hiển thị', 'Username', 'Discord ID', 'Avatar URL', 'Ngày join', 'Số ngày', 'Lần login cuối', 'Số lần login', 'Status'];
        const rows = this.users.map(user => [
            this.getDisplayName(user),
            user.username || '',
            user.discord_id || user.id || '',
            this.getAvatarUrl(user),
            this.formatDate(user.joined_at || user.joinedAt),
            user.days_in_server || user.daysInServer || 0,
            this.getLastSeen(user),
            user.login_count || 1,
            this.getStatusText(user)
        ]);

        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    updateStats() {
        const totalUsers = this.users.length;
        const onlineUsers = this.users.filter(user => this.getStatusClass(user) === 'online').length;
        
        // Today logins
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogins = this.users.filter(user => {
            const lastLogin = user.last_login || user.timestamp;
            if (!lastLogin) return false;
            const loginDate = new Date(typeof lastLogin === 'number' ? lastLogin : lastLogin);
            return loginDate >= today;
        }).length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('onlineUsers').textContent = onlineUsers;
        document.getElementById('todayLogins').textContent = todayLogins;
    }

    saveUsersToLocalStorage() {
        localStorage.setItem('admin_users', JSON.stringify(this.users));
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }

    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: '✅ Thành công!',
            text: message,
            background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
            color: '#ffffff',
            confirmButtonColor: '#10b981',
            timer: 3000,
            timerProgressBar: true
        });
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: '❌ Lỗi!',
            text: message,
            background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
            color: '#ffffff',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Initialize dashboard
const adminDashboard = new AdminDashboard();

// 🔧 DEBUG FUNCTIONS
window.debugAdminData = function() {
    const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    console.table(adminUsers);
    console.log(`📊 Total users: ${adminUsers.length}`);
    return adminUsers;
};

window.clearAdminData = function() {
    localStorage.removeItem('admin_users');
    console.log('✅ Admin data cleared');
    if (window.adminDashboard) {
        adminDashboard.loadUsers();
    }
};

window.addTestUser = function() {
    const testUser = {
        discord_id: '123456789' + Date.now(),
        username: 'testuser' + Math.floor(Math.random() * 1000),
        global_name: 'Test User ' + Math.floor(Math.random() * 1000),
        avatar: '7d36ea95b06f80ae68ddce119654012',
        joined_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        days_in_server: Math.floor(Math.random() * 365),
        last_login: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        login_count: Math.floor(Math.random() * 20) + 1,
        status: 'online',
        created_at: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        updated_at: Date.now()
    };
    
    const savedUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    savedUsers.push(testUser);
    localStorage.setItem('admin_users', JSON.stringify(savedUsers));
    
    console.log('✅ Test user added:', testUser.username);
    if (window.adminDashboard) {
        adminDashboard.loadUsers();
    }
};

console.log('🚀 Gemlogin Admin Dashboard Loaded');
console.log('🔑 Password: TuanHai45191');
console.log('🧪 Debug commands: debugAdminData(), clearAdminData(), addTestUser()');