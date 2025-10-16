import express from "express";
import axios from "axios";

const router = express.Router();

// ✅ VERIFY WEBHOOK (GET)
router.get("/", (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      console.log("✅ WEBHOOK VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// ✅ RECEIVE MESSAGES (POST)
router.post("/", async (req, res) => {
  console.log("📩 Incoming webhook:", JSON.stringify(req.body, null, 2));

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const messages = changes?.value?.messages;

  if (messages && messages.length > 0) {
    const from = messages[0].from; // user's phone number
    const text = messages[0].text?.body;

    console.log(`💬 Message from ${from}: ${text}`);

    // Optional: reply to user
    await sendWhatsAppMessage(from, `You said: ${text}`);
  }

  res.sendStatus(200);
});

// ✅ Helper to send reply
async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export default router;
