// Hiệu ứng cầu vồng động cho viền avatar
const avatarBorder = document.querySelector('.avatar-border');
let deg = 0;

function animateRainbowBorder() {
    deg = (deg + 1) % 360;
    avatarBorder.style.background = `conic-gradient(
        from ${deg}deg,
        #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000
    )`;
    requestAnimationFrame(animateRainbowBorder);
}
animateRainbowBorder();

// YouTube Video Control
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.querySelector('.enter-btn');
const bgVideo = document.getElementById('bg-video');

// Tạo loading spinner
const loadingSpinner = document.createElement('div');
loadingSpinner.className = 'loading-spinner';
document.body.appendChild(loadingSpinner);

enterBtn.addEventListener('click', function() {
    // Hiện loading spinner
    loadingSpinner.style.display = 'block';
    
    // Ẩn overlay sau 0.5s
    setTimeout(() => {
        welcomeOverlay.classList.add('hidden');
        loadingSpinner.style.display = 'none';
    }, 500);
    
    // Bật video YouTube với âm thanh
    startYouTubeVideo();
});

function startYouTubeVideo() {
    // Video với âm thanh (mute=0)
    const videoSrc = "https://www.youtube.com/embed/Xk8aDlC2nIM?autoplay=1&mute=0&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&playlist=Xk8aDlC2nIM&enablejsapi=1&start=0&disablekb=1&fs=0&cc_load_policy=0";
    
    bgVideo.src = videoSrc;
    bgVideo.classList.add('playing');
    
    console.log("YouTube video với âm thanh bắt đầu phát!");
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