import mongoose from "mongoose";
// let ConConversation = mongoose.createConnection('mongodb://localhost:27017/api-base365');
const ConversationSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
            required: true,
        },
        // 0 là cuộc trò chuyện 1 1 
        isGroup: {
            type: Number,
            required: true,
        },
        typeGroup: {// Normal / offline / zalo
            type: String,
            required: true,
        },
        avatarConversation: {
            type: String,
            default: ""
        },
        userCreate: {
            type: Number,
            default: 0
        },
        adminId: {
            type: Number,
            default: 0
        },
        deputyAdminId: {
            type: Array,
            default: []
        },
        IdCustomer: {
            type: Number,
            default: 0
        },
        shareGroupFromLinkOption: {
            type: Number,
            default: 1
        },
        browseMemberOption: {
            type: Number,
            default: 1
        },
        pinMessage: {
            type: String,
            default: ""
        },
        memberList: [
            {
                _id: {
                    type: Number,
                    required: false,
                },
                memberId: {
                    type: Number,
                    required: false,
                },
                conversationName: {
                    type: String,
                    default: ""
                },
                unReader: {
                    type: Number,
                    default: 0,
                },
                messageDisplay: {
                    type: Number,
                    default: 0,
                },
                isHidden: {
                    type: Number,
                    default: 0,
                },
                isFavorite: {
                    type: Number,
                    default: 0,
                },
                notification: {
                    type: Number,
                    default: 1
                },
                timeLastSeener: {
                    type: Date,
                    default: new Date(),
                },
                lastMessageSeen: {
                    type: String,
                    default: "",
                },
                deleteTime: {
                    type: Number,
                    default: 0,
                },
                deleteType: {
                    type: Number,
                    default: 0,
                },
                favoriteMessage: {
                    type: [String],

                },
                liveChat: {
                    type: Object,
                    default: null,
                    // clientId:{
                    //     type: String
                    // },
                    // clientName:{
                    //     type: String
                    // },
                    // fromWeb:{
                    //     type: String,
                    // },
                }
            }
        ],
        messageList: [
            {
                _id: {
                    type: String,
                    required: false,
                },
                displayMessage: {
                    type: Number,
                    required: false,
                },
                senderId: {
                    type: Number,
                    required: false,
                },
                messageType: {
                    type: String,
                    required: false,
                },
                message: {
                    type: String,
                    default: ""
                },
                quoteMessage: {
                    type: String,
                    required: false,
                    default: ""
                },
                messageQuote: {
                    type: String,
                    required: false,
                    default: ""
                },
                createAt: {
                    type: Date,
                    default: new Date(),
                },
                isEdited: {
                    type: Number,
                    required: false,
                    default: 0
                },
                isClicked: {
                    type: Number,
                    required: false,
                    default: 0
                },
                isSecret: {
                    type: Number,
                    required: false,
                    default: 0
                },
                infoLink: {
                    title: String,
                    description: String,
                    linkHome: String,
                    image: String,
                    isNotification: Number,
                },
                listFile: [
                    {
                        _id: {
                            type: String,
                            required: false,
                        },
                        sizeFile: Number,
                        nameFile: String,
                        height: Number,
                        width: Number,
                    }
                ],
                emotion: {
                    Emotion1: String,
                    Emotion2: String,
                    Emotion3: String,
                    Emotion4: String,
                    Emotion5: String,
                    Emotion6: String,
                    Emotion7: String,
                    Emotion8: String,
                },
                localFile: [
                    {
                        IdDevice: String,
                        pathFile: String,
                    }
                ],
                deleteTime: {
                    type: Number,
                    required: false,
                    default: 0
                },
                deleteType: {
                    type: Number,
                    required: false,
                    default: 0
                },
                deleteDate: {
                    type: Date,
                    default: new Date("0001-01-01T00:00:00.000+00:00"),
                },
                notiClicked: {
                    type: [Number],
                    default: null,
                },
                infoSupport: {
                    // title:String,
                    // message:String,
                    // supportId:String,
                    // haveConversation:Number,
                    // userId:Number,
                    // status:Number,
                    // time:Date,
                    type: Object,
                    required: false
                },
                liveChat: {
                    // clientId:String,
                    // clientName:String,
                    // fromWeb:String,
                    type: Object,
                    required: false
                },
                from: {
                    type: String,
                    required: false,
                    default: ""
                },
                listDeleteUser: {
                    type: [Number],
                    default: []
                },
                uscid: {
                    type: String,
                    default: ""
                }
            }
        ],
        browseMemberList: [
            {
                _id: false,
                memberAddId: Number,
                memberBrowserId: Number,
            }
        ],
        timeLastMessage: {
            type: Date,
            default: new Date()
        },
        timeLastChange: {
            type: Date,
            default: new Date()
        },
        listDeleteMessageOneSite: {
            type: [Number],
            default: []
        },
        requestAdmin: [
            {
                userId: Number,
                userSuggest: Number,
                request: String,
                reasonForDelete: {
                    type: String,
                    default: ''
                },
                messageId: String,
                _id: false
            }
        ],
        memberApproval: {
            type: Number,
            default: 1 // Bật duyệt thành viên , 2,0 không bật  
        },
        createdAt: { type: Date, default: new Date() },
        updatedAt: { type: Date, default: new Date() },
    },
    {
        collection: 'Conversations',  // cài đặt tên cho conversations kết nối đến 
        versionKey: false,   // loai bo version key 
    },
);
ConversationSchema.virtual('members', {
    ref: 'Users',
    localField: 'memberList.memberId',
    foreignField: '_id'
})
export default mongoose.model("Conversation", ConversationSchema);
// export default ConConversation.model("Conversation", ConversationSchema);