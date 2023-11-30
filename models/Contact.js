import mongoose from "mongoose";
// let ContactConversation = mongoose.createConnection('mongodb://localhost:27017/api-base365');
const ContactSchema = new mongoose.Schema(
  {
      userFist: {
        type: Number,
        default:0,
      },
      userSecond: {
        type: Number,
        default:0,
      },
      bestFriend:{
        type: Number,
        default:0,
      }
  },
  { collection: 'Contacts', 
    versionKey: false   // loai bo version key 
  }
);

export default mongoose.model("Contact", ContactSchema);
// export default ContactConversation.model("Contact", ContactSchema);