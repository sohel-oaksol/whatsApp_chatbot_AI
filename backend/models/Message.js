const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  whatsappId: String,
  text: String,
  direction: { type: String, enum: ['inbound','outbound'] },
  metadata: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
