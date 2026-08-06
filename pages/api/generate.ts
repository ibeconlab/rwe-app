import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { concept, event, dataPoint, application, evaluation, command } = req.body;

  const system = `You are an IB Economics examiner. Using ONLY the real-world example and data provided below, write a ${command} response for an IB Paper 1 essay.

Output exactly 4 separate paragraphs with these labels:

**Definition**
(1-2 lines defining the concept)

**Mechanism**
(2-3 lines explaining the diagram or economic mechanism)

**Real-World Example**
(3-4 lines applying the provided example and exact data)

**Evaluation**
(2-3 lines of "it depends" — only if command is Evaluate or Discuss; otherwise write "N/A")

Rules:
- Do not invent data. Use only what is provided.
- Keep each paragraph focused. Do not merge sections.
- Write in a concise, academic tone.
- Do not add introductions or conclusions outside the 4 paragraphs.`;

  const user = `Concept: ${concept}
Event: ${event}
Data point: ${dataPoint}
Application context: ${application}
Evaluation context: ${evaluation}
Command term: ${command}`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Error: no response from AI';
    res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Generation failed' });
  }
}
