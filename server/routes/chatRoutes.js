const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

router.post('/', async (req, res) => {
  const { messages } = req.body;
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful Nightlist productivity assistant. Keep your responses concise, motivating, and helpful.' },
        ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
      ],
      model: 'llama3-8b-8192',
    });

    res.json({ reply: completion.choices[0]?.message?.content || "I couldn't process that." });
  } catch (error) {
    console.error('Groq Error:', error);
    res.status(500).json({ reply: "Sorry, I am having trouble connecting to my brain right now." });
  }
});

module.exports = router;
