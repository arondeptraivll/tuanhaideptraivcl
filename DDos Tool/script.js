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
        window.location.href = "https://tuanhaideptraivcl.vercel.app/";
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

    // Đóng khi click nền
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    });

    // ✅ Xử lý user widget
    // Sự kiện bấm nút login
    loginButton.addEventListener("click", () => {
        window.location.href = "https://tuanhaideptraivcl.vercel.app/login";
    });

    // Click vào user info cũng về trang chính
    userInfo.addEventListener("click", () => {
        window.location.href = "https://tuanhaideptraivcl.vercel.app/";
    });

    // Kiểm tra trạng thái đăng nhập
    try {
        console.log("🔍 Đang kiểm tra session...");
        
        // Gọi API check session
        const res = await fetch(`https://tuanhaideptraivcl.vercel.app/api/auth?action=check_session`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await res.json();
        console.log("📡 Phản hồi từ API:", data);

        if (data.has_session && data.user) {
            // ✅ Đã đăng nhập → hiện thông tin user
            console.log("✅ User đã đăng nhập:", data.user.displayName || data.user.username);
            
            loginButton.style.display = "none";
            userInfo.style.display = "flex";

            usernameDisplay.textContent = data.user.displayName || data.user.username || "User";
            userAvatar.src = data.user.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png";
            
            // Xử lý lỗi load avatar
            userAvatar.onerror = function() {
                this.src = "https://cdn.discordapp.com/embed/avatars/0.png";
            };
        } else {
            // ❌ Chưa đăng nhập → hiện nút login
            console.log("❌ User chưa đăng nhập");
            loginButton.style.display = "block";
            userInfo.style.display = "none";
        }
    } catch (error) {
        console.error("🚨 Lỗi kiểm tra session:", error);
        // Nếu có lỗi → mặc định hiện nút login
        loginButton.style.display = "block";
        userInfo.style.display = "none";
    }
});