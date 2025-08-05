export default function handler(req, res) {
    if (req.method === 'GET') {
        // Tự động detect protocol và host
        const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
        const host = req.headers.host;
        const redirectUri = `${protocol}://${host}/api/discord-callback`;  // Point to callback handler
        
        res.status(200).json({
            clientId: process.env.DISCORD_CLIENT_ID,
            redirectUri: redirectUri
        });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}