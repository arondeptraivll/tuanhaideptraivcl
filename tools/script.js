document.addEventListener("DOMContentLoaded", () => {
    const toolsContainer = document.querySelector(".tools-container");
    const toolBoxes = document.querySelectorAll(".tool-box");
    const leftArrow = document.querySelector(".nav-arrow.left");
    const rightArrow = document.querySelector(".nav-arrow.right");
    const indicators = document.querySelectorAll(".indicator");
    let currentIndex = 0;

    // Function to update slide position
    function updateSlide(index) {
        // Tính toán chính xác vị trí của mỗi tool
        const toolWidth = toolBoxes[0].offsetWidth;
        const containerWidth = document.querySelector(".tools-wrapper").offsetWidth;
        const margin = 40; // margin giữa các tool
        
        // Tính translateX để tool hiện tại nằm chính giữa
        const translateX = -index * (containerWidth + margin);
        
        toolsContainer.style.transform = `translateX(${translateX}px)`;
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle("active", i === index);
        });
    }

    // Arrow navigation
    leftArrow.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + toolBoxes.length) % toolBoxes.length;
        updateSlide(currentIndex);
    });

    rightArrow.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % toolBoxes.length;
        updateSlide(currentIndex);
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    toolsContainer.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    toolsContainer.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe left
            currentIndex = (currentIndex + 1) % toolBoxes.length;
            updateSlide(currentIndex);
        }
        if (touchEndX > touchStartX + 50) {
            // Swipe right
            currentIndex = (currentIndex - 1 + toolBoxes.length) % toolBoxes.length;
            updateSlide(currentIndex);
        }
    }

    // Access button functionality with ripple effect
    document.querySelectorAll(".access-btn").forEach(btn => {
        btn.addEventListener("click", function(event) {
            // Button press effect
            this.style.transform = "translateY(-1px) scale(0.95)";
            
            // Get URL from parent tool-box
            const toolUrl = this.closest(".tool-box").dataset.url;
            
            // Navigate after short delay
            setTimeout(() => {
                window.location.href = toolUrl;
            }, 150);

            // Create ripple effect
            const ripple = document.createElement("span");
            const rect = this.getBoundingClientRect();
            const diameter = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - diameter / 2;
            const y = event.clientY - rect.top - diameter / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${diameter}px;
                height: ${diameter}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation CSS
    const style = document.createElement("style");
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

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            currentIndex = (currentIndex - 1 + toolBoxes.length) % toolBoxes.length;
            updateSlide(currentIndex);
        } else if (e.key === "ArrowRight") {
            currentIndex = (currentIndex + 1) % toolBoxes.length;
            updateSlide(currentIndex);
        }
    });

    // Recalculate on window resize
    window.addEventListener("resize", () => {
        updateSlide(currentIndex);
    });

    // Initialize first slide
    updateSlide(currentIndex);
});