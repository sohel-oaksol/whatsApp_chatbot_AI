
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const userState = {};
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

      console.log("📩 Message from:", from, "->", text);

      let reply = "🤖 Sorry, I didn’t understand that.";
      let state = userState[from] || "main"; // default main menu

      // === RESET or MENU ===
     if (["menu", "main"].includes(text)) {
        userState[from] = "main";
        await sendReply(
          from,
          "🏠 *Main Menu:*\n\n1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact\n4️⃣ Help"
        );
        return res.sendStatus(200);
      }

      // ====== MAIN MENU ======
      if (state === "main") {
        if (["hi", "hello", "hey"].includes(text)) {
          reply =
            "👋 Hi there! Welcome to * OAKSOL TECHNOLOGIES PRIVATE LIMITED*.\n\nPlease choose an option:\n\n" +
            "1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact\n4️⃣ Help";
        } else if (text === "1") {
          state = "about";
          reply =
            "ℹ️ *About  OAKSOL TECHNOLOGIES PRIVATE LIMITED*\nWe’re a tech company providing automation and AI chatbots.\n\n" +
            "a) 🎯 Our Mission\nb) 👨‍💻 Our Team\nc) 🤝 Our Clients\nd) 🔙 Back to Main Menu";
        } else if (text === "2") {
          state = "services";
          reply =
            "🛠️ *Our Services*\n\n" +
            "a) 🤖 Chatbot Development\nb) 💻 Web Development\nc) 📱 App Development\nd) 📈 Digital Marketing\ne) 🔙 Back to Main Menu";
        } else if (text === "3") {
          state = "contact";
          reply =
            "📞 *Contact Information*\n\n" +
            "a) 📱 Phone\nb) ✉️ Email\nc) 📍 Address\nd) 🔙 Back to Main Menu";
        } else if (text === "4") {
          state = "help";
          reply =
            "🆘 *Help Menu*\n\n" +
            "a) ❓ FAQs\nb) 💬 Talk to Human\nc) 🕒 Working Hours\nd) 🔙 Back to Main Menu";
        } else {
          reply =
            "🤖 Sorry, I didn’t understand that.\nType *menu* anytime to return to the main menu.";
        }
      }

      // ====== ABOUT US ======
      else if (state === "about") {
        if (text === "a")
          reply =
            "🎯 *Our Mission:*\nTo simplify business communication through smart automation.";
        else if (text === "b")
          reply =
            "👨‍💻 *Our Team:*\nA passionate group of engineers and designers building scalable solutions.";
        else if (text === "c")
          reply =
            "🤝 *Our Clients:*\nWe’ve partnered with startups and enterprises across India.";
        else if (text === "d") {
          state = "main";
          reply =
            "🏠 *Main Menu:*\n\n1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact\n4️⃣ Help";
        } else reply = "Please select a valid option (a–d).";
      }

      // ====== SERVICES ======
      else if (state === "services") {
        if (text === "a")
          reply =
            "🤖 *Chatbot Development:*\nWe build WhatsApp and web bots for automation.";
        else if (text === "b")
          reply =
            "💻 *Web Development:*\nModern, responsive websites using React and Node.js.";
        else if (text === "c")
          reply =
            "📱 *App Development:*\nCross-platform mobile apps using React Native and Flutter.";
        else if (text === "d")
          reply =
            "📈 *Digital Marketing:*\nGrow your business with SEO, ads, and content strategy.";
        else if (text === "e") {
          state = "main";
          reply =
            "🏠 *Main Menu:*\n\n1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact\n4️⃣ Help";
        } else reply = "Please select a valid option (a–e).";
      }

      // ====== CONTACT ======
      else if (state === "contact") {
        if (text === "a") reply = "📱 *Phone:* +91 8479054542";
        else if (text === "b") reply = "✉️ *Email:* support@oaksol.in";
        else if (text === "c")
          reply = "📍 *Address:*2/2-7, 1st A Main Road,Lidkar Colony,Bangalore North, Bangalore, Karnataka, India - 560045";
        else if (text === "d") {
          state = "main";
          reply =
            "🏠 *Main Menu:*\n\n1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact\n4️⃣ Help";
        } else reply = "Please select a valid option (a–d).";
      }

      // ====== HELP ======
      else if (state === "help") {
        if (text === "a")
          reply =
            "❓ *FAQs:*\n- Project timelines vary.\n- Custom pricing available.\n- We provide ongoing support.";
        else if (text === "b")
          reply = "💬 A human agent will reach out shortly.";
        else if (text === "c")
          reply = "🕒 *Working Hours:* Mon–Fri, 9 AM – 6 PM (IST)";
        else if (text === "d") {
          state = "main";
          reply =
            "🏠 *Main Menu:*\n\n1️⃣ About Us\n2️⃣ Services\n3️⃣ Contact\n4️⃣ Help";
        } else reply = "Please select a valid option (a–d).";
      }
      userState[from] = state;



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

      console.log(" Replied to user");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(" Error handling message:", error.response?.data || error);
    res.sendStatus(500);
  }
});


app.listen(process.env.PORT || 4000, () => {
  console.log(` Server running on port ${process.env.PORT || 4000}`);
});

