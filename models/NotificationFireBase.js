import mongoose from "mongoose";
const NotificationFireBaseSchema = new mongoose.Schema(
  {   
      userId: {
        type: Number,
        default:0,
      },
      type: {
        type: Number,
        default:0,
      },
      token: {
        type: String,
        default:"",
      },
      idDevice: {
        type: String,
        default:"",
      },
      from: {
        type: String,
        default:"",
      },
  },
  { collection: 'NotificationFireBase', 
    versionKey: false   
  }
);

export default mongoose.model("NotificationFireBase", NotificationFireBaseSchema);