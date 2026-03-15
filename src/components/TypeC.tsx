// src/components/TypeC.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, Zap, XCircle, Calendar, 
  FileSearch, Edit3, Fingerprint, ArrowLeft,
  ShieldAlert, BrainCircuit, Network, Info as InfoIcon,
  Code, Check
} from 'lucide-react';

/**
 * =============================================================================
 * 1. CONFIG & CONSTANTS & TYPES
 * =============================================================================
 */
const MODEL_NAME = 'gemini-2.5-flash';
const SYSTEM_VERSION = 'v1.6.9-Unified-Gold';

const PUBLISHER = "沖縄主権防衛戦略本部";
const DEVELOPER = "一般社団法人日本沖縄政策研究フォーラム";
const ENG_NAME = "Okinawa Sovereignty Defense Strategic Headquarters";

interface ReportData {
  summary: string;
  narrativeDeconstruction: string;
  risks: string;
  okinawa: string;
  countermeasures: string;
  infoName: string;
}

interface InputState {
  typeA: string;
  typeB: string;
  fileA: string;
  fileB: string;
}

interface DateState {
  dateA: string;
  dateB: string;
}

interface EditState {
  editA: boolean;
  editB: boolean;
}

/**
 * =============================================================================
 * 2. LOGIC & UTILITIES
 * =============================================================================
 */
const sanitizeForDisplay = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/```[a-z]*\n?/g, "") 
    .replace(/<\/?[^>]+(>|$)/g, "") 
    .trim();
};

const parseDateString = (text: string, filename = ""): string => {
  if (!text && !filename) return "";
  const clean = (t: string) => String(t)
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) 
    .replace(/\s+/g, ' ');
  
  const source = clean(`${filename} ${text}`);
  const labelMatch = source.match(/(?:対象時期|時期|記者会見|日付).{0,15}?(\d{4})[\s年\.\-\/](\d{1,2})[\s月\.\-\/](\d{1,2})/);
  if (labelMatch) {
    return `${labelMatch[1]}年${labelMatch[2].padStart(2, '0')}月${labelMatch[3].padStart(2, '0')}日`;
  }
  const yyyymmddMatch = source.match(/(?:_|^|\s|:)(20\d{2})([01]\d)([0-3]\d)(?:\b|$|_|\.)/);
  if (yyyymmddMatch) {
    return `${yyyymmddMatch[1]}年${yyyymmddMatch[2]}月${yyyymmddMatch[3]}日`;
  }
  return "";
};

const parseSessionName = (text: string, fallbackDate: string): string => {
  const plain = String(text || "").replace(/<\/?[^>]+(>|$)/g, " ");
  const infoLabelMatch = plain.match(/【(?:翻訳分析対象の)?情報名】\s*([\s\S]+?)(?:\n|■|###|【|$)/);
  if (infoLabelMatch && infoLabelMatch[1].trim().length > 5) return infoLabelMatch[1].trim();
  
  const speakerMatch = plain.match(/(\d{4}年\d{1,2}月\d{1,2}日\s*外交部報道官.*?記者会見)/);
  if (speakerMatch) return speakerMatch[1].trim();
  
  return `${fallbackDate || '不明'} 中国外交部定例記者会見`;
};

// src/components/TypeA.tsx, TypeB.tsx, TypeC.tsx 内の関数を上書き

const callGeminiApi = async (systemPrompt: string, userPrompt: string, isJson = false): Promise<any> => {
  // 通信先を自分の中継API（Vercelサーバー）に変更
  const url = '/api/gemini';
  
  const payload = {
    systemPrompt,
    userPrompt,
    model: MODEL_NAME,
    isJson
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      return isJson ? JSON.parse(text) : text;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, backoffDelays[i]));
    }
  }
};

/**
 * =============================================================================
 * 3. INTERNAL UI COMPONENTS
 * =============================================================================
 */
const AppLogo: React.FC<{ size?: number; className?: string; isScanning?: boolean }> = ({ size = 60, className = "", isScanning = false }) => (
  <div className={`relative ${className}`} style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="logoGradStableFinal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#84cc16" /><stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="white" stroke="#3f6212" strokeWidth="8" className={isScanning ? 'animate-pulse' : ''} />
      <path d="M100 30 L130 90 L190 100 L130 110 L100 170 L70 110 L10 100 L70 90 Z" fill="url(#logoGradStableFinal)" className={isScanning ? 'animate-spin origin-center' : ''} style={{ transformOrigin: 'center' }} />
      <circle cx="100" cy="100" r="25" fill="white" />
      <path d="M85 100 L115 100 M100 85 L100 115" stroke="#3f6212" strokeWidth="5" strokeLinecap="round" />
    </svg>
    {isScanning && <div className="absolute inset-0 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>}
  </div>
);

const OSDSHLogo: React.FC<{ size?: number; className?: string }> = ({ size = 100, className = "" }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
      <defs>
        <linearGradient id="shGradFinal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" /><stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <path d="M100 20 L170 50 C170 120 100 180 100 180 C100 180 30 120 30 50 Z" fill="url(#shGradFinal)" stroke="#84cc16" strokeWidth="8"/>
      <text x="100" y="115" fontSize="48" fontWeight="900" fill="#84cc16" textAnchor="middle" fontFamily="Arial Black">OS</text>
      <text x="100" y="155" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle" letterSpacing="4">DEFENSE</text>
    </svg>
    <div className="text-[#84cc16] font-black text-[10px] mt-2 tracking-[0.1em] uppercase text-center font-sans max-w-[320px] leading-tight">{ENG_NAME}</div>
  </div>
);

const MarkdownTable: React.FC<{ markdown: string }> = ({ markdown }) => {
  if (!markdown) return null;
  const lines = markdown.trim().split('\n').filter(l => l.includes('|'));
  if (lines.length < 2) return null;
  
  const rows = lines.map(line => line.split('|').filter(c => c !== "").map(c => c.trim())).filter(r => r.length > 0 && !r.every(c => c.match(/^[ :-]*$/)));
  
  return (
    <div className="overflow-x-auto my-6 border border-slate-200 rounded-2xl shadow-lg bg-white text-left">
      <table className="w-full text-[13.5px] border-collapse font-sans text-left">
        <thead>
          <tr className="bg-lime-50 text-lime-950 border-b-2 border-lime-200">
            {rows[0].map((h, i) => <th key={i} className="p-4 border-r border-lime-100 font-black uppercase tracking-tighter text-left">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="p-4 align-top border-r border-slate-50 text-slate-800 leading-relaxed font-medium">
                  {cell.split(/(\*\*.*?\*\*)/).map((p, k) => p.startsWith('**') ? <strong key={k} className="text-lime-800 font-bold">{p.slice(2, -2)}</strong> : p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SectionRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\|[^\n]+\|\n\|[ :|-]+\|\n(?:\|[^\n]+\|\n?)+)/g);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.trim().startsWith('|')) {
          return <MarkdownTable key={i} markdown={part} />;
        }
        return (
          <div key={i} className="whitespace-pre-wrap mb-4 text-left leading-relaxed">
            {part.split(/(\*\*.*?\*\*)/).map((p, k) => p.startsWith('**') ? <strong key={k} className="text-lime-700 font-black">{p.slice(2, -2)}</strong> : p)}
          </div>
        );
      })}
    </>
  );
};

const DateDisplay: React.FC<{ 
  side: 'A' | 'B'; 
  date: string; 
  setDates: React.Dispatch<React.SetStateAction<DateState>>; 
  editStates: EditState; 
  setEditStates: React.Dispatch<React.SetStateAction<EditState>> 
}> = ({ side, date, setDates, editStates, setEditStates }) => {
  const isEditing = editStates[`edit${side}` as keyof EditState];
  
  return (
    <div className="flex items-center gap-2 text-[10px]">
      {isEditing ? (
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-lime-500 animate-in zoom-in-95">
          <input 
            className="bg-transparent text-white w-28 outline-none px-2 text-center font-sans" 
            value={date} 
            onChange={(e) => setDates(prev => ({...prev, [`date${side}`]: e.target.value}))} 
          />
          <button onClick={() => setEditStates(prev => ({...prev, [`edit${side}`]: false}))} className="text-lime-50 font-black px-1">確定</button>
        </div>
      ) : (
        <div className={`px-3 py-1 rounded-full border ${date ? 'border-lime-500/30 text-lime-400 bg-lime-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
          <Calendar size={10} className="inline mr-1" />
          {date || '日付未検出'}
          <button onClick={() => setEditStates(prev => ({...prev, [`edit${side}`]: true}))} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><Edit3 size={10}/></button>
        </div>
      )}
    </div>
  );
};

/**
 * =============================================================================
 * 4. MAIN APPLICATION COMPONENT
 * =============================================================================
 */
const TypeC: React.FC = () => {
  const [inputs, setInputs] = useState<InputState>({ typeA: '', typeB: '', fileA: '', fileB: '' });
  const [dates, setDates] = useState<DateState>({ dateA: '', dateB: '' });
  const [editStates, setEditStates] = useState<EditState>({ editA: false, editB: false });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Standby');
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!editStates.editA) setDates(prev => ({ ...prev, dateA: parseDateString(inputs.typeA, inputs.fileA) }));
  }, [inputs.typeA, inputs.fileA, editStates.editA]);

  useEffect(() => {
    if (!editStates.editB) setDates(prev => ({ ...prev, dateB: parseDateString(inputs.typeB, inputs.fileB) }));
  }, [inputs.typeB, inputs.fileB, editStates.editB]);

  const generateUnifiedHtml = useCallback(() => {
    if (!report) return "";
    const clean = (t: string) => sanitizeForDisplay(t).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    
    const tableToHtml = (md: string) => {
      const lines = md.trim().split('\n').filter(l => l.includes('|'));
      if (lines.length < 2) return `<p style="font-size:11pt; color:#1e293b; text-align:left;">${clean(md)}</p>`;
      
      const rows = lines.map(line => line.split('|').filter(c => c !== "").map(c => c.trim())).filter(r => r.length > 0 && !r.every(c => c.match(/^[ :-]*$/)));
      let html = `<table border="1" cellspacing="0" cellpadding="12" style="width:100%; border-collapse:collapse; margin-bottom:25pt; font-family:'Meiryo',sans-serif; font-size:10pt; border:1px solid #1e293b; text-align:left;">`;
      
      rows.forEach((row, i) => {
        const bg = i === 0 ? 'background-color:#f8fafc; font-weight:bold;' : '';
        html += `<tr style="${bg}">`;
        row.forEach(cell => { html += `<td style="border:1px solid #cbd5e1; vertical-align:top; text-align:left;">${cell.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</td>`; });
        html += `</tr>`;
      });
      return html + `</table>`;
    };

    return `
      <div style="font-family:'Meiryo',sans-serif; line-height:1.6; color:#1e293b; text-align:left; max-width:850px; margin:auto; background-color:#ffffff; padding:40px;">
        <table border="0" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-bottom:20pt;">
          <tr>
            <td style="text-align:left; vertical-align:top;">
              <p style="color:#84cc16; font-weight:900; font-size:36pt; margin:0; line-height:1;">[ OSDSH ]</p>
              <p style="font-size:10pt; letter-spacing:1pt; color:#1e293b; margin:5pt 0 0 0; font-weight:bold; text-transform:uppercase;">${ENG_NAME}</p>
            </td>
          </tr>
        </table>
        
        <h1 style="border-bottom:5pt solid #84cc16; color:#0f172a; font-size:26pt; margin-bottom:25pt; padding-bottom:12pt; font-weight:900; text-align:left;">ナラティブ侵略解析サマリー</h1>
        
        <table border="0" cellspacing="0" cellpadding="25" style="width:100%; border-collapse:collapse; background-color:#020617; color:#ffffff; border-radius:15pt; border-left:25pt solid #84cc16; margin-bottom:40pt;">
          <tr>
            <td style="text-align:left;">
              <p style="margin:0; font-size:11pt; color:#84cc16; font-weight:900; letter-spacing:4pt; text-transform:uppercase;">INTELLIGENCE ANALYSIS TARGET</p>
              <p style="margin:12pt 0 0 0; font-size:22pt; font-weight:900; line-height:1.3; color:#ffffff;">${report.infoName}</p>
              <p style="margin:10pt 0 0 0; font-size:13pt; color:#ffffff; opacity:0.8;">会見実施日：${dates.dateB}</p>
            </td>
          </tr>
        </table>

        <div style="margin-bottom:45pt;">
          <p style="font-weight:900; color:#0f172a; font-size:19pt; margin-bottom:18pt; border-left:12pt solid #0f172a; padding-left:18pt; text-align:left;">■ 本日の核心</p>
          <div style="background-color:#f7fee7; padding:30pt; border:2pt solid #84cc16; border-radius:18pt; color:#14532d; font-size:13pt; line-height:1.9; text-align:left; shadow: 0 4px 6px rgba(0,0,0,0.05);">${clean(report.summary)}</div>
        </div>

        <div style="margin-bottom:45pt;">
          <h3 style="background-color:#9f1239; color:#ffffff; border-left:15pt solid #84cc16; padding:15pt; margin-top:45pt; font-size:19pt; font-weight:900; text-align:left;">ナラティブ侵略の構造解体</h3>
          <div style="background-color:#fff1f2; border:4pt dashed #e11d48; padding:30pt; border-radius:18pt; color:#9f1239; font-size:12.5pt; line-height:1.8; text-align:left;">
            <p style="font-weight:900; margin-bottom:18pt; font-size:16pt; text-decoration:underline; color:#881337; text-align:left;">【ナラティブ侵略の構造解体分析】</p>
            ${clean(report.narrativeDeconstruction)}
          </div>
        </div>

        <h3 style="background-color:#f8fafc; border-left:15pt solid #84cc16; padding:15pt; color:#0f172a; margin-top:40pt; font-size:19pt; font-weight:900; text-align:left;">核心リスク・マトリクス</h3>
        ${tableToHtml(report.risks)}

        <h3 style="background-color:#f8fafc; border-left:15pt solid #84cc16; padding:15pt; color:#0f172a; margin-top:40pt; font-size:19pt; font-weight:900; text-align:left;">沖縄・南西諸島への直接波及</h3>
        ${tableToHtml(report.okinawa)}

        <h3 style="background-color:#f8fafc; border-left:15pt solid #84cc16; padding:15pt; color:#0f172a; margin-top:40pt; font-size:19pt; font-weight:900; text-align:left;">即時カウンター・ナラティブ案</h3>
        ${tableToHtml(report.countermeasures)}

        <div style="font-size:11pt; margin-top:100pt; border-top:2.5pt solid #e2e8f0; padding-top:35pt; color:#475569; line-height:1.9; text-align:left;">
          <p style="margin:0; font-weight:bold; color:#1e293b;">発行者：${PUBLISHER}</p>
          <p style="margin:0; font-weight:bold; color:#1e293b;">ツール開発：${DEVELOPER}</p>
          <p style="margin-top:15pt; font-size:10pt; opacity:0.6;">© 2026 OSDSH INFRASTRUCTURE / System Intel Gold v1.6.9</p>
        </div>
      </div>`;
  }, [report, dates.dateB]);

  const handleCopyHtml = useCallback(() => {
    const fullHtml = generateUnifiedHtml();
    if (!fullHtml) return;
    
    navigator.clipboard.writeText(fullHtml).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }).catch(err => {
      console.error('Clipboard write failed, using fallback', err);
      const textArea = document.createElement("textarea");
      textArea.value = fullHtml;
      textArea.style.position = "fixed"; 
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        if (document.execCommand('copy')) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 3000);
        }
      } catch (err) { console.error('Copy failed', err); }
      document.body.removeChild(textArea);
    });
  }, [generateUnifiedHtml]);

  const handleExportWord = useCallback(() => {
    const fullHtml = generateUnifiedHtml();
    if (!fullHtml) return;
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='[http://www.w3.org/TR/REC-html40](http://www.w3.org/TR/REC-html40)'>
      <head><meta charset='utf-8'></head><body>${fullHtml}</body></html>`;
      
    const blob = new Blob(["\uFEFF" + docHtml], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ナラティブ侵略解析_${dates.dateB.replace(/[年月日]/g, '')}.doc`;
    link.click();
  }, [generateUnifiedHtml, dates.dateB]);

  const runAnalysis = async () => {
    if (!dates.dateA || !dates.dateB || dates.dateA !== dates.dateB) {
      setError(`日付の不一致または未検出です。(A: ${dates.dateA || 'なし'} / B: ${dates.dateB || 'なし'}) 手動で日付を修正してください。`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress(10);
    setStatusMsg('認知戦構造を解体中...');
    
    const infoName = parseSessionName(inputs.typeB, dates.dateB);
    const systemPrompt = `【重要命令：三戦解体ナラティブ侵略解析】
中国外交部の発言がいかに日本の主権を侵食しようとしているか（ナラティブ侵略）を暴け。

構成指針：
1. 【本日の核心】：戦略的詳細文体で記述せよ（例：中国外交部は、日米同盟の強化を「地域覇権主義」と断定し...）。
2. 【ナラティブ侵略の構造解体】：キーワードを抽出し、日本側の認識をどう書き換えようとしているか解体せよ（例：歴史的罪責ナラティブは過去の犯罪と結びつけ...）。
3. 【核心リスク・マトリクス】：（テーブル形式）
4. 【沖縄・南西諸島への直接波及】：（テーブル形式）
5. 【即時カウンター・ナラティブ案】：（テーブル形式）
各セクションは必ず [SECTION_SEPARATOR] という文字列のみで区切ること。HTMLタグは含めない。`;

    try {
      const combined = `【A:戦略データ】\n${inputs.typeA}\n\n【B:各論データ】\n${inputs.typeB}`;
      setProgress(40);
      const res = await callGeminiApi(systemPrompt, combined);
      setProgress(90);
      
      const sections = res.split(/\[SECTION_SEPARATOR\]/g).map((s: any) => s.trim());
      setReport({
        summary: sections[0] || "",
        narrativeDeconstruction: sections[1] || "",
        risks: sections[2] || "",
        okinawa: sections[3] || "",
        countermeasures: sections[4] || "",
        infoName: infoName
      });
      setProgress(100);
    } catch (e: any) {
      setError(`解析エラー: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 font-sans text-slate-100 text-left overflow-x-hidden">
      {/* Copy Success Bar */}
      {copySuccess && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-lime-500 text-slate-950 px-8 py-4 rounded-2xl font-black shadow-3xl animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 border-2 border-white/20">
          <Check size={24} />
          <span>HTMLをクリップボードにコピーしました</span>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border-2 border-red-500 rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-4xl text-left">
            <XCircle size={64} className="text-red-500 mx-auto mb-6" />
            <p className="text-white font-black text-lg mb-8 whitespace-pre-wrap">{error}</p>
            <button onClick={() => setError(null)} className="w-full py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-black text-white transition-all shadow-lg active:scale-95 uppercase tracking-widest">閉じる</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto text-left">
        <header className="mb-12 pb-10 border-b border-slate-800 text-left space-y-6">
          <div className="flex items-center gap-6 text-left">
            <AppLogo size={64} isScanning={loading} />
            <div className="text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none text-left bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-sans">中国外交部記者会見<br className="md:hidden" />ナラティブ侵略解析システム</h1>
            </div>
            {report && !loading && (
              <button onClick={() => setReport(null)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-2xl font-black text-sm transition-all border border-slate-700 shadow-lg active:scale-90"><ArrowLeft size={18}/> 戻る</button>
            )}
          </div>
          <div className="flex flex-col space-y-2 border-l-4 border-lime-500 pl-6 text-left">
            <p className="text-[13px] text-lime-400 font-black tracking-[0.2em] uppercase leading-tight text-left font-sans">{ENG_NAME}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] text-left">Sovereignty Defense Intelligence Core | {SYSTEM_VERSION}</p>
          </div>
        </header>

        {!report && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 text-left">
            {[ {id:'A', label:'戦略解析データ (Type A)', color:'lime'}, {id:'B', label:'個別影響分析データ (Type B)', color:'emerald'} ].map(side => (
              <div key={side.id} className="space-y-4 text-left">
                <div className="flex justify-between items-center px-2 text-left">
                  <label className={`text-${side.color}-400 font-black text-xs uppercase tracking-widest text-left`}>{side.label}</label>
                  <DateDisplay side={side.id as 'A' | 'B'} date={dates[`date${side.id}` as keyof DateState]} setDates={setDates} editStates={editStates} setEditStates={setEditStates} />
                </div>
                <input 
                  className="w-full bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-xs text-slate-400 focus:border-lime-500 outline-none transition-all placeholder:text-slate-700 text-left" 
                  placeholder="ファイル名を入力して日付抽出を補助" 
                  value={inputs[`file${side.id}` as keyof InputState]} 
                  onChange={(e) => setInputs(prev => ({...prev, [`file${side.id}`]: e.target.value}))} 
                />
                <textarea 
                  className="w-full h-96 p-6 bg-slate-900/40 border-2 border-slate-800 rounded-[2.5rem] focus:border-lime-500 outline-none text-sm transition-all text-white placeholder:text-slate-800 font-sans leading-relaxed text-left" 
                  placeholder="本文を貼り付けてください..." 
                  value={inputs[`type${side.id}` as keyof InputState]} 
                  onChange={(e) => setInputs(prev => ({...prev, [`type${side.id}`]: e.target.value}))} 
                />
              </div>
            ))}
            <button onClick={runAnalysis} className="md:col-span-2 py-8 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 rounded-[2.5rem] font-black text-2xl shadow-3xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 border-2 border-white/10 uppercase tracking-widest">
              <Zap size={32}/> 解析サマリーを生成
            </button>
          </div>
        )}

        {loading && (
          <div className="py-52 text-center animate-pulse flex flex-col items-center">
            <AppLogo size={120} isScanning={true} />
            <p className="mt-10 text-2xl font-black text-lime-500 uppercase tracking-[0.3em] italic text-center">Deconstructing Intelligence...</p>
            <div className="max-w-md w-full mt-10 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-lime-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-4 text-slate-500 font-bold text-xs uppercase tracking-widest">{statusMsg}</p>
          </div>
        )}

        {report && !loading && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 text-left pb-32">
            <div className="bg-white p-10 md:p-20 rounded-[4.5rem] text-slate-900 shadow-5xl border border-slate-100 text-left relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-8 border-lime-500 pb-12 mb-14 text-left w-full gap-8 text-left">
                <OSDSHLogo size={90} className="md:items-start" />
                <div className="text-left flex-1 text-left">
                  <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none text-left mb-2 font-sans">ナラティブ侵略解析サマリー</h2>
                  <p className="text-lime-600 font-black text-[13px] tracking-[0.2em] uppercase text-left leading-none font-sans">Intelligence Target Session Date: {dates.dateB}</p>
                </div>
                <div className="flex gap-4 text-left">
                  <button onClick={handleExportWord} title="Word保存" className="bg-slate-950 text-white p-5 rounded-3xl hover:bg-slate-800 transition-all shadow-xl active:scale-90 border-2 border-white/10"><Download size={24}/></button>
                  <button onClick={handleCopyHtml} title="HTMLコピー" className="bg-lime-600 text-white p-5 rounded-3xl hover:bg-lime-500 transition-all shadow-xl active:scale-90 border-2 border-white/10"><Code size={24}/></button>
                </div>
              </div>

              <div className="bg-slate-950 text-white p-12 rounded-[3rem] mb-20 border-l-[24px] border-lime-50 shadow-4xl flex items-center gap-10 text-left animate-in zoom-in-95 duration-500 text-left">
                <div className="bg-lime-500/10 p-4 rounded-3xl border border-lime-500/20 shadow-inner"><FileSearch className="text-lime-400" size={48}/></div>
                <div className="text-left flex-1 space-y-1 text-left">
                  <span className="text-[12px] font-black text-lime-500 uppercase tracking-[0.3em] mb-2 block text-left opacity-80 font-sans text-left">Analysis Target session</span>
                  <h4 className="text-2xl md:text-3xl font-black leading-tight text-left tracking-tight font-sans text-left">{report.infoName}</h4>
                </div>
              </div>

              <div className="space-y-24 text-left">
                <section className="text-left">
                  <h3 className="text-3xl font-black text-lime-950 border-l-[16px] border-lime-50 pl-8 mb-10 flex items-center gap-5 text-left font-sans text-left"><InfoIcon size={32} className="text-lime-600"/> 本日の核心</h3>
                  <div className="p-12 bg-lime-50/60 border-2 border-lime-100 rounded-[3.5rem] text-[20px] font-bold text-slate-800 leading-[1.8] text-left shadow-md font-sans text-left">
                    <SectionRenderer text={report.summary} />
                  </div>
                </section>

                <section className="text-left animate-in slide-in-from-left duration-700 text-left">
                  <h3 className="text-3xl font-black text-red-900 border-l-[16px] border-red-600 pl-8 mb-10 flex items-center gap-5 text-left font-sans text-left"><Fingerprint size={32} className="text-red-600"/> ナラティブ侵略の構造解体</h3>
                  <div className="p-12 bg-red-50/50 border-4 border-red-200 border-dashed rounded-[3.5rem] text-[18px] font-medium text-slate-800 leading-[1.8] text-left shadow-lg font-sans text-left">
                    <p className="font-black text-red-800 mb-6 underline text-2xl tracking-tighter text-left">【ナラティブ侵略の構造解体分析】</p>
                    <SectionRenderer text={report.narrativeDeconstruction} />
                  </div>
                </section>

                <section className="text-left text-left">
                  <div className="bg-emerald-900 text-white p-10 rounded-t-[3.5rem] font-black text-2xl uppercase tracking-widest flex items-center gap-5 shadow-2xl text-left font-sans text-left"><ShieldAlert size={36}/> 核心リスク・マトリクス</div>
                  <div className="p-8 bg-slate-50 border-x-2 border-b-2 border-slate-100 rounded-b-[3.5rem] text-left shadow-sm text-left font-sans">
                    <SectionRenderer text={report.risks} />
                  </div>
                </section>
                
                <section className="text-left text-left">
                  <div className="bg-lime-800 text-white p-10 rounded-t-[3.5rem] font-black text-2xl uppercase tracking-widest flex items-center gap-5 shadow-2xl text-left font-sans text-left"><Network size={36}/> 沖縄・南西諸島への直接波及</div>
                  <div className="p-8 bg-slate-50 border-x-2 border-b-2 border-slate-100 rounded-b-[3.5rem] text-left shadow-sm text-left font-sans text-left">
                    <SectionRenderer text={report.okinawa} />
                  </div>
                </section>
                
                <section className="text-left text-left">
                  <div className="bg-slate-900 text-white p-10 rounded-t-[3.5rem] font-black text-2xl uppercase tracking-widest flex items-center gap-5 shadow-2xl text-left font-sans text-left text-left"><BrainCircuit size={36}/> 即時カウンター・ナラティブ案</div>
                  <div className="p-8 bg-slate-50 border-x-2 border-b-2 border-slate-100 rounded-b-[3.5rem] text-left shadow-sm text-left font-sans text-left">
                    <SectionRenderer text={report.countermeasures} />
                  </div>
                </section>
              </div>

              <footer className="mt-32 pt-14 border-t-4 border-slate-100 text-left text-left">
                <div className="flex flex-col gap-6 text-left">
                  <div className="space-y-1 text-left text-left">
                    <p className="text-slate-950 font-black text-lg text-left font-sans text-left">発行者：{PUBLISHER}</p>
                    <p className="text-slate-600 font-bold text-sm text-left font-sans text-left">ツール開発：{DEVELOPER}</p>
                  </div>
                  <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
                    <span className="text-[12px] text-slate-400 font-black tracking-[0.4em] uppercase text-left font-sans text-left">© 2026 OSDSH INFRASTRUCTURE</span>
                    <span className="text-[11px] text-slate-300 font-bold tracking-widest uppercase italic text-left font-sans text-left">{ENG_NAME}</span>
                  </div>
                </div>
              </footer>
            </div>

            <div className="bg-slate-900/80 p-12 rounded-[4rem] border border-slate-800 text-left shadow-inner backdrop-blur-xl text-left">
              <h4 className="text-base font-black text-lime-400 mb-8 flex items-center gap-3 uppercase tracking-[0.2em] text-left font-sans text-left">
                <Code size={20}/> Zoho Campaign HTML Distribution Source
              </h4>
              <pre className="p-8 bg-black/60 rounded-[2rem] overflow-x-auto text-[12px] text-lime-200 font-mono leading-[1.6] max-h-[600px] border border-slate-800 custom-scrollbar text-left shadow-2xl text-left">
                {generateUnifiedHtml()}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeC;