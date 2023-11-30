import mongoose from "mongoose";
const ManageApiMailSchema = new mongoose.Schema(
  {
    link :{
        type: String,
        default:""
    },
    count :{
        type: Number,
        default:""
    },
    day:{
      type: String,
      default:"0"
    }
  },
  { collection: 'ManageApiMail',   
    versionKey: false  
  }  
);

export default mongoose.model("ManageApiMail", ManageApiMailSchema);