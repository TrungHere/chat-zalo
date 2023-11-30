import mongoose from "mongoose";
const HistorySendOTPCodeSchema = new mongoose.Schema(
  {
    code:{
      type: String,
      default:""
    },
    time :{
        type: String,
        default:""
    },
    createAt:{
      type: Date,
      default:new Date(),
    }
  },
  { collection: 'HistorySendOTPCode',   
    versionKey: false  
  }  
);

export default mongoose.model("HistorySendOTPCode", HistorySendOTPCodeSchema);