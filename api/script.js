document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".container");
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
    const createTokenBtn = document.getElementById("createTokenBtn");
    const tokenDisplay = document.getElementById("tokenDisplay");
    const tokenValue = document.getElementById("tokenValue");
    const copyTokenBtn = document.getElementById("copyTokenBtn");
    const timeRemaining = document.getElementById("timeRemaining");

    let currentToken = null;
    let tokenExpiry = null;
    let countdownInterval = null;
    let isLoggedIn = false;

    // ✅ BASE URL
    const BASE_URL = 'https://tuanhaideptraivcl.vercel.app';
    
    // Hover container
    container.addEventListener("mouseover", () => {
        container.style.transform = "scale(1.01)";
        container.style.transition = "transform 0.3s ease";
    });
    container.addEventListener("mouseout", () => {
        container.style.transform = "scale(1)";
    });

    // Nút quay về bio
    backBtn.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/`;
    });

    // Zoom ảnh
    galleryItems.forEach(img => {
        img.addEventListener("click", () => {
            lightboxImg.src = img.src;
            lightbox.style.display = "flex";
        });
    });

    // Đóng lightbox
    closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none";
    });

    closeBtn.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    });

    // User widget
    loginButton.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/login`;
    });

    userInfo.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/`;
    });

    // ✅ TOKEN MANAGEMENT với bảo vệ chống spam

    // Tạo token
    createTokenBtn.addEventListener("click", async () => {
        if (!isLoggedIn) {
            Swal.fire({
                icon: 'error',
                title: 'Khó nha bro!',
                text: 'bro chưa đăng nhập thì sao mà tạo token được',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ff6b6b',
                background: '#1a1a1a',
                color: '#fff'
            });
            return;
        }

        try {
            createTokenBtn.disabled = true;
            createTokenBtn.textContent = '🔄 Đang tạo...';

            console.log('🔗 Gọi API tạo token...');
            
            const response = await fetch(`${BASE_URL}/api/ddos?action=create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📡 Response từ API:', data);

            if (data.success) {
                currentToken = data.token;
                tokenExpiry = new Date(data.expires_at);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Tạo token thành công!',
                    text: 'Token API đã được tạo và sẵn sàng sử dụng',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#4ecdc4',
                    background: '#1a1a1a',
                    color: '#fff'
                });

                showTokenDisplay();
                startCountdown();
                
            } else {
                // 🛡️ Xử lý lỗi rate limit hoặc token đã tồn tại
                if (response.status === 429) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Không thể tạo token!',
                        text: data.message,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#fec163',
                        background: '#1a1a1a',
                        color: '#fff'
                    });
                    
                    // Nếu có token existing, hiển thị nó
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
                background: '#1a1a1a',
                color: '#fff'
            });
        } finally {
            createTokenBtn.disabled = false;
            createTokenBtn.textContent = '🚀 Tạo Token';
        }
    });

    // Copy token
    copyTokenBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(currentToken);
            
            const originalText = copyTokenBtn.textContent;
            copyTokenBtn.textContent = '✅ Đã copy!';
            copyTokenBtn.style.background = '#00ff7f';
            
            setTimeout(() => {
                copyTokenBtn.textContent = originalText;
                copyTokenBtn.style.background = '#4ecdc4';
            }, 2000);

        } catch (error) {
            console.error('Lỗi copy:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi copy!',
                text: 'Không thể copy token. Vui lòng copy thủ công.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ff6b6b',
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    });

    // 🔍 Kiểm tra token hiện tại khi load trang
    async function checkExistingToken() {
        try {
            console.log('🔍 Kiểm tra token hiện tại...');
            
            const response = await fetch(`${BASE_URL}/api/ddos?action=check`);
            const data = await response.json();
            
            if (data.success && data.has_token) {
                console.log('✅ Đã có token active');
                currentToken = data.token;
                tokenExpiry = new Date(data.expires_at);
                
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

    // Hiển thị token existing
    function showExistingToken(existingData) {
        tokenExpiry = new Date(existingData.expires_at);
        tokenDisplay.style.display = 'block';
        createTokenBtn.style.display = 'none'; // 🛡️ Ẩn hoàn toàn nút tạo
        
        // Hiển thị thông báo thay vì token (bảo mật)
        tokenValue.value = '*** Token đang hoạt động ***';
        tokenValue.style.textAlign = 'center';
        tokenValue.style.color = '#fec163';
        
        startCountdown();
    }

    // Hiển thị token display
    function showTokenDisplay() {
        tokenValue.value = currentToken;
        tokenValue.style.textAlign = 'left';
        tokenValue.style.color = '#fff';
        tokenDisplay.style.display = 'block';
        createTokenBtn.style.display = 'none'; // 🛡️ Ẩn hoàn toàn nút tạo
    }

    // Ẩn token display
    function hideTokenDisplay() {
        tokenDisplay.style.display = 'none';
        createTokenBtn.style.display = 'block'; // 🛡️ Hiện lại nút tạo
        createTokenBtn.disabled = false;
        createTokenBtn.textContent = '🚀 Tạo Token';
        currentToken = null;
        tokenExpiry = null;
    }

    // Countdown timer
    function startCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            const now = new Date();
            const diff = tokenExpiry - now;

            if (diff <= 0) {
                clearInterval(countdownInterval);
                hideTokenDisplay();
                
                Swal.fire({
                    icon: 'warning',
                    title: 'Token đã hết hạn!',
                    text: 'Bạn có thể tạo token mới ngay bây giờ.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#fec163',
                    background: '#1a1a1a',
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

    // ✅ Kiểm tra trạng thái đăng nhập
    try {
        console.log("🔍 Đang kiểm tra session...");
        
        const res = await fetch(`${BASE_URL}/api/auth?action=check_session`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await res.json();

        if (data.has_session && data.user) {
            console.log("✅ User đã đăng nhập:", data.user.displayName || data.user.username);
            
            isLoggedIn = true;
            loginButton.style.display = "none";
            userInfo.style.display = "flex";

            usernameDisplay.textContent = data.user.displayName || data.user.username || "User";
            userAvatar.src = data.user.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png";
            
            userAvatar.onerror = function() {
                this.src = "https://cdn.discordapp.com/embed/avatars/0.png";
            };

            // 🔍 Kiểm tra token hiện tại sau khi xác nhận đăng nhập
            await checkExistingToken();
            
        } else {
            console.log("❌ User chưa đăng nhập");
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