import mongoose from "mongoose";
const VerifySchema = new mongoose.Schema(
  {
      EmailPhone: {
        type: String,
        default:"",
      },
      Type:{
        type: Number,
        default:0,
      },
      Permission: {
        type: Number,
        default:0,
      },
  },
  { collection: 'Verify', 
    versionKey: false   // loai bo version key 
  }
);

export default mongoose.model("Verify", VerifySchema);