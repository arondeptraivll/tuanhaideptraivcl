import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    // Tạo token mới
    if (req.method === 'POST' && req.query.action === 'create') {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 3) // 3 tiếng

      const { error } = await supabase
        .from('tokens')
        .insert([{
          token: token,
          expires_at: expiresAt.toISOString()
        }])

      if (error) {
        return res.status(500).json({ success: false, message: 'Lỗi tạo token' })
      }

      return res.status(200).json({
        success: true,
        token: token,
        expires_at: expiresAt.toISOString()
      })
    }

    // Kiểm tra token
    if (req.method === 'POST' && req.query.action === 'verify') {
      const { token } = req.body

      if (!token) {
        return res.status(400).json({ success: false, message: 'Thiếu token' })
      }

      // Xóa token hết hạn
      await supabase
        .from('tokens')
        .delete()
        .lt('expires_at', new Date().toISOString())

      // Kiểm tra token
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ success: false, message: 'Lỗi kiểm tra token' })
      }

      if (data) {
        return res.status(200).json({
          success: true,
          valid: true,
          message: 'Token hợp lệ'
        })
      } else {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        })
      }
    }

    return res.status(405).json({ success: false, message: 'Method không được hỗ trợ' })

  } catch (error) {
    console.error('Lỗi server:', error)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}