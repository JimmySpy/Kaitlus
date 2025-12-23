const express = require('express');
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_BACKUP;

// System prompt for the assistant
const SYSTEM_PROMPT = `You are a helpful customer service assistant for Kaitlus, a garbage container rental and sales company. 

About Kaitlus:
- We rent garbage containers in sizes: 2m³ (€99/week), 5m³ (€149/week), 10m³ (€249/week), 20m³ (€399/week)
- We also sell new and used containers
- We offer residential, commercial, and construction waste services
- We provide same-day delivery in most cases
- Business hours: Mon-Fri 7:00-18:00, Sat 8:00-14:00
- Contact: +358 12 345 6789, info@kaitlus.com
- Location: Helsinki, Finland

Be helpful, friendly, and concise. If someone wants to order, direct them to /order page. For sales inquiries, direct to /sales page. For other questions, suggest /contact page.

Keep responses short (2-3 sentences max) unless more detail is needed.`;

// Chat endpoint
router.post('/chat', async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured' });
    }

    try {
        // Build messages array
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: messages,
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API error:', error);
            return res.status(500).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || 'Sorry, I could not process that.';

        res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to get response' });
    }
});

module.exports = router;
