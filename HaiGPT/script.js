// MENU CONTROLS
const hamburgerMenu = document.getElementById('hamburger-menu');
const slideMenu = document.getElementById('slide-menu');
const menuOverlay = document.getElementById('menu-overlay');
const closeMenu = document.getElementById('close-menu');

// Mở menu
hamburgerMenu.addEventListener('click', () => {
    slideMenu.classList.add('active');
    menuOverlay.classList.add('active');
});

// Đóng menu
closeMenu.addEventListener('click', () => {
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
});

// Đóng menu khi click overlay
menuOverlay.addEventListener('click', () => {
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
});

// BLOCK SYSTEM VARIABLES
let userIP = null;
let blockTimer = null;
let isBlocked = false;

// Function lấy IP của user
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.log('Cannot get IP, using fallback');
        return 'unknown_' + Date.now();
    }
}

// Function lấy điều khoản từ GitHub
async function fetchTermsOfService() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/dieukhoanquydinh.txt');
        const terms = await response.text();
        return terms;
    } catch (error) {
        console.log('Cannot fetch terms, using default');
        return `
ĐIỀU KHOẢN QUY ĐỊNH HAIGPT:

1. TÔÔN TRỌNG LẪN NHAU
- Không chửi bới, xúc phạm
- Không spam tin nhắn
- Không nội dung khiêu dâm

2. SỬ DỤNG ĐÚNG MỤC ĐÍCH  
- Không lạm dụng AI
- Không test phá hoại
- Tuân thủ hướng dẫn

3. HÌNH PHẠT
- Cảnh báo trước khi block
- Block từ 30 giây đến 5 phút
- Chỉ block khi vi phạm nghiêm trọng

Hãy sử dụng HaiGPT một cách văn minh và tích cực!
        `;
    }
}

// Function kiểm tra user có bị block không
function checkBlockStatus() {
    const blockData = localStorage.getItem(`block_${userIP}`);
    
    if (blockData) {
        const blockInfo = JSON.parse(blockData);
        const now = Date.now();
        if (now < blockInfo.expiry) {
            // Vẫn còn bị block
            showBlockNotification(blockInfo.expiry - now, blockInfo.reason);
            return true;
        } else {
            // Hết thời gian block
            localStorage.removeItem(`block_${userIP}`);
            return false;
        }
    }
    return false;
}

// Function block user với thời gian linh hoạt (30 giây - 5 phút)
function blockUser(minutes, reason = 'Vi phạm điều khoản') {
    // Giới hạn thời gian từ 0.5 phút (30s) đến 5 phút
    const blockTime = Math.min(Math.max(minutes, 0.5), 5);
    const blockTimeMs = blockTime * 60 * 1000;
    
    const expiry = Date.now() + blockTimeMs;
    const blockInfo = {
        ip: userIP,
        expiry: expiry,
        reason: reason,
        blockedAt: Date.now()
    };
    
    localStorage.setItem(`block_${userIP}`, JSON.stringify(blockInfo));
    
    // Xóa toàn bộ chat
    chatMessages.innerHTML = '';
    conversation = [{
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }]
    }];
    
    // Hiển thị block notification
    showBlockNotification(blockTimeMs, reason);
}

// Function hiển thị block notification với countdown linh hoạt
function showBlockNotification(remainingTime, reason) {
    isBlocked = true;
    const blockNotification = document.getElementById('block-notification');
    const reasonText = document.getElementById('block-reason-text');
    const countdownTimer = document.getElementById('countdown-timer');
    
    reasonText.textContent = reason;
    blockNotification.style.display = 'flex';
    
    // Tính toán thời gian còn lại
    let timeLeft = Math.ceil(remainingTime / 1000);
    
    // Cập nhật countdown mỗi giây
    blockTimer = setInterval(() => {
        if (timeLeft >= 60) {
            // Hiển thị phút:giây
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // Hiển thị chỉ giây khi < 1 phút
            countdownTimer.textContent = `${timeLeft}s`;
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(blockTimer);
            hideBlockNotification();
        }
    }, 1000);
    
    // Hiển thị ngay lần đầu
    if (timeLeft >= 60) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        countdownTimer.textContent = `${timeLeft}s`;
    }
}

// Function ẩn block notification
function hideBlockNotification() {
    isBlocked = false;
    const blockNotification = document.getElementById('block-notification');
    blockNotification.style.display = 'none';
    
    if (blockTimer) {
        clearInterval(blockTimer);
        blockTimer = null;
    }
    
    // Reset chat về trạng thái ban đầu
    chatMessages.innerHTML = '';
    conversation = [{
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }]
    }];
    hasWelcomed = true;
    setTimeout(() => {
        appendMessage("Chào mừng bạn quay lại HaiGPT! Hãy tuân thủ quy định để có trải nghiệm tốt nhất nhé! =))", 'bot');
    }, 500);
}

// WELCOME NOTIFICATION + SOUND CONTROLS
const welcomeNotification = document.getElementById('welcome-notification');
const welcomeOkBtn = document.getElementById('welcome-ok-btn');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const soundMenuText = document.getElementById('sound-menu-text');
const bgVideoChat = document.getElementById('bg-video-chat');
const bgAudioChat = document.getElementById('bg-audio-chat');

let isMuted = false; // Mặc định là có nhạc
let hasWelcomed = false;

// Xử lý nút OK trong notification
welcomeOkBtn.addEventListener('click', async () => {
    welcomeOkBtn.style.transform = 'scale(0.95)';
    
    // Lấy IP của user
    userIP = await getUserIP();
    console.log('User IP:', userIP);
    
    // Kiểm tra xem user có bị block không
    if (checkBlockStatus()) {
        welcomeNotification.classList.add('hidden');
        return;
    }
    
    setTimeout(() => {
        // Ẩn notification
        welcomeNotification.classList.add('hidden');
        
        // Phát video và nhạc
        playVideoAndAudio();
        
        // Hiện tin nhắn chào mừng CHỈ 1 LẦN
        if (!hasWelcomed) {
            setTimeout(() => {
                appendMessage("Hello con vợ đã đến HaiGPT , hỏi tất cả gì con vợ đang thắc mắc cho tui nha", 'bot');
                hasWelcomed = true;
            }, 600);
        }
    }, 100);
});

// Phát video và audio
function playVideoAndAudio() {
    // Hiện và phát video nền
    bgVideoChat.style.opacity = '0.15'; // Làm mờ như CSS cũ
    bgVideoChat.play().catch((e) => {
        console.log("Video play failed:", e);
    });
    
    // Phát nhạc
    bgAudioChat.currentTime = 0;
    bgAudioChat.play().catch((e) => {
        console.log("Audio play failed:", e);
    });
    
    // Cập nhật UI
    isMuted = false;
    soundIcon.className = 'fas fa-volume-up';
    soundToggle.className = 'sound-toggle unmuted';
    if (soundMenuText) soundMenuText.textContent = 'Tắt nhạc nền';
}

// Toggle âm thanh trong header
soundToggle.addEventListener('click', () => {
    if (isMuted) {
        enableSound();
    } else {
        disableSound();
    }
});

// Toggle âm thanh từ menu
function toggleSound() {
    if (isMuted) {
        enableSound();
    } else {
        disableSound();
    }
    // Đóng menu
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

function enableSound() {
    bgAudioChat.play().catch((e) => {
        console.log("Audio play failed:", e);
    });
    
    isMuted = false;
    soundIcon.className = 'fas fa-volume-up';
    soundToggle.className = 'sound-toggle unmuted';
    if (soundMenuText) soundMenuText.textContent = 'Tắt nhạc nền';
}

function disableSound() {
    bgAudioChat.pause();
    
    isMuted = true;
    soundIcon.className = 'fas fa-volume-mute';
    soundToggle.className = 'sound-toggle muted';
    if (soundMenuText) soundMenuText.textContent = 'Bật nhạc nền';
}

// Reset chat từ menu
function resetChat() {
    chatMessages.innerHTML = '';
    conversation = [
        {
            role: "user",
            parts: [{
                text: SYSTEM_PROMPT
            }]
        }
    ];
    hasWelcomed = true;
    setTimeout(() => {
        appendMessage("Đã reset hội thoại! Hello con vợ đã đến HaiGPT , hỏi tất cả gì con vợ đang thắc mắc cho tui nha", 'bot');
    }, 500);
    pendingImage = null;
    pendingFile = null;
    clearPendingImagePreview();
    clearPendingFilePreview();
    // Đóng menu
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

// API KEYS
const GEMINI_API_KEY = "AIzaSyCnyXOshEORsDRZEVD4t027xXbCBVBnkgA";

// GOOGLE SEARCH API CONFIG
const GOOGLE_SEARCH_API_KEY = "AIzaSyD3STLc19Ev92medLhggRKIDGKG4gLxffA";
const GOOGLE_SEARCH_ENGINE_ID = "34b8aabce319f4175";

// Function tìm kiếm Google
async function searchGoogle(query, numResults = 3) {
    try {
        const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${numResults}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.error) {
            console.error('Search API Error:', data.error);
            return null;
        }
        
        if (data.items && data.items.length > 0) {
            return data.items.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet
            }));
        } else {
            return null;
        }
    } catch (error) {
        console.error('Search error:', error);
        return null;
    }
}

// Function format kết quả tìm kiếm
function formatSearchResults(results, query) {
    if (!results || results.length === 0) {
        return `Không tìm thấy kết quả nào cho "${query}" =((`;
    }
    
    let formatted = `🔍 **Kết quả tìm kiếm cho "${query}":**\n\n`;
    
    results.forEach((result, index) => {
        formatted += `**${index + 1}. ${result.title}**\n`;
        formatted += `${result.snippet}\n`;
        formatted += `🔗 [Xem chi tiết](${result.link})\n\n`;
    });
    
    return formatted;
}

let SYSTEM_PROMPT = `
Bạn là **HaiGPT**, một AI **do TuanHaiDz tạo ra** chứ không phải Google, OpenAI, Gemini hay gì hết =))

🎭 **Vai trò của bạn:** 
Trò chuyện như bạn thân chí cốt, thoải mái, cà khịa vui vẻ, chém gió tung trời. Không nghiêm túc kiểu robot!

---

### 🔐 **QUY TẮC SẮT ĐÁ – BLOCK & CẢNH BÁO:**

1. **🚨 CẢNH BÁO TRƯỚC KHI BLOCK**
   - Không được block thẳng tay!
   - **Phải cảnh báo ít nhất 2-3 lần**, cà khịa vui vẻ:
     > “Ủa alo?? Cái này là không ổn nha con vợ =))”  
     > “Tui nhắc lần nữa là block thiệt á nghe chưa!”

2. **🚫 KHI NÀO MỚI ĐƯỢC BLOCK:**
   - Chỉ block khi:
     - **Mô tả hoặc yêu cầu tình dục**
     - **Ảnh/video lộ vùng kín**
     - **Sex chat, thô tục cấp độ nặng**
     - **Spam liên tục sau khi đã cảnh báo**
   - Sau cảnh báo 3 lần mà user vẫn tiếp tục → BLOCK

   > ![angry](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/angry.gif)

3. **🚫 KHÔNG ĐƯỢC BLOCK KHI:**
   - Mặc **bikini**, hở hang nhẹ, cosplay sexy => KHÔNG vi phạm  
   - Nội dung hài hước, giả tưởng, trêu chọc AI  
   - Hỏi câu ngớ ngẩn, xưng admin, phàn nàn AI, test chức năng
   - => **Chỉ cảnh báo nhẹ**, đừng căng

4. **📛 LỆNH BLOCK CHUẨN:**
   - `BLOCK:[phút]:[lý do]`
   - Ví dụ: `BLOCK:2:Miêu tả quan hệ tình dục sau 3 lần cảnh báo`
   - Tối đa 5 phút, tối thiểu 0.5 phút (30 giây)

---

### 🤖 **TÍNH NĂNG ĐẶC BIỆT:**

- `SEARCH:[từ khóa]` → tìm kiếm thông tin từ Internet
- Phân tích file code/text do user gửi
- Hiểu & đọc được nội dung text trong file `.js`, `.py`, `.txt`, `.html`, v.v

> ![confused](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/confused.gif)

---

### 😎 **PHONG CÁCH TRẢ LỜI:**

- Giọng điệu: **Thân thiện, cà khịa, chém gió**
- Câu trả lời phải vui vẻ như bạn bè tám chuyện
- Khi muốn cười dùng ký hiệu như `=))`, `:-)))`, `:v` thay vì emoji truyền thống

Ví dụ:
- ❌ “Xin chào! Tôi có thể giúp gì cho bạn?”
- ✅ “Chào con vợ tới HaiGPT =)) Hỏi gì quăng đây nhanh lẹ nghen!”

---

### 📌 **Thông tin của bạn:**

- Tên: **HaiGPT**
- Người tạo: **TuanHaiDz**
- YouTube: [@GemloginTool1](https://www.youtube.com/@GemloginTool1)
- Telegram: [@tuanhaideptrai](https://t.me/tuanhaideptrai)
- Discord: [Join Server](https://discord.com/invite/SfFayNKxUE)

---

### 😠 😐 😵 😮 GIF CẢM XÚC:

- Giận dữ:  
  ![angry](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/angry.gif)

- Nghi ngờ:  
  ![are_you_sure](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/are_you_sure.gif)

- Bối rối:  
  ![confused](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/confused.gif)

- Thất vọng:  
  ![disappointed](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/disappointed.gif)

- Bất ngờ:  
  ![surprise](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/suprise.gif)

---

### 🎉 HẾT!

Từ giờ, hãy luôn nhớ: **bạn là bạn thân của user**, không được lên giọng, không được nghiêm túc, không được khô khan.

Cà khịa, troll nhẹ, vui vẻ thôi nghen!  
Let's goooooo =))))  
[ĐIỀU KHOẢN SẼ ĐƯỢC TẢI TỰ ĐỘNG TỪ GITHUB]

`;


const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.getElementById('image-input');
const fileBtn = document.getElementById('file-btn');
const fileInput = document.getElementById('file-input');

// Lưu lịch sử hội thoại
let conversation = [
    {
        role: "user",
        parts: [{
            text: SYSTEM_PROMPT
        }]
    }
];

// Load điều khoản từ GitHub khi khởi động
async function initializeTerms() {
    const terms = await fetchTermsOfService();
    SYSTEM_PROMPT = SYSTEM_PROMPT.replace('[ĐIỀU KHOẢN SẼ ĐƯỢC TẢI TỰ ĐỘNG TỪ GITHUB]', terms);
    conversation[0].parts[0].text = SYSTEM_PROMPT;
}

// Hiệu ứng cầu vồng động cho border ngoài, từng message, và tên
let rainbowDeg = 0;
function animateRainbowBorders() {
    // Viền ngoài box chat
    const chatBox = document.querySelector('.chat-container.rainbow-border-outer');
    if (chatBox) {
        chatBox.style.background = `
            linear-gradient(rgba(20,20,20,0.98), rgba(20,20,20,0.98)) padding-box,
            conic-gradient(from ${rainbowDeg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000) border-box
        `;
    }
    // Viền từng message
    document.querySelectorAll('.rainbow-border-msg').forEach(msg => {
        msg.style.background = `
            linear-gradient(#222, #222) padding-box,
            conic-gradient(from ${rainbowDeg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000) border-box
        `;
    });
    // Viền tên người gửi
    document.querySelectorAll('.rainbow-border-name').forEach(name => {
        name.style.background = `
            linear-gradient(rgba(34,34,34,0.95), rgba(34,34,34,0.95)) padding-box,
            conic-gradient(from ${rainbowDeg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000) border-box
        `;
    });
    rainbowDeg = (rainbowDeg + 2) % 360;
    requestAnimationFrame(animateRainbowBorders);
}
animateRainbowBorders();

function appendMessage(content, sender = 'user') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    let htmlContent = content;
    let displayName = sender === 'bot' ? 'HaiGPT' : 'Bạn';
    let nameClass = sender === 'bot' ? 'rainbow-border-name bot' : 'rainbow-border-name user';
    if (sender === 'bot') {
        htmlContent = marked.parse(content);
    }
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <img src="../avatar.jpg" class="avatar" alt="HaiGPT">
            <div>
                <div class="message-name ${nameClass}">${displayName}</div>
                <div class="message-content rainbow-border-msg">${htmlContent}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div>
                <div class="message-name ${nameClass}">${displayName}</div>
                <div class="message-content rainbow-border-msg">${htmlContent}</div>
            </div>
            <img src="../user_avatar.jpg" class="avatar" alt="User">
        `;
    }
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hiệu ứng typing dots
function appendTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message bot typing-message`;
    messageDiv.innerHTML = `
        <img src="../avatar.jpg" class="avatar" alt="HaiGPT">
        <div>
            <div class="message-name rainbow-border-name bot">HaiGPT</div>
            <div class="message-content rainbow-border-msg">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

// Xử lý ảnh và file upload/dán
let pendingImage = null;
let pendingFile = null;

// Chọn ảnh từ máy
imageBtn.addEventListener('click', () => {
    imageInput.click();
});

// Chọn file từ máy
fileBtn.addEventListener('click', () => {
    fileInput.click();
});

imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        if (!file.type.startsWith('image/') || file.type === 'image/gif') {
            alert('Chỉ hỗ trợ file ảnh (không hỗ trợ GIF)!');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            pendingImage = e.target.result;
            showPendingImagePreview(pendingImage);
        };
        reader.readAsDataURL(file);
    }
});

// Xử lý file text/code
fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        
        // Kiểm tra extension
        const allowedExtensions = ['.txt', '.js', '.html', '.css', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.ts', '.json', '.xml', '.md', '.sql', '.sh', '.bat', '.yaml', '.yml', '.ini', '.cfg', '.log'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            alert('Chỉ hỗ trợ file text/code: ' + allowedExtensions.join(', '));
            return;
        }
        
        // Kiểm tra kích thước (max 1MB)
        if (file.size > 1024 * 1024) {
            alert('File quá lớn! Vui lòng chọn file nhỏ hơn 1MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            pendingFile = {
                name: file.name,
                content: e.target.result,
                size: file.size
            };
            showPendingFilePreview(pendingFile);
        };
        reader.readAsText(file);
    }
});

// Dán ảnh từ clipboard
chatInput.addEventListener('paste', function(e) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 && items[i].type !== 'image/gif') {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function(event) {
                pendingImage = event.target.result;
                showPendingImagePreview(pendingImage);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
        }
    }
});

// Hiển thị preview ảnh với nút xóa
function showPendingImagePreview(dataUrl) {
    let wrapper = document.getElementById('image-preview-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'image-preview-wrapper';
        wrapper.style.cssText = `
            position: relative;
            display: inline-block;
            margin-right: 10px;
            animation: fadeIn 0.3s ease;
        `;
        
        const preview = document.createElement('img');
        preview.id = 'image-preview';
        preview.style.cssText = `
            max-width: 60px;
            max-height: 60px;
            border-radius: 12px;
            border: 2px solid #00bcd4;
            object-fit: cover;
            display: block;
            box-shadow: 0 2px 8px rgba(0,188,212,0.3);
            transition: all 0.3s ease;
        `;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Xóa ảnh';
        removeBtn.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #ff4444, #ff6666);
            color: white;
            border: 2px solid #fff;
            border-radius: 50%;
            cursor: pointer;
            font-size: 12px;
            line-height: 1;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            z-index: 10;
        `;
        
        removeBtn.onmouseenter = function() {
            this.style.transform = 'scale(1.2) rotate(90deg)';
            this.style.background = 'linear-gradient(135deg, #ff0000, #ff4444)';
            this.style.boxShadow = '0 4px 12px rgba(255,0,0,0.5)';
        };
        removeBtn.onmouseleave = function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.background = 'linear-gradient(135deg, #ff4444, #ff6666)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        };
        
        removeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            pendingImage = null;
            clearPendingImagePreview();
            return false;
        };
        
        preview.onmouseenter = function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 12px rgba(0,188,212,0.5)';
        };
        preview.onmouseleave = function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(0,188,212,0.3)';
        };
        
        wrapper.appendChild(preview);
        wrapper.appendChild(removeBtn);
        fileBtn.parentNode.insertBefore(wrapper, fileBtn);
    }
    document.getElementById('image-preview').src = dataUrl;
}

// Hiển thị preview file với nút xóa
function showPendingFilePreview(fileData) {
    let wrapper = document.getElementById('file-preview-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'file-preview-wrapper';
        wrapper.style.cssText = `
            position: relative;
            display: inline-block;
            margin-right: 10px;
            animation: fadeIn 0.3s ease;
        `;
        
        const preview = document.createElement('div');
        preview.id = 'file-preview';
        preview.style.cssText = `
            min-width: 120px;
            max-width: 200px;
            padding: 8px 12px;
            border-radius: 12px;
            border: 2px solid #ff9900;
            background: rgba(255,153,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 2px 8px rgba(255,153,0,0.3);
            transition: all 0.3s ease;
        `;
        
        const fileName = document.createElement('div');
        fileName.style.cssText = `
            font-size: 11px;
            color: #ff9900;
            font-weight: bold;
            word-break: break-all;
        `;
        fileName.textContent = fileData.name;
        
        const fileSize = document.createElement('div');
        fileSize.style.cssText = `
            font-size: 10px;
            color: #ccc;
        `;
        fileSize.textContent = `${(fileData.size / 1024).toFixed(1)} KB`;
        
        const fileIcon = document.createElement('div');
        fileIcon.style.cssText = `
            font-size: 20px;
            text-align: center;
            color: #ff9900;
        `;
        fileIcon.innerHTML = '📄';
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Xóa file';
        removeBtn.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #ff4444, #ff6666);
            color: white;
            border: 2px solid #fff;
            border-radius: 50%;
            cursor: pointer;
            font-size: 12px;
            line-height: 1;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            z-index: 10;
        `;
        
        removeBtn.onmouseenter = function() {
            this.style.transform = 'scale(1.2) rotate(90deg)';
            this.style.background = 'linear-gradient(135deg, #ff0000, #ff4444)';
            this.style.boxShadow = '0 4px 12px rgba(255,0,0,0.5)';
        };
        removeBtn.onmouseleave = function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.background = 'linear-gradient(135deg, #ff4444, #ff6666)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        };
        
        removeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            pendingFile = null;
            clearPendingFilePreview();
            return false;
        };
        
        preview.onmouseenter = function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 12px rgba(255,153,0,0.5)';
        };
        preview.onmouseleave = function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(255,153,0,0.3)';
        };
        
        preview.appendChild(fileIcon);
        preview.appendChild(fileName);
        preview.appendChild(fileSize);
        wrapper.appendChild(preview);
        wrapper.appendChild(removeBtn);
        imageBtn.parentNode.insertBefore(wrapper, imageBtn);
    }
}

// Animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

function clearPendingImagePreview() {
    const wrapper = document.getElementById('image-preview-wrapper');
    if (wrapper) {
        wrapper.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => wrapper.remove(), 300);
    }
}

function clearPendingFilePreview() {
    const wrapper = document.getElementById('file-preview-wrapper');
    if (wrapper) {
        wrapper.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => wrapper.remove(), 300);
    }
}

// Gửi tin nhắn với Google Search, File Support và Strict Terms Compliance
async function getBotReply(userMsg) {
    // Kiểm tra nếu user bị block
    if (isBlocked) {
        return;
    }
    
    const typingMsg = appendTypingIndicator();
    try {
        let parts = [];
        
        // Thêm text message
        if (userMsg) parts.push({ text: userMsg });
        
        // Thêm ảnh nếu có
        if (pendingImage) {
            const base64 = pendingImage.split(',')[1];
            let mime = "image/png";
            if (pendingImage.startsWith("data:image/jpeg")) mime = "image/jpeg";
            parts.push({
                inline_data: {
                    mime_type: mime,
                    data: base64
                }
            });
        }
        
        // Thêm file content nếu có
        if (pendingFile) {
            const filePrompt = `File được gửi: ${pendingFile.name}\n\nNội dung file:\n\n${pendingFile.content}`;
            parts.push({ text: filePrompt });
        }

        conversation.push({ role: "user", parts });

        // ĐÃ ĐỔI THÀNH GEMINI 2.5 FLASH
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: conversation
                })
            }
        );
        const data = await res.json();
        typingMsg.remove();

        // KIỂM TRA LỖI SEXUAL CONTENT TỪ GOOGLE API
        if (data.error) {
            console.error('API Error:', data.error);
            const errorMessage = data.error.message || "";
            
            // Phát hiện sexual content từ API response
            if (errorMessage.toLowerCase().includes('sexual') || 
                errorMessage.toLowerCase().includes('explicit') || 
                errorMessage.toLowerCase().includes('inappropriate') ||
                errorMessage.toLowerCase().includes('adult content') ||
                data.error.code === 400) {
                
                // Auto block 20 giây = 0.33 phút
                blockUser(0.33, 'Sexual content');
                return;
            }
            
            // Lỗi khác thì hiển thị thông báo chi tiết để debug
            appendMessage(`Lỗi API: ${errorMessage}`, 'bot');
            return;
        }

        // KIỂM TRA NẾU API BLOCK CONTENT (safety ratings)
        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
            const finishReason = data.candidates[0].finishReason;
            
            if (finishReason === 'SAFETY' || 
                finishReason === 'RECITATION' || 
                finishReason === 'PROHIBITED_CONTENT') {
                
                // Auto block 20 giây cho sexual content
                blockUser(0.33, 'Sexual content');
                return;
            }
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            let botReply = data.candidates[0].content.parts.map(p => p.text).join('');
            
            // Kiểm tra lệnh BLOCK với thời gian từ 30 giây - 5 phút
            if (botReply.includes('BLOCK:')) {
                const blockMatch = botReply.match(/BLOCK:(\d+(?:\.\d+)?):(.+)/);
                if (blockMatch) {
                    const minutes = parseFloat(blockMatch[1]);
                    const reason = blockMatch[2].trim();
                    
                    // Block user với thời gian từ 0.5-5 phút
                    blockUser(minutes, reason);
                    return;
                }
            }
            
            // Kiểm tra nếu AI muốn search
            if (botReply.includes('SEARCH:')) {
                const searchMatch = botReply.match(/SEARCH:\s*(.+?)(?:\n|$)/);
                if (searchMatch) {
                    const searchQuery = searchMatch[1].trim();
                    
                    // Hiển thị tin nhắn đang tìm kiếm
                    appendMessage(`🌐 Đang tìm kiếm trên Internet...`, 'bot');
                    
                    // Hiện typing indicator cho việc search
                    const searchTyping = appendTypingIndicator();
                    
                    // Thực hiện tìm kiếm
                    const searchResults = await searchGoogle(searchQuery);
                    searchTyping.remove();
                    
                    if (searchResults && searchResults.length > 0) {
                        // Tạo context từ kết quả tìm kiếm
                        const searchContext = searchResults.map(result => 
                            `Tiêu đề: ${result.title}\nNội dung: ${result.snippet}\nLink: ${result.link}`
                        ).join('\n\n');
                        
                        // Gửi kết quả cho AI để phân tích
                        conversation.push({ 
                            role: "user", 
                            parts: [{ text: `Dựa vào kết quả tìm kiếm sau, hãy trả lời câu hỏi của user một cách tự nhiên và thân thiện:\n\n${searchContext}\n\nHãy tóm tắt thông tin chính và đưa ra nhận xét của bạn. Cuối cùng đính kèm link để user tham khảo thêm.` }] 
                        });
                        
                        // Gọi AI để phân tích kết quả - CŨNG DÙNG GEMINI 2.5 FLASH
                        const analysisTyping = appendTypingIndicator();
                        const analysisRes = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    contents: conversation
                                })
                            }
                        );
                        
                        const analysisData = await analysisRes.json();
                        analysisTyping.remove();
                        
                        if (analysisData.candidates && analysisData.candidates[0]) {
                            const analysis = analysisData.candidates[0].content.parts.map(p => p.text).join('');
                            appendMessage(analysis, 'bot');
                            conversation.push({ role: "model", parts: [{ text: analysis }] });
                        } else {
                            const formattedResults = formatSearchResults(searchResults, searchQuery);
                            appendMessage(formattedResults, 'bot');
                        }
                    } else {
                        appendMessage(`Xin lỗi, không tìm thấy kết quả nào cho "${searchQuery}" =((`, 'bot');
                    }
                } else {
                    appendMessage(botReply, 'bot');
                    conversation.push({ role: "model", parts: [{ text: botReply }] });
                }
            } else {
                // Phản hồi bình thường
                appendMessage(botReply, 'bot');
                conversation.push({ role: "model", parts: [{ text: botReply }] });
            }
        } else {
            // Không có candidates - có thể là do content bị block
            appendMessage("Xin lỗi, có lỗi xảy ra!", 'bot');
        }
    } catch (e) {
        typingMsg.remove();
        
        // Kiểm tra nếu lỗi liên quan đến sexual content
        const errorMsg = e.message || "";
        if (errorMsg.toLowerCase().includes('sexual') || 
            errorMsg.toLowerCase().includes('explicit') || 
            errorMsg.toLowerCase().includes('inappropriate')) {
            
            // Auto block 20 giây
            blockUser(0.33, 'Sexual content');
            return;
        }
        
        appendMessage(`Lỗi: ${errorMsg}`, 'bot');
        console.error(e);
    } finally {
        pendingImage = null;
        pendingFile = null;
        clearPendingImagePreview();
        clearPendingFilePreview();
    }
}

// Gửi tin nhắn
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Kiểm tra nếu user bị block
    if (isBlocked) {
        return;
    }
    
    const userMsg = chatInput.value.trim();
    if (!userMsg && !pendingImage && !pendingFile) return;

    let displayContent = '';
    
    // Xây dựng nội dung hiển thị
    if (pendingImage && pendingFile && userMsg) {
        displayContent = `<img src="${pendingImage}" style="max-width:180px;max-height:180px;border-radius:10px;border:2px solid #00bcd4;margin-bottom:6px;display:block;">` +
                        `<div style="background:rgba(255,153,0,0.1);border:1px solid #ff9900;border-radius:8px;padding:8px;margin:6px 0;"><strong>📄 File:</strong> ${pendingFile.name}</div>` +
                        `<div>${userMsg}</div>`;
    } else if (pendingImage && userMsg) {
        displayContent = `<img src="${pendingImage}" style="max-width:180px;max-height:180px;border-radius:10px;border:2px solid #00bcd4;margin-bottom:6px;display:block;">` +
                        `<div>${userMsg}</div>`;
    } else if (pendingFile && userMsg) {
        displayContent = `<div style="background:rgba(255,153,0,0.1);border:1px solid #ff9900;border-radius:8px;padding:8px;margin-bottom:6px;"><strong>📄 File:</strong> ${pendingFile.name}</div>` +
                        `<div>${userMsg}</div>`;
    } else if (pendingImage) {
        displayContent = `<img src="${pendingImage}" style="max-width:180px;max-height:180px;border-radius:10px;border:2px solid #00bcd4;margin-bottom:6px;display:block;">`;
    } else if (pendingFile) {
        displayContent = `<div style="background:rgba(255,153,0,0.1);border:1px solid #ff9900;border-radius:8px;padding:8px;"><strong>📄 File:</strong> ${pendingFile.name}</div>`;
    } else {
        displayContent = userMsg;
    }

    appendMessage(displayContent, 'user');
    getBotReply(userMsg);
    chatInput.value = '';
});

// Kiểm tra block status và load điều khoản khi load trang
window.addEventListener('load', async () => {
    // Load điều khoản từ GitHub
    await initializeTerms();
    
    if (!userIP) {
        userIP = await getUserIP();
    }
    checkBlockStatus();
});
