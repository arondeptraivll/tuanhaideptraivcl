// =====================================
// TOKEN MANAGER CLASS - VỚI SWEETALERT2
// =====================================

class TokenManager {
    constructor() {
        this.currentToken = null;
        this.timerInterval = null;
        this.userIP = null;
        this.API_BASE = '/api/bypass_funlink';
        this.isDownloadProcessing = false; // Prevent double click
        
        this.initializeElements();
        this.checkExistingTokenOnLoad();
        this.setupEventListeners();
        this.configureSweetAlert();
    }

    // Cấu hình SweetAlert2 theme
    configureSweetAlert() {
        // Custom theme cho SweetAlert2
        const style = document.createElement('style');
        style.textContent = `
            .swal2-popup {
                background: #111 !important;
                border: 2px solid #00ff88 !important;
                border-radius: 15px !important;
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
            }
            .swal2-cancel {
                background: #ff4757 !important;
                border: none !important;
                border-radius: 8px !important;
            }
            .swal2-loader {
                border-color: #00ff88 transparent #00ff88 transparent !important;
            }
        `;
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
                this.showNotification('Đã tải lại token của bạn.', 'info');
            } else {
                this.showInitialView();
            }
            
        } catch (error) {
            console.error('Error during initial load:', error);
            this.elements.ipDisplay.textContent = 'Lỗi kết nối';
            this.elements.ipDisplay.style.color = '#ff4757';
            this.showInitialView();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Nút tạo token
        this.elements.createTokenBtn.addEventListener('click', () => {
            this.createToken();
        });

        // Nút copy token với SweetAlert
        this.elements.copyTokenBtn.addEventListener('click', () => {
            this.copyTokenWithAlert();
        });

        // Nút download với SweetAlert SIÊU ĐẸP
        const downloadBtn = document.querySelector('#downloadTrigger');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Prevent double click
                if (this.isDownloadProcessing) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Vui lòng đợi!',
                        text: 'Đang xử lý yêu cầu trước đó...',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#111',
                        color: '#fff'
                    });
                    return;
                }
                
                await this.createDownloadSessionWithAlert();
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

    // Tạo token với SweetAlert
    async createToken() {
        // Hiện loading popup
        Swal.fire({
            title: 'Đang tạo token...',
            text: 'Vui lòng chờ trong giây lát',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: '#111',
            color: '#fff',
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
                    action: 'create_token'
                })
            });
            
            const data = await response.json();
            
            if (response.status === 201 && data.success) {
                this.currentToken = data.token;
                this.elements.tokenDisplay.value = data.token;
                this.startTimer(data.time_left_ms);
                
                // Success popup với tick xanh
                await Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Token đã được tạo thành công!',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#111',
                    color: '#fff'
                });
                
                this.showTokenView();
                return;
            }
            
            throw new Error(data.error || 'Không thể tạo token');
            
        } catch (error) {
            console.error('Error creating token:', error);
            
            // Error popup với cross đỏ
            await Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: error.message || 'Lỗi kết nối đến máy chủ.',
                background: '#111',
                color: '#fff'
            });
            
            this.showInitialView();
        }
    }

    // TẠO DOWNLOAD SESSION VỚI SWEETALERT SIÊU ĐẸP
    async createDownloadSessionWithAlert() {
        this.isDownloadProcessing = true;
        
        // Hiện loading popup siêu đẹp
        Swal.fire({
            title: '🚀 Đang tạo phiên tải xuống...',
            html: `
                <div style="margin: 20px 0;">
                    <div style="color: #00ff88; font-weight: bold; margin-bottom: 10px;">
                        ⏳ Vui lòng đợi...
                    </div>
                    <div style="color: #ccc; font-size: 0.9em;">
                        Đang kết nối đến hệ thống bảo mật
                    </div>
                </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: '#111',
            color: '#fff',
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
            
            if (response.status === 201 && data.success) {
                // Success popup với animation tick xanh SIÊU ĐẸP
                await Swal.fire({
                    icon: 'success',
                    title: '✅ Phiên tải đã được tạo!',
                    html: `
                        <div style="margin: 20px 0;">
                            <div style="color: #00ff88; font-weight: bold; margin-bottom: 15px;">
                                🎉 Thành công! Đang chuyển hướng...
                            </div>
                            <div style="background: rgba(0,255,136,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #00ff88;">
                                <div style="color: #fff; margin-bottom: 8px;">
                                    ⚠️ <strong>Lưu ý quan trọng:</strong>
                                </div>
                                <div style="color: #ccc; font-size: 0.9em;">
                                    Vui lòng không dùng bypass nếu ko muốn bị chặn!
                                </div>
                            </div>
                        </div>
                    `,
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    background: '#111',
                    color: '#fff',
                    didOpen: () => {
                        // Custom animation
                        const popup = Swal.getPopup();
                        popup.style.animation = 'pulse 0.5s ease-in-out';
                    }
                });
                
                // LINK MỚI
                const link4mUrl = 'https://link4m.com/n902L';
                
                // Mở tab mới
                window.open(link4mUrl, '_blank');
                
                // Thông báo cuối
                setTimeout(() => {
                    Swal.fire({
                        icon: 'info',
                        title: '📋 Hướng dẫn',
                        html: `
                            <div style="text-align: left; color: #ccc;">
                                <p style="margin-bottom: 10px;">✅ Tab mới đã được mở</p>
                                <p style="margin-bottom: 10px;">⏱️ Hoàn thành link rút gọn trong 10 phút</p>
                                <p style="color: #ff8800;"><strong>🚫 Không sử dụng bypass!</strong></p>
                            </div>
                        `,
                        confirmButtonText: 'Đã hiểu',
                        background: '#111',
                        color: '#fff'
                    });
                }, 1000);
                
                this.isDownloadProcessing = false;
                return;
            }
            
            throw new Error(data.error || 'Không thể tạo phiên tải xuống');
            
        } catch (error) {
            console.error('Error creating download session:', error);
            
            // Error popup với cross đỏ
            await Swal.fire({
                icon: 'error',
                title: '❌ Có lỗi xảy ra!',
                html: `
                    <div style="color: #ff4757; margin: 15px 0;">
                        <strong>Chi tiết lỗi:</strong><br>
                        ${error.message}
                    </div>
                    <div style="background: rgba(255,71,87,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ff4757;">
                        <div style="color: #ccc; font-size: 0.9em;">
                            Vui lòng thử lại sau hoặc liên hệ hỗ trợ
                        </div>
                    </div>
                `,
                confirmButtonText: 'Thử lại',
                background: '#111',
                color: '#fff'
            });
            
            this.isDownloadProcessing = false;
        }
    }

    // Copy token với SweetAlert
    async copyTokenWithAlert() {
        try {
            await navigator.clipboard.writeText(this.currentToken);
            
            // Success animation
            const originalContent = this.elements.copyTokenBtn.innerHTML;
            this.elements.copyTokenBtn.innerHTML = '<i class="fas fa-check"></i>';
            this.elements.copyTokenBtn.style.background = 'rgba(0, 255, 136, 0.5)';
            this.elements.copyTokenBtn.style.transform = 'scale(1.1)';
            
            // SweetAlert toast notification
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Token đã được copy!',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: '#111',
                color: '#fff'
            });
            
            setTimeout(() => {
                this.elements.copyTokenBtn.innerHTML = originalContent;
                this.elements.copyTokenBtn.style.background = '';
                this.elements.copyTokenBtn.style.transform = '';
            }, 1500);
            
        } catch (error) {
            console.error('Error copying token:', error);
            
            // Fallback method
            this.elements.tokenDisplay.select();
            this.elements.tokenDisplay.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Token đã được copy!',
                    showConfirmButton: false,
                    timer: 2000,
                    background: '#111',
                    color: '#fff'
                });
            } catch (fallbackError) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Không thể copy token',
                    text: 'Vui lòng copy thủ công',
                    showConfirmButton: false,
                    timer: 3000,
                    background: '#111',
                    color: '#fff'
                });
            }
        }
    }

    // Các method khác giữ nguyên...
    startTimer(timeLeftMs) {
        this.stopTimer();
        
        let secondsLeft = Math.floor(timeLeftMs / 1000);
        
        const updateTimer = () => {
            if (secondsLeft <= 0) {
                this.elements.timerDisplay.textContent = '00:00:00';
                
                // Token expired alert
                Swal.fire({
                    icon: 'warning',
                    title: '⏰ Token đã hết hạn!',
                    text: 'Vui lòng tạo token mới để tiếp tục sử dụng.',
                    confirmButtonText: 'Tạo mới',
                    background: '#111',
                    color: '#fff'
                }).then(() => {
                    this.showInitialView();
                });
                
                this.stopTimer();
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

    // Fallback notification (backup)
    showNotification(message, type = 'info') {
        const colors = {
            'success': 'success',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: colors[type] || 'info',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#111',
            color: '#fff'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TokenManager();
    
    console.log('🚀 Token Manager với SweetAlert2 đã khởi động!');
    console.log('🔒 Hệ thống chống bypass đã được kích hoạt!');
});