app.post('/api/chat', async (req, res) => {
    const { message, sessionId, systemPrompt } = req.body;
  
    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            systemPrompt ? { role: 'system', content: systemPrompt } : null,
            { role: 'user', content: message }
          ].filter(Boolean),
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
  
      const reply = response.data.choices[0].message.content;
  
      await pool.query(
        'INSERT INTO chats (session_id, question, answer, timestamp) VALUES ($1, $2, $3, $4)',
        [sessionId, message, reply, new Date()]
      );
  
      res.json({ reply });
    } catch (err) {
      console.error(err.response?.data || err.message);
      res.status(500).json({ error: 'API error' });
    }
  });
  