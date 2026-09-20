const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

router.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const systemInstruction = "You are an expert software engineer. Output the response strictly as a JSON object with two keys: 'language' (the programming language used, in lowercase, e.g. 'python', 'javascript', 'cpp', 'html') and 'code' (the raw code). By default, write code in Python unless the user explicitly requests a different language. Do not include markdown formatting or explanations. Return ONLY the JSON object.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction,
        responseMimeType: "application/json" 
      }
    });

    const result = JSON.parse(response.text);
    res.json({ code: result.code, language: result.language });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: "Failed to generate code." });
  }
});

module.exports = router;
