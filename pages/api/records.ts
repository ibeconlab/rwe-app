import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const records = await base('Table 1').select().all();
    const data = records.map(r => ({
      id: r.id,
      concept: r.get('Concept') as string || '',
      section: r.get('Section') as string || '',
      event: r.get('Event') as string || '',
      dataPoint: r.get('Data point') as string || '',
      application: r.get('Application') as string || '',
      evaluation: r.get('Evaluation') as string || '',
      freeTier: !!r.get('Free tier'),
    }));
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
}
