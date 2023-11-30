import mongoose from "mongoose";
const PollSchema = new mongoose.Schema(
    {
        senderId: {
            type: Number,
        },
        senderName: {
            type: String,
        },
        senderAvatar: {
            type: String,
        },
        conversatonId: {
            type: Number,
        },
        title: {
            type: String,
        },
        expires: {
            type: Date,
        },
        timeWarning: {
            type: String,
        },
        option: [
            {
                message: {
                    type: String,
                },
                participant: {
                    type: Array,
                    default: []
                }
            }
        ],
        totalUser: {
            type: Number,
        },
        messageId: {
            type: String,
        }
    },
    {
        collection: 'Polls',
        versionKey: false   // loai bo version key 
    }
);

export default ContactConversation.model("Poll", PollSchema);