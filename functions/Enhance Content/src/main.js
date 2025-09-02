import { enhanceContent } from './enhance.js';

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  try {
    // Parse JSON payload from Appwrite
    const data = JSON.stringify(req.bodyJson || '{}');
    const { text } = JSON.parse(data);
    log('Received text for enhancement:', text);
    if (!text) {
      return res.json({ error: 'Text parameter is required' }, 400);
    }
    log('Enhancing content for text:', text);

    const enhancedText = await enhanceContent(text);

    if (enhancedText.startsWith('Error:')) {
      return res.json({ error: enhancedText }, 500);
    }

    return res.json({
      enhancedText: enhancedText,
      originalText: text,
    });
  } catch (err) {
    error('Function error:', err);
    return res.json({ error: `Function error: ${err.message}` }, 500);
  }
};
