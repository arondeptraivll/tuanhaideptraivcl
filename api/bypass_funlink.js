import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Tạo bảng tokens nếu chưa có
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

  if (req.method === 'GET') {
    // Lấy thông tin IP
    return res.status(200).json({ ip: userIP })
  }

  if (req.method === 'POST') {
    const { action } = req.body

    if (action === 'create_token') {
      try {
        // Kiểm tra token hiện tại của IP này
        const { data: existingTokens } = await supabase
          .from('bypass_tokens')
          .select('*')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())

        if (existingTokens && existingTokens.length > 0) {
          const token = existingTokens[0]
          const expiresAt = new Date(token.expires_at)
          const now = new Date()
          const timeLeft = Math.max(0, expiresAt - now)

          return res.status(200).json({
            success: true,
            token: token.token,
            expires_at: token.expires_at,
            time_left_ms: timeLeft,
            is_existing: true
          })
        }

        // Tạo token mới
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 giờ

        const { data, error } = await supabase
          .from('bypass_tokens')
          .insert([
            {
              ip_address: userIP,
              token: token,
              created_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString()
            }
          ])
          .select()

        if (error) {
          throw error
        }

        return res.status(200).json({
          success: true,
          token: token,
          expires_at: expiresAt.toISOString(),
          time_left_ms: 3 * 60 * 60 * 1000,
          is_existing: false
        })

      } catch (error) {
        console.error('Error creating token:', error)
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể tạo token' 
        })
      }
    }

    if (action === 'validate_token') {
      const { token } = req.body

      try {
        const { data, error } = await supabase
          .from('bypass_tokens')
          .select('*')
          .eq('token', token)
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          const tokenData = data[0]
          const expiresAt = new Date(tokenData.expires_at)
          const now = new Date()
          const timeLeft = Math.max(0, expiresAt - now)

          return res.status(200).json({
            valid: true,
            expires_at: tokenData.expires_at,
            time_left_ms: timeLeft
          })
        } else {
          return res.status(200).json({
            valid: false,
            message: 'Token không hợp lệ hoặc đã hết hạn'
          })
        }

      } catch (error) {
        console.error('Error validating token:', error)
        return res.status(500).json({ 
          valid: false, 
          error: 'Lỗi kiểm tra token' 
        })
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}