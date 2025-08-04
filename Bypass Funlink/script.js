// =====================================
// TOKEN MANAGER CLASS - PHIÊN BẢN MỚI
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

        // Nút copy token
        this.elements.copyTokenBtn.addEventListener('click', () => {
            this.copyToken();
        });

        // Nút download - TÂM ĐIỂM CỦA HỆ THỐNG MỚI
        const downloadBtn = document.querySelector('a[href*="link4m.com"], #downloadTrigger');
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
        
        // Ẩn tất cả views
        views.forEach(view => {
            if (this.elements[view]) {
                this.elements[view].classList.add('hidden');
            }
        });
        
        // Hiện view được chọn
        if (this.elements[viewName]) {
            this.elements[viewName].classList.remove('hidden');
        }
    }

    // Hiển thị giao diện ban đầu
    showInitialView() {
        this.showView('initialView');
        this.stopTimer();
    }

    // Hiển thị giao diện token
    showTokenView() {
        this.showView('tokenView');
    }

    // Hiển thị giao diện loading
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
                this.showNotification('Token đã được tạo thành công!', 'success');
                this.showTokenView();
                return;
            }
            
            throw new Error(data.error || 'Không thể tạo token');
            
        } catch (error) {
            console.error('Error creating token:', error);
            const errorMessage = error.message || 'Lỗi kết nối đến máy chủ.';
            this.showNotification(errorMessage, 'error');
            this.showInitialView();
        }
    }

    // TẠO DOWNLOAD SESSION - TÍNH NĂNG MỚI CHỐNG VPN
    async createDownloadSession() {
        try {
            // Tạo download session với IP hiện tại
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
                this.showNotification(
                    'Đã tạo phiên tải xuống! Bạn có 10 phút để hoàn thành link4m với IP hiện tại.', 
                    'success'
                );
                
                // Redirect đến link4m với URL download cố định
                const downloadPageUrl = 'https://tuanhaideptraivcl.vercel.app/download.html';
                const link4mUrl = `https://link4m.com/VNW3kb`;
                
                // Mở tab mới với link4m
                window.open(link4mUrl, '_blank');
                
                // Hiện thông báo hướng dẫn
                setTimeout(() => {
                    this.showNotification(
                        'Sau khi hoàn thành link4m, bạn sẽ được chuyển đến trang tải. KHÔNG được thay đổi IP!', 
                        'warning'
                    );
                }, 2000);
                
                return;
            }
            
            throw new Error(data.error || 'Không thể tạo phiên tải xuống');
            
        } catch (error) {
            console.error('Error creating download session:', error);
            this.showNotification(error.message, 'error');
        }
    }

    // Bắt đầu timer đếm ngược
    startTimer(timeLeftMs) {
        this.stopTimer();
        
        let secondsLeft = Math.floor(timeLeftMs / 1000);
        
        const updateTimer = () => {
            if (secondsLeft <= 0) {
                this.elements.timerDisplay.textContent = '00:00:00';
                this.showNotification('Token đã hết hạn!', 'warning');
                this.stopTimer();
                setTimeout(() => {
                    this.showInitialView();
                }, 2000);
                return;
            }
            
            const hours = Math.floor(secondsLeft / 3600);
            const minutes = Math.floor((secondsLeft % 3600) / 60);
            const seconds = secondsLeft % 60;
            
            this.elements.timerDisplay.textContent = 
                hours.toString().padStart(2, '0') + ':' +
                minutes.toString().padStart(2, '0') + ':' +
                seconds.toString().padStart(2, '0');
            
            // Cảnh báo khi còn 5 phút
            if (secondsLeft <= 300) {
                this.elements.timerDisplay.style.animation = 'pulse 1s ease-in-out infinite';
                this.elements.timerDisplay.style.color = '#ff4757';
            }
            
            secondsLeft--;
        };
        
        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    // Dừng timer
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

    // Copy token vào clipboard
    async copyToken() {
        try {
            // Sử dụng Clipboard API mới
            await navigator.clipboard.writeText(this.currentToken);
            this.showNotification('Token đã được copy vào clipboard!', 'success');
            
            // Hiệu ứng visual cho nút copy
            const originalContent = this.elements.copyTokenBtn.innerHTML;
            this.elements.copyTokenBtn.innerHTML = '<i class="fas fa-check"></i>';
            this.elements.copyTokenBtn.style.background = 'rgba(0, 255, 136, 0.5)';
            this.elements.copyTokenBtn.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                this.elements.copyTokenBtn.innerHTML = originalContent;
                this.elements.copyTokenBtn.style.background = '';
                this.elements.copyTokenBtn.style.transform = '';
            }, 1500);
            
        } catch (error) {
            console.error('Error copying token:', error);
            
            // Fallback: select và copy bằng execCommand
            this.elements.tokenDisplay.select();
            this.elements.tokenDisplay.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                this.showNotification('Token đã được copy!', 'success');
            } catch (fallbackError) {
                this.showNotification('Không thể copy token. Vui lòng copy thủ công.', 'error');
            }
        }
    }

    // Hiển thị thông báo
    showNotification(message, type = 'info') {
        // Xóa thông báo cũ
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Tạo thông báo mới
        const notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.textContent = message;
        
        // Màu sắc theo loại thông báo
        const colors = {
            'success': '#00ff88',
            'error': '#ff4757',
            'warning': '#ff8800',
            'info': '#3742fa'
        };
        
        // Style cho thông báo
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Animation xuất hiện
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animation biến mất và xóa
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// =====================================
// KHỞI TẠO KHI TRANG LOAD
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    // Tạo instance TokenManager khi DOM sẵn sàng
    new TokenManager();
    
    console.log('🚀 Token Manager initialized successfully!');
    console.log('🔒 Anti-VPN Download System activated!');
});

// =====================================
// THÊM CÁC SECURITY FUNCTIONS (OPTIONAL)
// =====================================

// Chống inspect element (tùy chọn)
document.addEventListener('keydown', (e) => {
    // Chặn F12, Ctrl+Shift+I, Ctrl+U
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        return false;
    }
});

// Chống right-click (tùy chọn)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Log để debug
console.log('🛡️ Security measures activated');