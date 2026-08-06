import { useState, useEffect } from 'react';

type RweRecord = {
  id: string;
  concept: string;
  event: string;
  dataPoint: string;
  application: string;
  evaluation: string;
  hl: boolean;
  freeTier: boolean;
};

export default function Home() {
  const [records, setRecords] = useState<RweRecord[]>([]);
  const [filtered, setFiltered] = useState<RweRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [command, setCommand] = useState('Explain');
  const [hlOnly, setHlOnly] = useState(false);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/records')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecords(data);
          setFiltered(data);
        }
      })
      .catch(() => setError('Failed to load examples. Please refresh.'));

    const saved = localStorage.getItem('rwe_license');
    if (saved) setUnlocked(true);
  }, []);

  useEffect(() => {
    let f = records;
    if (hlOnly) f = f.filter(r => r.hl);
    setFiltered(f);
    if (selectedId && !f.find(r => r.id === selectedId)) setSelectedId('');
  }, [hlOnly, records, selectedId]);

  const selected = records.find(r => r.id === selectedId);

  const handleGenerate = async () => {
    if (!selected) return;
    setError('');

    if (!selected.freeTier && !unlocked) {
      setShowLock(true);
      setOutput('');
      return;
    }

    setShowLock(false);
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selected, command })
      });
      const data = await res.json();
      setOutput(data.text || data.error || 'No response');
    } catch {
      setError('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyLicense = async () => {
    setError('');
    try {
      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem('rwe_license', licenseKey);
        setUnlocked(true);
        setShowLock(false);
        alert('Unlocked! You now have full access.');
      } else {
        alert('Invalid license key. Please check and try again.');
      }
    } catch {
      alert('Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">IB Economics Real-World Example Architect</h1>
      <p className="text-gray-600 mb-8">Exam-ready paragraphs, not just links.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hlOnly}
            onChange={e => setHlOnly(e.target.checked)}
            className="w-4 h-4"
          />
          <span>HL Only</span>
        </label>

        <select
          className="w-full border border-gray-300 p-2 rounded text-sm"
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setOutput(''); setShowLock(false); }}
        >
          <option value="">Select a concept...</option>
          {filtered.map(r => (
            <option key={r.id} value={r.id}>
              {r.concept} {r.hl ? '(HL)' : ''} {!r.freeTier ? '🔒' : ''}
            </option>
          ))}
        </select>

        <select
          className="w-full border border-gray-300 p-2 rounded text-sm"
          value={command}
          onChange={e => setCommand(e.target.value)}
        >
          <option>Explain</option>
          <option>Evaluate</option>
          <option>Discuss</option>
        </select>

        <button
          onClick={handleGenerate}
          disabled={!selected || loading}
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold disabled:bg-gray-300 hover:bg-blue-700 transition"
        >
          {loading ? 'Generating...' : 'Generate Paragraph'}
        </button>
      </div>

      {showLock && !unlocked && (
        <div className="border-2 border-dashed border-gray-300 p-6 rounded mb-6 text-center bg-gray-50">
          <p className="font-semibold mb-2 text-lg">🔒 Pro Example</p>
          <p className="text-gray-600 mb-4 text-sm">
            This example is for Pro users. Unlock 100+ examples and unlimited paragraph generation.
          </p>
          <a
            href="https://gumroad.com/l/YOUR-LINK"
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-black text-white px-6 py-2 rounded text-sm font-medium mb-6 hover:bg-gray-800 transition"
          >
            Buy Pro Access
          </a>
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              placeholder="Enter license key"
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
              className="border border-gray-300 p-2 rounded text-sm w-56"
            />
            <button
              onClick={verifyLicense}
              className="bg-gray-800 text-white px-4 rounded text-sm hover:bg-gray-700 transition"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {output && (
        <div className="relative bg-gray-50 border border-gray-200 p-5 rounded">
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            className="absolute top-3 right-3 text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 transition"
          >
            Copy All
          </button>
          <div className="pt-6 space-y-4">
            {output.split('\n\n').map((paragraph, i) => {
              const isHeader = paragraph.startsWith('**') && paragraph.endsWith('**');
              return isHeader ? (
                <h3 key={i} className="font-bold text-sm text-gray-900 mt-4 first:mt-0">
                  {paragraph.replace(/\*\*/g, '')}
                </h3>
              ) : (
                <p key={i} className="text-sm text-gray-800 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
