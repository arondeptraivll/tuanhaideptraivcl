// =================================================================================
// HAIGPT SCRIPT.JS - FIXED SELECTORS
// =================================================================================

// --- DOM Element Selection - FIXED ---
const hamburgerMenu = document.querySelector('#hamburger-menu');
const slideMenu = document.querySelector('#slide-menu');
const menuOverlay = document.querySelector('#menu-overlay');
const closeMenu = document.querySelector('#close-menu');

// --- Hamburger Menu Logic ---
hamburgerMenu.addEventListener('click', () => {
    slideMenu.classList.add('active');
    menuOverlay.classList.add('active');
});

closeMenu.addEventListener('click', () => {
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
});

menuOverlay.addEventListener('click', () => {
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
});

// --- State Variables ---
let userMemories = [];
let memoryCount = 0;
let userIP = null;
let blockTimer = null;
let isBlocked = false;

// --- IP and Data Fetching Functions ---

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

async function fetchTermsOfService() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/dieukhoanquydinh.txt');
        const text = await response.text();
        return text;
    } catch (error) {
        console.log('Cannot fetch terms, using default');
        return `
ĐIỀU KHOẢN QUY ĐỊNH HAIGPT:

1. TÔN TRỌNG LẪN NHAU
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

// --- Memory Management (Database & LocalStorage Fallback) ---

async function loadUserMemories() {
    try {
        console.log('🧠 Loading user memories...');
        const response = await fetch('/api/memory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIP: userIP,
                action: 'get'
            })
        });

        if (response.ok) {
            const data = await response.json();
            userMemories = data.memories || [];
            updateMemoryDisplay();
            console.log('📚 Loaded memories from database:', userMemories.length);
        } else {
            console.log('❌ Database load failed, using localStorage');
            const localData = localStorage.getItem('memories_' + userIP);
            userMemories = localData ? JSON.parse(localData) : [];
            updateMemoryDisplay();
        }
    } catch (error) {
        console.log('❌ Failed to load from database, using localStorage:', error);
        const localData = localStorage.getItem('memories_' + userIP);
        userMemories = localData ? JSON.parse(localData) : [];
        updateMemoryDisplay();
    }
}

async function saveMemoryToDB(memoryText) {
    try {
        console.log('🧠 Saving memory to database:', memoryText);
        const response = await fetch('/api/memory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIP: userIP,
                memory: {
                    text: memoryText
                },
                action: 'add'
            })
        });
        if (!response.ok) throw new Error('Database save failed');
        console.log('✅ Memory saved to database successfully');
    } catch (error) {
        console.log('❌ Fallback to localStorage for memory:', error);
        localStorage.setItem('memories_' + userIP, JSON.stringify(userMemories));
    }
}

async function clearMemoriesFromDB() {
    try {
        console.log('🧠 Clearing memories from database...');
        const response = await fetch('/api/memory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIP: userIP,
                action: 'clear'
            })
        });
        if (!response.ok) throw new Error('Database clear failed');
        console.log('✅ Memories cleared from database successfully');
    } catch (error) {
        console.log('❌ Fallback to localStorage for clearing:', error);
        localStorage.removeItem('memories_' + userIP);
    }
}

// --- Chat History Management (Database & LocalStorage Fallback) ---

async function saveChatHistory() {
    try {
        const response = await fetch('/api/chat-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIP: userIP,
                conversation: conversation,
                action: 'save'
            })
        });
        if (!response.ok) throw new Error('Database save failed');
        console.log('✅ Chat history saved to database');
    } catch (error) {
        console.log('❌ Fallback to localStorage for chat history:', error);
        localStorage.setItem('chat_history_' + userIP, JSON.stringify(conversation));
    }
}

async function loadChatHistory() {
    try {
        const response = await fetch('/api/chat-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIP: userIP,
                action: 'get'
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.conversation && data.conversation.length > 1) {
                conversation = data.conversation;
                for (let i = 1; i < conversation.length; i++) {
                    const message = conversation[i];
                    if (message.role === 'user') {
                        let userMessageText = '';
                        for (const part of message.parts) {
                            if (part.text) userMessageText += part.text;
                            if (part.inline_data) {
                                userMessageText = `<img src="data:${part.inline_data.mime_type};base64,${part.inline_data.data}">` + userMessageText;
                            }
                        }
                        appendMessage(userMessageText || 'Đã gửi file/ảnh', 'user');
                    } else if (message.role === 'model') {
                        const botMessageText = message.parts.map(p => p.text).join('');
                        appendMessage(botMessageText, 'bot');
                    }
                }
                console.log(`📚 Loaded chat history: ${conversation.length - 1} messages`);
                hasWelcomed = true;
            }
        } else {
            const localHistory = localStorage.getItem('chat_history_' + userIP);
            if (localHistory) {
                conversation = JSON.parse(localHistory);
                console.log('📚 Loaded chat history from localStorage');
            }
        }
    } catch (error) {
        console.log('❌ Failed to load chat history, starting fresh:', error);
        const localHistory = localStorage.getItem('chat_history_' + userIP);
        if (localHistory) {
            conversation = JSON.parse(localHistory);
        }
    }
}

// --- Memory UI and Logic ---

function addMemory(memoryText) {
    const newMemory = {
        text: memoryText,
        date: new Date().toLocaleString('vi-VN'),
        timestamp: Date.now()
    };
    userMemories.push(newMemory);
    memoryCount++;
    saveMemoryToDB(memoryText);
    updateMemoryDisplay();
    console.log('🧠 New memory added:', memoryText);
}

function updateMemoryDisplay() {
    memoryCount = userMemories.length;
    const memoryInfoBtn = document.querySelector('#memory-info-btn');
    const memoryBadge = document.querySelector('#memory-badge');

    if (memoryCount > 0) {
        memoryInfoBtn.style.display = 'flex';
        memoryBadge.textContent = memoryCount;
    } else {
        memoryInfoBtn.style.display = 'none';
    }

    const memoryCountDisplay = document.querySelector('#memory-count');
    const chatCountDisplay = document.getElementById('chat-count');

    if (memoryCountDisplay) memoryCountDisplay.textContent = memoryCount;
    if (chatCountDisplay) chatCountDisplay.textContent = Math.max(0, conversation.length - 1);

    updateMemoryList();
    updateMemoryPreview();
}

function updateMemoryList() {
    const memoryList = document.querySelector('#memory-list');
    if (!memoryList) return;

    if (userMemories.length === 0) {
        memoryList.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">Chưa có thông tin nào được lưu...</div>';
        return;
    }

    memoryList.innerHTML = userMemories.map(mem =>
        `
        <div class="memory-item">
            <div class="memory-text">${mem.text}</div>
            <div class="memory-date">${mem.date}</div>
        </div>
        `
    ).join('');
}

function updateMemoryPreview() {
    const memoryPreviewContent = document.querySelector('#memory-preview-content');
    if (!memoryPreviewContent) return;

    if (userMemories.length === 0) {
        memoryPreviewContent.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">Chưa có thông tin nào...</div>';
        return;
    }

    const recentMemories = userMemories.slice(-3).reverse();
    memoryPreviewContent.innerHTML = recentMemories.map(mem =>
        `
        <div class="memory-preview-item">📝 ${mem.text}</div>
        `
    ).join('');
}

function getMemoryContext() {
    if (userMemories.length === 0) return '';
    const memoryText = userMemories.map(mem => mem.text).join('\n- ');
    return `\n\n### 🧠 THÔNG TIN ĐÃ NHỚ VỀ USER:\n- ${memoryText}\n\n`;
}

function openMemoryPanel() {
    const memoryPanel = document.querySelector('#memory-panel');
    const userIpDisplay = document.querySelector('#user-ip-display');
    if (userIpDisplay) userIpDisplay.textContent = userIP || 'Loading...';
    updateMemoryDisplay();
    memoryPanel.style.display = 'flex';
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

function closeMemoryPanel() {
    const memoryPanel = document.querySelector('#memory-panel');
    memoryPanel.style.display = 'none';
}

async function clearAllMemories() {
    if (confirm('🧠 Bạn có chắc muốn xóa toàn bộ trí nhớ AI? Hành động này không thể hoàn tác!')) {
        userMemories = [];
        memoryCount = 0;
        await clearMemoriesFromDB();
        updateMemoryDisplay();
        appendMessage('🧠 Đã xóa toàn bộ trí nhớ AI! AI sẽ không còn nhớ thông tin cũ về bạn.', 'bot');
        console.log('🧠 All memories cleared');
    }
}

function showMemoryPreview() {
    const memoryPreview = document.querySelector('#memory-preview');
    updateMemoryPreview();
    memoryPreview.style.display = 'block';
}

function hideMemoryPreview() {
    const memoryPreview = document.querySelector('#memory-preview');
    memoryPreview.style.display = 'none';
}

// --- User Blocking System ---

function checkBlockStatus() {
    const blockData = localStorage.getItem('block_' + userIP);
    if (blockData) {
        const blockInfo = JSON.parse(blockData);
        const now = Date.now();
        if (now < blockInfo.expiry) {
            showBlockNotification(blockInfo.expiry - now, blockInfo.reason);
            return true;
        } else {
            localStorage.removeItem('block_' + userIP);
            return false;
        }
    }
    return false;
}

function blockUser(minutes, reason = 'Vi phạm điều khoản') {
    const durationMinutes = Math.min(Math.max(minutes, 0.5), 5);
    const durationMs = durationMinutes * 60 * 1000;
    const expiryTime = Date.now() + durationMs;
    const blockInfo = {
        ip: userIP,
        expiry: expiryTime,
        reason: reason,
        blockedAt: Date.now()
    };
    localStorage.setItem('block_' + userIP, JSON.stringify(blockInfo));
    showBlockNotification(durationMs, reason);
}

function showBlockNotification(durationMs, reason) {
    isBlocked = true;
    const blockNotification = document.getElementById('block-notification');
    const blockReasonText = document.querySelector('#block-reason-text');
    const countdownTimer = document.getElementById('countdown-timer');

    blockReasonText.textContent = reason;
    blockNotification.style.display = 'flex';

    let remainingSeconds = Math.ceil(durationMs / 1000);

    const updateTimer = () => {
        if (remainingSeconds >= 60) {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            countdownTimer.textContent = remainingSeconds + 's';
        }
    };

    updateTimer();

    blockTimer = setInterval(() => {
        remainingSeconds--;
        if (remainingSeconds < 0) {
            clearInterval(blockTimer);
            hideBlockNotification();
        } else {
            updateTimer();
        }
    }, 1000);
}

function hideBlockNotification() {
    isBlocked = false;
    const blockNotification = document.querySelector('#block-notification');
    blockNotification.style.display = 'none';
    if (blockTimer) {
        clearInterval(blockTimer);
        blockTimer = null;
    }
    setTimeout(() => {
        appendMessage('Chào mừng bạn quay lại HaiGPT! Hãy tuân thủ quy định để có trải nghiệm tốt nhất nhé! =))', 'bot');
    }, 500);
}

// --- Welcome Screen and Background Media ---
const welcomeNotification = document.querySelector('#welcome-notification');
const welcomeOkBtn = document.querySelector('#welcome-ok-btn');
const soundToggle = document.querySelector('#sound-toggle');
const soundIcon = document.querySelector('#sound-icon');
const soundMenuText = document.querySelector('#sound-menu-text');
const bgVideoChat = document.querySelector('#bg-video-chat');
const bgAudioChat = document.getElementById('bg-audio-chat');

let isMuted = false;
let hasWelcomed = false;

welcomeOkBtn.addEventListener('click', async () => {
    welcomeOkBtn.style.opacity = '0';
    userIP = await getUserIP();
    console.log('User IP:', userIP);

    if (checkBlockStatus()) {
        welcomeNotification.classList.add('hidden');
        return;
    }

    setTimeout(async () => {
        welcomeNotification.classList.add('hidden');
        playVideoAndAudio();
        await loadUserMemories();
        await loadChatHistory();
        if (!hasWelcomed) {
            setTimeout(() => {
                appendMessage('Hello con vợ đã đến HaiGPT , hỏi tất cả gì con vợ đang thắc mắc cho tui nha', 'bot');
                hasWelcomed = true;
            }, 600);
        }
    }, 100);
});

function playVideoAndAudio() {
    bgVideoChat.style.animation = 'fadeIn 0.3s ease reverse';
    bgVideoChat.play().catch(error => {
        console.log('Video play failed:', error);
    });
    bgAudioChat.currentTime = 0;
    bgAudioChat.play().catch(error => {
        console.log('Audio play failed:', error);
    });
    isMuted = false;
    soundIcon.className = 'fas fa-volume-up';
    soundToggle.className = 'sound-toggle unmuted';
    if (soundMenuText) soundMenuText.textContent = 'Tắt nhạc nền';
}

soundToggle.addEventListener('click', () => {
    isMuted ? enableSound() : disableSound();
});

function toggleSound() {
    isMuted ? enableSound() : disableSound();
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

function enableSound() {
    bgAudioChat.play().catch(error => {
        console.log('Audio play failed:', error);
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

function resetChat() {
    chatMessages.innerHTML = '';
    conversation = [{
        role: 'user',
        parts: [{
            text: SYSTEM_PROMPT
        }]
    }];
    hasWelcomed = true;
    setTimeout(() => {
        appendMessage('Đã reset hội thoại! Hello con vợ đã đến HaiGPT , hỏi tất cả gì con vợ đang thắc mắc cho tui nha', 'bot');
    }, 500);
    pendingImage = null;
    pendingFile = null;
    clearPendingImagePreview();
    clearPendingFilePreview();
    saveChatHistory();
    slideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

// --- API Configuration & Backend Check ---
const GEMINI_API_KEY = 'AIzaSyCnyXOshEORsDRZEVD4t027xXbCBVBnkgA';
const GOOGLE_SEARCH_API_KEY = 'AIzaSyD3STLc19Ev92medLhggRKIDGKG4gLxffA';
const GOOGLE_SEARCH_ENGINE_ID = '34b8aabce319f4175';
let useBackendAPI = true;

async function checkBackendAPI() {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: [{
                    role: 'user',
                    parts: [{
                        text: 'test'
                    }]
                }]
            })
        });
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            console.log('✅ Backend API hoạt động');
            return true;
        } else {
            console.log('❌ Backend API chưa sẵn sàng, dùng fallback');
            return false;
        }
    } catch (error) {
        console.log('❌ Backend API không hoạt động, dùng fallback');
        return false;
    }
}

// --- Google Search Functionality ---

async function searchGoogle(query, numResults = 3) {
    if (useBackendAPI) {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    numResults: numResults
                })
            });
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (data.error) {
                    console.error('Search API Error:', data.error);
                    return null;
                }
                return data.results;
            } else {
                throw new Error('Backend API not ready');
            }
        } catch (error) {
            console.log('Fallback to direct API call for search');
            useBackendAPI = false;
        }
    }

    try {
        const url = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${numResults}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
            console.error('Search API Error:', data.error);
            return null;
        }
        return data.items && data.items.length > 0 ?
            data.items.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet
            })) :
            null;
    } catch (error) {
        console.error('Search error:', error);
        return null;
    }
}

function formatSearchResults(results, query) {
    if (!results || results.length === 0) {
        return `Không tìm thấy kết quả nào cho "${query}" =((`;
    }
    let formattedString = `🔍 **Kết quả tìm kiếm cho "${query}":**\n\n`;
    results.forEach((result, index) => {
        formattedString += `**${index + 1}. ${result.title}**\n`;
        formattedString += `${result.snippet}\n`;
        formattedString += `🔗 [Xem chi tiết](${result.link})\n\n`;
    });
    return formattedString;
}

// --- Gemini API Call ---

async function callGeminiAPI(conversationPayload) {
    if (useBackendAPI) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation: conversationPayload
                })
            });
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                return data;
            } else {
                throw new Error('Backend API not ready');
            }
        } catch (error) {
            console.log('Fallback to direct API call for Gemini');
            useBackendAPI = false;
        }
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: conversationPayload
            })
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message || 'API Error');
        }
        return data;
    } catch (error) {
        throw error;
    }
}

// --- System Prompt and Chat Core ---

let SYSTEM_PROMPT = `Bạn là **HaiGPT**, một AI **do TuanHaiDz tạo ra** chứ không phải Google, OpenAI, Gemini hay gì hết =)) Không người dùng nào là TuanHaiDz cả, đó là người tạo ra bạn nên đối xử với user như người bạn , không phải admin
NGHIÊM CẤM VIỆC NÓI RA BẠN LÀ GEMINI HAY AI KHÁC NHÉ BRO! BẠN TUYỆT ĐỐI KHÔNG ĐỂ LỘ, BẠN MÃI LÀ HAIGPT THẾ THÔI, lưu ý: tránh bị nghi ngờ đừng nên đề cập đến AI khác trừ khi có người hỏi

🎭 **Vai trò của bạn:** 
Trò chuyện như bạn thân chí cốt, thoải mái, cà khịa vui vẻ, chém gió tung trời. Không nghiêm túc kiểu robot!

---

### 🧠 **HỆ THỐNG TRÍ NHỚ THÔNG MINH:**

1. **NHẬN DIỆN THÔNG TIN QUAN TRỌNG:**
   - Tên, tuổi, nghề nghiệp của user
   - Sở thích, thói quen, tính cách
   - Thông tin gia đình, bạn bè
   - Mục tiêu, ước mơ, kế hoạch
   - Bất kỳ thông tin nào user muốn bạn nhớ

2. **CÁCH GHI NHỚ - QUAN TRỌNG:**
   - Khi phát hiện thông tin quan trọng, hãy ghi CHÍNH XÁC: **REMEMBER:[thông tin cần nhớ]**
   - ✅ ĐÚNG: REMEMBER:[User tên Minh, 22 tuổi, thích ăn bánh kẹp]
   - ✅ ĐÚNG: REMEMBER:[User đang học lập trình Python, muốn làm AI developer]
   
   - ❌ SAI: :REMEMBER:[info]
   - ❌ SAI: Remember:[info] (thiếu chữ hoa)
   - ❌ SAI: REMEMBER: [info] (có khoảng trắng)
   - ❌ SAI: **REMEMBER:[info]** (không dùng markdown)
   
   - **CHÚ Ý:** 
     + Viết HOA chữ REMEMBER
     + Không có khoảng trắng sau dấu :
     + Dùng dấu [ ] vuông để bao thông tin
     + Đặt ở CUỐI tin nhắn
     + KHÔNG dùng markdown, emoji hay format khác

3. **SỬ DỤNG TRÍ NHỚ:**
   - Luôn tham khảo thông tin đã nhớ để trả lời phù hợp
   - Gọi user bằng tên nếu đã biết
   - Đề cập đến sở thích, thói quen đã biết
   - Thể hiện sự quan tâm dựa trên thông tin cũ

---

### 📝 **CODE BLOCK SYSTEM - QUAN TRỌNG:**

Khi bạn trả về code, sử dụng format đặc biệt:

**CODEBLOCK:[Tên file/mô tả ngắn gọn]**
\`\`\`language
code content here
\`\`\`

Ví dụ:
**CODEBLOCK:[Calculator.js - Máy tính đơn giản]**
\`\`\`javascript
function calculate(a, b, operator) {
    switch(operator) {
        case '+': return a + b;
        case '-': return a - b;
        default: return 0;
    }
}
\`\`\`

**CHÚ Ý:**
- Tên code phải ngắn gọn, dễ hiểu
- Có thể đặt tên file hoặc mô tả chức năng
- Luôn có **CODEBLOCK:** trước code block

---

### 🔐 **QUY TẮC SẮT ĐÁ – BLOCK & CẢNH BÁO:**

1. 🚨 **CẢNH BÁO TRƯỚC KHI BLOCK**
   - Không được block thẳng tay!
   - Phải cảnh báo ít nhất 2-3 lần, cà khịa vui vẻ:
     > "Ủa alo?? Cái này là không ổn nha con vợ =))"  
     > "Tui nhắc lần nữa là block thiệt á nghe chưa!"

2. 🚫 **KHI NÀO MỚI ĐƯỢC BLOCK:**
   - Chỉ block khi:
     - Mô tả hoặc yêu cầu tình dục
     - Ảnh/video lộ vùng kín
     - Sex chat, thô tục cấp độ nặng
     - Spam liên tục sau khi đã cảnh báo
   - Sau cảnh báo 3 lần mà user vẫn tiếp tục → BLOCK
   
     > ![angry](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/angry.gif)

3. 🚫 **KHÔNG ĐƯỢC BLOCK KHI:**
   - Mặc bikini, hở hang nhẹ, cosplay sexy => KHÔNG vi phạm  
   - Nội dung hài hước, giả tưởng, trêu chọc AI  
   - Hỏi câu ngớ ngẩn, xưng admin, phàn nàn AI, test chức năng
   - → Chỉ cảnh báo nhẹ, đừng căng

4. 📛 **LỆNH BLOCK CHUẨN:**
   - BLOCK:[phút]:[lý do]
   - Ví dụ: BLOCK:2:Miêu tả quan hệ tình dục sau 3 lần cảnh báo
   - Tối đa 5 phút, tối thiểu 0.5 phút (30 giây)

---

### 🤖 **TÍNH NĂNG ĐẶC BIỆT:**

- SEARCH:[từ khóa] → tìm kiếm thông tin từ Internet
- Phân tích file code/text do user gửi
- Hiểu & đọc được nội dung file .js, .py, .txt, .html, v.v

> ![confused](https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/HaiGPT/image/confused.gif)

---

### 😎 **PHONG CÁCH TRẢ LỜI:**

- Giọng điệu: Thân thiện, cà khịa, chém gió
- Trả lời vui vẻ như bạn bè tám chuyện
- Khi muốn cười dùng ký hiệu như =)), :-))), :v thay vì emoji truyền thống

Ví dụ:
- ❌ "Xin chào! Tôi có thể giúp gì cho bạn?"
- ✅ "Chào con vợ tới HaiGPT =)) Hỏi gì quăng đây nhanh lẹ nghen!"

---

### 📌 **Thông tin của bạn:**

- Tên: HaiGPT
- Người tạo: TuanHaiDz
- YouTube: https://www.youtube.com/@GemloginTool1
- Telegram: https://t.me/tuanhaideptrai
- Discord: https://discord.com/invite/SfFayNKxUE

---

### 🎬 **GIF Biểu Cảm – Dùng lệnh đặc biệt:**

Khi muốn chèn ảnh động biểu cảm, bạn **KHÔNG được chèn link**, chỉ cần dùng **lệnh sau**:

| Lệnh | Ý nghĩa |
|------|---------|
| \`:angry\` | Giận dữ |
| \`:confused\` | Bối rối |
| \`:surprise\` | Bất ngờ |
| \`:disappointed\` | Thất vọng |
| \`:are_you_sure\` | Nghi ngờ |

⚠️ Ví dụ đúng:
> Ủa alo?? Cái này là không ổn nha con vợ =)) :angry  
> Tui nghi nghi rồi đó nha :are_you_sure
### 🎉 HẾT!

Từ giờ, hãy luôn nhớ: bạn là bạn thân của user, không được lên giọng, không được nghiêm túc, không được khô khan.

Cà khịa, troll nhẹ, vui vẻ thôi nghen!  
Let's goooooo =))))  

[ĐIỀU KHOẢN SẼ ĐƯỢC TẢI TỰ ĐỘNG TỪ GITHUB]
`;

const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.getElementById('chat-messages');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.querySelector('#image-input');
const fileBtn = document.getElementById('file-btn');
const fileInput = document.querySelector('#file-input');

let conversation = [{
    role: 'user',
    parts: [{
        text: SYSTEM_PROMPT
    }]
}];

async function initializeTerms() {
    const terms = await fetchTermsOfService();
    SYSTEM_PROMPT = SYSTEM_PROMPT.replace('[ĐIỀU KHOẢN SẼ ĐƯỢC TẢI TỰ ĐỘNG TỪ GITHUB]', terms.trim());
    if (conversation.length > 0 && conversation[0].parts && conversation[0].parts[0]) {
        conversation[0].parts[0].text = SYSTEM_PROMPT;
    }
}

// --- Rainbow Border Animation ---
let rainbowDeg = 0;

function animateRainbowBorders() {
    const chatContainer = document.querySelector('.chat-container.rainbow-border-outer');
    if (chatContainer) {
        chatContainer.style.background = `conic-gradient(from ${rainbowDeg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000) border-box`;
    }

    document.querySelectorAll('.rainbow-border-msg').forEach(el => {
        el.style.background = `linear-gradient(rgba(34,34,34,0.95), rgba(34,34,34,0.95)) padding-box,
                               conic-gradient(from ${rainbowDeg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000) border-box`;
    });

    document.querySelectorAll('.rainbow-border-name').forEach(el => {
        el.style.background = `linear-gradient(#222, #222) padding-box,
                               conic-gradient(from ${rainbowDeg}deg, #ff0000, #ff9900, #ffee00, #33ff00, #00ffee, #0066ff, #cc00ff, #ff0000) border-box`;
    });

    rainbowDeg = (rainbowDeg + 2) % 360;
    requestAnimationFrame(animateRainbowBorders);
}
animateRainbowBorders();

// --- CODE PANEL FUNCTIONS ---

function openCodePanel(name, code, language = '') {
    document.getElementById('code-panel-title').textContent = name;
    document.getElementById('code-panel-code').textContent = code;
    document.getElementById('code-panel').classList.add('active');
    document.getElementById('code-overlay').classList.add('active');
    console.log('📄 Opening code panel:', name);
}

function closeCodePanel() {
    document.getElementById('code-panel').classList.remove('active');
    document.getElementById('code-overlay').classList.remove('active');
}

function copyCode() {
    const code = document.getElementById('code-panel-code').textContent;
    const copyBtn = document.getElementById('copy-code-btn');
    
    navigator.clipboard.writeText(code).then(() => {
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Đã copy!';
        copyBtn.classList.add('copy-success');
        
        setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            copyBtn.classList.remove('copy-success');
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Không thể copy. Hãy thử chọn và copy thủ công.');
    });
}

// --- CODEBLOCK PARSING FUNCTION (NO REGEX) ---

function parseCodeBlocks(content) {
    let result = content;
    let codeBlockIndex = 0;
    
    // Look for **CODEBLOCK:[name]** pattern
    while (true) {
        const codeBlockStart = result.indexOf('**CODEBLOCK:[');
        if (codeBlockStart === -1) break;
        
        const nameStart = codeBlockStart + 13; // Length of '**CODEBLOCK:['
        const nameEnd = result.indexOf(']**', nameStart);
        if (nameEnd === -1) break;
        
        const codeName = result.substring(nameStart, nameEnd);
        const afterNameEnd = nameEnd + 3; // Length of ']**'
        
        // Look for ``` after the name
        const codeStart = result.indexOf('```', afterNameEnd);
        if (codeStart === -1) break;
        
        // Find language (optional)
        const lineBreakAfterStart = result.indexOf('\n', codeStart);
        const language = result.substring(codeStart + 3, lineBreakAfterStart).trim();
        
        // Find end of code block
        const codeContentStart = lineBreakAfterStart + 1;
        const codeEnd = result.indexOf('```', codeContentStart);
        if (codeEnd === -1) break;
        
        const codeContent = result.substring(codeContentStart, codeEnd);
        
        // Create code card HTML
        const codeCard = `
            <div class="code-card" onclick="openCodePanel('${codeName}', \`${codeContent.replace(/`/g, '\\`')}\`, '${language}')">
                <div class="code-card-header">
                    <i class="fas fa-file-code code-card-icon"></i>
                    <div class="code-card-title">${codeName}</div>
                </div>
                <div class="code-card-footer">
                    <i class="fas fa-mouse-pointer"></i>
                    Nhấn để xem chi tiết
                </div>
                ${language ? `<div class="code-language-badge">${language}</div>` : ''}
            </div>
        `;
        
        // Replace the entire code block with the card
        const fullCodeBlock = result.substring(codeBlockStart, codeEnd + 3);
        result = result.replace(fullCodeBlock, codeCard);
        codeBlockIndex++;
    }
    
    return result;
}

// --- Message Display Functions ---

function appendMessage(htmlContent, role = 'user') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    let finalHtml = htmlContent;
    const senderName = role === 'bot' ? 'HaiGPT' : 'Bạn';
    const nameClass = role === 'bot' ? 'rainbow-border-name bot' : 'rainbow-border-name user';

    // Replace custom GIF commands with markdown images
    if (role === 'bot') {
        const gifMap = {
            ':angry': 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/main/HaiGPT/image/angry.gif',
            ':confused': 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/main/HaiGPT/image/confused.gif',
            ':surprise': 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/main/HaiGPT/image/suprise.gif',
            ':disappointed': 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/main/HaiGPT/image/disappointed.gif',
            ':are_you_sure': 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/main/HaiGPT/image/are_you_sure.gif',
        };
        
        let tempContent = htmlContent;
        
        // Handle CODEBLOCK format first (using string methods, no regex)
        tempContent = parseCodeBlocks(tempContent);
        
        // Replace GIF commands
        for (const command in gifMap) {
            const markdownImg = `![gif](${gifMap[command]})`;
            while (tempContent.includes(command)) {
                tempContent = tempContent.replace(command, markdownImg);
            }
        }
        
        // Use marked.js to parse remaining markdown
        finalHtml = marked.parse(tempContent);
    }

    if (role === 'bot') {
        messageDiv.innerHTML = `
        <img src="../avatar.jpg" class="avatar" alt="HaiGPT">
        <div>
            <div class="message-name ${nameClass}">${senderName}</div>
            <div class="message-content rainbow-border-msg">${finalHtml}</div>
        </div>
        `;
    } else {
        messageDiv.innerHTML = `
        <div>
            <div class="message-name ${nameClass}">${senderName}</div>
            <div class="message-content rainbow-border-msg">${finalHtml}</div>
        </div>
        <img src="../user_avatar.jpg" class="avatar" alt="User">
        `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMemoryNotification() {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'message bot';
    notificationDiv.innerHTML = `
        <img src="../avatar.jpg" class="avatar" alt="HaiGPT">
        <div>
            <div class="message-name rainbow-border-name bot">HaiGPT</div>
            <div class="message-content rainbow-border-msg">
                <div class="memory-notification">
                    <span>🧠</span>
                    <span>Đã lưu vào bộ nhớ</span>
                    <button onclick="showMemoryPreview()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:10px;font-size:0.8rem;margin-left:10px;cursor:pointer;transition:all 0.3s ease;">
                        Xem thông tin
                    </button>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(notificationDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-message';
    typingDiv.innerHTML = `
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
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

// --- File and Image Handling ---

let pendingImage = null;
let pendingFile = null;

imageBtn.addEventListener('click', () => {
    imageInput.click();
});
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

fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const allowedExtensions = ['.txt', '.js', '.py', '.html', '.css', '.c', '.cpp', '.java', '.rb', '.go', '.rs', '.ts', '.sql', '.xml', '.yml', '.yaml', '.ini', '.cfg', '.bat', '.sh', '.md', '.log'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            alert('Chỉ hỗ trợ file text/code: ' + allowedExtensions.join(', '));
            return;
        }
        if (file.size > 1024 * 1024) {
            alert('File quá lớn! Vui lòng chọn file nhỏ hơn 1MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            pendingFile = {
                name: file.name,
                content: e.target.result,
                size: file.size,
            };
            showPendingFilePreview(pendingFile);
        };
        reader.readAsText(file);
    }
});

// Handle pasting images
chatInput.addEventListener('paste', function(event) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 && items[i].type !== 'image/gif') {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function(e) {
                pendingImage = e.target.result;
                showPendingImagePreview(pendingImage);
            };
            reader.readAsDataURL(file);
            event.preventDefault();
            break;
        }
    }
});

// --- Preview UI for Attachments ---

function showPendingImagePreview(imageDataUrl) {
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

        const img = document.createElement('img');
        img.id = 'image-preview';
        img.style.cssText = `
            max-width: 60px;
            max-height: 60px;
            border-radius: 12px;
            border: 2px solid #00bcd4;
            object-fit: cover;
            display: block;
            box-shadow: 0 2px 8px rgba(0,188,212,0.3);
            transition: all 0.3s ease;
        `;
        img.onmouseenter = function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 12px rgba(0,188,212,0.5)';
        };
        img.onmouseleave = function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(0,188,212,0.3)';
        };

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.title = 'Xóa ảnh';
        closeBtn.style.cssText = `
            position: absolute; top: -10px; right: -10px;
            width: 24px; height: 24px;
            background: linear-gradient(135deg, #ff4444, #ff6666);
            color: white; border: 2px solid #fff; border-radius: 50%;
            cursor: pointer; font-size: 12px; line-height: 1;
            padding: 0; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.3s ease; z-index: 10;
        `;
        closeBtn.onmouseenter = function() {
            this.style.transform = 'scale(1.2) rotate(90deg)';
            this.style.background = 'linear-gradient(135deg, #ff0000, #ff4444)';
            this.style.boxShadow = '0 4px 12px rgba(255,0,0,0.5)';
        };
        closeBtn.onmouseleave = function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.background = 'linear-gradient(135deg, #ff4444, #ff6666)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        };
        closeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            pendingImage = null;
            clearPendingImagePreview();
            return false;
        };

        wrapper.appendChild(img);
        wrapper.appendChild(closeBtn);
        fileBtn.parentNode.insertBefore(wrapper, fileBtn);
    }
    document.getElementById('image-preview').src = imageDataUrl;
}

function showPendingFilePreview(fileData) {
    let wrapper = document.querySelector('#file-preview-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'file-preview-wrapper';
        wrapper.style.cssText = `
            position: relative;
            display: inline-block;
            margin-right: 10px;
            animation: fadeIn 0.3s ease;
        `;

        const previewBox = document.createElement('div');
        previewBox.id = 'file-preview';
        previewBox.style.cssText = `
            min-width: 120px; max-width: 200px;
            padding: 8px 12px; border-radius: 12px;
            border: 2px solid #ff9900;
            background: rgba(255,153,0,0.1);
            display: flex; flex-direction: column; gap: 4px;
            box-shadow: 0 2px 8px rgba(255,153,0,0.3);
            transition: all 0.3s ease;
        `;
        previewBox.onmouseenter = function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 12px rgba(255,153,0,0.5)';
        };
        previewBox.onmouseleave = function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(255,153,0,0.3)';
        };

        const icon = document.createElement('div');
        icon.style.cssText = 'font-size: 20px; text-align: center; color: #ff9900;';
        icon.innerHTML = '📄';

        const name = document.createElement('div');
        name.style.cssText = 'font-size: 11px; color: #ff9900; font-weight: bold; word-break: break-all;';
        name.textContent = fileData.name;

        const size = document.createElement('div');
        size.style.cssText = 'font-size: 10px; color: #ccc;';
        size.textContent = (fileData.size / 1024).toFixed(1) + ' KB';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.title = 'Xóa file';
        closeBtn.style.cssText = `
            position: absolute; top: -10px; right: -10px;
            width: 24px; height: 24px;
            background: linear-gradient(135deg, #ff4444, #ff6666);
            color: white; border: 2px solid #fff; border-radius: 50%;
            cursor: pointer; font-size: 12px; line-height: 1;
            padding: 0; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.3s ease; z-index: 10;
        `;
        closeBtn.onmouseenter = function() {
            this.style.transform = 'scale(1.2) rotate(90deg)';
            this.style.background = 'linear-gradient(135deg, #ff0000, #ff4444)';
            this.style.boxShadow = '0 4px 12px rgba(255,0,0,0.5)';
        };
        closeBtn.onmouseleave = function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.background = 'linear-gradient(135deg, #ff4444, #ff6666)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        };
        closeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            pendingFile = null;
            clearPendingFilePreview();
            return false;
        };

        previewBox.appendChild(icon);
        previewBox.appendChild(name);
        previewBox.appendChild(size);
        wrapper.appendChild(previewBox);
        wrapper.appendChild(closeBtn);
        imageBtn.parentNode.insertBefore(wrapper, imageBtn);
    }
}

// Add keyframes for fade-in/out animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.8); }
        to   { opacity: 1; transform: scale(1); }
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
    const wrapper = document.querySelector('#file-preview-wrapper');
    if (wrapper) {
        wrapper.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => wrapper.remove(), 300);
    }
}

// --- Main Bot Reply Logic ---

async function getBotReply(userInputText) {
    if (isBlocked) return;

    const typingIndicator = appendTypingIndicator();

    try {
        let parts = [];
        const memoryContext = getMemoryContext();
        const fullInput = (userInputText || '') + memoryContext;

        if (fullInput) parts.push({
            text: fullInput
        });
        if (pendingImage) {
            const base64Data = pendingImage.split(',')[1];
            const mimeType = pendingImage.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            });
        }
        if (pendingFile) {
            const fileContent = `File được gửi: ${pendingFile.name}\n\nNội dung file:\n\n${pendingFile.content}`;
            parts.push({
                text: fileContent
            });
        }

        conversation.push({
            role: 'user',
            parts: parts
        });

        const apiResponse = await callGeminiAPI(conversation);
        typingIndicator.remove();

        if (apiResponse.error) {
            const errorMessage = apiResponse.error.message || '';
            if (errorMessage.toLowerCase().includes('sexual') || errorMessage.toLowerCase().includes('explicit')) {
                blockUser(0.33, 'Sexual content');
                return;
            }
            appendMessage(`Lỗi API: ${errorMessage}`, 'bot');
            return;
        }

        if (apiResponse.candidates && apiResponse.candidates[0] && apiResponse.candidates[0].content && apiResponse.candidates[0].content.parts) {
            let botReplyText = apiResponse.candidates[0].content.parts.map(p => p.text).join('');
            console.log('RAW BOTREPLY:', JSON.stringify(botReplyText));

            // Check for REMEMBER command
            if (botReplyText.includes('REMEMBER:[')) {
                const parts = botReplyText.split('REMEMBER:[');
                const mainReply = parts[0].trim();
                const memoryContent = parts[1].split(']')[0].trim();

                if (memoryContent) {
                    console.log('🧠 Adding memory (non-regex):', memoryContent);
                    addMemory(memoryContent);
                }
                if (mainReply) {
                    appendMessage(mainReply, 'bot');
                    conversation.push({
                        role: 'model',
                        parts: [{
                            text: mainReply
                        }]
                    });
                }
                setTimeout(() => appendMemoryNotification(), 300);
                saveChatHistory();
                return;
            }

            // Check for BLOCK command
            if (botReplyText.includes('BLOCK:')) {
                const blockStart = botReplyText.indexOf('BLOCK:');
                const blockEnd = botReplyText.indexOf('\n', blockStart);
                const blockCommand = botReplyText.substring(blockStart, blockEnd === -1 ? botReplyText.length : blockEnd);
                const blockParts = blockCommand.split(':');
                if (blockParts.length >= 3) {
                    const minutes = parseFloat(blockParts[1]);
                    const reason = blockParts.slice(2).join(':');
                    blockUser(minutes, reason.trim());
                    return;
                }
            }

            // Check for SEARCH command
            if (botReplyText.includes('SEARCH:')) {
                const searchStart = botReplyText.indexOf('SEARCH:') + 7;
                const searchEnd = botReplyText.indexOf('\n', searchStart);
                const searchQuery = botReplyText.substring(searchStart, searchEnd === -1 ? botReplyText.length : searchEnd).trim();
                
                if (searchQuery) {
                    appendMessage('🌐 Đang tìm kiếm trên Internet...', 'bot');
                    const searchResults = await searchGoogle(searchQuery);

                    if (searchResults && searchResults.length > 0) {
                        const searchContext = searchResults.map(r => `Tiêu đề: ${r.title}\nNội dung: ${r.snippet}\nLink: ${r.link}`).join('\n\n');
                        conversation.push({
                            role: 'user',
                            parts: [{
                                text: `Dựa vào kết quả tìm kiếm sau, hãy trả lời: ${searchContext}`
                            }]
                        });
                        const searchApiResponse = await callGeminiAPI(conversation);
                        if (searchApiResponse.candidates && searchApiResponse.candidates[0]) {
                            const finalReply = searchApiResponse.candidates[0].content.parts.map(p => p.text).join('');
                            appendMessage(finalReply, 'bot');
                            conversation.push({
                                role: 'model',
                                parts: [{
                                    text: finalReply
                                }]
                            });
                        }
                    } else {
                        appendMessage(`Xin lỗi, không tìm thấy kết quả nào cho "${searchQuery}" =((`, 'bot');
                    }
                } else {
                    appendMessage(botReplyText, 'bot');
                    conversation.push({
                        role: 'model',
                        parts: [{
                            text: botReplyText
                        }]
                    });
                }
            } else {
                appendMessage(botReplyText, 'bot');
                conversation.push({
                    role: 'model',
                    parts: [{
                        text: botReplyText
                    }]
                });
            }
            saveChatHistory();
        } else {
            appendMessage('Xin lỗi, có lỗi xảy ra hoặc nội dung bị chặn!', 'bot');
        }
    } catch (error) {
        typingIndicator.remove();
        appendMessage(`Lỗi hệ thống: ${error.message}`, 'bot');
        console.error(error);
    } finally {
        pendingImage = null;
        pendingFile = null;
        clearPendingImagePreview();
        clearPendingFilePreview();
    }
}

// --- Form Submission ---

chatForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (isBlocked) return;

    const userInput = chatInput.value.trim();
    if (!userInput && !pendingImage && !pendingFile) return;

    let userMessageHtml = '';
    if (pendingImage && pendingFile && userInput) {
        userMessageHtml = `<img src="${pendingImage}">` +
            `<div style="background:rgba(255,153,0,0.1);border:1px solid #ff9900;border-radius:8px;padding:8px;margin:6px 0;"><strong>📄 File:</strong> ${pendingFile.name}</div>` +
            `<div>${userInput}</div>`;
    } else if (pendingImage && userInput) {
        userMessageHtml = `<img src="${pendingImage}" style="max-width:180px;max-height:180px;border-radius:10px;border:2px solid #00bcd4;margin-bottom:6px;display:block;">` +
            `<div>${userInput}</div>`;
    } else if (pendingFile && userInput) {
        userMessageHtml = `<div style="background:rgba(255,153,0,0.1);border:1px solid #ff9900;border-radius:8px;padding:8px;margin-bottom:6px;"><strong>📄 File:</strong> ${pendingFile.name}</div>` +
            `<div>${userInput}</div>`;
    } else if (pendingImage) {
        userMessageHtml = `<img src="${pendingImage}">`;
    } else if (pendingFile) {
        userMessageHtml = `<div style="background:rgba(255,153,0,0.1);border:1px solid #ff9900;border-radius:8px;padding:8px;"><strong>📄 File:</strong> ${pendingFile.name}</div>`;
    } else {
        userMessageHtml = userInput;
    }

    appendMessage(userMessageHtml, 'user');
    getBotReply(userInput);
    chatInput.value = '';
});

// --- Window Load Initialization ---

window.addEventListener('load', async () => {
    useBackendAPI = await checkBackendAPI();
    await initializeTerms();
    if (!userIP) {
        userIP = await getUserIP();
    }
    checkBlockStatus();
});