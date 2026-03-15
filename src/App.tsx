import React, { useState } from 'react';
import { Shield, BookOpen, BrainCircuit } from 'lucide-react';
import TypeA from './components/TypeA';
import TypeB from './components/TypeB';
import TypeC from './components/TypeC';

type TabType = 'A' | 'B' | 'C';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('A');

  return (
    <div className="min-h-screen bg-[#060b1a] text-slate-100 font-sans flex flex-col">
      {/* ナビゲーションバー */}
      <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" size={28} />
            <span className="font-black text-xl tracking-widest uppercase">OSDSH Intelligence</span>
          </div>
          
          {/* タブメニュー（設定タブは削除済み） */}
          <div className="flex bg-slate-800 rounded-xl p-1 overflow-x-auto">
            <button onClick={() => setActiveTab('A')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'A' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Shield size={16}/> Type A</button>
            <button onClick={() => setActiveTab('B')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'B' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><BookOpen size={16}/> Type B</button>
            <button onClick={() => setActiveTab('C')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'C' ? 'bg-lime-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><BrainCircuit size={16}/> Type C</button>
          </div>
        </div>
      </nav>

      {/* コンテンツ領域（警告画面なしで直接表示） */}
      <main className="flex-grow">
        {activeTab === 'A' && <TypeA />}
        {activeTab === 'B' && <TypeB />}
        {activeTab === 'C' && <TypeC />}
      </main>
    </div>
  );
};

export default App;