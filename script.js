// Hiệu ứng cầu vồng động cho viền avatar
const avatarBorder = document.querySelector('.avatar-border');
let deg = 0;
let rainbowAnimId;
function animateRainbowBorder() {
    deg = (deg + 1) % 360;
    avatarBorder.style.background = `conic-gradient(
        from ${deg}deg,
        #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
    )`;
    rainbowAnimId = requestAnimationFrame(animateRainbowBorder);
}
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(rainbowAnimId);
    } else {
        animateRainbowBorder();
    }
});
animateRainbowBorder();

// Welcome Overlay, Audio & Video
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.querySelector('.enter-btn');
const bgAudio = document.getElementById('bg-audio');
const bgVideo = document.getElementById('bg-video');

// Tạo loading spinner
const loadingSpinner = document.createElement('div');
loadingSpinner.className = 'loading-spinner';
document.body.appendChild(loadingSpinner);
loadingSpinner.style.display = 'none';

enterBtn.addEventListener('click', function() {
    loadingSpinner.style.display = 'block';
    setTimeout(() => {
        welcomeOverlay.classList.add('hidden');
        loadingSpinner.style.display = 'none';
    }, 500);

    // Phát nhạc
    playAudio();
    
    // Phát video nền
    playVideo();
});

function playAudio() {
    bgAudio.currentTime = 0;
    bgAudio.play().catch((e) => {
        // Nếu bị chặn, có thể do trình duyệt
        console.log("Audio play failed:", e);
    });
}

function playVideo() {
    // Hiện video và phát
    bgVideo.style.opacity = '1';
    bgVideo.play().catch((e) => {
        console.log("Video play failed:", e);
    });
}

// Hiệu ứng rainbow border cho tab HAIGPT khi hover
const haigptTab = document.querySelector('.haigpt-tab');
let tabDeg = 0;
let isHovering = false;

haigptTab.addEventListener('mouseenter', () => {
    isHovering = true;
    haigptTab.classList.add('rainbow-border');
    animateTabRainbow();
});

haigptTab.addEventListener('mouseleave', () => {
    isHovering = false;
    haigptTab.classList.remove('rainbow-border');
    haigptTab.style.backgroundImage = '';
    haigptTab.style.border = '2px solid rgba(255, 255, 255, 0.1)';
    tabDeg = 0;
});

function animateTabRainbow() {
    if (!isHovering) return;
    tabDeg = (tabDeg + 2) % 360;
    haigptTab.style.backgroundImage = `
        linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)),
        conic-gradient(
            from ${tabDeg}deg,
            #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
        )
    `;
    requestAnimationFrame(animateTabRainbow);
}
