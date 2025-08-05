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

  // 🔑 ADMIN PASSWORD
  const adminPassword = process.env.ADMIN_PASSWORD || 'TuanHai45191';
  const authHeader = req.headers.authorization;
  
  console.log('🔐 Admin Auth Check:');
  console.log('Expected Password:', adminPassword);
  console.log('Auth Header:', authHeader);
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const providedPassword = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
    
  console.log('Provided Password:', providedPassword);
  console.log('Passwords Match:', providedPassword === adminPassword);
  
  if (providedPassword !== adminPassword) {
    console.log('❌ Password mismatch');
    return res.status(401).json({ 
      error: 'Invalid admin password'
    });
  }

  console.log('✅ Admin authenticated successfully');

  if (method === 'GET') {
    try {
      console.log('📊 Fetching users data...');
      
      // Mock data for testing
      const mockUsers = [];
      
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

  // 🆕 UPDATED DELETE METHOD
  if (method === 'DELETE') {
    try {
      const { userId } = req.query;
      console.log('🗑️ API: Deleting user:', userId);
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // In real implementation: delete from database
      // For now: return success and let frontend handle localStorage
      
      // 🆕 SET TERMINATION FLAG
      // This would be done in database in real implementation
      
      return res.status(200).json({ 
        success: true, 
        message: `User ${userId} deleted and session terminated`,
        terminated: true // Flag to indicate session should be terminated
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}