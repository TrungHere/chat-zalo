import mongoose from "mongoose";
const Users_ZaloSchema = new mongoose.Schema(
  {
    idUserZalo :{
      type: Number,
      required: true,

    },
    Name :{
      type: String,
      default: null,
    },
    idOA:{
      type: Number,
      default: 0,
    },
    Phone:{
      type: Number,
      default: 0,
    },
    Email:{
      type: String,
      default: null,
    },
    Address:{
      type: String,
      default: null,
    },
    Note:{
      type: String,
      default: null,
    },
    Create_at:{
      type: Number,
      default: Date.parse(new Date()),
    },
  },
  { collection: 'Users_Zalo',  // cài đặt tên cho conversations kết nối đến 
    versionKey: false   // loai bo version key  
  }  
);

export default mongoose.model("Users_Zalo", Users_ZaloSchema);