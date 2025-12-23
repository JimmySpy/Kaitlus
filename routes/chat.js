const express = require('express');
const router = express.Router();
const db = require('../config/database');

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.GROK_API_KEY_BACKUP;

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

// Start a new chat session
router.post('/chat/start', async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO chat_sessions (visitor_name) VALUES (?)',
            [name.trim()]
        );
        res.json({ sessionId: result.insertId, name: name.trim() });
    } catch (error) {
        console.error('Failed to start chat session:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
    const { message, history = [], sessionId } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured' });
    }

    try {
        // Save user message to database if session exists
        if (sessionId) {
            await db.query(
                'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
                [sessionId, 'user', message]
            );
        }

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

        // Save assistant reply to database if session exists
        if (sessionId) {
            await db.query(
                'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
                [sessionId, 'assistant', reply]
            );
        }

        res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to get response' });
    }
});

// Get all chat sessions (admin only)
router.get('/admin/chats', async (req, res) => {
    try {
        const sessions = await db.query(`
            SELECT cs.*, 
                   COUNT(cm.id) as message_count,
                   MAX(cm.created_at) as last_message
            FROM chat_sessions cs
            LEFT JOIN chat_messages cm ON cs.id = cm.session_id
            GROUP BY cs.id
            ORDER BY cs.created_at DESC
        `);
        res.json(sessions);
    } catch (error) {
        console.error('Failed to get chat sessions:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});

// Get messages for a specific session (admin only)
router.get('/admin/chats/:sessionId', async (req, res) => {
    try {
        const messages = await db.query(
            'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [req.params.sessionId]
        );
        const session = await db.query(
            'SELECT * FROM chat_sessions WHERE id = ?',
            [req.params.sessionId]
        );
        res.json({ session: session[0], messages });
    } catch (error) {
        console.error('Failed to get chat messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

module.exports = router;
