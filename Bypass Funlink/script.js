class TokenManager {
    constructor() {
        this.userIP = null;
        this.currentToken = null;
        this.timerInterval = null;
        this.API_BASE = '/api/bypass_funlink';
        
        this.initializeElements();
        this.loadUserIP();
        this.setupEventListeners();
        this.initScrollEffects();
    }

    initializeElements() {
        this.elements = {
            ipDisplay: document.getElementById('ipDisplay'),
            initialView: document.getElementById('initialView'),
            tokenView: document.getElementById('tokenView'),
            loadingView: document.getElementById('loadingView'),
            createTokenBtn: document.getElementById('createTokenBtn'),
            newTokenBtn: document.getElementById('newTokenBtn'),
            tokenDisplay: document.getElementById('tokenDisplay'),
            timerDisplay: document.getElementById('timerDisplay'),
            copyTokenBtn: document.getElementById('copyTokenBtn')
        };
    }

    async loadUserIP() {
        try {
            const response = await fetch(this.API_BASE);
            const data = await response.json();
            this.userIP = data.ip;
            this.elements.ipDisplay.textContent = this.userIP;
            
            // Animate IP display
            this.elements.ipDisplay.style.opacity = '0';
            setTimeout(() => {
                this.elements.ipDisplay.style.transition = 'opacity 0.5s ease';
                this.elements.ipDisplay.style.opacity = '1';
            }, 500);
            
        } catch (error) {
            console.error('Error loading IP:', error);
            this.elements.ipDisplay.textContent = 'Không thể lấy IP';
        }
    }

    setupEventListeners() {
        this.elements.createTokenBtn.addEventListener('click', () => {
            this.createToken();
        });

        this.elements.newTokenBtn.addEventListener('click', () => {
            this.showInitialView();
        });

        this.elements.copyTokenBtn.addEventListener('click', () => {
            this.copyToken();
        });

        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    initScrollEffects() {
        // Parallax effect for background
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const bg = document.querySelector('.background-animation');
            if (bg) {
                bg.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });

        // Header background on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(10, 10, 10, 0.98)';
            } else {
                header.style.background = 'rgba(10, 10, 10, 0.95)';
            }
        });
    }

    showView(viewName) {
        // Add fade out effect
        Object.values(this.elements).forEach(el => {
            if (el && el.classList && el.classList.contains('view')) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    el.classList.add('hidden');
                }, 300);
            }
        });
        
        // Show new view with fade in effect
        setTimeout(() => {
            if (this.elements[viewName]) {
                this.elements[viewName].classList.remove('hidden');
                setTimeout(() => {
                    this.elements[viewName].style.transition = 'all 0.5s ease';
                    this.elements[viewName].style.opacity = '1';
                    this.elements[viewName].style.transform = 'translateY(0)';
                }, 50);
            }
        }, 300);
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create_token'
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentToken = data.token;
                this.elements.tokenDisplay.value = data.token;
                
                // Start timer
                this.startTimer(data.time_left_ms);
                
                // Show notification
                if (data.is_existing) {
                    this.showNotification('Token hiện tại vẫn còn hiệu lực!', 'info');
                } else {
                    this.showNotification('Token đã được tạo thành công!', 'success');
                }

                setTimeout(() => {
                    this.showTokenView();
                }, 1000);
                
            } else {
                throw new Error(data.error || 'Không thể tạo token');
            }
        } catch (error) {
            console.error('Error creating token:', error);
            this.showNotification('Lỗi: ' + error.message, 'error');
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
                setTimeout(() => {
                    this.showInitialView();
                }, 2000);
                return;
            }

            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;

            this.elements.timerDisplay.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Add pulsing effect when time is low
            if (timeLeft <= 300) { // 5 minutes
                this.elements.timerDisplay.style.animation = 'pulse 1s ease-in-out infinite';
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
    }

    async copyToken() {
        try {
            await navigator.clipboard.writeText(this.currentToken);
            this.showNotification('Token đã được copy!', 'success');
            
            // Button animation
            const originalIcon = this.elements.copyTokenBtn.innerHTML;
            this.elements.copyTokenBtn.innerHTML = '<i class="fas fa-check"></i>';
            this.elements.copyTokenBtn.style.background = 'rgba(0, 255, 136, 0.5)';
            this.elements.copyTokenBtn.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                this.elements.copyTokenBtn.innerHTML = originalIcon;
                this.elements.copyTokenBtn.style.background = '';
                this.elements.copyTokenBtn.style.transform = '';
            }, 2000);
            
        } catch (error) {
            console.error('Error copying token:', error);
            
            // Fallback: select text
            this.elements.tokenDisplay.select();
            document.execCommand('copy');
            this.showNotification('Token đã được copy!', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 350px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        const colors = {
            success: 'linear-gradient(135deg, #00ff88, #00cc66)',
            error: 'linear-gradient(135deg, #ff4757, #c44569)',
            warning: 'linear-gradient(135deg, #ffa502, #ff6348)',
            info: 'linear-gradient(135deg, #3742fa, #2f3542)'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Additional CSS animations
const additionalCSS = `
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.notification-content i {
    font-size: 1.2rem;
}
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TokenManager();
});

// Add loading screen
window.addEventListener('load', () => {
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--dark-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
    `;
    
    loader.innerHTML = `
        <div style="text-align: center;">
            <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
            <div style="color: white; font-size: 1.2rem;">Đang tải...</div>
        </div>
    `;
    
    document.body.appendChild(loader);
    
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.remove();
        }, 500);
    }, 1500);
});