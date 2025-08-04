import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ipRequestMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 15;

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
      ipRequestMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 2);

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const connection = req.connection?.remoteAddress;
  const socket = req.socket?.remoteAddress;
  const clientIP = forwarded || realIP || connection || socket || '127.0.0.1';
  return clientIP.split(',')[0].trim();
}

function addCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  addCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userIP = getClientIP(req);

  // GET: Check token
  if (req.method === 'GET') {
    try {
      const { data: existingToken, error } = await supabase
        .from('bypass_tokens')
        .select('token, expires_at')
        .eq('ip_address', userIP)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (existingToken) {
        const expiresAt = new Date(existingToken.expires_at);
        const timeLeft = Math.max(0, expiresAt - new Date());
        return res.status(200).json({
          ip: userIP,
          has_existing_token: true,
          token: existingToken.token,
          expires_at: existingToken.expires_at,
          time_left_ms: timeLeft
        });
      } else {
        return res.status(200).json({
          ip: userIP,
          has_existing_token: false
        });
      }
    } catch (error) {
      return res.status(500).json({
        ip: userIP,
        error: 'Lỗi máy chủ khi kiểm tra token'
      });
    }
  }

  // POST: Handle actions
  if (req.method === 'POST') {
    const { action, token, force_create } = req.body || {};

    // Rate limiting
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

    // CREATE TOKEN
    if (action === 'create_token') {
      try {
        await supabase
          .from('bypass_tokens')
          .delete()
          .eq('ip_address', userIP)
          .lt('expires_at', new Date().toISOString());

        const { data: existingValidToken, error: fetchError } = await supabase
          .from('bypass_tokens')
          .select('token, expires_at')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (existingValidToken) {
          return res.status(409).json({
            success: false,
            error: 'Token đã tồn tại và vẫn còn hiệu lực.'
          });
        }

        const newToken = crypto.randomBytes(32).toString('hex');
        const newExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

        const { error: insertError } = await supabase
          .from('bypass_tokens')
          .insert([{
            ip_address: userIP,
            token: newToken,
            created_at: new Date().toISOString(),
            expires_at: newExpiresAt.toISOString()
          }]);

        if (insertError) throw insertError;

        return res.status(201).json({
          success: true,
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          time_left_ms: 3 * 60 * 60 * 1000
        });

      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Đã xảy ra lỗi phía máy chủ.'
        });
      }
    }

    // CHECK DOWNLOAD SESSION
    if (action === 'check_download_session') {
      try {
        const { data: existingSessions, error } = await supabase
          .from('download_sessions')
          .select('*')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (existingSessions && existingSessions.length > 0) {
          const latestSession = existingSessions[0];
          const createdAt = new Date(latestSession.created_at);
          const now = new Date();
          const timeElapsed = Math.floor((now - createdAt) / (1000 * 60));
          return res.status(200).json({
            has_existing_session: true,
            session_count: existingSessions.length,
            latest_session: {
              created_at: latestSession.created_at,
              time_elapsed_minutes: timeElapsed,
              used: latestSession.used
            }
          });
        }

        return res.status(200).json({
          has_existing_session: false,
          session_count: 0
        });

      } catch (error) {
        return res.status(500).json({
          error: 'Lỗi kiểm tra session'
        });
      }
    }

    // CREATE DOWNLOAD SESSION
    if (action === 'create_download_session') {
      try {
        if (force_create) {
          await supabase
            .from('download_sessions')
            .delete()
            .eq('ip_address', userIP);
        } else {
          const { data: existingSessions } = await supabase
            .from('download_sessions')
            .select('*')
            .eq('ip_address', userIP)
            .gt('expires_at', new Date().toISOString());

          if (existingSessions && existingSessions.length > 0) {
            return res.status(409).json({
              success: false,
              error: 'IP này đã có session đang hoạt động',
              error_code: 'EXISTING_SESSION'
            });
          }
        }

        const sessionId = crypto.randomBytes(16).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        const { error: insertError } = await supabase
          .from('download_sessions')
          .insert([{
            session_id: sessionId,
            ip_address: userIP,
            created_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            used: false
          }]);

        if (insertError) throw insertError;

        return res.status(201).json({
          success: true,
          message: 'Download session created successfully',
          expires_in_minutes: 10,
          created_at: now.toISOString(),
          force_created: !!force_create
        });

      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Không thể tạo phiên tải xuống'
        });
      }
    }

    // VERIFY DOWNLOAD
    if (action === 'verify_download') {
      try {
        const { data: session, error } = await supabase
          .from('download_sessions')
          .select('*')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .eq('used', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!session) {
          return res.status(404).json({
            valid: false,
            error: 'Vui lòng không dùng bypass nếu ko muốn bị chặn'
          });
        }

        const sessionCreatedAt = new Date(session.created_at);
        const now = new Date();
        const timeElapsedMinutes = (now.getTime() - sessionCreatedAt.getTime()) / (1000 * 60);

        if (timeElapsedMinutes < 3) {
          return res.status(403).json({
            valid: false,
            error: 'Vui lòng không dùng bypass nếu ko muốn bị chặn'
          });
        }

        await supabase
          .from('download_sessions')
          .update({
            used: true,
            used_at: new Date().toISOString()
          })
          .eq('session_id', session.session_id);

        return res.status(200).json({
          valid: true,
          message: 'Xác thực thành công',
          time_elapsed_minutes: Math.floor(timeElapsedMinutes)
        });

      } catch (error) {
        return res.status(500).json({
          valid: false,
          error: 'Lỗi máy chủ'
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}