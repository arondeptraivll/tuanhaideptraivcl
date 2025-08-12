import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Lấy thông tin client
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    '127.0.0.1';

    console.log('🔍 Request từ IP:', clientIP);

    // ✅ Tạo token mới
    if (req.method === 'POST' && req.query.action === 'create') {
      console.log('📥 Yêu cầu tạo token từ IP:', clientIP);

      // 🛡️ BƯỚC 1: Xóa token hết hạn trước
      await cleanupExpiredTokens();

      // 🛡️ BƯỚC 2: Kiểm tra IP đã có token active chưa
      const existingToken = await checkExistingToken(clientIP);
      
      if (existingToken) {
        console.log('🚫 IP đã có token active, từ chối tạo mới');
        return res.status(429).json({ 
          success: false, 
          message: 'Bạn đã có token đang hoạt động. Vui lòng chờ hết hạn.',
          existing_token: {
            expires_at: existingToken.expires_at,
            time_remaining: getTimeRemaining(existingToken.expires_at)
          }
        });
      }

      // 🛡️ BƯỚC 3: Rate limiting - giới hạn số lần tạo token
      const recentAttempts = await checkRecentAttempts(clientIP);
      if (recentAttempts >= 5) { // Tối đa 5 lần trong 1 giờ
        console.log('🚫 IP vượt quá giới hạn tạo token');
        return res.status(429).json({ 
          success: false, 
          message: 'Bạn đã vượt quá giới hạn tạo token. Vui lòng thử lại sau 1 giờ.' 
        });
      }

      // 🛡️ BƯỚC 4: Tạo token mới
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 3); // 3 tiếng

      const { error } = await supabase
        .from('tokens')
        .insert([{
          token: token,
          client_ip: clientIP,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('❌ Lỗi tạo token:', error);
        return res.status(500).json({ success: false, message: 'Lỗi tạo token' });
      }

      console.log('✅ Token được tạo thành công cho IP:', clientIP);
      return res.status(200).json({
        success: true,
        token: token,
        expires_at: expiresAt.toISOString(),
        ip: clientIP
      });
    }

    // ✅ Kiểm tra token hiện tại
    if (req.method === 'GET' && req.query.action === 'check') {
      console.log('🔍 Kiểm tra token cho IP:', clientIP);
      
      await cleanupExpiredTokens();
      const existingToken = await checkExistingToken(clientIP);
      
      if (existingToken) {
        return res.status(200).json({
          success: true,
          has_token: true,
          token: existingToken.token,
          expires_at: existingToken.expires_at,
          time_remaining: getTimeRemaining(existingToken.expires_at)
        });
      } else {
        return res.status(200).json({
          success: true,
          has_token: false
        });
      }
    }

    // ✅ Xác thực token
    if (req.method === 'POST' && req.query.action === 'verify') {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, message: 'Thiếu token' });
      }

      await cleanupExpiredTokens();

      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ success: false, message: 'Lỗi kiểm tra token' });
      }

      if (data) {
        return res.status(200).json({
          success: true,
          valid: true,
          message: 'Token hợp lệ',
          expires_at: data.expires_at
        });
      } else {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }
    }

    return res.status(405).json({ success: false, message: 'Method không được hỗ trợ' });

  } catch (error) {
    console.error('💥 Lỗi server:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

// 🧹 Xóa token hết hạn
async function cleanupExpiredTokens() {
  try {
    const { error } = await supabase
      .from('tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      console.error('Lỗi cleanup token:', error);
    } else {
      console.log('🧹 Đã dọn dẹp token hết hạn');
    }
  } catch (error) {
    console.error('Lỗi cleanup:', error);
  }
}

// 🔍 Kiểm tra token hiện tại của IP
async function checkExistingToken(clientIP) {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('client_ip', clientIP)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Lỗi check existing token:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Lỗi check existing token:', error);
    return null;
  }
}

// 📊 Kiểm tra số lần thử tạo token gần đây
async function checkRecentAttempts(clientIP) {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data, error } = await supabase
      .from('tokens')
      .select('id')
      .eq('client_ip', clientIP)
      .gte('created_at', oneHourAgo.toISOString());

    if (error) {
      console.error('Lỗi check recent attempts:', error);
      return 0;
    }

    return data ? data.length : 0;
  } catch (error) {
    console.error('Lỗi check recent attempts:', error);
    return 0;
  }
}

// ⏰ Tính thời gian còn lại
function getTimeRemaining(expiresAt) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;
  
  if (diff <= 0) return '00:00:00';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}