// api/gemini.ts
export const config = {
  runtime: 'edge', // 超高速に動作するEdge環境を使用します
};

export default async function handler(req: Request) {
  // POST以外のリクエストは弾く
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { systemPrompt, userPrompt, model = 'gemini-2.5-flash', isJson = false } = await req.json();
    
    // ▼ ここでVercelに設定した環境変数を読み込みます！ ▼
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is missing in server environment' }), { status: 500 });
    }

    // Geminiへ送る準備
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: isJson ? "application/json" : "text/plain"
      }
    };

    // VercelサーバーからGeminiへ通信
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 結果をブラウザに返す
    const data = await geminiRes.json();
    return new Response(JSON.stringify(data), {
      status: geminiRes.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}