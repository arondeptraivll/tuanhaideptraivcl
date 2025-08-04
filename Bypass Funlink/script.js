// =====================================
// TOKEN MANAGER CLASS - CẬP NHẬT SWEETALERT2
// =====================================

class TokenManager {
    constructor() {
        this.currentToken = null;
        this.timerInterval = null;
        this.userIP = null;
        this.API_BASE = '/api/bypass_funlink';
        
        this.initializeElements();
        this.checkExistingTokenOnLoad();
        this.setupEventListeners();
        this.setupSweetAlert();
    }

    // Setup SweetAlert2 default config
    setupSweetAlert() {
        // Custom SweetAlert2 theme
        const customCSS = `
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
        
        const style = document.createElement('style');
        style.textContent = customCSS;
        document.head.appendChild(style);
    }

    // Khởi tạo các elements DOM
    initializeElements() {
        this.elements = {
            ipDisplay: document.getElementById('ipDisplay'),
            initialView: document.getElementById('initialView'),
            tokenView: document.getElementById('tokenView'),
            loadingView: document.getElementById('loadingView'),
            createTokenBtn: document.getElementById('createTokenBtn'),
            tokenDisplay: document.getElementById('tokenDisplay'),
            timerDisplay: document.getElementById('timerDisplay'),
            copyTokenBtn: document.getElementById('copyTokenBtn')
        };
    }

    // Kiểm tra token có sẵn khi load trang
    async checkExistingTokenOnLoad() {
        try {
            const response = await fetch(this.API_BASE);
            
            if (!response.ok) {
                throw new Error('Lỗi kết nối');
            }
            
            const data = await response.json();
            
            // Hiển thị IP
            if (data.ip) {
                this.userIP = data.ip;
                this.elements.ipDisplay.textContent = this.userIP;
            } else {
                this.elements.ipDisplay.textContent = 'Không thể lấy IP';
                this.elements.ipDisplay.style.color = '#ff4757';
            }
            
            // Kiểm tra token có sẵn
            if (data.has_existing_token && data.token) {
                this.currentToken = data.token;
                this.elements.tokenDisplay.value = data.token;
                this.startTimer(data.time_left_ms);
                this.showTokenView();
                
                Swal.fire({
                    icon: 'info',
                    title: 'Token đã tồn tại',
                    text: 'Đã tải lại token hiện tại của bạn.',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            } else {
                this.showInitialView();
            }
            
        } catch (error) {
            console.error('Error during initial load:', error);
            this.elements.ipDisplay.textContent = 'Lỗi kết nối';
            this.elements.ipDisplay.style.color = '#ff4757';
            this.showInitialView();
            
            Swal.fire({
                icon: 'error',
                title: 'Lỗi kết nối',
                text: 'Không thể kết nối đến máy chủ.',
                confirmButtonText: 'Thử lại'
            });
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Nút tạo token
        this.elements.createTokenBtn.addEventListener('click', () => {
            this.createToken();
        });

        // Nút copy token
        this.elements.copyTokenBtn.addEventListener('click', () => {
            this.copyToken();
        });

        // Nút download
        const downloadBtn = document.querySelector('#downloadTrigger');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.createDownloadSession();
            });
        }
    }

    // Hiển thị view cụ thể
    showView(viewName) {
        const views = ['initialView', 'tokenView', 'loadingView'];
        
        views.forEach(view => {
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

    // Tạo token mới
    async createToken() {
        this.showLoadingView();
        
        try {
            const response = await fetch(this.API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create_token'
                })
            });
            
            const data = await response.json();
            
            if (response.status === 201 && data.success) {
                this.currentToken = data.token;
                this.elements.tokenDisplay.value = data.token;
                this.startTimer(data.time_left_ms);
                this.showTokenView();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Token đã được tạo!',
                    text: 'Token của bạn đã được tạo thành công và có thời hạn 3 tiếng.',
                    confirmButtonText: 'Tuyệt vời!',
                    timer: 5000,
                    timerProgressBar: true
                });
                return;
            }
            
            throw new Error(data.error || 'Không thể tạo token');
            
        } catch (error) {
            console.error('Error creating token:', error);
            const errorMessage = error.message || 'Lỗi kết nối đến máy chủ.';
            this.showInitialView();
            
            Swal.fire({
                icon: 'error',
                title: 'Lỗi tạo token',
                text: errorMessage,
                confirmButtonText: 'Thử lại'
            });
        }
    }

    // TẠO DOWNLOAD SESSION - CẬP NHẬT LOGIC MỚI
    async createDownloadSession() {
        // Hiện loading trước
        const loadingSwal = Swal.fire({
            title: 'Đang tạo session...',
            text: 'Vui lòng chờ trong giây lát',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch(this.API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create_download_session'
                })
            });
            
            const data = await response.json();
            
            // Đóng loading
            loadingSwal.close();
            
            if (response.status === 201 && data.success) {
                // Hiện thông báo thành công và chuyển hướng
                await Swal.fire({
                    icon: 'success',
                    title: 'Session đã được tạo!',
                    text: 'Đang chuyển hướng đến link tải...',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                
                // LINK MỚI
                const link4mUrl = 'https://link4m.com/n902L';
                
                // Mở tab mới với link4m
                window.open(link4mUrl, '_blank');
                
                // Hiện thông báo cảnh báo
                setTimeout(() => {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Lưu ý quan trọng!',
                        text: 'Vui lòng không dùng bypass nếu ko muốn bị chặn!',
                        confirmButtonText: 'Đã hiểu',
                        timer: 5000,
                        timerProgressBar: true
                    });
                }, 2500);
                
                return;
            }
            
            // Nếu đã có session (409 conflict)
            if (response.status === 409 || data.error?.includes('đã có session')) {
                const result = await Swal.fire({
                    icon: 'info',
                    title: 'Bạn đã có session!',
                    text: 'Bạn đã có session tải xuống. Bạn muốn xóa session cũ và tạo mới?',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Xóa & Tạo mới',
                    denyButtonText: 'Hủy',
                    cancelButtonText: 'Giữ session cũ',
                    confirmButtonColor: '#00ff88',
                    denyButtonColor: '#ff8800',
                    cancelButtonColor: '#ff4757'
                });

                if (result.isConfirmed) {
                    // Xóa session cũ và tạo mới
                    await this.deleteAndCreateSession();
                } else if (result.isDenied || result.isDismissed) {
                    // Hủy - không làm gì
                    Swal.fire({
                        icon: 'info',
                        title: 'Đã hủy',
                        text: 'Giữ nguyên session hiện tại.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
                return;
            }
            
            throw new Error(data.error || 'Không thể tạo phiên tải xuống');
            
        } catch (error) {
            console.error('Error creating download session:', error);
            loadingSwal.close();
            
            Swal.fire({
                icon: 'error',
                title: 'Lỗi tạo session',
                text: error.message,
                confirmButtonText: 'Thử lại'
            });
        }
    }

    // Xóa session cũ và tạo mới
    async deleteAndCreateSession() {
        const loadingSwal = Swal.fire({
            title: 'Đang xóa session cũ...',
            text: 'Vui lòng chờ trong giây lát',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Gọi API xóa session (cần thêm endpoint này vào backend)
            const deleteResponse = await fetch(this.API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete_session'
                })
            });

            if (deleteResponse.ok) {
                loadingSwal.close();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa session cũ!',
                    text: 'Đang tạo session mới...',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Tạo session mới sau 1.5s
                setTimeout(() => {
                    this.createDownloadSession();
                }, 1500);
            } else {
                throw new Error('Không thể xóa session cũ');
            }

        } catch (error) {
            loadingSwal.close();
            
            Swal.fire({
                icon: 'error',
                title: 'Lỗi xóa session',
                text: 'Không thể xóa session cũ. Vui lòng thử lại sau.',
                confirmButtonText: 'OK'
            });
        }
    }

    // Các method khác giữ nguyên nhưng thay đổi thông báo
    startTimer(timeLeftMs) {
        this.stopTimer();
        
        let secondsLeft = Math.floor(timeLeftMs / 1000);
        
        const updateTimer = () => {
            if (secondsLeft <= 0) {
                this.elements.timerDisplay.textContent = '00:00:00';
                this.stopTimer();
                
                Swal.fire({
                    icon: 'warning',
                    title: 'Token đã hết hạn!',
                    text: 'Token của bạn đã hết hạn. Vui lòng tạo token mới.',
                    confirmButtonText: 'Tạo token mới'
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
            
            this.elements.timerDisplay.textContent = 
                hours.toString().padStart(2, '0') + ':' +
                minutes.toString().padStart(2, '0') + ':' +
                seconds.toString().padStart(2, '0');
            
            if (secondsLeft <= 300) {
                this.elements.timerDisplay.style.animation = 'pulse 1s ease-in-out infinite';
                this.elements.timerDisplay.style.color = '#ff4757';
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

            // Toast notification thay vì popup
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            Toast.fire({
                icon: 'success',
                title: 'Token đã được copy!'
            });
            
        } catch (error) {
            console.error('Error copying token:', error);
            
            this.elements.tokenDisplay.select();
            this.elements.tokenDisplay.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

                Toast.fire({
                    icon: 'success',
                    title: 'Token đã được copy!'
                });
            } catch (fallbackError) {
                Swal.fire({
                    icon: 'error',
                    title: 'Không thể copy',
                    text: 'Không thể copy token. Vui lòng copy thủ công.',
                    confirmButtonText: 'OK'
                });
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TokenManager();
});