import mongoose from "mongoose"

const chatGroupSchema = new mongoose.Schema({
  chatGroupId: {
    type: Number,
    default: 0,
  },
  members: [
    {
      member_id: {
        type: Number,
      },
      member_name: {
        type: String,
      },
    },
  ],
  name: {
    type: String,
    required: true,
  },
  responseTime: {
    type: Number,
    default: 30, // Thời gian mặc định để trả lời (đơn vị: giây)
  },
  // Các thông tin khác về nhóm live chat
});

export default mongoose.model("ChatGroup", chatGroupSchema);