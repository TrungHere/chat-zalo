import axios from 'axios'
import io from 'axios'
import Poll from "../models/Poll.js";
import { createError } from "../utils/error.js";

const socket = io.connect('wss://socket.timviec365.vn', {
    secure: true,
    enabledTransports: ["wss"],
    transports: ['websocket', 'polling'],
});

export const CreatePoll = async (req, res, next) => {
    try {
        if (req.body.title && req.body.senderId && req.body.conversationId) {
            const senderId = Number(req.body.senderId)
            const conversationId = Number(req.body.conversationId)
            const title = req.body.title
            const expires = new Date(req.body.expires)
            const timeWarning = req.body.timeWarning
            const totalUser = 0
            const message = req.body.option.replace('[', '').replace(']', '').split(',')
            const option = []
            if (message.length < 2) {
                return res.status(200).json(createError(200, "Bạn không thể tạo bình chọn ít hơn 2 lựa chọn"))
            }
            if (expires < new Date()) {
                return res.status(200).json(createError(200, "Thời gian phải lớn hơn thời gian hiện tại"))
            }
            for (let i = 0; i < message.length; i++) {
                option.push({ message: message[i] })
            }
            let user = await axios({
                method: "post",
                url: "http://43.239.223.142:9000/api/users/GetInfoUser",
                data: {
                    'ID': senderId
                },
                headers: { "Content-Type": "multipart/form-data" }
            })
            if (user.data.data) {
                const poll = await Poll.create({
                    senderId: senderId,
                    senderName: user.data.data.user_info.userName,
                    senderAvatar: user.data.data.user_info.avatarUser,
                    conversatonId: conversationId,
                    title: title,
                    expires: expires,
                    timeWarning: timeWarning,
                    option: option,
                    totalUser: totalUser
                })
                if (poll) {
                    poll._doc.expires = `${expires.getHours()}:${expires.getMinutes() > 9 ? expires.getMinutes() : `0${expires.getMinutes()}`}, ${expires.getDate() > 9 ? expires.getDate() : `0${expires.getDate()}`}/${expires.getMonth() > 8 ? expires.getMonth() + 1 : `0${expires.getMonth() + 1}`}/${expires.getFullYear()}`
                    await axios({
                        method: "post",
                        url: "http://43.239.223.142:9000/api/message/SendMessage",
                        data: {
                            ConversationID: conversationId,
                            SenderID: senderId,
                            MessageType: "notification",
                            Message: `${user.data.data.user_info.userName} đã tạo một cuộc thăm dò ý kiến`
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    })
                    let sendmes = await axios({
                        method: "post",
                        url: "http://43.239.223.142:9000/api/message/SendMessage",
                        data: {
                            ConversationID: conversationId,
                            SenderID: senderId,
                            MessageType: "sendPoll",
                            Message: JSON.stringify(poll)
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    })
                    await Poll.findOneAndUpdate({ _id: poll._id }, { messageId: sendmes.data.data.messageId })
                    res.json({
                        data: {
                            result: true,
                            message: 'Tạo thăm dò ý kiến thành công',
                            data: poll
                        },
                        error: null
                    })
                }
                else {
                    res.status(200).json(createError(200, "Tạo thăm dò ý kiến thất bại"))
                }
            }
            else {
                res.status(200).json(createError(200, user.data.error.message))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log('Tiến CreatePoll:', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const GetDetailPoll = async (req, res) => {
    try {
        const id = req.body.id
        const poll = await Poll.findOne({ _id: id })
        if (poll) {
            // console.log(poll.option)
            let conv = await axios({
                method: "post",
                url: "http://43.239.223.142:9000/api/conversations/GetConversation",
                data: {
                    'conversationId': poll.conversatonId,
                    'senderId': poll.senderId
                },
                headers: { "Content-Type": "multipart/form-data" }
            })
            poll._doc.conversationName = conv.data.data.conversation_info.conversationName
            poll._doc.totalMember = conv.data.data.conversation_info.listMember.length
            poll._doc.expires = `${poll.expires.getHours()}:${poll.expires.getMinutes() > 9 ? poll.expires.getMinutes() : `0${poll.expires.getMinutes()}`}, ${poll.expires.getDate() > 9 ? poll.expires.getDate() : `0${poll.expires.getDate()}`}/${poll.expires.getMonth() > 8 ? poll.expires.getMonth() + 1 : `0${poll.expires.getMonth() + 1}`}/${poll.expires.getFullYear()}`
            const options = []
            await Promise.all(
                poll.option.map(async (option) => {
                    let users = []
                    await Promise.all(
                        option.participant.map(async (userId) => {
                            let user = await axios({
                                method: "post",
                                url: "http://43.239.223.142:9000/api/users/GetInfoUser",
                                data: {
                                    'ID': userId
                                },
                                headers: { "Content-Type": "multipart/form-data" }
                            })
                            users.push({
                                _id: user.data.data.user_info.id,
                                userName: user.data.data.user_info.userName,
                                avatarUser: user.data.data.user_info.avatarUser
                            })
                        })
                    )
                    options.push({
                        message: option.message,
                        participant: users,
                        _id: option._id
                    })
                })
            )
            poll.option = options
            // for (let i = 0; i < poll.option.length; i++) {
            //     for (let j = 0; j < poll.option[i].participant.length; j++) {
            //         const user = await User.findOne({ _id: poll.option[i].participant[i] }, { userName: 1, avatarUser: 1 })
            //         if (user.avatarUser !== '') {
            //             user.avatarUser = `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
            //         }
            //         else {
            //             user.avatarUser = `https://mess.timviec365.vn/avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
            //         }
            //         poll.option[i].participant[j] = user
            //     }
            // }
            res.json({
                data: {
                    result: true,
                    message: 'Lấy thông tin thăm dò ý kiến thành công',
                    data: poll
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Không tồn tại cuộc thăm dò ý kiến"))
        }
    } catch (err) {
        console.log('Tiến GetDetailPoll:', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const VotePoll = async (req, res) => {
    try {
        if (req.body.id && req.body.userId && req.body.vote) {
            const userId = Number(req.body.userId)
            const id = req.body.id
            const vote = req.body.vote
            let check = false
            let userName

            const poll = await Poll.findOne({ _id: id })
            poll._doc.expires = `${poll.expires.getHours()}:${poll.expires.getMinutes() > 9 ? poll.expires.getMinutes() : `0${poll.expires.getMinutes()}`}, ${poll.expires.getDate() > 9 ? poll.expires.getDate() : `0${poll.expires.getDate()}`}/${poll.expires.getMonth() > 8 ? poll.expires.getMonth() + 1 : `0${poll.expires.getMonth() + 1}`}/${poll.expires.getFullYear()}`
            if (new Date() > poll.expires) {
                return res.status(200).json(createError(200, "Cuộc bình chọn đã hết hạn"))
            }
            const index = poll.option.findIndex(e => e._id.toString() === vote)
            if (index !== -1) {
                let time
                for (let i = 0; i < poll.option.length; i++) {
                    if (poll.option[i].participant.includes(userId)) {
                        poll.option[i].participant.splice(poll.option[i].participant.indexOf(userId), 1)
                        time = i
                    }
                }
                if (time !== index) {
                    poll.option[index].participant.push(userId)
                    check = true
                }
            }
            else {
                return res.status(200).json(createError(200, "Dữ liệu không hợp lệ"))
            }
            const deleteMess = async () => {
                const listMember = []
                const messageInfo = {
                    ConversationID: poll.conversatonId,
                    MessageID: poll.messageId
                }
                let conv = await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/conversations/GetListMemberOfGroup",
                    data: {
                        'conversationId': poll.conversatonId
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })
                for (let i = 0; i < conv.data.data.userList.length; i++) {
                    listMember.push(Number(conv.data.data.userList[i].id))
                }
                await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/message/DeleteMessage",
                    data: {
                        MessageID: poll.messageId,
                        ConversationID: poll.conversatonId
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })
                socket.emit('DeleteMessage', messageInfo, listMember)
            }
            await Promise.all([
                deleteMess(),
                (
                    axios({
                        method: "post",
                        url: "http://43.239.223.142:9000/api/users/GetInfoUser",
                        data: {
                            'ID': userId
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    }).then(e => userName = e.data.data.user_info.userName)
                )])
            if (check) {
                let sendmes1 = await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/message/SendMessage",
                    data: {
                        ConversationID: poll.conversatonId,
                        SenderID: userId,
                        MessageType: "notification",
                        Message: `${userName} đã đổi lựa chọn trong cuộc bình chọn "${poll.title}"`
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })
            }
            let sendmes = await axios({
                method: "post",
                url: "http://43.239.223.142:9000/api/message/SendMessage",
                data: {
                    ConversationID: poll.conversatonId,
                    SenderID: poll.senderId,
                    MessageType: "sendPoll",
                    Message: JSON.stringify(poll)
                },
                headers: { "Content-Type": "multipart/form-data" }
            })
            const updatePoll = await Poll.findOneAndUpdate({ _id: id }, { option: poll.option, messageId: sendmes.data.data.messageId }, { new: true })
            if (updatePoll) {
                updatePoll._doc.expires = `${updatePoll.expires.getHours()}:${updatePoll.expires.getMinutes() > 9 ? updatePoll.expires.getMinutes() : `0${updatePoll.expires.getMinutes()}`}, ${updatePoll.expires.getDate() > 9 ? updatePoll.expires.getDate() : `0${updatePoll.expires.getDate()}`}/${updatePoll.expires.getMonth() > 8 ? updatePoll.expires.getMonth() + 1 : `0${updatePoll.expires.getMonth() + 1}`}/${updatePoll.expires.getFullYear()}`
                res.json({
                    data: {
                        result: true,
                        message: 'Bình chọn thành công',
                        data: updatePoll
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Bình chọn thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log('Tiến VotePoll:\n', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const DeletePoll = async (req, res) => {
    try {
        if (req.body.id) {
            const id = req.body.id

            const poll = await Poll.findOneAndDelete({ _id: id })
            if (poll) {
                let conv = await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/conversations/GetListMemberOfGroup",
                    data: {
                        'conversationId': poll.conversatonId,
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })
                const listMember = []
                for (let i = 0; i < conv.data.data.userList.length; i++) {
                    listMember.push(Number(conv.data.data.userList[i].id))
                }
                const messageInfo = {
                    ConversationID: poll.conversatonId,
                    MessageID: poll.messageId
                }
                await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/message/DeleteMessage",
                    data: {
                        MessageID: poll.messageId,
                        ConversationID: poll.conversatonId
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })

                socket.emit('DeleteMessage', messageInfo, listMember)
                res.json({
                    data: {
                        result: true,
                        message: 'Xóa cuộc thăm dò ý kiến thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Xóa cuộc thăm dò ý kiến thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log('Tiến DeletePoll:\n', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}


const BroadcastZalo = async () => {
    let sendmess = await axios({
        method: "post",
        url: "https://openapi.zalo.me/v2.0/oa/message",
        data: {
            // Thông tin người nhận
            "recipient": {
                "target": {
                    "gender": "0",
                    "cities": "4"
                }
            },
            // Nội dung và các attachment cần gửi
            "message": {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "media",
                        "elements": [
                            {
                                "media_type": "article",
                                "attachment_id": "bd5ea46bb32e5a0033f"
                            }
                        ]
                    }
                }
            },
        },
        headers: {
            "Content-Type": "application/json",
            "access_token": "token"
        }
    });
}