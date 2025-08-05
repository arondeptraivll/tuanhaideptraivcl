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

  // Simple admin authentication
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Simulate database with Supabase or simple storage
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (method === 'GET') {
    try {
      // Get all users from database
      const { data: users, error } = await supabase
        .from('discord_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        users: users || [],
        total: users?.length || 0 
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  if (method === 'POST') {
    try {
      const { userData } = req.body;
      
      // Save or update user data
      const { data, error } = await supabase
        .from('discord_users')
        .upsert({
          discord_id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          global_name: userData.globalName,
          avatar: userData.avatar,
          joined_at: userData.joinedAt,
          days_in_server: userData.daysInServer,
          guilds_count: userData.guilds,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error saving user:', error);
      return res.status(500).json({ error: 'Failed to save user' });
    }
  }

  if (method === 'DELETE') {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const { error } = await supabase
        .from('discord_users')
        .delete()
        .eq('discord_id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}