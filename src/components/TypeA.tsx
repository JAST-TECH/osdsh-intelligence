// src/components/TypeA.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, MessageSquare, Target, Send, 
  RefreshCw, Globe, Shield, Layers, Network, 
  Info as InfoIcon, Activity, Check, Copy, ArrowLeft, 
  Brain, StickyNote, ShieldAlert, ShieldCheck, 
  Gavel, BrainCircuit, Loader2, Share2, Cpu, Code
} from 'lucide-react';

/**
 * Global Constants & Types
 */
const MODEL_NAME = 'gemini-2.5-flash';
const SYSTEM_VERSION = 'v12.5.21-A-stable';

interface TypeAProps {
  apiKey: string;
}

interface ReportData {
  summaryHeader: string;
  summary: string;
  integratedRisk: string;
  okinawaRisk: string;
  mechanism: string;
  causalChain: string;
  tactical: string;
  strategic: string;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  id: string;
}

/**
 * API Communication Helper
 */
const callGeminiApi = async (apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
  };
  
  const maxRetries = 5;
  const backoffDelays = [1000, 2000, 4000, 8000, 16000];

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429) await new Promise(r => setTimeout(r, 3000));
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("Empty API response");
      return text;
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, backoffDelays[i]));
    }
  }
  return "";
};

/**
 * 1. App Logo Component
 */
const AppLogo: React.FC<{ size?: number; className?: string; id?: string; isScanning?: boolean }> = ({ size = 60, className = "", id = "", isScanning = false }) => (
  <div className={`relative ${className}`} style={{ width: size, height: size }}>
    <svg 
      id={id}
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      className={`object-contain ${isScanning ? 'animate-[spin_3s_linear_infinite]' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="white" stroke="#1e3a8a" strokeWidth="8" />
      <path d="M100 30 L130 90 L190 100 L130 110 L100 170 L70 110 L10 100 L70 90 Z" fill="url(#logoGradA)" />
      <circle cx="100" cy="100" r="25" fill="white" />
      <path d="M85 100 L115 100 M100 85 L100 115" stroke="#1e3a8a" strokeWidth="5" strokeLinecap="round" />
    </svg>
    {isScanning && (
      <div className="absolute inset-0 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    )}
  </div>
);

/**
 * 2. Markdown Parsing Helpers
 */
const renderMarkdownTextSimple = (text: string, forceWhite = false, keyPrefix = "txt"): React.ReactNode => {
  if (typeof text !== 'string') return "";
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|<mark\s+class=["'][^"']+["']\s*>.*?<\/mark>|###?\s+.*)/gi);
  const textColorClass = forceWhite ? "text-slate-100" : "text-slate-900";

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} className="font-bold underline decoration-blue-500/20">{renderMarkdownTextSimple(part.slice(2, -2), forceWhite, `${key}-b`)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <i key={key} className="italic">{renderMarkdownTextSimple(part.slice(1, -1), forceWhite, `${key}-i`)}</i>;
    }
    if (part.startsWith('### ')) {
      return <h3 key={key} className="text-lg font-black mt-4 mb-2 text-blue-900 flex items-center gap-2 underline decoration-blue-500 text-left font-sans">{part.slice(4)}</h3>;
    }
    return <span key={key} className={`${textColorClass} text-left font-sans`}>{part.replace(/<\/?[^>]+(>|$)/g, "")}</span>;
  });
};

const MarkdownTable: React.FC<{ markdown: string; forceWhite?: boolean; idPrefix?: string }> = ({ markdown, forceWhite = false, idPrefix = "tbl" }) => {
  if (!markdown || typeof markdown !== 'string') return null;
  const lines = markdown.trim().split('\n');
  const tableLines = lines.filter(line => line.includes('|'));
  if (tableLines.length < 2) return null;
  
  const rows = tableLines.map(line => {
    const cells = line.split('|').map(c => c.trim());
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();
    return cells;
  }).filter(row => row.length > 1 && !row.every(cell => cell.match(/^[ :\s-]*$/)));
  
  if (rows.length < 2) return null;

  return (
    <div className="overflow-x-auto my-4 border border-slate-700/30 rounded-xl shadow-lg bg-white text-left">
      <table className="w-full text-[13px] text-left border-collapse font-sans">
        <thead>
          <tr className={forceWhite ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900 border-b-2 border-slate-200"}>
            {rows[0].map((h, i) => (
              <th key={`${idPrefix}-th-${i}`} className="p-3 border-r border-slate-200 font-black uppercase tracking-tighter whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={`${idPrefix}-tr-${i}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              {row.map((cell, j) => (
                <td key={`${idPrefix}-td-${i}-${j}`} className="p-3 align-top border-r border-slate-100">
                   <div className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap text-left font-sans">
                     {renderMarkdownText(cell, forceWhite, `${idPrefix}-cell-inner-${i}-${j}`)}
                   </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderMarkdownText = (text: string, forceWhite = false, topLevelKey = "root"): React.ReactNode => {
  if (!text) return "";
  const textStr = String(text);
  if (textStr.includes('|') && textStr.includes('\n|')) {
    const parts = textStr.split(/(\|[^\n]+\|\n\|[ :|-]+\|\n(?:\|[^\n]+\|\n?)+)/g);
    return parts.map((part, i) => {
      const subKey = `${topLevelKey}-section-${i}`;
      if (part.trim().startsWith('|')) {
        return <MarkdownTable key={subKey} markdown={part} forceWhite={forceWhite} idPrefix={subKey} />;
      }
      return renderMarkdownTextSimple(part, forceWhite, subKey);
    });
  }
  return renderMarkdownTextSimple(textStr, forceWhite, topLevelKey);
};

/**
 * 3. Follow-up Chat Component
 */
const FollowUpChat: React.FC<{ dt: string; apiKey: string }> = ({ dt, apiKey }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ id: string | null; type: string | null }>({ id: null, type: null });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: input, id: crypto.randomUUID() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const aiText = await callGeminiApi(apiKey, "日本語で論理的に回答せよ。OSDSHの立場から回答せよ。", input);
      setMessages(prev => [...prev, { role: 'bot', text: aiText, id: crypto.randomUUID() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'bot', text: err.message || 'Error occurred', id: crypto.randomUUID() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (text: string, id: string, type: string) => {
    if (type === 'copy') {
      navigator.clipboard.writeText(text).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      });
    } else if (type === 'keep') {
      window.open(`https://keep.google.com/u/0/#create?text=${encodeURIComponent(text)}`, '_blank');
    } else if (type === 'share') {
      if (navigator.share) navigator.share({ text: text }).catch(() => {});
      else handleAction(text, id, 'copy');
    }
    setActionStatus({ id, type });
    setTimeout(() => setActionStatus({ id: null, type: null }), 2000);
  };

  return (
    <div className="mt-16 bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-200 overflow-hidden text-left text-slate-800">
      <div className="bg-slate-900 p-8 flex items-center gap-4 text-white font-sans">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><MessageSquare size={28} /></div>
        <div className="text-left">
          <h3 className="font-black text-2xl tracking-tight leading-none font-sans">分析結果に対する質問</h3>
          <p className="text-sm text-sky-400 font-bold mt-2 leading-relaxed font-sans text-left">戦略深層ロジックについての質疑に応じます。</p>
        </div>
      </div>
    
      <div className="p-8 bg-slate-50/80">
        <div ref={scrollRef} className="h-[400px] overflow-y-auto mb-8 space-y-8 pr-4 custom-scrollbar text-left">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-40">
              <Brain size={80} strokeWidth={1} /><p className="font-black text-xl mt-4 font-sans text-center">質問事項を記入して投稿してください。</p>
            </div>
          )}
   
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 text-left`}>
              <div className="max-w-[90%] group">
                <div className={`p-6 rounded-[2rem] shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white font-sans' : 'bg-white border-2 border-slate-200 text-slate-800 font-sans'}`}>
                   <div className="text-base font-medium whitespace-pre-wrap leading-relaxed">{m.text}</div>
                </div>
                {m.role === 'bot' && (
                  <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all text-left">
                    <button onClick={() => handleAction(m.text, m.id, 'copy')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-[10px] font-black shadow-sm active:scale-95 text-slate-800 font-sans">
                      {actionStatus.id === m.id && actionStatus.type === 'copy' ? <Check size={12} className="text-green-600"/> : <Copy size={12}/>} コピー
                    </button>
                    <button onClick={() => handleAction(m.text, m.id, 'keep')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-[10px] font-black shadow-sm active:scale-95 text-amber-600 font-sans"><StickyNote size={12}/> Keep</button>
                    <button onClick={() => handleAction(m.text, m.id, 'share')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-[10px] font-black shadow-sm active:scale-95 text-blue-600 font-sans"><Share2 size={12}/> 共有</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-3 p-4">
              <RefreshCw size={24} className="animate-spin text-blue-600" />
              <span className="font-black text-blue-600 uppercase animate-pulse font-sans">Strategic Scrutiny...</span>
            </div>
          )}
        </div>
        <div className="relative group">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            className="w-full pl-8 pr-20 py-6 bg-white border-4 border-slate-200 focus:border-blue-500 rounded-[2.5rem] font-bold shadow-xl transition-all outline-none text-lg text-slate-800 font-sans text-left" 
            placeholder="分析への追加質問を入力..." 
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="absolute right-3 top-3 p-4 bg-blue-600 text-white rounded-[2rem] shadow-lg active:scale-90 hover:bg-blue-700 transition-all"><Send size={24} /></button>
        </div>
      </div>
    </div>
  );
};

/**
 * 4. Generic Table UI Wrapper
 */
const GenericTableParser: React.FC<{ content: string; title: string; icon: React.ElementType; colorClass?: string; idPrefix?: string; isLoading?: boolean }> = ({ content, title, icon: Icon, colorClass, idPrefix = "gt", isLoading = false }) => {
  return (
    <div className="my-2 border-2 border-slate-300 rounded-[2.5rem] shadow-2xl overflow-hidden bg-white text-slate-900 min-h-[100px]">
      <div className={`p-6 flex items-center justify-between text-white ${colorClass || 'bg-slate-900'}`}>
        <div className="flex items-center gap-4">
          <Icon size={26} className="text-white shrink-0" />
          <span className="font-black text-2xl tracking-tight uppercase leading-none font-sans text-left">{title}</span>
        </div>
        {isLoading && <Loader2 size={24} className="animate-spin text-white/50" />}
      </div>
      <div className="p-6 bg-slate-50/50 text-left font-sans">
         {isLoading && !content ? (
           <div className="flex flex-col gap-2 py-4">
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse"></div>
           </div>
         ) : (
           renderMarkdownText(content, false, idPrefix)
         )}
      </div>
    </div>
  );
};

/**
 * 5. Progress Visualizer Component
 */
const AnalysisProgressBar: React.FC<{ progress: number; status: string }> = ({ progress, status }) => (
  <div className="w-full max-w-4xl mx-auto mb-12 animate-in fade-in zoom-in duration-500">
    <div className="flex justify-between items-end mb-4 text-left">
      <div className="text-left">
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1 font-sans">Strategic Scanning Status</p>
        <div className="flex items-center gap-3">
          <Cpu className="text-blue-500 animate-pulse" size={20} />
          <h3 className="text-xl font-black text-white font-sans truncate max-w-[300px]">{status}</h3>
        </div>
      </div>
      <div className="text-right">
        <span className="text-3xl font-black text-blue-500 italic font-sans">{progress}%</span>
      </div>
    </div>
    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-1">
      <div 
        className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-sky-300 rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(16,185,129,0.5)]"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

/**
 * 6. Main Application Component (Type A)
 */
const TypeA: React.FC<TypeAProps> = ({ apiKey }) => {
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false); 
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Initializing Engine...');
  const [report, setReport] = useState<ReportData>({ 
    summaryHeader: "", summary: "", integratedRisk: "", okinawaRisk: "", mechanism: "", 
    causalChain: "", tactical: "", strategic: ""
  });
  const [dt, setDt] = useState('');

  const runAnalysis = async () => {
    if (!val.trim()) return;
    setLoading(true);
    setShowReport(true);
    setProgress(5);
    setStatusMsg('OSDSH Intelligence Core 起動中...');
    
    setReport({ 
      summaryHeader: "", summary: "", integratedRisk: "", okinawaRisk: "", mechanism: "", 
      causalChain: "", tactical: "", strategic: ""
    });

    const dateMatch = val.match(/([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日)/);
    setDt(dateMatch ? dateMatch[0] : "不明");

    const masterSystemPrompt = `【最重要命令：三戦解体戦略レポート】
中国の「三戦」（世論戦・心理戦・法律戦）をOSDSHの基準で徹底解体せよ。
出力は以下のセクションを正確に含め、各セクションの境界には [SECTION_SEPARATOR] を出力せよ。

1. 【記者会見総括】今回の会見が沖縄の主権および日本の安全保障に及ぼす核心的な警告。
2. ## リスク総括分析テーブル（項目、戦略的意図、リスク）
3. ### 【統合リスク分析】テーブル（テーマ、三戦目的、国への影響）
4. ### 【沖縄の主権剥奪リスク】テーブル（リスク定義、管轄権形骸化の論理、帰結）
5. ## 【戦略深層】メカニズム解析テーブル（戦略目標、世論戦・心理戦・法律戦のからくり）
6. ### 【沖縄主権剥奪のメカニズム：因果の鎖】テーブル（ステップ、論点、論理変換、沖縄主権剥奪への変換）
7. ## 対抗戦略・カウンター・ナラティブ案（会見項目、中国側の詭弁、カウンター・ナラティブ案）
8. ## 長期的戦略ナラティブ（戦略目標、日本が発信すべき具体的ナラティブ、主導権掌握への効果）`;

    try {
      setStatusMsg('中国の「三戦」工作ロジックを解体中...');
      const resultText = await callGeminiApi(apiKey, masterSystemPrompt, val);
      setProgress(100);
      setStatusMsg('解析完了。戦略レポートを生成しました。');

      const sections = resultText.split(/\[SECTION_SEPARATOR\]/g).map(s => s.trim());
      
      setReport({
        summaryHeader: sections[0] || "解析失敗",
        summary: sections[1] || "",
        integratedRisk: sections[2] || "",
        okinawaRisk: sections[3] || "",
        mechanism: sections[4] || "",
        causalChain: sections[5] || "",
        tactical: sections[6] || "",
        strategic: sections[7] || ""
      });

    } catch (e: any) {
      console.error(e);
      setReport(prev => ({ ...prev, summaryHeader: `【エラー】通信に失敗しました。` }));
      setStatusMsg('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const getFormattedDateForFile = (dateStr: string) => {
    if (!dateStr || dateStr === "不明") return "00000000";
    const nums = dateStr.match(/\d+/g);
    if (!nums || nums.length < 3) return "00000000";
    return `${nums[0]}${nums[1].padStart(2, '0')}${nums[2].padStart(2, '0')}`;
  };

  const handleWordExport = () => {
    const cleanForWord = (text: string) => text ? text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') : "";
    
    const convertToHtmlForWord = (md: string, title = "") => {
      if(!md) return "";
      const lines = md.trim().split('\n');
      const tableLines = lines.filter(l => l.includes('|'));
      let html = title ? `<p style="font-family:'Meiryo'; font-weight:bold; color:#1e3a8a; margin-top:20pt;">■ ${cleanForWord(title)}</p>` : "";
      
      if (tableLines.length >= 2) {
          html += `<table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; margin-bottom:20pt; font-family:'Meiryo'; font-size:10pt; border:1px solid #000;">`;
          tableLines.forEach((l, i) => {
              const cells = l.split('|').map(c => c.trim()).filter(c => c !== "");
              if (cells.length > 0) {
                const rowStyle = i === 0 ? 'background-color:#eff6ff; font-weight:bold;' : '';
                html += `<tr style="${rowStyle}">`;
                cells.forEach(c => { html += `<td style="border:1px solid #000; vertical-align:top;">${cleanForWord(c)}</td>`; });
                html += `</tr>`;
              }
          });
          return html + `</table>`;
      }
      return `<p style="white-space:pre-wrap; font-family:'Meiryo'; font-size:10pt;">${cleanForWord(md)}</p>`;
    };

    const fullDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><style>body { font-family: "Meiryo"; line-height: 1.5; } h1 { border-bottom: 2pt solid #1e3a8a; } h2 { border-left: 10pt solid #1e3a8a; padding-left: 10pt; }</style></head>
<body>
  <h1>中国複合法律戦 戦略解析レポート (タイプA)</h1>
  <p>対象時期: ${dt}</p>
  <div style="background-color:#eff6ff; padding:10pt; border:1pt solid #1e3a8a;"><b>【記者会見総括】</b><br/>${cleanForWord(report.summaryHeader)}</div>
  ${convertToHtmlForWord(report.summary, "日本へのリスク解体")}
  ${convertToHtmlForWord(report.integratedRisk, "【統合リスク分析】")}
  ${convertToHtmlForWord(report.okinawaRisk, "【沖縄の主権剥奪リスク】")}
  ${convertToHtmlForWord(report.mechanism, "三戦のからくり")}
  ${convertToHtmlForWord(report.causalChain, "沖縄主権剥奪：因果の鎖")}
  ${convertToHtmlForWord(report.tactical, "対抗戦略ナラティブ")}
  ${convertToHtmlForWord(report.strategic, "長期的戦略ナラティブ")}
</body></html>`;

    const blob = new Blob(["\uFEFF" + fullDoc], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `戦略解析レポート_${getFormattedDateForFile(dt)}.doc`;
    link.click();
  };

  const handleZohoHtmlExport = () => {
    const cleanForHtml = (text: string) => text ? text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : "";
    
    const convertToTableHtml = (md: string, title: string) => {
        if(!md) return "";
        const lines = md.trim().split('\n');
        const tableLines = lines.filter(l => l.includes('|'));
        let html = `<h3>${title}</h3>`;
        if (tableLines.length >= 2) {
            html += `<table border="1" style="width:100%; border-collapse:collapse; margin-bottom:20px;">`;
            tableLines.forEach((l, i) => {
                const cells = l.split('|').map(c => c.trim()).filter(c => c !== "");
                if (cells.length > 0) {
                    html += `<tr style="${i === 0 ? 'background-color:#f0f7ff; font-weight:bold;' : ''}">`;
                    cells.forEach(c => { html += `<td style="padding:8px; vertical-align:top;">${cleanForHtml(c)}</td>`; });
                    html += `</tr>`;
                }
            });
            return html + `</table>`;
        }
        return `<p style="white-space:pre-wrap;">${cleanForHtml(md)}</p>`;
    };

    const reportHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>戦略解析レポート</title></head>
      <body style="font-family:sans-serif; line-height:1.6; color:#333; max-width:800px; margin:auto; padding:20px;">
        <h1 style="color:#1e3a8a; border-bottom:2px solid #1e3a8a;">中国複合法律戦 戦略解析レポート (Type A)</h1>
        <p>対象時期: ${dt}</p>
        <div style="background-color:#f0f7ff; padding:15px; border-left:5px solid #1e3a8a;"><strong>【記者会見総括】</strong><br/>${cleanForHtml(report.summaryHeader)}</div>
        ${convertToTableHtml(report.summary, "日本へのリスク解体")}
        ${convertToTableHtml(report.integratedRisk, "【統合リスク分析】")}
        ${convertToTableHtml(report.okinawaRisk, "【沖縄の主権剥奪リスク】")}
        ${convertToTableHtml(report.mechanism, "三戦のからくり")}
        ${convertToTableHtml(report.causalChain, "沖縄主権剥奪：因果の鎖")}
        ${convertToTableHtml(report.tactical, "対抗戦略ナラティブ")}
        ${convertToTableHtml(report.strategic, "長期的戦略ナラティブ")}
      </body></html>
    `;
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ZOHO用データ_${getFormattedDateForFile(dt)}.html`;
    link.click();
  };

  const ActionButtons = () => (
    <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleWordExport} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black shadow-lg transition-all text-sm active:scale-95">
          <Download size={16} /> Word保存
        </button>
        <button onClick={handleZohoHtmlExport} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg transition-all text-sm active:scale-95">
          <Code size={16} /> ZOHO HTML出力
        </button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 font-sans overflow-x-hidden text-left">
      <div className="max-w-6xl mx-auto text-left font-sans">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 pb-8 border-b border-slate-800 text-left font-sans">
          <div className="flex items-center gap-6 text-left font-sans">
            <div className="bg-white p-2 rounded-2xl shadow-2xl relative border-2 border-blue-500/30 shrink-0">
              <AppLogo size={48} id="main-logo-a" isScanning={loading} />
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-black px-1 rounded border border-white shadow-sm font-sans text-left">OSDSH</div>
            </div>
            <div className="text-left font-sans">
              <p className="text-xs font-black text-slate-500 tracking-widest uppercase font-sans">Strategic Analysis Engine (Type A)</p>
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none font-sans">中国複合法律戦 統合解析システム</h1>
                <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded leading-none shrink-0 shadow-sm border border-white/20 font-sans">{SYSTEM_VERSION}</span>
              </div>
            </div>
          </div>
          {showReport && (
            <div className="flex items-center gap-4">
               {!loading && <ActionButtons />}
               <button onClick={() => { setShowReport(false); setReport({ summaryHeader: "", summary: "", integratedRisk: "", okinawaRisk: "", mechanism: "", causalChain: "", tactical: "", strategic: "" }); setProgress(0); }} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-2xl font-black active:scale-95 transition-all text-sm border border-slate-600 shadow-lg font-sans">
                 <ArrowLeft size={18} /> <span>入力に戻る</span>
               </button>
            </div>
          )}
        </header>

        {!showReport && !loading && (
          <section className="bg-slate-900/50 p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-800 backdrop-blur-xl animate-in fade-in duration-500 text-left font-sans">
            <div className="mb-8 p-6 bg-blue-950/40 border-l-[8px] border-blue-600 rounded-r-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1 text-left font-sans">
                <div className="flex items-center gap-2 mb-3 text-white font-sans text-left">
                  <Shield size={24} className="text-blue-400" />
                  <span className="font-black text-blue-400 text-xl tracking-tight uppercase">タイプA 戦略解体・ナラティブ構築</span>
                </div>
                <p className="text-slate-300 font-medium text-sm leading-relaxed text-left">中国外交部会見等のテキストを貼り付けて解析を開始してください。</p>
              </div>
              <a href="https://www.mfa.gov.cn/fyrbt_673021/jzhsl_673025/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all border border-blue-400 font-sans">
                <Globe size={24} />
                <span className="text-lg font-black font-sans">中国外交部公式サイト</span>
              </a>
            </div>
            <textarea 
              className="w-full h-80 p-8 bg-black/60 border-2 border-slate-800 rounded-[2.5rem] focus:ring-4 focus:ring-blue-600/50 outline-none text-lg text-white font-medium placeholder-slate-600 font-sans text-left" 
              placeholder="会見テキストを貼り付け..." 
              value={val} 
              onChange={(e) => setVal(e.target.value)} 
            />
            <div className="mt-8">
              <button onClick={runAnalysis} disabled={!val.trim()} className="w-full py-6 rounded-[2rem] font-black text-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white active:scale-95 transition-all flex items-center justify-center gap-4 border border-blue-400/30 shadow-2xl font-sans text-left px-12">
                <Target size={32} /> 戦略リスク解析を開始
              </button>
            </div>
          </section>
        )}

        {loading && !showReport && (
          <div className="text-center py-40 flex flex-col items-center justify-center animate-in zoom-in duration-300 font-sans">
            <AppLogo size={140} className="mb-12" isScanning={true} />
            <p className="text-3xl font-black text-blue-500 tracking-[0.2em] uppercase italic animate-pulse font-sans">Deconstructing Three-Wars...</p>
          </div>
        )}

        {showReport && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 text-left font-sans text-left">
            {loading && <AnalysisProgressBar progress={progress} status={statusMsg} />}
            {!loading && (
              <div className="flex justify-between items-center mb-6 text-left font-sans">
                <div className="bg-green-900/40 text-green-400 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-green-800 flex items-center gap-2">
                  <Check size={14}/> Strategic Scan Complete
                </div>
                <ActionButtons />
              </div>
            )}
            
            <div className="bg-[#fcfcfc] p-6 md:p-16 rounded-[2.5rem] shadow-4xl text-slate-900 border border-emerald-200 text-left font-sans">
              <div className="mb-12 border-b-2 border-slate-100 pb-8 text-left font-sans text-left">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase font-sans text-left">中国複合法律戦 戦略解析レポート (Type A)</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 font-sans text-left text-left">OSDSH DECONSTRUCTION SESSION: {dt}</p>
              </div>
              
              <div className="mb-16 text-left font-sans">
                <h2 className="text-2xl font-black text-blue-800 border-l-[10px] border-blue-800 pl-4 mb-8 flex items-center gap-3 font-sans text-left"><InfoIcon /> 会見内容の総括</h2>
                <div className="p-8 bg-blue-50 border-2 border-blue-100 rounded-3xl mb-12 shadow-sm text-left">
                  {loading && !report.summaryHeader ? <div className="animate-pulse h-4 bg-blue-100 rounded w-full"></div> : <div className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap font-sans text-left">{renderMarkdownText(report.summaryHeader, false, "sh")}</div>}
                </div>
                
                <GenericTableParser content={report.summary} title="リスク解体：三戦分解" icon={Target} colorClass="bg-blue-800" idPrefix="sum" isLoading={loading} />
                <GenericTableParser content={report.integratedRisk} title="統合リスク分析" icon={Network} colorClass="bg-red-700" idPrefix="int" isLoading={loading} />
                <GenericTableParser content={report.okinawaRisk} title="沖縄の主権剥奪リスク" icon={ShieldAlert} colorClass="bg-amber-600" idPrefix="okr" isLoading={loading} />
                
                <h2 className="text-2xl font-black text-indigo-800 border-l-[10px] border-indigo-800 pl-4 mt-20 mb-8 flex items-center gap-3 font-sans text-left"><Gavel /> 戦略深層メカニズム</h2>
                <GenericTableParser content={report.mechanism} title="三戦のからくり" icon={Activity} colorClass="bg-indigo-700" idPrefix="mec" isLoading={loading} />
                <GenericTableParser content={report.causalChain} title="因果の鎖：主権剥奪プロセス" icon={Layers} colorClass="bg-slate-800" idPrefix="cau" isLoading={loading} />
                
                <h2 className="text-2xl font-black text-blue-900 border-l-[10px] border-blue-900 pl-4 mt-20 mb-8 flex items-center gap-3 font-sans text-left"><ShieldCheck /> 対抗戦略ナラティブ</h2>
                <GenericTableParser content={report.tactical} title="カウンター・ナラティブ案" icon={Check} colorClass="bg-blue-900" idPrefix="tac" isLoading={loading} />
                <GenericTableParser content={report.strategic} title="長期的戦略ナラティブ" icon={BrainCircuit} colorClass="bg-indigo-900" idPrefix="str" isLoading={loading} />
              </div>

              {!loading && (
                <div className="mt-12 pt-10 border-t border-slate-100 flex justify-center">
                  <ActionButtons />
                </div>
               )}
            </div>

            <FollowUpChat dt={dt} apiKey={apiKey} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeA;