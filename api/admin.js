// api/admin.js
export default async function handler(req, res) {
  const { method } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🔑 ADMIN PASSWORD - HARDCODED FOR NOW
  const adminPassword = process.env.ADMIN_PASSWORD || 'TuanHai45191';
  const authHeader = req.headers.authorization;
  
  console.log('🔐 Admin Auth Check:');
  console.log('Expected Password:', adminPassword);
  console.log('Auth Header:', authHeader);
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  // Extract password from "Bearer PASSWORD" format
  const providedPassword = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
    
  console.log('Provided Password:', providedPassword);
  console.log('Passwords Match:', providedPassword === adminPassword);
  
  if (providedPassword !== adminPassword) {
    console.log('❌ Password mismatch');
    return res.status(401).json({ 
      error: 'Invalid admin password',
      debug: {
        expected: adminPassword,
        provided: providedPassword,
        headerFormat: authHeader?.substring(0, 20) + '...'
      }
    });
  }

  console.log('✅ Admin authenticated successfully');

  // Mock database for testing
  const mockUsers = [
    {
      id: 1,
      discord_id: '138008425763189572',
      username: 'thai2kk_',
      discriminator: '0',
      global_name: 'TuanHai',
      avatar: '7d36ea95b06f80ae68ddce119654012',
      joined_at: '2025-06-05T13:11:33.604000+00:00',
      days_in_server: 60,
      guilds_count: 3,
      last_login: Date.now(),
      login_count: 5,
      created_at: Date.now() - 86400000 * 10, // 10 days ago
      updated_at: Date.now(),
      status: 'online'
    }
  ];

  if (method === 'GET') {
    try {
      console.log('📊 Fetching users data...');
      
      // Get users from localStorage simulation or return mock data
      return res.status(200).json({ 
        success: true, 
        users: mockUsers,
        total: mockUsers.length,
        message: 'Users fetched successfully'
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  if (method === 'POST') {
    try {
      const { userData } = req.body;
      console.log('💾 Saving user data:', userData?.username || 'Unknown');
      
      // In real implementation, save to database
      // For now, just return success
      return res.status(200).json({ 
        success: true, 
        message: 'User data saved successfully',
        data: userData
      });
    } catch (error) {
      console.error('Error saving user:', error);
      return res.status(500).json({ error: 'Failed to save user' });
    }
  }

  if (method === 'DELETE') {
    try {
      const { userId } = req.query;
      console.log('🗑️ Deleting user:', userId);
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // In real implementation, delete from database
      return res.status(200).json({ 
        success: true, 
        message: `User ${userId} deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}