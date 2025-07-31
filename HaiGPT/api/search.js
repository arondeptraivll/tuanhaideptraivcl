// api/search.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, numResults = 3 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Missing search query' });
        }

        const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
        const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
        
        if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
            return res.status(500).json({ error: 'Search API not configured' });
        }

        const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${numResults}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.error) {
            return res.status(400).json({ error: data.error });
        }
        
        const results = data.items ? data.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })) : [];
        
        res.status(200).json({ results });
        
    } catch (error) {
        console.error('Search API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}