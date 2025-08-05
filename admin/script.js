// admin/script.js - SIMPLE VERSION - NO BLACKLIST
class GemloginAdmin {
    constructor() {
        this.password = 'TuanHai45191';
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 'users';
        this.init();
    }

    init() {
        console.log('🚀 Gemlogin Admin Panel Loading...');
        this.bindEvents();
        this.checkAuth();
    }

    // 🔥 SIMPLE KICK USER - NO BAN
    kickUser(userId) {
        try {
            const currentUser = localStorage.getItem('discord_user');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                if ((userData.id || userData.discord_id) === userId) {
                    // User đang login - KICK THEM OUT
                    localStorage.removeItem('discord_user');
                    localStorage.removeItem('auth_token');
                    
                    // Set kick flag (temporary - 1 hour)
                    localStorage.setItem(`user_kicked_${userId}`, Date.now().toString());
                    
                    console.log('🦵 KICKED user:', userId);
                }
            }
        } catch (error) {
            console.error('Error kicking user:', error);
        }
    }

    bindEvents() {
        // Login
        const loginForm = document.getElementById('loginForm');
        loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Logout
        document.getElementById('adminLogout')?.addEventListener('click', () => this.logout());

        // Search
        document.getElementById('searchInput')?.addEventListener('input', (e) => this.search(e.target.value));

        // Controls
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadUsers());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearAll());
    }

    checkAuth() {
        const saved = localStorage.getItem('gemlogin_admin_auth');
        if (saved === this.password) {
            this.showDashboard();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;

        if (password !== this.password) {
            this.showAlert('error', 'Invalid Password', 'Access denied. Check your credentials.');
            return;
        }

        localStorage.setItem('gemlogin_admin_auth', password);
        this.showAlert('success', 'Access Granted', 'Welcome to Gemlogin Admin Panel');
        setTimeout(() => this.showDashboard(), 1000);
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'flex';
        this.loadUsers();
        this.updateStats();
    }

    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => page.style.display = 'none');

        // Show selected page
        document.getElementById(page + 'Page').style.display = 'block';

        // Update page title
        const titles = {
            users: { title: 'User Management', subtitle: 'Manage Discord users and sessions' },
            analytics: { title: 'Analytics', subtitle: 'View usage statistics and trends' },
            settings: { title: 'Settings', subtitle: 'Configure admin panel preferences' }
        };

        if (titles[page]) {
            document.getElementById('pageTitle').textContent = titles[page].title;
            document.getElementById('pageSubtitle').textContent = titles[page].subtitle;
        }

        this.currentPage = page;
    }

    async loadUsers() {
        this.showLoading(true);
        
        try {
            // Get ALL users from localStorage - NO FILTER
            this.users = this.getStoredUsers();
            
            // Try API if available
            try {
                const response = await fetch('/api/admin', {
                    headers: { 'Authorization': `Bearer ${this.password}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.users && data.users.length > 0) {
                        this.users = data.users;
                    }
                }
            } catch (error) {
                console.log('API not available, using localStorage');
            }

            console.log(`📊 Loaded ${this.users.length} users`);
            this.filteredUsers = [...this.users];
            this.renderUsers();
            this.updateStats();
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            this.showLoading(false);
        }
    }

    getStoredUsers() {
        try {
            const stored = localStorage.getItem('admin_users');
            const users = stored ? JSON.parse(stored) : [];
            console.log(`📦 Found ${users.length} users in localStorage`);
            return users;
        } catch (error) {
            console.error('Error reading localStorage:', error);
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
        tbody.innerHTML = this.filteredUsers.map(user => this.renderUserRow(user)).join('');
    }

    renderUserRow(user) {
        const avatar = this.getAvatarUrl(user);
        const name = this.getDisplayName(user);
        const id = user.discord_id || user.id || 'N/A';
        const joinDate = this.formatDate(user.joined_at || user.joinedAt);
        const relativeTime = this.getRelativeTime(user.joined_at || user.joinedAt);
        const days = user.days_in_server || user.daysInServer || 0;
        const status = this.getStatus(user);
        const lastSeen = this.getLastSeen(user);

        return `
            <tr data-user-id="${id}">
                <td>
                    <div class="user-info">
                        <img src="${avatar}" alt="Avatar" class="user-avatar" 
                             onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                        <div class="user-details">
                            <div class="user-name">${name}</div>
                            <div class="user-id">${this.truncateId(id)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <code class="discord-id">${id}</code>
                </td>
                <td>
                    <div class="join-date">${joinDate}</div>
                    <div class="relative-time">${relativeTime}</div>
                </td>
                <td>
                    <span class="days-badge ${this.getDaysBadgeClass(days)}">
                        ${days} days
                    </span>
                </td>
                <td>
                    <div class="status-badge ${status.class}">
                        <span class="status-dot"></span>
                        ${status.text}
                    </div>
                    <div class="last-seen">${lastSeen}</div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="gemloginAdmin.viewUser('${id}')" title="View Details">
                            👁️
                        </button>
                        <button class="action-btn kick-btn" onclick="gemloginAdmin.kickAndDelete('${id}')" title="Kick & Delete">
                            🦵
                        </button>
                    </div>
                </td>
            </tr>
        `;
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
        if (!id || id === 'N/A') return 'N/A';
        return id.length > 12 ? id.substring(0, 12) + '...' : id;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(typeof dateString === 'number' ? dateString : dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid';
        }
    }

    getRelativeTime(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(typeof dateString === 'number' ? dateString : dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return '1 day ago';
            if (diffDays < 30) return `${diffDays} days ago`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
            return `${Math.floor(diffDays / 365)} years ago`;
        } catch (e) {
            return '';
        }
    }

    getDaysBadgeClass(days) {
        if (days >= 365) return 'legendary';
        if (days >= 90) return 'high';
        if (days >= 30) return 'medium';
        return 'low';
    }

    getStatus(user) {
        const lastLogin = user.last_login || user.timestamp;
        if (!lastLogin) return { class: 'offline', text: 'Offline' };
        
        const loginTime = new Date(typeof lastLogin === 'number' ? lastLogin : lastLogin);
        const now = new Date();
        const diffMinutes = (now - loginTime) / (1000 * 60);
        
        if (diffMinutes < 5) return { class: 'online', text: 'Online' };
        if (diffMinutes < 30) return { class: 'away', text: 'Away' };
        return { class: 'offline', text: 'Offline' };
    }

    getLastSeen(user) {
        const lastLogin = user.last_login || user.timestamp;
        if (!lastLogin) return 'Never';
        
        const loginTime = new Date(typeof lastLogin === 'number' ? lastLogin : lastLogin);
        const now = new Date();
        const diffMinutes = Math.floor((now - loginTime) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        return `${Math.floor(diffMinutes / 1440)}d ago`;
    }

    async viewUser(userId) {
        const user = this.users.find(u => (u.discord_id || u.id) === userId);
        if (!user) return;

        const html = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <img src="${this.getAvatarUrl(user)}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #2563eb; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #1f2937;">${this.getDisplayName(user)}</h3>
            </div>
            <div style="text-align: left; line-height: 1.8;">
                <p><strong>Discord ID:</strong> <code>${user.discord_id || user.id}</code></p>
                <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
                <p><strong>Display Name:</strong> ${user.global_name || user.globalName || 'N/A'}</p>
                <p><strong>Join Date:</strong> ${this.formatDate(user.joined_at || user.joinedAt)}</p>
                <p><strong>Days in Server:</strong> ${user.days_in_server || user.daysInServer || 0}</p>
                <p><strong>Login Count:</strong> ${user.login_count || 1}</p>
                <p><strong>Status:</strong> ${this.getStatus(user).text}</p>
                <p><strong>Last Seen:</strong> ${this.getLastSeen(user)}</p>
            </div>
        `;

        this.showAlert('info', `User: ${this.getDisplayName(user)}`, html);
    }

    // 🆕 SIMPLE KICK AND DELETE
    async kickAndDelete(userId) {
        const user = this.users.find(u => (u.discord_id || u.id) === userId);
        if (!user) return;

        const result = await this.showConfirm(
            'Kick & Delete User',
            `Kick ${this.getDisplayName(user)} out and delete their data?`,
            'They will be logged out immediately but can login again.'
        );

        if (result.isConfirmed) {
            // 1. Kick user out first
            this.kickUser(userId);
            
            // 2. Remove from users list
            this.users = this.users.filter(u => (u.discord_id || u.id) !== userId);
            this.filteredUsers = this.filteredUsers.filter(u => (u.discord_id || u.id) !== userId);
            
            // 3. Save updated users
            this.saveUsers();
            
            // 4. Try API delete
            try {
                await fetch(`/api/admin?userId=${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.password}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.log('API delete failed, using localStorage only');
            }
            
            // 5. Update UI
            this.renderUsers();
            this.updateStats();
            
            // 6. Show success
            this.showAlert('success', 'User Kicked & Deleted', 
                `${this.getDisplayName(user)} has been kicked out and removed.`);
            
            console.log('✅ User kicked and deleted:', userId);
        }
    }

    async clearAll() {
        if (this.users.length === 0) {
            this.showAlert('info', 'No Data', 'There are no users to delete.');
            return;
        }

        const result = await this.showConfirm(
            'Clear All Users',
            `Delete all ${this.users.length} users?`,
            'This will kick out all logged in users and clear data.'
        );

        if (result.isConfirmed) {
            // Show progress
            Swal.fire({
                title: 'Clearing All Users...',
                text: 'Please wait...',
                background: '#1e293b',
                color: '#ffffff',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Kick all currently logged in users
            this.users.forEach(user => {
                const userId = user.discord_id || user.id;
                if (userId) {
                    this.kickUser(userId);
                }
            });

            // Clear all user data
            this.users = [];
            this.filteredUsers = [];
            this.saveUsers();
            
            // Clear current session if any
            localStorage.removeItem('discord_user');
            localStorage.removeItem('auth_token');

            setTimeout(() => {
                this.renderUsers();
                this.updateStats();
                
                Swal.fire({
                    icon: 'success',
                    title: 'All Users Cleared',
                    text: 'All users have been kicked and data cleared.',
                    background: '#1e293b',
                    color: '#ffffff',
                    confirmButtonColor: '#059669'
                });
            }, 2000);
        }
    }

    search(query) {
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

    exportData() {
        if (this.users.length === 0) {
            this.showAlert('info', 'No Data', 'There are no users to export.');
            return;
        }

        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemlogin-users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.showAlert('success', 'Exported', `${this.users.length} users exported to CSV.`);
    }

    generateCSV() {
        const headers = ['Name', 'Username', 'Discord ID', 'Join Date', 'Days in Server', 'Last Login', 'Status'];
        const rows = this.users.map(user => [
            this.getDisplayName(user),
            user.username || '',
            user.discord_id || user.id || '',
            this.formatDate(user.joined_at || user.joinedAt),
            user.days_in_server || user.daysInServer || 0,
            this.getLastSeen(user),
            this.getStatus(user).text
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    updateStats() {
        const total = this.users.length;
        const online = this.users.filter(user => this.getStatus(user).class === 'online').length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogins = this.users.filter(user => {
            const lastLogin = user.last_login || user.timestamp;
            if (!lastLogin) return false;
            const loginDate = new Date(typeof lastLogin === 'number' ? lastLogin : lastLogin);
            return loginDate >= today;
        }).length;

        document.getElementById('totalUsers').textContent = total;
        document.getElementById('onlineUsers').textContent = online;
        document.getElementById('todayLogins').textContent = todayLogins;
    }

    saveUsers() {
        localStorage.setItem('admin_users', JSON.stringify(this.users));
    }

    logout() {
        localStorage.removeItem('gemlogin_admin_auth');
        location.reload();
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }

    showAlert(icon, title, text) {
        Swal.fire({
            icon,
            title,
            html: text,
            background: '#1e293b',
            color: '#ffffff',
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'swal-dark'
            }
        });
    }

    showConfirm(title, text, footer) {
        return Swal.fire({
            title,
            text,
            footer,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel',
            background: '#1e293b',
            color: '#ffffff'
        });
    }
}

// Initialize
const gemloginAdmin = new GemloginAdmin();

// Global functions
window.gemloginAdmin = gemloginAdmin;
window.debugUsers = () => console.table(gemloginAdmin.users);
window.addTestUser = () => {
    const testUser = {
        discord_id: '999' + Date.now(),
        username: 'testuser_' + Math.floor(Math.random() * 1000),
        global_name: 'Test User ' + Math.floor(Math.random() * 1000),
        avatar: null,
        joined_at: new Date().toISOString(),
        days_in_server: Math.floor(Math.random() * 100),
        last_login: Date.now(),
        login_count: Math.floor(Math.random() * 10) + 1
    };
    
    const currentUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    currentUsers.push(testUser);
    localStorage.setItem('admin_users', JSON.stringify(currentUsers));
    
    console.log('✅ Test user added:', testUser.username);
    gemloginAdmin.loadUsers();
};

console.log('🚀 Gemlogin Admin Panel Ready');
console.log('Password: TuanHai45191');
console.log('Commands: debugUsers(), addTestUser()');