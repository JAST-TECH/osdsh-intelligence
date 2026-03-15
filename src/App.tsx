// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Shield, BookOpen, BrainCircuit, Key, Check } from 'lucide-react';
// 後で作成する各コンポーネントをインポート（今は空ファイルでもOKです）
import TypeA from './components/TypeA';
import TypeB from './components/TypeB';
import TypeC from './components/TypeC';

type TabType = 'A' | 'B' | 'C' | 'SETTINGS';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('A');
  const [apiKey, setApiKey] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<boolean>(false);

  // 初回起動時にローカルストレージからAPIキーを読み込む
  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setSaveMessage(true);
    setTimeout(() => setSaveMessage(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060b1a] text-slate-100 font-sans flex flex-col">
      {/* ナビゲーションバー */}
      <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" size={28} />
            <span className="font-black text-xl tracking-widest uppercase">OSDSH Intelligence</span>
          </div>
          
          <div className="flex bg-slate-800 rounded-xl p-1 overflow-x-auto">
            <button onClick={() => setActiveTab('A')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'A' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Shield size={16}/> Type A</button>
            <button onClick={() => setActiveTab('B')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'B' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><BookOpen size={16}/> Type B</button>
            <button onClick={() => setActiveTab('C')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'C' ? 'bg-lime-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><BrainCircuit size={16}/> Type C</button>
            <button onClick={() => setActiveTab('SETTINGS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ml-2 ${activeTab === 'SETTINGS' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Key size={16}/> 設定</button>
          </div>
        </div>
      </nav>

      {/* コンテンツ領域 */}
      <main className="flex-grow">
        {!apiKey && activeTab !== 'SETTINGS' ? (
          <div className="max-w-2xl mx-auto mt-20 p-8 bg-slate-800/50 border border-red-500/30 rounded-3xl text-center">
            <Key className="mx-auto text-red-400 mb-4" size={48} />
            <h2 className="text-2xl font-black text-white mb-4">APIキーが設定されていません</h2>
            <p className="text-slate-300 mb-8">システムを稼働させるには、Gemini APIキーが必要です。設定画面からキーを登録してください。</p>
            <button onClick={() => setActiveTab('SETTINGS')} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-bold transition-all">設定画面へ</button>
          </div>
        ) : (
          <>
            {activeTab === 'A' && <TypeA apiKey={apiKey} />}
            {activeTab === 'B' && <TypeB apiKey={apiKey} />}
            {activeTab === 'C' && <TypeC apiKey={apiKey} />}
          </>
        )}

        {/* 設定画面（APIキー入力） */}
        {activeTab === 'SETTINGS' && (
          <div className="max-w-2xl mx-auto mt-12 p-8 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3"><Key className="text-amber-500"/> システム設定</h2>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..." 
                className="w-full p-4 bg-black/50 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white font-mono"
              />
              <p className="text-xs text-slate-500">※キーはブラウザ内にのみ保存され、外部サーバーには送信されません。</p>
              <button 
                onClick={handleSaveKey} 
                className="mt-4 flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 py-4 rounded-xl font-bold transition-all"
              >
                {saveMessage ? <><Check className="text-green-400"/> 保存しました</> : 'キーを保存'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;