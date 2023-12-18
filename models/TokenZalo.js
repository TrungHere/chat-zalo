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
      type: String,
      default: 0,
    },
    app_id:{ // id app zalo 
      type: String,
      default: 0,
    },
    com_id: { //id công ty
      type: Number,
      default: 0
    },
    currentIndex: { //Phục vụ phân chia list nhân viên được phân quyền 
      type: Number,
      default: 0
    },
    idQLC: { //danh sách id nhân viên được phân quyền
      type: [Number],
      default:[],
    },
    secret_key :{ // 
        type: String,
        default: null,
      },
    secret_key_OA :{ // 
        type: String,
        default: null,
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