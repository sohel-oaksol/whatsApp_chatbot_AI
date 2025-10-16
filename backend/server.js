
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ✅ 1. Webhook Verification (GET)
app.get("/webhook", (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === verify_token) {
    console.log("✅ WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const text = message.text?.body?.trim().toLowerCase();

      console.log("📩 Incoming message:", from, "->", text);

      let reply = "🤖 Sorry, I didn't understand that. Try again.";

      // 🧠 Simple Q&A logic
      if (text === "hi" || text === "hello") {
        reply = "👋 Hi there! How can I help you today?\n\nType:\n1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact";
      } 
      else if (text === "1" || text.includes("about")) {
        reply = "ℹ️ We are a WhatsApp chatbot demo. We help businesses automate conversations.";
      } 
      else if (text === "2" || text.includes("service")) {
        reply = "🛠️ Our services:\n- 24/7 Chat Support\n- Appointment Booking\n- Order Tracking\n\nType 'menu' to go back.";
      } 
      else if (text === "3" || text.includes("contact")) {
        reply = "📞 You can contact us at: +91 8479054542 or email: oaksol@gmail.com";
      } 
      else if (text === "menu") {
        reply = "🏠 Main Menu:\n1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact";
      }

      // ✅ Send reply
      await axios.post(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Replied to user");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error handling message:", error.response?.data || error);
    res.sendStatus(500);
  }
});


app.listen(process.env.PORT || 4000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 4000}`);
});

