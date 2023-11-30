import mongoose from "mongoose";
const SaveTurnOffNotifyConvSchema = new mongoose.Schema(
  {
      userId: {
        type: Number,
        required: true,
      },
      conversationId: {
        type: Number,
        required: true,
      },
      Time: {
        type: Date,
        required: true,
      }
  },
  { collection: 'SaveTurnOffNotifyConv',
    versionKey: false }
);

export default mongoose.model("SaveTurnOffNotifyConv", SaveTurnOffNotifyConvSchema);