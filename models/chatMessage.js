import mongoose from "mongoose"

const chatMessageSchema = new mongoose.Schema({
  chatGroupId: {
    type: Number,
    required: true,
  },
  sender: {
    type: Number,
    required: true,
  },
  messages: {
    type: String,
    required: true,
  },
  created_at:  {
    type: Number,
    required: true,
  },
  status : {     // 1: Mới gửi, công khai vào nhóm chung, 2: Tin nhắn riêng, 3: Bị lỡ sau 30s k được phản hồi
    type: Number,
    default: 1,
  }
});

export default mongoose.model("ChatMessage", chatMessageSchema);