import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { licenseKey } = req.body;

  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: process.env.GUMROAD_PRODUCT_ID,
        license_key: licenseKey
      })
    });

    const data = await response.json();
    res.status(200).json({ valid: data.success === true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Verification failed' });
  }
}
