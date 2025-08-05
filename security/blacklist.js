// Thư viện SweetAlert2
// <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

async function checkBlacklist(discordId) {
    // Địa chỉ raw file blacklist.txt
    const BLACKLIST_URL = 'https://raw.githubusercontent.com/arondeptraivll/tuanhaideptraivcl/refs/heads/main/blacklist.txt';

    try {
        // Lấy danh sách blacklist
        const res = await fetch(BLACKLIST_URL);
        const text = await res.text();
        const blacklist = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

        // Kiểm tra user có trong blacklist không
        if (blacklist.includes(discordId)) {
            showBlacklistAlert();
            return true;
        }
        return false;
    } catch (err) {
        console.error('Không thể kiểm tra blacklist:', err);
        // Nếu lỗi, cho phép sử dụng bình thường hoặc có thể báo lỗi tùy ý
        return false;
    }
}

function showBlacklistAlert() {
    // Khóa mọi thao tác, chỉ cho phép bấm OK trên SweetAlert2
    document.body.style.pointerEvents = 'none';

    Swal.fire({
        icon: 'error',
        title: 'Tài khoản bạn đã bị khóa',
        text: 'Bạn không thể sử dụng dịch vụ này. Vui lòng liên hệ admin nếu cần hỗ trợ.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: true,
        confirmButtonText: 'OK',
        didClose: () => {
            // Khi bấm OK, hiện lại alert lần nữa
            showBlacklistAlert();
        }
    });
}
