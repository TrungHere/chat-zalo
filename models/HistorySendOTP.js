import mongoose from "mongoose";
const HistorySendOTPSchema = new mongoose.Schema(
  {
    number :{
      type: String,
      default:""
    },
    time :{
        type: String,
        default:""
    },
    otp:{
      type: String,
      default:""
    },
    createAt:{
      type: Date,
      default:new Date(),
    }
  },
  { collection: 'HistorySendOTP',   
    versionKey: false  
  }  
);

export default mongoose.model("HistorySendOTP", HistorySendOTPSchema);