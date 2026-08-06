import { useState, useEffect } from 'react';

type RweRecord = {
  id: string;
  concept: string;
  section: string;
  event: string;
  dataPoint: string;
  application: string;
  evaluation: string;
  freeTier: boolean;
};

const SECTIONS = ['Microeconomics', 'Macroeconomics', 'Global Economy'];

export default function Home() {
  const [records, setRecords] = useState<RweRecord[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/records')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecords(data); })
      .catch(() => setError('Failed to load examples. Please refresh.'));

    const saved = localStorage.getItem('rwe_license');
    if (saved) setUnlocked(true);
  }, []);

  const filteredRecords = records.filter(r => {
    if (selectedSection && r.section !== selectedSection) return false;
    return true;
  });

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
        body: JSON.stringify({ ...selected })
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
        alert('Unlocked!');
      } else {
        alert('Invalid license key.');
      }
    } catch {
      alert('Verification failed.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">IB Economics Real-World Example Architect</h1>
      <p className="text-gray-600 mb-8">Exam-ready bullets, not just links.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <div className="space-y-4 mb-6">
        <select
          className="w-full border border-gray-300 p-2 rounded text-sm"
          value={selectedSection}
          onChange={e => { setSelectedSection(e.target.value); setSelectedId(''); setOutput(''); setShowLock(false); }}
        >
          <option value="">Select a section...</option>
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          className="w-full border border-gray-300 p-2 rounded text-sm"
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setOutput(''); setShowLock(false); }}
          disabled={!selectedSection}
        >
          <option value="">{selectedSection ? 'Select a topic...' : 'Choose a section first'}</option>
          {filteredRecords.map(r => (
            <option key={r.id} value={r.id}>
              {r.concept} {!r.freeTier ? '🔒' : ''}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={!selected || loading}
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold disabled:bg-gray-300 hover:bg-blue-700 transition"
        >
          {loading ? 'Generating...' : 'Generate Bullet Points'}
        </button>
      </div>

      {showLock && !unlocked && (
        <div className="border-2 border-dashed border-gray-300 p-6 rounded mb-6 text-center bg-gray-50">
          <p className="font-semibold mb-2 text-lg">🔒 Pro Example</p>
          <p className="text-gray-600 mb-4 text-sm">Unlock 100+ examples and unlimited generation.</p>
          <a href="https://gumroad.com/l/YOUR-LINK" target="_blank" rel="noreferrer"
            className="inline-block bg-black text-white px-6 py-2 rounded text-sm font-medium mb-6 hover:bg-gray-800 transition">
            Buy Pro Access
          </a>
          <div className="flex gap-2 justify-center">
            <input type="text" placeholder="Enter license key" value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)} className="border border-gray-300 p-2 rounded text-sm w-56" />
            <button onClick={verifyLicense} className="bg-gray-800 text-white px-4 rounded text-sm hover:bg-gray-700 transition">Verify</button>
          </div>
        </div>
      )}

      {output && (
        <div className="relative bg-gray-50 border border-gray-200 p-5 rounded">
          <button onClick={() => navigator.clipboard.writeText(output)}
            className="absolute top-3 right-3 text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 transition">Copy All</button>
          <div className="pt-6">
            {output.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
              return isBullet ? (
                <li key={i} className="text-sm text-gray-800 leading-relaxed mb-2 ml-4 list-disc">{trimmed.replace(/^[•\-*]\s*/, '')}</li>
              ) : (
                <p key={i} className="text-sm text-gray-800 leading-relaxed mb-2">{trimmed}</p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
