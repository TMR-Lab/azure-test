module.exports = async function (context, req) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://dummy.cognitiveservices.azure.com";
    const apiKey = process.env.AZURE_OPENAI_API_KEY || "dummy-key-12345";
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-01";

    const messages = req.body && req.body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        context.res = {
            status: 400,
            body: { error: "messages は空でない配列である必要があります" }
        };
        return;
    }

    const systemMessage = { role: "system", content: "あなたは親切で丁寧な日本語のアシスタントです。" };
    const payload = {
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 800
    };

    const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errBody = await response.text();
            context.log.error("Azure OpenAI API error:", response.status, errBody);
            context.res = {
                status: response.status,
                body: { error: "Azure OpenAI API 呼び出しに失敗しました", detail: errBody }
            };
            return;
        }

        const data = await response.json();
        const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { reply: reply || "" }
        };
    } catch (e) {
        context.log.error("Unexpected error:", e);
        context.res = {
            status: 500,
            body: { error: "サーバー内部エラー", detail: e.message }
        };
    }
};
