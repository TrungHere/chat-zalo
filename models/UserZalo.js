import mongoose from "mongoose";
const Users_ZaloSchema = new mongoose.Schema(
  {
    _id :{
      type: Number,
      required: true,

    },
    display_name :{ // tên zalo KH
      type: String,
      default: null,
    },
    user_id:{ // id zalo KH
      type: Number,
      default: 0,
    },
    oa_id:{ // id zalo Cty
      type: Number,
      default: 0,
    },
    Phone:{
      type: Number,
      default: 0,
    },
    Gender:{
      type: Number,
      default: 0,
    },
    Email:{
      type: String,
      default: null,
    },
    avatar:{
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
    birth_date:{
      type: Number,
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