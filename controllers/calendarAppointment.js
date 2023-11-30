import CalendarAppointment from "../models/CalendarAppointment.js";
import User from "../models/User.js";
import { convertSolar2Lunar } from "../functions/fTools/fConvertDate.js"
import { convertLunar2Solar } from "../functions/fTools/fConvertDate.js"
import { createError } from "../utils/error.js";
import { FSendMessage } from '../functions/fApi/message.js';
import qs from 'qs'
import axios from 'axios'
import { urlChat365 } from '../utils/config.js'
import { GetAvatarUser } from "../utils/GetAvatarUser.js"
import { GetAvatarUserSmall } from "../utils/GetAvatarUser.js"
const handleRepeat = (type) => {
    let result = ''
    switch (type) {
        case 'Không lặp lại': {
            result = 'norepeat'
            break
        }
        case 'Hàng ngày': {
            result = 'everyday'
            break
        }
        case 'Hàng tuần': {
            result = 'everyweek'
            break
        }
        case 'Không lặp lại': {
            result = 'norepeat'
            break
        }
        case 'Hàng tháng': {
            result = 'everymonth'
            break
        }
        case 'Hàng năm': {
            result = 'everyyear'
            break
        }
        default: {
            result += type.indexOf('Chủ nhật') != -1 ? '0,' : ''
            result += type.indexOf('Thứ 2') != -1 ? '1,' : ''
            result += type.indexOf('Thứ 3') != -1 ? '2,' : ''
            result += type.indexOf('Thứ 4') != -1 ? '3,' : ''
            result += type.indexOf('Thứ 5') != -1 ? '4,' : ''
            result += type.indexOf('Thứ 6') != -1 ? '5,' : ''
            result += type.indexOf('Thứ 7') != -1 ? '6,' : ''
        }
    }
    return result
}

const formatDate = (date, typeDate) => { // truyền ngày dương
    const dateDay = new Date(date);
    let result
    let minutes = dateDay.getMinutes() > 9 ? dateDay.getMinutes() : `0${dateDay.getMinutes()}`
    let hours = dateDay.getHours() > 9 ? dateDay.getHours() : `0${dateDay.getHours()}`
    switch (dateDay.getDay()) {
        case 0: {
            result = 'Chủ nhât'
            break
        }
        case 1: {
            result = 'Thứ hai'
            break
        }
        case 2: {
            result = 'Thứ ba'
            break
        }
        case 3: {
            result = 'Thứ tư'
            break
        }
        case 4: {
            result = 'Thứ năm'
            break
        }
        case 5: {
            result = 'Thứ sáu'
            break
        }
        case 6: {
            result = 'Thứ bảy'
            break
        }
    }
    if (typeDate == 'solarCalendar') {
        let day = dateDay.getDate() > 9 ? dateDay.getDate() : `0${dateDay.getDate()}`
        let month = dateDay.getMonth() + 1 > 9 ? dateDay.getMonth() + 1 : `0${dateDay.getMonth() + 1}`
        let year = dateDay.getFullYear()
        result = `${result}, ${day} tháng ${month}, ${year}. Lúc ${hours}:${minutes}`
    }
    else {
        const strDate = convertSolar2Lunar(date)[0]
        const leapMonth = convertSolar2Lunar(date)[1]
        const ar = strDate.split('/')
        let day = ar[1].length > 1 ? ar[1] : `0${ar[1]}`
        let month = ar[0].length > 1 ? ar[0] : `${ar[0]}`
        let year = ar[2]
        if (leapMonth == 0) {
            result = `${result}, ${day} tháng ${month}, ${year}. Lúc ${hours}:${minutes} (Âm lịch)`
        }
        else {
            result = `${result}, ${day} tháng ${month}, ${year}. Lúc ${hours}:${minutes} (ngày nhuận)`
        }
    }
    return result
}

const distanceBetweenDay = (date1, date2) => {
    let message
    let date1Day = new Date(date1)
    let date2Day = new Date(date2)
    let diff = date1Day.getTime() - date2Day.getTime()
    let days = Math.floor(diff / (24 * 60 * 60 * 1000))
    let hours = Math.floor((diff - days * 24 * 60 * 60 * 1000) / (60 * 60 * 1000))
    let minutes = Math.floor((diff - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000) / (60 * 1000))
    message = `Khoảng ${days} ngày ${hours} tiếng ${minutes} phút nữa`
    return message
}

export const handleParticipantCalendar = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, handleParticipantCalendar")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body) {
            const userId = req.body.userId; //id người bình chọn
            const calendarId = req.body._id
            const type = req.body.type; //type: tham gia, ko tham gia
            let check = false
            const calendar = await CalendarAppointment.findOne({ _id: calendarId })

            const participant = calendar.participant
            const noParticipant = calendar.noParticipant

            if (!participant.includes(userId) && !noParticipant.includes(userId)) {
                if (type == 'thamgia') {
                    participant.push(userId)
                    check = true
                }
                else {
                    noParticipant.push(userId)
                    check = true
                }
            }
            else if (participant.includes(userId) && !noParticipant.includes(userId)) {
                if (type == 'khongthamgia') {
                    participant.splice(participant.indexOf(userId), 1)
                    noParticipant.push(userId)
                    check = true
                }
            }
            else if (!participant.includes(userId) && noParticipant.includes(userId)) {
                if (type == 'thamgia') {
                    participant.push(userId)
                    noParticipant.splice(noParticipant.indexOf(userId), 1)
                    check = true
                }
            }
            const result = await CalendarAppointment.findOneAndUpdate({ _id: calendarId }, { participant: participant, noParticipant: noParticipant }, { new: true })
            if (result) {
                const user = await User.findOne({ _id: Number(userId) }, { userName: 1 })
                if (check) {
                    FSendMessage({
                        body: {
                            ConversationID: result.conversationId,
                            SenderID: result.senderId,
                            MessageType: "reminderNoti",
                            Message: `${user.userName} ${type === 'khongthamgia' ? 'đã từ chối' : 'đã tham gia'} ${result.title}`
                        }
                    }).catch((e) => {
                        console.log("Err sendmess AddNewMemberToListGroup", e)
                    })
                }
                res.json({
                    data: {
                        result: result,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Chưa nhập dữ liệu"));
        }
    } catch (err) {
        console.log('tien tham gia clendar', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const createCalendar = async (req, res, next) => {
    try {
        if (req && req.body) {
            console.log(req.body.senderId)
            const formData = {}
            const leapMonth = req.body.leapMonth ? req.body.leapMonth : 0
            formData.senderId = Number(req.body.senderId)
            formData.conversationId = Number(req.body.conversationId)
            formData.title = req.body.title
            formData.emotion = req.body.emotion
            formData.type = handleRepeat(req.body.type)
            formData.typeDate = req.body.typeDate
            formData.schedule = req.body.schedule ? Number(req.body.schedule) : 0
            formData.participant = [req.body.senderId]
            if (formData.typeDate == 'solarCalendar') {
                formData.createTime = new Date(req.body.createTime)
            }
            else {
                const date = new Date(req.body.createTime)
                formData.createTime = new Date(`${convertLunar2Solar(req.body.createTime, leapMonth)} ${date.getHours()}:${date.getMinutes()}`)
            }
            formData.timeDoned = new Date(formData.createTime.getTime() - 2 * 60 * 1000)
            const calendar = new CalendarAppointment(formData);
            const saveCalendar = await calendar.save();
            if (saveCalendar) {
                const result = { ...saveCalendar }
                const user = await User.findOne({ _id: formData.senderId }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                result._doc.senderName = user.userName
                result._doc.senderAvatar = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                result._doc.senderAvatar = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt, user.userName, user.avatarUser)
                // if (user.avatarUser === '') {
                //     result._doc.senderAvatar = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                // }
                // else {
                //     result._doc.senderAvatar = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                // }
                result._doc.emotion = `${urlChat365()}ImageReminder/${formData.emotion}.png`
                result._doc.time = formatDate(formData.createTime, formData.typeDate)
                result._doc.interval = distanceBetweenDay(calendar.createTime, Date.now())
                result._doc.createTime = `${JSON.parse(JSON.stringify(new Date(formData.createTime.setHours(formData.createTime.getHours() + 7)))).replace("Z", "")}+07:00`;
                const mess = {
                    data: {
                        result: result._doc,
                        message: 'Success'
                    },
                    error: null
                }
                let sendmes = await axios({
                    method: "post",
                    url: "http://210.245.108.202:9000/api/message/SendMessage",
                    data: {
                        ConversationID: formData.conversationId,
                        SenderID: formData.senderId,
                        MessageType: "sendReminder",
                        Message: JSON.stringify(mess)
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                });
                await CalendarAppointment.findOneAndUpdate({ _id: result._doc._id }, { messageId: sendmes.data.data.messageId })
                res.json({
                    data: {
                        result: result._doc,
                        message: 'Success'
                    },
                    error: null
                })
            }
        }
        else {
            res.status(200).json(createError(200, "Chưa nhập dữ liệu"));
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const editCalendar = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, editCalendar")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body) {
            const id = req.body._id
            const title = req.body.title
            const type = handleRepeat(req.body.type)
            const emotion = req.body.emotion
            const typeDate = req.body.typeDate
            let createTime
            const leapMonth = req.body.leapMonth ? req.body.leapMonth : 0
            if (typeDate == 'solarCalendar') {
                createTime = new Date(req.body.createTime)
            }
            else {
                const date = new Date(req.body.createTime)
                createTime = new Date(`${convertLunar2Solar(req.body.createTime, leapMonth)} ${date.getHours()}:${date.getMinutes()}`)
            }
            const timeDoned = new Date(createTime.getTime() - 2 * 60 * 1000)
            // console.log('id',id)
            const saveCalendar = await CalendarAppointment.findOneAndUpdate({ _id: id }, { title: title, emotion: emotion, type: type, createTime: createTime, timeDoned: timeDoned, typeDate: typeDate }, { new: true })
            if (saveCalendar) {
                const result = { ...saveCalendar }
                const user = await User.findOne({ _id: saveCalendar.senderId }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                result._doc.senderName = user.userName
                result._doc.senderAvatar = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                result._doc.senderAvatar = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt, user.userName, user.avatarUser)
                // if (user.avatarUser === '') {
                //     result._doc.senderAvatar = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                // }
                // else {
                //     result._doc.senderAvatar = `${urlChat365()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                // }
                result._doc.emotion = `${urlChat365()}ImageReminder/${saveCalendar.emotion}.png`
                result._doc.time = formatDate(saveCalendar.createTime, typeDate)
                result._doc.interval = distanceBetweenDay(saveCalendar.createTime, Date.now())
                result._doc.createTime = `${JSON.parse(JSON.stringify(new Date(saveCalendar.createTime.setHours(saveCalendar.createTime.getHours() + 7)))).replace("Z", "")}+07:00`;
                const mess = {
                    data: {
                        result: result._doc,
                        message: 'Success'
                    },
                    error: null
                }
                let editmes = await axios({
                    method: "post",
                    url: "http://210.245.108.202:9000/api/message/EditMessage",
                    data: {
                        'MessageID': result._doc.messageId,
                        'Message': JSON.stringify(mess)
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })
                res.json({
                    data: {
                        result: result._doc,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Thông tin không chính xác"));
            }
        }
        else {
            res.status(200).json(createError(200, "Chưa nhập dữ liệu"));
        }
    } catch (err) {
        console.log("api cua tien editCalendar", err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const deleteCalendar = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status) {
                console.log("Token hop le, deleteCalendar")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params) {
            const _id = req.params._id

            const result = await CalendarAppointment.findOneAndRemove({ _id: _id })
            if (result) {
                let deletemes = await axios({
                    method: "post",
                    url: "http://210.245.108.202:9000/api/message/DeleteMessage",
                    data: {
                        'MessageID': result.messageId,
                        'ConversationID': result.conversationId
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })
                console.log(deletemes)
                res.json({
                    data: {
                        result: result,
                        message: 'Success'
                    },
                    error: null
                })
            }
        } else {
            res.status(200).json(createError(200, "Nhập thiếu dữ liệu"));
        }
    } catch (err) {
        console.log('xoa clendar', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const getDetailCalendar = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status) {
                console.log("Token hop le, getDetailCalendar")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params) {
            const calendarId = req.params._id

            const calendar = await CalendarAppointment.findOne({ _id: calendarId })
            const user = await User.findOne({ _id: Number(calendar.senderId) }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
            if (calendar && user) {
                const result = { ...calendar }
                result._doc.senderName = user.userName
                result._doc.senderaAvatar = user.avatarUser
                result._doc.senderAvatar = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                result._doc.senderAvatar = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt, user.userName, user.avatarUser)
                // if (result._doc.avatarUser !== '') {
                //     result._doc.avatarUser = `${urlChat365()}avatarUser/${result._doc.senderId}/${result._doc.senderaAvatar}`
                // }
                // else {
                //     result._doc.avatarUser = `${urlChat365()}avatarUser/${result._doc.senderName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                // }
                result._doc.time = formatDate(calendar.createTime, calendar.typeDate)
                result._doc.interval = distanceBetweenDay(calendar.createTime, Date.now())
                result._doc.emotion = `${urlChat365()}ImageReminder/${calendar.emotion}.png`
                res.json({
                    data: {
                        result: result._doc,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Dữ liệu truyền lên chưa chính xác"));
            }
        }
        else {
            res.status(200).json(createError(200, "Nhập thiếu dữ liệu"));
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// lấy lịch của người dugf trong 1 nhóm
export const getAllCalendarOfUserOfConversation = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, getAllCalendarOfUserOfConversation")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req) {
            const userId = req.body.userId
            const conversationId = req.body.conversationId

            const calendar = await CalendarAppointment.find({ conversationId: conversationId, participant: { $regex: userId } }).sort({ createTime: 'desc' })
            if (calendar) {
                for (let i = 0; i < calendar.length; i++) {
                    calendar[i].emotion = `${urlChat365()}ImageReminder/${calendar[i].emotion}.png`
                }
                res.json({
                    data: {
                        result: calendar,
                        message: 'Success'
                    },
                    error: null
                })
            } else {
                res.status(200).json(createError(200, "Có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Nhập thiếu dữ liệu"));
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// lấy lịch của người dung
export const getAllCalendarOfUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, getAllCalendarOfUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body) {
            const userId = req.body.userId

            const calendar = await CalendarAppointment.find({ participant: userId }).sort({ createTime: 'desc' })
            if (calendar) {
                for (let i = 0; i < calendar.length; i++) {
                    calendar[i].emotion = `${urlChat365()}ImageReminder/${calendar[i].emotion}.png`
                }
                res.json({
                    data: {
                        result: calendar,
                        message: 'Success'
                    },
                    error: null
                })
            } else {
                res.status(200).json(createError(200, "Có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Nhập thiếu dữ liệu"));
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const getAllCalendarOfConv = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, getAllCalendarOfConv")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.conversationId) {
            const conversationId = Number(req.body.conversationId)

            const calendar = await CalendarAppointment.find({ conversationId: conversationId })

            if (calendar && calendar.length > 0) {
                for (let i = 0; i < calendar.length; i++) {
                    const user = await User.findOne({ _id: calendar[i].senderId }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                    calendar[i]._doc.senderName = user.userName
                    calendar[i]._doc.senderAvatarSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                    calendar[i]._doc.senderAvatar = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt, user.userName, user.avatarUser)
                    // if (user.avatarUser !== '') {
                    //     calendar[i]._doc.senderAvatar = `${urlChat365()}avatarUser/${user._id}/${user.avatarUser}`
                    // }
                    // else {
                    //     calendar[i]._doc.senderAvatar = `${urlChat365()}avatarUser/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    // }
                    calendar[i].emotion = `${urlChat365()}ImageReminder/${calendar[i].emotion}.png`
                    calendar[i]._doc.time = formatDate(calendar[i].createTime, calendar[i].typeDate)
                    calendar[i]._doc.interval = distanceBetweenDay(calendar[i].createTime, Date.now())
                }
                res.json({
                    data: {
                        result: calendar,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Cuộc trò chuyện không có lịch hẹn nào"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const notificationCalendar = () => setInterval(async () => {

    const calendar = await CalendarAppointment.find({ timeDoned: { $lte: Date.now() } })

    for (let i = 0; i < calendar.length; i++) {
        if ((new Date(calendar[i].createTime)) <= (new Date(Date.now()))) {
            // call api gửi thông báo
            FSendMessage({
                body: {
                    ConversationID: calendar[i].conversationId,
                    SenderID: calendar[i].senderId,
                    MessageType: "notification",
                    Message: `Nhắc hẹn: ${calendar[i].title} - ${formatDate(calendar[i].createTime, calendar[i].typeDate)}`
                }
            }).catch((e) => {
                console.log("Err sendmess AddNewMemberToListGroup", e)
            })
            //Handle lặp lại
            let createTime, timeDoned // ngày dương tiếp theo
            if (calendar[i].type === 'norepeat') {
                // gọi api xóa
            }
            else if (calendar[i].type === 'everyday') {
                createTime = new Date(calendar[i].createTime.getTime() + 24 * 60 * 60 * 1000)
                timeDoned = new Date(calendar[i].timeDoned.getTime() + 24 * 60 * 60 * 1000)
            }
            else if (calendar[i].type === 'everyweek') {
                createTime = new Date(calendar[i].createTime.getTime() + 7 * 24 * 60 * 60 * 1000)
                timeDoned = new Date(calendar[i].timeDoned.getTime() + 7 * 24 * 60 * 60 * 1000)
            }
            else if (calendar[i].type === 'everymonth') {
                if (calendar[i].typeDate === 'solarCalendar') {
                    let createTimeCurrent = new Date(calendar[i].createTime)
                    let createTimeNext
                    let j = 1
                    do {
                        createTimeNext = new Date((new Date(calendar[i].createTime)).setMonth((new Date(calendar[i].createTime)).getMonth() + j))
                        j = j + 1
                    }
                    while (createTimeCurrent.getDate() !== createTimeNext.getDate())

                    createTime = createTimeNext
                    timeDoned = new Date(createTimeNext.getTime() - 2 * 60 * 1000)
                }
                else {
                    // convert sang lịch âm
                    //nếu khoảng cách chênh lệch 2 ngày dương > 31 ngày, tháng trước không phải tháng nhuận thì tháng âm đó nhuận
                    let createTimeCurrent = `${convertSolar2Lunar(calendar[i].createTime, 0)[0]} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}` //ngày âm dạng string
                    let leapMonth = convertSolar2Lunar(calendar[i].createTime, 0)[1]
                    let createTimeNext = createTimeCurrent
                    if (leapMonth == 1) {
                        do {
                            let sCreatTimeNext = createTimeNext.slice(0, createTimeNext.search(' '))
                            let ar = sCreatTimeNext.split('/')
                            if (Number(ar[0]) + 1 <= 12) {
                                ar[0] = Number(ar[0]) + 1
                            }
                            else {
                                ar[0] = 1
                                ar[2] = Number(ar[2]) + 1
                            }
                            createTimeNext = `${ar.join('/')} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`
                        }
                        //kiểm tra xem ngày đó tồn tại không
                        while (convertSolar2Lunar(convertLunar2Solar(createTimeNext, 0))[0] != createTimeNext.slice(0, createTimeNext.search(' ')))
                        createTime = new Date(`${convertLunar2Solar(createTimeNext, 0)} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`)
                        timeDoned = new Date(createTime.getTime() - 2 * 60 * 1000)
                    }
                    else {
                        if (convertSolar2Lunar(convertLunar2Solar(createTimeNext, 1))[0] == createTimeCurrent.slice(0, createTimeCurrent.search(' '))
                            && convertLunar2Solar(createTimeNext, 0) != convertLunar2Solar(createTimeNext, 1)) {
                            createTime = new Date(`${convertLunar2Solar(createTimeNext, 1)} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`)
                            timeDoned = new Date(createTime.getTime() - 2 * 60 * 1000)
                        }
                        else {
                            do {
                                let sCreatTimeNext = createTimeNext.slice(0, createTimeNext.search(' '))
                                let ar = sCreatTimeNext.split('/')
                                if (Number(ar[0]) + 1 <= 12) {
                                    ar[0] = Number(ar[0]) + 1
                                }
                                else {
                                    ar[0] = 1
                                    ar[2] = Number(ar[2]) + 1
                                }
                                createTimeNext = `${ar.join('/')} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`
                            }
                            while (convertSolar2Lunar(convertLunar2Solar(createTimeNext, 0))[0] != createTimeNext.slice(0, createTimeNext.search(' ')) &&
                                convertSolar2Lunar(convertLunar2Solar(createTimeNext, 1))[0] != createTimeNext.slice(0, createTimeNext.search(' ')))
                            if (convertSolar2Lunar(convertLunar2Solar(createTimeNext, 0))[0] == createTimeNext.slice(0, createTimeNext.search(' '))) {
                                createTime = new Date(`${convertLunar2Solar(createTimeNext, 0)} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`)
                                timeDoned = new Date(createTime.getTime() - 2 * 60 * 1000)
                            }
                            else {
                                createTime = new Date(`${convertLunar2Solar(createTimeNext, 1)} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`)
                                timeDoned = new Date(createTime.getTime() - 2 * 60 * 1000)
                            }
                        }
                    }
                }
            }
            else if (calendar[i].type === 'everyyear') {
                if (calendar[i].typeDate === 'solarCalendar') {
                    let createTimeCurrent = new Date(calendar[i].createTime)
                    let createTimeNext
                    let j = 1
                    do {
                        createTimeNext = new Date((new Date(calendar[i].createTime)).setFullYear((new Date(calendar[i].createTime)).getFullYear() + j))
                        j = j + 1
                    }
                    while (createTimeCurrent.getDate() !== createTimeNext.getDate())

                    createTime = createTimeNext
                    timeDoned = new Date(createTimeNext.getTime() - 2 * 60 * 1000)
                }
                else {
                    let createTimeCurrent = `${convertSolar2Lunar(calendar[i].createTime, 0)[0]} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}` //ngày âm dạng string
                    let leapMonth = convertSolar2Lunar(calendar[i].createTime, 0)[1]
                    let createTimeNext = createTimeCurrent
                    do {
                        let sCreatTimeNext = createTimeNext.slice(0, createTimeNext.search(' '))
                        let ar = sCreatTimeNext.split('/')
                        ar[2] = Number(ar[2]) + 1
                        createTimeNext = `${ar.join('/')} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`
                    }
                    while (convertSolar2Lunar(convertLunar2Solar(createTimeNext, 0))[0] != createTimeNext.slice(0, createTimeNext.search(' ')) &&
                        convertSolar2Lunar(convertLunar2Solar(createTimeNext, 1))[0] != createTimeNext.slice(0, createTimeNext.search(' ')))

                    if (convertSolar2Lunar(convertLunar2Solar(createTimeNext, 0))[0] == createTimeNext.slice(0, createTimeNext.search(' '))) {
                        createTime = new Date(`${convertLunar2Solar(createTimeNext, 0)} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`)
                        timeDoned = new Date(createTime.getTime() - 2 * 60 * 1000)
                    }
                    else {
                        createTime = new Date(`${convertLunar2Solar(createTimeNext, 1)} ${calendar[i].createTime.getHours()}:${calendar[i].createTime.getMinutes()}`)
                        timeDoned = new Date(createTime.getTime() - 2 * 60 * 1000)
                    }
                }
            }
            else {
                let nextDay, distanceDay
                const ar = calendar[i].type.split(',')
                ar.pop()
                // tìm thứ tiếp theo
                for (let j = 0; j < ar.length; j++) {
                    if (ar[j] == calendar[i].createTime.getDay() && j != ar.length - 1) {
                        nextDay = Number(ar[j + 1])
                    }
                    else if (ar[j] == calendar[i].createTime.getDay() && j == ar.length - 1) {
                        nextDay = Number(ar[0])
                    }
                }
                distanceDay = (Number(nextDay) + 7 - Number(calendar[i].createTime.getDay())) % 7
                createTime = new Date((new Date(calendar[i].createTime)).setDate(calendar[i].createTime.getDate() + distanceDay))
                timeDoned = new Date((new Date(calendar[i].timeDoned)).setDate(calendar[i].timeDoned.getDate() + distanceDay))
            }

            // // Update lại
            if (createTime === undefined && timeDoned === undefined) {
                const result = await CalendarAppointment.findOneAndDelete({ _id: calendar[i]._id })
            }
            else {
                const result = await CalendarAppointment.findOneAndUpdate({ _id: calendar[i]._id }, { createTime: createTime, timeDoned: timeDoned }, { new: true })
            }
        }
    }
}, 60 * 1000)

