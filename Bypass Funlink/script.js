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
        
        // API endpoints
        this.API_BASE = '/api/bypass_funlink';
        this.LOGIN_API = '/api/auth';
        
        // Debug logging
        console.log('=== TokenManager Initialized ===');
        console.log('Current URL:', window.location.href);
        console.log('SessionToken in localStorage:', localStorage.getItem('sessionToken'));
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSweetAlert();
        this.setupUserMenu();
        
        // Check URL parameters first
        this.checkURLParameters();
        
        // Load giao diện trước
        this.loadInterface();
        
        // Check login sau 500ms
        setTimeout(() => {
            this.checkLoginStatusSilently();
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
            // User Info Elements
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
        // Toggle dropdown menu
        if (this.elements.userMenuBtn) {
            this.elements.userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.elements.dropdownMenu.classList.toggle('show');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (this.elements.dropdownMenu) {
                this.elements.dropdownMenu.classList.remove('show');
            }
        });

        // Logout functionality
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // Check URL parameters với xử lý captcha verification
    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const token = urlParams.get('token');
        const verified = urlParams.get('verified');
        
        console.log('=== Checking URL Parameters ===');
        console.log('Success param:', success);
        console.log('Token param:', token ? 'Present' : 'Not found');
        console.log('Verified param:', verified);
        
        // Check for login success with token
        if (success === 'true' && token) {
            console.log('✅ Login success detected in URL, saving token');
            localStorage.setItem('sessionToken', decodeURIComponent(token));
            
            // Clear URL parameters
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            this.shouldRecheckLogin = true;
            return;
        }
        
        // Check for verified parameter (từ captcha - không phải login)
        if (verified === 'true') {
            console.log('⚠️ Captcha verified parameter found but no login token');
            console.log('This is captcha verification, not login verification');
            
            // Clear the verified parameter
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            // Không cần show login prompt vì đây là captcha verification
        }
    }

    // Load giao diện bình thường để bot thấy
    async loadInterface() {
        try {
            // Hiện IP giả để bot thấy
            this.elements.ipDisplay.textContent = 'Đang tải...';
            
            // Giả lập load IP
            setTimeout(() => {
                this.elements.ipDisplay.textContent = '103.90.227.117'; // IP giả
            }, 1000);

            // Luôn hiện initial view
            this.showInitialView();
        } catch (error) {
            console.error('Error loading interface:', error);
            this.elements.ipDisplay.textContent = 'Lỗi kết nối';
            this.showInitialView();
        }
    }

    // Kiểm tra login với better error handling
    async checkLoginStatusSilently() {
        console.log('=== Checking Login Status ===');
        
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            console.log('SessionToken found:', sessionToken ? 'YES' : 'NO');
            
            if (!sessionToken) {
                console.log('❌ No session token - user not logged in');
                this.isLoggedIn = false;
                this.loginChecked = true;
                this.updateUserInterface();
                return;
            }

            console.log('Token preview:', sessionToken.substring(0, 50) + '...');
            console.log('Making verify request to:', `${this.LOGIN_API}?action=verify`);
            
            const response = await fetch(`${this.LOGIN_API}?action=verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Verify response status:', response.status);
            console.log('Verify response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('Verify response data:', data);
                
                if (data.valid && data.user) {
                    console.log('✅ User logged in successfully:', data.user.username || data.user.globalName);
                    this.isLoggedIn = true;
                    this.userData = data.user;
                    this.updateUserInterface();
                    this.loadRealData();
                } else {
                    console.log('❌ Invalid token or user data');
                    console.log('Data.valid:', data.valid);
                    console.log('Data.user:', data.user);
                    this.handleInvalidLogin();
                }
            } else {
                console.log('❌ Verify request failed with status:', response.status);
                
                try {
                    const errorData = await response.json();
                    console.log('Error response data:', errorData);
                } catch (e) {
                    const errorText = await response.text();
                    console.log('Error response text:', errorText);
                }
                
                this.handleInvalidLogin();
            }
        } catch (error) {
            console.error('❌ Error checking login status:', error);
            console.error('Error details:', error.message);
            this.handleInvalidLogin();
        }
        
        this.loginChecked = true;
        console.log('=== Login Check Complete ===');
        console.log('Final login status:', this.isLoggedIn);
    }

    // Handle invalid login
    handleInvalidLogin() {
        console.log('🧹 Handling invalid login - clearing data');
        this.isLoggedIn = false;
        this.userData = null;
        localStorage.removeItem('sessionToken');
        this.updateUserInterface();
    }

    // Cập nhật giao diện với debug
    updateUserInterface() {
        console.log('=== Updating User Interface ===');
        console.log('isLoggedIn:', this.isLoggedIn);
        console.log('userData:', this.userData);
        
        if (this.isLoggedIn && this.userData) {
            console.log('Showing user info interface');
            // Hiện user info, ẩn login prompt
            if (this.elements.loginPrompt) {
                this.elements.loginPrompt.style.display = 'none';
                console.log('Hidden login prompt');
            }
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = 'flex';
                console.log('Shown user info');
            }
            
            // Cập nhật thông tin user
            if (this.elements.userName) {
                const displayName = this.userData.globalName || this.userData.username;
                this.elements.userName.textContent = displayName;
                console.log('Updated username to:', displayName);
            }
            
            // Cập nhật avatar
            if (this.elements.userAvatar) {
                if (this.userData.avatar) {
                    const avatarUrl = `https://cdn.discordapp.com/avatars/${this.userData.id}/${this.userData.avatar}.png?size=128`;
                    this.elements.userAvatar.src = avatarUrl;
                    console.log('Updated avatar to:', avatarUrl);
                } else {
                    const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${(this.userData.discriminator || 0) % 5}.png`;
                    this.elements.userAvatar.src = defaultAvatar;
                    console.log('Using default avatar:', defaultAvatar);
                }
            }
        } else {
            console.log('Showing login prompt interface');
            // Hiện login prompt, ẩn user info
            if (this.elements.loginPrompt) {
                this.elements.loginPrompt.style.display = 'block';
                console.log('Shown login prompt');
            }
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = 'none';
                console.log('Hidden user info');
            }
        }
        console.log('=== Interface Update Complete ===');
    }

    // Load dữ liệu thật cho user đã đăng nhập
    async loadRealData() {
        console.log('=== Loading Real Data ===');
        
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            console.log('Making data request to:', this.API_BASE);
            
            const response = await fetch(this.API_BASE, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            console.log('Data response status:', response.status);
            
            if (!response.ok) {
                console.log('Data request failed');
                return;
            }

            const data = await response.json();
            console.log('Data response:', data);
            
            // Update IP thật
            if (data.ip) {
                this.userIP = data.ip;
                this.elements.ipDisplay.textContent = this.userIP;
                console.log('Updated real IP:', this.userIP);
            }

            // Load token nếu có
            if (data.has_existing_token && data.token) {
                console.log('Found existing token');
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
            } else {
                console.log('No existing token found');
            }
        } catch (error) {
            console.error('Error loading real data:', error);
        }
        
        console.log('=== Real Data Load Complete ===');
    }

    // Show login required alert
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
            console.log('Login required - blocked request');
        });
    }

    // Đăng xuất
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
            
            // Reset states
            this.isLoggedIn = false;
            this.userData = null;
            this.currentToken = null;
            
            // Update UI
            this.updateUserInterface();
            this.showInitialView();
            
            // Show success message
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
        // Đợi check login xong
        if (!this.loginChecked) {
            console.log('⏳ Waiting for login check to complete...');
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.loginChecked) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 10000);
            });
        }

        console.log('🎯 Create token - Login status:', this.isLoggedIn);

        // Chặn nếu chưa đăng nhập
        if (!this.isLoggedIn) {
            console.log('❌ User not logged in - blocking request');
            await this.showLoginRequiredAlert();
            return;
        }

        // Prevent spam clicking
        if (this.isCreatingToken) {
            console.log('⚠️ Already creating token - preventing spam');
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
            console.log('🚀 Making create token request...');
            
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

            console.log('📨 Create token response status:', response.status);
            const data = await response.json();
            console.log('📨 Create token response data:', data);

            if (response.status === 201 && data.success) {
                console.log('✅ Token created successfully');
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
            console.error('❌ Error creating token:', error);
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
        // Đợi check login xong
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

        // Chặn nếu chưa đăng nhập
        if (!this.isLoggedIn) {
            await this.showLoginRequiredAlert();
            return;
        }

        // Prevent spam clicking
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