document.addEventListener("DOMContentLoaded", async () => {
    // Element references
    const backBtn = document.getElementById("backBtn");
    const galleryItems = document.querySelectorAll(".gallery-item");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const closeBtn = document.getElementById("closeBtn");

    // User widget elements
    const loginButton = document.getElementById("loginButton");
    const userInfo = document.getElementById("userInfo");
    const userAvatar = document.getElementById("userAvatar");
    const usernameDisplay = document.getElementById("usernameDisplay");

    // Token management elements
    const createTokenSection = document.getElementById("createTokenSection");
    const createTokenBtn = document.getElementById("createTokenBtn");
    const tokenDisplay = document.getElementById("tokenDisplay");
    const tokenValue = document.getElementById("tokenValue");
    const copyTokenBtn = document.getElementById("copyTokenBtn");
    const timeRemaining = document.getElementById("timeRemaining");

    // Download elements
    const downloadBtn = document.getElementById("downloadBtn");

    // State variables
    let currentToken = null;
    let tokenExpiry = null;
    let countdownInterval = null;
    let isLoggedIn = false;

    const BASE_URL = 'https://tuanhaideptraivcl.vercel.app';

    // ===== EVENT LISTENERS =====

    // Navigation
    backBtn.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/`;
    });

    // Gallery
    galleryItems.forEach(img => {
        img.addEventListener("click", () => {
            lightboxImg.src = img.src;
            lightbox.style.display = "flex";
        });
    });

    closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none";
    });

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    });

    // User auth
    loginButton.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/login`;
    });

    userInfo.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/`;
    });

    // ===== TOKEN MANAGEMENT =====

    createTokenBtn.addEventListener("click", async () => {
        if (!isLoggedIn) {
            Swal.fire({
                icon: 'error',
                title: 'Khó nha bro!',
                text: 'bro chưa đăng nhập thì sao mà tạo token được',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ff6b6b',
                background: '#111',
                color: '#fff'
            });
            return;
        }

        await createNewToken();
    });

    copyTokenBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(currentToken);
            
            const originalText = copyTokenBtn.textContent;
            copyTokenBtn.textContent = '✅ Đã copy!';
            copyTokenBtn.style.background = '#006600';
            
            setTimeout(() => {
                copyTokenBtn.textContent = originalText;
                copyTokenBtn.style.background = '#333';
            }, 2000);

        } catch (error) {
            console.error('Lỗi copy:', error);
            alert('Không thể copy token. Vui lòng copy thủ công.');
        }
    });

    // ===== DOWNLOAD MANAGEMENT =====

    downloadBtn.addEventListener("click", () => {
        if (!isLoggedIn) {
            Swal.fire({
                icon: 'error',
                title: 'Khó nha bro!',
                text: 'Bro chưa đăng nhập thì sao mà tải xuống được!',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ff6b6b',
                background: '#111',
                color: '#fff'
            });
            return;
        }

        // Chuyển hướng tới trang tải demo
        window.location.href = "https://example.com";
    });

    // ===== FUNCTIONS =====

    async function createNewToken() {
        try {
            createTokenBtn.disabled = true;
            createTokenBtn.textContent = '🔄 Đang tạo...';

            const response = await fetch(`${BASE_URL}/api/ddos?action=create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                currentToken = data.token;
                tokenExpiry = new Date(data.expires_at);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Tạo token thành công!',
                    text: 'Token API đã được tạo và sẵn sàng sử dụng',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#00aa00',
                    background: '#111',
                    color: '#fff'
                });

                hideCreateTokenButton();
                showTokenDisplay();
                startCountdown();
                
            } else {
                if (response.status === 429) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Không thể tạo token!',
                        text: data.message,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#ffaa00',
                        background: '#111',
                        color: '#fff'
                    });
                    
                    if (data.existing_token) {
                        showExistingToken(data.existing_token);
                    }
                } else {
                    throw new Error(data.message || 'Tạo token thất bại');
                }
            }

        } catch (error) {
            console.error('🚨 Lỗi tạo token:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: `Không thể tạo token: ${error.message}`,
                confirmButtonText: 'OK',
                confirmButtonColor: '#ff6b6b',
                background: '#111',
                color: '#fff'
            });
        } finally {
            createTokenBtn.disabled = false;
            createTokenBtn.textContent = '🚀 Tạo Token';
        }
    }

    async function checkExistingTokenByIP() {
        try {
            const response = await fetch(`${BASE_URL}/api/ddos?action=check`);
            const data = await response.json();
            
            if (data.success && data.has_token) {
                currentToken = data.token;
                tokenExpiry = new Date(data.expires_at);
                
                hideCreateTokenButton();
                showTokenDisplay();
                startCountdown();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Lỗi check token:', error);
            return false;
        }
    }

    function hideCreateTokenButton() {
        createTokenSection.style.display = 'none';
    }

    function showCreateTokenButton() {
        createTokenSection.style.display = 'block';
        tokenDisplay.style.display = 'none';
    }

    function showExistingToken(existingData) {
        tokenExpiry = new Date(existingData.expires_at);
        hideCreateTokenButton();
        
        tokenValue.value = '*** Token đang hoạt động - Đã ẩn vì bảo mật ***';
        tokenDisplay.style.display = 'block';
        startCountdown();
    }

    function showTokenDisplay() {
        tokenValue.value = currentToken;
        tokenDisplay.style.display = 'block';
    }

    function startCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            const now = new Date();
            const diff = tokenExpiry - now;

            if (diff <= 0) {
                clearInterval(countdownInterval);
                showCreateTokenButton();
                
                Swal.fire({
                    icon: 'info',
                    title: 'Token đã hết hạn!',
                    text: 'Bạn có thể tạo token mới ngay bây giờ.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#0088ff',
                    background: '#111',
                    color: '#fff'
                });
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            timeRemaining.textContent = `⏰ ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // ===== INITIALIZATION =====

    try {
        const res = await fetch(`${BASE_URL}/api/auth?action=check_session`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await res.json();

        if (data.has_session && data.user) {
            isLoggedIn = true;
            loginButton.style.display = "none";
            userInfo.style.display = "flex";

            usernameDisplay.textContent = data.user.displayName || data.user.username || "User";
            userAvatar.src = data.user.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png";
            
            userAvatar.onerror = function() {
                this.src = "https://cdn.discordapp.com/embed/avatars/0.png";
            };

            await checkExistingTokenByIP();
            
        } else {
            isLoggedIn = false;
            loginButton.style.display = "block";
            userInfo.style.display = "none";
        }
    } catch (error) {
        console.error("🚨 Lỗi kiểm tra session:", error);
        isLoggedIn = false;
        loginButton.style.display = "block";
        userInfo.style.display = "none";
    }
});
