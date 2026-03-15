// src/components/TypeB.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  MessageSquare,
  Send,
  RefreshCw,
  Globe,
  Info as InfoIcon,
  Check,
  Copy,
  ArrowLeft,
  Brain,
  StickyNote,
  Loader2,
  Share2,
  Search,
  List,
  BookOpen,
  Code,
} from "lucide-react";

/**
 * Global Constants & Types
 */
const MODEL_NAME = "gemini-2.5-flash";
const SYSTEM_VERSION = "v12.5.49-B-Skeleton-Drive-Fixed";

interface Message {
  role: "user" | "bot";
  text: string;
  id: string;
}

interface TableRow {
  id: string;
  cn: string;
  jp?: string;
  impact?: string;
}

/**
 * 1. App Logo Component
 */
const AppLogo: React.FC<{
  size?: number;
  className?: string;
  id?: string;
  isScanning?: boolean;
}> = ({ size = 60, className = "", id = "", isScanning = false }) => (
  <div
    className={`relative ${className}`}
    style={{ width: size, height: size }}
  >
    <svg
      id={id}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`object-contain ${isScanning ? "animate-[spin_3s_linear_infinite]" : ""}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="white"
        stroke="#064e3b"
        strokeWidth="8"
      />
      <path
        d="M100 30 L130 90 L190 100 L130 110 L100 170 L70 110 L10 100 L70 90 Z"
        fill="url(#logoGradGreen)"
      />
      <circle cx="100" cy="100" r="25" fill="white" />
      <path
        d="M85 100 L115 100 M100 85 L100 115"
        stroke="#064e3b"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

/**
 * 2. Markdown & Color Tag Parsing Helpers
 */
const renderMarkdownText = (
  text: string | undefined,
  keyPrefix = "txt",
): React.ReactNode => {
  if (!text) return null;
  const textStr = String(text);
  const parts = textStr.split(/(\*\*.*?\*\*|\[赤\].*?\[\/赤\]|<br\s*\/?>)/gi);

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-bold">
          {renderMarkdownText(part.slice(2, -2), `${key}-b`)}
        </strong>
      );
    }
    if (part.startsWith("[赤]") && part.endsWith("[/赤]")) {
      return (
        <span key={key} className="text-red-600 font-black">
          {part.slice(4, -5)}
        </span>
      );
    }
    if (part.match(/<br\s*\/?>/i)) {
      return <br key={key} />;
    }
    return <span key={key}>{part}</span>;
  });
};

/**
 * 3. API Communication with Exponential Backoff
 */
// src/components/TypeA.tsx, TypeB.tsx, TypeC.tsx 内の関数を上書き

const callGeminiApi = async (
  systemPrompt: string,
  userPrompt: string,
  isJson = false,
): Promise<any> => {
  // 通信先を自分の中継API（Vercelサーバー）に変更
  const url = "/api/gemini";

  const payload = {
    systemPrompt,
    userPrompt,
    model: MODEL_NAME,
    isJson,
  };

  const maxRetries = 5;
  const backoffDelays = [1000, 2000, 4000, 8000, 16000];

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 429)
          await new Promise((r) => setTimeout(r, 3000));
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return isJson ? JSON.parse(text) : text;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, backoffDelays[i]));
    }
  }
};

/**
 * 4. Follow-up Chat Component
 */
const FollowUpChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<{
    id: string | null;
    type: string | null;
  }>({ id: null, type: null });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      role: "user",
      text: input,
      id: crypto.randomUUID(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const aiText = await callGeminiApi(
        "日本語で論理的に回答せよ。OSDSHの立場から回答せよ。",
        input,
        false,
      );
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: aiText, id: crypto.randomUUID() },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: err.message, id: crypto.randomUUID() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (text: string, id: string, type: string) => {
    if (type === "copy") {
      navigator.clipboard.writeText(text).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      });
    } else if (type === "keep") {
      window.open(
        `https://keep.google.com/u/0/#create?text=${encodeURIComponent(text)}`,
        "_blank",
      );
    } else if (type === "share") {
      if (navigator.share) {
        navigator.share({ text: text }).catch(() => {});
      } else {
        handleAction(text, id, "copy");
      }
    }
    setActionStatus({ id, type });
    setTimeout(() => setActionStatus({ id: null, type: null }), 2000);
  };

  return (
    <div className="mt-16 bg-white rounded-[2.5rem] shadow-2xl border-2 border-emerald-200 overflow-hidden font-sans">
      <div className="bg-emerald-900 p-8 flex items-center gap-4 text-white">
        <div className="p-3 bg-green-600 rounded-2xl shadow-lg">
          <MessageSquare size={28} />
        </div>
        <div>
          <h3 className="font-black text-2xl tracking-tight leading-none">
            分析結果への質問
          </h3>
          <p className="text-sm text-emerald-400 font-bold mt-2 leading-relaxed">
            最下段のボックスに質問を投稿してください。
          </p>
        </div>
      </div>

      <div className="p-8 bg-emerald-50/30">
        <div
          ref={scrollRef}
          className="h-[400px] overflow-y-auto mb-8 space-y-8 pr-4 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-emerald-200 opacity-40 text-center">
              <Brain size={80} strokeWidth={1} />
              <p className="font-black text-xl mt-4">
                戦略的解析のための質問を入力してください。
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4`}
            >
              <div className="max-w-[90%] group">
                <div
                  className={`p-6 rounded-[2rem] shadow-sm ${m.role === "user" ? "bg-green-600 text-white" : "bg-white border-2 border-emerald-200 text-slate-800"}`}
                >
                  <div className="text-base whitespace-pre-wrap font-medium leading-relaxed">
                    {m.text}
                  </div>
                </div>
                {m.role === "bot" && (
                  <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleAction(m.text, m.id, "copy")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-[10px] font-black shadow-sm active:scale-95 text-emerald-800"
                    >
                      {actionStatus.id === m.id &&
                      actionStatus.type === "copy" ? (
                        <Check size={12} className="text-green-600" />
                      ) : (
                        <Copy size={12} />
                      )}{" "}
                      コピー
                    </button>
                    <button
                      onClick={() => handleAction(m.text, m.id, "keep")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-[10px] font-black shadow-sm active:scale-95 text-amber-600"
                    >
                      <StickyNote size={12} /> Keep
                    </button>
                    <button
                      onClick={() => handleAction(m.text, m.id, "share")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-[10px] font-black shadow-sm active:scale-95 text-emerald-600"
                    >
                      <Share2 size={12} /> 共有
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-3 p-4">
              <RefreshCw size={24} className="animate-spin text-green-600" />
              <span className="font-black text-green-600 uppercase animate-pulse text-xs">
                Analyzing Intelligence...
              </span>
            </div>
          )}
        </div>
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-8 pr-20 py-6 bg-white border-4 border-emerald-200 focus:border-green-500 rounded-[2.5rem] font-bold shadow-xl transition-all outline-none text-lg text-slate-800"
            placeholder="質問を入力..."
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-3 top-3 p-4 bg-green-600 text-white rounded-[2rem] shadow-lg active:scale-90 hover:bg-green-700 transition-all"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 5. Unified Table UI Component
 */
const GenericTableParser: React.FC<{
  rows: TableRow[];
  title: string;
  icon: React.ElementType;
  colorClass?: string;
  isLoading?: boolean;
}> = ({ rows, title, icon: Icon, colorClass, isLoading = false }) => {
  return (
    <div className="my-8 border-2 border-emerald-300 rounded-[2.5rem] shadow-2xl overflow-hidden bg-white text-slate-900 min-h-[100px]">
      <div
        className={`p-6 flex items-center justify-between text-white ${colorClass || "bg-emerald-900"}`}
      >
        <div className="flex items-center gap-4">
          <Icon size={26} className="text-white shrink-0" />
          <span className="font-black text-2xl tracking-tight uppercase leading-none">
            {title}
          </span>
        </div>
        {isLoading && (
          <Loader2 size={24} className="animate-spin text-white/50" />
        )}
      </div>
      <div className="overflow-x-auto p-0 bg-emerald-50/10">
        <table className="w-full text-[12px] border-collapse table-fixed min-w-[900px]">
          <thead>
            <tr className="bg-emerald-100 text-emerald-900 border-b-2 border-emerald-200">
              <th className="p-4 text-left font-black w-[70px]">ID</th>
              <th className="p-4 text-left font-black w-[30%]">
                中国語 (原文)
              </th>
              <th className="p-4 text-left font-black w-[30%]">
                日本語 (対訳)
              </th>
              <th className="p-4 text-left font-black w-[40%]">
                日本への影響とリスク
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-emerald-100 hover:bg-emerald-50/50 transition-colors"
              >
                <td className="p-4 align-top font-black text-emerald-700 bg-emerald-50/30">
                  {row.id}
                </td>
                <td className="p-4 align-top font-medium text-slate-600 break-words whitespace-pre-wrap">
                  {row.cn}
                </td>
                <td className="p-4 align-top font-bold text-slate-900 break-words leading-relaxed">
                  {row.jp ? (
                    renderMarkdownText(row.jp, `jp-${idx}`)
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-400 italic animate-pulse">
                      <Loader2 size={14} className="animate-spin" /> 解析中...
                    </div>
                  )}
                </td>
                <td className="p-4 align-top font-bold text-slate-900 break-words leading-relaxed">
                  {row.impact ? (
                    renderMarkdownText(row.impact, `imp-${idx}`)
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-300 italic animate-pulse">
                      ...分析待ち
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * 6. Progress Visualizer Component
 */
const AnalysisProgressBar: React.FC<{ progress: number; status: string }> = ({
  progress,
  status,
}) => (
  <div className="w-full max-w-4xl mx-auto mb-12 animate-in fade-in zoom-in duration-500">
    <div className="flex justify-between items-end mb-4">
      <div>
        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em] mb-1">
          Integrated Scrutiny Engine
        </p>
        <div className="flex items-center gap-3">
          <Search className="text-green-500 animate-pulse" size={20} />
          <h3 className="text-xl font-black text-white truncate max-w-[300px]">
            {status}
          </h3>
        </div>
      </div>
      <div className="text-right">
        <span className="text-3xl font-black text-green-500 italic">
          {progress}%
        </span>
      </div>
    </div>
    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-emerald-900 p-1">
      <div
        className="h-full bg-gradient-to-r from-green-800 via-green-500 to-emerald-300 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

/**
 * 7. Main Application Component (Type B)
 */
const TypeB: React.FC = () => {
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Initializing...");
  const [infoName, setInfoName] = useState("");
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [dt, setDt] = useState("");
  const [copyStatus, setCopyStatus] = useState(false);

  const getFormattedDateForFile = (dateStr: string) => {
    if (!dateStr || dateStr === "不明") {
      const now = new Date();
      return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
    }
    const nums = dateStr.match(/\d+/g);
    if (!nums || nums.length < 3) return "00000000";
    return `${nums[0]}${nums[1].padStart(2, "0")}${nums[2].padStart(2, "0")}`;
  };

  const runAnalysis = async () => {
    if (!val.trim()) return;
    setLoading(true);
    setShowReport(true);
    setTableRows([]);
    setProgress(5);
    setStatusMsg("情報の名称を特定中...");

    const dateMatch = val.match(/([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日)/);
    setDt(dateMatch ? dateMatch[0] : "不明");

    try {
      // Step 1: 情報名の特定
      const metaPrompt = `あなたはOSDSH主席アナリスト。入力テキストから「翻訳分析対象の情報名（例：2026年1月17日中国外交部記者会見）」を特定し、その名称のみを出力せよ。
【最重要命令】中国語表現は一切使用せず、正しい日本語公用文に翻訳せよ。例：「林剑主持例行记者会」→「林剣報道官定例記者会見」。「外交部发言人」→「外交部報道官」。`;
      const name = await callGeminiApi(metaPrompt, val, false);
      setInfoName(name);
      setProgress(15);

      // Step 2: 構造のスキャン (JSON出力)
      setStatusMsg("Q&A構造をスキャン中...");
      const structPrompt = `入力テキストから質疑応答の全項目を抽出し、以下のJSON配列形式で出力せよ。
[{"id": "Q1", "cn": "原文..."}, {"id": "A1-1", "cn": "原文..."}, ...]
【ID規則】質問は Q1, Q2...。回答は A1-1, A1-2...。冒頭発言（P等）は除外せよ。`;
      const structure: TableRow[] = await callGeminiApi(
        structPrompt,
        val,
        true,
      );
      setTableRows(structure);
      setProgress(30);

      // ▼▼▼ Type B の runAnalysis 内：プロンプト定義などは残し、解析ループ部分をこれに差し替える ▼▼▼

      // Step 3: ★超高速・並列バッチ解析★
      setStatusMsg("全項目の対訳および影響度分析を並列実行中...");
      const batchSize = 10; // 10個ずつ束にする
      const batches = [];
      for (let i = 0; i < structure.length; i += batchSize) {
        batches.push(structure.slice(i, i + batchSize));
      }

      // すべてのバッチを同時にAPIへ投げる（Promise.all）
      await Promise.all(
        batches.map(async (batch, index) => {
          // ※ここに元の fillPrompt の定義を残すか、そのまま移動させてください
          const fillPrompt = `以下の各項目を精密に日本語に対訳し、「日本への影響とリスク」を分析せよ。
■ 翻訳ルール：固有名詞「委内瑞拉」は「ベネズエラ」と翻訳。
■ 分析ルール：冒頭に [赤]【影響度：高/中/低/無】[/赤] を記載し、OSDSH基準で記述。
入力データ：${JSON.stringify(batch)}`;

          try {
            const results = await callGeminiApi(
              fillPrompt,
              `全項目の解析をJSON配列 [{"id":"...", "jp":"...", "impact":"..."}] で返せ。`,
              true,
            );

            setTableRows((prev) => {
              const newRows = [...prev];
              results.forEach((res: any) => {
                const idx = newRows.findIndex((r) => r.id === res.id);
                if (idx !== -1) {
                  newRows[idx].jp = res.jp;
                  newRows[idx].impact = res.impact;
                }
              });
              return newRows;
            });
            setProgress((prev) =>
              Math.min(95, prev + Math.floor(65 / batches.length)),
            );
          } catch (err) {
            console.error(`Batch ${index} failed:`, err);
          }
        }),
      );

      setProgress(100);
      setStatusMsg("全項目の精密解析が完了しました。");
    } catch (e: any) {
      console.error(e);
      setInfoName(`【解析エラー】${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReportCode = () => {
    const tableMarkdown =
      `| ID | 中国語 (原文) | 日本語 (対訳) | 日本への影響とリスク |\n|:---:|:---|:---|:---|\n` +
      tableRows
        .map(
          (r) =>
            `| ${r.id} | ${r.cn} | ${r.jp || "未解析"} | ${r.impact || "未解析"} |`,
        )
        .join("\n");

    const reportCode = `
# 中国複合法律戦 対訳＆個別影響分析統合レポート (Type B)
分析対象時期: ${dt}

## 【翻訳分析対象の情報名】
${infoName}

## 対訳及び対訳＆個別影響分析
${tableMarkdown}
    `.trim();

    navigator.clipboard.writeText(reportCode).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  const handleWordExport = () => {
    const cleanForWord = (text: string | undefined) => {
      if (!text) return "";
      return text
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(
          /\[赤\](.*?)\[\/赤\]/g,
          '<span style="color:#ff0000; font-weight:bold;">$1</span>',
        );
    };

    const buildUnifiedTableForWord = () => {
      let html = `<table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; margin-bottom:20pt; font-family:'Meiryo'; font-size:8.5pt; border:1px solid #000000;">`;
      html += `<tr style="background-color:#ecfdf5; font-weight:bold;"><td>ID</td><td>中国語 (原文)</td><td>日本語 (対訳)</td><td>日本への影響とリスク</td></tr>`;
      tableRows.forEach((row) => {
        html += `<tr><td style="vertical-align:top; font-weight:bold;">${row.id}</td><td style="vertical-align:top; color:#666;">${cleanForWord(row.cn)}</td><td style="vertical-align:top;">${cleanForWord(row.jp)}</td><td style="vertical-align:top;">${cleanForWord(row.impact)}</td></tr>`;
      });
      return html + `</table>`;
    };

    const fullDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><style>body { font-family: "Meiryo"; line-height: 1.4; } h1 { border-bottom: 2pt solid #064e3b; } h2 { border-left: 10pt solid #064e3b; padding-left: 10pt; }</style></head>
<body>
  <h1>中国複合法律戦 対訳＆個別影響分析統合レポート (Type B)</h1>
  <p>対象時期: ${dt}</p>
  <div style="background-color:#f0fdf4; padding:10pt; border:1pt solid #059669;"><b>【翻訳分析対象の情報名】</b><br/>${infoName}</div>
  <h2>対訳及び対訳＆個別影響分析</h2>
  ${buildUnifiedTableForWord()}
</body></html>`;

    const blob = new Blob(["\uFEFF" + fullDoc], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const dateTag = getFormattedDateForFile(dt);
    link.download = `対訳＆個別影響分析_${dateTag}.doc`;
    link.click();
  };

  const handleZohoHtmlExport = () => {
    const cleanForHtml = (text: string | undefined) => {
      if (!text) return "";
      return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(
          /\[赤\](.*?)\[\/赤\]/g,
          '<span style="color:red; font-weight:bold;">$1</span>',
        );
    };

    let tableHtml = `<table style="width:100%; border-collapse:collapse; border:1px solid #ddd; font-family:sans-serif; font-size:12px;">`;
    tableHtml += `<tr style="background-color:#f8f9fa;"><th>ID</th><th>原文</th><th>対訳</th><th>分析</th></tr>`;
    tableRows.forEach((r) => {
      tableHtml += `<tr><td style="border:1px solid #ddd; padding:8px; vertical-align:top;">${r.id}</td><td style="border:1px solid #ddd; padding:8px; vertical-align:top; color:#666;">${cleanForHtml(r.cn)}</td><td style="border:1px solid #ddd; padding:8px; vertical-align:top;">${cleanForHtml(r.jp)}</td><td style="border:1px solid #ddd; padding:8px; vertical-align:top;">${cleanForHtml(r.impact)}</td></tr>`;
    });
    tableHtml += `</table>`;

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><h1>${infoName}</h1>${tableHtml}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ZOHO用データ_${getFormattedDateForFile(dt)}.html`;
    link.click();
  };

  const ActionButtons: React.FC<{ className?: string }> = ({
    className = "",
  }) => (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <button
        onClick={handleWordExport}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg transition-all text-sm active:scale-95"
      >
        <Download size={16} /> Word保存
      </button>
      <button
        onClick={handleZohoHtmlExport}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg transition-all text-sm active:scale-95"
      >
        <Code size={16} /> ZOHO HTML出力
      </button>
      <button
        onClick={handleCopyReportCode}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black shadow-lg transition-all text-sm border border-white/20 active:scale-95 ${copyStatus ? "bg-green-600 text-white" : "bg-slate-700 text-white hover:bg-slate-600"}`}
      >
        {copyStatus ? <Check size={16} /> : <Copy size={16} />} 内容をコピー
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 font-sans text-emerald-50 overflow-x-hidden text-left">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 pb-8 border-b border-emerald-900">
          <div className="flex items-center gap-6">
            <div className="bg-white p-2 rounded-2xl shadow-2xl relative border-2 border-green-500/30 shrink-0">
              <AppLogo size={48} id="main-logo-green" isScanning={loading} />
              <div className="absolute -bottom-1 -right-1 bg-green-600 text-[8px] font-black px-1 rounded border border-white shadow-sm">
                OSDSH
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-emerald-500 tracking-widest uppercase">
                Unified Scrutiny (Type B)
              </p>
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                  中国複合法律戦 統合対訳解析システム
                </h1>
                <span className="text-[10px] font-black bg-green-600 text-white px-1.5 py-0.5 rounded shadow-sm border border-white/20">
                  {SYSTEM_VERSION}
                </span>
              </div>
            </div>
          </div>
          {showReport && !loading && <ActionButtons />}
          {showReport && (
            <button
              onClick={() => {
                setShowReport(false);
                setTableRows([]);
                setProgress(0);
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black transition-all text-sm border border-slate-600 shadow-lg"
            >
              <ArrowLeft size={18} /> 戻る
            </button>
          )}
        </header>

        {!showReport && !loading && (
          <section className="bg-emerald-950/40 p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-emerald-900 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="mb-8 p-6 bg-green-950/40 border-l-[8px] border-green-600 rounded-r-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 text-white">
                  <BookOpen size={24} className="text-green-400" />
                  <span className="font-black text-green-400 text-xl uppercase tracking-tight">
                    タイプB：統合的証拠化とナラティブ解体
                  </span>
                </div>
                <p className="text-emerald-200 font-medium text-sm leading-relaxed">
                  会見文を全件ID化し、対訳と「日本への影響度（赤字表示）」を網羅した統合レポートを生成します。
                </p>
              </div>
              <a
                href="https://www.mfa.gov.cn/fyrbt_673021/jzhsl_673025/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all border border-green-400"
              >
                <Globe size={24} />{" "}
                <span className="text-lg font-bold">中国外交部公式サイト</span>
              </a>
            </div>
            <textarea
              className="w-full h-80 p-8 bg-black/60 border-2 border-emerald-900 rounded-[2.5rem] focus:ring-4 focus:ring-green-600/50 outline-none text-lg text-emerald-50 font-medium placeholder-emerald-800"
              placeholder="会見全文テキストを貼り付け..."
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
            <button
              onClick={runAnalysis}
              disabled={!val.trim()}
              className="w-full mt-8 py-6 rounded-[2rem] font-black text-xl bg-gradient-to-br from-green-600 to-green-800 text-white active:scale-95 transition-all flex items-center justify-center gap-4 border border-green-400/30 shadow-2xl px-12"
            >
              <Search size={32} /> 統合精密解析を開始
            </button>
          </section>
        )}

        {loading && !showReport && (
          <div className="text-center py-40 flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <AppLogo size={140} className="mb-12" isScanning={true} />
            <p className="text-3xl font-black text-green-500 tracking-[0.2em] uppercase italic animate-pulse">
              Analyzing Integrity...
            </p>
          </div>
        )}

        {showReport && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            {loading && (
              <AnalysisProgressBar progress={progress} status={statusMsg} />
            )}
            {!loading && (
              <div className="flex justify-between items-center mb-6">
                <div className="bg-green-900/40 text-green-400 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-green-800 flex items-center gap-2">
                  <Check size={14} /> Scrutiny Complete
                </div>
              </div>
            )}

            <div className="bg-[#fcfcfc] p-6 md:p-16 rounded-[2.5rem] shadow-4xl text-slate-900 border border-emerald-200">
              <div className="mb-12 border-b-2 border-slate-100 pb-8">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                  中国複合法律戦 対訳＆個別影響分析 統合レポート (Type B)
                </h2>
                <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-2">
                  OSDSH INTEGRATED SECURITY SCRUTINY: {dt}
                </p>
              </div>

              <div className="mb-16">
                <h2 className="text-2xl font-black text-emerald-800 border-l-[10px] border-emerald-800 pl-4 mb-8 flex items-center gap-3">
                  <InfoIcon /> 会見情報の確定
                </h2>
                <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-3xl mb-12 shadow-sm">
                  <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 underline decoration-emerald-200 underline-offset-4">
                    【翻訳分析対象の情報名】
                  </h3>
                  {progress < 15 ? (
                    <div className="animate-pulse h-4 bg-emerald-100 rounded w-full"></div>
                  ) : (
                    <div className="text-slate-800 font-black text-lg leading-relaxed">
                      {renderMarkdownText(infoName, "h-info")}
                    </div>
                  )}
                </div>

                <GenericTableParser
                  rows={tableRows}
                  title="対訳及び対訳＆個別影響分析"
                  icon={List}
                  colorClass="bg-emerald-800"
                  isLoading={loading}
                />
              </div>
            </div>

            {!loading && (
              <div className="mt-12 flex justify-center">
                <ActionButtons />
              </div>
            )}

            <FollowUpChat />
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeB;
