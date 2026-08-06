import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { concept, event, dataPoint, application, evaluation } = req.body;

  const prompt = `You are an IB Economics examiner. Using ONLY the real-world example and data provided below, write exactly 3 bullet points for an IB Paper 1 essay.

Format:
• Data point: [1-2 sentences using the exact data provided to support the concept]
• Advantage: [1-2 sentences explaining one advantage or positive outcome, with a data point]
• Disadvantage: [1-2 sentences explaining one disadvantage or limitation, with a data point]

Rules:
- Do not invent data. Use only what is provided.
- Each bullet must be 1-2 sentences maximum.
- Write in a concise, academic tone.
- Do not add introductions, conclusions, or extra sections.

Concept: ${concept}
Event: ${event}
Data point: ${dataPoint}
Application context: ${application}
Evaluation context: ${evaluation}`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600
      })
    });

    const data = await response.json();
    console.log('DeepSeek response:', JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({
        error: `DeepSeek API Error: ${data.error.message || JSON.stringify(data.error)}`
      });
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({
        error: `No content. Full response: ${JSON.stringify(data)}`
      });
    }

    res.status(200).json({ text });
  } catch (e: any) {
    console.error('Fetch error:', e);
    res.status(500).json({ error: `Network error: ${e.message}` });
  }
}
