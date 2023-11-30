import mongoose from "mongoose";
const RequestContactSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
            default: 0,
        },
        contactId: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            default: "",
        },
        type365: {
            type: Number,
            default: 0,
        }
     
    },
    {
        collection: 'RequestContact',  // cài đặt tên cho conversations kết nối đến 
        versionKey: false   // loai bo version key 
    },
);

export default mongoose.model("RequestContact", RequestContactSchema);