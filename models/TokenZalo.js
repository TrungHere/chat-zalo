import mongoose from "mongoose";
const Token_ZaloSchema = new mongoose.Schema(
  {
    _id :{// id bảng
      type: Number,
      required: true,
    },
    name :{ // tên công ty
      type: String,
      default: null,
    },
    oa_id:{ // id zalo Cty
      type: Number,
      default: 0,
    },
    app_id:{ // id app zalo 
      type: Number,
      default: 0,
    },
    access_token :{ // 
        type: String,
        default: null,
      },
    refresh_token :{ // 
        type: String,
        default: null,
      },
    Create_at:{ // ngày tạo 
      type: Number,
      default: Date.parse(new Date()),
    },
    Update_at:{ // ngày cập nhật
      type: Number,
      default: null,
    },
  },
  { collection: 'Token_Zalo',  // cài đặt tên cho conversations kết nối đến 
    versionKey: false   // loai bo version key  
  }  
);

export default mongoose.model("Token_Zalo", Token_ZaloSchema);