
const express = require('express');
const axios = require('axios');
const Message = require('../models/Message');
const { getAIReply } = require('../services/openai');

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const GRAPH_URL = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;

// 1) webhook verification (GET)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else return res.sendStatus(403);
  }
  res.sendStatus(400);
});

// 2) webhook receiver (POST)
router.post('/webhook', async (req, res) => {
  // Meta sends a nested body; guard carefully
  const body = req.body;
  // respond quickly to Meta
  res.sendStatus(200);

  try {
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (!entry.changes) continue;
        for (const change of entry.changes) {
          const value = change.value;
          if (!value || !value.messages) continue;

          for (const msg of value.messages) {
            const from = msg.from; // customer's WhatsApp number
            const text = (msg.text && msg.text.body) || '';

            // Save inbound message
            await Message.create({
              from,
              to: PHONE_NUMBER_ID,
              whatsappId: msg.id,
              text,
              direction: 'inbound',
              metadata: msg
            });

            // Prepare conversation/context for AI
            const conversation = [
              { role: 'system', content: 'You are a helpful assistant for our business.' },
              { role: 'user', content: text }
            ];

            // Get AI reply
            const aiReply = await getAIReply(conversation);

            // Save outbound
            await Message.create({
              from: PHONE_NUMBER_ID,
              to: from,
              text: aiReply,
              direction: 'outbound'
            });

            // Send AI reply back to user via WhatsApp Cloud API
            await axios.post(GRAPH_URL, {
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: { body: aiReply }
            }, {
              headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Webhook handling error', err?.response?.data || err.message || err);
  }
});

// Additional endpoint: send message manually from frontend (optional)
router.post('/api/send', async (req, res) => {
  const { to, text } = req.body;
  try {
    await axios.post(GRAPH_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    }, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.response?.data || err.message });
  }
});

module.exports = router;
