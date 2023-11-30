// models/privateChat.js
import mongoose from "mongoose"

const privateChatSchema = new mongoose.Schema({
  messages: [
    {
      receivedID: {
        type: Number,
        required: true,
      },
      senderID: {
        type: Number,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      created_at: {
        type: Number,
        required: true,
      },
    },
  ],
  lock: {
    // Nếu không bắt chat, cuộc trò chuyện bị khóa tạm thời lock = 1
    type: Number,
    default: 0,
  },
});


export default mongoose.model("PrivateChat", privateChatSchema);