document.addEventListener('DOMContentLoaded', function() {
    const accessButton = document.getElementById('access-button');
    const card = document.querySelector('.card');
    const toolBox = document.querySelector('.tool-box');

    // Button click event
    if (accessButton) {
        accessButton.addEventListener('click', function() {
            // Thêm hiệu ứng click
            this.style.transform = 'translateY(-1px) scale(0.95)';
            
            setTimeout(() => {
                // Chuyển hướng sau hiệu ứng
                window.location.href = 'https://tuanhaideptraivcl.vercel.app/Bypass%20Funlink/index.html';
            }, 150);
        });
    }

    // Bỏ hiệu ứng tilt 3D - chỉ giữ viền cầu vồng xoay

    // Thêm hiệu ứng ripple cho button
    accessButton.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });

    // CSS cho ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .access-btn {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
});