import mongoose from "mongoose";
const DiarySchema = new mongoose.Schema(
    {
        userSender: {
            type: Number,
            default: 0,
        },
        avatarUserSender: {
            type: String,
            default: "",
        },
        userNameSender: {
            type: String,
            default: "",
        },
        conversationId: {
            type: Number,
            default: 0,
        },
        createAt: {
            type: Date,
            required: true,
        },
        type: {
            type: String,
            num: ['bài viết', 'album', 'background']
        },
        listTag: {
            type: Array,
            default: [],
        },
        nameAlbum: {
            type: String,
        },
        content: {
            type: String,
        },
        link: {
            type: String,
            default: ''
        },
        fileList: [
            {
                pathFile: String,
                sizeFile: Number,
            }
        ],
        raw: {
            type: String,
            required: true
            // 1 tất cả bạn bè
            // 2 chỉ mình tôi
            // 3/id1,id2,id3 bạn bè tôi chọn id1 id2 id3
            // 4/id1,id2,id3  tất cả bạn bè ngoại trừ id1 id2 
        },
        emotion: {
            type: String,
            default:"",
        },
        commentList: [
            {
                content: {
                    type: String,
                    required: true
                },
        
                commentatorId: {
                    type: Number,
                    required: true
                },
                createAt: {
                    type: Date,
                    required: true
                },
                commentName: {
                    type: String,
                },
                commentAvatar: {
                    type: String,
                },
                commentEmotion: {
                    type: String,
                    default: "",
                },
                commentLikeAvatar: {
                    type: String,
                    default: "",
                },
                commentLikeName: {
                    type: String,
                    default: "",
                },
                IdImage: {
                    type: String,
                },
                IdVideo: {
                    type: String,
                },
            }
        ],
        
    },
    {
        collection: 'Diary',  // cài đặt tên cho conversations kết nối đến 
        versionKey: false   // loai bo version key 
    },
);

export default mongoose.model("Diary", DiarySchema);