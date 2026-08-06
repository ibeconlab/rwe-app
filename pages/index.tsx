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
        alert('Unlocked! You now have full access.');
      } else {
        alert('Invalid license key. Please check and try again.');
      }
    } catch {
      alert('Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">IB</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RWE Architect</h1>
              <p className="text-sm text-slate-500">IB Economics — Real-World Examples</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        
        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Input Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="space-y-4">
            
            {/* Section Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Section
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 transition"
                value={selectedSection}
                onChange={e => { setSelectedSection(e.target.value); setSelectedId(''); setOutput(''); setShowLock(false); }}
              >
                <option value="">Choose a section...</option>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Concept Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Topic
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedId}
                onChange={e => { setSelectedId(e.target.value); setOutput(''); setShowLock(false); }}
                disabled={!selectedSection}
              >
                <option value="">
                  {selectedSection ? 'Select a topic...' : 'Select a section first'}
                </option>
                {filteredRecords.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.concept} {!r.freeTier ? '(Pro)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selected || loading}
              className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-3 text-center transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Bullet Points'
              )}
            </button>
          </div>
        </div>

        {/* Paywall */}
        {showLock && !unlocked && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Pro Example</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Unlock 100+ exam-ready examples with verified data and instant bullet-point generation.
            </p>
            <a
              href="https://gumroad.com/l/YOUR-LINK"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center text-white bg-slate-900 hover:bg-slate-800 font-medium rounded-lg text-sm px-6 py-2.5 mb-6 transition"
            >
              Unlock Full Access
            </a>
            <div className="flex gap-2 justify-center max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Enter license key"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              />
              <button
                onClick={verifyLicense}
                className="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-4 py-2.5 transition"
              >
                Verify
              </button>
            </div>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Output</span>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy
              </button>
            </div>
            <div className="p-5">
              <ul className="space-y-3">
                {output.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  const clean = trimmed.replace(/^[•\-*]\s*/, '');
                  const isHeader = clean.toLowerCase().startsWith('data point:') || 
                                   clean.toLowerCase().startsWith('advantage:') || 
                                   clean.toLowerCase().startsWith('disadvantage:');
                  
                  if (isHeader) {
                    const [label, ...rest] = clean.split(':');
                    return (
                      <li key={i} className="text-sm">
                        <span className="font-semibold text-indigo-700">{label}:</span>
                        <span className="text-slate-700"> {rest.join(':')}</span>
                      </li>
                    );
                  }
                  
                  return (
                    <li key={i} className="text-sm text-slate-700 leading-relaxed pl-2 border-l-2 border-indigo-200">
                      {clean}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
