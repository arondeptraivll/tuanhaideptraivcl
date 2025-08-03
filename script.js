// --- PHẦN HIỆU ỨNG VIỀN CẦU VỒNG CHO AVATAR ---

const avatarBorder = document.querySelector('.avatar-border');
let deg = 0;
let rainbowAnimId;

function animateRainbowBorder() {
    deg = (deg + 1) % 360;
    // Thay đổi góc của conic-gradient để tạo hiệu ứng xoay
    avatarBorder.style.background = `conic-gradient(from ${deg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000)`;
    rainbowAnimId = requestAnimationFrame(animateRainbowBorder);
}

// Tạm dừng animation nếu tab không được hiển thị để tiết kiệm tài nguyên
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(rainbowAnimId);
    } else {
        animateRainbowBorder();
    }
});

// Bắt đầu animation
animateRainbowBorder();


// --- PHẦN XỬ LÝ MÀN HÌNH CHÀO MỪNG VÀ PHÁT MEDIA ---

const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.querySelector('.enter-btn');
const bgAudio = document.getElementById('bg-audio');
const bgVideo = document.getElementById('bg-video');

// Tạo và chuẩn bị spinner
const loadingSpinner = document.createElement('div');
loadingSpinner.className = 'loading-spinner';
document.body.appendChild(loadingSpinner);
loadingSpinner.style.display = 'none'; // Ẩn ban đầu

// Khi người dùng nhấn nút ENTER
enterBtn.addEventListener('click', function() {
    loadingSpinner.style.display = 'block'; // Hiển thị spinner

    // Dùng setTimeout để đảm bảo spinner hiển thị trước khi tác vụ nặng bắt đầu
    setTimeout(() => {
        welcomeOverlay.classList.add('hidden'); // Ẩn màn hình chào
        loadingSpinner.style.display = 'none';   // Ẩn spinner
    }, 500); // 0.5 giây chờ

    playAudio();
    playVideo();
});

function playAudio() {
    bgAudio.currentTime = 0; // Tua lại đầu
    bgAudio.play().catch(error => {
        console.log("Lỗi phát âm thanh:", error);
    });
}

function playVideo() {
    bgVideo.style.opacity = '1'; // Làm video hiện ra
    bgVideo.play().catch(error => {
        console.log("Lỗi phát video:", error);
    });
}


// --- PHẦN HIỆU ỨNG VIỀN CẦU VỒNG CHO CÁC NÚT Ở GÓC (Đã cập nhật) ---

const topButtons = document.querySelectorAll('.top-button');

// Lặp qua mỗi nút tìm được (HAIGPT và TOOLS)
topButtons.forEach(button => {
    let tabDeg = 0;
    let animationFrameId;

    // Hàm animation cho từng nút
    const animateTabRainbow = () => {
        tabDeg = (tabDeg + 2) % 360;
        button.style.backgroundImage = `
            linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)),
            conic-gradient(
                from ${tabDeg}deg,
                #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
            )
        `;
        animationFrameId = requestAnimationFrame(animateTabRainbow);
    };

    // Khi di chuột vào nút
    button.addEventListener('mouseenter', () => {
        button.classList.add('rainbow-border');
        animateTabRainbow();
    });

    // Khi di chuột ra khỏi nút
    button.addEventListener('mouseleave', () => {
        cancelAnimationFrame(animationFrameId); // Dừng animation
        button.classList.remove('rainbow-border');
        // Trả lại style ban đầu
        button.style.backgroundImage = '';
        button.style.border = '2px solid rgba(255, 255, 255, 0.1)';
        tabDeg = 0;
    });
});