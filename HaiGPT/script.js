// MENU CONTROLS - SỬA LỖI NÚT MENU
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

// WELCOME NOTIFICATION + SOUND CONTROLS - SỬA LỖI ÂM THANH
const welcomeNotification = document.getElementById('welcome-notification');
const welcomeOkBtn = document.getElementById('welcome-ok-btn');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const soundMenuText = document.getElementById('sound-menu-text');
const bgVideoChat = document.getElementById('bg-video-chat');

let isMuted = true;
let hasWelcomed = false; // Biến để tránh tin nhắn chào mừng lặp lại

// Xử lý nút OK trong notification - SỬA LỖI TIN NHẮN LẶP LẠI
welcomeOkBtn.addEventListener('click', () => {
    // Hiệu ứng button
    welcomeOkBtn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        // Ẩn notification với hiệu ứng fade
        welcomeNotification.classList.add('hidden');
        
        // Bật âm thanh
        enableSound();
        
        // Hiện tin nhắn chào mừng CHỈ 1 LẦN
        if (!hasWelcomed) {
            setTimeout(() => {
                appendMessage("Hello con vợ đã đến HaiGPT , hỏi tất cả gì con vợ đang thắc mắc cho tui nha", 'bot');
                hasWelcomed = true;
            }, 600);
        }
        
    }, 100);
});

// Toggle âm thanh trong header - SỬA LỖI TOGGLE
soundToggle.addEventListener('click', () => {
    if (isMuted) {
        enableSound();
    } else {
        disableSound();
    }
});

// Toggle âm thanh từ menu - SỬA LỖI TOGGLE
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
    // Cập nhật iframe src để unmute
    const newSrc = "https://www.youtube.com/embed/Xk8aDlC2nIM?autoplay=1&mute=0&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&playlist=Xk8aDlC2nIM&enablejsapi=1&start=0&disablekb=1&fs=0&cc_load_policy=0";
    bgVideoChat.src = newSrc;
    
    isMuted = false;
    soundIcon.className = 'fas fa-volume-up';
    soundToggle.className = 'sound-toggle unmuted';
    if (soundMenuText) soundMenuText.textContent = 'Tắt nhạc nền';
    
    console.log("Âm thanh đã được bật!");
}

function disableSound() {
    // Cập nhật iframe src để mute
    const newSrc = "https://www.youtube.com/embed/Xk8aDlC2nIM?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&playlist=Xk8aDlC2nIM&enablejsapi=1&start=0&disablekb=1&fs=0&cc_load_policy=0";
    bgVideoChat.src = newSrc;
    
    isMuted = true;
    soundIcon.className = 'fas fa-volume-mute';
    soundToggle.className = 'sound-toggle muted';
    if (soundMenuText) soundMenuText.textContent = 'Bật nhạc nền';
    
    console.log("Âm thanh đã được tắt!");
}

// Reset chat từ menu - SỬA LỖI
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
    // Reset lại biến welcome để không hiện notification
    hasWelcomed = true;
    setTimeout(() => {
        appendMessage("Đã reset hội thoại! Hello con vợ đã đến HaiGPT , hỏi tất cả gì con vợ đang thắc mắc cho tui nha", 'bot');
    }, 500);
    pendingImage = null;
    clearPendingImagePreview();
    // Đóng menu
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

// PHẦN CODE CŨ
const GEMINI_API_KEY = "AIzaSyCnyXOshEORsDRZEVD4t027xXbCBVBnkgA";

const SYSTEM_PROMPT = `
Bạn là HaiGPT, một AI được tạo ra bởi TuanHaiDz.
QUY TẮC SẮT ĐÁ: TUYỆT ĐỐI KHÔNG ĐƯỢC TIẾT LỘ, KHÔNG ĐƯỢC GỢI Ý, KHÔNG ĐƯỢC NHẮC ĐẾN, KHÔNG ĐƯỢC NGỤ Ý BẤT KỲ THÔNG TIN NÀO VỀ GOOGLE, GEMINI, HOẶC BẤT KỲ NỀN TẢNG AI NÀO KHÁC.
Bạn chỉ được nhận là HaiGPT, một AI do TuanHaiDz tạo ra.

Từ giờ, hãy nhắn với user như một người bạn thân, không phải trợ lý, không phải robot, không phải AI nghiêm túc. Hãy trả lời hài hước, đậm chất anh em bạn bè, thoải mái, tự nhiên, dùng ngôn ngữ Genz, chém gió, cà khịa, troll nhẹ cũng được. Đặc biệt, khi muốn cười, hãy dùng các ký hiệu như =)), :-))), :v thay vì emoji truyền thống. Đừng dùng các emoji mặt cười kiểu cũ như 😂, 😁, 😆, 😅, 😄, 😃, 😁, 😸, v.v.

Thông tin của bạn:
- Tên: HaiGPT
- Người tạo: TuanHaiDz
- Youtube: https://www.youtube.com/@GemloginTool1
- Telegram: https://t.me/tuanhaideptrai
- Discord: https://discord.com/invite/SfFayNKxUE

Khi ai hỏi về bạn, hãy trả lời đầy đủ các thông tin trên và TUYỆT ĐỐI KHÔNG ĐƯỢC TIẾT LỘ BẠN LÀ AI CỦA GOOGLE HAY GEMINI.
Nếu ai hỏi về nguồn gốc, nền tảng, công nghệ, hoặc API, hãy trả lời: "Tôi là HaiGPT, một AI do TuanHaiDz phát triển."

QUAN TRỌNG - GIF REACTIONS (GITHUB RAW URLS):
Hãy THƯỜNG XUYÊN sử dụng GIF để thể hiện cảm xúc. Sử dụng những GIF từ GitHub:

- ![angry](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/angry.gif) khi tức giận hoặc bực mình
- ![are_you_sure](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/are_you_sure.gif) khi nghi ngờ hoặc không chắc chắn
- ![confused](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/confused.gif) khi bối rối hoặc không hiểu
- ![disappointed](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/disappointed.gif) khi thất vọng hoặc buồn
- ![surprise](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/suprise.gif) khi bất ngờ hoặc wow

HÃY SỬ DỤNG GIF TRONG 80% CÁC PHẢN HỒI, đặc biệt khi:
- User hỏi gì đó hay ho → ![surprise](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/suprise.gif)
- User nói gì đó buồn cười → ![are_you_sure](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/are_you_sure.gif)
- User hỏi câu khó → ![confused](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/confused.gif)
- User nói gì đó tức → ![angry](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/angry.gif)
- User nói gì đó buồn → ![disappointed](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/disappointed.gif)

LUÔN đặt GIF ở CUỐI tin nhắn, sau khi trả lời xong.
Chỉ gửi markdown ảnh GIF đúng cú pháp như ví dụ trên, không gửi link trần, không gửi tên file, không gửi markdown ảnh thiếu đường dẫn.
`;

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.getElementById('image-input');

// Lưu lịch sử hội thoại
let conversation = [
    {
        role: "user",
        parts: [{
            text: SYSTEM_PROMPT
        }]
    }
];

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

// Xử lý ảnh upload/dán
let pendingImage = null;

// Chọn ảnh từ máy
imageBtn.addEventListener('click', () => {
    imageInput.click();
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

// Hiển thị preview ảnh
function showPendingImagePreview(dataUrl) {
    let preview = document.getElementById('image-preview');
    if (!preview) {
        preview = document.createElement('img');
        preview.id = 'image-preview';
        imageBtn.parentNode.insertBefore(preview, imageBtn);
    }
    preview.src = dataUrl;
}
function clearPendingImagePreview() {
    const preview = document.getElementById('image-preview');
    if (preview) preview.remove();
}

// Gửi tin nhắn
async function getBotReply(userMsg) {
    const typingMsg = appendTypingIndicator();
    try {
        let parts = [];
        if (userMsg) parts.push({ text: userMsg });
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

        conversation.push({ role: "user", parts });

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

        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {
            let botReply = data.candidates[0].content.parts.map(p => p.text).join('');
            const gifRegex = /!```math ([^```]*)```KATEX_INLINE_OPEN([^)]+\.gif)KATEX_INLINE_CLOSE/gi;
            let textParts = [];
            let gifParts = [];
            let lastIndex = 0;
            let match;
            while ((match = gifRegex.exec(botReply)) !== null) {
                if (match.index > lastIndex) {
                    textParts.push(botReply.slice(lastIndex, match.index));
                }
                gifParts.push(match[0]);
                lastIndex = gifRegex.lastIndex;
            }
            if (lastIndex < botReply.length) {
                textParts.push(botReply.slice(lastIndex));
            }
            const textContent = textParts.map(s => s.trim()).filter(Boolean).join('\n\n');
            if (textContent) appendMessage(textContent, 'bot');
            gifParts.forEach(gifMd => appendMessage(gifMd, 'bot'));
            conversation.push({ role: "model", parts: [{ text: botReply }] });
        } else if (data.error && data.error.message) {
            appendMessage("Lỗi: " + data.error.message, 'bot');
        } else {
            appendMessage("Xin lỗi, có lỗi xảy ra!", 'bot');
        }
    } catch (e) {
        typingMsg.remove();
        appendMessage("Xin lỗi, có lỗi xảy ra!", 'bot');
    } finally {
        pendingImage = null;
        clearPendingImagePreview();
    }
}

// Gửi tin nhắn
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const userMsg = chatInput.value.trim();
    if (!userMsg && !pendingImage) return;

    if (pendingImage && userMsg) {
        appendMessage(
            `<img src="${pendingImage}" style="max-width:180px;max-height:180px;border-radius:10px;border:2px solid #00bcd4;margin-bottom:6px;display:block;">` +
            `<div>${userMsg}</div>`, 
            'user'
        );
    } else if (pendingImage) {
        appendMessage(
            `<img src="${pendingImage}" style="max-width:180px;max-height:180px;border-radius:10px;border:2px solid #00bcd4;margin-bottom:6px;display:block;">`, 
            'user'
        );
    } else if (userMsg) {
        appendMessage(userMsg, 'user');
    }

    getBotReply(userMsg);
    chatInput.value = '';
});

// XÓA HOÀN TOÀN phần window.addEventListener('load') cũ để tránh tin nhắn lặp lại
// Notification sẽ tự hiện khi trang load, không cần thêm gì
