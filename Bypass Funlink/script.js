class TokenManager {
    constructor() {
        this.userIP = null;
        this.currentToken = null;
        this.timerInterval = null;
        this.API_BASE = '/api/bypass_funlink';
        
        this.initializeElements();
        this.checkExistingTokenOnLoad();
        this.setupEventListeners();
    }

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
    
    async checkExistingTokenOnLoad() {
        try {
            const response = await fetch(this.API_BASE);
            if (!response.ok) {
                throw new Error('Lỗi kết nối đến máy chủ.');
            }
            
            const data = await response.json();
            
            if (data.ip) {
                this.userIP = data.ip;
                this.elements.ipDisplay.textContent = this.userIP;
            } else {
                this.elements.ipDisplay.textContent = 'Không thể lấy IP';
                this.elements.ipDisplay.style.color = '#ff4757';
            }

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

    setupEventListeners() {
        this.elements.createTokenBtn.addEventListener('click', () => {
            this.createToken(); 
        });

        this.elements.copyTokenBtn.addEventListener('click', () => {
            this.copyToken();
        });
    }

    showView(viewName) {
        const views = ['initialView', 'tokenView', 'loadingView'];
        views.forEach(view => this.elements[view]?.classList.add('hidden'));
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
        this.showLoadingView();

        try {
            const response = await fetch(this.API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_token' })
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
            const errorMessage = error.message || 'Lỗi: Không thể tạo token';
            this.showNotification(errorMessage, 'error');
            this.showInitialView();
        }
    }
    
    startTimer(timeLeftMs) {
        this.stopTimer();
        let timeLeft = Math.floor(timeLeftMs / 1000);
        
        const updateTimer = () => {
            if (timeLeft <= 0) {
                this.elements.timerDisplay.textContent = '00:00:00';
                this.showNotification('Token đã hết hạn!', 'warning');
                this.stopTimer();
                setTimeout(() => { this.showInitialView() }, 2000);
                return;
            }

            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;

            this.elements.timerDisplay.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 300) { // 5 minutes
                this.elements.timerDisplay.style.animation = 'pulse 1s ease-in-out infinite';
                this.elements.timerDisplay.style.color = '#ff4757';
            }

            timeLeft--;
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
            this.showNotification('Token đã được copy vào clipboard!', 'success');
            
            const originalIcon = this.elements.copyTokenBtn.innerHTML;
            this.elements.copyTokenBtn.innerHTML = '<i class="fas fa-check"></i>';
            this.elements.copyTokenBtn.style.background = 'rgba(0, 255, 136, 0.5)';
            this.elements.copyTokenBtn.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                this.elements.copyTokenBtn.innerHTML = originalIcon;
                this.elements.copyTokenBtn.style.background = '';
                this.elements.copyTokenBtn.style.transform = '';
            }, 1500);
            
        } catch (error) {
            console.error('Error copying token:', error);
            this.elements.tokenDisplay.select();
            this.elements.tokenDisplay.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
                this.showNotification('Token đã được copy!', 'success');
            } catch (e) {
                this.showNotification('Không thể copy token. Vui lòng copy thủ công.', 'error');
            }
        }
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelectorAll('.notification');
        existing.forEach(notif => notif.remove());
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#00ff88', error: '#ff4757', warning: '#ff8800', info: '#3742fa'
        };
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: ${colors[type] || colors.info};
            color: white; padding: 15px 20px; border-radius: 8px; font-weight: 500;
            z-index: 10000; opacity: 0; transform: translateX(100%); transition: all 0.3s ease;
            max-width: 300px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TokenManager();
});