export default function handler(req, res) {
    if (req.method === 'GET') {
        res.status(200).json({
            clientId: process.env.DISCORD_CLIENT_ID
        });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}