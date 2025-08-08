import { createClient } from '@supabase/supabase-js'

const VIETNAM_IP_RANGES = [
  ['1.52.0.0', '1.55.255.255'],
  ['14.160.0.0', '14.191.255.255'],
  ['27.64.0.0', '27.79.255.255'],
  ['42.112.0.0', '42.119.255.255'],
  ['45.117.76.0', '45.117.79.255'],
  ['45.119.80.0', '45.119.83.255'],
  ['45.121.24.0', '45.121.27.255'],
  ['45.122.220.0', '45.122.223.255'],
  ['45.124.84.0', '45.124.95.255'],
  ['45.125.200.0', '45.125.207.255'],
  ['49.236.208.0', '49.236.223.255'],
  ['49.246.128.0', '49.246.191.255'],
  ['58.186.0.0', '58.187.255.255'],
  ['61.14.232.0', '61.14.239.255'],
  ['101.53.0.0', '101.53.255.255'],
  ['101.96.12.0', '101.96.15.255'],
  ['101.96.64.0', '101.96.95.255'],
  ['101.99.0.0', '101.99.63.255'],
  ['103.1.200.0', '103.1.239.255'],
  ['103.9.196.0', '103.9.203.255'],
  ['103.35.64.0', '103.35.67.255'],
  ['103.37.28.0', '103.37.31.255'],
  ['103.53.88.0', '103.53.91.255'],
  ['103.56.156.0', '103.56.159.255'],
  ['103.63.104.0', '103.63.111.255'],
  ['103.68.240.0', '103.68.255.255'],
  ['103.74.100.0', '103.74.119.255'],
  ['103.75.176.0', '103.75.191.255'],
  ['103.89.88.0', '103.89.91.255'],
  ['103.90.220.0', '103.90.227.255'],
  ['103.92.24.0', '103.92.31.255'],
  ['103.98.160.0', '103.98.163.255'],
  ['103.107.180.0', '103.107.183.255'],
  ['103.114.104.0', '103.114.107.255'],
  ['103.130.212.0', '103.130.215.255'],
  ['103.139.80.0', '103.139.87.255'],
  ['103.141.140.0', '103.141.143.255'],
  ['103.151.120.0', '103.151.127.255'],
  ['103.153.248.0', '103.153.255.255'],
  ['103.155.160.0', '103.155.167.255'],
  ['103.157.144.0', '103.157.151.255'],
  ['103.160.0.0', '103.160.7.255'],
  ['103.161.16.0', '103.161.19.255'],
  ['103.162.16.0', '103.162.23.255'],
  ['103.163.212.0', '103.163.215.255'],
  ['103.166.180.0', '103.166.183.255'],
  ['103.167.84.0', '103.167.87.255'],
  ['103.168.72.0', '103.168.75.255'],
  ['103.169.32.0', '103.169.39.255'],
  ['103.170.20.0', '103.170.23.255'],
  ['103.172.76.0', '103.172.79.255'],
  ['103.173.152.0', '103.173.159.255'],
  ['103.176.104.0', '103.176.111.255'],
  ['103.178.232.0', '103.178.235.255'],
  ['103.179.188.0', '103.179.191.255'],
  ['103.180.112.0', '103.180.119.255'],
  ['103.181.12.0', '103.181.15.255'],
  ['103.184.108.0', '103.184.111.255'],
  ['103.186.62.0', '103.186.63.255'],
  ['103.187.4.0', '103.187.7.255'],
  ['103.188.80.0', '103.188.87.255'],
  ['103.192.232.0', '103.192.239.255'],
  ['103.194.188.0', '103.194.191.255'],
  ['103.195.236.0', '103.195.239.255'],
  ['103.196.244.0', '103.196.247.255'],
  ['103.199.4.0', '103.199.19.255'],
  ['103.200.20.0', '103.200.31.255'],
  ['103.204.168.0', '103.204.175.255'],
  ['103.205.96.0', '103.205.111.255'],
  ['103.206.208.0', '103.206.223.255'],
  ['103.207.32.0', '103.207.47.255'],
  ['103.216.112.0', '103.216.127.255'],
  ['103.220.80.0', '103.220.87.255'],
  ['103.221.212.0', '103.221.223.255'],
  ['103.226.248.0', '103.226.255.255'],
  ['103.227.112.0', '103.227.119.255'],
  ['103.228.20.0', '103.228.23.255'],
  ['103.229.40.0', '103.229.43.255'],
  ['103.232.48.0', '103.232.63.255'],
  ['103.233.48.0', '103.233.51.255'],
  ['103.234.88.0', '103.234.91.255'],
  ['103.237.60.0', '103.237.99.255'],
  ['103.238.68.0', '103.238.107.255'],
  ['103.239.28.0', '103.239.31.255'],
  ['103.241.248.0', '103.241.251.255'],
  ['103.243.216.0', '103.243.219.255'],
  ['103.245.244.0', '103.245.251.255'],
  ['103.248.160.0', '103.248.167.255'],
  ['103.249.100.0', '103.249.103.255'],
  ['103.252.0.0', '103.252.7.255'],
  ['103.253.88.0', '103.253.91.255'],
  ['103.254.12.0', '103.254.47.255'],
  ['103.255.84.0', '103.255.87.255'],
  ['111.65.240.0', '111.65.255.255'],
  ['112.72.0.0', '112.79.255.255'],
  ['112.137.128.0', '112.137.191.255'],
  ['112.197.0.0', '112.197.15.255'],
  ['112.213.80.0', '112.213.95.255'],
  ['113.20.96.0', '113.20.127.255'],
  ['113.22.0.0', '113.23.255.255'],
  ['113.52.32.0', '113.52.47.255'],
  ['113.61.108.0', '113.61.111.255'],
  ['113.160.0.0', '113.191.255.255'],
  ['115.72.0.0', '115.87.255.255'],
  ['115.146.120.0', '115.146.127.255'],
  ['116.96.0.0', '116.111.255.255'],
  ['116.118.0.0', '116.119.255.255'],
  ['116.193.64.0', '116.193.95.255'],
  ['117.0.0.0', '117.7.255.255'],
  ['117.103.200.0', '117.103.207.255'],
  ['117.122.120.0', '117.122.127.255'],
  ['118.68.0.0', '118.71.255.255'],
  ['118.107.64.0', '118.107.127.255'],
  ['119.15.160.0', '119.15.191.255'],
  ['119.17.192.0', '119.17.255.255'],
  ['119.82.128.0', '119.82.143.255'],
  ['120.72.80.0', '120.72.127.255'],
  ['120.138.64.0', '120.138.127.255'],
  ['122.129.0.0', '122.129.127.255'],
  ['123.16.0.0', '123.31.255.255'],
  ['123.136.96.0', '123.136.127.255'],
  ['124.157.96.0', '124.157.127.255'],
  ['124.158.0.0', '124.158.15.255'],
  ['125.58.0.0', '125.58.255.255'],
  ['125.212.128.0', '125.212.255.255'],
  ['125.214.0.0', '125.214.255.255'],
  ['125.234.0.0', '125.235.255.255'],
  ['125.253.112.0', '125.253.127.255'],
  ['171.224.0.0', '171.255.255.255'],
  ['175.103.24.0', '175.103.31.255'],
  ['180.93.0.0', '180.93.255.255'],
  ['180.148.128.0', '180.148.255.255'],
  ['182.161.80.0', '182.161.95.255'],
  ['183.80.0.0', '183.91.255.255'],
  ['202.9.76.0', '202.9.79.255'],
  ['202.37.80.0', '202.37.95.255'],
  ['202.43.108.0', '202.43.111.255'],
  ['202.44.136.0', '202.44.139.255'],
  ['202.47.142.0', '202.47.143.255'],
  ['202.52.39.0', '202.52.39.255'],
  ['202.55.132.0', '202.55.135.255'],
  ['202.56.56.0', '202.56.59.255'],
  ['202.58.244.0', '202.58.247.255'],
  ['202.59.252.0', '202.59.255.255'],
  ['202.60.104.0', '202.60.111.255'],
  ['202.74.56.0', '202.74.59.255'],
  ['202.78.224.0', '202.78.231.255'],
  ['202.79.232.0', '202.79.235.255'],
  ['202.87.212.0', '202.87.215.255'],
  ['202.92.4.0', '202.92.7.255'],
  ['202.94.80.0', '202.94.95.255'],
  ['202.124.204.0', '202.124.207.255'],
  ['202.130.16.0', '202.130.31.255'],
  ['202.134.16.0', '202.134.19.255'],
  ['202.134.54.0', '202.134.55.255'],
  ['202.143.108.0', '202.143.111.255'],
  ['202.149.204.0', '202.149.207.255'],
  ['202.151.160.0', '202.151.175.255'],
  ['202.158.244.0', '202.158.247.255'],
  ['202.160.124.0', '202.160.127.255'],
  ['202.168.12.0', '202.168.15.255'],
  ['202.172.4.0', '202.172.7.255'],
  ['202.191.56.0', '202.191.63.255'],
  ['203.8.172.0', '203.8.175.255'],
  ['203.9.156.0', '203.9.159.255'],
  ['203.34.144.0', '203.34.159.255'],
  ['203.41.48.0', '203.41.63.255'],
  ['203.77.176.0', '203.77.191.255'],
  ['203.79.28.0', '203.79.31.255'],
  ['203.80.128.0', '203.80.131.255'],
  ['203.89.136.0', '203.89.143.255'],
  ['203.99.248.0', '203.99.255.255'],
  ['203.113.128.0', '203.113.191.255'],
  ['203.119.8.0', '203.119.63.255'],
  ['203.119.72.0', '203.119.79.255'],
  ['203.128.240.0', '203.128.255.255'],
  ['203.160.0.0', '203.163.255.255'],
  ['203.167.8.0', '203.167.15.255'],
  ['203.170.26.0', '203.170.27.255'],
  ['203.171.16.0', '203.171.31.255'],
  ['203.176.160.0', '203.176.191.255'],
  ['203.189.24.0', '203.189.31.255'],
  ['203.190.160.0', '203.190.175.255'],
  ['203.191.8.0', '203.191.63.255'],
  ['203.192.32.0', '203.192.63.255'],
  ['203.195.0.0', '203.195.127.255'],
  ['203.196.24.0', '203.196.31.255'],
  ['203.201.56.0', '203.201.63.255'],
  ['203.205.0.0', '203.205.63.255'],
  ['203.209.176.0', '203.209.191.255'],
  ['203.210.128.0', '203.210.255.255'],
  ['210.2.64.0', '210.2.127.255'],
  ['210.4.64.0', '210.4.127.255'],
  ['210.86.224.0', '210.86.239.255'],
  ['210.211.96.0', '210.211.127.255'],
  ['210.245.0.0', '210.245.127.255'],
  ['218.100.10.0', '218.100.15.255'],
  ['220.231.64.0', '220.231.127.255'],
  ['221.121.0.0', '221.121.63.255'],
  ['221.132.0.0', '221.133.255.255'],
  ['222.252.0.0', '222.255.255.255']
];

const ADMIN_IPS = ['127.0.0.1'];
const ipCache = new Map();
const stats = { requests: 0, blocked: 0 };

function getIP(request) {
  const headers = ['x-vercel-forwarded-for', 'cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'];
  for (const h of headers) {
    const ip = request.headers.get(h)?.split(',')[0]?.trim();
    if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return ip;
  }
  return null;
}

function isVN(ip) {
  const num = ip.split('.').reduce((a, b) => (a << 8) | parseInt(b), 0) >>> 0;
  return VIETNAM_IP_RANGES.some(([s, e]) => {
    const start = s.split('.').reduce((a, b) => (a << 8) | parseInt(b), 0) >>> 0;
    const end = e.split('.').reduce((a, b) => (a << 8) | parseInt(b), 0) >>> 0;
    return num >= start && num <= end;
  });
}

function checkLimit(ip, isVietnam) {
  const now = Date.now();
  const limit = isVietnam ? 20 : 3;
  const window = Math.floor(now / 60000);
  const key = `${ip}_${window}`;
  
  const current = ipCache.get(key) || 0;
  ipCache.set(key, current + 1);
  
  if (ipCache.size > 50000) {
    const expired = Array.from(ipCache.keys()).filter(k => parseInt(k.split('_')[1]) < window - 2);
    expired.forEach(k => ipCache.delete(k));
  }
  
  return current + 1 <= limit;
}

function createBlockPage(code, title, message) {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
            overflow: hidden;
            position: relative;
        }

        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
            animation: float 20s linear infinite;
        }

        @keyframes float {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-60px, -60px); }
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 3rem 2.5rem;
            box-shadow: 
                0 32px 64px rgba(0, 0, 0, 0.15),
                0 0 0 1px rgba(255, 255, 255, 0.2);
            text-align: center;
            max-width: 480px;
            width: 90%;
            position: relative;
            z-index: 1;
            transform: translateY(0);
            animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .icon-container {
            position: relative;
            margin-bottom: 2rem;
        }

        .icon {
            font-size: 5rem;
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: pulse 2s ease-in-out infinite;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .code {
            font-size: 1.5rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 1rem;
            letter-spacing: 0.5px;
        }

        .title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 1rem;
            line-height: 1.2;
            background: linear-gradient(135deg, #2d3748, #4a5568);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .message {
            font-size: 1.1rem;
            color: #718096;
            line-height: 1.6;
            margin-bottom: 2.5rem;
            font-weight: 400;
        }

        .decorative-line {
            width: 80px;
            height: 4px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            margin: 1.5rem auto;
            border-radius: 2px;
            position: relative;
            overflow: hidden;
        }

        .decorative-line::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 2rem 0;
            padding: 1.5rem;
            background: rgba(102, 126, 234, 0.05);
            border-radius: 16px;
            border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .info-item {
            text-align: center;
        }

        .info-label {
            font-size: 0.875rem;
            color: #a0aec0;
            margin-bottom: 0.5rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 1.125rem;
            color: #4a5568;
            font-weight: 600;
        }

        .retry-button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
            text-decoration: none;
            margin: 1rem 0.5rem;
        }

        .retry-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
        }

        .retry-button:active {
            transform: translateY(0);
        }

        .footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            font-size: 0.875rem;
            color: #a0aec0;
            line-height: 1.5;
        }

        .security-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(34, 197, 94, 0.1);
            color: #059669;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            margin: 1rem 0;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
        }

        .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            animation: particleFloat 8s linear infinite;
        }

        @keyframes particleFloat {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-10vh) rotate(360deg);
                opacity: 0;
            }
        }

        @media (max-width: 640px) {
            .container {
                padding: 2rem 1.5rem;
                margin: 1rem;
            }
            
            .title {
                font-size: 2rem;
            }
            
            .icon {
                font-size: 4rem;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="particles">
        <div class="particle" style="left: 10%; width: 4px; height: 4px; animation-delay: 0s;"></div>
        <div class="particle" style="left: 20%; width: 6px; height: 6px; animation-delay: 1s;"></div>
        <div class="particle" style="left: 30%; width: 3px; height: 3px; animation-delay: 2s;"></div>
        <div class="particle" style="left: 40%; width: 5px; height: 5px; animation-delay: 3s;"></div>
        <div class="particle" style="left: 50%; width: 4px; height: 4px; animation-delay: 4s;"></div>
        <div class="particle" style="left: 60%; width: 6px; height: 6px; animation-delay: 5s;"></div>
        <div class="particle" style="left: 70%; width: 3px; height: 3px; animation-delay: 6s;"></div>
        <div class="particle" style="left: 80%; width: 5px; height: 5px; animation-delay: 7s;"></div>
        <div class="particle" style="left: 90%; width: 4px; height: 4px; animation-delay: 8s;"></div>
    </div>

    <div class="container">
        <div class="icon-container">
            <div class="icon">${code === 403 ? '🛡️' : code === 429 ? '⏰' : '🚫'}</div>
        </div>
        
        <div class="code">ERROR ${code}</div>
        <h1 class="title">${title}</h1>
        <div class="decorative-line"></div>
        <p class="message">${message}</p>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">Restricted</div>
            </div>
            <div class="info-item">
                <div class="info-label">Time</div>
                <div class="info-value">${new Date().toLocaleTimeString()}</div>
            </div>
        </div>

        <div class="security-badge">
            <span>🔒</span>
            <span>Protected by Advanced Security</span>
        </div>

        <button class="retry-button" onclick="window.location.reload()">
            <span>🔄</span>
            <span>Try Again</span>
        </button>

        <div class="footer">
            <p><strong>Need Help?</strong></p>
            <p>If you believe this is an error, please contact our support team.</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.7;">
                ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}
            </p>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.container');
            container.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            container.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });

            const retryButton = document.querySelector('.retry-button');
            let countdown = 60;
            const updateButton = () => {
                if (countdown > 0) {
                    retryButton.innerHTML = \`<span>⏳</span><span>Wait \${countdown}s</span>\`;
                    retryButton.disabled = true;
                    retryButton.style.opacity = '0.6';
                    countdown--;
                    setTimeout(updateButton, 1000);
                } else {
                    retryButton.innerHTML = '<span>🔄</span><span>Try Again</span>';
                    retryButton.disabled = false;
                    retryButton.style.opacity = '1';
                }
            };
            
            if (${code} === 429) {
                updateButton();
            }
        });
    </script>
</body>
</html>`, {
    status: code,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export default async function middleware(request) {
  try {
    stats.requests++;
    
    const url = new URL(request.url);
    if (url.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|webp|map|txt|xml|pdf)$/)) {
      return;
    }

    if (url.pathname === '/api/stats') {
      return new Response(JSON.stringify({
        requests: stats.requests,
        blocked: stats.blocked,
        uptime: Math.floor((Date.now() - (stats.startTime || Date.now())) / 1000)
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    const ip = getIP(request);
    if (!ip) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] BLOCK_NO_IP: ${url.pathname}`);
      return createBlockPage(403, 'Access Denied', 'Your request could not be processed at this time.');
    }
    
    if (ADMIN_IPS.includes(ip)) {
      console.log(`[${new Date().toISOString()}] ADMIN: ${ip} - ${url.pathname}`);
      return;
    }
    
    const vietnam = isVN(ip);
    const allowed = checkLimit(ip, vietnam);
    
    if (!allowed) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] RATE_LIMIT: ${ip} - ${vietnam ? 'VN' : 'FOREIGN'} - ${url.pathname}`);
      return createBlockPage(429, 'Too Many Requests', 'You have exceeded the allowed number of requests. Please wait before trying again.');
    }
    
    if (!vietnam) {
      stats.blocked++;
      console.log(`[${new Date().toISOString()}] GEO_BLOCK: ${ip} - ${url.pathname}`);
      return createBlockPage(403, 'Access Restricted', 'This service is currently only available to users in Vietnam.');
    }
    
    if (Math.random() < 0.01) {
      console.log(`[${new Date().toISOString()}] ALLOW: ${ip} - ${url.pathname}`);
    }
    
  } catch (error) {
    stats.blocked++;
    console.log(`[${new Date().toISOString()}] ERROR: ${error.message}`);
    return createBlockPage(503, 'Service Unavailable', 'The service is temporarily unavailable. Please try again later.');
  }
}

export const config = {
  runtime: 'edge',
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
