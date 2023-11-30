import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema(
  {    _id:{
            type: String,
            required: true,
        },
      userId: {
        type: Number,
        default:0,
      },
      companyId:{
        type: Number,
      },
      paticipantId: {
        type: Number,
        default:0,
      },
      title: {
        type: String,
        default:"",
      },
      message: {
        type: String,
        default:"",
      },
      isUndeader: {
        type: Number,
        default:0,
      },
      createAt: {
        type: Date,
        default:new Date(),
      },
      type: {
        type: String,
        default:"",
      },
      messageId: {
        type: String,
        default:"",
      },
      conversationId: {
        type: Number,
        default:0,
      },
      link: {
        type: String,
        default:"",
      },
  },
  { collection: 'Notifications', 
    versionKey: false   // loai bo version key 
  }
);

export default mongoose.model("Notification", NotificationSchema);