import mongoose from "mongoose";
const FastMessageSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
        },
        title: {
            type: String,
            default: ''
        },
        message: {
            type: String,
            default: ''
        },
        image: {
            type: String,
            default: ''
        },
        infoImage: {
            TypeFile: String,
            FullName: String,
            FileSizeInByte: String,
            Height: Number,
            Width: Number,
            SizeFile: Number,
            NameDisplay: String,
        }
    },
    {
        collection: 'FastMessages',
        versionKey: false   // loai bo version key 
    }
);

export default mongoose.model("FastMessage", FastMessageSchema);