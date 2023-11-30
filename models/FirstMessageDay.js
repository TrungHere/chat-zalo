import mongoose from "mongoose";
const FirstMessageDaySchema = new mongoose.Schema(
  {
      userId: {
        type: Number,
        default:0,
      },
      time: {
        type: String,
        default:"2022-1-1",
      },
  },
  { collection: 'FirstMessageDays', 
    versionKey: false   // loai bo version key 
  }
);

export default mongoose.model("FirstMessageDay", FirstMessageDaySchema);