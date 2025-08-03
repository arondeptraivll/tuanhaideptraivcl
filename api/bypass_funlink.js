import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// --- START: Rate Limiting ---
const ipRequestMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 10; // Tối đa 10 yêu cầu tạo token mỗi phút cho mỗi IP

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
      ipRequestMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 2);
// --- END: Rate Limiting ---

const initTable = async () => {
  const { error } = await supabase.rpc('create_tokens_table', {})
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating table:', error)
  }
}

export default async function handler(req, res) {
  await initTable()
  
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   '127.0.0.1'

  const userIP = clientIP.split(',')[0].trim()

  // ** LOGIC GET ĐƯỢC CẢI TIẾN **
  // Tự động kiểm tra token khi tải trang
  if (req.method === 'GET') {
    try {
        const { data: existingToken, error } = await supabase
            .from('bypass_tokens')
            .select('token, expires_at')
            .eq('ip_address', userIP)
            .gt('expires_at', new Date().toISOString())
            .single() // Lấy 1 bản ghi hoặc null

        if (error && error.code !== 'PGRST116') {
             throw error;
        }

        if (existingToken) {
            // NẾU TÌM THẤY TOKEN
            const expiresAt = new Date(existingToken.expires_at)
            const timeLeft = Math.max(0, expiresAt - new Date())

            return res.status(200).json({
                ip: userIP,
                has_existing_token: true,
                token: existingToken.token,
                expires_at: existingToken.expires_at,
                time_left_ms: timeLeft
            });
        } else {
            // NẾU KHÔNG TÌM THẤY TOKEN
            return res.status(200).json({
                ip: userIP,
                has_existing_token: false
            });
        }
    } catch(error) {
        console.error('Error checking existing token:', error);
        return res.status(500).json({ ip: userIP, error: 'Lỗi máy chủ khi kiểm tra token' });
    }
  }

  // ** LOGIC POST ĐƯỢC CẢI TIẾN **
  // Tạo token mới hoặc trả về lỗi nếu đã tồn tại
  if (req.method === 'POST') {
    const { action } = req.body

    if (action === 'create_token') {
      // Áp dụng Rate Limiting
      const now = Date.now();
      const ipData = ipRequestMap.get(userIP) || { count: 0, timestamp: now };

      if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
        ipData.count = 0;
        ipData.timestamp = now;
      }
      ipData.count += 1;
      ipRequestMap.set(userIP, ipData);

      if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ 
          success: false, 
          error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' 
        });
      }
      
      try {
        const { data: existingTokens, error: fetchError } = await supabase
          .from('bypass_tokens')
          .select('token, expires_at')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
        
        if (fetchError) throw fetchError;

        if (existingTokens && existingTokens.length > 0) {
          const token = existingTokens[0]
          return res.status(409).json({
            success: false,
            error: 'Token đã tồn tại và vẫn còn hiệu lực.',
            message: 'Vui lòng đợi token hiện tại hết hạn.',
            expires_at: token.expires_at,
            time_left_ms: new Date(token.expires_at) - new Date()
          })
        }

        const newToken = crypto.randomBytes(32).toString('hex')
        const newExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000)

        const { error: insertError } = await supabase
          .from('bypass_tokens')
          .insert([{ ip_address: userIP, token: newToken, created_at: new Date().toISOString(), expires_at: newExpiresAt.toISOString() }]);

        if (insertError) throw insertError

        return res.status(201).json({
          success: true,
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          time_left_ms: 3 * 60 * 60 * 1000,
        })
      } catch (error) {
        console.error('Error creating token:', error)
        return res.status(500).json({ 
          success: false, 
          error: 'Đã xảy ra lỗi phía máy chủ khi tạo token' 
        })
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}