import mongoose from "mongoose";
const PermissonChangePassSchema = new mongoose.Schema(
  {
      number: {
        type: String,
        default:"0",
      },
      permission: {
        type:Number,
        default:0,
      },
  },
  { collection: 'PermissonChangePass', 
    versionKey: false   // loai bo version key 
  }
);

export default mongoose.model("PermissonChangePass", PermissonChangePassSchema);