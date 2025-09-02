import { InferenceClient } from '@huggingface/inference';

const client = new InferenceClient(process.env.HF_TOKEN);

export const enhanceContent = async (text) => {
  try {
    if (!process.env.HF_TOKEN) {
      throw new Error('HF_TOKEN environment variable is not set');
    }

    const chatCompletion = await client.chatCompletion({
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content:
            'You are enhancing text for a digital memory capsule platform. Transform user input into well-written, digital memories. Focus on experiences, feelings, photos, videos - NOT physical objects. Keep it personal, heartfelt, add humor where needed and under 50 words. Enhance grammar and while preserving the original meaning.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Enhancement error:', error);
    throw new Error(`Enhancement failed: ${error.message}`);
  }
};
