import mongoose from "mongoose";
const UsersClassifiedSchema = new mongoose.Schema(
  {
    NameClass :{
      type: String,
      default:""
    },
    IdOwner :{
      type: Number,
      required: true,
    },
    listUserId:{
      type: [Number],
      default:[],
    },
    Color:{
      type: String,
      default:"1"
    }
  },
  { collection: 'UsersClassified',  // cài đặt tên cho conversations kết nối đến 
    versionKey: false   // loai bo version key  
  }  
);

export default mongoose.model("UsersClassified", UsersClassifiedSchema);