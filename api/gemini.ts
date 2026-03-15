// api/gemini.ts

// ▼ Vercelの無料枠の最大待機時間（60秒）まで延長する設定
export const maxDuration = 60; 

export default async function handler(req: any, res: any) {
  // POST以外のリクエストは弾く
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // サーバーレス環境では req.body にすでにデータが入っています
    const { systemPrompt, userPrompt, model = 'gemini-2.5-flash', isJson = false } = req.body;
    
    // Vercelに設定した環境変数を読み込む
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key is missing in server environment' });
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

    // Geminiへ通信
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await geminiRes.json();
    
    // 結果をフロントエンド（ブラウザ）に返す
    return res.status(geminiRes.status).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}