class TokenManager {
    constructor() {
        this.currentToken = null;
        this.timerInterval = null;
        this.userIP = null;
        this.isLoggedIn = false;
        this.isCreatingToken = false;
        this.isCreatingSession = false;
        this.loginChecked = false;
        this.userData = null;
        this.ipSessionChecked = false;
        
        // API endpoints
        this.API_BASE = '/api/bypass_funlink';
        this.LOGIN_API = '/api/auth';
        this.IP_SESSION_API = '/api/ip_session';
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSweetAlert();
        this.setupUserMenu();
        
        // Check URL parameters first
        this.checkURLParameters();
        
        // Load interface
        this.loadInterface();
        
        // Check IP session first, then normal login
        setTimeout(() => {
            this.checkIPSessionFirst();
        }, 500);
    }

    setupSweetAlert() {
        const customStyles = `
            .swal2-popup {
                background: #111 !important;
                border: 2px solid #00ff88 !important;
                border-radius: 15px !important;
                color: #fff !important;
            }
            .swal2-title {
                color: #fff !important;
            }
            .swal2-content {
                color: #ccc !important;
            }
            .swal2-confirm {
                background: linear-gradient(45deg, #00ff88, #00ccff) !important;
                border: none !important;
                border-radius: 8px !important;
                font-weight: bold !important;
            }
            .swal2-cancel {
                background: rgba(255, 71, 87, 0.8) !important;
                border: none !important;
                border-radius: 8px !important;
                font-weight: bold !important;
            }
            .swal2-deny {
                background: rgba(255, 136, 0, 0.8) !important;
                border: none !important;
                border-radius: 8px !important;
                font-weight: bold !important;
            }
        `;
        const styleElement = document.createElement('style');
        styleElement.innerHTML = customStyles;
        document.head.appendChild(styleElement);
    }

    initializeElements() {
        this.elements = {
            'ipDisplay': document.getElementById('ipDisplay'),
            'initialView': document.getElementById('initialView'),
            'tokenView': document.getElementById('tokenView'),
            'loadingView': document.getElementById('loadingView'),
            'createTokenBtn': document.getElementById('createTokenBtn'),
            'tokenDisplay': document.getElementById('tokenDisplay'),
            'timerDisplay': document.getElementById('timerDisplay'),
            'copyTokenBtn': document.getElementById('copyTokenBtn'),
            'loginPrompt': document.getElementById('loginPrompt'),
            'userInfo': document.getElementById('userInfo'),
            'userAvatar': document.getElementById('userAvatar'),
            'userName': document.getElementById('userName'),
            'userMenuBtn': document.getElementById('userMenuBtn'),
            'dropdownMenu': document.getElementById('dropdownMenu'),
            'logoutBtn': document.getElementById('logoutBtn')
        };
    }

    setupUserMenu() {
        if (this.elements.userMenuBtn) {
            this.elements.userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.elements.dropdownMenu.classList.toggle('show');
            });
        }

        document.addEventListener('click', () => {
            if (this.elements.dropdownMenu) {
                this.elements.dropdownMenu.classList.remove('show');
            }
        });

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const token = urlParams.get('token');
        
        if (success === 'true' && token) {
            const sessionToken = decodeURIComponent(token);
            localStorage.setItem('sessionToken', sessionToken);
            
            // Save IP session for future direct access
            this.saveIPSession(sessionToken);
            
            // Clean URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            this.shouldRecheckLogin = true;
            return;
        }
        
        // Clean any other parameters
        if (urlParams.toString()) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }

    async loadInterface() {
        try {
            this.elements.ipDisplay.textContent = 'Đang tải...';
            
            setTimeout(() => {
                this.elements.ipDisplay.textContent = '103.90.227.117';
            }, 1000);

            this.showInitialView();
        } catch (error) {
            console.error('Error loading interface:', error);
            this.elements.ipDisplay.textContent = 'Lỗi kết nối';
            this.showInitialView();
        }
    }

    async checkIPSessionFirst() {
        try {
            const response = await fetch(this.IP_SESSION_API, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.has_session && data.session_token) {
                    // Auto login from IP session
                    localStorage.setItem('sessionToken', data.session_token);
                    
                    // Show welcome back message
                    const toastMixin = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true
                    });
                    
                    toastMixin.fire({
                        icon: 'success',
                        title: 'Chào mừng trở lại!',
                        text: `Xin chào ${data.user.globalName || data.user.username}`
                    });
                    
                    // Set user data and proceed
                    if (data.user) {
                        this.isLoggedIn = true;
                        this.userData = data.user;
                        this.updateUserInterface();
                        this.loadRealData();
                        this.loginChecked = true;
                        this.ipSessionChecked = true;
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error checking IP session:', error);
        }
        
        this.ipSessionChecked = true;
        this.checkLoginStatusSilently();
    }

    async saveIPSession(sessionToken) {
        try {
            let userData = null;
            try {
                userData = JSON.parse(atob(sessionToken));
            } catch (e) {
                return;
            }

            const response = await fetch(this.IP_SESSION_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_token: sessionToken,
                    user_data: userData
                })
            });

            if (response.ok) {
                console.log('IP session saved successfully');
            }
        } catch (error) {
            console.error('Error saving IP session:', error);
        }
    }

    async checkLoginStatusSilently() {
        if (this.loginChecked) {
            return;
        }
        
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            
            if (!sessionToken) {
                this.isLoggedIn = false;
                this.loginChecked = true;
                this.updateUserInterface();
                return;
            }

            // Try to parse token locally first
            let tokenData = null;
            try {
                tokenData = JSON.parse(atob(sessionToken));
                
                // Check token age
                if (tokenData.timestamp) {
                    const tokenAge = Date.now() - tokenData.timestamp;
                    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
                    
                    if (tokenAge > maxAge) {
                        this.handleInvalidLogin();
                        return;
                    }
                }
                
                // Use local token data if valid
                if (tokenData.id && tokenData.username) {
                    this.isLoggedIn = true;
                    this.userData = tokenData;
                    this.updateUserInterface();
                    this.loadRealData();
                    this.loginChecked = true;
                    return;
                }
                
            } catch (e) {
                // Token parsing failed, try API
            }

            // Verify with API if local parsing failed
            const response = await fetch(this.API_BASE, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.user) {
                    this.isLoggedIn = true;
                    this.userData = data.user;
                } else if (tokenData && tokenData.username) {
                    this.isLoggedIn = true;
                    this.userData = tokenData;
                } else {
                    this.handleInvalidLogin();
                    return;
                }
                
                this.updateUserInterface();
                this.loadRealData();
            } else {
                // Use local token as fallback
                if (tokenData && tokenData.username) {
                    this.isLoggedIn = true;
                    this.userData = tokenData;
                    this.updateUserInterface();
                    this.loadRealData();
                } else {
                    this.handleInvalidLogin();
                }
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            
            // Emergency fallback
            const sessionToken = localStorage.getItem('sessionToken');
            if (sessionToken) {
                try {
                    const tokenData = JSON.parse(atob(sessionToken));
                    if (tokenData.username) {
                        this.isLoggedIn = true;
                        this.userData = tokenData;
                        this.updateUserInterface();
                        this.loadRealData();
                        this.loginChecked = true;
                        return;
                    }
                } catch (e) {}
            }
            
            this.handleInvalidLogin();
        }
        
        this.loginChecked = true;
    }

    handleInvalidLogin() {
        this.isLoggedIn = false;
        this.userData = null;
        localStorage.removeItem('sessionToken');
        this.clearIPSession();
        this.updateUserInterface();
    }

    updateUserInterface() {
        if (this.isLoggedIn && this.userData) {
            if (this.elements.loginPrompt) {
                this.elements.loginPrompt.style.display = 'none';
            }
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = 'flex';
            }
            
            if (this.elements.userName) {
                const displayName = this.userData.globalName || this.userData.username;
                this.elements.userName.textContent = displayName;
            }
            
            if (this.elements.userAvatar) {
                if (this.userData.avatar) {
                    const avatarUrl = `https://cdn.discordapp.com/avatars/${this.userData.id}/${this.userData.avatar}.png?size=128`;
                    this.elements.userAvatar.src = avatarUrl;
                } else {
                    const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${(this.userData.discriminator || 0) % 5}.png`;
                    this.elements.userAvatar.src = defaultAvatar;
                }
            }
        } else {
            if (this.elements.loginPrompt) {
                this.elements.loginPrompt.style.display = 'block';
            }
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = 'none';
            }
        }
    }

    async loadRealData() {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await fetch(this.API_BASE, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.ip) {
                    this.userIP = data.ip;
                    this.elements.ipDisplay.textContent = this.userIP;
                }

                if (data.has_existing_token && data.token) {
                    this.currentToken = data.token;
                    this.elements.tokenDisplay.value = data.token;
                    this.startTimer(data.time_left_ms);
                    this.showTokenView();
                    
                    Swal.fire({
                        'icon': 'info',
                        'title': 'Token đã tồn tại',
                        'text': 'Đã tải lại token hiện tại của bạn.',
                        'timer': 3000,
                        'timerProgressBar': true,
                        'showConfirmButton': false
                    });
                }
            }
        } catch (error) {
            console.error('Error loading real data:', error);
        }
    }

    showLoginRequiredAlert() {
        return Swal.fire({
            icon: 'warning',
            title: 'Vui lòng đăng nhập',
            html: `
                <p>Hãy đăng nhập để xem nội dung sau</p>
                <p style="font-size: 0.9em; color: #ccc; margin-top: 10px;">
                    Bấm nút "Đăng nhập" ở góc phải để tiếp tục
                </p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập ngay',
            cancelButtonText: 'Để sau',
            confirmButtonColor: '#00ff88',
            cancelButtonColor: '#6c757d',
            showCloseButton: true,
            allowOutsideClick: true,
            allowEscapeKey: true
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/login';
            }
        });
    }

    async clearIPSession() {
        try {
            await fetch(this.IP_SESSION_API, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error clearing IP session:', error);
        }
    }

    async logout() {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Xác nhận đăng xuất',
            text: 'Bạn có chắc chắn muốn đăng xuất?',
            showCancelButton: true,
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#ff4757',
            cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
            // Clear localStorage
            localStorage.removeItem('sessionToken');
            
            // Clear IP session
            await this.clearIPSession();
            
            // Reset states
            this.isLoggedIn = false;
            this.userData = null;
            this.currentToken = null;
            this.loginChecked = false;
            this.ipSessionChecked = false;
            
            // Update UI
            this.updateUserInterface();
            this.showInitialView();
            
            Swal.fire({
                icon: 'success',
                title: 'Đã đăng xuất',
                text: 'Bạn đã đăng xuất thành công.',
                timer: 2000,
                showConfirmButton: false
            });
        }
    }

    setupEventListeners() {
        if (this.elements.createTokenBtn) {
            this.elements.createTokenBtn.addEventListener('click', () => {
                this.createToken();
            });
        }

        if (this.elements.copyTokenBtn) {
            this.elements.copyTokenBtn.addEventListener('click', () => {
                this.copyToken();
            });
        }

        const downloadTrigger = document.querySelector('#downloadTrigger');
        if (downloadTrigger) {
            downloadTrigger.addEventListener('click', async (event) => {
                event.preventDefault();
                await this.createDownloadSession();
            });
        }
    }

    showView(viewName) {
        const allViews = ['initialView', 'tokenView', 'loadingView'];
        allViews.forEach(view => {
            if (this.elements[view]) {
                this.elements[view].classList.add('hidden');
            }
        });
        
        if (this.elements[viewName]) {
            this.elements[viewName].classList.remove('hidden');
        }
    }

    showInitialView() {
        this.showView('initialView');
        this.stopTimer();
    }

    showTokenView() {
        this.showView('tokenView');
    }

    showLoadingView() {
        this.showView('loadingView');
    }

    async createToken() {
        if (!this.loginChecked) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.loginChecked) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 10000);
            });
        }

        if (!this.isLoggedIn) {
            await this.showLoginRequiredAlert();
            return;
        }

        if (this.isCreatingToken) {
            Swal.fire({
                icon: 'warning',
                title: 'Đang xử lý',
                text: 'Vui lòng chờ hoàn thành yêu cầu hiện tại.',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        this.isCreatingToken = true;
        this.showLoadingView();
        
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await fetch(this.API_BASE, {
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                'body': JSON.stringify({
                    'action': 'create_token'
                })
            });

            const data = await response.json();

            if (response.status === 201 && data.success) {
                this.currentToken = data.token;
                this.elements.tokenDisplay.value = data.token;
                this.startTimer(data.time_left_ms);
                this.showTokenView();
                
                Swal.fire({
                    'icon': 'success',
                    'title': 'Token đã được tạo!',
                    'text': 'Token của bạn đã được tạo thành công và có thời hạn 3 tiếng.',
                    'confirmButtonText': 'Tuyệt vời!',
                    'timer': 5000,
                    'timerProgressBar': true
                });
                return;
            }

            throw new Error(data.message || data.error || 'Không thể tạo token');
        } catch (error) {
            console.error('Error creating token:', error);
            const errorMessage = error.message || 'Lỗi kết nối đến máy chủ.';
            this.showInitialView();
            
            Swal.fire({
                'icon': 'error',
                'title': 'Lỗi tạo token',
                'text': errorMessage,
                'confirmButtonText': 'Thử lại'
            });
        } finally {
            this.isCreatingToken = false;
        }
    }

    async createDownloadSession() {
        if (!this.loginChecked) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.loginChecked) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 10000);
            });
        }

        if (!this.isLoggedIn) {
            await this.showLoginRequiredAlert();
            return;
        }

        if (this.isCreatingSession) {
            Swal.fire({
                icon: 'warning',
                title: 'Đang xử lý',
                text: 'Vui lòng chờ hoàn thành yêu cầu hiện tại.',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        this.isCreatingSession = true;

        const loadingAlert = Swal.fire({
            'title': 'Đang tạo session...',
            'text': 'Vui lòng chờ trong giây lát',
            'allowOutsideClick': false,
            'allowEscapeKey': false,
            'showConfirmButton': false,
            'didOpen': () => {
                Swal.showLoading();
            }
        });

        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await fetch(this.API_BASE, {
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                'body': JSON.stringify({
                    'action': 'create_download_session'
                })
            });

            const data = await response.json();
            loadingAlert.close();

            if (response.status === 201 && data.success) {
                await Swal.fire({
                    'icon': 'success',
                    'title': 'Session đã được tạo!',
                    'text': 'Đang chuyển hướng đến link tải...',
                    'timer': 2000,
                    'timerProgressBar': true,
                    'showConfirmButton': false
                });

                const downloadUrl = 'https://link4m.com/n902L';
                window.open(downloadUrl, '_blank');

                setTimeout(() => {
                    Swal.fire({
                        'icon': 'warning',
                        'title': 'Lưu ý quan trọng!',
                        'text': 'Vui lòng không dùng bypass nếu ko muốn bị chặn!',
                        'confirmButtonText': 'Đã hiểu',
                        'timer': 5000,
                        'timerProgressBar': true
                    });
                }, 2500);
                return;
            }

            if (response.status === 409 || data.error?.includes('đã có session')) {
                const result = await Swal.fire({
                    'icon': 'info',
                    'title': 'Bạn đã có session!',
                    'text': 'Bạn đã có session tải xuống. Bạn muốn xóa session cũ và tạo mới?',
                    'showCancelButton': true,
                    'showDenyButton': true,
                    'confirmButtonText': 'Xóa & Tạo mới',
                    'denyButtonText': 'Hủy',
                    'cancelButtonText': 'Giữ session cũ',
                    'confirmButtonColor': '#00ff88',
                    'denyButtonColor': '#ff8800',
                    'cancelButtonColor': '#ff4757'
                });

                if (result.isConfirmed) {
                    await this.deleteAndCreateSession();
                } else if (result.isDenied || result.isDismissed) {
                    Swal.fire({
                        'icon': 'info',
                        'title': 'Đã hủy',
                        'text': 'Giữ nguyên session hiện tại.',
                        'timer': 2000,
                        'showConfirmButton': false
                    });
                }
                return;
            }

            throw new Error(data.error || 'Không thể tạo phiên tải xuống');
        } catch (error) {
            console.error('Error creating download session:', error);
            loadingAlert.close();
            
            Swal.fire({
                'icon': 'error',
                'title': 'Lỗi tạo session',
                'text': error.message,
                'confirmButtonText': 'Thử lại'
            });
        } finally {
            this.isCreatingSession = false;
        }
    }

    async deleteAndCreateSession() {
        if (!this.isLoggedIn) {
            await this.showLoginRequiredAlert();
            return;
        }

        const loadingAlert = Swal.fire({
            'title': 'Đang xóa session cũ...',
            'text': 'Vui lòng chờ trong giây lát',
            'allowOutsideClick': false,
            'allowEscapeKey': false,
            'showConfirmButton': false,
            'didOpen': () => {
                Swal.showLoading();
            }
        });

        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await fetch(this.API_BASE, {
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                'body': JSON.stringify({
                    'action': 'delete_session'
                })
            });

            if (response.ok) {
                loadingAlert.close();
                
                Swal.fire({
                    'icon': 'success',
                    'title': 'Đã xóa session cũ!',
                    'text': 'Đang tạo session mới...',
                    'timer': 1500,
                    'showConfirmButton': false
                });

                setTimeout(() => {
                    this.createDownloadSession();
                }, 1500);
            } else {
                throw new Error('Không thể xóa session cũ');
            }
        } catch (error) {
            loadingAlert.close();
            
            Swal.fire({
                'icon': 'error',
                'title': 'Lỗi xóa session',
                'text': 'Không thể xóa session cũ. Vui lòng thử lại sau.',
                'confirmButtonText': 'OK'
            });
        }
    }

    startTimer(timeLeftMs) {
        this.stopTimer();
        let secondsLeft = Math.floor(timeLeftMs / 1000);

        const updateTimer = () => {
            if (secondsLeft <= 0) {
                if (this.elements.timerDisplay) {
                    this.elements.timerDisplay.textContent = '00:00:00';
                }
                this.stopTimer();
                
                Swal.fire({
                    'icon': 'warning',
                    'title': 'Token đã hết hạn!',
                    'text': 'Token của bạn đã hết hạn. Vui lòng tạo token mới.',
                    'confirmButtonText': 'Tạo token mới'
                }).then((result) => {
                    if (result.isConfirmed) {
                        this.showInitialView();
                    }
                });
                return;
            }

            const hours = Math.floor(secondsLeft / 3600);
            const minutes = Math.floor((secondsLeft % 3600) / 60);
            const seconds = secondsLeft % 60;

            if (this.elements.timerDisplay) {
                this.elements.timerDisplay.textContent = 
                    hours.toString().padStart(2, '0') + ':' +
                    minutes.toString().padStart(2, '0') + ':' +
                    seconds.toString().padStart(2, '0');

                if (secondsLeft <= 300) {
                    this.elements.timerDisplay.style.animation = 'pulse 1s ease-in-out infinite';
                    this.elements.timerDisplay.style.color = '#ff4757';
                }
            }

            secondsLeft--;
        };

        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.style.animation = '';
            this.elements.timerDisplay.style.color = '#ff8800';
        }
    }

    async copyToken() {
        if (!this.loginChecked) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.loginChecked) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 10000);
            });
        }

        if (!this.isLoggedIn) {
            await this.showLoginRequiredAlert();
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentToken);
            
            const originalContent = this.elements.copyTokenBtn.innerHTML;
            this.elements.copyTokenBtn.innerHTML = '<i class="fas fa-check"></i>';
            this.elements.copyTokenBtn.style.background = 'rgba(0, 255, 136, 0.5)';
            this.elements.copyTokenBtn.style.transform = 'scale(1.1)';

            setTimeout(() => {
                this.elements.copyTokenBtn.innerHTML = originalContent;
                this.elements.copyTokenBtn.style.background = '';
                this.elements.copyTokenBtn.style.transform = '';
            }, 1500);

            const toastMixin = Swal.mixin({
                'toast': true,
                'position': 'top-end',
                'showConfirmButton': false,
                'timer': 3000,
                'timerProgressBar': true,
                'didOpen': (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });

            toastMixin.fire({
                'icon': 'success',
                'title': 'Token đã được copy!'
            });
        } catch (error) {
            console.error('Error copying token:', error);
            
            if (this.elements.tokenDisplay) {
                this.elements.tokenDisplay.select();
                this.elements.tokenDisplay.setSelectionRange(0, 99999);
            }
            
            try {
                document.execCommand('copy');
                const toastMixin = Swal.mixin({
                    'toast': true,
                    'position': 'top-end',
                    'showConfirmButton': false,
                    'timer': 3000,
                    'timerProgressBar': true
                });
                
                toastMixin.fire({
                    'icon': 'success',
                    'title': 'Token đã được copy!'
                });
            } catch (fallbackError) {
                Swal.fire({
                    'icon': 'error',
                    'title': 'Không thể copy',
                    'text': 'Không thể copy token. Vui lòng copy thủ công.',
                    'confirmButtonText': 'OK'
                });
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TokenManager();
});