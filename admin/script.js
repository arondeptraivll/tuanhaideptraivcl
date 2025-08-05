// admin/script.js
class AdminDashboard {
    constructor() {
        this.adminPassword = null;
        this.users = [];
        this.filteredUsers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminAuth();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
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

    checkAdminAuth() {
        const savedPassword = localStorage.getItem('admin_auth');
        if (savedPassword) {
            this.adminPassword = savedPassword;
            this.showDashboard();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;

        if (!password) {
            this.showError('Vui lòng nhập mật khẩu!');
            return;
        }

        try {
            // Test API connection
            const response = await fetch('/api/admin', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${password}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.adminPassword = password;
                localStorage.setItem('admin_auth', password);
                this.showSuccess('Đăng nhập thành công!');
                setTimeout(() => this.showDashboard(), 1000);
            } else {
                this.showError('Mật khẩu không đúng!');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Lỗi kết nối server!');
        }
    }

    handleLogout() {
        Swal.fire({
            title: '🚪 Đăng xuất Admin?',
            text: 'Bạn có chắc muốn đăng xuất khỏi panel admin không?',
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
        this.showLoading(true);

        try {
            // First try to get from API
            const response = await fetch('/api/admin', {
                headers: {
                    'Authorization': `Bearer ${this.adminPassword}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.users = data.users || [];
            } else {
                // Fallback to localStorage simulation
                this.users = this.getUsersFromLocalStorage();
            }

            this.filteredUsers = [...this.users];
            this.renderUsers();
            this.updateStats();
        } catch (error) {
            console.error('Error loading users:', error);
            // Fallback to localStorage
            this.users = this.getUsersFromLocalStorage();
            this.filteredUsers = [...this.users];
            this.renderUsers();
            this.updateStats();
        } finally {
            this.showLoading(false);
        }
    }

    getUsersFromLocalStorage() {
        // Simulate getting users from various sources
        const users = [];
        
        // Get from saved login data (this would be enhanced in real implementation)
        const savedUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
        
        return savedUsers;
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
            <tr>
                <td>
                    <img src="${this.getAvatarUrl(user)}" alt="Avatar" class="user-avatar" 
                         onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                </td>
                <td>
                    <div class="user-name">${this.getDisplayName(user)}</div>
                    <div class="user-id">${user.discord_id || user.id || 'N/A'}</div>
                </td>
                <td>
                    <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                        ${user.discord_id || user.id || 'N/A'}
                    </code>
                </td>
                <td>
                    ${this.formatDate(user.joined_at || user.joinedAt)}
                </td>
                <td>
                    <span class="days-badge ${this.getDaysBadgeClass(user.days_in_server || user.daysInServer)}">
                        ${user.days_in_server || user.daysInServer || 0} ngày
                    </span>
                </td>
                <td>
                    ${this.formatDate(user.last_login || user.timestamp)}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn delete-btn" onclick="adminDashboard.deleteUser('${user.discord_id || user.id}')">
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

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(typeof dateString === 'number' ? dateString : dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    }

    getDaysBadgeClass(days) {
        if (!days || days === 0) return 'low';
        if (days >= 30) return 'high';
        if (days >= 7) return 'medium';
        return 'low';
    }

    async deleteUser(userId) {
        const result = await Swal.fire({
            title: '⚠️ Xóa người dùng?',
            text: `Bạn có chắc muốn xóa user này không?`,
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
                const response = await fetch(`/api/admin?userId=${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.adminPassword}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    this.showSuccess('Đã xóa user thành công!');
                    this.loadUsers();
                } else {
                    // Fallback to localStorage
                    this.users = this.users.filter(user => 
                        (user.discord_id || user.id) !== userId
                    );
                    this.filteredUsers = [...this.users];
                    this.saveUsersToLocalStorage();
                    this.renderUsers();
                    this.updateStats();
                    this.showSuccess('Đã xóa user thành công!');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                this.showError('Lỗi khi xóa user!');
            }
        }
    }

    async clearAllUsers() {
        const result = await Swal.fire({
            title: '🚨 XÓA TẤT CẢ?',
            html: `
                <p style="color: #ef4444; font-weight: 600;">CẢNH BÁO: Hành động này không thể hoàn tác!</p>
                <p>Bạn sẽ xóa tất cả ${this.users.length} người dùng.</p>
                <p>Nhập "XÓA TẤT CẢ" để xác nhận:</p>
            `,
            input: 'text',
            inputPlaceholder: 'Nhập "XÓA TẤT CẢ"',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '🗑️ XÓA TẤT CẢ',
            cancelButtonText: '❌ HỦY',
            background: 'linear-gradient(135deg, #0f0f19, #1a1a2e)',
            color: '#ffffff',
            preConfirm: (value) => {
                if (value !== 'XÓA TẤT CẢ') {
                    Swal.showValidationMessage('Vui lòng nhập chính xác "XÓA TẤT CẢ"');
                }
                return value;
            }
        });

        if (result.isConfirmed) {
            try {
                // In real implementation, call API to delete all
                this.users = [];
                this.filteredUsers = [];
                this.saveUsersToLocalStorage();
                this.renderUsers();
                this.updateStats();
                this.showSuccess('Đã xóa tất cả người dùng!');
            } catch (error) {
                console.error('Error clearing all users:', error);
                this.showError('Lỗi khi xóa tất cả!');
            }
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
                return name.includes(searchTerm) || id.includes(searchTerm);
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
        
        this.showSuccess('Đã export dữ liệu thành công!');
    }

    generateCSV() {
        const headers = ['Tên', 'Discord ID', 'Avatar URL', 'Ngày join', 'Số ngày', 'Lần login cuối'];
        const rows = this.users.map(user => [
            this.getDisplayName(user),
            user.discord_id || user.id || '',
            this.getAvatarUrl(user),
            this.formatDate(user.joined_at || user.joinedAt),
            user.days_in_server || user.daysInServer || 0,
            this.formatDate(user.last_login || user.timestamp)
        ]);

        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    updateStats() {
        const totalUsers = this.users.length;
        const onlineUsers = this.users.filter(user => {
            const lastLogin = user.last_login || user.timestamp;
            if (!lastLogin) return false;
            const loginTime = new Date(typeof lastLogin === 'number' ? lastLogin : lastLogin);
            const now = new Date();
            return (now - loginTime) < 24 * 60 * 60 * 1000; // Last 24 hours
        }).length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('onlineUsers').textContent = onlineUsers;
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
            timer: 2000
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

// Save user data when someone logs in (call this from main login page)
window.saveUserToAdmin = function(userData) {
    const savedUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    
    // Check if user already exists
    const existingIndex = savedUsers.findIndex(user => 
        (user.discord_id || user.id) === userData.id
    );

    const userRecord = {
        discord_id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        global_name: userData.globalName,
        avatar: userData.avatar,
        joined_at: userData.joinedAt,
        days_in_server: userData.daysInServer,
        guilds_count: userData.guilds,
        last_login: Date.now(),
        created_at: existingIndex === -1 ? Date.now() : savedUsers[existingIndex].created_at,
        updated_at: Date.now()
    };

    if (existingIndex !== -1) {
        savedUsers[existingIndex] = userRecord;
    } else {
        savedUsers.push(userRecord);
    }

    localStorage.setItem('admin_users', JSON.stringify(savedUsers));
    
    // Also call API if available
    fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userData: userRecord })
    }).catch(err => console.log('API not available, using localStorage'));
};