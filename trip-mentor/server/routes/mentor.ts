import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

const router = express.Router();
// Check if API key is available
if (!config.geminiApiKey) {
  console.error('Gemini API key is not defined in environment variables');
}
const genAI = new GoogleGenerativeAI(config.geminiApiKey as string);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!config.geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an AI travel mentor. Help the user with their travel-related questions.
    User: ${message}
    Assistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error('Error in mentor chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export const mentorRouter = router; 