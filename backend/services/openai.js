const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getAIReply(conversation /* array of messages for context */) {
  // conversation: [{ role:'system'|'user'|'assistant', content:'...' }, ...]
  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini", // choose model you have access to
    messages: conversation,
    max_tokens: 400
  });
  // extract content safely
  const text = resp.choices?.[0]?.message?.content || '';
  return text;
}

module.exports = { getAIReply };
