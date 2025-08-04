// =====================================
// BYPASS FUNLINK API - PHIÊN BẢN HOÀN CHỈNH
// Anti-DDoS + Session Management + Token System + CORS
// =====================================

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// =====================================
// RATE LIMITING SYSTEM
// =====================================
const ipRequestMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 15;

// Cleanup expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
      ipRequestMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 2);

// =====================================
// HELPER FUNCTIONS
// =====================================
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

function logRequest(method, userIP, action = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${action ? `(${action})` : ''} from ${userIP}`);
}

// =====================================
// MAIN API HANDLER
// =====================================
export default async function handler(req, res) {
  // Add CORS headers
  addCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get client IP
  const userIP = getClientIP(req);
  
  // Log request
  logRequest(req.method, userIP, req.body?.action);
  
  try {
    // =====================================
    // GET REQUEST - Kiểm tra token có sẵn
    // =====================================
    if (req.method === 'GET') {
      try {
        const { data: existingToken, error } = await supabase
          .from('bypass_tokens')
          .select('token, expires_at')
          .eq('ip_address', userIP)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Supabase error:', error);
          throw error;
        }

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
      } catch(error) {
        console.error('Error checking existing token:', error);
        return res.status(500).json({ 
          ip: userIP, 
          error: 'Lỗi máy chủ khi kiểm tra token',
          details: error.message 
        });
      }
    }

    // =====================================
    // POST REQUEST - Xử lý các actions
    // =====================================
    if (req.method === 'POST') {
      const { action, token, force_create } = req.body || {};

      // Rate limiting check
      const now = Date.now();
      const ipData = ipRequestMap.get(userIP) || { count: 0, timestamp: now };
      
      if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
        ipData.count = 0; 
        ipData.timestamp = now;
      }
      
      ipData.count += 1;
      ipRequestMap.set(userIP, ipData);

      if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
        console.log(`⚠️ Rate limit exceeded for IP: ${userIP} (${ipData.count} requests)`);
        return res.status(429).json({ 
          success: false, 
          error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
          retry_after: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - ipData.timestamp)) / 1000)
        });
      }

      // =====================================
      // ACTION 1: VALIDATE TOKEN
      // =====================================
      if (action === 'validate_token') {
        if (!token) {
          return res.status(400).json({ 
            valid: false, 
            error: 'Token is required' 
          });
        }
        
        try {
          const { data: tokenData, error } = await supabase
            .from('bypass_tokens')
            .select('expires_at')
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          
          const isValid = !!tokenData;
          console.log(`🔑 Token validation for ${userIP}: ${isValid ? 'VALID' : 'INVALID'}`);
          
          return res.status(200).json({ 
            valid: isValid 
          });
        } catch (error) {
          console.error('Error validating token:', error);
          return res.status(500).json({ 
            valid: false, 
            error: 'Lỗi máy chủ khi kiểm tra token' 
          });
        }
      }
      
      // =====================================
      // ACTION 2: CREATE TOKEN
      // =====================================
      if (action === 'create_token') {
        try {
          // Xóa token hết hạn của IP này
          await supabase
            .from('bypass_tokens')
            .delete()
            .eq('ip_address', userIP)
            .lt('expires_at', new Date().toISOString());

          // Kiểm tra token còn hiệu lực
          const { data: existingValidToken, error: fetchError } = await supabase
            .from('bypass_tokens')
            .select('token, expires_at')
            .eq('ip_address', userIP)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
          
          if (existingValidToken) {
            console.log(`⚠️ Existing valid token found for ${userIP}`);
            return res.status(409).json({ 
              success: false, 
              error: 'Token đã tồn tại và vẫn còn hiệu lực.' 
            });
          }

          // Tạo token mới (3 giờ)
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

          console.log(`✅ New token created for ${userIP}`);

          return res.status(201).json({
            success: true,
            token: newToken,
            expires_at: newExpiresAt.toISOString(),
            time_left_ms: 3 * 60 * 60 * 1000
          });
          
        } catch (error) {
          console.error('Error during token creation:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Đã xảy ra lỗi phía máy chủ.',
            details: error.message 
          });
        }
      }

      // =====================================
      // ACTION 3: CHECK EXISTING DOWNLOAD SESSION
      // =====================================
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
            
            console.log(`📋 Found ${existingSessions.length} active session(s) for ${userIP}`);
            
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
          console.error('Error checking existing sessions:', error);
          return res.status(500).json({ 
            error: 'Lỗi kiểm tra session',
            details: error.message 
          });
        }
      }

      // =====================================
      // ACTION 4: CREATE DOWNLOAD SESSION
      // =====================================
      if (action === 'create_download_session') {
        try {
          // Kiểm tra session hiện tại nếu không force
          if (!force_create) {
            const { data: existingSessions, error: checkError } = await supabase
              .from('download_sessions')
              .select('*')
              .eq('ip_address', userIP)
              .gt('expires_at', new Date().toISOString());
            
            if (checkError) throw checkError;
            
            if (existingSessions && existingSessions.length > 0) {
              console.log(`⚠️ Existing session found for ${userIP}, rejecting new session`);
              return res.status(409).json({
                success: false,
                error: 'IP này đã có session đang hoạt động',
                error_code: 'EXISTING_SESSION',
                existing_sessions: existingSessions.length
              });
            }
          }
          
          // XÓA TOÀN BỘ SESSION CŨ CỦA IP NÀY (nếu force_create = true)
          if (force_create) {
            console.log(`🗑️ Force deleting ALL sessions for IP: ${userIP}`);
            
            const { error: deleteError } = await supabase
              .from('download_sessions')
              .delete()
              .eq('ip_address', userIP);
            
            if (deleteError) {
              console.error('Error deleting old sessions:', deleteError);
              throw deleteError;
            }
            
            console.log(`✅ Successfully deleted all sessions for IP: ${userIP}`);
          } else {
            // Chỉ xóa session hết hạn
            await supabase
              .from('download_sessions')
              .delete()
              .eq('ip_address', userIP)
              .lt('expires_at', new Date().toISOString());
          }
          
          // Tạo session mới (10 phút)
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
          
          console.log(`✅ Created new session for IP: ${userIP}, Session ID: ${sessionId}`);
          
          return res.status(201).json({
            success: true,
            message: 'Download session created successfully',
            session_id: sessionId,
            expires_in_minutes: 10,
            created_at: now.toISOString(),
            force_created: !!force_create
          });
          
        } catch (error) {
          console.error('Error creating download session:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Không thể tạo phiên tải xuống',
            details: error.message 
          });
        }
      }

      // =====================================
      // ACTION 5: VERIFY DOWNLOAD - CHÍNH
      // =====================================
      if (action === 'verify_download') {
        try {
          // 1. Tìm session của IP này
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
          
          // 2. Kiểm tra session tồn tại
          if (!session) {
            console.log(`❌ No session found for IP: ${userIP}`);
            return res.status(404).json({ 
              valid: false, 
              error: 'Vui lòng không dùng bypass nếu ko muốn bị chặn',
              error_code: 'NO_SESSION',
              redirect_url: 'https://tuanhaideptraivcl.vercel.app/security/blocked.html'
            });
          }
          
          // 3. KIỂM TRA THỜI GIAN TỐI THIỂU - 3 PHÚT
          const sessionCreatedAt = new Date(session.created_at);
          const now = new Date();
          const timeElapsedMs = now.getTime() - sessionCreatedAt.getTime();
          const timeElapsedMinutes = timeElapsedMs / (1000 * 60);
          
          const MIN_WAIT_MINUTES = 3;
          if (timeElapsedMinutes < MIN_WAIT_MINUTES) {
            const remainingTime = MIN_WAIT_MINUTES - timeElapsedMinutes;
            
            console.log(`⏱️ Too fast access for IP: ${userIP}, elapsed: ${timeElapsedMinutes.toFixed(2)} minutes`);
            
            return res.status(403).json({ 
              valid: false, 
              error: 'Vui lòng không dùng bypass nếu ko muốn bị chặn',
              error_code: 'TOO_FAST',
              time_elapsed_minutes: Math.floor(timeElapsedMinutes),
              min_required_minutes: MIN_WAIT_MINUTES,
              remaining_minutes: Math.ceil(remainingTime),
              redirect_url: 'https://tuanhaideptraivcl.vercel.app/security/blocked.html'
            });
          }
          
          // 4. Mark session as used
          await supabase
            .from('download_sessions')
            .update({ 
              used: true, 
              used_at: new Date().toISOString() 
            })
            .eq('session_id', session.session_id);
          
          console.log(`✅ Download verified for IP: ${userIP}, elapsed: ${timeElapsedMinutes.toFixed(2)} minutes`);
          
          return res.status(200).json({ 
            valid: true, 
            message: 'Xác thực thành công',
            time_elapsed_minutes: Math.floor(timeElapsedMinutes),
            session_id: session.session_id,
            download_url: 'https://archive.org/download/bypass-funlink-by-gemlogin-tool_202508/Bypass%20Funlink%20by%20Gemlogin%20Tool.exe'
          });
          
        } catch (error) {
          console.error('Error verifying download:', error);
          return res.status(500).json({ 
            valid: false, 
            error: 'Lỗi máy chủ khi xác thực',
            error_code: 'SERVER_ERROR',
            details: error.message,
            redirect_url: 'https://tuanhaideptraivcl.vercel.app/security/blocked.html'
          });
        }
      }

      // =====================================
      // ACTION 6: LOG DOWNLOAD (OPTIONAL)
      // =====================================
      if (action === 'log_download') {
        try {
          console.log(`📥 Download started for IP: ${userIP} at ${new Date().toISOString()}`);
          
          // Optional: Save to database
          // await supabase.from('download_logs').insert([{
          //   ip_address: userIP,
          //   downloaded_at: new Date().toISOString(),
          //   user_agent: req.headers['user-agent']
          // }]);
          
          return res.status(200).json({ 
            success: true, 
            message: 'Download logged successfully' 
          });
        } catch (error) {
          console.error('Error logging download:', error);
          return res.status(200).json({ 
            success: false, 
            message: 'Failed to log download',
            error: error.message 
          });
        }
      }

      // =====================================
      // ACTION 7: HEALTH CHECK
      // =====================================
      if (action === 'health_check') {
        return res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          ip: userIP
        });
      }
      
      // Invalid action
      console.log(`⚠️ Invalid action '${action}' from ${userIP}`);
      return res.status(400).json({ 
        error: 'Invalid action specified',
        available_actions: [
          'validate_token', 
          'create_token', 
          'check_download_session', 
          'create_download_session', 
          'verify_download', 
          'log_download',
          'health_check'
        ]
      });
    }

    // Method not allowed
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    });

  } catch (error) {
    console.error('Unexpected server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Đã xảy ra lỗi không mong muốn',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}