import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { concept, event, dataPoint, advantage, evaluation } = req.body;

  const prompt = `You are an IB Economics examiner. Write exactly 3 bullet points for an IB Paper 1 essay using ONLY the provided fields below. Do not invent data. Do not add outside information.

Format:
• Data point: [Rewrite the Data point field below into 1-2 fluent sentences]
• Advantage: [Rewrite the Advantage field below into 1-2 fluent sentences]
• Disadvantage: [Rewrite the Evaluation field below into 1-2 fluent sentences]

Rules:
- Write in a concise, academic tone.
- 1-2 sentences per bullet maximum.

Data point: ${dataPoint}
Advantage: ${advantage}
Evaluation: ${evaluation}`;

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
        temperature: 0.1,
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
