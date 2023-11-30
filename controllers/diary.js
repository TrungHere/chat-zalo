import Diary from "../models/Diary.js";
import Contact from "../models/Contact.js"
import User from "../models/User.js";
import Personal from "../models/Personal.js";
import Conversation from "../models/Conversation.js";
import { createError } from "../utils/error.js";
import io from 'socket.io-client';
import axios from 'axios'
import { urlChat365 } from '../utils/config.js'
// let socket = io('http://localhost:3030');
const socket = io.connect('wss://socket.timviec365.vn', {
    secure: true,
    enabledTransports: ["wss"],
    transports: ['websocket', 'polling'],
});
import multer from 'multer';
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import mongoose from "mongoose";
import { GetAvatarUser } from "../utils/GetAvatarUser.js"
import { GetAvatarUserSmall } from "../utils/GetAvatarUser.js"
const ObjectId = mongoose.Types.ObjectId
// const ObjectId = mongoose.Types.ObjectId

const IsFriend = async (userId1, userId2) => {
    let result1 = await Contact.find({
        $or: [
            { userFist: userId1 },
            { userSecond: userId1 }
        ]
    })
    let arrayUserId = [];
    if (result1) {
        for (let i = 0; i < result1.length; i++) {
            arrayUserId.push(result1[i].userFist);
            arrayUserId.push(result1[i].userSecond)
        }
    }
    arrayUserId = arrayUserId.filter(e => Number(e) != Number(userId1));
    return (arrayUserId.includes(userId2))
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(`/root/app/storage/chat365/diary`)) {
            fs.mkdirSync(`/root/app/storage/chat365/diary`);
        }
        if (!fs.existsSync(`/root/app/storage/chat365/diary/${req.body.conversationId}`)) {
            fs.mkdirSync(`/root/app/storage/chat365/diary/${req.body.conversationId}`);
        }
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'application/octet-stream' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'video/mp4' || file.mimetype === 'video/avi' || file.mimetype === 'video/mpeg') {
            cb(null, `/root/app/storage/chat365/diary/${req.body.conversationId}`)
        }
        else {
            cb(new Error('not image'), false)
        }
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${req.body.conversationId}_${req.body.userSender}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage: storage,
})

export const createPostDiary = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userSender)) {
                console.log("Token hop le,createPostDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.content || req.files.length > 0) {
            let err = false
            const files = [];
            const formData = {}
            formData.conversationId = req.body.conversationId
            formData.userSender = req.body.userSender
            formData.content = req.body.content
            formData.link = req.body.link
            formData.raw = req.body.raw
            formData.type = 'bài viết'
            const idAlbum = req.body.idAlbum
            formData.listTag = []
            if (req.body.listTag) {
                let string = String(req.body.listTag).replace("[", "");
                string = String(string).replace("]", "");
                let list = string.split(",");
                for (let i = 0; i < list.length; i++) {
                    formData.listTag.push(Number(list[i]));
                }
            }
            if (!fs.existsSync(`/root/app/storage/chat365/diary`)) {
                fs.mkdirSync(`/root/app/storage/chat365/diary`);
            }
            if (!fs.existsSync(`/root/app/storage/chat365/diary/${req.body.conversationId}`)) {
                fs.mkdirSync(`/root/app/storage/chat365/diary/${req.body.conversationId}`);
            }
            for (let i = 0; i < req.files.length; i++) {
                if (req.files[i].mimetype === 'image/jpeg' || req.files[i].mimetype === 'application/octet-stream' || req.files[i].mimetype === 'image/jpg' || req.files[i].mimetype === 'image/png' || req.files[i].mimetype === 'video/mp4' || req.files[i].mimetype === 'video/avi' || req.files[i].mimetype === 'video/mpeg') {
                    const pathFile = `${Date.now()}_${req.body.conversationId}_${req.body.userSender}${path.extname(req.files[i].originalname)}`
                    fs.writeFileSync(`/root/app/storage/chat365/diary/${req.body.conversationId}/${pathFile}`, req.files[i].buffer)

                    files.push({
                        pathFile: pathFile,
                        sizeFile: req.files[i].size,
                    })
                }
                else {
                    err = true
                    break
                }

            }
            if (!err) {
                formData.createAt = Date.now()
                const user = await User.findOne({ _id: Number(formData.userSender) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, });
                formData.avatarUserSender = user.avatarUser
                formData.userNameSender = user.userName
                formData.fileList = [...files]
                const diary = new Diary(formData);
                const saveddiary = await diary.save()
                if (saveddiary) {
                    if (idAlbum) {
                        await Diary.findOneAndUpdate({ _id: idAlbum }, { $push: { fileList: { $each: files } } })
                    }
                    saveddiary.createAt.setHours(saveddiary.createAt.getHours() + 7)
                    for (let i = 0; i < saveddiary.fileList.length; i++) {
                        saveddiary.fileList[i].pathFile = `${urlChat365()}/diary/${saveddiary.conversationId}/${saveddiary.fileList[i].pathFile}`
                    }
                    const listTag = []
                    for (let i = 0; i < formData.listTag.length; i++) {
                        const user = await User.findOne({ _id: Number(formData.listTag[i]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                        user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                        user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                        // if (user.avatarUser !== '') {
                        //     user.avatarUser = `${urlChat365()}/avatarUser/${user._id}/${user.avatarUser}`
                        // }
                        // else {
                        //     user.avatarUser = `${urlChat365()}/avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        // }
                        listTag.push({
                            '_id': user._id,
                            'userName': user.userName,
                            'avatarUser': user.avatarUser,
                            'avatarUserSmall': user.avatarUserSmall
                        })
                    }
                    delete saveddiary.listTag
                    saveddiary.listTag = listTag
                    let conv = await Conversation.findOne({ _id: Number(req.body.conversationId) }, { memberList: 1 });
                    let listUserId = [];
                    if (conv) {
                        for (let i = 0; i < conv.memberList.length; i++) {
                            listUserId.push(conv.memberList[i].memberId);
                        }
                    }
                    saveddiary._doc.totalEmotion = saveddiary.emotion.split('/').length - 1
                    const messages = {
                        message: `Bạn đã được gắn thẻ bới ${saveddiary.userNameSender} trong 1 bài viết`,
                        id: saveddiary._id,
                        conversationId: Number(formData.conversationId)
                    }
                    for (let i = 0; i < formData.listTag.length; i++) {
                        await axios({
                            method: "post",
                            url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification",
                            data: {
                                'Title': "Thông báo gắn thẻ",
                                'Message': JSON.stringify(messages),
                                'Type': "SendTag",
                                'UserId': formData.listTag[i]
                            },
                            headers: { "Content-Type": "multipart/form-data" }
                        });
                    }
                    res.json({
                        data: {
                            result: saveddiary,
                            message: 'Success'
                        },
                        error: null
                    })
                }
            }
            else {
                res.status(200).json(createError(200, "Dữ liệu truyền lên phải là hình ảnh hoặc video"));
            }

        }
        else {
            res.status(200).json(createError(200, "Chưa nhập dữ liệu"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const getAllPostDiary = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && (check.userId == req.params.userSeenId)) {
                console.log("Token hop le,getAllPostDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params && req.params.conversationId) {
            const userSeenId = req.params.userSeenId
            const conversationId = req.params.conversationId
            let diary = await Diary.find({ conversationId: conversationId, type: 'bài viết' }).sort({ createAt: 'desc' })
            if (diary) {
                if (diary.length > 0) {
                    // phân quyền người xem
                    let length = diary.length
                    for (let i = 0; i < diary.length; i++) {
                        if (diary[i].raw == '2') {
                            if (Number(userSeenId) !== diary[i].userSender) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        else if (diary[i].raw === '1') {
                            if (!(await IsFriend(userSeenId, diary[i].userSender)) && Number(userSeenId) !== diary[i].userSender) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        else if (diary[i].raw.includes('3/')) {
                            const s = diary[i].raw.slice(2, diary[i].raw.length)
                            if (!s.split(",").includes(userSeenId) && Number(userSeenId) !== diary[i].userSender) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        else if (diary[i].raw.includes('4/')) {
                            const s = diary[i].raw.slice(2, diary[i].raw.length)
                            if (s.split(",").includes(userSeenId)) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        if (diary.length != length) {
                            i--
                            length = diary.length
                            continue
                        }
                        diary[i].createAt.setHours(diary[i].createAt.getHours() + 7)
                        //gan link ảnh
                        const listTag = []
                        for (let j = 0; j < diary[i].listTag.length; j++) {
                            const user = await User.findOne({ _id: Number(diary[i].listTag[j]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                            // if (user.avatarUser !== '') {
                            //     user.avatarUser = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                            // }
                            // else {
                            //     user.avatarUser = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                            // }
                            user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                            user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                            listTag.push({
                                '_id': user._id,
                                'userName': user.userName,
                                'avatarUser': user.avatarUser,
                                'avatarUserSmall': user.avatarUserSmall
                            })
                        }
                        diary[i].listTag = listTag
                        diary[i]._doc.totalEmotion = diary[i].emotion.split('/').length - 1
                        if (diary[i].avatarUserSender !== '') {
                            diary[i].avatarUserSender = `${urlChat365()}avatarUser/${diary[i].userSender}/${diary[i].avatarUserSender}`
                        }
                        else {
                            diary[i].avatarUserSender = `${urlChat365()}avatar/${diary[i].userNameSender[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        }

                        for (let j = 0; j < diary[i].commentList.length; j++) {
                            if (diary[i].commentList[j].commentAvatar !== '') {
                                diary[i].commentList[j].commentAvatar = `${diary[i].commentList[j].commentAvatar}`
                            }
                            else {
                                diary[i].commentList[j].commentAvatar = `${urlChat365()}avatar/${diary[i].commentList[j].commentName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                            }
                        }

                        for (let j = 0; j < diary[i].fileList.length; j++) {
                            diary[i].fileList[j].pathFile = `${urlChat365()}diary/${diary[i].conversationId}/${diary[i].fileList[j].pathFile}`
                        }

                        const listUserEmotion = []
                        const ar = diary[i].emotion.split('/')
                        ar.pop()
                        for (let j = 0; j < ar.length; j++) {
                            const user = await User.findOne({ _id: Number(ar[j]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                            // if (user.avatarUser !== '') {
                            //     user.avatarUser = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                            // }
                            // else {
                            //     user.avatarUser = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                            // }
                            user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                            user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                            listUserEmotion.push(user)
                        }
                        diary[i]._doc.listUserEmotion = listUserEmotion

                    }
                    res.status(200).json({
                        data: {
                            result: diary,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json({
                        data: {
                            result: null,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
            }
            else {
                res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const getPostDiary = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status) {
                console.log("Token hop le,getPostDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params && req.params._id) {
            const postId = req.params._id
            const postDiary = await Diary.findOne({ _id: postId })

            if (postDiary) {
                if (postDiary) {
                    postDiary.createAt.setHours(postDiary.createAt.getHours() + 7)
                    postDiary._doc.totalEmotion = postDiary.emotion.split('/').length - 1
                    if (postDiary.avatarUserSender !== '') {
                        postDiary.avatarUserSender = `${urlChat365()}avatarUser/${postDiary.userSender}/${postDiary.avatarUserSender}`
                    }
                    else {
                        postDiary.avatarUserSender = `${urlChat365()}avatar/${postDiary.userNameSender[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    }

                    for (let i = 0; i < postDiary.fileList.length; i++) {
                        postDiary.fileList[i].pathFile = `${urlChat365()}diary/${postDiary.conversationId}/${postDiary.fileList[i].pathFile}`
                    }
                    const listUserEmotion = []
                    const ar = postDiary.emotion.split('/')
                    ar.pop()
                    for (let j = 0; j < ar.length; j++) {
                        const user = await User.findOne({ _id: Number(ar[j]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                        // if (user.avatarUser !== '') {
                        //     user.avatarUser = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                        // }
                        // else {
                        //     user.avatarUser = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        // }
                        user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                        user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)    
                        listUserEmotion.push(user)
                    }
                    postDiary._doc.listUserEmotion = listUserEmotion
                    const listTag = []
                    for (let i = 0; i < postDiary.listTag.length; i++) {
                        const user = await User.findOne({ _id: Number(postDiary.listTag[i]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                        // if (user.avatarUser !== '') {
                        //     user.avatarUser = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                        // }
                        // else {
                        //     user.avatarUser = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        // }
                        user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                        user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                        listTag.push({
                            '_id': user._id,
                            'userName': user.userName,
                            'avatarUser': user.avatarUser,
                            'avatarUserSmall': user.avatarUserSmall
                        })
                    }
                    delete postDiary.listTag
                    postDiary.listTag = listTag
                    res.status(200).json({
                        data: {
                            result: true,
                            message: "Lấy thông tin thành công",
                            post: postDiary
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json({
                        data: {
                            result: null,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            res.status(200).json(createError(200, "Chưa truyền đủ dữ liệu"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const editPostDiary = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le,editPostDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let err = false
        let files = [];
        const id = req.body.id;
        const content = req.body.content;
        const link = req.body.link
        const raw = req.body.raw
        const idImg = req.body.idImg ? req.body.idImg.split(',') : null
        const idAlbum = req.body.idAlbum
        const listTag = []
        if (req.body.listTag) {
            let string = String(req.body.listTag).replace("[", "");
            string = String(string).replace("]", "");
            let list = string.split(",");
            for (let i = 0; i < list.length; i++) {
                listTag.push(Number(list[i]));
            }
        }
        // const post = await Diary.findOneAndUpdate({ _id: id }, { $pull: { fileList: { _id: idImg } } }, { new: true })
        const post = await Diary.findOneAndUpdate({ _id: id }, { $pull: { fileList: { _id: idImg } } }, { projection: { conversationId: 1, userSender: 1, listTag: 1 } })
        for (let i = 0; i < req.files.length; i++) {
            if (req.files[i].mimetype === 'image/jpeg' || req.files[i].mimetype === 'application/octet-stream' || req.files[i].mimetype === 'image/jpg' || req.files[i].mimetype === 'image/png' || req.files[i].mimetype === 'video/mp4' || req.files[i].mimetype === 'video/avi' || req.files[i].mimetype === 'video/mpeg') {
                const pathFile = `${Date.now()}_${post.conversationId}_${post.userSender}${path.extname(req.files[i].originalname)}`
                fs.writeFileSync(`/root/app/storage/chat365/diary/${post.conversationId}/${pathFile}`, req.files[i].buffer)

                files.push({
                    pathFile: pathFile,
                    sizeFile: req.files[i].size,
                })
            }
            else {
                err = true
                break
            }

        }
        if (!err) {
            const diary = await Diary.findOneAndUpdate({ _id: id }, { content: content, $push: { fileList: { $each: files } }, link: link, raw: raw, listTag: listTag }, { new: true })
            if (diary) {
                if (idAlbum) {
                    await Diary.findOneAndUpdate({ _id: idAlbum }, { $push: { fileList: { $each: files } } })
                }
                diary.createAt.setHours(diary.createAt.getHours() + 7)
                diary._doc.totalEmotion = diary.emotion.split('/').length - 1
                for (let i = 0; i < diary.fileList.length; i++) {
                    diary.fileList[i].pathFile = `${urlChat365()}diary/${diary.conversationId}/${diary.fileList[i].pathFile}`
                }

                const listTag = []
                for (let i = 0; i < diary.listTag.length; i++) {
                    const user = await User.findOne({ _id: Number(diary.listTag[i]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                    // if (user.avatarUser !== '') {
                    //     user.avatarUser = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                    // }
                    // else {
                    //     user.avatarUser = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    // }
                    user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                    user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                    listTag.push({
                        '_id': user._id,
                        'userName': user.userName,
                        'avatarUser': user.avatarUser,
                        'avatarUserSmall': user.avatarUserSmall,
                    })
                }
                delete diary.listTag
                diary.listTag = listTag
                let conv = await Conversation.findOne({ _id: Number(diary.conversationId) }, { memberList: 1 });
                let listUserId = [];
                if (conv) {
                    for (let i = 0; i < conv.memberList.length; i++) {
                        listUserId.push(conv.memberList[i].memberId);
                        console.log(conv.memberList[i].memberId)
                    }
                }

                const message = `${diary.userNameSender} vừa sửa 1 bài viết`
                // socket.emit("EditPostDiary", diary, listUserId);
                //Gửi thông báo tới những người mới được thêm tang
                for (let i = 0; i < diary.listTag.length; i++) {
                    listTag.splice(listTag.indexOf(diary.listTag[i]), 1)
                }
                for (let i = 0; i < listTag.length; i++) {
                    await axios({
                        method: "post",
                        url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification",
                        data: {
                            'Title': "Thông báo gắn thẻ",
                            'Message': `Bạn đã được gắn thẻ bới ${diary.userNameSender} trong 1 bài viết`,
                            'Type': "SendCandidate",
                            'UserId': listTag[i]
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                }
                res.json({
                    data: {
                        result: diary,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            res.status(200).json(createError(200, "Dữ liệu truyền lên phải là hình ảnh hoặc video"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const deletePostDiary = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && (check.userId == req.params.userSender)) {
                console.log("Token hop le,deletePostDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params && req.params.id) {
            const idPost = req.params.id;
            const userSender = req.body.userSender
            const result = await Diary.findOneAndDelete({ _id: idPost })
            if (result) {
                const conv = await Conversation.findOne({ _id: result.conversationId }, { memberList: 1 })
                // socket.emit('DeletePostDiary', result, [conv.memberList[0].memberId, conv.memberList[1].memberId])
                res.status(200).json({ "message": "Success" });
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const releaseEmotion = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userSendId)) {
                console.log("Token hop le,releaseEmotion ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body) {
            const data = {}
            let totalEmotion, message
            data.userSendId = req.body.userSendId
            data.postId = req.body._id

            const postDiary = await Diary.findOne({ _id: data.postId })

            const currentTotalEmotion = postDiary.totalEmotions ? postDiary.emotion.split('/').length - 1 : 0

            if (postDiary.emotion) {
                if (postDiary.emotion.split('/').includes(data.userSendId)) {  //Xóa lượt thích
                    postDiary.emotion = postDiary.emotion.replace(`${data.userSendId}/`, '')
                }
                else {
                    postDiary.emotion = `${postDiary.emotion}${data.userSendId}/` //Thêm lượt thích
                }
            }
            else {
                postDiary.emotion = `${data.userSendId}/`  //Thêm lượt thích
            }

            if (postDiary.emotion) {
                totalEmotion = postDiary.emotion.split('/').length - 1
            }
            else {
                totalEmotion = 0
            }
            const diary = await Diary.findOneAndUpdate({ _id: data.postId }, { emotion: postDiary.emotion }, { new: true })
            if (diary) {
                const user = await User.findOne({ _id: Number(data.userSendId) }, { userName: 1, avatarUser: 1 });
                if (currentTotalEmotion < totalEmotion) {
                    message = `${user.userName} đã thích 1 bài viết của bạn`
                }
                for (let i = 0; i < diary.fileList.length; i++) {
                    diary.fileList[i].pathFile = `${urlChat365()}diary/${diary.conversationId}/${diary.fileList[i].pathFile}`
                }
                const result = { ...diary }
                result._doc.totalEmotion = totalEmotion
                const listUserEmotion = []
                const ar = diary.emotion.split('/')
                ar.pop()
                for (let j = 0; j < ar.length; j++) {
                    const user = await User.findOne({ _id: Number(ar[j]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                    // if (user.avatarUser !== '') {
                    //     user.avatarUser = `${urlChat365()}/avatarUser/${user._id}/${user.avatarUser}`
                    // }
                    // else {
                    //     user.avatarUser = `${urlChat365()}/avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    // }
                    user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                    user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                    listUserEmotion.push(user)
                }
                result._doc.listUserEmotion = listUserEmotion
                socket.emit("releasePost", result._doc, message, user, diary.userSender)
                res.status(200).json({
                    data: {
                        result: result._doc,
                        message: "Success",
                    },
                    error: null
                });
            }
            else {
                res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const createAlbumDiary = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userSender)) {
                console.log("Token hop le,createAlbumDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.content || req.files.length > 0) {
            let err = false
            const files = [];
            const formData = {}
            formData.type = 'album'
            formData.conversationId = req.body.conversationId
            formData.userSender = req.body.userSender
            formData.content = req.body.content
            formData.nameAlbum = req.body.nameAlbum
            formData.raw = req.body.raw

            if (!fs.existsSync(`/root/app/storage/chat365/diary`)) {
                fs.mkdirSync(`/root/app/storage/chat365/diary`);
            }
            if (!fs.existsSync(`/root/app/storage/chat365/diary/${req.body.conversationId}`)) {
                fs.mkdirSync(`/root/app/storage/chat365/diary/${req.body.conversationId}`);
            }
            for (let i = 0; i < req.files.length; i++) {
                if (req.files[i].mimetype === 'image/jpeg' || req.files[i].mimetype === 'application/octet-stream' || req.files[i].mimetype === 'image/jpg' || req.files[i].mimetype === 'image/png' || req.files[i].mimetype === 'video/mp4' || req.files[i].mimetype === 'video/avi' || req.files[i].mimetype === 'video/mpeg') {
                    const pathFile = `${Date.now()}_${req.body.conversationId}_${req.body.userSender}${path.extname(req.files[i].originalname)}`
                    fs.writeFileSync(`/root/app/storage/chat365/diary/${req.body.conversationId}/${pathFile}`, req.files[i].buffer)

                    files.push({
                        pathFile: pathFile,
                        sizeFile: req.files[i].size,
                    })
                }
                else {
                    err = true
                    break
                }

            }
            if (!err) {
                formData.createAt = Date.now()
                const user = await User.findOne({ _id: Number(formData.userSender) }, { userName: 1, avatarUser: 1 });
                formData.avatarUserSender = user.avatarUser
                formData.userNameSender = user.userName
                formData.fileList = [...files]
                const diary = new Diary(formData);
                const saveddiary = await diary.save()
                if (saveddiary) {
                    for (let i = 0; i < saveddiary.fileList.length; i++) {
                        saveddiary.fileList[i].pathFile = `${urlChat365()}diary/${saveddiary.conversationId}/${saveddiary.fileList[i].pathFile}`
                    }
                    saveddiary._doc.totalEmotion = saveddiary.emotion.split('/').length - 1
                    res.json({
                        data: {
                            result: saveddiary,
                            message: 'Success'
                        },
                        error: null
                    })
                }
            }
            else {
                res.status(200).json(createError(200, "Dữ liệu truyền lên phải là hình ảnh hoặc video"));
            }

        }
        else {
            res.status(200).json(createError(200, "Chưa nhập dữ liệu"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const editAlbumDiary = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le,editAlbumDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let err = false
        const files = [];
        const id = req.body.id;
        const content = req.body.content;
        const nameAlbum = req.body.nameAlbum
        const raw = req.body.raw

        for (let i = 0; i < req.files.length; i++) {
            if (req.files[i].mimetype === 'image/jpeg' || req.files[i].mimetype === 'application/octet-stream' || req.files[i].mimetype === 'image/jpg' || req.files[i].mimetype === 'image/png' || req.files[i].mimetype === 'video/mp4' || req.files[i].mimetype === 'video/avi' || req.files[i].mimetype === 'video/mpeg') {
                const pathFile = `${Date.now()}_${req.body.conversationId}_${req.body.userSender}${path.extname(req.files[i].originalname)}`
                fs.writeFileSync(`/root/app/storage/chat365/diary/${req.body.conversationId}/${pathFile}`, req.files[i].buffer)

                files.push({
                    pathFile: pathFile,
                    sizeFile: req.files[i].size,
                })
            }
            else {
                err = true
                break
            }

        }
        if (!err) {
            const diary = await Diary.findOneAndUpdate({ _id: id }, { content: content, createAt: Date.now(), fileList: files, nameAlbum: nameAlbum, raw: raw }, { new: true })
            if (diary) {
                diary._doc.totalEmotion = diary.emotion.split('/').length - 1
                for (let i = 0; i < diary.fileList.length; i++) {
                    diary.fileList[i].pathFile = `${urlChat365()}diary/${diary.conversationId}/${diary.fileList[i].pathFile}`
                }
                let conv = await Conversation.findOne({ _id: Number(diary.conversationId) }, { memberList: 1 });
                let listUserId = [];
                if (conv) {
                    for (let i = 0; i < conv.memberList.length; i++) {
                        listUserId.push(conv.memberList[i].memberId);
                    }
                }
                const message = `${diary.userNameSender} vừa sửa 1 bài viết`
                socket.emit("post", diary, message, listUserId);
                res.json({
                    data: {
                        result: diary,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            res.status(200).json(createError(200, "Dữ liệu truyền lên phải là hình ảnh hoặc video"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const getAllAlbumDiary = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && (check.userId == req.params.userSeenId)) {
                console.log("Token hop le,getAllAlbumDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params && req.params.conversationId) {
            const userSeenId = req.params.userSeenId
            const conversationId = req.params.conversationId
            let diary = await Diary.find({ conversationId: conversationId, type: 'album' }).sort({ createAt: 'desc' })
            if (diary) {
                if (diary.length > 0) {
                    // phân quyền người xem
                    let length = diary.length
                    for (let i = 0; i < diary.length; i++) {
                        if (diary[i].raw == '2') {
                            if (Number(userSeenId) !== diary[i].userSender) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        else if (diary[i].raw === '1') {
                            if (!(await IsFriend(userSeenId, diary[i].userSender)) && Number(userSeenId) !== diary[i].userSender) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        else if (diary[i].raw.includes('3/')) {
                            const s = diary[i].raw.slice(2, diary[i].raw.length)
                            if (!s.split(",").includes(userSeenId) && Number(userSeenId) !== diary[i].userSender) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        else if (diary[i].raw.includes('4/')) {
                            const s = diary[i].raw.slice(2, diary[i].raw.length)
                            if (s.split(",").includes(userSeenId)) {
                                diary = diary.filter(e => e._id !== diary[i]._id)
                            }
                        }
                        if (diary.length != length) {
                            i--
                            length = diary.length
                            continue
                        }
                        //gan link ảnh
                        diary[i]._doc.totalEmotion = diary[i].emotion.split('/').length - 1
                        if (diary[i].avatarUserSender !== '') {
                            diary[i].avatarUserSender = `${urlChat365()}avatarUser/${diary[i].userSender}/${diary[i].avatarUserSender}`
                        }
                        else {
                            diary[i].avatarUserSender = `${urlChat365()}avatar/${diary[i].userNameSender[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        }

                        for (let j = 0; j < diary[i].commentList.length; j++) {
                            if (diary[i].commentList[j].commentAvatar !== '') {
                                diary[i].commentList[j].commentAvatar = `${urlChat365()}avatarUser/${diary[i].commentList[j].commentatorId}/${diary[i].commentList[j].commentAvatar}`
                            }
                            else {
                                diary[i].commentList[j].commentAvatar = `${urlChat365()}avatar/${diary[i].commentList[j].commentName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                            }
                        }

                        for (let j = 0; j < diary[i].fileList.length; j++) {
                            diary[i].fileList[j].pathFile = `${urlChat365()}diary/${diary[i].conversationId}/${diary[i].fileList[j].pathFile}`
                        }

                        const listUserEmotion = []
                        const ar = diary[i].emotion.split('/')
                        ar.pop()
                        for (let j = 0; j < ar.length; j++) {
                            const user = await User.findOne({ _id: Number(ar[j]) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                            // if (user.avatarUser !== '') {
                            //     user.avatarUser = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                            // }
                            // else {
                            //     user.avatarUser = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                            // }
                            user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                            user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                            listUserEmotion.push(user)
                        }
                        diary[i]._doc.listUserEmotion = listUserEmotion

                    }
                    res.status(200).json({
                        data: {
                            result: diary,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json({
                        data: {
                            result: null,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
            }
            else {
                res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const deleteAlbumDiary = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && (check.userId == req.params.userSender)) {
                console.log("Token hop le,deleteAlbumDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params && req.params.id) {
            const idAlbum = req.params.id;
            const userSender = req.body.userSender
            const result = await Diary.findOneAndDelete({ _id: idAlbum })
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetComments = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le,GetComments ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.id && req.body.listComment && req.body.countComment) {
            console.log('test')
            const id = req.body.id
            const countComment = Number(req.body.countComment)
            const listComment = Number(req.body.listComment)

            const commentList = await Diary.aggregate([
                {
                    '$match': {
                        '_id': new ObjectId(id)
                    }
                }, {
                    '$lookup': {
                        'from': 'Users',
                        'localField': 'commentList.commentatorId',
                        'foreignField': '_id',
                        'as': 'user'
                    }
                }, {
                    '$project': {
                        'commentList': 1,
                        'user': 1
                    }
                }, {
                    '$unwind': {
                        'path': '$commentList'
                    }
                }, {
                    '$project': {
                        'comment': '$commentList',
                        'user': {
                            '$filter': {
                                'input': '$user',
                                'as': 'user',
                                'cond': {
                                    '$eq': [
                                        '$$user._id', '$commentList.commentatorId'
                                    ]
                                }
                            }
                        }
                    }
                }, {
                    '$unwind': {
                        'path': '$user'
                    }
                }, {
                    '$project': {
                        '_id': '$comment._id',
                        'commentatorId': '$user._id',
                        'commentName': '$user.userName',
                        'commentAvatar': '$user.avatarUser',
                        'content': '$comment.content',
                        'commentEmotion': '$comment.commentEmotion',
                        'createAt': '$comment.createAt'
                    }
                }, {
                    '$sort': {
                        'createAt': -1
                    }
                }, {
                    '$skip': listComment
                }, {
                    '$limit': countComment
                }
            ])
            if (commentList.length > 0) {
                for (var i = 0; i < commentList.length; i++) {
                    commentList[i].totalCommentEmotion = commentList[i].commentEmotion.split(',').length - 1
                    commentList[i].commentEmotion = commentList[i].commentEmotion.slice(1)
                    if (commentList[i].commentAvatar !== '') {
                        commentList[i].commentAvatar = `${urlChat365()}avatarUser/${commentList[i].commentatorId}/${commentList[i].commentAvatar}`
                    }
                    else {
                        commentList.commentAvatar = `${urlChat365()}avatar/${commentList[i].commentName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    }
                }
                res.json({
                    data: {
                        result: true,
                        message: 'Lấy danh sách bình luận thành công',
                        countComment: commentList.length,
                        commentList: commentList
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Không có bình luận nào"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UploadBackgroundDiary = async (req, res, next) => {
    try {
        if (req.file) {
            if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'application/octet-stream' || req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/png') {
                if (!fs.existsSync(`public/backgroundDiary/${req.body.conversationId}`)) {
                    fs.mkdirSync(`public/backgroundDiary/${req.body.conversationId}`);
                }
                const pathFile = `${Date.now()}_${req.body.conversationId}${path.extname(req.file.originalname)}`
                fs.writeFileSync(`public/backgroundDiary/${req.body.conversationId}/${pathFile}`, req.file.buffer)
                const file = [{
                    pathFile: pathFile,
                    sizeFile: req.file.size,
                }]
                const update = await Diary.findOneAndUpdate({ conversationId: Number(req.body.conversationId), type: 'background' }, { fileList: file }, { new: true })
                if (!update) {
                    const diary = await Diary.create({ type: 'background', fileList: file, conversationId: Number(req.body.conversationId), raw: 1, createAt: new Date() })
                }
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật ảnh bìa thành công',
                        background: `http://43.239.223.142:9000/background/${pathFile}`
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "File truyền lên không đúng định dạng"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetBackgroundDiary = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le,deleteAlbumDiary ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId) {
            const userId = Number(req.body.userId)
            const personal = await Personal.findOne({ userId: userId, 'backgroundImage.0': { '$exists': true } }, { backgroundImage: 1 })
            if (personal) {
                res.json({
                    data: {
                        result: true,
                        message: 'Lấy ảnh bìa thành công',
                        background: `${urlChat365()}Testnode/public/personalBackgroundImg/${personal.backgroundImage[0].pathFile}`
                    },
                    error: null
                })
            }
            else {
                res.json({
                    data: {
                        result: true,
                        message: 'Không có ảnh bìa',
                    },
                    error: null
                })
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
