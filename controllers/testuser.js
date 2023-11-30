import geoip from 'geoip-lite';
import axios from 'axios'
import Registry from 'winreg';
import { createError } from "../utils/error.js";
import { checkToken } from "../utils/checkToken.js";
import { urlImgHost } from '../utils/config.js'
import { onlyUnique } from '../services/user.service.js'
import CalendarAppointment from "../models/CalendarAppointment.js";
import Personal from "../models/Personal.js";
import Diary from "../models/Diary.js";
import Privacy from '../models/Privacy.js';
import Notification from "../models/Notification.js";

import User from "../models/User.js";
import UserBackup from "../models/UserBackup.js";
import Verify from "../models/Verify.js";
import Conversation from "../models/Conversation.js";
import * as nodemailer from 'nodemailer'
import Contact from "../models/Contact.js";
import RequestContact from "../models/RequestContact.js";
import UsersClassified from "../models/UsersClassified.js";
import HistorySendOTP from "../models/HistorySendOTP.js";
import HistorySendOTPCode from "../models/HistorySendOTPCode.js";
import DataFirebaseOTP from "../models/DataFirebaseOTP.js";
import PermissonChangePass from "../models/PermissonChangePass.js";
import { ConvertToArrayNumber } from '../functions/fTools/handleInput.js'
import io from "socket.io-client"
import qs from "qs"
import fs from 'fs'
import request from 'request'
const socket = io.connect('http://43.239.223.142:3000', {
    secure: true,
    enabledTransports: ["wss"],
    transports: ['websocket', 'polling'],
});
import date from "date-and-time"
import md5 from 'md5';
import Birthday from "../models/Birthday.js"
import { InsertNewUser } from "../functions/handleModels/InsertNewUser.js";
import { InsertNewUserService } from "../services/user.service.js";
import { GetAvatarUser } from "../utils/GetAvatarUser.js"
import { GetAvatarUserSmall } from "../utils/GetAvatarUser.js"

socket.emit('Login', 319186, 'chat365')
socket.on('SendMessage', (mess) => {
    console.log(mess.ConversationID, mess.SenderID, mess.Message)
})

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

const ConvertToArrayString = (string) => {
    try {
        let StringArray = String(string).replace("[", "").replace("]", "");
        let array = StringArray.split(",");
        let arrayFinal = [];
        for (let i = 0; i < array.length; i++) {
            arrayFinal.push(String(array[i]))
        }
        return arrayFinal;
    }
    catch (e) {
        console.log(e)
        return [];
    }
}

export const findarround = async (req, res, next) => {
    try {
        if (req.params && req.params.userId && Number(req.params.userId)) {
            if (req.params.token) {
                let check = await checkToken(req.params.token);
                if (check && check.status && (check.userId == req.params.userId)) {
                    console.log("Token hop le, FindUserApp")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            let userId = Number(req.params.userId);
            let user = await User.findOne({ _id: Number(req.params.userId) }, { latitude: 1, longtitude: 1 }).lean();
            if (user) {

                // danh sách bạn bè 
                let listFriend = await Contact.find({
                    $or: [
                        { userFist: userId },
                        { userSecond: userId }
                    ]
                }).limit(100);
                let arrayUserIdFriend = [];
                if (listFriend) {
                    for (let i = 0; i < listFriend.length; i++) {
                        arrayUserIdFriend.push(listFriend[i].userFist);
                        arrayUserIdFriend.push(listFriend[i].userSecond)
                    }
                }
                arrayUserIdFriend = arrayUserIdFriend.filter(e => e != userId);
                if ((Number(user.latitude) > 0) && (Number(user.longtitude) > 0)) {
                    let users_finded = await User.find(
                        {
                            _id: { $ne: Number(req.params.userId) },
                            latitude: { $gt: Number(user.latitude) - 0.05, $lt: Number(user.latitude) + 0.05 },
                            longtitude: { $gt: Number(user.longtitude) - 0.05, $lt: Number(user.longtitude) + 0.05 }
                        },
                        {_id: 1, userName: 1, avatarUser: 1, type: 1, fromWeb: 1, createdAt: 1, latitude: 1, longtitude: 1 }
                    ).lean();
                    if (users_finded) {
                        let listUser = [];
                        for (let i = 0; i < users_finded.length; i++) {
                            let a = {};
                            a._id = users_finded[i]._id;
                            a.userName = users_finded[i].userName;
                            a.avatarUser = `${urlImgHost()}avatarUser/${users_finded[i]._id}/${users_finded[i].avatarUser}`;
                            a.latitude = users_finded[i].latitude;
                            a.longitude = users_finded[i].longtitude;
                            a.distance = getDistanceFromLatLonInKm(user.latitude, user.longtitude, users_finded[i].latitude, users_finded[i].longtitude);
                            a.friend = arrayUserIdFriend.includes(users_finded[i]._id);
                            listUser.push(a);
                        }
                        res.status(200).json({
                            data: {
                                result: true,
                                message: "Lấy thông tin thành công",
                                users_finded: listUser,
                                count_user: users_finded.length
                            },
                            error: null
                        });
                    }
                    else {
                        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
                    }
                }
                else {
                    res.status(200).json({
                        data: {
                            result: true,
                            message: "Lấy thông tin thành công",
                            users_finded: []
                        },
                        error: null
                    });
                }
            }
            else {
                res.status(200).json(createError(200, "Không tìm thấy tài khoản của bạn"));
            }
        }
        else {
            console.log(err);
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
export const updatelocation = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.userId && Number(req.body.userId) && Number(req.body.latitude) && Number(req.body.longtitude)) {
            let user = await User.findOne({ _id: Number(req.body.userId) }).lean();
            if (user) {
                // let update= await User.updateOne({_id:Number(req.body.userId))
                let update = await User.updateOne({ _id: Number(req.body.userId) }, { $set: { longtitude: Number(req.body.longtitude), latitude: Number(req.body.latitude) } });
                if (update) {
                    let user2 = await User.findOne({ _id: Number(req.body.userId) }).lean();
                    if (user2) {
                        res.status(200).json({
                            data: {
                                result: true,
                                message: "Update successfully",
                                user: {
                                    _id: user2._id,
                                    latitude: user2.latitude,
                                    longtitude: user2.longtitude
                                }
                            },
                            error: null
                        });
                    }
                }
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const TakeListFriend = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.token)) {
                console.log("Token hop le")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let userId = Number(req.body.ID)
        let result1 = await Contact.find({
            $or: [
                { userFist: userId },
                { userSecond: userId }
            ]
        }).limit(200).lean();
        let arrayUserId = [];
        if (result1) {
            for (let i = 0; i < result1.length; i++) {
                arrayUserId.push(result1[i].userFist);
                arrayUserId.push(result1[i].userSecond)
            }
        }
        arrayUserId = arrayUserId.filter(e => e != userId);
        arrayUserId.push(userId);
        let listAccount = await User.find({ _id: { $in: arrayUserId } }, { userName: 1, avatarUser: 1, lastActive: '$lastActivedAt', isOnline: 1, companyId: { $ifNull: ['inForPerson.employee.com_id', '$idQLC'] } }).sort({ isOnline: 1, lastActive: -1 }).limit(100).lean();
        if (result1) {
            if (listAccount) {
                let result = [];
                for (let i = 0; i < listAccount.length; i++) {
                    let a = {};
                    a.id = listAccount[i]._id;
                    a._id = listAccount[i]._id;
                    a.userName = listAccount[i].userName;
                    a.avatarUser = `${urlImgHost()}avatarUser/${listAccount[i]._id}/${listAccount[i].avatarUser}`;
                    a.lastActive = listAccount[i].lastActive;
                    a.isOnline = listAccount[i].isOnline;
                    a.companyId = listAccount[i].companyId;
                    result.push(a);
                }
                let listLastestUser = [];
                let time = new Date();
                time.setDate(time.getDate() - 1);

                for (let i = 0; i < result.length; i++) {
                    if ((result[i].isOnline == 0) && (new Date(result[i].lastActive) > time)) {
                        listLastestUser.push(result[i]);
                    }
                }
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Lấy thông tin thành công",
                        listFriend: result,
                        listLastestUser,
                        count: listAccount.length
                    },
                    error: null
                });
            }
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const TakeListFriend365 = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && (check.userId == req.params.userId)) {
                console.log("Token hop le,TakeListFriend365 ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.params && req.params.userId && (!isNaN(req.params.userId))) {
            let userId = Number(req.params.userId);
            let type365 = Number(req.params.type365);
            let condition = { idQLC: userId, type: type365 };
            if ((type365 == 0) || (type365 == 2)) {
                condition = {
                    $or: [
                        {
                            idQLC: userId,
                            type: 0
                        },
                        {
                            idQLC: userId,
                            type: 2
                        },
                    ]
                }
            }
            let dataUser = await User.find(condition, { _id: 1, companyId: { $ifNull: ['inForPerson.employee.com_id', '$idQLC'] } }).limit(1).lean();
            if (dataUser) {
                if (dataUser.length) {
                    let result1 = await Contact.find({
                        $or: [
                            { userFist: dataUser[0]._id },
                            { userSecond: dataUser[0]._id }
                        ]
                    }).limit(300).lean()
                    let arrayUserId = [];
                    if (result1) {
                        for (let i = 0; i < result1.length; i++) {
                            arrayUserId.push(result1[i].userFist);
                            arrayUserId.push(result1[i].userSecond)
                        }
                    }
                    arrayUserId = arrayUserId.filter(e => Number(e) !== Number(dataUser[0]._id));
                    // list friend 
                    let listAccount = await User.find({ _id: { $in: arrayUserId } }, { type365: '$type', userName: 1, avatarUser: 1, lastActive: '$lastActivedAt', isOnline: 1, companyId: { $ifNull: ['inForPerson.employee.com_id', '$idQLC'] }, id365: '$idQLC', secretCode: '$chat365_secret' }).sort({ isOnline: 1, lastActivedAt: -1 }).limit(300).lean();

                    // list user not friend but in company 
                    let listAccount2 = [];
                    if (dataUser[0].companyId != 0) {
                        listAccount2 = await User.find({ _id: { $nin: arrayUserId }, 'inForPerson.employee.com_id': dataUser[0].companyId }, { type365: '$type', userName: 1, avatarUser: 1, lastActive: '$lastActivedAt', isOnline: 1, companyId: { $ifNull: ['inForPerson.employee.com_id', '$idQLC'] }, id365: '$idQLC' }).sort({ isOnline: 1, lastActivedAt: -1 }).limit(300).lean();
                    }
                    for (let i = 0; i < listAccount2.length; i++) {
                        listAccount.push(listAccount2[i]);
                    }

                    if (result1 && listAccount) {
                        let result = [];
                        for (let i = 0; i < listAccount.length; i++) {
                            let a = {};
                            a.id = listAccount[i]._id;
                            a.id365 = listAccount[i].id365;
                            a.userName = listAccount[i].userName;
                            if (listAccount[i].avatarUser.trim() != "") {
                                a.avatarUser = `${urlBase365()}avatarUser/${listAccount[i]._id}/${listAccount[i].avatarUser}`;
                            }
                            else {
                                a.avatarUser = `${urlBase365()}avatar/${listAccount[i].userName[0]}_${getRandomInt(1, 4)}.png`
                            }
                            a.lastActive = listAccount[i].lastActive;
                            a.isOnline = listAccount[i].isOnline;
                            a.companyId = listAccount[i].companyId;
                            a.type365 = listAccount[i].type365;
                            a.secretCode = listAccount[i].secretCode;
                            result.push(a);
                        };

                        // user have conversation 
                        let listConversation = await Conversation.aggregate([
                            {
                                $match: {
                                    "memberList.memberId": dataUser[0]._id,
                                    isGroup: 0,
                                    'memberList.1': { $exists: true },
                                    'messageList.0': { $exists: true }
                                }
                            },
                            {
                                $project: {
                                    count: { $size: "$messageList" },
                                    timeLastMessage: 1,
                                    "memberList.memberId": 1,
                                }
                            },
                            { $limit: 100 },
                            { $sort: { count: -1 } }
                        ]);
                        // console.log("listConversation",listConversation);
                        let arrayUserIdAdvantage = [];
                        if (listConversation && listConversation.length) {
                            for (let j = 0; j < listConversation.length; j++) {
                                if (listConversation[j].memberList && listConversation[j].memberList.find((e) => Number(e.memberId) !== Number(dataUser[0]._id))) {
                                    arrayUserIdAdvantage.push(Number(listConversation[j].memberList.find((e) => Number(e.memberId) !== Number(dataUser[0]._id)).memberId))
                                }
                            };
                        };
                        // console.log("arrayUserIdAdvantage",arrayUserIdAdvantage);
                        let FinalRes = [];
                        if (arrayUserIdAdvantage.length) {
                            for (let i = 0; i < arrayUserIdAdvantage.length; i++) {
                                if (result.find((e) => e.id == arrayUserIdAdvantage[i])) {
                                    FinalRes.push(result.find((e) => e.id == arrayUserIdAdvantage[i]));
                                }
                            };
                            for (let i = 0; i < result.length; i++) {
                                if (!FinalRes.find((e) => e.id == result[i].id)) {
                                    FinalRes.push(result[i]);
                                }
                            }
                        }
                        else {
                            FinalRes = result;
                        }

                        res.status(200).json({
                            data: {
                                result: true,
                                message: "Lấy thông tin thành công",
                                listAccount: FinalRes,
                                listFriend: listAccount.filter((e) => arrayUserId.includes(e._id)),
                                count: FinalRes.length,
                                listConversation
                            },
                            error: null
                        });
                    }
                }
                else {
                    res.status(200).json(createError(200, "not find account"));
                }
            }
        }
        else {
            return res.status(200).json(createError(200, "Infor is not valid"));
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// danh sách bạn mới => Lấy 5 người bạn mới nhất 20 them limit 
export const takeListNewFriend = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && (check.userId == req.params.userId)) {
                console.log("Token hop le,takeListNewFriend ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let userId = Number(req.params.userId)
        let result1 = await Contact.find({
            $or: [
                { userFist: userId },
                { userSecond: userId }
            ]
        }).sort({ _id: -1 }).limit(20).lean();

        let arrayUserId = [];
        if (result1) {
            for (let i = 0; i < result1.length; i++) {
                arrayUserId.push(result1[i].userFist);
                arrayUserId.push(result1[i].userSecond)
            }
        }

        arrayUserId = arrayUserId.filter(e => e != userId);

        let listAccount = await User.find({ _id: { $in: arrayUserId } }, { userName: 1, avatarUser: 1, lastActive: '$lastActivedAt', isOnline: 1, companyId: { $ifNull: ['inForPerson.employee.com_id', '$idQLC'] } }).limit(100).lean();

        if (result1) {
            if (listAccount) {
                let result = [];
                for (let i = 0; i < listAccount.length; i++) {
                    let a = {};
                    a._id = listAccount[i]._id;
                    a.userName = listAccount[i].userName;
                    if (listAccount[i].avatarUser.trim() != "") {
                        a.avatarUser = `${urlBase365()}avatarUser/${listAccount[i]._id}/${listAccount[i].avatarUser}`;
                    }
                    else {
                        a.avatarUser = `${urlBase365()}avatar/${listAccount[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    a.lastActive = listAccount[i].lastActive;
                    a.isOnline = listAccount[i].isOnline;
                    a.companyId = listAccount[i].companyId;
                    result.push(a);
                }
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Lấy thông tin thành công",
                        listAccount: result
                    },
                    error: null
                });
            }
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// danh sách bạn mới truy cập  client handle 
export const takeListNewActiveFriend = async (req, res, next) => {
    try {

    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// send location 
export const SendLocation = async (req, res, next) => {
    try {
        let ipAddress = req.socket.remoteAddress;
        let ipLocal = req.socket.localAddress;

        let geo = geoip.lookup(ipAddress); // take location 

        if (geo && geo.ll && (geo.ll.length > 1)) {
            let sendmes = await axios({
                method: "post",
                url: "http://43.239.223.142:3005/Message/SendMessage",
                data: {
                    MessageID: '',
                    ConversationID: Number(req.body.conversationId),
                    SenderID: Number(req.body.senderId),
                    MessageType: "map",
                    Message: `${geo.ll[0]},${geo.ll[1]}`,
                    Emotion: 1,
                    Quote: "",
                    Profile: "",
                    ListTag: "",
                    File: "",
                    ListMember: "",
                    IsOnline: [],
                    IsGroup: 0,
                    ConversationName: '',
                    DeleteTime: 0,
                    DeleteType: 0,
                },
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (sendmes) {
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Successfully sending",
                    },
                    error: null
                });
            }
            else {
                res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Cannot take your location"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetTimeOnlineForUserId = async (req, res, next) => {
    try {
        // console.log(req.body);
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le,GetTimeOnlineForUserId ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body && req.body.arrayUser) {
            let info = ConvertToArrayNumber(req.body.arrayUser)
            let result = [];
            let listUser = await User.find({ _id: { $in: info } }, { lastActive: 1 }).lean();
            if (listUser) {
                if (listUser.length > 0) {
                    for (let i = 0; i < listUser.length; i++) {
                        let a = {};
                        a.id = listUser[i]._id;
                        let time = ((new Date() - listUser[i].lastActive) / 1000) / 60;
                        if (time <= 1) {
                            a.status = "Vừa truy cập"
                        }
                        else if ((time > 1) && (time < 60)) {
                            a.status = `Hoạt động ${String(time).split(".")[0]} phút trước`
                        }
                        else if ((time >= 60) && (time < (60 * 24))) {
                            time = time / 60;
                            a.status = `Hoạt động ${String(time).split(".")[0]} giờ trước`
                        }
                        else if ((time >= 60 * 24)) {
                            time = (time / 60) / 24;
                            a.status = `Hoạt động ${String(time).split(".")[0]} ngày trước`;
                            if (time > 7) {
                                a.status = `Không hoạt động`;
                            }
                        };
                        if (listUser[i].isOnline) {
                            a.status = `Hoạt động 1 giây trước`
                        }
                        a.time = listUser[i].lastActive;
                        result.push(a);
                    };
                    for (let i = 0; i < info.length; i++) {
                        if (!result.find((e) => e.id == info[i])) {
                            let date = new Date();
                            date.setDate(date.getDate() + 7);
                            result.push({
                                id: info[i],
                                status: `Hoạt động 1 giây trước`,
                                time: date
                            })
                        }
                    }
                    return res.status(200).json({
                        data: {
                            result,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
                else {
                    return res.status(200).json({
                        data: {
                            result: [],
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
            }
        }
        // nếu truyền thông tin lên không đầy đủ thì sao 
        else {
            res.status(200).json(createError(200, "Truyền thông tin không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetTimeOnlineForUserIdTest = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le,GetTimeOnlineForUserIdTest ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body && req.body.arrayUser) {
            let info = []
            if (!req.body.arrayUser.includes("[")) {
                info = req.body.arrayUser;
            }
            else {
                let string = String(req.body.arrayUser).replace("[", "");
                string = String(string).replace("]", "");
                info = string.split(",");

            }
            let result = [];
            User.find({ _id: { $in: info } }, { isOnline: 1, lastActive: 1 }).then((listUser) => {
                if (listUser.length > 0) {
                    for (let i = 0; i < listUser.length; i++) {
                        let a = {};
                        a.id = listUser[i]._id;
                        if (listUser[i].isOnline) {
                            a.status = "Đang hoạt động"
                        }
                        else {
                            let time = ((new Date() - listUser[i].lastActive) / 1000) / 60;

                            if (time <= 1) {
                                a.status = "Vừa truy cập"
                            }
                            else if ((time > 1) && (time < 60)) {
                                a.status = `Hoạt động ${String(time).split(".")[0]} phút trước`
                            }
                            else if ((time >= 60) && (time < (60 * 24))) {
                                time = time / 60;
                                a.status = `Hoạt động ${String(time).split(".")[0]} giờ trước`
                            }
                            else if ((time >= 60 * 24)) {
                                time = (time / 60) / 24;
                                a.status = `Hoạt động ${String(time).split(".")[0]} ngày trước`;
                                if (time > 7) {
                                    a.status = `Không hoạt động`;
                                }
                            }

                        }
                        result.push(a);
                    }
                    return res.status(200).json({
                        data: {
                            result,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
                else {
                    return res.status(200).json({
                        data: {
                            result: [],
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
            });

        }
        // nếu truyền thông tin lên không đầy đủ thì sao 
        else {
            res.status(200).json(createError(200, "Truyền thông tin không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetHistoryAccessByUserId = async (req, res, next) => {
    // console.log(req.params)
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && (check.userId == req.params.id)) {
                console.log("Token hop le,GetHistoryAccessByUserId ")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.params && req.params.id && Number(req.params.id)) {
            let user = await User.find({ _id: Number(req.params.id) }, { HistoryAccess: 1 }).lean();
            let accessed = [];
            let latestDevice = {};
            if (user.length > 0) {
                //maxTimeDevice = user[0].HistoryAccess[0];
                for (let i = 0; i < user[0].HistoryAccess.length; i++) {
                    if (user[0].HistoryAccess[i].AccessPermision) {
                        accessed.push(user[0].HistoryAccess[i])
                    }
                }
                latestDevice = accessed[0];
                for (let j = 0; j < accessed.length; j++) {
                    if ((new Date(accessed[j].Time)) > (new Date(latestDevice.Time))) {
                        latestDevice = accessed[j];
                    }
                }
            }
            if (user) {
                if (user.length > 0) {
                    let result = [];
                    for (let i = 0; i < user[0].HistoryAccess.length; i++) {
                        let a = {};
                        let geo = geoip.lookup(user[0].HistoryAccess[i].IpAddress);
                        a.IdDevice = user[0].HistoryAccess[i].IdDevice;
                        a.IpAddress = user[0].HistoryAccess[i].IpAddress;
                        a.NameDevice = user[0].HistoryAccess[i].NameDevice;
                        a.Time = user[0].HistoryAccess[i].Time;
                        a.AccessPermision = user[0].HistoryAccess[i].AccessPermision;
                        a.method = "Password"
                        result.push(a)
                    }
                    let b = result.filter(ele => ele.IdDevice == latestDevice.IdDevice)
                    res.status(200).json({
                        data: {
                            result: true,
                            message: "Lấy thông tin thành công",
                            HistoryAccess: result,
                            latestDevice: b[0]
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json(createError(200, "Id không chính xác"))
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
function removeVietnameseTones(str) {
    if (str && (str.trim()) && (str.trim() != "")) {
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        // Some system encode vietnamese combining accent as individual utf-8 characters
        // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
        // Remove extra spaces
        // Bỏ các khoảng trắng liền nhau
        str = str.replace(/ + /g, " ");
        str = str.trim();

        str = str.replace(/!|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\:|{|}|\||\\/g, " ");
        return str;
    }
    else {
        return ""
    }
}

export const FindUser = async (req, res, next) => {
    try {
        // console.log(req.body);
        if (req.body && req.body.senderId && Number(req.body.senderId)) {
            let userId = Number(req.body.senderId);
            let findword;
            let findwordNoVN;
            if (!req.body.message) {
                findword = "";
                findwordNoVN = ""
            }
            else {
                findword = String(req.body.message);
                findwordNoVN = removeVietnameseTones(String(req.body.message));
            }
            if (req.body.companyId) {
                companyId = Number(req.body.companyId)
            }
            else {
                companyId = 0;
            }
            let conversations = await Conversation.find(
                {
                    "memberList.memberId": userId,
                    isGroup: 0
                },
                {
                    timeLastMessage: 1,
                    "memberList.memberId": 1,
                    "memberList.conversationName": 1
                }
            ).sort({ timeLastMessage: -1 }).limit(5);

            // Group 
            let conversationGroup = [];
            let conversationGroupStart = await Conversation.aggregate([
                {
                    $match:
                    {
                        "memberList.memberId": userId,
                        isGroup: 1
                    },
                },
                { $sort: { timeLastMessage: -1 } },
                { $limit: 100 },  // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất 
                {
                    $project: {
                        "countMessage": {
                            "$size": {
                                $filter: {
                                    input: "$messageList",
                                    as: "messagelist",
                                    cond: {
                                        $lte: ["$$messagelist.createAt", new Date()]
                                    },
                                }
                            }
                        },
                        messageList: {
                            $slice: [  // để giới hạn kết quả trả về 
                                {
                                    $filter: {
                                        input: "$messageList",
                                        as: "messagelist",
                                        cond: {
                                            $lte: ["$$messagelist.createAt", new Date()]  // nhỏ hơn hiện tại và là tin nhắn cuối 
                                        },
                                    }
                                },
                                -1
                            ]
                        },
                        memberList: 1,
                        isGroup: 1,
                        typeGroup: 1,
                        avatarConversation: 1,
                        adminId: 1,
                        shareGroupFromLinkOption: 1,
                        browseMemberOption: 1,
                        pinMessage: 1,
                        timeLastMessage: 1
                    }
                }
            ]);

            for (let i = 0; i < conversationGroupStart.length; i++) {
                let a = {};
                let ele = conversationGroupStart[i].memberList.find(e => Number(e.memberId) == userId);
                if (ele && (Number(ele.memberId) == userId) && (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(findword).toLowerCase()))) {
                    a.conversationId = conversationGroupStart[i]._id;
                    a.companyId = 0;
                    a.conversationName = ele.conversationName;
                    a.unReader = ele.unReader; // lay tu account 
                    a.isGroup = conversationGroupStart[i].isGroup;
                    a.senderId = conversationGroupStart[i].messageList[0].senderId;
                    a.pinMessageId = conversationGroupStart[i].pinMessage;
                    a.messageId = conversationGroupStart[i].messageList[0].messageId;
                    a.message = conversationGroupStart[i].messageList[0].message;
                    a.messageType = conversationGroupStart[i].messageList[0].messageType;
                    a.createAt = conversationGroupStart[i].messageList[0].createAt;
                    a.countMessage = conversationGroupStart[i].countMessage; //total
                    a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage;
                    a.typeGroup = conversationGroupStart[i].typeGroup;
                    a.adminId = conversationGroupStart[i].adminId;
                    a.shareGroupFromLink = conversationGroupStart[i].shareGroupFromLinkOption;
                    a.memberList = null;
                    a.browseMember = conversationGroupStart[i].browseMemberOption;
                    a.isFavorite = ele.isFavorite;
                    a.notification = ele.notification;
                    a.isHidden = ele.isHidden;
                    a.deleteTime = ele.deleteTime;
                    a.deleteType = ele.deleteType;
                    a.listMess = 0;
                    if (String(conversationGroupStart[i].avatarConversation) !== "") {
                        a.linkAvatar = `${urlImgHost()}avatar/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
                    }
                    else {
                        let t = getRandomInt(1, 4);
                        a.linkAvatar = `${urlImgHost()}avatar/${ele.conversationName[0]}_${t}.png`
                    }
                    a.avatarConversation = a.linkAvatar;
                    a.listBrowerMember = conversationGroupStart[i].browseMemberList;
                    a.listMember = conversationGroupStart[i].memberList;
                    a.listMessage = null
                    conversationGroup.push(a)
                }
            }

            // listUserId in conversation
            let listUserFirstCompany = [];
            let listUserFirstNomal = []
            let listUserId = [];
            if (conversations) {
                if (conversations.length > 0) {
                    for (let i = 0; i < conversations.length; i++) {
                        if (conversations[i].memberList.length > 1) {
                            if (Number(conversations[i].memberList[0].memberId) != userId) {
                                listUserId.push(conversations[i].memberList[0].memberId)
                            };
                            if (Number(conversations[i].memberList[1].memberId) != userId) {
                                listUserId.push(conversations[i].memberList[1].memberId)
                            }
                        }
                    }
                    let listUserDetail = await User.find(
                        {
                            _id: { $in: listUserId },
                            userNameNoVn: new RegExp(findwordNoVN, 'i')
                        }
                    ).lean();
                    for (let j = 0; j < listUserId.length; j++) {
                        let ele = listUserDetail.find(e => e._id == listUserId[j]);
                        if (ele) {
                            if (Number(ele.companyId) == Number(companyId)) {
                                listUserFirstCompany.push(ele)
                            }
                            else {
                                listUserFirstNomal.push(ele)
                            }
                        }
                    }
                }
                else {
                    listUserFirstCompany = [];
                    listUserFirstNomal = []
                }

                // secondCompany
                let limitUserCompany = 5 - listUserFirstCompany.length;
                // loai bo chinh minh 
                listUserId.push(userId);
                let listUserSecondCompany = await User.find({ _id: { $nin: listUserId }, userNameNoVn: new RegExp(findwordNoVN, 'i'), companyId: companyId }).limit(limitUserCompany).lean();
                for (let i = 0; i < listUserSecondCompany.length; i++) {
                    listUserFirstCompany.push(listUserSecondCompany[i]);
                }
                let resultCompany = [];

                for (let i = 0; i < listUserFirstCompany.length; i++) {
                    let a = {}
                    a["id"] = listUserFirstCompany[i]._id;
                    a["email"] = listUserFirstCompany[i].email;
                    a["userName"] = listUserFirstCompany[i].userName;
                    a["status"] = listUserFirstCompany[i].status;
                    a["active"] = listUserFirstCompany[i].active;
                    a["isOnline"] = listUserFirstCompany[i].isOnline;
                    a["looker"] = listUserFirstCompany[i].looker;
                    a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                    a["lastActive"] = listUserFirstCompany[i].lastActive;
                    if (listUserFirstCompany[i].avatarUser != "") {
                        a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                    }
                    else {
                        a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    a["avatarUser"] = a["linkAvatar"];
                    a["companyId"] = listUserFirstCompany[i].companyId;
                    a["type365"] = listUserFirstCompany[i].type365;

                    let status = await RequestContact.findOne({
                        $or: [
                            { userId: userId, contactId: listUserFirstCompany[i]._id },
                            { userId: listUserFirstCompany[i]._id, contactId: userId }
                        ]
                    }).lean();
                    if (status) {
                        if (status.status == "accept") {
                            a["friendStatus"] = "friend";
                        }
                        else {
                            a["friendStatus"] = status.status;
                        }
                    }
                    else {
                        a["friendStatus"] = "none";
                    }
                    resultCompany.push(a);
                }

                // secondnormal 
                let limitUserNormal = 5 - listUserFirstNomal.length;
                let listUserSecondNormal = await User.find(
                    {
                        _id: { $nin: listUserId },
                        userNameNoVn: new RegExp(findwordNoVN, 'i'),
                        companyId: { $ne: companyId }
                    }
                ).limit(limitUserNormal).lean();
                for (let i = 0; i < listUserSecondNormal.length; i++) {
                    listUserFirstNomal.push(listUserSecondNormal[i]);
                }
                let resultNormal = [];
                for (let i = 0; i < listUserFirstNomal.length; i++) {
                    let a = {}
                    a["id"] = listUserFirstNomal[i]._id;
                    a["email"] = listUserFirstNomal[i].email;
                    a["userName"] = listUserFirstNomal[i].userName;
                    a["status"] = listUserFirstNomal[i].status;
                    a["active"] = listUserFirstNomal[i].active;
                    a["isOnline"] = listUserFirstNomal[i].isOnline;
                    a["looker"] = listUserFirstNomal[i].looker;
                    a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
                    a["lastActive"] = listUserFirstNomal[i].lastActive;
                    if (listUserFirstNomal[i].avatarUser != "") {
                        a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
                    }
                    else {
                        a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstNomal[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    a["companyId"] = listUserFirstNomal[i].companyId;
                    a["type365"] = listUserFirstNomal[i].type365;
                    a["avatarUser"] = a["linkAvatar"];
                    let status = await RequestContact.findOne({
                        $or: [
                            { userId: userId, contactId: listUserFirstNomal[i]._id },
                            { userId: listUserFirstNomal[i]._id, contactId: userId }
                        ]
                    }).lean();
                    if (status) {
                        if (status.status == "accept") {
                            a["friendStatus"] = "friend";
                        }
                        else {
                            a["friendStatus"] = status.status;
                        }
                    }
                    else {
                        a["friendStatus"] = "none";
                    }
                    resultNormal.push(a);
                }
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Lấy thông tin thành công",
                        listContactInCompany: resultCompany,
                        listGroup: conversationGroup,
                        listEveryone: resultNormal
                    },
                    error: null
                });
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

const modelUser = {
    email: 1,
    userName: 1,
    status: 1,
    active: 1,
    isOnline: 1,
    looker: 1,
    statusEmotion: 1,
    lastActive: 1,
    avatarUser: 1,
    companyId: 1,
    type365: 1
}
// tìm kiếm user nhóm 
// export const FindUserApp = async (req,res,next) =>{
//   try{
//     if(req.body && req.body.senderId  && Number(req.body.senderId)  && req.body.type){
//         if(req.body.token){
//             let check = await checkToken(req.body.token);
//             if(check && check.status && (check.userId == req.body.senderId)){
//               console.log("Token hop le, FindUserApp")
//             }
//             else{
//               return res.status(404).json(createError(404,"Invalid token"));
//             }
//         }
//         console.log("Tim kiem",req.body)
//         let userId = Number(req.body.senderId);
//         let findword;
//         let findwordNoVN;
//         if(!req.body.message){
//           findword="";
//           findwordNoVN=""
//         }
//         else{
//           findword = String(req.body.message);
//           findwordNoVN = removeVietnameseTones(String(req.body.message));
//         }
//         let companyId = 0;
//         if(req.body.companyId){
//           companyId = Number(req.body.companyId);
//           if(companyId == 0){
//             companyId = 1;
//           }
//         }
//         else{
//           companyId = 1;
//         }
//         if(String(req.body.type)=="all"){
//           // xác định bạn bè 
//           Conversation.find(
//                                                       {
//                                                         "memberList.memberId":userId,
//                                                         isGroup:0
//                                                       },
//                                                       {
//                                                         timeLastMessage:1,
//                                                         "memberList.memberId":1,
//                                                         "memberList.conversationName":1
//                                                       }
//                                                     ).sort({timeLastMessage:-1}).limit(100).then( async (conversations)=>{
//             let ListRequestContact = await Contact.find({
//               $or: [
//                 { userFist: userId},
//                 { userSecond: userId }
//               ]
//             }).limit(200).lean();
//             let ListRequestContact2 = await RequestContact.find({
//               $or: [
//                 { userId: userId},
//                 { contactId: userId }
//               ]
//             }).limit(200).lean();
//             // Group 
//             let conversationGroup=[];
//             let conversationGroupStart = await Conversation.aggregate([
//               { $match: 
//                     {
//                       "memberList.memberId":userId,
//                       isGroup:1
//                     },
//               },
//               {$sort:{timeLastMessage:-1}},
//               // { $limit : 200 },  // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất 
//               {
//                 $project: {
//                   "countMessage": {
//                       "$size": {
//                           $filter: {
//                               input: "$messageList",
//                               as: "messagelist",
//                               cond: { 
//                                 $lte: [ "$$messagelist.createAt", new Date() ]
//                               },
//                           }
//                       }
//                   },
//                   messageList: {
//                     $slice: [  // để giới hạn kết quả trả về 
//                       {
//                         $filter: {
//                           input: "$messageList",
//                           as: "messagelist",
//                           cond: { 
//                               $lte: [ "$$messagelist.createAt", new Date() ]  // nhỏ hơn hiện tại và là tin nhắn cuối 
//                           },
//                         }
//                       },
//                       -1
//                     ]
//                   },
//                   memberList:{
//                     $slice: [  // để giới hạn kết quả trả về 
//                       {
//                         $filter: {
//                           input: "$memberList",
//                           as: "memberList",
//                           cond: { 
//                               $eq: [ "$$memberList.memberId", userId ]  // nhỏ hơn hiện tại và là tin nhắn cuối 
//                           },
//                         }
//                       },
//                       -1
//                     ]
//                   },
//                   isGroup:1 ,
//                   typeGroup:1,
//                   avatarConversation:1,
//                   adminId:1,
//                   shareGroupFromLinkOption:1,
//                   browseMemberOption: 1,
//                   pinMessage:1,
//                   timeLastMessage:1,
//                   count: { $size:"$memberList" },
//                 }
//               }
//             ]);
//             for(let i=0; i<conversationGroupStart.length; i++){
//               let a= {};
//               // if(userId===56387){
//               //   console.log('Tien', conversationGroupStart[i].memberList[0].conversationName)
//               // }
//               let ele = conversationGroupStart[i].memberList.find(e=> Number(e.memberId) == userId);
//               if(ele && (Number(ele.memberId) == userId) &&(removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(findword).toLowerCase())) && (conversationGroup.length<6)){
//                 a.conversationId = conversationGroupStart[i]._id;
//                 a.companyId=0;
//                 a.conversationName=ele.conversationName;

//                 a.unReader = ele.unReader; // lay tu account 
//                 a.isGroup= conversationGroupStart[i].isGroup;
//                 if(conversationGroupStart[i] && conversationGroupStart[i].messageList[0] ){
//                   a.senderId = conversationGroupStart[i].messageList[0].senderId || 0;
//                 }
//                 else{
//                   a.senderId = 0
//                 }
//                 a.pinMessageId= conversationGroupStart[i].pinMessage;
//                 if(conversationGroupStart[i] && conversationGroupStart[i].messageList[0] ){
//                   a.messageId = conversationGroupStart[i].messageList[0]._id|| "";
//                 }
//                 else{
//                   a.messageId = ""
//                 }
//                 if(conversationGroupStart[i] && conversationGroupStart[i].messageList[0] ){
//                   a.message= conversationGroupStart[i].messageList[0].message||"";
//                   a.messageType=conversationGroupStart[i].messageList[0].messageType|| "text";
//                   a.createAt= conversationGroupStart[i].messageList[0].createAt|| new Date();
//                   a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage|| 0;
//                 }
//                 else{
//                   a.message= "";
//                   a.messageType= "text";
//                   a.createAt=new Date();
//                   a.messageDisplay =0;
//                 }

//                 a.countMessage = conversationGroupStart[i].countMessage; //total
//                 a.typeGroup = conversationGroupStart[i].typeGroup ;
//                 a.adminId= conversationGroupStart[i].adminId;
//                 a.shareGroupFromLink =  conversationGroupStart[i].shareGroupFromLinkOption;
//                 a.memberList=null;
//                 a.browseMember= conversationGroupStart[i].browseMemberOption;
//                 a.isFavorite= ele.isFavorite;
//                 a.notification=ele.notification;
//                 a.isHidden = ele.isHidden;
//                 a.deleteTime = ele.deleteTime;
//                 a.deleteType = ele.deleteType;
//                 a.listMess= 0;
//                 if(String(conversationGroupStart[i].avatarConversation) !== ""){
//                   a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
//                 }
//                 else{
//                   let t = getRandomInt(1,4);
//                   a.linkAvatar= `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0])}_${t}.png`
//                 }
//                 a.avatarConversation=a.linkAvatar;
//                 a.listBrowerMember= conversationGroupStart[i].browseMemberList;
//                 a.listMember = conversationGroupStart[i].memberList;
//                 a.listMessage = null;
//                 a.countMem = conversationGroupStart[i].count;
//                 conversationGroup.push(a)
//               }
//             }
//             // listUserId in conversation
//             let listUserFirstCompany =[];
//             let listUserFirstNomal =[]
//             let listUserId =[];
//             if(conversations){
//               if(conversations.length>0){  
//                   for (let i =0 ; i<conversations.length; i++){
//                     if(conversations[i].memberList.length>1){
//                       if(Number(conversations[i].memberList[0].memberId)!= userId){
//                         listUserId.push(conversations[i].memberList[0].memberId)
//                       };
//                       if( Number(conversations[i].memberList[1].memberId)!= userId){
//                         listUserId.push(conversations[i].memberList[1].memberId)
//                       }
//                     }
//                   }
//                   let listUserDetail = await User.find(
//                                                         {
//                                                           $or: [
//                                                             {
//                                                               _id:{$in:listUserId},
//                                                               userNameNoVn:new RegExp(findwordNoVN,'i')
//                                                             },
//                                                             {
//                                                               _id:{$in:listUserId},
//                                                               email:new RegExp(findwordNoVN,'i')
//                                                             },
//                                                           ]
//                                                         },
//                                                         modelUser
//                                                       ).limit(25).lean();
//                   for(let j=0; j<listUserId.length; j++){
//                     let ele = listUserDetail.find(e=>e._id == listUserId[j]);
//                     if(ele){
//                         if((Number(ele.companyId)==Number(companyId)) && ( ele.type365 != 0)){
//                           listUserFirstCompany.push(ele)
//                         }
//                         else{
//                           listUserFirstNomal.push(ele)
//                         }
//                     }
//                   }
//               }
//               else{
//                 listUserFirstCompany =[];
//                 listUserFirstNomal =[]
//               }

//               // secondCompany
//               let limitUserCompany = 6 - listUserFirstCompany.length;
//               if(Number(limitUserCompany) <= 0){
//                 limitUserCompany = 3;
//               }
//               // loai bo chinh minh 
//               listUserId.push(userId);
//               let listUserSecondCompany = await User.find(  
//                 {
//                   $or: [
//                     {_id:{$nin:listUserId},userNameNoVn:new RegExp(findwordNoVN,'i'),companyId:companyId, type365:{$ne:0}},
//                     {
//                       _id:{$nin:listUserId},companyId:companyId,
//                       email:new RegExp(findwordNoVN,'i'),
//                       type365:{$ne:0}
//                     },
//                   ]
//                 },
//                 modelUser
//               ).limit(10).lean();
//               for( let i= 0; i<listUserSecondCompany.length; i++){
//                 listUserFirstCompany.push(listUserSecondCompany[i]);
//               }
//               let resultCompany =[];
//               for(let i= 0; i< listUserFirstCompany.length;i++){
//                   let a ={}
//                   a["id"]=listUserFirstCompany[i]._id;
//                   a["email"]= listUserFirstCompany[i].email;
//                   a["userName"]= listUserFirstCompany[i].userName;
//                   a["status"]= listUserFirstCompany[i].status;
//                   a["active"]= listUserFirstCompany[i].active;
//                   a["isOnline"]= listUserFirstCompany[i].isOnline;
//                   a["looker"]= listUserFirstCompany[i].looker;
//                   a["statusEmotion"]= listUserFirstCompany[i].statusEmotion;
//                   a["lastActive"]=  listUserFirstCompany[i].lastActive;
//                   if(listUserFirstCompany[i].avatarUser !=""){
//                     a["linkAvatar"]= `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
//                   }
//                   else{
//                     a["linkAvatar"]= `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1,4)}.png`
//                   }
//                   a["avatarUser"]=  a["linkAvatar"];
//                   a["companyId"]= listUserFirstCompany[i].companyId;
//                   a["type365"]= listUserFirstCompany[i].type365;
//                   let requestContact2 = ListRequestContact2.find((e)=> (e.userId==userId && e.contactId == listUserFirstCompany[i]._id) || (e.userId==listUserFirstCompany[i]._id && e.contactId == userId));
//                   if(requestContact2){
//                       if(requestContact2.status == "accept"){
//                           a["friendStatus"]= "friend";
//                       }
//                       else{
//                           a["friendStatus"]= requestContact2.status;
//                           if(requestContact2.status == "send"){
//                              if(requestContact2.userId != userId){
//                                 a["friendStatus"] = "request"
//                              }
//                           }
//                       }
//                   }
//                   else{
//                     a["friendStatus"]= "none";
//                   }
//                   let requestContact = ListRequestContact.find((e)=> (e.userFist==userId && e.userSecond == listUserFirstCompany[i]._id) || (e.userFist==listUserFirstCompany[i]._id && e.userSecond == userId));
//                   if(requestContact && requestContact._id){
//                     a["friendStatus"]= "friend";
//                   }

//                   resultCompany.push(a);
//               }

//               // secondnormal 
//               let limitUserNormal = 6 - listUserFirstNomal.length;
//               if(Number(limitUserNormal) <= 0){
//                 limitUserNormal = 3;
//               }
//               let listUserSecondNormal  = await User.find(
//                   {
//                     $or: [
//                       { _id:{$nin:listUserId},
//                         userNameNoVn:new RegExp(findwordNoVN,'i'),
//                         companyId:{$ne:companyId}
//                       },
//                       {
//                         _id:{$nin:listUserId},companyId:{$ne:companyId},
//                         email:new RegExp(findwordNoVN,'i')
//                       },
//                     ]
//                   },
//                   modelUser
//                 ).limit(15).lean();
//               for( let i= 0; i<listUserSecondNormal.length; i++){
//                 listUserFirstNomal.push(listUserSecondNormal[i]);
//               }
//               let resultNormal =[];
//               for(let i= 0; i< listUserFirstNomal.length;i++){
//                   let a ={}
//                   a["id"]=listUserFirstNomal[i]._id;
//                   a["email"]= listUserFirstNomal[i].email;
//                   a["userName"]= listUserFirstNomal[i].userName;
//                   a["status"]= listUserFirstNomal[i].status;
//                   a["active"]= listUserFirstNomal[i].active;
//                   a["isOnline"]= listUserFirstNomal[i].isOnline;
//                   a["looker"]= listUserFirstNomal[i].looker;
//                   a["statusEmotion"]= listUserFirstNomal[i].statusEmotion;
//                   a["lastActive"]=  listUserFirstNomal[i].lastActive;
//                   if(listUserFirstNomal[i].avatarUser !=""){
//                     a["linkAvatar"]= `${urlImgHost()}avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
//                   }
//                   else{
//                     a["linkAvatar"]= `${urlImgHost()}avatar/${listUserFirstNomal[i].userName[0]}_${getRandomInt(1,4)}.png`
//                   }
//                   a["avatarUser"]=  a["linkAvatar"];
//                   a["companyId"]= listUserFirstNomal[i].companyId;
//                   a["type365"]= listUserFirstNomal[i].type365;

//                   let requestContact2 = ListRequestContact2.find((e)=> (e.userId==userId && e.contactId == listUserFirstNomal[i]._id) || (e.userId == listUserFirstNomal[i]._id && e.contactId == userId));
//                   if(requestContact2){
//                       if(requestContact2.status == "accept"){
//                           a["friendStatus"]= "friend";
//                       }
//                       else{
//                           a["friendStatus"]= requestContact2.status;
//                           if(requestContact2.status == "send"){
//                              if(requestContact2.userId != userId){
//                                 a["friendStatus"] = "request"
//                              }
//                           }
//                       }
//                   }
//                   else{
//                     a["friendStatus"]= "none";
//                   }

//                   let requestContact = ListRequestContact.find((e)=> ( e.userFist==userId && e.userSecond == listUserFirstNomal[i]._id) || (e.userFist==listUserFirstNomal[i]._id && e.userSecond == userId));
//                   if(requestContact && requestContact._id){
//                     a["friendStatus"]= "friend";
//                   }

//                   resultNormal.push(a);
//               }
//               if(!req.body.companyId || (String(req.body.companyId)=="0") ){
//                 return res.status(200).json({
//                   data:{
//                     result:true,
//                     message:"Lấy thông tin thành công",
//                     listContactInCompany:[],
//                     listGroup:conversationGroup,
//                     listEveryone:resultNormal,
//                   },
//                   error:null
//                 });
//               }
//               else{
//                 return res.status(200).json({
//                   data:{
//                     result:true,
//                     message:"Lấy thông tin thành công",
//                     resultCompanyCount:resultCompany.length,
//                     conversationGroupCount:conversationGroup.length,
//                     resultNormalCount:resultNormal.length,
//                     listContactInCompany:resultCompany,
//                     listGroup:conversationGroup,
//                     listEveryone:resultNormal,
//                   },
//                   error:null
//                 });
//               }
//             }
//           }).catch((e)=>{
//             console.log("lỗi try catch promise",e)
//           })
//         }
//         else if(String(req.body.type)=="company"){
//           Conversation.find(
//               {
//               "memberList.memberId":userId,
//               isGroup:0
//               },
//               {
//                 timeLastMessage:1,
//                 "memberList.memberId":1,
//                 "memberList.conversationName":1
//               }
//           ).sort({timeLastMessage:-1}).limit(55).then( async (conversations)=>{
//               let ListRequestContact = await Contact.find({
//                 $or: [
//                   { userFist: userId},
//                   { userSecond: userId }
//                 ]
//               }).limit(200).lean();
//               let ListRequestContact2 = await RequestContact.find({
//                 $or: [
//                   { userId: userId},
//                   { contactId: userId }
//                 ]
//               }).limit(200).lean();
//               // listUserId in conversation
//               let listUserFirstCompany =[];
//               let listUserId =[];
//               if(conversations){
//                 if(conversations.length>0){  
//                   for (let i =0 ; i<conversations.length; i++){
//                     if(conversations[i].memberList.length>1){
//                         if(Number(conversations[i].memberList[0].memberId)!= userId){
//                         listUserId.push(conversations[i].memberList[0].memberId)
//                         };
//                         if( Number(conversations[i].memberList[1].memberId)!= userId){
//                         listUserId.push(conversations[i].memberList[1].memberId)
//                     }
//                     }
//                   }
//                   let listUserDetail = await User.find(
//                     {
//                       $or: [
//                         {
//                           _id:{$in:listUserId},
//                           userNameNoVn:new RegExp(findwordNoVN,'i')
//                         },
//                         {
//                           _id:{$in:listUserId},
//                           email:new RegExp(findwordNoVN,'i')
//                         },
//                       ]
//                     },
//                     modelUser
//                   ).lean();
//                   for(let j=0; j<listUserId.length; j++){
//                     let ele = listUserDetail.find(e=>e._id == listUserId[j]);
//                     if(ele){
//                       if(Number(ele.companyId)==Number(companyId)){
//                       listUserFirstCompany.push(ele)
//                       }
//                     }
//                   }
//                 }
//                 else{
//                   listUserFirstCompany =[];
//                   }

//                 let limitUserCompany = 10 - listUserFirstCompany.length;
//                 // loai bo chinh minh 
//                 listUserId.push(userId);
//                 if( (isNaN(limitUserCompany)) || (Number(limitUserCompany) <=0)){
//                   limitUserCompany= 3;
//                 }
//                 let listUserSecondCompany = await User.find(
//                                                 {
//                                                   $or: [
//                                                     {_id:{$nin:listUserId},userNameNoVn:new RegExp(findwordNoVN,'i'),companyId:companyId},
//                                                     {
//                                                       _id:{$nin:listUserId},companyId:companyId,
//                                                       email:new RegExp(findwordNoVN,'i')
//                                                     },
//                                                   ]
//                                                 },
//                                                 modelUser
//                                               ).limit(10).lean();
//                 for( let i= 0; i<listUserSecondCompany.length; i++){
//                 listUserFirstCompany.push(listUserSecondCompany[i]);
//                 }
//                 let resultCompany =[];
//                 for(let i= 0; i< listUserFirstCompany.length;i++){
//                       let a ={}
//                       a["id"]=listUserFirstCompany[i]._id;
//                       a["email"]= listUserFirstCompany[i].email;
//                       a["userName"]= listUserFirstCompany[i].userName;
//                       a["status"]= listUserFirstCompany[i].status;
//                       a["active"]= listUserFirstCompany[i].active;
//                       a["isOnline"]= listUserFirstCompany[i].isOnline;
//                       a["looker"]= listUserFirstCompany[i].looker;
//                       a["statusEmotion"]= listUserFirstCompany[i].statusEmotion;
//                       a["lastActive"]=  listUserFirstCompany[i].lastActive;
//                       if(listUserFirstCompany[i].avatarUser !=""){
//                         a["linkAvatar"]= `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
//                       }
//                       else{
//                         a["linkAvatar"]= `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1,4)}.png`
//                       }
//                       a["avatarUser"]=  a["linkAvatar"];
//                       a["companyId"]= listUserFirstCompany[i].companyId;
//                       a["type365"]= listUserFirstCompany[i].type365;
//                       let requestContact2 = ListRequestContact2.find((e)=> (e.userId==userId && e.contactId == listUserFirstCompany[i]._id) || (e.userId==listUserFirstCompany[i]._id && e.contactId == userId));
//                       if(requestContact2){
//                           if(requestContact2.status == "accept"){
//                               a["friendStatus"]= "friend";
//                           }
//                           else{
//                               a["friendStatus"]= requestContact2.status;
//                               if(requestContact2.status == "send"){
//                                 if(requestContact2.userId != userId){
//                                     a["friendStatus"] = "request"
//                                 }
//                               }
//                           }
//                       }
//                       else{
//                         a["friendStatus"]= "none";
//                       }
//                       let requestContact = ListRequestContact.find((e)=> (e.userFist==userId && e.userSecond == listUserFirstCompany[i]._id) || (e.userFist==listUserFirstCompany[i]._id && e.userSecond == userId));
//                       if(requestContact && requestContact._id){
//                         a["friendStatus"]= "friend";
//                       }

//                       resultCompany.push(a);
//                 }
//                 // secondnormal 
//                 if(!req.body.companyId || (String(req.body.companyId)=="0") ){
//                   return res.status(200).json({
//                     data:{
//                       result:true,
//                       message:"Lấy thông tin thành công",
//                       listContactInCompany:[]
//                     },
//                     error:null
//                   });
//                 }
//                 else{
//                   return res.status(200).json({
//                     data:{
//                       result:true,
//                       message:"Lấy thông tin thành công",
//                       listContactInCompany:resultCompany
//                     },
//                     error:null
//                   });
//                 }
//               }
//           }).catch((e)=>{
//             console.log("lỗi try catch promise",e)
//           })
//         }
//         else if(String(req.body.type)=="normal"){
//           Conversation.find(
//                                                       {
//                                                       "memberList.memberId":userId,
//                                                       isGroup:0
//                                                       },
//                                                       {
//                                                         timeLastMessage:1,
//                                                         "memberList.memberId":1,
//                                                         "memberList.conversationName":1
//                                                       }
//                                                     ).sort({timeLastMessage:-1}).limit(200).then( async (conversations)=>{
//               console.log("count of conv check",conversations.length)
//               let ListRequestContact = await Contact.find({
//                 $or: [
//                   { userFist: userId},
//                   { userSecond: userId }
//                 ]
//               }).limit(200).lean();

//               let ListRequestContact2 = await RequestContact.find({
//                 $or: [
//                   { userId: userId},
//                   { contactId: userId }
//                 ]
//               }).limit(200).lean();
//               // listUserId in conversation
//               let listUserFirstNomal =[]
//               let listUserId =[];
//               if(conversations){
//                 if(conversations.length>0){  
//                     for (let i =0 ; i<conversations.length; i++){
//                       if(conversations[i].memberList.length>1){
//                         if(Number(conversations[i].memberList[0].memberId)!= userId){
//                           listUserId.push(conversations[i].memberList[0].memberId)
//                         };
//                         if( Number(conversations[i].memberList[1].memberId)!= userId){
//                           listUserId.push(conversations[i].memberList[1].memberId)
//                         }
//                       }
//                     }
//                     let listUserDetail = await User.find(
//                       {
//                         $or: [
//                           {
//                             _id:{$in:listUserId},
//                             userNameNoVn:new RegExp(findwordNoVN,'i')
//                           },
//                           {
//                             _id:{$in:listUserId},
//                             email:new RegExp(findwordNoVN,'i')
//                           },
//                         ]
//                       },
//                       modelUser
//                     ).limit(15).lean();
//                     for(let j=0; j<listUserDetail.length; j++){
//                         if(listUserDetail[j].companyId != companyId){
//                           listUserFirstNomal.push(listUserDetail[j]);
//                         }
//                     }
//                 }
//                 else{
//                   listUserFirstNomal =[]
//                 }
//                 // secondnormal 
//                 let limitUserNormal = 16 - listUserFirstNomal.length;
//                 if( (isNaN(limitUserNormal)) || (Number(limitUserNormal) <=0)){
//                   limitUserNormal= 5;
//                 }
//                 let listUserSecondNormal = await User.find(  
//                   {
//                     $or: [
//                       {_id:{$nin:listUserId},userNameNoVn:new RegExp(findwordNoVN,'i'),companyId:{$ne:companyId}},
//                       {
//                         _id:{$nin:listUserId},companyId:{$ne:companyId},
//                         email:new RegExp(findwordNoVN,'i')
//                       },
//                     ]
//                   },
//                   modelUser
//                 ).limit(15).lean();
//                 for( let i= 0; i<listUserSecondNormal.length; i++){
//                   listUserFirstNomal.push(listUserSecondNormal[i]);
//                 }
//                 let resultNormal =[];
//                 for(let i= 0; i< listUserFirstNomal.length;i++){
//                     let a ={}
//                     a["id"]=listUserFirstNomal[i]._id;
//                     a["email"]= listUserFirstNomal[i].email;
//                     a["userName"]= listUserFirstNomal[i].userName;
//                     a["avatarUser"]= listUserFirstNomal[i].avatarUser;
//                     a["status"]= listUserFirstNomal[i].status;
//                     a["active"]= listUserFirstNomal[i].active;
//                     a["isOnline"]= listUserFirstNomal[i].isOnline;
//                     a["looker"]= listUserFirstNomal[i].looker;
//                     a["statusEmotion"]= listUserFirstNomal[i].statusEmotion;
//                     a["lastActive"]=  listUserFirstNomal[i].lastActive;
//                     if(listUserFirstNomal[i].avatarUser !=""){
//                       a["linkAvatar"]= `${urlImgHost()}avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
//                     }
//                     else{
//                       a["linkAvatar"]= `${urlImgHost()}avatar/${listUserFirstNomal[i].userName[0]}_${getRandomInt(1,4)}.png`
//                     }
//                     a["avatarUser"]=  a["linkAvatar"];
//                     a["companyId"]= listUserFirstNomal[i].companyId;
//                     a["type365"]= listUserFirstNomal[i].type365;

//                     let requestContact2 = ListRequestContact2.find((e)=> (e.userId==userId && e.contactId == listUserFirstNomal[i]._id) || (e.userId == listUserFirstNomal[i]._id && e.contactId == userId));
//                     if(requestContact2){
//                         if(requestContact2.status == "accept"){
//                             a["friendStatus"]= "friend";
//                         }
//                         else{
//                             a["friendStatus"]= requestContact2.status;
//                             if(requestContact2.status == "send"){
//                               if(requestContact2.userId != userId){
//                                   a["friendStatus"] = "request"
//                               }
//                             }
//                         }
//                     }
//                     else{
//                       a["friendStatus"]= "none";
//                     }
//                     let requestContact = ListRequestContact.find((e)=> ( e.userFist==userId && e.userSecond == listUserFirstNomal[i]._id) || (e.userFist==listUserFirstNomal[i]._id && e.userSecond == userId));
//                     if(requestContact && requestContact._id){
//                       a["friendStatus"]= "friend";
//                     }

//                     resultNormal.push(a);
//                 }
//                 return res.status(200).json({
//                   data:{
//                     result:true,
//                     message:"Lấy thông tin thành công",
//                     listEveryone:resultNormal,
//                   },
//                   error:null
//                 });
//               }
//           }).catch((e)=>{
//             console.log("lỗi try catch",e)
//           })
//         }
//         else if(String(req.body.type)=="group"){
//           let conversationGroup=[];
//           Conversation.aggregate([
//             { $match: 
//                   {
//                     "memberList.memberId":userId,
//                     isGroup:1
//                   },
//             },
//             {$sort:{timeLastMessage:-1}},
//             // { $limit : 100 },  // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất 
//             {
//               $project: {
//                 "countMessage": {
//                     "$size": {
//                         $filter: {
//                             input: "$messageList",
//                             as: "messagelist",
//                             cond: { 
//                               $lte: [ "$$messagelist.createAt", new Date() ]
//                             },
//                         }
//                     }
//                 },
//                 messageList: {
//                   $slice: [  // để giới hạn kết quả trả về 
//                     {
//                       $filter: {
//                         input: "$messageList",
//                         as: "messagelist",
//                         cond: { 
//                             $lte: [ "$$messagelist.createAt", new Date() ]  // nhỏ hơn hiện tại và là tin nhắn cuối 
//                         },
//                       }
//                     },
//                     -1
//                   ]
//                 },
//                 memberList:1,
//                 isGroup:1 ,
//                 typeGroup:1,
//                 avatarConversation:1,
//                 adminId:1,
//                 shareGroupFromLinkOption:1,
//                 browseMemberOption: 1,
//                 pinMessage:1,
//                 timeLastMessage:1
//               }
//             }
//           ]).then((conversationGroupStart)=>{

//             for(let i=0; i<conversationGroupStart.length; i++){
//               let a= {};
//               let ele = conversationGroupStart[i].memberList.find(e=> Number(e.memberId) == userId);
//               if(ele && (Number(ele.memberId) == userId) &&(removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(findword).toLowerCase()))){
//                 a.conversationId = conversationGroupStart[i]._id;
//                 a.companyId=0;
//                 a.conversationName=ele.conversationName;
//                 a.avatarConversation=conversationGroupStart[i].avatarConversation;
//                 a.unReader = ele.unReader; // lay tu account 
//                 a.isGroup= conversationGroupStart[i].isGroup;
//                 if(conversationGroupStart[i] && conversationGroupStart[i].messageList[0] ){
//                   a.senderId = conversationGroupStart[i].messageList[0].senderId || 0;
//                 }
//                 else{
//                   a.senderId = 0
//                 }
//                 a.pinMessageId= conversationGroupStart[i].pinMessage;
//                 if(conversationGroupStart[i] && conversationGroupStart[i].messageList[0] ){
//                   a.messageId = conversationGroupStart[i].messageList[0]._id|| "";
//                 }
//                 else{
//                   a.messageId = ""
//                 }
//                 if(conversationGroupStart[i] && conversationGroupStart[i].messageList[0] ){
//                   a.message= conversationGroupStart[i].messageList[0].message||"";
//                   a.messageType=conversationGroupStart[i].messageList[0].messageType|| "text";
//                   a.createAt= conversationGroupStart[i].messageList[0].createAt|| new Date();
//                   a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage|| 0;
//                 }
//                 else{
//                   a.message= "";
//                   a.messageType= "text";
//                   a.createAt=new Date();
//                   a.messageDisplay =0;
//                 }
//                 a.countMessage = conversationGroupStart[i].countMessage; //total
//                 a.typeGroup = conversationGroupStart[i].typeGroup ;
//                 a.adminId= conversationGroupStart[i].adminId;
//                 a.shareGroupFromLink =  conversationGroupStart[i].shareGroupFromLinkOption;
//                 a.memberList=null;
//                 a.browseMember= conversationGroupStart[i].browseMemberOption;
//                 a.isFavorite= ele.isFavorite;
//                 a.notification=ele.notification;
//                 a.isHidden = ele.isHidden;
//                 a.deleteTime = ele.deleteTime;
//                 a.deleteType = ele.deleteType;
//                 a.listMess= 0;
//                 if(String(conversationGroupStart[i].avatarConversation) !== ""){
//                   a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
//                 }
//                 else{
//                   let t = getRandomInt(1,4);
//                   if( ele.conversationName.trim() != ""){
//                     a.linkAvatar= `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0]).toUpperCase()}_${t}.png`
//                   }
//                   else{
//                     a.linkAvatar= `${urlImgHost()}avatar/${ele.conversationName[0]}_${t}.png`
//                   }
//                 }
//                 a.listBrowerMember= conversationGroupStart[i].browseMemberList;
//                 a.listMember = conversationGroupStart[i].memberList;
//                 a.listMessage = null
//                 conversationGroup.push(a)
//               }
//             }
//             return res.status(200).json({
//               data:{
//                 result:true,
//                 message:"Lấy thông tin thành công",
//                 listGroup:conversationGroup
//               },
//               error:null
//             });
//           }).catch((e)=>{
//             console.log("Lỗi try catch promise",e)
//           })
//         }
//         else{
//           console.log("Type search is not valid")
//           // res.status(200).json({
//           //   data:{
//           //     result:true,
//           //     message:"Type is not valid"
//           //   },
//           //   error:null
//           // });
//         }
//     }
//     else{
//       console.log("Thông tin truyền lên không đầy đủ")
//       // res.status(200).json(createError(200,"Thông tin truyền không đầy đủ"));
//     }
//   }
//   catch(e){
//    console.log("Lỗi tổng",e);
//   //  res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
//   }
// }
function customSort(a, b) {
    const regex = new RegExp(`\\b${findwordNoVN}\\b`, 'i');
    const aMatch = removeVietnameseTones(a.userName.toLowerCase()).match(regex);
    const bMatch = removeVietnameseTones(b.userName.toLowerCase()).match(regex);

    if (aMatch && bMatch) {
        // nếu cả a và b đều chứa từ tìm kiếm, sắp xếp theo thứ tự bảng chữ cái tăng dần
        return removeVietnameseTones(a.userName).localeCompare(removeVietnameseTones(b.userName));
    } else if (aMatch) {
        // nếu a chứa từ tìm kiếm, đặt a lên đầu tiên
        return -1;
    } else if (bMatch) {
        // nếu b chứa từ tìm kiếm, đặt b lên đầu tiên
        return 1;
    } else {
        // nếu cả a và b đều không chứa từ tìm kiếm, không sắp xếp
        return 0;
    }
}
export const FindUserApp = async (req, res, next) => {
    try {
        if (req.body && req.body.senderId && Number(req.body.senderId) && req.body.type) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.senderId)) {
                    console.log("Token hop le, FindUserApp")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            console.log("Tim kiem", req.body)
            let userId = Number(req.body.senderId);
            let findword;
            let findwordNoVN;
            let keyword1
            let keyword2
            let arr = req.body.message.split(" ")
            if (!req.body.message) {
                findword = "";
                findwordNoVN = ""
            }
            else {
                if (req.body.message.includes(" ") && arr.length == 2) {
                    // const [keyword1, keyword2] = findword.split(" ");
                    const [keyword, keyword0] = req.body.message.split(" ");
                    keyword1 = removeVietnameseTones(keyword)
                    keyword2 = removeVietnameseTones(keyword0)
                }
                findword = String(req.body.message);
                findwordNoVN = removeVietnameseTones(String(req.body.message));
            }

            let companyId = 0;
            if (req.body.companyId) {
                companyId = Number(req.body.companyId);
                if (companyId == 0) {
                    companyId = 1;
                }
            }
            else {
                companyId = 1;
            }
            if (String(req.body.type) == "all") {
                // xác định bạn bè 
                Conversation.find(
                    {
                        "memberList.memberId": userId,
                        isGroup: 0
                    },
                    {
                        timeLastMessage: 1,
                        "memberList.memberId": 1,
                        "memberList.conversationName": 1
                    }
                ).sort({ timeLastMessage: -1 }).limit(200).lean().then(async (conversations) => {

                    let ListRequestContact = await Contact.find({
                        $or: [
                            { userFist: userId },
                            { userSecond: userId }
                        ]
                    }).limit(200).lean();
                    let ListRequestContact2 = await RequestContact.find({
                        $or: [
                            { userId: userId },
                            { contactId: userId }
                        ]
                    }).limit(200).lean();
                    // Group 
                    let conversationGroup = [];
                    let conversationGroupStart = await Conversation.aggregate([
                        {
                            $match:
                            {
                                "memberList.memberId": userId,
                                isGroup: 1
                            },
                        },
                        { $sort: { timeLastMessage: -1 } },
                        // { $limit : 200 },  // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất 
                        {
                            $project: {
                                "countMessage": {
                                    "$size": {
                                        $filter: {
                                            input: "$messageList",
                                            as: "messagelist",
                                            cond: {
                                                $lte: ["$$messagelist.createAt", new Date()]
                                            },
                                        }
                                    }
                                },
                                messageList: {
                                    $slice: [  // để giới hạn kết quả trả về 
                                        {
                                            $filter: {
                                                input: "$messageList",
                                                as: "messagelist",
                                                cond: {
                                                    $lte: ["$$messagelist.createAt", new Date()]  // nhỏ hơn hiện tại và là tin nhắn cuối 
                                                },
                                            }
                                        },
                                        -1
                                    ]
                                },
                                memberList: {
                                    $slice: [  // để giới hạn kết quả trả về 
                                        {
                                            $filter: {
                                                input: "$memberList",
                                                as: "memberList",
                                                cond: {
                                                    $eq: ["$$memberList.memberId", userId]  // nhỏ hơn hiện tại và là tin nhắn cuối 
                                                },
                                            }
                                        },
                                        -1
                                    ]
                                },
                                isGroup: 1,
                                typeGroup: 1,
                                avatarConversation: 1,
                                adminId: 1,
                                shareGroupFromLinkOption: 1,
                                browseMemberOption: 1,
                                pinMessage: 1,
                                timeLastMessage: 1,
                                count: { $size: "$memberList" },
                            }
                        }
                    ]);

                    for (let i = 0; i < conversationGroupStart.length; i++) {
                        let a = {};
                        // if(userId===56387){
                        //   console.log('Tien', conversationGroupStart[i].memberList[0].conversationName)
                        // }
                        if (keyword1 && keyword2) {

                            let ele = conversationGroupStart[i].memberList.find(e => Number(e.memberId) == userId);
                            if (ele && (Number(ele.memberId) == userId) && (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(keyword1).toLowerCase())) &&
                                (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(keyword2).toLowerCase())) && (conversationGroup.length < 6)) {
                                a.conversationId = conversationGroupStart[i]._id;
                                a.companyId = 0;
                                a.conversationName = ele.conversationName;

                                a.unReader = ele.unReader; // lay tu account 
                                a.isGroup = conversationGroupStart[i].isGroup;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.senderId = conversationGroupStart[i].messageList[0].senderId || 0;
                                }
                                else {
                                    a.senderId = 0
                                }
                                a.pinMessageId = conversationGroupStart[i].pinMessage;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.messageId = conversationGroupStart[i].messageList[0]._id || "";
                                }
                                else {
                                    a.messageId = ""
                                }
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.message = conversationGroupStart[i].messageList[0].message || "";
                                    a.messageType = conversationGroupStart[i].messageList[0].messageType || "text";
                                    a.createAt = conversationGroupStart[i].messageList[0].createAt || new Date();
                                    a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage || 0;
                                }
                                else {
                                    a.message = "";
                                    a.messageType = "text";
                                    a.createAt = new Date();
                                    a.messageDisplay = 0;
                                }

                                a.countMessage = conversationGroupStart[i].countMessage; //total
                                a.typeGroup = conversationGroupStart[i].typeGroup;
                                a.adminId = conversationGroupStart[i].adminId;
                                a.shareGroupFromLink = conversationGroupStart[i].shareGroupFromLinkOption;
                                a.memberList = null;
                                a.browseMember = conversationGroupStart[i].browseMemberOption;
                                a.isFavorite = ele.isFavorite;
                                a.notification = ele.notification;
                                a.isHidden = ele.isHidden;
                                a.deleteTime = ele.deleteTime;
                                a.deleteType = ele.deleteType;
                                a.listMess = 0;
                                if (String(conversationGroupStart[i].avatarConversation) !== "") {
                                    a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
                                }
                                else {
                                    let t = getRandomInt(1, 4);
                                    a.linkAvatar = `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0])}_${t}.png`
                                }
                                a.avatarConversation = a.linkAvatar;
                                a.listBrowerMember = conversationGroupStart[i].browseMemberList;
                                a.listMember = conversationGroupStart[i].memberList;
                                a.listMessage = null;
                                a.countMem = conversationGroupStart[i].count;
                                conversationGroup.push(a)
                            }
                        } else {
                            let ele = conversationGroupStart[i].memberList.find(e => Number(e.memberId) == userId);
                            if (ele && (Number(ele.memberId) == userId) && (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(findword).toLowerCase())) && (conversationGroup.length < 6)) {
                                a.conversationId = conversationGroupStart[i]._id;
                                a.companyId = 0;
                                a.conversationName = ele.conversationName;

                                a.unReader = ele.unReader; // lay tu account 
                                a.isGroup = conversationGroupStart[i].isGroup;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.senderId = conversationGroupStart[i].messageList[0].senderId || 0;
                                }
                                else {
                                    a.senderId = 0
                                }
                                a.pinMessageId = conversationGroupStart[i].pinMessage;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.messageId = conversationGroupStart[i].messageList[0]._id || "";
                                }
                                else {
                                    a.messageId = ""
                                }
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.message = conversationGroupStart[i].messageList[0].message || "";
                                    a.messageType = conversationGroupStart[i].messageList[0].messageType || "text";
                                    a.createAt = conversationGroupStart[i].messageList[0].createAt || new Date();
                                    a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage || 0;
                                }
                                else {
                                    a.message = "";
                                    a.messageType = "text";
                                    a.createAt = new Date();
                                    a.messageDisplay = 0;
                                }

                                a.countMessage = conversationGroupStart[i].countMessage; //total
                                a.typeGroup = conversationGroupStart[i].typeGroup;
                                a.adminId = conversationGroupStart[i].adminId;
                                a.shareGroupFromLink = conversationGroupStart[i].shareGroupFromLinkOption;
                                a.memberList = null;
                                a.browseMember = conversationGroupStart[i].browseMemberOption;
                                a.isFavorite = ele.isFavorite;
                                a.notification = ele.notification;
                                a.isHidden = ele.isHidden;
                                a.deleteTime = ele.deleteTime;
                                a.deleteType = ele.deleteType;
                                a.listMess = 0;
                                if (String(conversationGroupStart[i].avatarConversation) !== "") {
                                    a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
                                }
                                else {
                                    let t = getRandomInt(1, 4);
                                    a.linkAvatar = `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0])}_${t}.png`
                                }
                                a.avatarConversation = a.linkAvatar;
                                a.listBrowerMember = conversationGroupStart[i].browseMemberList;
                                a.listMember = conversationGroupStart[i].memberList;
                                a.listMessage = null;
                                a.countMem = conversationGroupStart[i].count;
                                conversationGroup.push(a)
                            }

                        }
                    }
                    // listUserId in conversation
                    let listUserFirstCompany = [];
                    let listUserFirstNomal = []
                    let listUserSecondCompany
                    let listUserId = [];
                    let listUserSecondNormal
                    let listUserDetail
                    if (conversations) {
                        if (conversations.length > 0) {
                            for (let i = 0; i < conversations.length; i++) {
                                if (conversations[i].memberList.length > 1) {
                                    if (Number(conversations[i].memberList[0].memberId) != userId) {
                                        listUserId.push(conversations[i].memberList[0].memberId)
                                    };
                                    if (Number(conversations[i].memberList[1].memberId) != userId) {
                                        listUserId.push(conversations[i].memberList[1].memberId)
                                    }
                                }
                            }
                            if (keyword1 && keyword2) {
                                const query = {
                                    $or: [
                                        { $and: [{ _id: { $in: listUserId } }, { userNameNoVn: new RegExp(keyword1, "i") }, { userNameNoVn: new RegExp(keyword2, "i") },] },
                                        { $and: [{ _id: { $in: listUserId } }, { email: new RegExp(keyword1, "i") }, { email: new RegExp(keyword2, "i") }] }
                                    ]
                                };

                                listUserDetail = await User.find(query).limit(25);

                            } else {
                                listUserDetail = await User.find(
                                    {
                                        $or: [
                                            {
                                                _id: { $in: listUserId },
                                                userNameNoVn: new RegExp(findwordNoVN, 'i')
                                            },
                                            {
                                                _id: { $in: listUserId },
                                                email: new RegExp(findwordNoVN, 'i')
                                            },
                                        ]
                                    },
                                    modelUser
                                ).limit(50);

                            }

                            for (let j = 0; j < listUserId.length; j++) {
                                let ele = listUserDetail.find(e => e._id == listUserId[j]);
                                if (ele) {
                                    if ((Number(ele.companyId) == Number(companyId)) && (ele.type365 != 0)) {
                                        listUserFirstCompany.push(ele)
                                    }
                                    else {
                                        listUserFirstNomal.push(ele)
                                    }
                                }
                            }
                            //listUserFirstCompany.sort(customSort)
                            //listUserFirstNomal.sort(customSort)
                        }
                        else {
                            listUserFirstCompany = [];
                            listUserFirstNomal = []
                        }

                        // secondCompany
                        let limitUserCompany = 6 - listUserFirstCompany.length;
                        if (Number(limitUserCompany) <= 0) {
                            limitUserCompany = 3;
                        }
                        // loai bo chinh minh 
                        listUserId.push(userId);
                        if (keyword1 && keyword2) {
                            listUserSecondCompany = await User.aggregate([
                                {
                                    $match: {
                                        companyId: companyId,
                                        _id: { $nin: listUserId },
                                        type365: { $ne: 0 }
                                    }
                                },
                                {
                                    $addFields: {
                                        keywordMatched: {
                                            $and: [
                                                {
                                                    $or: [
                                                        { $regexMatch: { input: "$userNameNoVn", regex: new RegExp(keyword1, "i") } },
                                                        { $regexMatch: { input: "$email", regex: new RegExp(keyword1, "i") } }
                                                    ]
                                                },
                                                {
                                                    $or: [
                                                        { $regexMatch: { input: "$userNameNoVn", regex: new RegExp(keyword2, "i") } },
                                                        { $regexMatch: { input: "$email", regex: new RegExp(keyword2, "i") } }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $match: {
                                        keywordMatched: true
                                    }
                                },
                                {
                                    $limit: 20
                                }
                            ]);


                        } else {
                            listUserSecondCompany = await User.find(
                                {
                                    $or: [
                                        { _id: { $nin: listUserId }, userNameNoVn: new RegExp(findwordNoVN, 'i'), companyId: companyId, type365: { $ne: 0 } },
                                        {
                                            _id: { $nin: listUserId }, companyId: companyId,
                                            email: new RegExp(findwordNoVN, 'i'),
                                            type365: { $ne: 0 }
                                        },
                                    ]
                                },
                                modelUser
                            ).limit(40);
                        }
                        //listUserSecondCompany.sort(customSort)
                        for (let i = 0; i < listUserSecondCompany.length; i++) {
                            listUserFirstCompany.push(listUserSecondCompany[i]);
                        }
                        let resultCompany = [];
                        for (let i = 0; i < listUserFirstCompany.length; i++) {
                            let a = {}
                            a["id"] = listUserFirstCompany[i]._id;
                            a["email"] = listUserFirstCompany[i].email;
                            a["userName"] = listUserFirstCompany[i].userName;
                            a["status"] = listUserFirstCompany[i].status;
                            a["active"] = listUserFirstCompany[i].active;
                            a["isOnline"] = listUserFirstCompany[i].isOnline;
                            a["looker"] = listUserFirstCompany[i].looker;
                            a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                            a["lastActive"] = listUserFirstCompany[i].lastActive;
                            if (listUserFirstCompany[i].avatarUser != "") {
                                a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                            }
                            else {
                                a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                            }
                            a["avatarUser"] = a["linkAvatar"];
                            a["companyId"] = listUserFirstCompany[i].companyId;
                            a["type365"] = listUserFirstCompany[i].type365;
                            let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == listUserFirstCompany[i]._id) || (e.userId == listUserFirstCompany[i]._id && e.contactId == userId));
                            if (requestContact2) {
                                if (requestContact2.status == "accept") {
                                    a["friendStatus"] = "friend";
                                }
                                else {
                                    a["friendStatus"] = requestContact2.status;
                                    if (requestContact2.status == "send") {
                                        if (requestContact2.userId != userId) {
                                            a["friendStatus"] = "request"
                                        }
                                    }
                                }
                            }
                            else {
                                a["friendStatus"] = "none";
                            }
                            let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == listUserFirstCompany[i]._id) || (e.userFist == listUserFirstCompany[i]._id && e.userSecond == userId));
                            if (requestContact && requestContact._id) {
                                a["friendStatus"] = "friend";
                            }

                            resultCompany.push(a);
                        }


                        // secondnormal 
                        let limitUserNormal = 6 - listUserFirstNomal.length;
                        if (Number(limitUserNormal) <= 0) {
                            limitUserNormal = 3;
                        }
                        if (keyword1 && keyword2) {
                            listUserSecondNormal = []
                            const countUser = 2000000
                            const collection = Math.ceil(countUser / 24)
                            await Promise.all(
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(async (index) => {
                                    const listUser = await User.find(
                                        {
                                            $and: [
                                                { _id: { $nin: listUserId } },
                                                { _id: { $lt: index * collection } },
                                                { _id: { $gte: (index - 1) * collection } },
                                                { companyId: { $ne: companyId } },
                                                {
                                                    $or: [
                                                        {
                                                            $and: [
                                                                { userNameNoVn: { $regex: keyword1, $options: 'i' } },
                                                                { userNameNoVn: { $regex: keyword2, $options: 'i' } }
                                                            ]
                                                        },
                                                        {
                                                            $and: [
                                                                { email: { $regex: keyword1, $options: 'i' } },
                                                                { email: { $regex: keyword2, $options: 'i' } }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ).limit(5).lean()
                                    listUserSecondNormal = [...listUserSecondNormal, ...listUser]
                                })
                            )
                        } else {
                            listUserSecondNormal = []
                            // const countUser = await User.countDocuments()
                            const countUser = 2000000
                            const collection = Math.ceil(countUser / 24)
                            await Promise.all(
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(async (index) => {
                                    const listUser = await User.find({
                                        $or: [
                                            {
                                                $and: [
                                                    { _id: { $nin: listUserId } },
                                                    { _id: { $lt: index * collection } },
                                                    { _id: { $gte: (index - 1) * collection } },
                                                    { companyId: { $ne: companyId } },
                                                    { userNameNoVn: { $regex: findwordNoVN, $options: 'i' } },
                                                ]
                                            },
                                            {
                                                $and: [
                                                    { _id: { $nin: listUserId } },
                                                    { _id: { $lt: index * collection } },
                                                    { _id: { $gte: (index - 1) * collection } },
                                                    { companyId: { $ne: companyId } },
                                                    { email: { $regex: findwordNoVN, $options: 'i' } },
                                                ]
                                            },
                                        ]
                                    }).limit(5).lean();
                                    listUserSecondNormal = [...listUserSecondNormal, ...listUser]
                                })
                            )

                        }
                        //listUserSecondNormal.sort(customSort)
                        for (let i = 0; i < listUserSecondNormal.length; i++) {
                            listUserFirstNomal.push(listUserSecondNormal[i]);
                        }
                        let resultNormal = [];
                        for (let i = 0; i < listUserFirstNomal.length; i++) {
                            let a = {}
                            a["id"] = listUserFirstNomal[i]._id;
                            a["email"] = listUserFirstNomal[i].email;
                            a["userName"] = listUserFirstNomal[i].userName;
                            a["status"] = listUserFirstNomal[i].status;
                            a["active"] = listUserFirstNomal[i].active;
                            a["isOnline"] = listUserFirstNomal[i].isOnline;
                            a["looker"] = listUserFirstNomal[i].looker;
                            a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
                            a["lastActive"] = listUserFirstNomal[i].lastActive;
                            if (listUserFirstNomal[i].avatarUser != "") {
                                a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
                            }
                            else {
                                a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstNomal[i].userName[0]}_${getRandomInt(1, 4)}.png`
                            }
                            a["avatarUser"] = a["linkAvatar"];
                            a["companyId"] = listUserFirstNomal[i].companyId;
                            a["type365"] = listUserFirstNomal[i].type365;

                            let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == listUserFirstNomal[i]._id) || (e.userId == listUserFirstNomal[i]._id && e.contactId == userId));
                            if (requestContact2) {
                                if (requestContact2.status == "accept") {
                                    a["friendStatus"] = "friend";
                                }
                                else {
                                    a["friendStatus"] = requestContact2.status;
                                    if (requestContact2.status == "send") {
                                        if (requestContact2.userId != userId) {
                                            a["friendStatus"] = "request"
                                        }
                                    }
                                }
                            }
                            else {
                                a["friendStatus"] = "none";
                            }

                            let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == listUserFirstNomal[i]._id) || (e.userFist == listUserFirstNomal[i]._id && e.userSecond == userId));
                            if (requestContact && requestContact._id) {
                                a["friendStatus"] = "friend";
                            }

                            resultNormal.push(a);
                        }
                        if (!req.body.companyId || (String(req.body.companyId) == "0")) {
                            return res.status(200).json({
                                data: {
                                    result: true,
                                    message: "Lấy thông tin thành công",
                                    listContactInCompany: [],
                                    listGroup: [...new Map(conversationGroup.map((item) => [item["conversationId"], item])).values()],
                                    listEveryone: [...new Map(resultNormal.map((item) => [item["id"], item])).values()],
                                },
                                error: null
                            });
                        }
                        else {
                            return res.status(200).json({
                                data: {
                                    result: true,
                                    message: "Lấy thông tin thành công",
                                    resultCompanyCount: resultCompany.length,
                                    conversationGroupCount: conversationGroup.length,
                                    resultNormalCount: resultNormal.length,
                                    listContactInCompany: [...new Map(resultCompany.map((item) => [item["id"], item])).values()],
                                    listGroup: [...new Map(conversationGroup.map((item) => [item["conversationId"], item])).values()],
                                    listEveryone: [...new Map(resultNormal.map((item) => [item["id"], item])).values()],
                                },
                                error: null
                            });
                        }
                    }
                }).catch((e) => {
                    console.log("lỗi try catch promise", e)
                })
            }
            else if (String(req.body.type) == "company") {
                Conversation.find(
                    {
                        "memberList.memberId": userId,
                        isGroup: 0
                    },
                    {
                        timeLastMessage: 1,
                        "memberList.memberId": 1,
                        "memberList.conversationName": 1
                    }
                ).sort({ timeLastMessage: -1 }).limit(200).lean().then(async (conversations) => {
                    let ListRequestContact = await Contact.find({
                        $or: [
                            { userFist: userId },
                            { userSecond: userId }
                        ]
                    }).limit(200).lean();
                    let ListRequestContact2 = await RequestContact.find({
                        $or: [
                            { userId: userId },
                            { contactId: userId }
                        ]
                    }).limit(200).lean();
                    // listUserId in conversation
                    let listUserFirstCompany = [];
                    let listUserId = [];
                    let listUserDetail
                    let listUserSecondCompany
                    if (conversations) {
                        if (conversations.length > 0) {
                            for (let i = 0; i < conversations.length; i++) {
                                if (conversations[i].memberList.length > 1) {
                                    if (Number(conversations[i].memberList[0].memberId) != userId) {
                                        listUserId.push(conversations[i].memberList[0].memberId)
                                    };
                                    if (Number(conversations[i].memberList[1].memberId) != userId) {
                                        listUserId.push(conversations[i].memberList[1].memberId)
                                    }
                                }
                            }
                            if (keyword1 && keyword2) {
                                const query = {
                                    $or: [
                                        { $and: [{ _id: { $in: listUserId } }, { userNameNoVn: new RegExp(keyword1, "i") }, { userNameNoVn: new RegExp(keyword2, "i") }] },
                                        { $and: [{ _id: { $in: listUserId } }, { email: new RegExp(keyword1, "i") }, { email: new RegExp(keyword2, "i") }] }
                                    ]
                                };

                                listUserDetail = await User.find(query).limit(25);

                            } else {
                                listUserDetail = await User.find(
                                    {
                                        $or: [
                                            {
                                                _id: { $in: listUserId },
                                                userNameNoVn: new RegExp(findwordNoVN, 'i')
                                            },
                                            {
                                                _id: { $in: listUserId },
                                                email: new RegExp(findwordNoVN, 'i')
                                            },
                                        ]
                                    },
                                    modelUser
                                ).limit(50)

                            }
                            for (let j = 0; j < listUserId.length; j++) {
                                let ele = listUserDetail.find(e => e._id == listUserId[j]);
                                if (ele) {
                                    if (Number(ele.companyId) == Number(companyId)) {
                                        listUserFirstCompany.push(ele)
                                    }
                                }
                            }
                        }
                        else {
                            listUserFirstCompany = [];
                        }
                        //listUserFirstCompany.sort(customSort)
                        let limitUserCompany = 10 - listUserFirstCompany.length;
                        // loai bo chinh minh 
                        listUserId.push(userId);
                        if ((isNaN(limitUserCompany)) || (Number(limitUserCompany) <= 0)) {
                            limitUserCompany = 3;
                        }
                        if (keyword1 && keyword2) {
                            listUserSecondCompany = []
                            const countUser = 2000000
                            const collection = Math.ceil(countUser / 24)
                            await Promise.all(
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(async (index) => {
                                    const listUser = await User.find(
                                        {
                                            $and: [
                                                { _id: { $nin: listUserId } },
                                                { companyId: companyId },
                                                { _id: { $lt: index * collection } },
                                                { _id: { $gte: (index - 1) * collection } },
                                                {
                                                    $or: [
                                                        {
                                                            $and: [
                                                                { userNameNoVn: { $regex: keyword1, $options: 'i' } },
                                                                { userNameNoVn: { $regex: keyword2, $options: 'i' } }
                                                            ]
                                                        },
                                                        {
                                                            $and: [
                                                                { email: { $regex: keyword1, $options: 'i' } },
                                                                { email: { $regex: keyword2, $options: 'i' } }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ).limit(20).lean()
                                    listUserSecondCompany = [...listUserSecondCompany, ...listUser]
                                })
                            )
                        } else {
                            listUserSecondCompany = []
                            // const countUser = await User.countDocuments()
                            const countUser = 2000000
                            const collection = Math.ceil(countUser / 24)
                            await Promise.all(
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(async (index) => {
                                    const listUser = await User.find({
                                        $or: [
                                            {
                                                $and: [
                                                    { _id: { $nin: listUserId } },
                                                    { _id: { $lt: index * collection } },
                                                    { _id: { $gte: (index - 1) * collection } },
                                                    { companyId: companyId },
                                                    // { type365: { $ne: 0 } },
                                                    { userNameNoVn: { $regex: findwordNoVN, $options: 'i' } },
                                                ]
                                            },
                                            {
                                                $and: [
                                                    { _id: { $nin: listUserId } },
                                                    { _id: { $lt: index * collection } },
                                                    { _id: { $gte: (index - 1) * collection } },
                                                    { companyId: { $ne: companyId } },
                                                    // { type365: { $ne: 0 } },
                                                    { email: { $regex: findwordNoVN, $options: 'i' } },
                                                ]
                                            },
                                        ]
                                    },
                                        modelUser).limit(20).lean();
                                    listUserSecondCompany = [...listUserSecondCompany, ...listUser]
                                })
                            )
                        };
                        //listUserSecondCompany.sort(customSort)
                        for (let i = 0; i < listUserSecondCompany.length; i++) {
                            listUserFirstCompany.push(listUserSecondCompany[i]);
                        }
                        let resultCompany = [];
                        for (let i = 0; i < listUserFirstCompany.length; i++) {
                            let a = {}
                            a["id"] = listUserFirstCompany[i]._id;
                            a["email"] = listUserFirstCompany[i].email;
                            a["userName"] = listUserFirstCompany[i].userName;
                            a["status"] = listUserFirstCompany[i].status;
                            a["active"] = listUserFirstCompany[i].active;
                            a["isOnline"] = listUserFirstCompany[i].isOnline;
                            a["looker"] = listUserFirstCompany[i].looker;
                            a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                            a["lastActive"] = listUserFirstCompany[i].lastActive;
                            if (listUserFirstCompany[i].avatarUser != "") {
                                a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                            }
                            else {
                                a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                            }
                            a["avatarUser"] = a["linkAvatar"];
                            a["companyId"] = listUserFirstCompany[i].companyId;
                            a["type365"] = listUserFirstCompany[i].type365;
                            let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == listUserFirstCompany[i]._id) || (e.userId == listUserFirstCompany[i]._id && e.contactId == userId));
                            if (requestContact2) {
                                if (requestContact2.status == "accept") {
                                    a["friendStatus"] = "friend";
                                }
                                else {
                                    a["friendStatus"] = requestContact2.status;
                                    if (requestContact2.status == "send") {
                                        if (requestContact2.userId != userId) {
                                            a["friendStatus"] = "request"
                                        }
                                    }
                                }
                            }
                            else {
                                a["friendStatus"] = "none";
                            }
                            let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == listUserFirstCompany[i]._id) || (e.userFist == listUserFirstCompany[i]._id && e.userSecond == userId));
                            if (requestContact && requestContact._id) {
                                a["friendStatus"] = "friend";
                            }

                            resultCompany.push(a);
                        }
                        // secondnormal 
                        if (!req.body.companyId || (String(req.body.companyId) == "0")) {
                            return res.status(200).json({
                                data: {
                                    result: true,
                                    message: "Lấy thông tin thành công",
                                    listContactInCompany: []
                                },
                                error: null
                            });
                        }
                        else {
                            return res.status(200).json({
                                data: {
                                    result: true,
                                    message: "Lấy thông tin thành công",
                                    listContactInCompany: resultCompany
                                },
                                error: null
                            });
                        }
                    }
                }).catch((e) => {
                    console.log("lỗi try catch promise", e)
                })
            }
            else if (String(req.body.type) == "normal") {
                Conversation.find(
                    {
                        "memberList.memberId": userId,
                        isGroup: 0
                    },
                    {
                        timeLastMessage: 1,
                        "memberList.memberId": 1,
                        "memberList.conversationName": 1
                    }
                ).sort({ timeLastMessage: -1 }).limit(200).lean().then(async (conversations) => {
                    console.log("count of conv check", conversations.length)
                    let ListRequestContact = await Contact.find({
                        $or: [
                            { userFist: userId },
                            { userSecond: userId }
                        ]
                    }).limit(200).lean();

                    let ListRequestContact2 = await RequestContact.find({
                        $or: [
                            { userId: userId },
                            { contactId: userId }
                        ]
                    }).limit(200).lean();
                    // listUserId in conversation
                    let listUserFirstNomal = []
                    let listUserId = [];
                    let listUserDetail
                    let listUserSecondNormal
                    if (conversations) {
                        if (conversations.length > 0) {
                            for (let i = 0; i < conversations.length; i++) {
                                if (conversations[i].memberList.length > 1) {
                                    if (Number(conversations[i].memberList[0].memberId) != userId) {
                                        listUserId.push(conversations[i].memberList[0].memberId)
                                    };
                                    if (Number(conversations[i].memberList[1].memberId) != userId) {
                                        listUserId.push(conversations[i].memberList[1].memberId)
                                    }
                                }
                            }
                            if (keyword1 && keyword2) {
                                const query = {
                                    $or: [
                                        { $and: [{ _id: { $in: listUserId } }, { userNameNoVn: new RegExp(keyword1, "i") }, { userNameNoVn: new RegExp(keyword2, "i") },] },
                                        { $and: [{ _id: { $in: listUserId } }, { email: new RegExp(keyword1, "i") }, { email: new RegExp(keyword2, "i") }] }
                                    ]
                                };

                                listUserDetail = await User.find(query).limit(25);

                            } else {
                                listUserDetail = await User.find(
                                    {
                                        $or: [
                                            {
                                                _id: { $in: listUserId },
                                                userNameNoVn: new RegExp(findwordNoVN, 'i')
                                            },
                                            {
                                                _id: { $in: listUserId },
                                                email: new RegExp(findwordNoVN, 'i')
                                            },
                                        ]
                                    },
                                    modelUser
                                ).limit(50);
                                if (findwordNoVN.length === 6 && !isNaN(findwordNoVN)) {
                                    const dataUser = await User.aggregate([
                                        {
                                            '$match': {
                                                '_id': userId,
                                                'pinHiddenConversation': findwordNoVN
                                            }
                                        }, {
                                            '$lookup': {
                                                'from': 'Conversations',
                                                'localField': '_id',
                                                'foreignField': 'memberList.memberId',
                                                'as': 'conv'
                                            }
                                        }, {
                                            '$unwind': {
                                                'path': '$conv'
                                            }
                                        }, {
                                            '$match': {
                                                'conv.isGroup': 0
                                            }
                                        }, {
                                            '$project': {
                                                '_id': '$conv._id',
                                                'memberList': '$conv.memberList',
                                                'memberlist': {
                                                    '$filter': {
                                                        'input': '$conv.memberList',
                                                        'as': 'memberlist',
                                                        'cond': {
                                                            '$eq': [
                                                                '$$memberlist.isHidden', 1
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }, {
                                            '$unwind': {
                                                'path': '$memberlist'
                                            }
                                        }, {
                                            '$unset': 'memberlist'
                                        }, {
                                            '$unwind': {
                                                'path': '$memberList'
                                            }
                                        }, {
                                            '$match': {
                                                '$and': [
                                                    {
                                                        'memberList.memberId': {
                                                            '$ne': userId
                                                        }
                                                    }, {
                                                        'memberList.memberId': {
                                                            '$nin': []
                                                        }
                                                    }
                                                ]
                                            }
                                        }, {
                                            '$lookup': {
                                                'from': 'Users',
                                                'localField': 'memberList.memberId',
                                                'foreignField': '_id',
                                                'as': 'user'
                                            }
                                        }, {
                                            '$unwind': {
                                                'path': '$user'
                                            }
                                        }, {
                                            '$project': {
                                                '_id': '$user._id',
                                                'userName': '$user.userName',
                                                'status': '$user.status',
                                                'active': '$user.active',
                                                'isOnline': '$user.isOnline',
                                                'looker': '$user.looker',
                                                'statusEmotion': '$user.statusEmotion',
                                                'lastActive': '$user.lastActive',
                                                'avatarUser': '$user.avatarUser',
                                                'companyId': '$user.companyId',
                                                'type365': '$user.type365'
                                            }
                                        }
                                    ])
                                    console.log(dataUser)
                                    for (let i = 0; i < dataUser.length; i++) {
                                        listUserFirstNomal.push(dataUser[i]);
                                    }
                                }
                            }
                            for (let j = 0; j < listUserDetail.length; j++) {
                                if (listUserDetail[j].companyId != companyId) {
                                    listUserFirstNomal.push(listUserDetail[j]);
                                }
                            }
                        }
                        else {
                            listUserFirstNomal = []
                        }
                        //listUserFirstNomal.sort(customSort)
                        // secondnormal 
                        let limitUserNormal = 16 - listUserFirstNomal.length;
                        if ((isNaN(limitUserNormal)) || (Number(limitUserNormal) <= 0)) {
                            limitUserNormal = 5;
                        }
                        if (keyword1 && keyword2) {
                            listUserSecondNormal = []
                            const countUser = 2000000
                            const collection = Math.ceil(countUser / 24)
                            await Promise.all(
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(async (index) => {
                                    const listUser = await User.find(
                                        {
                                            $and: [
                                                { _id: { $nin: listUserId } },
                                                { _id: { $lt: index * collection } },
                                                { _id: { $gte: (index - 1) * collection } },
                                                // { companyId: { $ne: companyId } },
                                                {
                                                    $or: [
                                                        {
                                                            $and: [
                                                                { userNameNoVn: { $regex: keyword1, $options: 'i' } },
                                                                { userNameNoVn: { $regex: keyword2, $options: 'i' } }
                                                            ]
                                                        },
                                                        {
                                                            $and: [
                                                                { email: { $regex: keyword1, $options: 'i' } },
                                                                { email: { $regex: keyword2, $options: 'i' } }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ).limit(10).lean()
                                    listUserSecondNormal = [...listUserSecondNormal, ...listUser]
                                })
                            )
                        } else {
                            listUserSecondNormal = []
                            // const countUser = await User.countDocuments()
                            const countUser = 2000000
                            const collection = Math.ceil(countUser / 24)
                            await Promise.all(
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(async (index) => {
                                    const listUser = await User.find({
                                        $or: [
                                            {
                                                $and: [
                                                    { _id: { $nin: listUserId } },
                                                    { _id: { $lt: index * collection } },
                                                    { _id: { $gte: (index - 1) * collection } },
                                                    { companyId: { $ne: companyId } },
                                                    { userNameNoVn: { $regex: findwordNoVN, $options: 'i' } },
                                                ]
                                            },
                                            {
                                                $and: [
                                                    { _id: { $nin: listUserId } },
                                                    { _id: { $lt: index * collection } },
                                                    { _id: { $gte: (index - 1) * collection } },
                                                    { companyId: { $ne: companyId } },
                                                    { email: { $regex: findwordNoVN, $options: 'i' } },
                                                ]
                                            },
                                        ]
                                    }).limit(10).lean();
                                    listUserSecondNormal = [...listUserSecondNormal, ...listUser]
                                })
                            )
                        }
                        //listUserSecondNormal.sort(customSort)
                        for (let i = 0; i < listUserSecondNormal.length; i++) {
                            listUserFirstNomal.push(listUserSecondNormal[i]);
                        }
                        let resultNormal = [];
                        for (let i = 0; i < listUserFirstNomal.length; i++) {
                            let a = {}
                            a["id"] = listUserFirstNomal[i]._id;
                            a["email"] = listUserFirstNomal[i].email;
                            a["userName"] = listUserFirstNomal[i].userName;
                            a["avatarUser"] = listUserFirstNomal[i].avatarUser;
                            a["status"] = listUserFirstNomal[i].status;
                            a["active"] = listUserFirstNomal[i].active;
                            a["isOnline"] = listUserFirstNomal[i].isOnline;
                            a["looker"] = listUserFirstNomal[i].looker;
                            a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
                            a["lastActive"] = listUserFirstNomal[i].lastActive;
                            if (listUserFirstNomal[i].avatarUser != "") {
                                a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
                            }
                            else {
                                a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstNomal[i].userName[0]}_${getRandomInt(1, 4)}.png`
                            }
                            a["avatarUser"] = a["linkAvatar"];
                            a["companyId"] = listUserFirstNomal[i].companyId;
                            a["type365"] = listUserFirstNomal[i].type365;

                            let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == listUserFirstNomal[i]._id) || (e.userId == listUserFirstNomal[i]._id && e.contactId == userId));
                            if (requestContact2) {
                                if (requestContact2.status == "accept") {
                                    a["friendStatus"] = "friend";
                                }
                                else {
                                    a["friendStatus"] = requestContact2.status;
                                    if (requestContact2.status == "send") {
                                        if (requestContact2.userId != userId) {
                                            a["friendStatus"] = "request"
                                        }
                                    }
                                }
                            }
                            else {
                                a["friendStatus"] = "none";
                            }
                            let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == listUserFirstNomal[i]._id) || (e.userFist == listUserFirstNomal[i]._id && e.userSecond == userId));
                            if (requestContact && requestContact._id) {
                                a["friendStatus"] = "friend";
                            }

                            resultNormal.push(a);
                        }

                        return res.status(200).json({
                            data: {
                                result: true,
                                message: "Lấy thông tin thành công",
                                listEveryone: resultNormal,
                            },
                            error: null
                        });

                    }
                }).catch((e) => {
                    console.log("lỗi try catch", e)
                })
            }
            else if (String(req.body.type) == "group") {
                let conversationGroup = [];
                Conversation.aggregate([
                    {
                        $match:
                        {
                            "memberList.memberId": userId,
                            isGroup: 1
                        },
                    },
                    { $sort: { timeLastMessage: -1 } },
                    // { $limit : 100 },  // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất 
                    {
                        $project: {
                            "countMessage": {
                                "$size": {
                                    $filter: {
                                        input: "$messageList",
                                        as: "messagelist",
                                        cond: {
                                            $lte: ["$$messagelist.createAt", new Date()]
                                        },
                                    }
                                }
                            },
                            messageList: {
                                $slice: [  // để giới hạn kết quả trả về 
                                    {
                                        $filter: {
                                            input: "$messageList",
                                            as: "messagelist",
                                            cond: {
                                                $lte: ["$$messagelist.createAt", new Date()]  // nhỏ hơn hiện tại và là tin nhắn cuối 
                                            },
                                        }
                                    },
                                    -1
                                ]
                            },
                            memberList: 1,
                            isGroup: 1,
                            typeGroup: 1,
                            avatarConversation: 1,
                            adminId: 1,
                            shareGroupFromLinkOption: 1,
                            browseMemberOption: 1,
                            pinMessage: 1,
                            timeLastMessage: 1
                        }
                    }
                ]).then(async (conversationGroupStart) => {
                    let user
                    if (findword && findword.length === 6 && !isNaN(findword)) {
                        user = await User.findOne({ id: userId, pinHiddenConversation: findword }, { _id: 1 })
                    }
                    for (let i = 0; i < conversationGroupStart.length; i++) {
                        let a = {};
                        if (keyword1 && keyword2) {
                            let ele = conversationGroupStart[i].memberList.find(e => Number(e.memberId) == userId);
                            if (ele && (Number(ele.memberId) == userId) && (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(keyword1).toLowerCase())) &&
                                (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(keyword2).toLowerCase())) && (conversationGroup.length < 6)) {
                                a.conversationId = conversationGroupStart[i]._id;
                                a.companyId = 0;
                                a.conversationName = ele.conversationName;

                                a.unReader = ele.unReader; // lay tu account 
                                a.isGroup = conversationGroupStart[i].isGroup;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.senderId = conversationGroupStart[i].messageList[0].senderId || 0;
                                }
                                else {
                                    a.senderId = 0
                                }
                                a.pinMessageId = conversationGroupStart[i].pinMessage;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.messageId = conversationGroupStart[i].messageList[0]._id || "";
                                }
                                else {
                                    a.messageId = ""
                                }
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.message = conversationGroupStart[i].messageList[0].message || "";
                                    a.messageType = conversationGroupStart[i].messageList[0].messageType || "text";
                                    a.createAt = conversationGroupStart[i].messageList[0].createAt || new Date();
                                    a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage || 0;
                                }
                                else {
                                    a.message = "";
                                    a.messageType = "text";
                                    a.createAt = new Date();
                                    a.messageDisplay = 0;
                                }

                                a.countMessage = conversationGroupStart[i].countMessage; //total
                                a.typeGroup = conversationGroupStart[i].typeGroup;
                                a.adminId = conversationGroupStart[i].adminId;
                                a.shareGroupFromLink = conversationGroupStart[i].shareGroupFromLinkOption;
                                a.memberList = null;
                                a.browseMember = conversationGroupStart[i].browseMemberOption;
                                a.isFavorite = ele.isFavorite;
                                a.notification = ele.notification;
                                a.isHidden = ele.isHidden;
                                a.deleteTime = ele.deleteTime;
                                a.deleteType = ele.deleteType;
                                a.listMess = 0;
                                if (String(conversationGroupStart[i].avatarConversation) !== "") {
                                    a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
                                }
                                else {
                                    let t = getRandomInt(1, 4);
                                    a.linkAvatar = `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0])}_${t}.png`
                                }
                                a.avatarConversation = a.linkAvatar;
                                a.listBrowerMember = conversationGroupStart[i].browseMemberList;
                                a.listMember = conversationGroupStart[i].memberList;
                                a.listMessage = null;
                                a.countMem = conversationGroupStart[i].count;
                                conversationGroup.push(a)
                            }
                        } else {
                            let ele = conversationGroupStart[i].memberList.find(e => Number(e.memberId) == userId);
                            if ((ele && (Number(ele.memberId) == userId) && (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(findword).toLowerCase())) && (conversationGroup.length < 6)) ||
                                (user && ele && ele.isHidden === 1)) {
                                a.conversationId = conversationGroupStart[i]._id;
                                a.companyId = 0;
                                a.conversationName = ele.conversationName;

                                a.unReader = ele.unReader; // lay tu account 
                                a.isGroup = conversationGroupStart[i].isGroup;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.senderId = conversationGroupStart[i].messageList[0].senderId || 0;
                                }
                                else {
                                    a.senderId = 0
                                }
                                a.pinMessageId = conversationGroupStart[i].pinMessage;
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.messageId = conversationGroupStart[i].messageList[0]._id || "";
                                }
                                else {
                                    a.messageId = ""
                                }
                                if (conversationGroupStart[i] && conversationGroupStart[i].messageList[0]) {
                                    a.message = conversationGroupStart[i].messageList[0].message || "";
                                    a.messageType = conversationGroupStart[i].messageList[0].messageType || "text";
                                    a.createAt = conversationGroupStart[i].messageList[0].createAt || new Date();
                                    a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage || 0;
                                }
                                else {
                                    a.message = "";
                                    a.messageType = "text";
                                    a.createAt = new Date();
                                    a.messageDisplay = 0;
                                }

                                a.countMessage = conversationGroupStart[i].countMessage; //total
                                a.typeGroup = conversationGroupStart[i].typeGroup;
                                a.adminId = conversationGroupStart[i].adminId;
                                a.shareGroupFromLink = conversationGroupStart[i].shareGroupFromLinkOption;
                                a.memberList = null;
                                a.browseMember = conversationGroupStart[i].browseMemberOption;
                                a.isFavorite = ele.isFavorite;
                                a.notification = ele.notification;
                                a.isHidden = ele.isHidden;
                                a.deleteTime = ele.deleteTime;
                                a.deleteType = ele.deleteType;
                                a.listMess = 0;
                                if (String(conversationGroupStart[i].avatarConversation) !== "") {
                                    a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
                                }
                                else {
                                    let t = getRandomInt(1, 4);
                                    a.linkAvatar = `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0])}_${t}.png`
                                }
                                a.avatarConversation = a.linkAvatar;
                                a.listBrowerMember = conversationGroupStart[i].browseMemberList;
                                a.listMember = conversationGroupStart[i].memberList;
                                a.listMessage = null;
                                a.countMem = conversationGroupStart[i].count;
                                conversationGroup.push(a)
                            }

                        }
                    }

                    res.status(200).json({
                        data: {
                            result: true,
                            message: "Lấy thông tin thành công",
                            listGroup: conversationGroup
                        },
                        error: null
                    });

                }).catch((e) => {
                    console.log("Lỗi try catch promise", e)
                })
            }
            else {
                console.log("Type search is not valid")
                // res.status(200).json({
                //   data:{
                //     result:true,
                //     message:"Type is not valid"
                //   },
                //   error:null
                // });
            }
        }
        else {
            console.log("Thông tin truyền lên không đầy đủ")
            // res.status(200).json(createError(200,"Thông tin truyền không đầy đủ"));
        }
    }
    catch (e) {
        console.log("Lỗi tổng", e);
        //  res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
    }
}

export const FindUserAppAll = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.senderId)) {
                console.log("Token hop le, FindUserApp All")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        console.log(req.body)
        if (req.body && req.body.senderId && Number(req.body.senderId)) {
            let userId = Number(req.body.senderId);
            let findword;
            let findwordNoVN;
            if (!req.body.message) {
                findword = "";
                findwordNoVN = ""
            }
            else {
                findword = String(req.body.message);
                findwordNoVN = removeVietnameseTones(String(req.body.message));
            }
            let companyId = 0;
            if (req.body.companyId) {
                companyId = Number(req.body.companyId)
                if (companyId == 0) {
                    companyId = 1
                }
            }
            else {
                companyId = 1;
            }
            let user
            if (findwordNoVN.length === 6 && !isNaN(findwordNoVN)) {
                user = await User.findOne({ _id: userId, pinHiddenConversation: findwordNoVN }, { _id: 1 })
            }
            let ListRequestContact = await Contact.find({
                $or: [
                    { userFist: userId },
                    { userSecond: userId }
                ]
            }).limit(200).lean();
            let ListRequestContact2 = await RequestContact.find({
                $or: [
                    { userId: userId },
                    { contactId: userId }
                ]
            }).limit(200).lean();
            let conversations = await Conversation.find(
                {
                    "memberList.memberId": userId,
                    isGroup: 0
                },
                {
                    timeLastMessage: 1,
                    "memberList.memberId": 1,
                    "memberList.conversationName": 1
                }
            ).sort({ timeLastMessage: -1 }).limit(200).lean();

            // Group 
            let conversationGroup = [];
            let conversationGroupStart = await Conversation.aggregate([
                {
                    $match:
                    {
                        "memberList.memberId": userId,
                        isGroup: 1
                    },
                },
                { $sort: { timeLastMessage: -1 } },
                { $limit: 100 },  // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất 
                {
                    $project: {
                        "countMessage": {
                            "$size": {
                                $filter: {
                                    input: "$messageList",
                                    as: "messagelist",
                                    cond: {
                                        $lte: ["$$messagelist.createAt", new Date()]
                                    },
                                }
                            }
                        },
                        messageList: {
                            $slice: [  // để giới hạn kết quả trả về 
                                {
                                    $filter: {
                                        input: "$messageList",
                                        as: "messagelist",
                                        cond: {
                                            $lte: ["$$messagelist.createAt", new Date()]  // nhỏ hơn hiện tại và là tin nhắn cuối 
                                        },
                                    }
                                },
                                -1
                            ]
                        },
                        memberList: 1,
                        isGroup: 1,
                        typeGroup: 1,
                        avatarConversation: 1,
                        adminId: 1,
                        shareGroupFromLinkOption: 1,
                        browseMemberOption: 1,
                        pinMessage: 1,
                        timeLastMessage: 1
                    }
                }
            ]);
            for (let i = 0; i < conversationGroupStart.length; i++) {
                let a = {};
                let ele = conversationGroupStart[i].memberList.find(e => Number(e.memberId) == userId);
                if (ele && (Number(ele.memberId) == userId) && ((removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(findword).toLowerCase())) || (user && ele.isHidden === 1))) {
                    if (conversationGroupStart[i] && conversationGroupStart[i]._id && conversationGroupStart[i].messageList && conversationGroupStart[i].messageList.length && (conversationGroupStart[i].messageList.length > 0)) {
                        a.conversationId = conversationGroupStart[i]._id;
                        a.companyId = 0;
                        a.conversationName = ele.conversationName;
                        a.unReader = ele.unReader; // lay tu account 
                        a.isGroup = conversationGroupStart[i].isGroup;
                        a.senderId = conversationGroupStart[i].messageList[0].senderId;
                        a.pinMessageId = conversationGroupStart[i].pinMessage;
                        a.messageId = conversationGroupStart[i].messageList[0]._id;
                        a.message = conversationGroupStart[i].messageList[0].message;
                        a.messageType = conversationGroupStart[i].messageList[0].messageType;
                        a.createAt = conversationGroupStart[i].messageList[0].createAt;
                        a.countMessage = conversationGroupStart[i].countMessage; //total
                        a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage;
                        a.typeGroup = conversationGroupStart[i].typeGroup;
                        a.adminId = conversationGroupStart[i].adminId;
                        a.shareGroupFromLink = conversationGroupStart[i].shareGroupFromLinkOption;
                        a.memberList = null;
                        a.browseMember = conversationGroupStart[i].browseMemberOption;
                        a.isFavorite = ele.isFavorite;
                        a.notification = ele.notification;
                        a.isHidden = ele.isHidden;
                        a.deleteTime = ele.deleteTime;
                        a.deleteType = ele.deleteType;
                        a.listMess = 0;
                        if (String(conversationGroupStart[i].avatarConversation) !== "") {
                            a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
                        }
                        else {
                            let t = getRandomInt(1, 4);
                            a.linkAvatar = `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0])}_${t}.png`
                        }
                        a.avatarConversation = a.linkAvatar;
                        a.listBrowerMember = conversationGroupStart[i].browseMemberList;
                        a.listMember = conversationGroupStart[i].memberList;
                        a.listMessage = null
                        conversationGroup.push(a)
                    }
                }
            }

            // listUserId in conversation
            let listUserFirstCompany = [];
            let listUserFirstNomal = []
            let listUserId = [];
            let listUserIdHidden = []
            if (conversations) {
                if (conversations.length > 0) {
                    for (let i = 0; i < conversations.length; i++) {
                        if (conversations[i].memberList.length > 1) {
                            if (Number(conversations[i].memberList[0].memberId) != userId) {
                                listUserId.push(conversations[i].memberList[0].memberId)
                                if (user && conversations[i].memberList[0].isHidden === 1) {
                                    listUserIdHidden.push(conversations[i].memberList[0].memberId)
                                }
                            };
                            if (Number(conversations[i].memberList[1].memberId) != userId) {
                                listUserId.push(conversations[i].memberList[1].memberId)
                                if (user && conversations[i].memberList[1].isHidden === 1) {
                                    listUserIdHidden.push(conversations[i].memberList[0].memberId)
                                }
                            }
                        }
                    }

                    let listUserDetail
                    if (user) {
                        listUserDetail = await User.find(
                            {
                                $or: [
                                    {
                                        _id: { $in: listUserId },
                                        $or: [
                                            { userNameNoVn: new RegExp(findwordNoVN, 'i') },
                                            { _id: { $in: listUserIdHidden } }
                                        ]
                                    },
                                    {
                                        _id: { $in: listUserId },
                                        $or: [
                                            { email: new RegExp(findwordNoVN, 'i') },
                                            { _id: { $in: listUserIdHidden } }
                                        ]
                                    },
                                ]
                            },
                        ).limit(100).lean();
                    }
                    else {
                        listUserDetail = await User.find(
                            {
                                $or: [
                                    {
                                        _id: { $in: listUserId },
                                        userNameNoVn: new RegExp(findwordNoVN, 'i')
                                    },
                                    {
                                        _id: { $in: listUserId },
                                        email: new RegExp(findwordNoVN, 'i')
                                    },
                                ]
                            },
                        ).limit(100).lean();
                    }
                    for (let j = 0; j < listUserId.length; j++) {
                        let ele = listUserDetail.find(e => e._id == listUserId[j]);
                        if (ele) {
                            if ((Number(ele.companyId) == Number(companyId)) && (ele.type365 != 0)) {
                                listUserFirstCompany.push(ele)
                            }
                            else {
                                listUserFirstNomal.push(ele)
                            }
                        }
                    }
                }
                else {
                    listUserFirstCompany = [];
                    listUserFirstNomal = []
                }

                // secondCompany
                let limitUserCompany = 10 - listUserFirstCompany.length;
                if ((isNaN(limitUserCompany)) || (Number(limitUserCompany)) <= 0) {
                    limitUserCompany = 3;
                }
                // loai bo chinh minh 
                listUserId.push(userId);
                let listUserSecondCompany = await User.find(
                    {
                        $or: [
                            { _id: { $nin: listUserId }, userNameNoVn: new RegExp(findwordNoVN, 'i'), companyId: companyId, type365: { $ne: 0 } },
                            {
                                _id: { $nin: listUserId }, companyId: companyId,
                                email: new RegExp(findwordNoVN, 'i'),
                                type365: { $ne: 0 }
                            },
                        ]
                    },
                ).limit(4).lean();
                for (let i = 0; i < listUserSecondCompany.length; i++) {
                    listUserFirstCompany.push(listUserSecondCompany[i]);
                }
                let resultCompany = [];
                for (let i = 0; i < listUserFirstCompany.length; i++) {
                    let a = {}
                    a["id"] = listUserFirstCompany[i]._id;
                    a["email"] = listUserFirstCompany[i].email;
                    a["userName"] = listUserFirstCompany[i].userName;
                    a["status"] = listUserFirstCompany[i].status;
                    a["active"] = listUserFirstCompany[i].active;
                    a["isOnline"] = listUserFirstCompany[i].isOnline;
                    a["looker"] = listUserFirstCompany[i].looker;
                    a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                    a["lastActive"] = listUserFirstCompany[i].lastActive;
                    if (listUserFirstCompany[i].avatarUser != "") {
                        a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                    }
                    else {
                        a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    a["avatarUser"] = a["linkAvatar"];
                    a["companyId"] = listUserFirstCompany[i].companyId;
                    a["type365"] = listUserFirstCompany[i].type365;
                    let id;
                    if (listUserFirstCompany[i]) {
                        id = listUserFirstCompany[i]._id || 10000000000;
                    }
                    else {
                        id = 100000000000;
                    }
                    let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == id) || (e.userId == id && e.contactId == userId));
                    if (requestContact2) {
                        if (requestContact2.status == "accept") {
                            a["friendStatus"] = "friend";
                        }
                        else {
                            a["friendStatus"] = requestContact2.status;
                            if (requestContact2.status == "send") {
                                if (requestContact2.userId != userId) {
                                    a["friendStatus"] = "request"
                                }
                            }
                        }
                    }
                    else {
                        a["friendStatus"] = "none";
                    }
                    let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == id) || (e.userFist == id && e.userSecond == userId));
                    if (requestContact && requestContact._id) {
                        a["friendStatus"] = "friend";
                    }


                    resultCompany.push(a);
                }

                // secondnormal 
                let limitUserNormal = 10 - listUserFirstNomal.length;
                if ((isNaN(limitUserNormal)) || (Number(limitUserNormal)) <= 0) {
                    limitUserNormal = 3;
                }
                let listUserSecondNormal = await User.find(
                    {
                        $or: [
                            {
                                _id: { $nin: listUserId },
                                userNameNoVn: new RegExp(findwordNoVN, 'i'),
                                companyId: { $ne: companyId }
                            },
                            {
                                _id: { $nin: listUserId }, companyId: { $ne: companyId },
                                email: new RegExp(findwordNoVN, 'i')
                            },
                        ]
                    },
                ).limit(4).lean();
                for (let i = 0; i < listUserSecondNormal.length; i++) {
                    listUserFirstNomal.push(listUserSecondNormal[i]);
                }
                let resultNormal = [];
                for (let i = 0; i < listUserFirstNomal.length; i++) {
                    let a = {}
                    a["id"] = listUserFirstNomal[i]._id;
                    a["email"] = listUserFirstNomal[i].email;
                    a["userName"] = listUserFirstNomal[i].userName;
                    a["status"] = listUserFirstNomal[i].status;
                    a["active"] = listUserFirstNomal[i].active;
                    a["isOnline"] = listUserFirstNomal[i].isOnline;
                    a["looker"] = listUserFirstNomal[i].looker;
                    a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
                    a["lastActive"] = listUserFirstNomal[i].lastActive;
                    if (listUserFirstNomal[i].avatarUser != "") {
                        a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
                    }
                    else {
                        a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstNomal[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    a["avatarUser"] = a["linkAvatar"];
                    a["companyId"] = listUserFirstNomal[i].companyId;
                    a["type365"] = listUserFirstNomal[i].type365;
                    let id;
                    if (listUserFirstNomal[i]) {
                        id = listUserFirstNomal[i]._id || 10000000000;
                    }
                    else {
                        id = 100000000000;
                    }
                    let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == id) || (e.userId == id && e.contactId == userId));

                    if (requestContact2) {
                        if (requestContact2.status == "accept") {
                            a["friendStatus"] = "friend";
                        }
                        else {
                            a["friendStatus"] = requestContact2.status;
                            if (requestContact2.status == "send") {
                                if (requestContact2.userId != userId) {
                                    a["friendStatus"] = "request"
                                }
                            }
                        }
                    }
                    else {
                        a["friendStatus"] = "none";
                    }
                    let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == id) || (e.userFist == id && e.userSecond == userId));
                    if (requestContact && requestContact._id) {
                        a["friendStatus"] = "friend";
                    }

                    resultNormal.push(a);
                }
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Lấy thông tin thành công",
                        listContactInCompany: resultCompany,
                        listGroup: conversationGroup,
                        listEveryone: resultNormal,
                    },
                    error: null
                });
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const FindUserAppCompany = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.senderId)) {
                console.log("Token hop le, FindUserApp All")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        console.log("Tim kiem trong cong ty", req.body)
        if (req.body && req.body.senderId && Number(req.body.senderId) && Number(req.body.companyId)) {
            let userId = Number(req.body.senderId);
            let findword;
            let findwordNoVN;
            if (!req.body.message) {
                findword = "";
                findwordNoVN = ""
            }
            else {
                findword = String(req.body.message);
                findwordNoVN = removeVietnameseTones(String(req.body.message));
            }
            if (req.body.ConversationId && (!isNaN(req.body.ConversationId))) {
                let arrayUserIdAvoid = [];
                let conversation = await Conversation.findOne({ _id: Number(req.body.ConversationId) }, { "memberList.memberId": 1 }).lean();
                if (conversation && conversation.memberList) {
                    for (let i = 0; i < conversation.memberList.length; i++) {
                        arrayUserIdAvoid.push(conversation.memberList[i].memberId);
                    }
                    let companyId = 0;
                    if (req.body.companyId) {
                        companyId = Number(req.body.companyId)
                        if (companyId == 0) {
                            companyId = 1
                        }
                    }
                    else {
                        companyId = 1;
                    }
                    let ListRequestContact = await Contact.find({
                        $or: [
                            { userFist: userId },
                            { userSecond: userId }
                        ]
                    }).limit(200).lean();

                    let conversations = await Conversation.find(
                        {
                            "memberList.memberId": userId,
                            isGroup: 0
                        },
                        {
                            timeLastMessage: 1,
                            "memberList.memberId": 1,
                            "memberList.conversationName": 1
                        }
                    ).sort({ timeLastMessage: -1 }).limit(9).lean();
                    // listUserId in conversation
                    let listUserFirstCompany = [];

                    let listUserId = [];
                    if (conversations) {
                        if (conversations.length > 0) {
                            for (let i = 0; i < conversations.length; i++) {
                                if (conversations[i].memberList.length > 1) {
                                    if ((Number(conversations[i].memberList[0].memberId) != userId) && (!arrayUserIdAvoid.includes(Number(conversations[i].memberList[0].memberId)))) {
                                        listUserId.push(conversations[i].memberList[0].memberId)
                                    };
                                    if ((Number(conversations[i].memberList[1].memberId) != userId) && (!arrayUserIdAvoid.includes(Number(conversations[i].memberList[1].memberId)))) {
                                        listUserId.push(conversations[i].memberList[1].memberId)
                                    }
                                }
                            }
                            let listUserDetail = await User.find(
                                {
                                    _id: { $in: listUserId },
                                    userNameNoVn: new RegExp(findwordNoVN, 'i')
                                }
                            ).limit(9).lean();
                            for (let j = 0; j < listUserId.length; j++) {
                                let ele = listUserDetail.find(e => e._id == listUserId[j]);
                                if (ele) {
                                    if (Number(ele.companyId) == Number(companyId)) {
                                        listUserFirstCompany.push(ele)
                                    }
                                }
                            }
                        }
                        else {
                            listUserFirstCompany = [];
                        }

                        let limitUserCompany = 11 - listUserDetail.length;
                        if ((isNaN(limitUserCompany)) || (Number(limitUserCompany)) <= 0) {
                            limitUserCompany = 3;
                        }
                        // loai bo chinh minh 
                        listUserId.push(userId);
                        for (let i = 0; i < arrayUserIdAvoid.length; i++) {
                            listUserId.push(arrayUserIdAvoid[i])
                        }
                        let listUserSecondCompany = await User.find({ _id: { $nin: listUserId }, userNameNoVn: new RegExp(findwordNoVN, 'i'), companyId: companyId }).limit(limitUserCompany).lean();
                        for (let i = 0; i < listUserSecondCompany.length; i++) {
                            listUserFirstCompany.push(listUserSecondCompany[i]);
                        }
                        let resultCompany = [];
                        for (let i = 0; i < listUserFirstCompany.length; i++) {
                            let a = {}
                            a["id"] = listUserFirstCompany[i]._id;
                            a["email"] = listUserFirstCompany[i].email;
                            a["userName"] = listUserFirstCompany[i].userName;
                            a["status"] = listUserFirstCompany[i].status;
                            a["active"] = listUserFirstCompany[i].active;
                            a["isOnline"] = listUserFirstCompany[i].isOnline;
                            a["looker"] = listUserFirstCompany[i].looker;
                            a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                            a["lastActive"] = listUserFirstCompany[i].lastActive;
                            if (listUserFirstCompany[i].avatarUser != "") {
                                a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                            }
                            else {
                                a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                            }
                            a["avatarUser"] = a["linkAvatar"];
                            a["companyId"] = listUserFirstCompany[i].companyId;
                            a["type365"] = listUserFirstCompany[i].type365;
                            let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == listUserFirstCompany[i]._id) || (e.userFist == listUserFirstCompany[i]._id && e.userSecond == userId));
                            if (requestContact && requestContact._id) {
                                a["friendStatus"] = "friend";
                            }
                            else {
                                a["friendStatus"] = "none";
                            }
                            resultCompany.push(a);
                        }

                        // secondnormal 
                        res.status(200).json({
                            data: {
                                result: false,
                                message: null,
                                userName: null,
                                countConversation: 0,
                                conversationId: 0,
                                total: 0,
                                currentTime: 0,
                                listUserOnline: null,
                                user_info: null,
                                user_list: resultCompany
                            },
                            error: null
                        });
                    }
                }
                else {

                }
            }
            else {
                let companyId = Number(req.body.companyId)
                let conversations = await Conversation.find(
                    {
                        "memberList.memberId": userId,
                        isGroup: 0
                    },
                    {
                        timeLastMessage: 1,
                        "memberList.memberId": 1,
                        "memberList.conversationName": 1
                    }
                ).sort({ timeLastMessage: -1 }).limit(9).lean();
                // listUserId in conversation
                let listUserFirstCompany = [];

                let listUserId = [];
                if (conversations) {
                    if (conversations.length > 0) {
                        for (let i = 0; i < conversations.length; i++) {
                            if (conversations[i].memberList.length > 1) {
                                if (Number(conversations[i].memberList[0].memberId) != userId) {
                                    listUserId.push(conversations[i].memberList[0].memberId)
                                };
                                if (Number(conversations[i].memberList[1].memberId) != userId) {
                                    listUserId.push(conversations[i].memberList[1].memberId)
                                }
                            }
                        }
                        let listUserDetail = await User.find(
                            {
                                _id: { $in: listUserId },
                                userNameNoVn: new RegExp(findwordNoVN, 'i')
                            }
                        ).limit(10).lean();
                        for (let j = 0; j < listUserId.length; j++) {
                            let ele = listUserDetail.find(e => e._id == listUserId[j]);
                            if (ele) {
                                if (Number(ele.companyId) == Number(companyId)) {
                                    listUserFirstCompany.push(ele)
                                }
                            }
                        }
                    }
                    else {
                        listUserFirstCompany = [];
                    }

                    let limitUserCompany = 11 - listUserFirstCompany.length;
                    if ((isNaN(limitUserCompany)) || (Number(limitUserCompany)) <= 0) {
                        limitUserCompany = 3;
                    }
                    // loai bo chinh minh 
                    listUserId.push(userId);
                    let listUserSecondCompany = await User.find({ _id: { $nin: listUserId }, userNameNoVn: new RegExp(findwordNoVN, 'i'), companyId: companyId }).limit(limitUserCompany).lean();
                    for (let i = 0; i < listUserSecondCompany.length; i++) {
                        listUserFirstCompany.push(listUserSecondCompany[i]);
                    }
                    let resultCompany = [];
                    for (let i = 0; i < listUserFirstCompany.length; i++) {
                        let a = {}
                        a["id"] = listUserFirstCompany[i]._id;
                        a["email"] = listUserFirstCompany[i].email;
                        a["userName"] = listUserFirstCompany[i].userName;
                        a["status"] = listUserFirstCompany[i].status;
                        a["active"] = listUserFirstCompany[i].active;
                        a["isOnline"] = listUserFirstCompany[i].isOnline;
                        a["looker"] = listUserFirstCompany[i].looker;
                        a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                        a["lastActive"] = listUserFirstCompany[i].lastActive;
                        if (listUserFirstCompany[i].avatarUser != "") {
                            a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                        }
                        else {
                            a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                        }
                        a["avatarUser"] = a["linkAvatar"];
                        a["companyId"] = listUserFirstCompany[i].companyId;
                        a["type365"] = listUserFirstCompany[i].type365;

                        let status = await RequestContact.findOne({
                            $or: [
                                { userId: userId, contactId: listUserFirstCompany[i]._id },
                                { userId: listUserFirstCompany[i]._id, contactId: userId }
                            ]
                        }).lean();
                        if (status) {
                            if (status.status == "accept") {
                                a["friendStatus"] = "friend";
                            }
                            else {
                                a["friendStatus"] = status.status;
                            }
                        }
                        else {
                            a["friendStatus"] = "none";
                        }
                        resultCompany.push(a);
                    }

                    // secondnormal 
                    res.status(200).json({
                        data: {
                            result: false,
                            message: null,
                            userName: null,
                            countConversation: 0,
                            conversationId: 0,
                            total: 0,
                            currentTime: 0,
                            listUserOnline: null,
                            user_info: null,
                            user_list: resultCompany
                        },
                        error: null
                    });
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const FindUserAppNormal = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.senderId)) {
                console.log("Token hop le, FindUserApp All")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        console.log(req.body)
        if (req.body && req.body.senderId && Number(req.body.senderId)) {
            let userId = Number(req.body.senderId);
            let findword;
            let findwordNoVN;
            if (!req.body.message) {
                findword = "";
                findwordNoVN = ""
            }
            else {
                findword = String(req.body.message);
                findwordNoVN = removeVietnameseTones(String(req.body.message));
            }
            let companyId = 0;
            if (req.body.companyId) {
                companyId = Number(req.body.companyId)
            }
            else {
                companyId = 0;
            }
            let conversations = await Conversation.find(
                {
                    "memberList.memberId": userId,
                    isGroup: 0
                },
                {
                    timeLastMessage: 1,
                    "memberList.memberId": 1,
                    "memberList.conversationName": 1
                }
            ).sort({ timeLastMessage: -1 }).limit(9);

            // listUserId in conversation
            let listUserFirstNomal = []
            let listUserId = [];
            if (conversations) {
                if (conversations.length > 0) {
                    for (let i = 0; i < conversations.length; i++) {
                        if (conversations[i].memberList.length > 1) {
                            if (Number(conversations[i].memberList[0].memberId) != userId) {
                                listUserId.push(conversations[i].memberList[0].memberId)
                            };
                            if (Number(conversations[i].memberList[1].memberId) != userId) {
                                listUserId.push(conversations[i].memberList[1].memberId)
                            }
                        }
                    }
                    let listUserDetail = await User.find(
                        {
                            $or: [
                                {
                                    _id: { $in: listUserId },
                                    userNameNoVn: new RegExp(findwordNoVN, 'i')
                                },
                                {
                                    _id: { $in: listUserId },
                                    email: new RegExp(findwordNoVN, 'i')
                                },
                            ]
                        }
                    ).limit(15).lean();

                    for (let j = 0; j < listUserId.length; j++) {
                        let ele = listUserDetail.find(e => e._id == listUserId[j]);
                        if (ele) {
                            if (!Number(ele.companyId) == Number(companyId)) {
                                listUserFirstNomal.push(ele)
                            }

                        }
                    }
                }
                else {
                    listUserFirstNomal = []
                }

                // secondnormal 
                let limitUserNormal = 20 - listUserFirstNomal.length;
                if ((isNaN(limitUserNormal)) || (Number(limitUserNormal)) <= 0) {
                    limitUserNormal = 5;
                }
                let listUserSecondNormal = await User.find(
                    {
                        $or: [
                            { _id: { $nin: listUserId }, userNameNoVn: new RegExp(findwordNoVN, 'i'), companyId: { $ne: companyId } },
                            {
                                _id: { $nin: listUserId }, companyId: { $ne: companyId },
                                email: new RegExp(findwordNoVN, 'i')
                            },
                        ]
                    }
                ).limit(15).lean();
                for (let i = 0; i < listUserSecondNormal.length; i++) {
                    listUserFirstNomal.push(listUserSecondNormal[i]);
                }
                let resultNormal = [];
                for (let i = 0; i < listUserFirstNomal.length; i++) {
                    let a = {}
                    a["id"] = listUserFirstNomal[i]._id;
                    a["email"] = listUserFirstNomal[i].email;
                    a["userName"] = listUserFirstNomal[i].userName;
                    a["avatarUser"] = listUserFirstNomal[i].avatarUser;
                    a["status"] = listUserFirstNomal[i].status;
                    a["active"] = listUserFirstNomal[i].active;
                    a["isOnline"] = listUserFirstNomal[i].isOnline;
                    a["looker"] = listUserFirstNomal[i].looker;
                    a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
                    a["lastActive"] = listUserFirstNomal[i].lastActive;
                    if (listUserFirstNomal[i].avatarUser != "") {
                        a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
                    }
                    else {
                        a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstNomal[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    a["avatarUser"] = a["linkAvatar"];
                    a["companyId"] = listUserFirstNomal[i].companyId;
                    a["type365"] = listUserFirstNomal[i].type365;

                    let status = await RequestContact.findOne({
                        $or: [
                            { userId: userId, contactId: listUserFirstNomal[i]._id },
                            { userId: listUserFirstNomal[i]._id, contactId: userId }
                        ]
                    }).lean();
                    if (status) {
                        if (status.status == "accept") {
                            a["friendStatus"] = "friend";
                        }
                        else {
                            a["friendStatus"] = status.status;
                        }
                    }
                    else {
                        a["friendStatus"] = "none";
                    }
                    resultNormal.push(a);
                }
                res.status(200).json({
                    data: {
                        result: false,
                        message: null,
                        userName: null,
                        countConversation: 0,
                        conversationId: 0,
                        total: 0,
                        currentTime: 0,
                        listUserOnline: null,
                        user_info: null,
                        result: true,
                        message: "Lấy thông tin thành công",
                        user_list: resultNormal,
                    },
                    error: null
                });
            }

        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const FindUserAppConversation = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.senderId)) {
                console.log("Token hop le, FindUserApp All")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.senderId && Number(req.body.senderId)) {
            let userId = Number(req.body.senderId);
            let findword;
            let findwordNoVN;
            if (!req.body.message) {
                findword = "";
                findwordNoVN = ""
            }
            else {
                findword = String(req.body.message);
                findwordNoVN = removeVietnameseTones(String(req.body.message));
            }
            let companyId = Number(req.body.companyId)
            let conversationGroup = [];
            let conversationGroupStart = await Conversation.aggregate([
                {
                    $match:
                    {
                        "memberList.memberId": userId,
                        isGroup: 1
                    },
                },
                { $sort: { timeLastMessage: -1 } },
                { $limit: 100 },  // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất 
                {
                    $project: {
                        "countMessage": {
                            "$size": {
                                $filter: {
                                    input: "$messageList",
                                    as: "messagelist",
                                    cond: {
                                        $lte: ["$$messagelist.createAt", new Date()]
                                    },
                                }
                            }
                        },
                        messageList: {
                            $slice: [  // để giới hạn kết quả trả về 
                                {
                                    $filter: {
                                        input: "$messageList",
                                        as: "messagelist",
                                        cond: {
                                            $lte: ["$$messagelist.createAt", new Date()]  // nhỏ hơn hiện tại và là tin nhắn cuối 
                                        },
                                    }
                                },
                                -1
                            ]
                        },
                        memberList: 1,
                        isGroup: 1,
                        typeGroup: 1,
                        avatarConversation: 1,
                        adminId: 1,
                        shareGroupFromLinkOption: 1,
                        browseMemberOption: 1,
                        pinMessage: 1,
                        timeLastMessage: 1
                    }
                }
            ]).limit(40);

            for (let i = 0; i < conversationGroupStart.length; i++) {
                let a = {};
                let ele = conversationGroupStart[i].memberList.find(e => Number(e.memberId) == userId);
                if (ele && (Number(ele.memberId) == userId) && (removeVietnameseTones(ele.conversationName).toLowerCase().includes(removeVietnameseTones(findword).toLowerCase()))) {
                    if (conversationGroupStart[i] && conversationGroupStart[i]._id && conversationGroupStart[i].messageList && conversationGroupStart[i].messageList.length && (conversationGroupStart[i].messageList.length > 0)) {
                        a.conversationId = conversationGroupStart[i]._id;
                        a.companyId = 0;
                        a.conversationName = ele.conversationName;
                        a.unReader = ele.unReader; // lay tu account 
                        a.isGroup = conversationGroupStart[i].isGroup;
                        a.senderId = conversationGroupStart[i].messageList[0].senderId;
                        a.pinMessageId = conversationGroupStart[i].pinMessage;
                        a.messageId = conversationGroupStart[i].messageList[0]._id;
                        a.message = conversationGroupStart[i].messageList[0].message;
                        a.messageType = conversationGroupStart[i].messageList[0].messageType;
                        a.createAt = conversationGroupStart[i].messageList[0].createAt;
                        a.countMessage = conversationGroupStart[i].countMessage; //total
                        a.messageDisplay = conversationGroupStart[i].messageList[0].displayMessage;
                        a.typeGroup = conversationGroupStart[i].typeGroup;
                        a.adminId = conversationGroupStart[i].adminId;
                        a.shareGroupFromLink = conversationGroupStart[i].shareGroupFromLinkOption;
                        a.memberList = null;
                        a.browseMember = conversationGroupStart[i].browseMemberOption;
                        a.isFavorite = ele.isFavorite;
                        a.notification = ele.notification;
                        a.isHidden = ele.isHidden;
                        a.deleteTime = ele.deleteTime;
                        a.deleteType = ele.deleteType;
                        a.listMess = 0;
                        if (String(conversationGroupStart[i].avatarConversation) !== "") {
                            a.linkAvatar = `${urlImgHost()}avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`
                        }
                        else {
                            let t = getRandomInt(1, 4);
                            if (ele.conversationName.trim() != "") {
                                a.linkAvatar = `${urlImgHost()}avatar/${removeVietnameseTones(ele.conversationName[0]).toUpperCase()}_${t}.png`
                            }
                            else {
                                a.linkAvatar = `${urlImgHost()}avatar/${ele.conversationName[0]}_${t}.png`
                            }
                        };
                        a.avatarConversation = a.linkAvatar;
                        a.listBrowerMember = conversationGroupStart[i].browseMemberList;
                        a.listMember = conversationGroupStart[i].memberList;
                        a.listMessage = null
                        conversationGroup.push(a)
                    }
                }
            }
            res.status(200).json({
                data: {
                    "result": true,
                    "message": "Lấy danh sách cuộc trò chuyện thành công",
                    "conversation": null,
                    "countConversation": conversationGroup.length,
                    "conversation_info": null,
                    "user_list": null,
                    message: "Lấy thông tin thành công",
                    listCoversation: conversationGroup
                },
                error: null
            });
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const FindUserAppCompanyRandom = async (req, res, next) => {
    if (req.body.token) {
        let check = await checkToken(req.body.token);
        if (check && check.status && (check.userId == req.body.ID)) {
            console.log("Token hop le, FindUserAppCompanyRandom")
        }
        else {
            return res.status(404).json(createError(404, "Invalid token"));
        }
    }
    console.log("FindUserAppCompanyRandom", req.body)
    try {
        if (req.body && req.body.ID && Number(req.body.ID) && Number(req.body.CompanyID)) {
            const userId = Number(req.body.ID);
            if (req.body.ConversationId && (!isNaN(req.body.ConversationId))) {
                let ListRequestContact = await Contact.find({
                    $or: [
                        { userFist: userId },
                        { userSecond: userId }
                    ]
                }).limit(200).lean();
                let ListRequestContact2 = await RequestContact.find({
                    $or: [
                        { userId: userId },
                        { contactId: userId }
                    ]
                }).limit(200).lean();
                let arrayUserIdAvoid = [];
                let conversation = await Conversation.findOne({ _id: Number(req.body.ConversationId) }, { "memberList.memberId": 1 }).lean();
                if (conversation && conversation.memberList) {
                    for (let i = 0; i < conversation.memberList.length; i++) {
                        arrayUserIdAvoid.push(conversation.memberList[i].memberId);
                    }

                    let listUserFirstCompany = await User.find({ _id: { $nin: arrayUserIdAvoid }, companyId: Number(req.body.CompanyID) }).lean();
                    let resultCompany = [];
                    for (let i = 0; i < listUserFirstCompany.length; i++) {
                        let a = {}
                        a["id"] = listUserFirstCompany[i]._id;
                        a["email"] = listUserFirstCompany[i].email;
                        a["userName"] = listUserFirstCompany[i].userName;
                        a["status"] = listUserFirstCompany[i].status;
                        a["active"] = listUserFirstCompany[i].active;
                        a["isOnline"] = listUserFirstCompany[i].isOnline;
                        a["looker"] = listUserFirstCompany[i].looker;
                        a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                        a["lastActive"] = listUserFirstCompany[i].lastActive;
                        if (listUserFirstCompany[i].avatarUser != "") {
                            a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                        }
                        else {
                            a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                        }
                        a["avatarUser"] = a["linkAvatar"];
                        a["companyId"] = listUserFirstCompany[i].companyId;
                        a["type365"] = listUserFirstCompany[i].type365;

                        let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == a["id"]) || (e.userId == a["id"] && e.contactId == userId));
                        if (requestContact2) {
                            if (requestContact2.status == "accept") {
                                a["friendStatus"] = "friend";
                            }
                            else {
                                a["friendStatus"] = requestContact2.status;
                                if (requestContact2.status == "send") {
                                    if (requestContact2.userId != userId) {
                                        a["friendStatus"] = "request"
                                    }
                                }
                            }
                        }
                        else {
                            a["friendStatus"] = "none";
                        }
                        let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == a["id"]) || (e.userFist == a["id"] && e.userSecond == userId));
                        if (requestContact && requestContact._id) {
                            a["friendStatus"] = "friend";
                        }
                        //a["friendStatus"] = "none";
                        resultCompany.push(a);
                    }

                    // secondnormal 
                    res.status(200).json({
                        data: {
                            result: false,
                            message: null,
                            userName: null,
                            countConversation: 0,
                            conversationId: 0,
                            total: 0,
                            currentTime: 0,
                            listUserOnline: null,
                            user_info: null,
                            user_list: resultCompany
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json(createError(200, "Khong tim thay cuoc tro chuyen"));
                }
            }
            else {
                let ListRequestContact = await Contact.find({
                    $or: [
                        { userFist: userId },
                        { userSecond: userId }
                    ]
                }).limit(200).lean();
                let ListRequestContact2 = await RequestContact.find({
                    $or: [
                        { userId: userId },
                        { contactId: userId }
                    ]
                }).limit(200).lean();
                let listUserFirstCompany = await User.find({ companyId: Number(req.body.CompanyID) }).lean();
                let resultCompany = [];
                for (let i = 0; i < listUserFirstCompany.length; i++) {
                    let a = {}
                    a["id"] = listUserFirstCompany[i]._id;
                    a["email"] = listUserFirstCompany[i].email;
                    a["userName"] = listUserFirstCompany[i].userName;
                    a["status"] = listUserFirstCompany[i].status;
                    a["active"] = listUserFirstCompany[i].active;
                    a["isOnline"] = listUserFirstCompany[i].isOnline;
                    a["looker"] = listUserFirstCompany[i].looker;
                    a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
                    a["lastActive"] = listUserFirstCompany[i].lastActive;
                    if (listUserFirstCompany[i].avatarUser != "") {
                        a["linkAvatar"] = `${urlImgHost()}avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
                    }
                    else {
                        a["linkAvatar"] = `${urlImgHost()}avatar/${listUserFirstCompany[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    a["avatarUser"] = a["linkAvatar"];
                    a["companyId"] = listUserFirstCompany[i].companyId;
                    a["type365"] = listUserFirstCompany[i].type365;
                    let requestContact2 = ListRequestContact2.find((e) => (e.userId == userId && e.contactId == a["id"]) || (e.userId == a["id"] && e.contactId == userId));
                    if (requestContact2) {
                        if (requestContact2.status == "accept") {
                            a["friendStatus"] = "friend";
                        }
                        else {
                            a["friendStatus"] = requestContact2.status;
                            if (requestContact2.status == "send") {
                                if (requestContact2.userId != userId) {
                                    a["friendStatus"] = "request"
                                }
                            }
                        }
                    }
                    else {
                        a["friendStatus"] = "none";
                    }
                    let requestContact = ListRequestContact.find((e) => (e.userFist == userId && e.userSecond == a["id"]) || (e.userFist == a["id"] && e.userSecond == userId));
                    if (requestContact && requestContact._id) {
                        a["friendStatus"] = "friend";
                    }
                    //a["friendStatus"] = "none";
                    resultCompany.push(a);
                }

                // secondnormal 
                res.status(200).json({
                    data: {
                        result: false,
                        message: null,
                        userName: null,
                        countConversation: 0,
                        conversationId: 0,
                        total: 0,
                        currentTime: 0,
                        listUserOnline: null,
                        user_info: null,
                        user_list: resultCompany
                    },
                    error: null
                });
            }

        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const setupBase = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, setupBase")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let listUser = await User.find({}, { userName: 1 }).lean();
        for (let i = 0; i < listUser.length; i++) {
            console.log(removeVietnameseTones(listUser[i].userName))
            let update = await User.updateOne({ _id: Number(listUser[i]._id) }, { $set: { userNameNoVn: removeVietnameseTones(listUser[i].userName) } }).lean()
            if (update) {
                console.log("update thành công")
            }
        }
        res.json("update thành công")
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// nhãn dán phân loại user 
export const CreateClassUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, CreateClassUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.NameClass && req.body.IdOwner && req.body.Color && Number(req.body.IdOwner)
            && req.body.listUserId && (String(req.body.listUserId).includes("["))
        ) {
            let listUserId = [];
            let dataReceived = req.body;
            // xử lý dữ liệu mảng truyền lên dạng form-data hoặc json.
            if (dataReceived.listUserId.includes("[")) {
                let StringListUserId = dataReceived.listUserId;
                StringListUserId = StringListUserId.replace("[", "");
                StringListUserId = StringListUserId.replace("]", "");
                let listUserIdString = StringListUserId.split(",");
                for (let i = 0; i < listUserIdString.length; i++) {
                    if (Number(listUserIdString[i])) {
                        listUserId.push(Number(listUserIdString[i]))
                    }
                }
            }
            else if (dataReceived.listUserId.length && dataReceived.listUserId.length > 0) {
                for (let i = 0; i < dataReceived.listUserId.length; i++) {
                    // đảm bảo các phần tử trong mảng userId đều là số
                    if (Number(dataReceived.listUserId[i])) {
                        listUserId.push(Number(dataReceived.listUserId[i]))
                    }
                }
            }
            else {
                listUserId = [];
            }

            // kiểm tra xem user đã tạo nhãn dán này trc đo hay chưa 
            UsersClassified.find({ IdOwner: Number(dataReceived.IdOwner), NameClass: String(dataReceived.NameClass) }).then((UsersClassifieds) => {
                if (UsersClassifieds.length > 0) {
                    return res.json({
                        data: {
                            result: false,
                            classInfor: UsersClassifieds[0]
                        },
                        error: "Trước đó bạn đã tạo nhãn dán này"
                    })
                }
                else {
                    let newUsersClassified = new UsersClassified({
                        NameClass: String(req.body.NameClass),
                        IdOwner: Number(req.body.IdOwner),
                        Color: String(req.body.Color),
                        listUserId: listUserId
                    })
                    newUsersClassified.save().then((UsersClassified) => {
                        if (UsersClassified) {
                            return res.status(200).json({
                                data: {
                                    result: true,
                                    message: "Thêm dữ liệu thành công",
                                    UsersClassified,
                                },
                                error: null
                            });
                        }
                        else {
                            return res.status(200).json({
                                data: null,
                                error: "Thêm dữ liệu không thành công"
                            });
                        }
                    })
                }
            })
        } else {
            res.status(200).json({
                data: null,
                error: "Thông tin truyền lên không đaayf đủ"
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const FindUserClass = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, FindUserClass")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.idClass && req.body.userId) {
            const findWord = req.body.findWord
            const idClass = req.body.idClass

            const findwordNoVN = removeVietnameseTones(findWord);
            const classUser = await UsersClassified.findOne({ _id: idClass }).lean()
            if (classUser) {
                const listUserId = classUser.listUserId
                let user = await User.find({ _id: { $in: listUserId }, userNameNoVn: new RegExp(findwordNoVN, 'i') }, { _id: 1, userName: 1, avatarUser: 1, companyId: 1 }).limit(200).lean()
                if (user) {
                    for (let i = 0; i < user.length; i++) {
                        if (user[i].avatarUser !== '') {
                            user[i].avatarUser = `${urlImgHost()}avatarUser/${user[i]._id}/${user[i].avatarUser}`
                        }
                        else {
                            user[i].avatarUser = `${urlImgHost()}avatar/${user[i].userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        }
                        user[i].linkAvatar = user[i].avatarUser
                        user[i].id = user[i]._id
                    }
                }
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Tìm kiếm thành công",
                        user_list: user,
                    },
                    error: null
                });
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const SendManyMesByClassId = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.SenderID)) {
                console.log("Token hop le, SendManyMesByClassId")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.SenderID && (!isNaN(req.body.SenderID)) && req.body.IdClass) {
            let listUserId = [];
            let dataReceived = req.body;

            let classUser = await UsersClassified.findOne({ _id: String(req.body.IdClass) }).lean(); // findOne không tìm thấy thì không đi vào try catch 
            if (classUser) {
                if (classUser.IdOwner) {
                    if (classUser.IdOwner == req.body.SenderID) {
                        listUserId = classUser.listUserId;
                        let listConversationId = [];
                        let listConversationIdFist = [];
                        listConversationIdFist = await Promise.all(
                            listUserId.map((userId) => {
                                return axios({
                                    method: "post",
                                    url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
                                    data: {
                                        userId: Number(req.body.SenderID),
                                        contactId: Number(userId)
                                    },
                                    headers: { "Content-Type": "multipart/form-data" }
                                });
                            })
                        )

                        for (let i = 0; i < listConversationIdFist.length; i++) {
                            if (!isNaN(listConversationIdFist[i].data.data.conversationId)) {
                                listConversationId.push(Number(listConversationIdFist[i].data.data.conversationId))
                            }
                        }
                        const list = await Promise.all( // send liên tục => tối ưu performance 
                            listConversationId.map((ConversationId) => {
                                return axios({
                                    method: "post",
                                    url: "http://43.239.223.142:9000/api/message/SendMessage",
                                    data: {
                                        ConversationID: Number(ConversationId),
                                        SenderID: dataReceived.SenderID,
                                        MessageType: dataReceived.MessageType,
                                        Message: dataReceived.Message,
                                        Quote: dataReceived.Quote,
                                        Profile: dataReceived.Profile,
                                        ListTag: dataReceived.ListTag,
                                        File: dataReceived.File,
                                    },
                                    headers: { "Content-Type": "multipart/form-data" }
                                })
                            })
                        );
                        if (list) {
                            if (list.length && list.length > 0) {
                                res.json({
                                    data: {
                                        result: true,
                                        message: "Gửi thành công",
                                        countMessage: list.length
                                    },
                                    error: null
                                })
                            }
                            else {
                                res.status(200).json(createError(200, "Gửi tin nhắn không thành công"));
                            }
                        }
                    }
                    else {
                        res.status(200).json(createError(200, "Bạn không thể gửi tin nhắn đồng thời với nhãn dán này"));
                    }
                }
                else {
                    res.status(200).json(createError(200, "Không tìm thấy nhãn dán phù hợp"));
                }
            }
            else {
                res.status(200).json(createError(200, "Không tìm thấy nhãn dán phù hợp"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const SendMesListUserId = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.SenderId)) {
                console.log("Token hop le, SendMesListUserId")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.SenderID && (!isNaN(req.body.SenderID)) && req.body.ListUserId && req.body.Message) {
            let listUserId = req.body.ListUserId.replace('[', '').replace(']', '').split(',')
            const SenderID = Number(req.body.SenderID)
            const Message = req.body.Message

            let listConversationId = [];
            let listConversationIdFist = [];
            listConversationIdFist = await Promise.all(
                listUserId.map((userId) => {
                    return axios({
                        method: "post",
                        url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
                        data: {
                            userId: Number(req.body.SenderID),
                            contactId: Number(userId)
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                })
            )
            for (let i = 0; i < listConversationIdFist.length; i++) {
                if (!isNaN(listConversationIdFist[i].data.data.conversationId)) {
                    listConversationId.push(Number(listConversationIdFist[i].data.data.conversationId))
                }
            }
            const list = await Promise.all( // send liên tục => tối ưu performance 
                listConversationId.map((ConversationId) => {
                    return axios({
                        method: "post",
                        url: "http://43.239.223.142:9000/api/message/SendMessage",
                        data: {
                            ConversationID: Number(ConversationId),
                            SenderID: SenderID,
                            MessageType: 'text',
                            Message: Message,
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    })
                })
            );
            if (list) {
                if (list.length && list.length > 0) {
                    res.json({
                        data: {
                            result: true,
                            message: "Gửi thành công",
                            countMessage: list.length
                        },
                        error: null
                    })
                }
                else {
                    res.status(200).json(createError(200, "Gửi tin nhắn không thành công"));
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// nhãn dán phân loại user 
export const AddUserToManyClass = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, CreateClassUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.userId && req.body.ArrayClassId) {
            let ArrClass = ConvertToArrayString(req.body.ArrayClassId);
            let listClassNotAllow = await UsersClassified.find({
                $and: [
                    { _id: { $in: ArrClass } },
                    { listUserId: Number(req.body.userId) }
                ]
            }, { _id: 1 }).lean();
            let listClassAllow = [];
            for (let i = 0; i < ArrClass.length; i++) {
                if (!listClassNotAllow.find((e) => String(e) === String(ArrClass[i]))) {
                    listClassAllow.push(ArrClass[i]);
                }
            }
            await UsersClassified.updateMany({ _id: { $in: listClassAllow } }, { $push: { listUserId: Number(req.body.userId) } });
            res.status(200).json({
                data: {
                    result: true,
                    message: "Updated succesfully"
                },
                error: null
            });
        } else {
            res.status(200).json({
                data: null,
                error: "Thông tin truyền lên không đaayf đủ"
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// Thêm người vào loại sẵn có
// dùng promise gây chết server 
export const InsertUserToClassUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, InsertUserToClassUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.IdClass && String(req.body.IdClass) && req.body.ArrayUserId && (String(req.body.ArrayUserId).includes("["))) {
            let listUserId = [];
            let dataReceived = req.body;
            // xử lý dữ liệu mảng truyền lên dạng form-data hoặc json.
            if (dataReceived.ArrayUserId.includes("[")) {
                let StringListUserId = dataReceived.ArrayUserId;
                StringListUserId = StringListUserId.replace("[", "");
                StringListUserId = StringListUserId.replace("]", "");
                let listUserIdString = StringListUserId.split(",");
                for (let i = 0; i < listUserIdString.length; i++) {
                    if (Number(listUserIdString[i])) {
                        listUserId.push(Number(listUserIdString[i]))
                    }
                }
            }
            else if (dataReceived.ArrayUserId.length && dataReceived.ArrayUserId.length > 0) {
                for (let i = 0; i < dataReceived.listUserId.length; i++) {
                    // đảm bảo các phần tử trong mảng userId đều là số
                    if (Number(dataReceived.ArrayUserId[i])) {
                        listUserId.push(Number(dataReceived.ArrayUserId[i]))
                    }
                }
            }
            else {
                listUserId = [];
            }
            // đảm bảo mảng unique 

            const updatedUsersClassified1 = await UsersClassified.findByIdAndUpdate(
                String(dataReceived.IdClass),
                { $pull: { listUserId: { $in: listUserId } } },
                { new: true }
            );
            UsersClassified.updateMany(
                { IdOwner: updatedUsersClassified1.IdOwner },
                { $pull: { listUserId: { $in: listUserId } } }
            ).catch((e) => { console.log(e) })
            if (updatedUsersClassified1) {
                const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
                    String(dataReceived.IdClass),
                    { $push: { listUserId: { $each: listUserId } } },
                    { new: true }
                );
                if (updatedUsersClassified) {
                    res.status(200).json({
                        data: {
                            result: true,
                            message: "Thêm dữ liệu thành công",
                            updatedUsersClassified,
                        },
                        error: null
                    })
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// xóa user khỏi nhãn dán 
export const DeleteUserFromClassUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, DeleteUserFromClassUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.IdClass && String(req.body.IdClass) && req.body.ArrayUserId && (String(req.body.ArrayUserId).includes("["))) {
            let listUserId = [];
            let dataReceived = req.body;
            // xử lý dữ liệu mảng truyền lên dạng form-data hoặc json.
            if (dataReceived.ArrayUserId.includes("[")) {
                let StringListUserId = dataReceived.ArrayUserId;
                StringListUserId = StringListUserId.replace("[", "");
                StringListUserId = StringListUserId.replace("]", "");
                let listUserIdString = StringListUserId.split(",");
                for (let i = 0; i < listUserIdString.length; i++) {
                    if (Number(listUserIdString[i])) {
                        listUserId.push(Number(listUserIdString[i]))
                    }
                }
            }
            else if (dataReceived.ArrayUserId.length && dataReceived.ArrayUserId.length > 0) {
                for (let i = 0; i < dataReceived.listUserId.length; i++) {
                    // đảm bảo các phần tử trong mảng userId đều là số
                    if (Number(dataReceived.ArrayUserId[i])) {
                        listUserId.push(Number(dataReceived.ArrayUserId[i]))
                    }
                }
            }
            else {
                listUserId = [];
            }
            const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
                String(dataReceived.IdClass),
                { $pull: { listUserId: { $in: listUserId } } },
                { new: true }
            );
            if (updatedUsersClassified) {
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Xóa user khỏi nhóm nhãn dán thành công",
                        updatedUsersClassified,
                    },
                    error: null
                })
            } else {
                res.status(200).json({
                    data: null,
                    error: "upload failed"
                })
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// lấy danh sách user thuộc 1 nhãn dán 
export const GetListUserByClassUserAndUserOwner = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetListUserByClassUserAndUserOwner")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.IdClass) {
            let classUser = await UsersClassified.findOne({ _id: String(req.body.IdClass) }).lean();
            if (classUser) {
                if (classUser._id) {
                    let listUserId = classUser.listUserId;
                    let arrayUserDetail = await User.find({ _id: { $in: listUserId } }, { userName: 1, avatarUser: 1 }).lean();
                    let listUserDetailFinal = [];
                    for (let i = 0; i < arrayUserDetail.length; i++) {
                        let a = arrayUserDetail[i];
                        if (a.avatarUser != "") {
                            a["avatarUser"] = `${urlImgHost()}avatarUser/${arrayUserDetail[i]._id}/${arrayUserDetail[i].avatarUser}`;
                        }
                        else {
                            let t = getRandomInt(1, 4);
                            a["avatarUser"] = `${urlImgHost()}avatarUser/${arrayUserDetail[i].userName[0]}_${t}.png`;
                        };
                        listUserDetailFinal.push(a);
                    }
                    res.status(200).json({
                        data: {
                            result: true,
                            message: "Lấy danh sách user thành công",
                            listUserDetailFinal,
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json(createError(200, "Không tìm thấy loại nhãn dán phù hợp"));
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// kiểm tra xem 1 user này thuộc class nào 
export const CheckClassUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, CheckClassUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.HostId && req.body.UserIdCheck && Number(req.body.HostId) && Number(req.body.UserIdCheck)) {
            let classUsers = await UsersClassified.find({ IdOwner: Number(req.body.HostId), listUserId: Number(req.body.UserIdCheck) }, { NameClass: 1, Color: 1 }).lean();
            res.status(200).json({
                data: {
                    result: true,
                    message: "Lấy danh sách user thành công",
                    classUsers,
                },
                error: null
            });
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// lấy danh sách nhãn dán của 1 user
export const GetListClassOfOneUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetListClassOfOneUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.HostId && Number(req.body.HostId)) {
            let classUsers = await UsersClassified.find({ IdOwner: Number(req.body.HostId) }, { NameClass: 1, Color: 1 }).lean();
            res.status(200).json({
                data: {
                    result: true,
                    message: "Lấy danh sách user thành công",
                    classUsers,
                },
                error: null
            });
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const EditClassUserName = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, EditClassUserName")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.IdClass && req.body.content) {
            const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
                String(req.body.IdClass),
                { $set: { NameClass: req.body.content } },
                { new: true }
            );
            if (updatedUsersClassified) {
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Sửa tên nhãn dán thành công",
                        updatedUsersClassified,
                    },
                    error: null
                });
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const EditClassUserColor = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, EditClassUserColor")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.IdClass && req.body.Color) {
            const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
                String(req.body.IdClass),
                { $set: { Color: req.body.Color } },
                { new: true }
            );
            if (updatedUsersClassified) {
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Sửa màu nhãn dán thành công",
                        updatedUsersClassified,
                    },
                    error: null
                });
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}



export const EditClass = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, EditClassUserColor")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.IdClass) {
            const check_class = await UsersClassified.find(
                {
                    IdOwner: Number(req.body.IdOwner),
                    _id: { $ne: req.body.IdClass }
                },
                {
                    NameClass: 1
                }).lean()
            if (check_class && check_class.find(ele => ele.NameClass === req.body.NameClass)) {
                return res.status(200).json(createError(200, "Tên Class đã tồn tại"));
            }
            await UsersClassified.updateMany(
                {
                    listUserId: { $in: ConvertToArrayNumber(req.body.listUserId) }
                },
                {
                    $pull: {
                        listUserId: { $in: ConvertToArrayNumber(req.body.listUserId) }
                    }
                },
            );
            await UsersClassified.updateOne(
                {
                    _id: String(req.body.IdClass),
                    IdOwner: Number(req.body.IdOwner)
                },
                {
                    $set: {
                        Color: req.body.Color,
                        NameClass: req.body.NameClass,
                        listUserId: ConvertToArrayNumber(req.body.listUserId)
                    }
                },
            );
            return res.status(200).json({
                data: {
                    result: true,
                    message: "Updated successfully",
                },
                error: null
            });
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
// xác định 1 list user thuộc loại nhãn dán, thẻ nào 
// nếu 1 user có nhiều nhãn dán => chỉ lấy 1 loại nhãn dán 
export const VerifyClassArrayUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, VerifyClassArrayUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.HostId && req.body.ArrayUserId && (String(req.body.ArrayUserId).includes("["))) {
            let info = [];
            if (!req.body.ArrayUserId.includes("[")) {
                info = req.body.ArrayUserId;
            }
            else {
                let string = String(req.body.ArrayUserId).replace("[", "");
                string = String(string).replace("]", "");
                let info1 = string.split(",");
                for (let i = 0; i < info1.length; i++) {
                    if (Number(info1[i])) {
                        info.push(info1[i]);
                    }
                }
            }
            let ListClass = await UsersClassified.find(
                {
                    IdOwner: Number(req.body.HostId),
                    listUserId: { $in: info }
                }
            ).lean();
            let listUserFinal = [];
            for (let i = 0; i < info.length; i++) {
                if (ListClass.find(e => e.listUserId.includes(info[i]))) {
                    let a = {};
                    a.userId = info[i];
                    a.Color = ListClass.find(e => e.listUserId.includes(a.userId)).Color;
                    a.NameClass = ListClass.find(e => e.listUserId.includes(a.userId)).NameClass;
                    a.IdClass = ListClass.find(e => e.listUserId.includes(a.userId))._id;
                    listUserFinal.push(a)
                }
            }
            res.json(listUserFinal)
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// xóa nhẫn dán
export const DeleteClassUser = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, DeleteClassUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.IdClass) {
            const DeletedUsersClassified = await UsersClassified.deleteOne({ _id: String(req.body.IdClass) });
            if (DeletedUsersClassified) {
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Xóa nhãn dán thành công",
                    },
                    error: null
                });
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdatePhoneNumber = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.UserId)) {
                console.log("Token hop le, UpdatePhoneNumber")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && Number(req.body.UserId) && req.body.Phone && Number(req.body.Phone)) {
            const UserUpdate = await User.findByIdAndUpdate(
                Number(req.body.UserId),
                { $set: { phone: String(req.body.Phone) } },
                { new: true }
            );
            if (UserUpdate) {
                res.json({
                    data: {
                        result: true,
                        message: "Cập nhật thông tin người dùng thành công",
                        user_info: {
                            id: UserUpdate._id,
                            phone: UserUpdate.phone
                        }
                    },
                    error: null
                })
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//Lay id chat 365
// lay id chat 
export const GetIdChat365 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetIdChat365")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const email = req.body.Email;
        const id365 = Number(req.body.ID365);
        const type365 = Number(req.body.Type365);
        const user = await User.find(
            {
                $or: [
                    { email: email, type365: type365 },
                    { id365: id365, type365: type365 }
                ]
            },
            { id365: 1 }
        ).lean();
        if (!user) return res.send(createError(200, "Tài khoản không tồn tại"))
        if (!user.length) return res.send(createError(200, "Tài khoản không tồn tại"))
        if (Number(user[0].id365) != id365) {
            User.updateOne({ _id: user[0]._id }, { $set: { id365: id365 } }).catch((e) => { console.log(e) })
        }
        if (req.body.idTimViec) {
            User.updateOne({ _id: user[0]._id }, { $set: { idTimViec: Number(req.body.idTimViec) } }).catch((e) => { console.log(e) })
        }
        const data = {
            result: true,
            message: user[0]._id,
        }
        return res.send({ data, error: null })
    } catch (err) {
        console.log(err)
        if (err)
            return res.send(createError(200, err.message))
    }
}

//Lay ten tai khoan
export const GetUserName = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetUserName")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const ID = Number(req.body.ID);
        if (ID == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"));
        }
        const userName = await User.findById(ID).select("userName").lean();
        if (!userName) {
            return res.send(createError(200, "Id không tồn tại"));
        }
        const data = {
            result: true,
            message: null,
            ...userName,
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//Lay danh sach ket ban gui di
export const GetListRequest = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetListRequest")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const ID = Number(req.body.ID);
        if (ID == null) {
            return res.send("Thiếu thông tin truyền lên");
        }
        let listRequestContact = await RequestContact.find(
            { $or: [{ userId: ID }, { contactId: ID }] },
            { _id: 0, userId: 1, contactId: 1, status: 1, type365: 1 }
        ).limit(100).lean()
        if (!listRequestContact.length) {
            return res.send(createError(200, "User không có lời mời nào"));
        }
        let listReqCon = listRequestContact.map(e => {
            if (e.contactId === ID && e.status === "send") {
                e = {
                    userId: e.contactId,
                    contactId: e.userId,
                    status: "request",
                    type365: e.type365
                }
            }
            if (e.contactId === ID && e.status === "request") {
                e = {
                    userId: e.contactId,
                    contactId: e.userId,
                    status: "send",
                    type365: e.type365
                }
            }
            return e
        })
        return res.send({
            data: {
                result: true,
                message: null,
                listRequestContact: listReqCon
            },
            error: null
        });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};
//Lay danh sach ket ban nhan
export const GetListRequestFriend = async (req, res) => {
    try {
        const ID = Number(req.body.ID);
        if (ID == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"));
        }
        const listReqFr = await RequestContact.aggregate([
            {
                $match: {
                    contactId: ID,
                },
            },
            { $limit: 100 },
            {
                $lookup: {
                    from: "Users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: {
                    path: "$user",
                },
            },
            {
                $project: {
                    _id: 0,
                    id: "$userId",
                    userName: "$user.userName",
                    avatar: "$user.avatarUser",
                    status: 1,
                    type365: 1,
                },
            },

        ]);
        if (!listReqFr.length) {
            return res.send(createError(200, "User không có lời mời nào"));
        }
        const listRequestFriend = listReqFr.map((e) => {
            e.avatar = e.avatar
                ? `${urlImgHost()}avatarUser/${e.id}/${e.avatar}.jpg`
                : `${urlImgHost()}avatar/${e.userName
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            return (e = { ...e });
        });
        const data = {
            result: true,
            message: null,
            listRequestFriend,
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};
//------------------------------------------------------------------------------------THANG-------------------------------------------------------------------------------------
//Gui loi moi ket ban
// export const AddFriend = async (req, res) => {
//   try {
//   const userId = Number(req.body.userId);
//   const contactId = Number(req.body.contactId);
//   const type365 = Number(req.body.type365) || 0;
//   if (userId == null || contactId == null) {
//   return res.send(createError(200, "Thiếu thông tin truyền lên"));
//   }
//   const reqContact = await RequestContact.findOne({
//   $or: [
//   {
//   userId: userId,
//   contactId: contactId,
//   },
//   {
//   userId: contactId,
//   contactId: userId,
//   },
//   ],
//   });
//   if (reqContact) {
//   return res.send(createError(200, "User đã tồn tại lời mời"));
//   }
//   const newContact = await RequestContact.create({
//   userId: userId,
//   contactId: contactId,
//   status: "send",
//   type365: type365,
//   });
//   const con = await Conversation.findOne({
//   isGroup: 0,
//   "memberList.memberId": { $all: [contactId, userId] },
//   memberList: { $size: 2 },
//   });
//   const data = {
//   result: true,
//   message: "Gửi lời mời kết bạn thành công",
//   conversationId: con._id,
//   };
//   return res.send({ data, error: null });
//   } catch (err) {
//   console.log(err);
//   if (err) return res.send(createError(200, err.message));
//   }
//   };
export const AddFriend = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, AddFriend")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId);
        const contactId = Number(req.body.contactId);
        const type365 = Number(req.body.type365) || 0;
        if (userId == null || contactId == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"));
        }
        const reqContact = await RequestContact.findOne({
            $or: [
                {
                    userId: userId,
                    contactId: contactId,
                },
                {
                    userId: contactId,
                    contactId: userId,
                },
            ],
        }).lean();
        if (reqContact) {
            if (reqContact.status == 'deciline') {
                await RequestContact.deleteOne({ _id: reqContact._id });
            }
            else {
                return res.send(createError(200, "User đã tồn tại lời mời"));
            }
        }
        await RequestContact.create({
            userId: userId,
            contactId: contactId,
            status: "send",
            type365: type365,
        });
        const con = await Conversation.findOne({
            isGroup: 0,
            "memberList.memberId": { $all: [contactId, userId] },
            memberList: { $size: 2 },
        }).lean();
        const user = await User.findOne({ _id: userId }, { userName: 1, id365: 1 }).lean()
        await axios({
            method: "post",
            url: "http://43.239.223.142:9000/api/V2/Notification/SendNotification_v2",
            data: {
                'Title': `${user.userName} đã gửi cho bạn 1 lời mời kết bạn`,
                'Type': "tag",
                'UserId': contactId,
                'SenderId': userId,
                'ConversationId': con._id
            },
            headers: { "Content-Type": "multipart/form-data" }
        })
        const data = {
            result: true,
            message: "Gửi lời mời kết bạn thành công",
            conversationId: con._id,
        }
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
}
//Xoa lien he
export const DeleteContact = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, DeleteContact")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId);
        const contactId = Number(req.body.contactId);
        const contact = await Contact.deleteMany({
            $or: [
                { userFist: userId, userSecond: contactId },
                { userSecond: userId, userFist: contactId },
            ],
        });
        const reqCount = await RequestContact.deleteMany({
            $or: [
                { userId: userId, contactId: contactId },
                { userId: contactId, contactId: userId },
            ],
        });
        if (contact.deletedCount === 0 && reqCount.deletedCount === 0) {
            return res.send(createError(200, "xóa liên hệ thất bại"));
        }
        const data = {
            result: true,
            message: "xóa liên hệ thành công",
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError, err.message);
    }
};
//Chap nhan loi moi

export const AcceptRequestAddFriend = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, AcceptRequestAddFriend")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId);
        const contactId = Number(req.body.contactId);
        if (userId == null || contactId == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"));
        }
        const query = {
            userId: contactId,
            contactId: userId,
            status: { $ne: "accept" },
        };
        const update = { status: "accept" };
        const reqContact = await RequestContact.findOneAndUpdate(query, update);
        // if (!reqContact) {
        //   return res.send(createError(200, "Lời mời không tồn tại"));
        // }
        await Contact.create({ userFist: userId, userSecond: contactId })
        const userName = (await User.findOne({ _id: userId }, { userName: 1 }).lean()).userName
        const contactName = (await User.findOne({ _id: contactId }, { userName: 1 }).lean()).userName
        let createConversation = await axios({
            method: "post",
            url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
            data: {
                'userId': contactId,
                'contactId': userId
            },
            headers: { "Content-Type": "multipart/form-data" }
        })
        await axios({
            method: "post",
            url: "http://43.239.223.142:9000/api/message/SendMessage",
            data: {
                'ConversationID': createConversation.data.data.conversationId,
                'SenderID': userId,
                'MessageType': "notification",
                'Message': `${userName} đã chấp nhận lời mời kết bạn của bạn`,
            },
            headers: { "Content-Type": "multipart/form-data" }
        })
        await axios({
            method: "post",
            url: "http://43.239.223.142:9000/api/V2/Notification/SendNotification_v2",
            data: {
                'Title': `${userName} đã chấp nhận lời mời kết bạn của bạn`,
                'Type': "tag",
                'UserId': contactId,
                'SenderId': userId,
                'ConversationId': Number(createConversation.data.data.conversationId)
            },
            headers: { "Content-Type": "multipart/form-data" }
        })
        const data = {
            result: true,
            reqContact,
            message: "Châp nhận lời mời thành công",
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) {
            return res.send(createError(200, err.message));
        }
    }
}
//Tu choi loi moi
export const DecilineRequestAddFriend = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, DecilineRequestAddFriend")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId);
        const contactId = Number(req.body.contactId);
        if (userId == null || contactId == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"));
        }
        const query = {
            userId: contactId,
            contactId: userId,
            status: { $ne: "deciline" },
        };
        const update = { status: "deciline" };
        const reqContact = await RequestContact.findOneAndUpdate(query, update);
        if (!reqContact) {
            return res.send(createError(200, "Lời mời không tồn tại"));
        }
        const data = {
            result: true,
            message: "Từ chối lời mời thành công",
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) {
            return res.send(createError(200, err.message));
        }
    }
};
//Xoa loi moi
export const DeleteRequestAddFriend = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, DeleteRequestAddFriend")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId);
        const contactId = Number(req.body.contactId);
        if (userId == null || contactId == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"));
        }
        const query = {
            userId: userId,
            contactId: contactId,
        };
        const reqContact = await RequestContact.findOneAndDelete(query);
        if (!reqContact) {
            return res.send(createError(200, "Lời mời không tồn tại"));
        }
        const data = {
            result: true,
            message: "Xóa lời mời thành công",
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) {
            return res.send(createError(200, err.message));
        }
    }
};
//Cap nhat ten
export const UpdateUserName = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, UpdateUserName")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userName = req.body.UserName;
        const id365 = Number(req.body.ID365);
        const type365 = Number(req.body.Type365);
        if (userName == null || id365 == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"))
        }
        const query = {
            id365: id365,
            type365: type365
        }
        const update = {
            userName: userName
        }
        const updateUser = await User.findOneAndUpdate(query, update)
        if (!updateUser) {
            return res.send(createError(200, "Email không tồn tại"))
        }
        const data = {
            result: true,
            message: "Cập nhật tên thành công"
        }
        const content = {
            name: updateUser.userName,
            email: updateUser.email,
            type: updateUser.type365,
            id: updateUser._id,
            pass: updateUser.password
        }
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: qs.stringify(content),
            url: "https://timviec365.vn/api_app/update_tt_chat365.php",
        };
        const ress = await axios(options);
        socket.emit('changeName', updateUser._id, userName)
        return res.send({ data, error: null })
    } catch (err) {
        if (err)
            return res.send(createError(200, err.message))
    }
}

export const UpdatePasswordUser = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, UpdatePasswordUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const password = req.body.Password;
        const id365 = Number(req.body.ID365);
        const type365 = Number(req.body.Type365);
        if (password == null || id365 == null) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"))
        }
        const query = {
            id365: id365,
            type365: type365
        }
        const newPassword = md5(password)
        const update = {
            password: newPassword
        }
        const updateUser = await User.findOneAndUpdate(query, update)
        if (!updateUser) {
            return res.send(createError(200, "Email không tồn tại"))
        }
        const data = {
            result: true,
            message: "Cập nhật mật khẩu thành công"
        }
        const content = {
            email: updateUser.email,
            new_pass: password,
            type: type365
        }
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: content,
            url: "https://chamcong.24hpay.vn/api_chat365/forget_pass.php",
        };
        const ress = await axios(options);
        const ress1 = await axios.post('https://timviec365.vn/api_app/update_tt_chat365.php', qs.stringify({
            'pass': `${String(newPassword)}`,
            'type': type365,
            'email': updateUser.email
        }));
        socket.emit('changedPassword', updateUser._id, newPassword)
        return res.send({ data, error: null })
    } catch (err) {
        if (err)
            console.log(err);
        return res.send(createError(200, err.message))
    }
}

export const ChangePassword = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, ChangePassword")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const id = Number(req.body.ID);
        const email = req.body.Email;
        const oldPassword = req.body.oldPassword;
        const newPassword = req.body.newPassword;
        const hashOldPass = md5(oldPassword);
        const hashNewPass = md5(newPassword);
        if (
            oldPassword == null ||
            id == null ||
            newPassword == null ||
            email == null
        ) {
            return res.send(createError(200, "Thiếu thông tin truyền lên"));
        }
        const data = {
            result: true,
            message: "Cập nhật mật khẩu thành công",
        };
        let user = await User.findOne({
            _id: id,
            password: hashOldPass
        }).lean()
        if (!user) {
            return res.send(createError(400, 'Email không tồn tại hoặc sai mật khẩu cũ'))
        }

        let type365 = user.type365;

        if (type365 !== 0) {
            await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php', qs.stringify({
                'email': email,
                'new_pass': newPassword,
                'type': String(type365)
            }))
        }
        else {
            await axios.post('https://chamcong.24hpay.vn/service/forget_pass_employee.php', qs.stringify({
                'email': email,
                'new_pass': newPassword,
                'from_app': true,
                'otp_code': '123'
            }));
        }
        if (user.idTimViec && user.idTimViec !== 0) {
            await axios.post('https://timviec365.vn/api_app/update_tt_chat365.php', qs.stringify({
                'email': email,
                'pass': newPassword,
                'type': String(type365),
                'id': String(user.id365)
            }))
        }
        const userUpdated = await User.findOneAndUpdate({ _id: id }, { password: hashNewPass })
        if (userUpdated) {
            return res.json({
                data: {
                    result: true,
                    message: 'Cập nhật mật khẩu thành công',
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Cập nhật mật khẩu thất bại"))
        }

        return res.send({ data, error: null });
    } catch (err) {
        if (err) console.log(err);
        return res.send(createError(200, err.message));
    }
};
//------------------------------------------------------------------------------------HAI-------------------------------------------------------------------------------------
//lay thong tin nguoi dung



import crypto from 'crypto'
function encodeDesCBC(textToEncode, keyString, ivString) {
    var key = Buffer.from(keyString, 'utf8');

    var iv = Buffer.from(ivString, 'utf8');
    var cipher = crypto.createCipheriv('des-cbc', key, iv);

    var c = cipher.update(textToEncode, 'utf8', 'base64');
    c += cipher.final('base64');
    return c
}

export const GetInfoUser = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetInfoUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const secretCode = req.body.secretCode;
        let user_info = await User.findById(req.body.ID, {
            _id: 1,
            secretCode: '$chat365_secret',
            avatarUser: 1,
            lastActive: '$lastActivedAt',
            email: { $ifNull: ['$email', '$phoneTK'] },
            userName: 1,
            phone: 1,
            type365: '$type',
            password: 1,
            isOnline: 1,
            id365: '$idQLC',
            companyId: { $ifNull: ['$inForPerson.employee.com_id', '$idQLC'] },
            doubleVerify: '$configChat.doubleVerify',
            fromWeb: 1,
            latitude: 1,
            longtitude: 1,
            status: '$configChat.status',
            active: '$configChat.active',
            idTimViec: '$idTimViec365',
            HistoryAccess: '$configChat.HistoryAccess',
            removeSugges: '$configChat.removeSugges',
            userNameNoVn: '$configChat.userNameNoVn',
            sharePermissionId: '$configChat.sharePermissionId'
        }).lean();
        if (!user_info) {
            return res.send(createError(400, 'Không tồn tại người dùng'))
        }
        let t = getRandomInt(1, 4);
        let arr = [];
        if (user_info) {
            arr.push(user_info._id);
            user_info = user_info;
            const dateConvert = date.format(
                user_info.lastActive,
                "YYYY-MM-DDTHH:mm:ss.SSS+07:00"
            );
            user_info["id"] = user_info._id || -1;
            delete user_info._id;
            if (!user_info.avatarUser) {
                user_info.avatarUser = `${urlImgHost()}avatar/${user_info.userName[0]}_${t}.png`;
                user_info["linkAvatar"] = user_info.avatarUser;
                user_info.lastActive = dateConvert;
            } else {
                user_info.avatarUser = `${urlImgHost()}avatarUser/${user_info.id}/${user_info.avatarUser}`;
                user_info["linkAvatar"] = user_info.avatarUser;
                user_info.lastActive = dateConvert;
            }
            if (secretCode !== process.env.secretCode) {
                user_info.secretCode = null;
            }
            const privacy = await Privacy.findOne({ userId: Number(req.body.ID) }, { seenMessage: 1 })
            user_info["seenMessage"] = (privacy && privacy.seenMessage) ? privacy.seenMessage : 1
        }
        const countConversation = await Conversation.countDocuments({
            $and: [
                {
                    "memberList.memberId": req.body.ID,
                },
                {
                    "messageList.0": {
                        $exists: true,
                    },
                },
            ],
        });
        const keyString = "HHP889@@";
        const ivString = "hgfedcba";
        let text;
        if (user_info && user_info._id && user_info.type365) {
            text = JSON.stringify({
                QRType: "QRAddFriend",
                data: {
                    userId: user_info.id || 0,
                    type365: user_info.type365,
                },
                Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
            });
        }
        else {
            text = JSON.stringify({
                QRType: "QRAddFriend",
                data: {
                    userId: 0,
                    type365: 0,
                },
                Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
            });
        }
        user_info["userQr"] = encodeDesCBC(
            Buffer.from(text, "utf8"),
            keyString,
            ivString
        );
        user_info["encryptId"] = encodeDesCBC(
            Buffer.from(user_info.id.toString(), "utf8"),
            keyString,
            ivString
        );
        if (secretCode === process.env.secretCode) {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    countConversation: countConversation,
                    conversationId: 0,
                    total: 0,
                    currentTime: new Date().getTime() * 10000 + 621355968000000000,
                    listUserOnline: null,
                    user_info,
                },
                error: null,
            });
        } else {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    countConversation: 0,
                    conversationId: 0,
                    total: 0,
                    currentTime: 0,
                    listUserOnline: null,
                    user_info,
                },
                error: null,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const AutoLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const type365 = Number(req.body.type365);
        const password = req.body.password;
        const encryptPassword = md5(password);
        if (email == null || type365 == null || password == null) {
            return res
                .status(400)
                .send(createError(400, "Thông tin truyền lên không đầy đủ"));
        }
        const user = await User.findOne({
            email: email,
            type365: type365,
            password: encryptPassword,
        }).lean();
        if (!user) {
            return res
                .status(400)
                .send(createError(400, "Mật khẩu sai hoặc user không tồn tại"));
        }
        const keyString = "HHP889@@";
        const ivString = "hgfedcba";
        const text = JSON.stringify({
            QRType: "Login",
            data: {
                userId: user._id,
                type365: user.type365,
                password: password,
            },
            Time: date.format(
                new Date(new Date().getTime() + 60 * 60 * 1000),
                "YYYY-MM-DDTHH:mm:ss.SSS+07:00"
            ),
        });

        const data = {
            result: true,
            message: "Lấy thông tin thành công",
        };
        const encryptInfo = encodeDesCBC(
            Buffer.from(text, "utf8"),
            keyString,
            ivString
        );
        data["info"] = encryptInfo;
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        return res.send(createError(200, err.message));
    }
};

//ok
let listUserBanSpam = []
export const GetListContact = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetListContact")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let userId;
        if (req.body && req.body.ID) {
            userId = req.body.ID;
        }
        else if (req.query && req.query.ID) {
            userId = req.query.ID
        }
        else {
            userId = 1
        }
        if (listUserBanSpam.find((e) => e == userId)) {
            return res.status(200).json(createError(200, "You are baned"));
        }
        let skip = 0;
        if (req.body.countContact) {
            skip = Number(req.body.countContact);
        }
        let listIdFriendOut = [];
        let listFriendOut = await Contact.find(
            { $or: [{ userFist: userId }, { userSecond: userId }] }).skip(skip).limit(50).lean();
        if (listFriendOut) {
            for (let i = 0; i < listFriendOut.length; i++) {
                listIdFriendOut.push(listFriendOut[i].userFist);
                listIdFriendOut.push(listFriendOut[i].userSecond)
            }
        }
        listIdFriendOut = listIdFriendOut.filter(e => e != userId);
        let user_list = await User.aggregate([
            {
                $match: {
                    _id: { $in: listIdFriendOut }
                }
            },
            {
                $lookup: {
                    from: "Privacys",
                    localField: "_id",
                    foreignField: "userId",
                    as: "privacy",
                },
            },
            {
                $unwind: {
                    path: "$privacy",
                    preserveNullAndEmptyArrays: true
                },
            },
            {
                $project: {
                    id365: 1,
                    userName: 1,
                    avatarUser: 1,
                    status: 1, active: 1,
                    isOnline: 1,
                    looker: 1,
                    statusEmotion: 1,
                    lastActive: 1,
                    linkAvatar: 1,
                    companyId: 1,
                    type365: 1,
                    statusOnline: { $ifNull: ['$privacy.stutusOnline', 1] }
                }
            }
        ])

        if (user_list) {
            let t = getRandomInt(1, 4);
            let arr = [];
            for (let i = 0; i < user_list.length; i++) {
                arr.push(user_list[i]._id);
                user_list[i] = user_list[i];
                const dateConvert = date.format(user_list[i].lastActive, 'YYYY-MM-DD[T]hh:mm:ssZZ')
                user_list[i]['id'] = user_list[i]._id
                delete user_list[i]._id
                if (!user_list[i].avatarUser) {
                    user_list[i].avatarUser = `${urlImgHost()}avatar/${user_list[i].userName[0]}_${t}.png`
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                    user_list[i].lastActive = dateConvert
                }
                else {
                    user_list[i].avatarUser = `${urlImgHost()}avatarUser/${user_list[i].id}/${user_list[i].avatarUser}`;
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                    user_list[i].lastActive = dateConvert
                }
                user_list[i]['friendStatus'] = 'friend';
                user_list[i]['email'] = '';

            }
            res.json({

                "data": {
                    "result": true,
                    "message": null,
                    "userName": null,
                    "countConversation": 0,
                    "conversationId": 0,
                    "total": JSON.parse(user_list.length),
                    "currentTime": 0,
                    "listUserOnline": null,
                    "user_info": null,
                    user_list: user_list
                },
                "error": null
            })
        }
    } catch (err) {
        console.log("Đã có lỗi xảy ra api users/GetListContact", err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra api users/GetListContact"));
    }
}
//ok
export const GetListContactPrivate = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetListContactPrivate")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let userId = req.body.ID;
        let countLoad = req.body.countLoad || 500;
        let countContact = req.body.countContact;
        const condition = { id365: 1, userName: 1, avatarUser: 1, status: 1, active: 1, isOnline: 1, looker: 1, statusEmotion: 1, lastActive: 1, linkAvatar: 1, companyId: 1, type365: 1 };
        let listIdFriend = [];
        let listFriend = await Contact.find(
            { $or: [{ userFist: userId }, { userSecond: userId }] }).limit(200).lean()
        if (listFriend.length > 0) {
            for (let i = 0; i < listFriend.length; i++) {
                listIdFriend.push(listFriend[i].userFist);
                listIdFriend.push(listFriend[i].userSecond)
            }
        }
        listIdFriend = listIdFriend.filter(e => e != userId);
        let user_list
        if (countLoad === 0) {
            user_list = await User.find({ _id: { $in: listIdFriend }, type365: 0 }, condition).limit(20).lean();
        } else {
            user_list = await User.find({ _id: { $in: listIdFriend }, type365: 0 }, condition).skip(countContact).limit(countLoad).lean();
            if (user_list.length === 0) {
                user_list = await User.find({ _id: { $in: listIdFriend } }, condition).skip(countContact).limit(500).lean();
            }
        }
        if (user_list) {
            let t = getRandomInt(1, 4);
            for (let i = 0; i < user_list.length; i++) {
                user_list[i] = user_list[i].toObject();
                const dateConvert = date.format(user_list[i].lastActive, 'YY-MM-DD[T]hh:mm:ssZZ')
                user_list[i]['id'] = user_list[i]._id
                delete user_list[i]._id
                if (!user_list[i].avatarUser) {
                    user_list[i].avatarUser = `${urlImgHost()}avatar/${user_list[i].userName[0]}_${t}.png`
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                    user_list[i].lastActive = dateConvert
                }
                else {
                    user_list[i].avatarUser = `${urlImgHost()}avatarUser/${user_list[i].id}/${user_list[i].avatarUser}`;
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                    user_list[i].lastActive = dateConvert
                }
                if (listIdFriend.includes(user_list[i].id)) {
                    user_list[i]['friendStatus'] = 'friend'
                }
                else {
                    user_list[i]['friendStatus'] = 'none'
                }
            }
        }
        res.json({

            "data": {
                "result": true,
                "message": null,
                user_list: user_list
            }
            ,
            "error": null
        })
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }

}
//ok cùng cty
export const GetContactCompany = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetContactCompany")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const idCom = req.body.CompanyId;
        let userId = req.body.ID;
        let countLoad = req.body.countLoad || 500;
        let countContact = req.body.countContact;
        const condition = { id365: '$idQLC', userName: 1, email: { $ifNull: ['$email', '$phoneTK'] }, avatarUser: 1, status: '$configChat.status', active: '$configChat.active', isOnline: 1, looker: { $ifNull: ['$configChat.looker', 1] }, statusEmotion: '$configChat.statusEmotion', lastActive: '$lastActivedAt', linkAvatar: 1, companyId: { $ifNull: ['$inForPerson.employee.com_id', '$idQLC'] }, type365: '$type' };
        let listIdFriendOut = [];
        let listFriendOut = await Contact.find(
            { $or: [{ userFist: userId }, { userSecond: userId }] }).limit(200)
        if (listFriendOut) {
            for (let i = 0; i < listFriendOut.length; i++) {
                listIdFriendOut.push(listFriendOut[i].userFist);
                listIdFriendOut.push(listFriendOut[i].userSecond)
            }
        }
        listIdFriendOut = listIdFriendOut.filter(e => e != userId);
        let user_list
        if (countLoad === 0) {
            user_list = await User.find({ _id: { $ne: userId }, 'inForPerson.employee.com_id': idCom }, condition).skip(countContact).limit(500).lean()
        } else {
            user_list = await User.find({ _id: { $ne: userId }, 'inForPerson.employee.com_id': idCom }, condition).skip(countContact).limit(countLoad).lean()
            if (user_list.length === 0) {
                user_list = await User.find({ _id: { $ne: userId }, 'inForPerson.employee.com_id': idCom }, condition).skip(countContact).limit(500).lean();
            }
        }
        if (user_list) {
            let t = getRandomInt(1, 4);
            for (let i = 0; i < user_list.length; i++) {
                user_list[i] = user_list[i].toObject();
                user_list[i]['id'] = user_list[i]._id
                delete user_list[i]._id
                const dateConvert = date.format(user_list[i].lastActive, 'YYYY-MM-DD[T]hh:mm:ssZZ')
                if (!user_list[i].avatarUser) {
                    user_list[i].avatarUser = `${urlImgHost()}avatar/${user_list[i].userName[0]}_${t}.png`
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                    user_list[i].lastActive = dateConvert
                }
                else {
                    user_list[i].avatarUser = `${urlImgHost()}avatarUser/${user_list[i].id}/${user_list[i].avatarUser}`;
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                    user_list[i].lastActive = dateConvert
                }
                if (listIdFriendOut.includes(user_list[i].id)) {
                    user_list[i]['friendStatus'] = 'friend'
                }
                else {
                    user_list[i]['friendStatus'] = 'none'
                }
            }
        }
        res.json({
            "data": {
                "result": true,
                "message": null,
                "userName": null,
                "conversationId": "",
                "total": null,
                "currentTime": Date.now(),
                "listUserOnline": null,
                "user_info": null,
                user_list: user_list
            },
            "error": null
        })
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }

}
//ok // Tìm số điện thoại không cùng cty
export const GetListOfferContactByPhone = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, GetListOfferContactByPhone")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const idCom = Number(req.body.companyId) || 0;
        let Phone = (req.body.phone);
        let fixPhone = Phone.slice(1, Phone.length - 1).split('"').join("").split(",")
        let userId = Number(req.body.userId);
        const condition = { email: { $ifNull: ['$email', '$phoneTK'] }, userName: 1, avatarUser: 1, status: '$configChat.status', isOnline: 1, linkAvatar: 1, companyId: { $ifNull: ['$inForPerson.employee.com_id', '$idQLC'] }, type365: '$type' };
        let listIdFriend = [];
        let arr = [];
        let listFriend = await Contact.find(
            { $or: [{ userFist: userId }, { userSecond: userId }] }).limit(200).lean();


        if (listFriend) {
            for (let i = 0; i < listFriend.length; i++) {
                listIdFriend.push(listFriend[i].userFist);
                listIdFriend.push(listFriend[i].userSecond)
            }
        }
        listIdFriend = listIdFriend.filter(e => e != userId);
        let user_list = await User.find({
            _id: { $ne: userId }, 'inForPerson.employee.com_id': { $ne: idCom },
            $or: [{ phone: fixPhone }, { email: fixPhone }, { phoneTK: fixPhone }]
        }, condition).lean()
        if (user_list.length > 0) {
            let t = getRandomInt(1, 4);
            for (let i = 0; i < user_list.length; i++) {
                // user_list[i] = user_list[i].toObject();
                if (!user_list[i].avatarUser) {
                    user_list[i].avatarUser = `${urlImgHost()}avatar/${user_list[i].userName[0]}_${t}.png`
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                }
                else {
                    user_list[i].avatarUser = `${urlImgHost()}avatarUser/${user_list[i]._id}/${user_list[i].avatarUser}`;
                    user_list[i]['linkAvatar'] = user_list[i].avatarUser
                }
                if (listIdFriend.includes(user_list[i]._id)) {
                    user_list[i]['friendStatus'] = 'friend'
                }
                else {
                    user_list[i]['friendStatus'] = 'none'
                }
            }
            const countConversation = await Conversation.count({ 'memberList.memberId': { $in: arr } })
            const obj = JSON.parse(countConversation)
            res.json({
                "data": {
                    "result": true,
                    "message": null,
                    "userName": null,
                    "countConversation": obj,
                    "conversationId": 0,
                    "total": 0,
                    "currentTime": Date.now(),
                    "listUserOnline": null,
                    "user_info": null,
                    user_list: user_list
                },
                "error": null
            })
        } else {
            res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }

}
//ok
export const GetAllUserOnline = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetAllUserOnline")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let userId = Number(req.body.ID);
        let listIdFriend = [];
        let listFriend = await Contact.find(
            { $or: [{ userFist: userId }, { userSecond: userId }] }).limit(200).lean();
        if (listFriend) {
            for (let i = 0; i < listFriend.length; i++) {
                listIdFriend.push(listFriend[i].userFist);
                listIdFriend.push(listFriend[i].userSecond)
            }
        }
        listIdFriend = listIdFriend.filter(e => e != userId);
        const listUserOnline = await User.find({ isOnline: 1, companyId: 3312 }).lean();
        let t = getRandomInt(1, 4);
        let idList = [];
        if (listUserOnline) {
            for (let i = 0; i < listUserOnline.length; i++) {
                idList.push(listUserOnline[i]._id)
            }
            res.json({
                "data": {
                    "result": true,
                    "message": "lấy danh sách người dùng online thành công",
                    "userName": null,
                    "conversationId": 0,
                    "total": 0,
                    "currentTime": 0,
                    listUserOnline: idList,
                    "user_info": null,
                    "user_list": null
                },
                "error": null
            })
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
//xem lai
export const RegisterSuccess = async (req, res) => {
    try {
        const UserName = req.body.UserName;
        const Email = req.body.Email;
        const Password = req.body.Password;
        if (req.body !== null && req.body.UserName !== null && req.body.Email !== null && req.body.Password !== null) {
            let newID = await User.find({}).sort({ _id: -1 }).limit(1).lean()
            newID = newID[0].toObject();
            const addID = newID._id + 1
            let finduser = await User.findOne({ email: Email, userName: UserName, password: md5(Password) })
            if (finduser) {
                return res.status(200).json(createError(200, "da co tai khoan nay trong chat"));
            }
            const checkUser = await User.count({ _id: addID })
            if (checkUser === 0) {
                const themUser = await User.insertMany(({ _id: addID, email: Email, userName: UserName, password: md5(Password) }));
                if (themUser.length > 0) {
                    res.json({
                        "data": {
                            "result": true,
                            "message": "Đăng ký thành công",
                            "listNameFile": null,
                            "otp": null
                        },
                        "error": null
                    })
                } else {
                    res.status(200).json(createError(200, "Có lỗi xảy ra"));
                }
            } else {
                res.status(200).json(createError(200, "Tài khoản đã tồn tại"));
            }
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
    }

}
//ok
export const CheckContact = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, CheckContact")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.ID);
        const contactId = Number(req.body.ContactId);
        const rdom = getRandomInt(1, 4);
        const check = await Contact.find({
            $or: [
                { userFist: userId, userSecond: contactId },
                { userFist: contactId, userSecond: userId },
            ],
        }).limit(1).lean();
        if (check.length === 0) {
            return res
                .status(400)
                .send(createError(400, "Bạn chưa kết bạn với user này"));
        }
        // let contactUser = await User.findById(contactId);
        // contactUser = contactUser.toObject();
        // contactUser.avatarUser = contactUser.avatarUser
        //   ? `${urlImgHost()}avatarUser/${contactUser._id}/${contactUser.avatarUser}`
        //   : `${urlImgHost()}avatar/${contactUser.userName
        //       .substring(0, 1)
        //       .toUpperCase()}_${rdom}.png`;
        // contactUser.linkAvatar = contactUser.avatarUser;
        // contactUser.friendStatus = "friend";
        const data = {
            message: "Bạn đã kết bạn với user này",
        };
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const CheckStatus = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, CheckStatus")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.userId && req.body.contactId && (!isNaN(req.body.userId)) && (!isNaN(req.body.contactId))) {
            let checkContact = await Contact.find({
                $or: [
                    { userFist: Number(req.body.userId), userSecond: Number(req.body.contactId) },
                    { userFist: Number(req.body.contactId), userSecond: Number(req.body.userId) }
                ]
            }).limit(1).lean();
            if (checkContact && checkContact.length) {
                return res.status(200).json({
                    data: {
                        result: true,
                        message: "Lấy danh sách user thành công",
                        request: {
                            "userId": req.body.userId,
                            "contactId": req.body.contactId,
                            "status": "accept",
                            "type365": 0
                        },
                    },
                    error: null
                });
            }
            let listRequestContact = await RequestContact.find(
                { $or: [{ userId: Number(req.body.userId), contactId: Number(req.body.contactId) }, { userId: Number(req.body.contactId), contactId: Number(req.body.userId) }] },
                { _id: 0, userId: 1, contactId: 1, status: 1, type365: 1 }
            ).limit(1).lean()
            if (listRequestContact) {
                if (listRequestContact.length) {
                    return res.status(200).json({
                        data: {
                            result: true,
                            message: "Lấy danh sách user thành công",
                            request: listRequestContact[0],
                        },
                        error: null
                    });
                }
                else {
                    return res.status(200).json({
                        data: {
                            result: true,
                            message: "Lấy danh sách user thành công",
                            request: {
                                "userId": req.body.userId,
                                "contactId": req.body.contactId,
                                "status": "none",
                                "type365": 0
                            },
                        },
                        error: null
                    });
                }
            }
        }
        else {
            return res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra CheckStatus"));
    }
}
//ok
export const ChangeActive = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, ChangeActive")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const ID = req.body.ID;
        const Active = req.body.Active;
        if (req.body !== null) {
            if (Active > 4 || Active === 0 || Active < 0) {
                res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
            } else {
                let Activech = await User.updateOne({ _id: ID }, { active: Active });
                if (Activech.modifiedCount != 0) {
                    res.status(200).json({
                        "data": {
                            "result": true,
                            "message": "Cập nhật trạng thái thành công",
                            "listNameFile": null,
                            "otp": null
                        },
                        "error": null
                    })
                } else {
                    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
//ok
export const Logout = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, Logout")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const ID = req.body.ID
        const user_info = await User.updateOne({ _id: ID }, { $set: { isOnline: 0 } })
        if (user_info.matchedCount > 0) {
            res.json({
                "data": {
                    "result": true,
                    "message": "đăng xuất thành công",
                    user_info: user_info
                }, "error": null
            })
        } else {
            res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
    }
}

// caapj nhat sinh nhat
export const updateBirthday = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.UserId)) {
                console.log("Token hop le, updateBirthday")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const formData = { ...req.body }

        const find = await User.findOne({ _id: req.body.UserId }, { userName: 1, avatarUser: 1 }).lean()

        const updatebirthday = await Birthday.findOneAndUpdate({ UserId: Number(req.body.UserId) },
            { $set: { Dob: String(formData.Dob), userName: find.userName, avatarUser: find.avatarUser } },
            { upsert: true, new: true })
        if (updatebirthday.avatarUser !== "") {
            updatebirthday.avatarUser = `${urlImgHost()}avatarUser/${find._id}/${updatebirthday.avatarUser}`;
        } else {
            updatebirthday.avatarUser = `${urlImgHost()}avatar/${updatebirthday.userName
                }_${Math.floor(Math.random() * 4) + 1}.png`;
        }
        if (updatebirthday) {
            res.json({
                data: {
                    result: updatebirthday,
                    message: "Update Sinh Nhật Thành công"
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
        }
    } catch (err) {
        console.log("Hung updateBirthday Đã có lỗi xảy ra", err);
        res.status(200).json(createError(200, "Hung updateBirthday Đã có lỗi xảy ra"));
    }
}

export const GetAcceptMessStranger = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetAcceptMessStranger")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.ID) {
            let user = await User.findOne({
                _id: Number(req.body.ID)
            }).lean()

            if (user) {
                if (user.acceptMessStranger === 1) {
                    res.json({
                        data: {
                            result: true,
                            message: "Tài khoản có chặn người lạ"
                        },
                        error: null
                    })
                }
                else {
                    res.status(200).json(createError(200, "Tài khoản không tồn tại hoặc đang tắt chức năng nhận tin nhắn từ người lạ"))
                }
            }
            else {
                res.status(200).json(createError(200, "Account is not exist"))
            }
        }
        else {
            res.status(200).json(createError(200, "thông tin tuyền lên không đúng"))
        }
    }
    catch (err) {
        console.log(err);
    }
}

export const UpdateAcceptMessStranger = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, UpdateAcceptMessStranger")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.ID) {

            let find = await User.findOne({ _id: req.body.ID }, { acceptMessStranger: 1 }).lean()
            if (find) {
                if (find.acceptMessStranger === 1) {
                    let user = await User.findOneAndUpdate({
                        _id: req.body.ID
                    },
                        { $set: { acceptMessStranger: 0 } }, { new: true }
                    )

                    res.json({
                        data: {
                            result: true,
                            message: "Thay đổi cài đặt chặn người lạ thành công"
                        },
                        error: null
                    })

                }
                if (find.acceptMessStranger === 0) {
                    let user = await User.findOneAndUpdate({
                        _id: req.body.ID
                    },
                        { $set: { acceptMessStranger: 1 } }, { new: true }
                    )

                    res.json({
                        data: {
                            result: true,
                            message: "Thay đổi cài đặt chặn người lạ thành công"
                        },
                        error: null
                    })

                }
            } else {
                res.status(200).json(createError(200, "Không có tài khoản này"))
            }
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const ChangeUserName = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, ChangeUserName")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body && Number(req.body.ID) && String(req.body.UserName)) {

            const find = await User.findOne({ _id: req.body.ID }).lean()
            if (find && find.userName !== req.body.UserName) {
                const update = await User.findOneAndUpdate({ _id: req.body.ID }, { userName: req.body.UserName, userNameNoVn: removeVietnameseTones(req.body.UserName) })
                if (update) {
                    res.json({
                        data: {
                            result: true,
                            message: "Thay đổi Tên thành công"
                        },
                        error: null
                    })
                }
            } else res.status(200).json(createError(200, "Trung ten"));
        } else res.status(200).json(createError(200, "Thông tin truyền lên có vấn đề"));
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const GetListSuggesContact = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetListSuggesContact")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body && req.body.ID && req.body.CompanyId && req.body.ArrayIdFamiliar) {
            let arrayFamiliar = ConvertToArrayNumber(req.body.ArrayIdFamiliar);
            const ID = req.body.ID;
            const CompanyID = req.body.CompanyId

            let conversation = await Conversation.find({ "memberList.memberId": ID, }, { "memberList.memberId": 1 }).limit(10).lean()
            const ListUser1 = [];
            const ListUser2 = [];

            if (conversation) {
                for (let i = 0; i < conversation.length; i++) {
                    if (conversation[i] && conversation[i].memberList && conversation[i].memberList.length && (conversation[i].memberList.length > 0)) {
                        for (let j = 0; j < conversation[i].memberList.length; j++) {
                            if ((ListUser1.length < 10) && (!isNaN(conversation[i].memberList[j].memberId)) && (conversation[i].memberList[j].memberId != ID) && (!ListUser1.includes(conversation[i].memberList[j].memberId))) {
                                ListUser1.push(conversation[i].memberList[j].memberId);
                                if (ListUser1.length == 10) {
                                    break
                                }
                            }
                        }
                    }
                }
            };

            const findUser = await User.findOne({ _id: ID }, { removeSugges: 1 }).lean()

            const find = await Conversation.find({ "memberList.memberId": { $in: ListUser1 }, isGroup: 0 }, { "memberList.memberId": 1 }).limit(100).lean()
            if (find) {
                for (let i = 0; i < find.length; i++) {
                    if (find[i] && find[i].memberList && find[i].memberList.length && find[i].memberList.length > 0) {
                        for (let j = 0; j < find[i].memberList.length; j++) {
                            if ((ListUser2.length < 100) && (!isNaN(find[i].memberList[j].memberId)) && (find[i].memberList[j].memberId != ID)
                                && (!ListUser2.includes(find[i].memberList[j].memberId)) && !findUser.removeSugges.includes(find[i].memberList[j].memberId)) {
                                ListUser2.push(find[i].memberList[j].memberId);
                                if (ListUser2.length == 100) {
                                    break
                                }
                            }
                        }
                    }
                }
            }

            let result = await User.find({ _id: { $in: ListUser2 }, companyId: CompanyID }).lean();


            let listUserIdStrange = [];
            let listConv = await Conversation.find(
                { "isGroup": 0, "memberList.memberId": ID, "messageList.0": { $exists: true } },
                { _id: 1, "memberList.memberId": 1 }
            ).lean();
            for (let i = 0; i < listConv.length; i++) {
                let idOther = listConv[i].memberList.find((e) => e.memberId != ID);
                if (!arrayFamiliar.find((e) => e == idOther.memberId)) {
                    listUserIdStrange.push(idOther.memberId);
                }
            };

            let result2 = await User.find({ _id: listUserIdStrange }).lean();
            for (let i = 0; i < result2.length; i++) {
                result.push(result2[i]);
            };

            if (result) {
                result = result.filter((e) => !arrayFamiliar.find((a) => a == e._id));
                res.json({
                    data: {
                        result: result,
                        message: "Gợi ý kết bạn thành công",
                    },
                    error: null,
                });
            }

        } else res.status(200).json(createError(200, "Thông tin truyền lên không đúng"));
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const RemoveSugges = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, RemoveSugges")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body && Number(req.body.userId) && Number(req.body.contactId)) {

            const update = await User.findOneAndUpdate({ _id: req.body.userId }, { $push: { removeSugges: req.body.contactId } }, { new: true })
            if (update) {
                res.json({
                    data: {
                        result: true,
                        message: "Xóa gợi ý kết bạn thành công"
                    },
                    error: null
                })
            }

        } else res.status(200).json(createError(200, "Thông tin truyền lên có vấn đề"));
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const NewAccountFromQLC = async (req, res) => {
    try {
        let list = [1, 2]
        const find = await User.find({}, { email: 1, type365: 1 }).lean()

        for (let i = 0; i < find.length; i++) {
            console.log(i)
            let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/check_email_exits2.php', qs.stringify({
                'email': `${String(find[i].email)}`,
                'os': 'os',
                'from': 'chat365',
                'type': `${Number(find[i].type365)}`
            }));

            if (response && response.data && response.data.data && (!isNaN(response.data.data.id))) {
                const update = await User.updateOne({ email: String(find[i].email), type365: Number(find[i].type365) }, { id365: Number(response.data.data.id) })
            }
        }
        if (find) {
            res.json({
                data: {
                    result: true,
                    message: "Thành công"
                },
                error: null
            })

        } else res.status(200).json(createError(200, "looix"));
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const AccountFrom_TimViec365 = async (req, res) => {
    try {
        // console.log("AccountFrom_TimViec365",req.body)
        if (req && req.body && req.body.Email && req.body.Password && req.body.UserName) {
            // if(req.body.ID){
            //   const user = await User.findOne({email: req.body.Email, password: req.body.Password, userName: req.body.UserName, _id: req.body.ID})
            //   if(user){
            //     res.status(200).json(createError(200, "Đã có tài khoản hoặc trùng điều kiện truyền vào"));
            //   }

            //   else {
            //     const insert = new User({
            //       _id: req.body.ID,
            //       email: req.body.Email,
            //       password: req.body.Password,
            //       userName: req.body.UserName,
            //       NotificationCalendar:  1,
            //       NotificationPayoff : 1,
            //       NotificationReport : 1,
            //       NotificationOffer : 1,
            //       NotificationPersonnelChange : 1,
            //       NotificationRewardDiscipline : 1,
            //       NotificationNewPersonnel : 1,
            //       NotificationChangeProfile : 1,
            //       NotificationTransferAsset : 1,
            //       acceptMessStranger : 1,
            //       notificationAcceptOffer: 1,
            //       notificationAllocationRecall: 1,
            //       notificationChangeSalary:1,
            //       NotificationCommentFromTimViec : 1,
            //       NotificationCommentFromRaoNhanh : 1,
            //       NotificationTag : 1,
            //       NotificationSendCandidate : 1,
            //       notificationMissMessage:1,
            //       NotificationDecilineOffer : 1,
            //       NotificationNTDPoint : 1,
            //       NotificationNTDExpiredPin : 1,
            //       NotificationNTDExpiredRecruit: 1,
            //       fromWeb: "timviec365"
            //   })
            //   if(insert){
            //     const saved = await insert.save()
            //     if(saved){
            //       res.json({
            //         data:{
            //           result: saved,
            //           message: "Thành công"
            //       },
            //       error: null
            //       })
            //     }
            //   }

            // } 
            // }
            if (req.body.ID365) {
                const type365 = Number(req.body.Type365) || 0;
                const user = await User.findOne({ email: req.body.Email, password: req.body.Password, id365: req.body.ID365, type365: type365 }).lean()
                const userId = await User.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).lean()
                if (user) {
                    res.status(200).json(createError(200, "Đã có tài khoản hoặc trùng điều kiện truyền vào"));
                }

                else {
                    const insert = new User({
                        _id: userId[0]._id + 1,
                        id365: req.body.ID365,
                        type365: type365,
                        email: req.body.Email,
                        password: req.body.Password,
                        userName: req.body.UserName,
                        //NotificationCalendar:  1,
                        //NotificationReport : 1,ssss
                        //NotificationOffer : 1,
                        //NotificationPersonnelChange : 1,
                        NotificationRewardDiscipline: 1,
                        NotificationNewPersonnel: 1,
                        NotificationChangeProfile: 1,
                        NotificationTransferAsset: 1,
                        acceptMessStranger: 1,
                        notificationAcceptOffer: 1,
                        notificationAllocationRecall: 1,
                        notificationChangeSalary: 1,
                        NotificationCommentFromTimViec: 1,
                        NotificationCommentFromRaoNhanh: 1,
                        NotificationTag: 1,
                        NotificationSendCandidate: 1,
                        notificationMissMessage: 1,
                        NotificationDecilineOffer: 1,
                        NotificationNTDPoint: 1,
                        NotificationNTDExpiredPin: 1,
                        NotificationNTDExpiredRecruit: 1,
                        fromWeb: "timviec365",
                        userNameNoVn: removeVietnameseTones(req.body.UserName)
                    })
                    if (insert) {
                        const saved = await insert.save()
                        console.log(saved)
                        if (saved) {
                            res.json({
                                data: {
                                    result: saved,
                                    message: "Thành công"
                                },
                                error: null
                            })
                        }
                    }
                }
            }

        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

// export const UpdateAllInfomation365 = async (req, res) => {
//   try {
//     if(req && req.body && req.body.ID365 && req.body.Type365 && req.body.Email ){
//       // console.log("UpdateAllInfomation365",req.body);
//       let response1;
//       let response2;
//       let response3;
//       let update;
//       const user1 = await User.findOne({email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365}).lean()
//       if(!user1){
//         const user2 = await User.findOne({email: req.body.Email, type365: 0, id365: req.body.ID365}).lean()
//         if(!user2){
//           res.status(200).json(createError(200, "tài khoản không tồn tại"))
//         }else {
//           // if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`)) {
//           //   fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`);
//           // }
//           if(req.body.AvatarUser){

//             if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`)) {
//               fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`);
//             }
//             const response = await axios({
//               method: 'GET',
//               url: req.body.AvatarUser,
//               responseType: 'stream'
//             });
//             const avatarUser = `${Date.now() * 10000 + 621355968000000000}.jpg`
//             // if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}`)) {
//             //   fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}`);
//             // }
//             await new Promise((resolve, reject) => {
//               response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}/${avatarUser}`))
//                 .on('finish', resolve)
//                 .on('error', reject)
//             })
//             // fs.writeFileSync(`public/avatarUser/${user2._id}/${avatarUser}`, req.body.AvatarUser)
//             const link = `${urlImgHost()}avatarUser/${user2._id}/${avatarUser}`
//              let pass = req.body.Password ? md5(req.body.Password) : null
//              update = await User.updateOne({email: req.body.Email, type365: 0, id365: req.body.ID365},
//                                                 {userName:req.body.UserName, password:md5(req.body.Password), avatarUser: avatarUser})
//                                                   axios.post('https://chamcong.24hpay.vn/api_chat365/update_avatar.php', qs.stringify({
//                                                    'email': `${String(req.body.Email)}`,
//                                                    'link': link,
//                                                    'type': 0  
//                                                  })).catch((e)=>{console.log(e)});

//           }
//            let pass = req.body.Password ? md5(req.body.Password) : null
//            update = await User.updateOne({email: req.body.Email, type365: 0, id365: req.body.ID365},
//             {userName:req.body.UserName, password:md5(req.body.Password)})
//           if(req.body.UserName){
//              response1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/update_user_info.php',  qs.stringify({
//               'email':`${String(req.body.Email)}`,
//               'user_name':`${String(req.body.UserName)}`,
//               'type':0
//             }));

//           }
//           if(req.body.Password){
//              response2 = await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php',  qs.stringify({
//               'email':`${String(req.body.Email)}`,
//               'new_pass':`${String(req.body.Password)}`,
//               'type':req.body.Type365
//             }));
//           }



//           if(update ){
//             res.json({
//               data:{
//                 result: true,
//                 message: "Thành công"
//             },
//             error: null
//             })
//           }
//           // else {
//           //   res.json({
//           //     data:{
//           //       result: true,
//           //       message: "Thaats baij"
//           //   },
//           //   error: null
//           //   })
//           // }
//         }
//       }
//       else {
//         // if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`)) {
//         //   fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`);
//         // }
//         if(req.body.AvatarUser){

//           if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`)) {
//             fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`);
//           }
//           const response = await axios({
//             method: 'GET',
//             url: req.body.AvatarUser,
//             responseType: 'stream'
//           });
//           const avatarUser = `${Date.now() * 10000 + 621355968000000000}_${user1._id}.jpg`
//           if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}`)) {
//             fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}`);
//           }
//           await new Promise((resolve, reject) => {
//             response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}/${avatarUser}`))
//               .on('finish', resolve)
//               .on('error', reject)
//           })

//             // fs.writeFileSync(`public/avatarUser/${user1._id}/${avatarUser}`, req.body.AvatarUser)
//             const link = `${urlImgHost()}avatarUser/${user1._id}/${avatarUser}`
//              update = await User.updateOne({email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365},
//                                                 {userName:req.body.UserName, avatarUser: avatarUser, password:md5(req.body.Password)})

//                                                   response3 = axios.post('https://chamcong.24hpay.vn/api_chat365/update_avatar.php', qs.stringify({
//                                                    'email': `${String(req.body.Email)}`,
//                                                    'link': link,
//                                                    'type': 0  
//                                                  }));

//         }
//          update = await User.updateOne({email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365},
//           {userName:req.body.UserName, password:md5(req.body.Password)})
//         if(req.body.UserName){
//            response1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/update_user_info.php',  qs.stringify({
//             'email':`${String(req.body.Email)}`,
//             'user_name':`${String(req.body.UserName)}`,
//             'type':`${Number(req.body.Type365)}` 
//           }));

//         }
//         if(req.body.Password){
//            response2 = await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php',  qs.stringify({
//               'email':`${String(req.body.Email)}`,
//               'new_pass':`${String(req.body.Password)}`,
//               'type':`${Number(req.body.Type365)}`
//             }));

//         }


//           if(update ){
//             res.json({
//               data:{
//                 result: true,
//                 message: "Thành công"
//             },
//             error: null
//             })
//           }
//       }

//     }else  res.status(200).json(createError(200, "Thông tin truyền lên có vấn đề"));
//   } catch (err) {
//     console.log(err);
//     res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
//   }
// };


export const UpdateAllInfomation365 = async (req, res) => {
    try {
        if (req && req.body && req.body.ID365 && req.body.Type365 && req.body.Email) {
            // console.log("UpdateAllInfomation365",req.body);
            let response1;
            let response2;
            let response3;
            let update;
            const user1 = await User.findOne({ email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365 }).lean()
            if (!user1) {
                const user2 = await User.findOne({ email: req.body.Email, type365: 0, id365: req.body.ID365 }).lean()
                if (!user2) {
                    res.status(200).json(createError(200, "tài khoản không tồn tại"))
                } else {
                    if (req.body.AvatarUser) {
                        if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`)) {
                            fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`);
                        }
                        const response = await axios({
                            method: 'GET',
                            url: req.body.AvatarUser,
                            responseType: 'stream'
                        });
                        const avatarUser = `${Date.now() * 10000 + 621355968000000000}.jpg`
                        await new Promise((resolve, reject) => {
                            response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}/${avatarUser}`))
                                .on('finish', resolve)
                                .on('error', reject)
                        })
                        const link = `${urlImgHost()}avatarUser/${user2._id}/${avatarUser}`
                        if (req.body.Password) {
                            update = await User.updateOne({ email: req.body.Email, type365: 0, id365: req.body.ID365 },
                                { userName: req.body.UserName, password: md5(req.body.Password), avatarUser: avatarUser })
                        }
                        else {
                            update = await User.updateOne({ email: req.body.Email, type365: 0, id365: req.body.ID365 },
                                { userName: req.body.UserName, avatarUser: avatarUser })
                        }
                        axios.post('https://chamcong.24hpay.vn/api_chat365/update_avatar.php', qs.stringify({
                            'email': `${String(req.body.Email)}`,
                            'link': req.body.AvatarUser,
                            'type': 0
                        })).catch((e) => { console.log(e) });
                    }
                    if (req.body.Password) {
                        update = await User.updateOne({ email: req.body.Email, type365: 0, id365: req.body.ID365 },
                            { userName: req.body.UserName, password: md5(req.body.Password) })
                    }
                    else {
                        update = await User.updateOne({ email: req.body.Email, type365: 0, id365: req.body.ID365 },
                            { userName: req.body.UserName })
                    }
                    if (req.body.UserName) {
                        response1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/update_user_info.php', qs.stringify({
                            'email': `${String(req.body.Email)}`,
                            'user_name': `${String(req.body.UserName)}`,
                            'type': 0
                        }));

                    }
                    if (req.body.Password) {
                        response2 = await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php', qs.stringify({
                            'email': `${String(req.body.Email)}`,
                            'new_pass': `${String(req.body.Password)}`,
                            'type': req.body.Type365
                        }));
                    }
                    if (update) {
                        res.json({
                            data: {
                                result: true,
                                message: "Thành công"
                            },
                            error: null
                        })
                    }
                }
            }
            else {
                if (req.body.AvatarUser) {
                    if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`)) {
                        fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`);
                    }
                    const response = await axios({
                        method: 'GET',
                        url: req.body.AvatarUser,
                        responseType: 'stream'
                    });
                    const avatarUser = `${Date.now() * 10000 + 621355968000000000}_${user1._id}.jpg`
                    if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}`)) {
                        fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}`);
                    }
                    await new Promise((resolve, reject) => {
                        response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${String(user1._id)}/${avatarUser}`))
                            .on('finish', resolve)
                            .on('error', reject)
                    })
                    const link = `${urlImgHost()}avatarUser/${user1._id}/${avatarUser}`
                    if (req.body.Password) {
                        update = await User.updateOne({ email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365 },
                            { userName: req.body.UserName, avatarUser: avatarUser, password: md5(req.body.Password) })
                    }
                    else {
                        update = await User.updateOne({ email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365 },
                            { userName: req.body.UserName, avatarUser: avatarUser })
                    }
                    response3 = axios.post('https://chamcong.24hpay.vn/api_chat365/update_avatar.php', qs.stringify({
                        'email': `${String(req.body.Email)}`,
                        'link': req.body.AvatarUser,
                        'type': 0
                    }));
                }
                if (req.body.Password) {
                    update = await User.updateOne({ email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365 },
                        { userName: req.body.UserName, password: md5(req.body.Password) })
                }
                else {
                    update = await User.updateOne({ email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365 },
                        { userName: req.body.UserName })
                }
                if (req.body.UserName) {
                    response1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/update_user_info.php', qs.stringify({
                        'email': `${String(req.body.Email)}`,
                        'user_name': `${String(req.body.UserName)}`,
                        'type': `${Number(req.body.Type365)}`
                    }));
                }
                if (req.body.Password) {
                    response2 = await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php', qs.stringify({
                        'email': `${String(req.body.Email)}`,
                        'new_pass': `${String(req.body.Password)}`,
                        'type': `${Number(req.body.Type365)}`
                    }));

                }
                if (update) {
                    res.json({
                        data: {
                            result: true,
                            message: "Thành công"
                        },
                        error: null
                    })
                }
            }

        } else res.status(200).json(createError(200, "Thông tin truyền lên có vấn đề"));
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

//kết bạn = qr
export const QR365 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.id)) {
                console.log("Token hop le, QR365")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.id && req.body.data) {
            const data = req.body.data
            const id = req.body.id

            const keyString = "HHP889@@";
            const ivString = "hgfedcba";

            // const iv = Buffer.from(ivString, 'utf8');;
            // console.log(iv)
            // const message = "Hello There, I should be a secret";
            // const key = Buffer.from(keyString, 'utf8');
            // const encrypter = crypto.createCipheriv('des-cbc', key, iv);
            // let encryptedMsg = encrypter.update(message, 'utf8', 'base64');
            // encryptedMsg += encrypter.final("base64");
            // console.log("Encrypted message: " + encryptedMsg);
            // const decrypter = crypto.createDecipheriv('des-cbc', key, iv);
            // let decryptedMsg = decrypter.update(encryptedMsg, "base64", "utf8");
            // decryptedMsg += decrypter.final("utf8");
            // console.log("Decrypted message: " + decryptedMsg);
            const contact = decrypt(data, keyString, ivString)
            // console.log(contact)

            let addfriend = await axios({
                method: "post",
                url: "http://43.239.223.142:9000/api/users/AddFriend",
                data: {
                    userId: id,
                    contactId: Number(contact)
                },
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (addfriend) {
                res.status(200).json({
                    result: true,
                    message: "Gửi lời mời kết bạn thành công"
                })
            } else { res.status(200).json(createError(200, "Gửi lời mời kết bạn thất bại")); }

        } else { res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ")); }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const getInfoQRLogin = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, getInfoQRLogin")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.QrId && req.body.Email && req.body.Password) {
            const IdQr = req.body.QrId
            const Email = req.body.Email
            const Password = req.body.Password

            socket.emit("QRLogin", IdQr, Email, Password)

            res.status(200).json({
                result: true,
                message: "login thanh cong"
            })


        } else { res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ")); }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const Logout_all = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, Logout_all")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.ID && req.body.fromWeb) {
            const userId = Number(req.body.ID)
            const fromWeb = req.body.fromWeb

            const user = await User.findOneAndUpdate({ _id: userId }, { isOnline: 0 }, { _id: 1 })
            if (user) {
                socket.emit('Logout_all', userId, fromWeb)
                res.json({
                    data: {
                        result: true,
                        message: "Đăng xuất thành công",
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Thông tin không chính xác"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log('Tiến: Logout_all', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const OptimizeContact = async (req, res, next) => {
    try {
        let listContact = await Contact.find({}).lean();
        for (let i = 0; i < listContact.length; i++) {
            if (listContact[i].userFist && listContact[i].userSecond) {
                let user1 = await User.findOne({ _id: listContact[i].userFist }, { _id: 1 });
                if (!user1) {
                    Contact.deleteMany({ userFist: listContact[i].userFist }).catch((e) => { console.log(e) });
                }
                let user2 = await User.findOne({ _id: listContact[i].userSecond }, { _id: 1 });
                if (!user2) {
                    Contact.deleteMany({ userSecond: listContact[i].userSecond }).catch((e) => { console.log(e) });
                }
            }
            console.log(i)
        }
        res.send("Thanh cong")
    } catch (err) {
        console.log('optimize', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
export const OptimizeRequestContact = async (req, res, next) => {
    try {
        let listContact = await RequestContact.find({});
        for (let i = 0; i < listContact.length; i++) {
            if (listContact[i].userId && listContact[i].contactId) {
                let user1 = await User.findOne({ _id: listContact[i].userId }, { _id: 1 });
                if (!user1) {
                    RequestContact.deleteMany({ userId: listContact[i].userId }).catch((e) => { console.log(e) });
                }
                let user2 = await User.findOne({ _id: listContact[i].contactId }, { _id: 1 });
                if (!user2) {
                    RequestContact.deleteMany({ contactId: listContact[i].contactId }).catch((e) => { console.log(e) });
                }
            }
            console.log(i)
        }
        res.send("Thanh cong")
    } catch (err) {
        console.log('optimize', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const OptimizeRequestContactStatus = async (req, res, next) => {
    try {
        let listContact = await RequestContact.find({ status: "accept" });
        for (let i = 0; i < listContact.length; i++) {
            if (listContact[i].userId && listContact[i].contactId) {
                RequestContact.deleteMany({
                    $or:
                        [{ userId: listContact[i].userId, contactId: listContact[i].contactId, status: { $ne: "accept" } },
                        { userId: listContact[i].contactId, contactId: listContact[i].userId, status: { $ne: "accept" } }
                        ]
                }).catch((e) => { console.log(e) });
            }
            console.log(i)
        }
        res.send("Thanh cong")
    } catch (err) {
        console.log('optimize', err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

const getIdTimViec = async (email, type) => {
    try {
        let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/login_chat_h.php', qs.stringify({
            'email': `${email}`,
            'type': `${type}`
        }));
        if (response && response.data && response.data.data && response.data.data.id && (!isNaN(response.data.data.id))) {
            return Number(response.data.data.id)
        }
        else {
            return 0;
        }
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}

function randomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
export const GetInfoUserFromHHP365 = async (req, res, next) => {
    try {
        if (req.body) {
            // console.log("GetInfoUserFromHHP365",req.body)
            let idTimViecBeTranformed = 0;
            if (req.body.idTimviec) {
                idTimViecBeTranformed = Number(req.body.idTimviec);
            }
            let typeUser = Number(req.body.typeUser);
            let nameUser = req.body.nameUser;
            let passUser = req.body.passUser;
            let avatarUser = req.body.avatarUser;
            let emailUser = req.body.emailUser;
            let fromWeb = req.body.fromWeb;
            let address = req.body.address;
            let phone = req.body.phone;
            let cc365 = 0;
            const data = {
                result: true
            }
            if (req.body.cc365 && (String(req.body.cc365) != "") && (!isNaN(req.body.cc365))) {
                cc365 = Number(req.body.cc365);
            }
            let flagCheckRequest = 0;
            if ((!req.body.nameUser) || (String(req.body.nameUser).trim() == "")) {
                flagCheckRequest = 1;
            }
            if ((!req.body.emailUser) || (String(req.body.emailUser).trim() == "")) {
                flagCheckRequest = 1;
            }
            if ((!req.body.fromWeb) || (String(req.body.fromWeb).trim() == "")) {
                flagCheckRequest = 2;
            }

            if (flagCheckRequest != 0) {
                if (flagCheckRequest == 1) {
                    return res.status(100).json(createError(100, "Thiếu thông tin người dùng"));
                }
                else if (flagCheckRequest == 2) {
                    return res.status(300).json(createError(100, "Thiếu thông tin trang web"));
                }
            }
            else {
                let dataUser;
                if (cc365 != 1) {
                    // console.log("call tim viec")
                    axios.post('https://chamcong.24hpay.vn/api_chat365/login_chat_h.php', qs.stringify({
                        'email': `${emailUser}`,
                        'password': `${passUser}`,
                        'name': `${nameUser}`,
                        'phone': `${phone}`,
                        'address': `${address}`,
                        'from': `${fromWeb}`,
                        'type': `${String(typeUser)}`
                    })).catch((e) => {
                        console.log('Hung ngu vch')
                    });
                }
                dataUser = await User.find({ email: emailUser, type365: typeUser }).limit(1);
                if (dataUser && dataUser.length > 0) {
                    if ((!req.body.passUser) && (String(req.body.passUser) != "")) {
                        if ((String(dataUser[0].password == String(req.body.passUser))) || (!dataUser[0].password) || (String(dataUser[0].password).trim() == "")) {
                            if ((!dataUser[0].password) || (String(dataUser[0].password).trim() == "")) {
                                await User.updateOne({ _id: dataUser[0]._id }, { password: passUser });
                            }
                        }
                        if ((!dataUser[0].idTimViec) || (Number(dataUser[0].idTimViec) == 0)) {
                            let idTv = await getIdTimViec(emailUser, String(dataUser[0].type365));
                            if (idTv != 0) {
                                await User.updateOne({ _id: dataUser[0]._id }, { idTimViec: idTv });
                            }
                        }
                        if (fromWeb == "timviec365" && dataUser[0].fromWeb != fromWeb) {
                            await User.updateOne({ _id: dataUser[0]._id }, { fromWeb: 'timviec365' })
                        }
                        data['message'] = 'lấy thông tin user thành công'
                        data['userId'] = dataUser[0]._id;
                        if ((!dataUser[0].secretCode) || (String(dataUser[0].secretCode).trim() == '')) {
                            let secretCode = randomString(10);
                            User.updateOne({ _id: dataUser[0]._id }, { $set: { secretCode: secretCode } }).catch((e) => { console.log(e) });
                            data['secretCode'] = secretCode;
                        }
                        else {
                            data['secretCode'] = dataUser[0].secretCode
                        }
                        data['fromWeb'] = dataUser[0].fromWeb
                    } else {
                        data['message'] = 'thông tin mật khẩu không chính xác'
                        data['userId'] = dataUser[0]._id;
                        data['fromWeb'] = dataUser[0].fromWeb;
                        if ((!dataUser[0].secretCode) || (String(dataUser[0].secretCode).trim() == '')) {
                            let secretCode = randomString(10);
                            User.updateOne({ _id: dataUser[0]._id }, { $set: { secretCode: secretCode } }).catch((e) => { console.log(e) });
                            data['secretCode'] = secretCode;
                        }
                        else {
                            data['secretCode'] = dataUser[0].secretCode
                        }
                    };
                    console.log('Chinh sua ..........', idTimViecBeTranformed);
                    await User.updateOne({ _id: dataUser[0]._id }, { $set: { idTimViec: idTimViecBeTranformed } })
                } else {
                    let dataArr
                    let bytesize
                    if ((req.body.avatarUser) && (String(avatarUser).trim() != "")) {
                        dataArr = await axios.get(avatarUser);
                        bytesize = String(dataArr).length;
                    }
                    // console.log("data in",nameUser, 0, 0, typeUser, emailUser, passUser, 0, "", fromWeb)
                    const user = await InsertNewUserService(nameUser, 0, 0, typeUser, emailUser, passUser, 0, "", fromWeb)
                    // console.log("user",user)
                    if (user) {
                        // await InsertNewUser(user, true, fromWeb)
                        if (user.idTimViec == 0) {
                            let idTimViec = await getIdTimViec(user.email, user.type365);
                            if (idTimViec == 0) {
                                idTimViec = idTimViecBeTranformed;
                            }
                            await User.findOneAndUpdate({ _id: user._id }, { idTimViec: idTimViec });
                        }
                        data['message'] = 'lấy thông tin user thành công'
                        data['userId'] = user._id
                        data['secretCode'] = user.secretCode
                        data['fromWeb'] = user.fromWeb
                    } else {
                        return res.send(createError(400, 'đã có lỗi xảy ra'))
                    }
                }
            }
            return res.status(200).send({ data, error: null })
        }
        else {
            return res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    }
    catch (e) {
        console.log(e);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// nhan 
export const FriendRequest = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, FriendRequest")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const uid = Number(req.body.userId);
        const skip = Number(req.body.skip);
        let count = await RequestContact.countDocuments({ contactId: uid, status: 'send' });
        const listFriendRequest = await RequestContact.aggregate([
            {
                '$match': {
                    'contactId': uid,
                    'status': 'send'
                }
            }, {
                '$lookup': {
                    'from': 'Users',
                    'localField': 'userId',
                    'foreignField': '_id',
                    'as': 'member'
                }
            }, {
                '$unwind': {
                    'path': '$member'
                }
            }, {
                '$project': {
                    '_id': 0,
                    'name': '$member.userName',
                    'avatar': '$member.avatarUser',
                    'uid': '$member._id',
                    'id365': '$member.id365',
                    'type365': '$member.type365'
                }
            }, {
                '$skip': skip
            }, {
                '$limit': 20
            }
        ])
        if (listFriendRequest.length === 0) {
            return res.status(200).send(createError(200, 'Không có lời mời kết bạn nào'))
        }
        const resData = listFriendRequest.map(e => {
            e.avatar = e.avatar
                ? `${urlImgHost()}avatarUser/${e.uid}/${e.avatar}`
                : `${urlImgHost()}avatar/${e.name.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            return e = e;
        })
        const data = {
            result: true,
            message: 'Lấy danh sách lời mời đã nhận thành công',
            listUsers: resData,
            count: count
        }
        return res.status(200).send({ data, error: null })
    } catch (err) {
        if (err)
            return res.status(400).send(createError(400, err.message))
    }
}

// gui 
export const SentRequest = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, SentRequest")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const uid = Number(req.body.userId);
        const skip = Number(req.body.skip);
        let count = await RequestContact.countDocuments({ userId: uid, status: 'send' });
        const listFriendSent = await RequestContact.aggregate([
            {
                '$match': {
                    'userId': uid,
                    'status': 'send'
                }
            }, {
                '$lookup': {
                    'from': 'Users',
                    'localField': 'contactId',
                    'foreignField': '_id',
                    'as': 'member'
                }
            }, {
                '$unwind': {
                    'path': '$member'
                }
            }, {
                '$project': {
                    '_id': 0,
                    'name': '$member.userName',
                    'avatar': '$member.avatarUser',
                    'uid': '$member._id',
                    'id365': '$member.id365',
                    'type365': '$member.type365'
                }
            }, {
                '$skip': skip
            }, {
                '$limit': 20
            }
        ])
        if (listFriendSent.length === 0) {
            return res.status(200).send(createError(200, 'Không có lời mời kết bạn nào'))
        }
        const resData = listFriendSent.map(e => {
            e.avatar = e.avatar
                ? `${urlImgHost()}avatarUser/${e.uid}/${e.avatar}`
                : `${urlImgHost()}avatar/${e.name.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            return e = e;
        })
        const data = {
            result: true,
            message: 'Lấy danh sách lời mời đã nhận thành công',
            listUsers: resData,
            count: count
        }
        return res.status(200).send({ data, error: null })
    } catch (err) {
        if (err)
            return res.status(400).send(createError(400, err.message))
    }
}

function sendMailQlc(title, content, receiver) {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ungvien.timviec365.vn@gmail.com',
                pass: 'rxryuuwiqijnowj'
            }
        });
        const mail_config = {
            from: 'ungvien.timviec365.vn@gmail.com',
            to: receiver,
            subject: title,
            html: `${content}`
        };
        transporter.sendMail(mail_config, function (error, info) {
            if (error) {
                console.log(error);
                return reject({ message: "Đã có lỗi xảy ra khi gửi mail" });
            };
            return resolve({ message: "Gửi mail thành công" })
        });
    })
}
export const sendMailQlcApi = async (req, res) => {
    try {
        if (req.body && req.body.title && req.body.content && req.body.receiver) {
            sendMailQlc(req.body.title, req.body.content, req.body.receiver)
            res.json({
                data: {
                    result: true
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Infor is not valid"));
        }
    } catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

let flagsendMail = 0;
let transporter_zoho = nodemailer.createTransport({
    host: "smtp.zoho.com",
    secure: true,
    port: 465,
    auth: {
        user: 'admin@doithe247.com',
        pass: 'RKJm4VbkvEnP'
    }
});
let smtpurl = 'https://api.smtp2go.com/v3/email/send'
let smtpob = (content, receiver) => {
    return {
        'api_key': 'api-BE58282ED38E11EDAE63F23C91C88F4E',
        'to': [`<${receiver}>`],
        'sender': 'Công ty cổ phần thanh toán Hưng Hà <admin@doithe247.com>',
        'subject': `Xác thực OTP`,
        'html_body': `${content}`
    }
}

async function sendMail(otp, receiver) {
    let content = `<h2 style="color:rgba(0, 0, 255, 0.7);">Thông tin OTP</h2>
      <p>Xin chào bạn</p>
      <div style="display:flex"> 
          <p> Mã xác thực của bạn là:</p> 
          <p style="color:red; font-weight:700;margin-left:5px;margin-bottom: 5px;margin-top:9px; padding:0px; font-size:18px">${otp}</p> 
      </div>
      <div style="margin-top:20px;font-weight:700;color:rgba(0, 42, 214, 0.6);" >Cảm ơn bạn đã sử dụng dịch vụ của Chúng tôi</div>
      <div style="display:flex">
          <p>Để biết thêm chi tiết về dịch vụ hoặc đóng góp ý kiến cho Chúng tôi, Quý khách vui lòng liên hệ qua số điện thoại:</p>
          <p style="color:red; font-weight:700">1900633682</p>
      </div>
      <div style="margin-top:5px;display:flex">
          <p style="color:rgba(0, 0, 255, 0.7)">Trân trọng,</p>
          <p style="color:rgba(0, 0, 255, 0.7);font-weight:700">timviec365</p>
      </div>
  `
    //   let src = smtpob(content, receiver)
    //   await request.post({
    //     headers: { 'content-type': 'application/json' },
    //     url: smtpurl,
    //     body: JSON.stringify(src)
    //   })
    const mail_config = {
        from: 'admin@doithe247.com',
        to: receiver,
        subject: 'OTP',
        html: content
    };
    transporter_zoho.sendMail(mail_config, function (error, info) {
        if (error) {
            console.log(error);
            return reject({ message: "Đã có lỗi xảy ra khi gửi mail" });
        };
        return resolve({ message: "Gửi mail thành công" })
    });
}

export const RegisterMailOtp = async (req, res) => {
    try {
        if (req.body) {

            let a = getRandomInt(100000, 999999);
            sendMail(a, req.body.mail);
            res.json({
                data: {
                    result: true,
                    otp: a
                },
                error: null,
            });
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const UpdatePassword = async (req, res) => {
    try {
        if (req.body.Email && req.body.Password && req.body.Type365) {
            const email = req.body.Email
            const password = req.body.Password
            const type365 = Number(req.body.Type365)

            const check = await User.findOne({ email: email, type365: type365 }, { id: 1, idTimViec: 1, id365: 1 })
            if (!check) {
                return res.send(createError(200, "Email không tồn tại"))
            }

            if (type365 !== 0) {
                let res1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php', qs.stringify({
                    'email': email,
                    'new_pass': password,
                    'type': String(type365)
                }))
            }
            else {
                let res3 = await axios.post('https://chamcong.24hpay.vn/service/forget_pass_employee.php', qs.stringify({
                    'email': email,
                    'new_pass': password,
                    'from_app': true,
                    'otp_code': '123'
                }));
                console.log('update pass', res3);
            }
            if (check.idTimViec && check.idTimViec !== 0) {
                let res2 = await axios.post('https://timviec365.vn/api_app/update_tt_chat365.php', qs.stringify({
                    'email': email,
                    'pass': password,
                    'type': String(type365),
                    'id': String(check.id365)
                }))
            }
            const user = await User.findOneAndUpdate({ email: email, type365: type365 }, { password: md5(password) })
            if (user) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật mật khẩu thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Cập nhật mật khẩu thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const RenderOTPChat365 = async (req, res) => {
    try {
        if (req.params && req.params.userId && req.params.IdDevice && req.params.number && String(req.params.number.includes("+84"))) {
            res.render("otpappchat", { IdDevice: req.params.IdDevice, number: req.params.number, userId: req.params.userId });
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const TakeDataFireBaseOTP = async (req, res) => {
    try {
        if (req.body && req.body.number && String(req.body.number.includes("+84"))) {

            let number = String(req.body.number).replace("+84", "");
            if ((number.length == 10) && (String(number)[0] == "0") && (!isNaN(number))) {
                let time = `${new Date().getDate()}-${new Date().getMonth()}-${new Date().getFullYear()}`;
                HistorySendOTP.deleteMany({ time: { $ne: time } }).catch((e) => { console.log(e) })
                // xóa lịch sử code được gửi
                HistorySendOTPCode.deleteMany({ time: { $ne: time } }).catch((e) => { console.log(e) })
                let history = await HistorySendOTP.find({ number: number, time: time }).limit(10).lean();
                if (history) {
                    if (history.length && (history.length > 4)) {
                        return res.status(200).json(createError(200, "Đã hết lượt gửi otp"));
                    }
                    else {
                        console.log("Bat dau")
                        let count = await HistorySendOTPCode.countDocuments({ time: time });
                        if (count < 1) {
                            await HistorySendOTPCode.insertMany([
                                { code: "OTPHHP", time: time, createAt: new Date() },
                                { code: "OTPTIMVIEC365", time: time, createAt: new Date() },
                                { code: "OTPHHP2", time: time, createAt: new Date() },
                                { code: "OTPHHP3", time: time, createAt: new Date() },
                                { code: "OTPHHP4", time: time, createAt: new Date() },
                                { code: "OTPHHP5", time: time, createAt: new Date() },
                                { code: "OTPHHP6", time: time, createAt: new Date() },
                                { code: "OTPHHP7", time: time, createAt: new Date() },
                                { code: "OTPHHP8", time: time, createAt: new Date() },
                                { code: "OTPHHP9", time: time, createAt: new Date() },
                                { code: "OTPHHP10", time: time, createAt: new Date() },
                                { code: "OTPHHP11", time: time, createAt: new Date() },
                                { code: "OTPSMS1", time: time, createAt: new Date() },
                                { code: "OTPSMS2", time: time, createAt: new Date() },
                                { code: "OTPSMS3", time: time, createAt: new Date() },
                                { code: "OTPSMS4", time: time, createAt: new Date() },
                                { code: "OTPSMS5", time: time, createAt: new Date() },
                                { code: "OTPSMS6", time: time, createAt: new Date() },
                                { code: "OTPSMS7", time: time, createAt: new Date() },
                                { code: "OTPSMS8", time: time, createAt: new Date() },
                                { code: "OTPSMS9", time: time, createAt: new Date() },
                                { code: "OTPSMS10", time: time, createAt: new Date() },
                                { code: "OTPSMS11", time: time, createAt: new Date() },
                                { code: "OTPSMS12", time: time, createAt: new Date() },
                                { code: "OTPSMS13", time: time, createAt: new Date() },
                                { code: "OTPSMS14", time: time, createAt: new Date() },
                                { code: "OTPSMS15", time: time, createAt: new Date() },
                                { code: "OTPSMS16", time: time, createAt: new Date() },
                                { code: "OTPSMS17", time: time, createAt: new Date() },
                                { code: "OTPSMS18", time: time, createAt: new Date() },
                                { code: "OTPSMS19", time: time, createAt: new Date() },
                                { code: "OTPSMS20", time: time, createAt: new Date() },
                                { code: "OTPSMS21", time: time, createAt: new Date() },
                                { code: "OTPSMS22", time: time, createAt: new Date() },
                                { code: "OTPSMS23", time: time, createAt: new Date() },
                                { code: "OTPSMS24", time: time, createAt: new Date() },
                                { code: "OTPSMS25", time: time, createAt: new Date() },
                                { code: "OTPSMS26", time: time, createAt: new Date() },
                                { code: "OTPSMS27", time: time, createAt: new Date() },
                                { code: "OTPSMS28", time: time, createAt: new Date() },
                                { code: "OTPSMS29", time: time, createAt: new Date() },
                                { code: "OTPSMS30", time: time, createAt: new Date() },
                                { code: "OTPSMS31", time: time, createAt: new Date() },
                                { code: "OTPSMS32", time: time, createAt: new Date() },
                                { code: "OTPSMS33", time: time, createAt: new Date() },
                                { code: "OTPSMS34", time: time, createAt: new Date() },
                                { code: "OTPSMS35", time: time, createAt: new Date() },
                                { code: "OTPSMS36", time: time, createAt: new Date() },
                                { code: "OTPSMS37", time: time, createAt: new Date() },
                                { code: "OTPSMS38", time: time, createAt: new Date() },
                                { code: "OTPSMS39", time: time, createAt: new Date() },
                                { code: "OTPSMS40", time: time, createAt: new Date() },
                                { code: "OTPSMS41", time: time, createAt: new Date() },
                                { code: "OTPSMS42", time: time, createAt: new Date() },
                                { code: "OTPSMS43", time: time, createAt: new Date() },
                                { code: "OTPSMS44", time: time, createAt: new Date() },
                                { code: "OTPSMS45", time: time, createAt: new Date() },
                                { code: "OTPSMS46", time: time, createAt: new Date() },
                                { code: "OTPSMS47", time: time, createAt: new Date() },
                                { code: "OTPSMS48", time: time, createAt: new Date() },

                            ])
                        }

                        let takeCode;
                        let data;
                        if (req.body.type) {
                            data = await DataFirebaseOTP.find({
                                $or: [
                                    {
                                        email: 'tuananhducly@gmail.com'
                                    },
                                    {
                                        email: 'hungha.timviec365.01@gmail.com'
                                    }
                                ]
                            }).limit(1).lean();
                        }
                        else {
                            takeCode = await HistorySendOTPCode.aggregate([
                                { $match: { time: time } },
                                { $group: { _id: "$code", count: { $count: {} } } },
                                { $sort: { count: 1 } },
                                { $limit: 1 }]);
                            console.log("Take code", takeCode);
                            data = await DataFirebaseOTP.find({ code: takeCode[0]._id }).limit(1).lean();
                        }
                        if (data) {
                            if (data.length) {
                                console.log(data)
                                let historySaved = new HistorySendOTP({
                                    number,
                                    time,
                                    otp: data[0].code
                                });
                                historySaved.save().catch((e) => { console.log(e) });

                                let historyCode = new HistorySendOTPCode({
                                    code: data[0].code,
                                    time,
                                });
                                historyCode.save().catch((e) => { console.log(e) })
                                res.json({
                                    data: {
                                        result: true,
                                        firebase: data[0].data
                                    },
                                    error: null,
                                });
                            }
                            else {
                                return res.status(200).json(createError(200, "Không có dữ liệu firebase"));
                            }
                        }
                    }
                }
            }
            else {
                return res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
            }
        }
        else {
            return res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const CountHistorySendSmsOtp = async (req, res) => {
    try {
        if (req.body && req.body.number && String(req.body.number.includes("+84"))) {
            let number = String(req.body.number).replace("+84", "");
            if ((number.length == 10) && (String(number)[0] == "0") && (!isNaN(number))) {
                let time = `${new Date().getDate()}-${new Date().getMonth()}-${new Date().getFullYear()}`;
                HistorySendOTP.deleteMany({ time: { $ne: time } }).catch((e) => { console.log(e) })
                // xóa lịch sử code được gửi
                HistorySendOTPCode.deleteMany({ time: { $ne: time } }).catch((e) => { console.log(e) })

                // add history
                let historySaved = new HistorySendOTP({
                    number,
                    time,
                });
                historySaved.save().catch((e) => { console.log(e) });
                let count = await HistorySendOTPCode.countDocuments({ time: time });
                if (count < 1) {
                    await HistorySendOTPCode.insertMany([
                        { code: "OTPHHP", time: time, createAt: new Date() },
                        { code: "OTPTIMVIEC365", time: time, createAt: new Date() },
                        { code: "OTPHHP2", time: time, createAt: new Date() },
                        { code: "OTPHHP3", time: time, createAt: new Date() },
                        { code: "OTPHHP4", time: time, createAt: new Date() },
                        { code: "OTPHHP5", time: time, createAt: new Date() },
                        { code: "OTPHHP6", time: time, createAt: new Date() },
                        { code: "OTPHHP7", time: time, createAt: new Date() },
                        { code: "OTPHHP8", time: time, createAt: new Date() },
                        { code: "OTPHHP9", time: time, createAt: new Date() },
                        { code: "OTPHHP10", time: time, createAt: new Date() },
                        { code: "OTPHHP11", time: time, createAt: new Date() }
                    ])
                }

                return res.json({
                    data: {
                        result: true,
                        message: "Added history successfully"
                    },
                    error: null,
                });

            }
            else {
                return res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
            }
        }
        else {
            return res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetAccountByNumberPhone = async (req, res) => {
    try {
        console.log(req.body)
        if (req.body && req.body.number) {
            let Number1 = String(req.body.number).replace("+84", "");
            console.log(Number1)
            let user = await User.find({ email: Number1 });
            if (user) {
                if (user.length) {
                    res.json({
                        data: {
                            result: true,
                            user: user[0]
                        },
                        error: null,
                    });
                }
                else {
                    res.status(200).json(createError(200, "not found account"))
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const ChangeAcceptDevice = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, ChangeAcceptDevice")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.userId && (!isNaN(req.body.userId))) {
            User.updateOne(
                { _id: Number(req.body.userId), "HistoryAccess.AccessPermision": false },
                { $set: { "HistoryAccess.$[elem].AccessPermision": true } },
                { "arrayFilters": [{ "elem.AccessPermision": false }] }
            ).catch((e) => {
                console.log(e)
            })
            res.json("Cập nhật thành công")
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const DeleteHistoryOTPPhoneNumber = async (req, res) => {
    try {

        HistorySendOTP.deleteMany({}).catch((e) => { console.log(e) })
        res.json("Cập nhật thành công")
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const ToolUpdateAvatar = async (req, res) => {
    try {
        const user = await User.find({}, { id365: 1, type365: 1 })
        for (let i = 0; i < user.length; i++) {
            console.log(user[i]._id);
            if (user[i].type365 === 2 || user[i].type365 === 0) {
                const res1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/get_infor_user.php', qs.stringify({
                    'id_user': Number(user[i].id365)
                }))
                if (res1.data.data && (res1.data.data.user_info.ep_image !== '') && res1.data.data.user_info.ep_image) {
                    if (!res1.data.data.user_info.ep_image.includes("app_C")) {
                        const response = await axios({
                            method: 'GET',
                            url: `https://chamcong.24hpay.vn/upload/employee/${res1.data.data.user_info.ep_image}`,
                            responseType: 'stream'
                        })
                        const fileName = `${Date.now() * 10000 + 621355968000000000}_${user[i]._id}.jpg`
                        if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`)) {
                            fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`)
                        }
                        await new Promise((resolve, reject) => {
                            response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}/${fileName}`))
                                .on('finish', resolve)
                                .on('error', reject)
                        })
                        await User.findOneAndUpdate({ _id: user[i]._id }, { avatarUser: fileName }, { _id: 1 })
                    }
                }
            }
            else if (user[i].type365 === 1) {
                const res1 = await axios.get(`https://chamcong.24hpay.vn/api_tinhluong/list_com.php?id_com=${user[i].id365}`)
                if (res1.data.data.items.length > 0 && (res1.data.data.items[0].com_logo !== '') && res1.data.data.items[0].com_logo) {
                    if (!res1.data.data.items[0].com_logo.includes("C:Chat365")) { // app
                        if (!res1.data.data.items[0].com_logo.includes("app")) {
                            const response = await axios({
                                method: 'GET',
                                url: `https://chamcong.24hpay.vn/upload/company/logo/${res1.data.data.items[0].com_logo}`,
                                responseType: 'stream'
                            })
                            const fileName = `${Date.now() * 10000 + 621355968000000000}_${user[i]._id}.jpg`
                            if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`)) {
                                fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`);
                            }
                            await new Promise((resolve, reject) => {
                                response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}/${fileName}`))
                                    .on('finish', resolve)
                                    .on('error', reject)
                            })
                            await User.findOneAndUpdate({ _id: user[i]._id }, { avatarUser: fileName }, { _id: 1 })
                        }
                    }
                }
            }
        }
        res.status(200).json({
            data: {
                result: true,
                message: "Cập nhật thành công",
            },
            error: null
        })
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetNewContact = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, GetNewContact")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId)
        const listUser = []
        const contact = await Contact.find(
            {
                $or: [
                    { userFist: userId },
                    { userSecond: userId }
                ]
            }
        ).sort({ _id: 1 }).limit(20)
        for (let i = 0; i < contact.length; i++) {
            if (contact[i].userFist === userId) {
                listUser.push(contact[i].userSecond)
            }
            else {
                listUser.push(contact[i].userFist)
            }
        }
        const result = await User.find({ _id: { $in: listUser } }, { userName: 1, avatarUser: 1 }).limit(20)
        for (let i = 0; i < result.length; i++) {
            if (result[i].avatarUser !== '') {
                result[i].avatarUser = `${urlImgHost()}avatarUser/${result[i]._id}/${result[i].avatarUser}`
            }
            else {
                result[i].avatarUser = `${urlImgHost()}avatar/${result[i].userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
            }
        }
        res.status(200).json({
            data: {
                result: true,
                message: "Lấy thông tin thành công",
                total: result.length,
                data: result
            },
            error: null
        })
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetContact_v2 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, GetContact_v2")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId)
        const companyId = req.body.companyId ? Number(req.body.companyId) : null
        const listUser = []

        const contact = await Contact.find(
            {
                $or: [
                    { userFist: userId },
                    { userSecond: userId }
                ]
            }
        ).sort({ _id: 1 }).limit(50)
        for (let i = 0; i < contact.length; i++) {
            if (contact[i].userId === userId) {
                listUser.push(contact[i].contactId)
            }
            else {
                listUser.push(contact[i].userId)
            }
        }
        const res1 = await User.find({ _id: { $in: listUser } }, { userName: 1, avatarUser: 1 }).limit(50)
        for (let i = 0; i < res1.length; i++) {
            if (res1[i].avatarUser !== '') {
                res1[i].avatarUser = `${urlImgHost()}avatarUser/${res1[i]._id}/${res1[i].avatarUser}`
            }
            else {
                res1[i].avatarUser = `${urlImgHost()}avatar/${res1[i].userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
            }
        }
        const res2 = await User.find(
            {
                $and: [
                    { _id: { $ne: userId } },
                    { _id: { $nin: listUser } },
                    { type365: 2 },
                    { companyId: companyId }
                ]
            },
            {
                userName: 1,
                avatarUser: 1
            }
        ).sort({ _id: -1 }).limit(100)
        for (let i = 0; i < res2.length; i++) {
            if (res2[i].avatarUser !== '') {
                res2[i].avatarUser = `${urlImgHost()}avatarUser/${res2[i]._id}/${res2[i].avatarUser}`
            }
            else {
                res2[i].avatarUser = `${urlImgHost()}avatar/${res2[i].userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
            }
        }
        res.status(200).json({
            data: {
                result: true,
                message: "Lấy thông tin thành công",
                total: res1.length + res2.length,
                data: [...res1, ...res2]
            },
            error: null
        })
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetContactOnline = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetContactOnline")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const listUserId = req.body.listUserId.replace('[', '').replace(']', '').split(',')
        const time = new Date(Date.now() - 2 * 60 * 1000)

        for (let i = 0; i < listUserId.length; i++) {
            listUserId[i] = Number(listUserId[i])
        }

        const res = await User.find(
            {
                $and: [
                    {
                        $or: [
                            { isOnline: 1 },
                            { lastActive: { $gt: time } }
                        ]
                    },
                    { _id: { $in: listUserId } }
                ]
            },
            { userName: 1, avatarUser: 1 }
        ).limit(50)
        for (let i = 0; i < res.length; i++) {
            if (res[i].avatarUser !== '') {
                res[i].avatarUser = `${urlImgHost()}avatarUser/${res[i]._id}/${res[i].avatarUser}`
            }
            else {
                res[i].avatarUser = `${urlImgHost()}avatar/${res[i].userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
            }
        }
        res.status(200).json({
            data: {
                result: true,
                message: "Lấy thông tin thành công",
                total: res.length,
                data: res
            },
            error: null
        })
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// cap quyen doi mk 
export const UpdatePermissionChangePass = async (req, res) => {
    try {
        if (req.body.number) {
            let check = await PermissonChangePass.find({ number: req.body.number });
            if (check) {
                if (check.length) {
                    if (check.length > 1) {
                        PermissonChangePass.deleteMany({ number: req.body.number }).catch((e) => { console.log(e) });
                        let newPermisson = new PermissonChangePass({
                            number: req.body.number,
                            permission: Number(req.body.permission),
                        });
                        await newPermisson.save();
                    }
                    else {
                        await PermissonChangePass.updateMany({ number: req.body.number, permission: Number(req.body.permission) })
                    }
                }
                else {
                    let newPermisson = new PermissonChangePass({
                        number: req.body.number,
                        permisson: Number(req.body.permission),
                    });
                    await newPermisson.save();
                }
            }
            return res.json({ data: "updated successfully" })
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const TakePermissionChangePass = async (req, res) => {
    try {
        if (req.body.number) {
            let check = await PermissonChangePass.find({ number: req.body.number });
            if (check) {
                if (check.length) {
                    if (check.length > 1) {
                        PermissonChangePass.deleteMany({ number: req.body.number }).catch((e) => { console.log(e) });
                        let newPermisson = new PermissonChangePass({
                            number: req.body.number,
                            permission: 0,
                        });
                        await newPermisson.save();
                    };
                    res.status(200).json({
                        data: {
                            result: true,
                            permission: check[0].permission,
                        },
                        error: null
                    })
                }
                else {
                    res.status(200).json({
                        data: {
                            result: true,
                            permission: 0,
                        },
                        error: null
                    })
                }
            }
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// xac thuc doi mk 
export const VerifyAccount = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, VerifyAccount")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.numberEmail) {
            let user = await User.find({ email: req.body.numberEmail }).limit(1);
            if (user) {
                if (user.length) {
                    let update = await User.updateMany({ email: req.body.numberEmail }, { verified: Number(req.body.status) });
                    if (update) {
                        return res.json({
                            data: {
                                result: true
                            },
                            error: null
                        })
                    }
                    else {
                        return res.status(200).json(createError(200, "Cập nhật không thành công"));
                    }
                }
                else {
                    return res.status(200).json(createError(200, "Không tồn tại tài khoản"));
                }
            }
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// lấy id chat dựa trên id của tìm việc
export const getIdChat = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, getIdChat")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.idTimViec && req.body.type365) {
            const user = await User.findOne({ idTimViec: req.body.idTimViec, type365: req.body.type365 })

            if (user) {
                res.status(200).json({
                    result: user._id,
                    message: "lấy id chat thành công"
                })
            } else { res.status(200).json(createError(200, "Không có tài khoản này")); }

        } else { res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ")); }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

//lấy danh sách thông tin nhiều tài khoản
export const GetListInfoUser = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetListInfoUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const secretCode = req.body.secretCode;
        let userId = []
        let type365 = []
        let listUserInfo = []
        if (!req.body.listID.includes("[")) {
            userId = req.body.listID;
        } else {
            let string = String(req.body.listID).replace("[", "");
            string = String(string).replace("]", "");
            let list = string.split(",");
            for (let i = 0; i < list.length; i++) {
                if (Number(list[i])) {
                    userId.push(Number(list[i]));
                }
            }
        }
        if (!req.body.listType.includes("[")) {
            type365 = req.body.listType;
        } else {
            let string = String(req.body.listType).replace("[", "");
            string = String(string).replace("]", "");
            let list = string.split(",");
            for (let i = 0; i < list.length; i++) {
                if (list[i]) {
                    type365.push(list[i]);
                }
            }
        }

        if (userId.length = type365.length) {
            for (let i = 0; i < userId.length; i++) {
                let user_info = await User.findOne({ idQLC: userId[i], type: type365[i] }, {
                    _id: 1,
                    chat365_secret: 1,
                    avatarUser: 1,
                    lastActivedAt: 1,
                    email: 1,
                    phoneTK: 1,
                    userName: 1,
                    phone: 1,
                    type: 1,
                    password: 1,
                    isOnline: 1,
                    idQLC: 1,
                    'inForPerson.employee.com_id': 1,
                    'configChat.doubleVerify': 1,
                    fromWeb: 1,
                    latitude: 1,
                    longtitude: 1,
                    'configChat.status': 1,
                    'configChat.active': 1,
                    idTimViec365: 1,
                    'configChat.HistoryAccess': 1,
                    'configChat.removeSugges': 1,
                    'configChat.userNameNoVn': 1,
                    'configChat.sharePermissionId': 1
                });
                if (!user_info) {
                    continue;
                }
                console.log(user_info)
                let t = getRandomInt(1, 4);
                let arr = [];
                if (user_info) {
                    arr.push(user_info._id);
                    user_info = user_info.toObject();
                    const dateConvert = date.format(
                        user_info.lastActive,
                        "YYYY-MM-DDTHH:mm:ss.SSS+07:00"
                    );
                    user_info["id"] = user_info._id || -1;
                    delete user_info._id;
                    if (!user_info.avatarUser) {
                        user_info.avatarUser = `${urlImgHost()}avatar/${user_info.userName[0]}_${t}.png`;
                        user_info["linkAvatar"] = user_info.avatarUser;
                        user_info.lastActive = dateConvert;
                    } else {
                        user_info.avatarUser = `${urlImgHost()}avatarUser/${user_info.id}/${user_info.avatarUser}`;
                        user_info["linkAvatar"] = user_info.avatarUser;
                        user_info.lastActive = dateConvert;
                    }
                    if (secretCode !== process.env.secretCode) {
                        user_info.secretCode = null;
                    }
                }

                const keyString = "HHP889@@";
                const ivString = "hgfedcba";
                let text;
                if (user_info && user_info._id && user_info.type365) {
                    text = JSON.stringify({
                        QRType: "QRAddFriend",
                        data: {
                            userId: user_info.id || 0,
                            type365: user_info.type365,
                        },
                        Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
                    });
                }
                else {
                    text = JSON.stringify({
                        QRType: "QRAddFriend",
                        data: {
                            userId: 0,
                            type365: 0,
                        },
                        Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
                    });
                }
                user_info["userQr"] = encodeDesCBC(
                    Buffer.from(text, "utf8"),
                    keyString,
                    ivString
                );
                user_info["encryptId"] = encodeDesCBC(
                    Buffer.from(user_info.id.toString(), "utf8"),
                    keyString,
                    ivString
                );

                listUserInfo.push(user_info)
            }
        }



        if (secretCode === process.env.secretCode) {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    // countConversation: countConversation,
                    conversationId: 0,
                    total: 0,
                    currentTime: new Date().getTime() * 10000 + 621355968000000000,
                    listUserOnline: null,
                    listUserInfo,
                },
                error: null,
            });
        } else {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    conversationId: 0,
                    total: 0,
                    currentTime: 0,
                    listUserOnline: null,
                    listUserInfo,
                },
                error: null,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const GetListInfoUserTTNB = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetListInfoUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const secretCode = req.body.secretCode;
        let userId = []
        let type365 = []
        let listUserInfo = []
        if (!req.body.listID.includes("[")) {
            userId = req.body.listID;
        } else {
            let string = String(req.body.listID).replace("[", "");
            string = String(string).replace("]", "");
            let list = string.split(",");
            for (let i = 0; i < list.length; i++) {
                if (Number(list[i])) {
                    userId.push(Number(list[i]));
                }
            }
        }
        if (!req.body.listType.includes("[")) {
            type365 = req.body.listType;
        } else {
            let string = String(req.body.listType).replace("[", "");
            string = String(string).replace("]", "");
            let list = string.split(",");
            for (let i = 0; i < list.length; i++) {
                if (list[i]) {
                    type365.push(list[i]);
                }
            }
        }

        if (userId.length = type365.length) {
            for (let i = 0; i < userId.length; i++) {
                let type365ele = type365[i];
                let condition = { idQLC: userId[i], type: type365[i] };
                if (type365ele == 2) {
                    condition = {
                        $or: [
                            {
                                idQLC: userId[i],
                                type: 0
                            },
                            {
                                idQLC: userId[i],
                                type: 2
                            }
                        ]
                    }
                }
                let user_info = await User.findOne(condition, {
                    _id: 1,
                    chat365_secret: 1,
                    avatarUser: 1,
                    lastActivedAt: 1,
                    email: 1,
                    phoneTK: 1,
                    userName: 1,
                    phone: 1,
                    type: 1,
                    password: 1,
                    isOnline: 1,
                    idQLC: 1,
                    'inForPerson.employee.com_id': 1,
                    'configChat.doubleVerify': 1,
                    fromWeb: 1,
                    latitude: 1,
                    longtitude: 1,
                    'configChat.status': 1,
                    'configChat.active': 1,
                    idTimViec365: 1,
                    'configChat.HistoryAccess': 1,
                    'configChat.removeSugges': 1,
                    'configChat.userNameNoVn': 1,
                    'configChat.sharePermissionId': 1
                });
                if (!user_info) {
                    continue;
                }
                let t = getRandomInt(1, 4);
                let arr = [];
                if (user_info) {
                    arr.push(user_info._id);
                    user_info = user_info.toObject();
                    const dateConvert = date.format(
                        user_info.lastActive,
                        "YYYY-MM-DDTHH:mm:ss.SSS+07:00"
                    );
                    user_info["id"] = user_info._id || -1;
                    delete user_info._id;
                    if (!user_info.avatarUser) {
                        user_info.avatarUser = `${urlImgHost()}avatar/${user_info.userName[0]}_${t}.png`;
                        user_info["linkAvatar"] = user_info.avatarUser;
                        user_info.lastActive = dateConvert;
                    } else {
                        user_info.avatarUser = `${urlImgHost()}avatarUser/${user_info.id}/${user_info.avatarUser}`;
                        user_info["linkAvatar"] = user_info.avatarUser;
                        user_info.lastActive = dateConvert;
                    }
                    if (secretCode !== process.env.secretCode) {
                        user_info.secretCode = null;
                    }
                }

                const keyString = "HHP889@@";
                const ivString = "hgfedcba";
                let text;
                if (user_info && user_info._id && user_info.type365) {
                    text = JSON.stringify({
                        QRType: "QRAddFriend",
                        data: {
                            userId: user_info.id || 0,
                            type365: user_info.type365,
                        },
                        Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
                    });
                }
                else {
                    text = JSON.stringify({
                        QRType: "QRAddFriend",
                        data: {
                            userId: 0,
                            type365: 0,
                        },
                        Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
                    });
                }
                user_info["userQr"] = encodeDesCBC(
                    Buffer.from(text, "utf8"),
                    keyString,
                    ivString
                );
                user_info["encryptId"] = encodeDesCBC(
                    Buffer.from(user_info.id.toString(), "utf8"),
                    keyString,
                    ivString
                );

                listUserInfo.push(user_info)
            }
        }

        if (secretCode === process.env.secretCode) {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    // countConversation: countConversation,
                    conversationId: 0,
                    total: 0,
                    currentTime: new Date().getTime() * 10000 + 621355968000000000,
                    listUserOnline: null,
                    listUserInfo,
                },
                error: null,
            });
        } else {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    conversationId: 0,
                    total: 0,
                    currentTime: 0,
                    listUserOnline: null,
                    listUserInfo,
                },
                error: null,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

// verify after call to verify quanlychung
export const VerifyUser = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, VerifyUser")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.EmailPhone) {
            let user = await User.find({ email: req.body.EmailPhone });
            if (user) {
                if (user.length) {
                    let checkData = await Verify.find({ EmailPhone: req.body.EmailPhone });
                    if (checkData) {
                        if (checkData.length) {
                            Verify.updateMany({ EmailPhone: req.body.EmailPhone }, { $set: { Permission: req.body.permission } }).catch((e) => { console.log(e) });
                            res.json({
                                data: {
                                    result: true,
                                    status: "Xác thực thành công"
                                },
                                error: null
                            })
                        }
                        else {
                            let newVerify = new Verify({
                                EmailPhone: req.body.EmailPhone,
                                Type: Number(req.body.type365),
                                Permission: Number(req.body.permission),
                            });
                            newVerify.save().catch((e) => { console.log(e) });
                            if (Number(req.body.type365 != 0)) {
                                let newVerify2 = new Verify({
                                    EmailPhone: req.body.EmailPhone,
                                    Type: 0,
                                    Permission: Number(req.body.permission),
                                });
                                newVerify2.save().catch((e) => { console.log(e) });
                            }
                            res.json({
                                data: {
                                    result: true,
                                    status: "Xác thực thành công"
                                },
                                error: null
                            })
                        }
                    }
                }
                else {
                    res.status(200).json(createError(200, "Không tồn tại tài khoản"));
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const VerifyAll = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, VerifyAll")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        let users = await User.find({}, { email: 1, type365: 1 });
        for (let i = 0; i < users.length; i++) {
            console.log(i);
            let newVerify = new Verify({
                EmailPhone: users[i].email,
                Type: users[i].type365,
                Permission: 1,
            });
            await newVerify.save();
            if (Number(users[i].type365) != 0) {
                let newVerify2 = new Verify({
                    EmailPhone: users[i].email,
                    Type: 0,
                    Permission: 1,
                });
                await newVerify2.save();
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

//update mail công ty
export const UpdateCompanyEmail = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, UpdateCompanyEmail")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body && req.body.id365 && req.body.email) {
            let find = await User.findOne({ id365: req.body.id365 })
            if (find && find.type365 == 1) {
                let update = await User.findOneAndUpdate({ id365: req.body.id365, type365: 1 }, { email: req.body.email })
                if (update) {
                    res.status(200).json({
                        result: true,
                        message: "cập nhật email công ty thành công"
                    })
                } else { res.status(200).json(createError(200, "Không cập nhật dc")); }
            } else { res.status(200).json(createError(200, "Không có tài khoản này hoặc không phải là tài khoản công ty")); }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

// ban online hoac moi truy cap
export const GetListFriendRecentlyAccessed = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetListFriendRecentlyAccessed")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body && req.body.listFiendId) {
            let listId = []
            if (!req.body.listFiendId.includes("[")) {
                listId = req.body.listFiendId;
            } else {
                let string = String(req.body.listFiendId).replace("[", "");
                string = String(string).replace("]", "");
                let list = string.split(",");
                for (let i = 0; i < list.length; i++) {
                    if (Number(list[i])) {
                        listId.push(Number(list[i]));
                    }
                }
            }

            let listRecentlyOnline = []
            let findFriend = await User.find({ _id: { $in: listId } }, { isOnline: 1, lastActive: 1 })
            for (let i = 0; i < findFriend.length; i++) {
                if (findFriend[i].isOnline == 1 || Date.now() - findFriend[i].lastActive < 10800000) {
                    listRecentlyOnline.push(findFriend[i]._id)
                }
            }

            if (listRecentlyOnline) {
                res.status(200).json({
                    result: listRecentlyOnline,
                    message: "danh sách bạn online hoặc mới truy cập"
                })
            } else { res.status(200).json(createError(200, "Không có bạn online hoặc mới truy cập")); }

        } else { res.status(200).json(createError(200, "một hoặc nhiều Id trong những Id này không có tài khoản")); }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

//lấy ngay sinh tu qlc update vao chat
export const GetDobfromQlc = async (req, res) => {
    try {
        if (req && req.body) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status) {
                    console.log("Token hop le, GetDobfromQlc")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            for (let i = 0; i < req.body.length; i++) {
                const find = await User.findOne({ id365: req.body[i].id365 }, { userName: 1, avatarUser: 1 })
                if (find) {
                    const updatebirthday = await Birthday.findOneAndUpdate({ UserId: find._id },
                        { $set: { Dob: req.body[i].Dob, userName: find.userName, avatarUser: find.avatarUser } },
                        { upsert: true, new: true })
                    if (updatebirthday.avatarUser !== "") {
                        updatebirthday.avatarUser = `https://mess.timviec365.vn/avatarUser/${find._id}/${updatebirthday.avatarUser}`;
                    } else {
                        updatebirthday.avatarUser = `https://mess.timviec365.vn/avatar/${updatebirthday.userName
                            }_${Math.floor(Math.random() * 4) + 1}.png`;
                    }
                }
            }
            res.json({
                data: {
                    result: true,
                    message: "Update Sinh Nhật Thành công"
                },
                error: null
            })
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

//check name của người dùng
export const GetnamefromId = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log("Token hop le, GetnamefromId")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req && req.body) {
            let listId = []
            if (!req.body.listUserId.includes("[")) {
                listId = req.body.listUserId;
            } else {
                let string = String(req.body.listUserId).replace("[", "");
                string = String(string).replace("]", "");
                let list = string.split(",");
                for (let i = 0; i < list.length; i++) {
                    if (Number(list[i])) {
                        listId.push(Number(list[i]));
                    }
                }
            }
            const find = await User.find({ _id: { $in: listId } }, { userName: 1 })
            if (find) {
                res.json({
                    data: {
                        result: find,
                        message: "lấy danh sách tên thành công"
                    },
                    error: null
                })
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};


export const UpdateNotificationCommentFromTimViec = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationCommentFromTimViec")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationCommentFromTimViec: status })
            const result = true
            console.log(status)
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationCommentFromRaoNhanh = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationCommentFromRaoNhanh")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationCommentFromRaoNhanh: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationChangeSalary = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationChangeSalary")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationChangeSalary: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationAllocationRecall = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationAllocationRecall")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationAllocationRecall: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationAcceptOffer = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationAcceptOffer")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationAcceptOffer: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationDecilineOffer = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationDecilineOffer")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationDecilineOffer: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationMissMessage = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationMissMessage")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationMissMessage: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationNTDPoint = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationNTDPoint")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationNTDPoint: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationNTDExpiredPin = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationNTDExpiredPin")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationNTDExpiredPin: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationNTDExpiredRecruit = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationNTDExpiredRecruit")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationNTDExpiredRecruit: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationSendCandidate = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationSendCandidate")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationSendCandidate: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationNTDApplying = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationNTDApplying")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationNTDApplying: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationPayoff = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationPayoff")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            const result = true;
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationCalendar = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationCalendar")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            const result = true;
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationPersionalChange = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationPersionalChange")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            const result = true;
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationRewardDiscipline = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationRewardDiscipline")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationRewardDiscipline: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationNewPersonnel = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationNewPersonnel")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationNewPersonnel: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationChangeProfile = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationChangeProfile")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationChangeProfile: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdateNotificationTransferAsset = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationTransferAsset")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            // const result = await User.findOneAndUpdate({ _id: userId }, { notificationTransferAsset: status })
            const result = true
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetAppWasOpen = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetAppWasOpen")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.ID && req.body.UserName) {
            const userId = Number(req.body.ID)
            const userName = req.body.UserName

            socket.emit('GetAppWasOpen', userId, userName)
            res.json({
                data: {
                    result: true,
                    message: 'Check App Winform mở thành công',
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const TakePass = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetAppWasOpen")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.ID) {
            let userPass = await User.findOne({ _id: Number(req.body.ID) }, { password: 1 });
            if (userPass) {
                return res.json({
                    data: {
                        result: true,
                        data: userPass.password
                    },
                    error: null
                })
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const TakeIdChatById365 = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetAppWasOpen")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.ID365) {
            let userPass = await User.findOne({ id365: Number(req.body.ID365) }, { _id: 1 });
            if (userPass) {
                return res.json({
                    data: {
                        result: true,
                        data: userPass._id
                    },
                    error: null
                })
            }
            else {
                return res.status(200).json(createError(200, "Can not finde user"))
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


// cập nhật id chat dựa trên idtimviec
export const updateIdchatfromIdtimviec = async (req, res) => {
    try {
        if (req && req.body && req.body.userId && req.body.idTimViec) {
            let update = await User.findOneAndUpdate({ _id: req.body.userId }, { idTimViec: req.body.idTimViec })

            if (update) {
                res.json({
                    data: {
                        result: true,
                        message: "update Thành công"
                    },
                    error: null
                })
            } else res.status(200).json(createError(200, "Không có tài khoản này trong base chat"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

//cập nhật bạn thân
export const updateBestFriend = async (req, res, next) => {
    try {
        if (req.body && req.body.userId && req.body.contactId) {

            let find = await Contact.findOne({ userFist: req.body.userId || req.body.contactId, userSecond: req.body.contactId || req.body.userId }, { bestFriend: 1 })
            if (find) {
                if (find.bestFriend === 1) {
                    let user1 = await Contact.findOneAndUpdate({
                        userFist: req.body.userId, userSecond: req.body.contactId
                    },
                        { $set: { bestFriend: 0 } }, { new: true }
                    )
                    let user2 = await Contact.findOneAndUpdate({
                        userFist: req.body.contactId, userSecond: req.body.userId
                    },
                        { $set: { bestFriend: 0 } }, { new: true }
                    )

                    res.json({
                        data: {
                            result: true,
                            message: "Hủy bạn thân thành công"
                        },
                        error: null
                    })

                }
                if (find.bestFriend === 0) {
                    let user1 = await Contact.findOneAndUpdate({
                        userFist: req.body.userId, userSecond: req.body.contactId
                    },
                        { $set: { bestFriend: 1 } }, { new: true }
                    )
                    let user2 = await Contact.findOneAndUpdate({
                        userFist: req.body.contactId, userSecond: req.body.userId
                    },
                        { $set: { bestFriend: 1 } }, { new: true }
                    )

                    res.json({
                        data: {
                            result: true,
                            message: "Set up bạn thân thành công"
                        },
                        error: null
                    })

                }
            } else {
                res.status(200).json(createError(200, "Không có tài khoản này"))
            }
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//hiển thị xem có phải là bạn thân hay ko
export const GetBestFriend = async (req, res, next) => {
    try {
        if (req.body && req.body.userId && req.body.contactId) {
            let user = await Contact.findOne({
                userFist: req.body.userId || req.body.contactId, userSecond: req.body.contactId || req.body.userId
            })

            if (user) {
                if (user.bestFriend === 1) {
                    res.json({
                        data: {
                            result: true,
                            message: "2 người là bạn thân"
                        },
                        error: null
                    })
                } else res.status(200).json(createError(200, "2 người không phải là bạn thân"))
            }
            else res.status(200).json(createError(200, "2 người không phải là bạn bè"))
        } else {
            res.status(200).json(createError(200, "thông tin tuyền lên không đúng"))
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//hiển thị xem có phải là bạn thân hay ko
export const GetIdChatByEmailPhone = async (req, res, next) => {
    try {
        if (req.body && req.body.EmailPhone) {
            let user = await User.findOne({ email: String(req.body.EmailPhone), type365: Number(req.body.type365) }, { _id: 1 });
            if (user) {
                res.json({
                    data: {
                        result: true,
                        user
                    },
                    error: null
                })
            }
            else {
                return res.status(200).json(createError(200, "Can not find user"))
            }
        } else {
            res.status(200).json(createError(200, "thông tin tuyền lên không đúng"))
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
//update conatct con thieu vao bang contact
export const ToolUpdateContact = async (req, res) => {
    try {
        const reqContact = await RequestContact.find({ $or: [{ status: 'send' }, { status: 'accept' }] })
        if (reqContact && reqContact.length > 0) {
            for (let i = 0; i < reqContact.length; i++) {
                const check = await Contact.findOne({
                    $or: [
                        { userFist: reqContact[i].userId, userSecond: reqContact[i].contactId },
                        { userFist: reqContact[i].contactId, userSecond: reqContact[i].userId }
                    ]
                })
                if ((!check) && reqContact[i].status === 'accept') {
                    await Contact.create({
                        userFist: reqContact[i].userId,
                        userSecond: reqContact[i].contactId
                    })
                }
                if (check && reqContact[i].status === 'send') {
                    // await RequestContact.findOneAndUpdate({ userId: reqContact[i].userId, contactId: reqContact[i].contactId }, { status: 'accept' })
                    reqContact[i].status = 'accept'
                    reqContact[i].save()
                }
            }
        }
        res.json({
            data: {
                result: true,
                message: 'Update thành công',
            },
            error: null
        })
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// export const HandleDoubleAccount = async () =>{
//   try{
//     let listEmail = await User.aggregate([{$group:{_id:"$email"}}]);
//     for(let i=0; i<listEmail.length; i++){
//       let listUserWithEmail = await User.find({email:listEmail[i]._id});
//       if(listUserWithEmail && listUserWithEmail.length && (listUserWithEmail.length >1)){
//           for(let j=0; j< listUserWithEmail.length; j++){
//               if(listUserWithEmail[j].)
//           }
//       }
//     }
//   }
//   catch (err) {
//     console.log(err);
//   }
// }

export const HandleUserBackup = async () => {
    try {
        let listUser = await UserBackup.find({});
        for (let i = 0; i < listUser.length; i++) {
            console.log(i)
            let checkUser = await User.find({ _id: listUser[i]._id });
            if (checkUser.length < 1) {
                const newUser = await User.create(listUser[i]);
            }
        }
    }
    catch (err) {
        console.log(err);
    }
}

export const AddFriendAuto = async (req, res) => {
    try {
        if (req.body.contactId && req.body.userId) {
            let checkContact = await Contact.find({
                $or: [
                    { userFist: Number(req.body.userId), userSecond: Number(req.body.contactId) },
                    { userFist: Number(req.body.contactId), userSecond: Number(req.body.userId) }
                ]
            }).limit(1);
            console.log(checkContact);
            if (!checkContact.length) {
                let newContact = new Contact({
                    userFist: Number(req.body.userId),
                    userSecond: Number(req.body.contactId)
                });
                newContact.save().catch((e) => {
                    console.log("error AddFriendAuto create new contact", e)
                });
                socket.emit("AcceptRequestAddFriend", Number(req.body.userId), Number(req.body.contactId))
                return res.json({
                    data: {
                        result: true,
                        message: 'Thành công',
                    },
                    error: null
                })
            }
            else {
                socket.emit("AcceptRequestAddFriend", Number(req.body.userId), Number(req.body.contactId))
                return res.json({
                    data: {
                        result: true,
                        message: 'Added successfully before',
                    },
                    error: null
                })
            }
        }
    }
    catch (err) {
        console.log("rrror AddFriendAuto");
        return res.status(200).json(createError(200, err));
    }
}


// check dữu liệu thừa trong bảng contact
export const CheckDoubleContact = async (req, res, next) => {
    try {
        let listContact = await Contact.find({})
        for (let i = 0; i < listContact.length; i++) {
            await Contact.deleteOne({
                userFist: listContact[i].userSecond,
                userSecond: listContact[i].userFist
            });
            let count = await Contact.countDocuments({
                userFist: listContact[i].userFist,
                userSecond: listContact[i].userSecond
            });
            if (count > 1) {
                console.log("Trung");
                await Contact.deleteMany({
                    userFist: listContact[i].userFist,
                    userSecond: listContact[i].userSecond
                });
                let newContact = new Contact({
                    userFist: listContact[i].userFist,
                    userSecond: listContact[i].userSecond
                });
                await newContact.save();
            }
            console.log(i);
        }
        res.json("Thanh cong")
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//Xóa tất cả bạn bè của công ty có id = 1191
export const deleteCompanyFriend = async (req, res, next) => {
    try {
        if (req.body && req.body.userId) {
            let deleteFriend1 = await Contact.deleteMany({ userFist: req.body.userId })
            let deleteFriend2 = await Contact.deleteMany({ userSecond: req.body.userId })

            res.json({
                data: {
                    result: true,
                    message: "Xóa bạn bè thành công"
                },
                error: null
            })
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//Xóa tất cả yêu cầu kết bạn của công ty có id = 1191 
export const deleteRequestCompanyFriend = async (req, res, next) => {
    try {
        if (req.body && req.body.userId) {
            let deleteFriend1 = await RequestContact.deleteMany({ userId: req.body.userId })
            let deleteFriend2 = await RequestContact.deleteMany({ contactId: req.body.userId })

            res.json({
                data: {
                    result: true,
                    message: "Xóa yêu cầu kết bạn thành công"
                },
                error: null
            })
        }
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

// xóa tài khoản chat365
export const deleteUserChat = async (req, res, next) => {
    try {
        if (req.body) {
            if (req.body.id365 && !req.body.Id) {
                let findUser = await User.findOne({ id365: req.body.id365, email: req.body.email, type365: req.body.type365 })
                if (!findUser) {
                    return res.status(200).json(createError(200, "không có tài khoản này"))
                }

                let deleteBirthday = await Birthday.deleteOne({ UserId: findUser._id })

                let deleteContactFist = await Contact.deleteMany({ userFist: findUser._id })
                let deleteContactSecond = await Contact.deleteMany({ userSecond: findUser._id })

                let deleteCalendar = await CalendarAppointment.deleteMany({ senderId: findUser._id })
                let deleteConversation = await Conversation.deleteMany({ "memberList.memberId": findUser._id, isGroup: 0 })

                // let removeConversation = await Conversation.updateMany({"memberList.memberId": findUser._id, isGroup:1},{
                //   $pull:{
                //     memberList:{
                //       memberId: findUser._id
                //     }
                //   }
                // })

                let deleteDiary = await Diary.deleteMany({ userSender: findUser._id })
                let deletePersonal = await Personal.deleteMany({ userId: findUser._id })
                let deleteRequestContact1 = await RequestContact.deleteMany({ userId: findUser._id })
                let deleteRequestContact2 = await RequestContact.deleteMany({ contactId: findUser._id })

                let deleteNotification = await Notification.deleteMany({ userId: findUser._id })


                let deleteUser = await User.deleteOne({ id365: req.body.id365, email: req.body.email, type365: req.body.type365 })
                if (deleteUser) {
                    res.json({
                        data: {
                            result: true,
                            message: "Xóa tài khoản thành công"
                        },
                        error: null
                    })

                }

            }
            else if (!req.body.id365 && req.body.Id) {
                let findUser = await User.findOne({ _id: req.body.Id, email: req.body.email, type365: req.body.type365 })
                if (!findUser) {
                    return res.status(200).json(createError(200, "không có tài khoản này"))
                }

                let deleteBirthday = await Birthday.deleteOne({ UserId: findUser._id })

                let deleteContactFist = await Contact.deleteMany({ userFist: findUser._id })
                let deleteContactSecond = await Contact.deleteMany({ userSecond: findUser._id })

                let deleteCalendar = await CalendarAppointment.deleteMany({ senderId: findUser._id })
                let deleteConversation = await Conversation.deleteMany({ "memberList.memberId": findUser._id, isGroup: 0 })

                // let removeConversation = await Conversation.updateMany({"memberList.memberId": findUser._id, isGroup:1},{
                //   $pull:{
                //     memberList:{
                //       memberId: findUser._id
                //     }
                //   }
                // })

                let deleteDiary = await Diary.deleteMany({ userSender: findUser._id })
                let deletePersonal = await Personal.deleteMany({ userId: findUser._id })
                let deleteRequestContact1 = await RequestContact.deleteMany({ userId: findUser._id })
                let deleteRequestContact2 = await RequestContact.deleteMany({ contactId: findUser._id })

                let deleteNotification = await Notification.deleteMany({ userId: findUser._id })


                let deleteUser = await User.deleteOne({ _id: req.body.Id, email: req.body.email, type365: req.body.type365 })
                if (deleteUser) {
                    res.json({
                        data: {
                            result: true,
                            message: "Xóa tài khoản thành công"
                        },
                        error: null
                    })

                }

            }
            else return res.status(200).json(createError(200, "truyền lên cả id365 và Id"));
        } else res.status(200).json(createError(200, "Thông tin truyền lên không đúng"));
    }
    catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const TakeArrayIdChatById365 = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, GetAppWasOpen")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.ArrayID365) {
            let array = ConvertToArrayString(req.body.ArrayID365);
            let arrayNumber = [];
            for (let i = 0; i < array; i++) {
                if (!isNaN(array[i])) {
                    arrayNumber.push(Number(array[i]));
                }
            }
            let userPass = await User.find({ id365: { $in: arrayNumber } }, { _id: 1 });
            if (userPass) {
                return res.json({
                    data: {
                        result: true,
                        data: userPass
                    },
                    error: null
                })
            }
            else {
                return res.status(200).json(createError(200, "Can not finde user"))
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetListUserIdFamiliar = async (req, res, next) => {
    try {
        if (req.body.token && req.body.UserId && (!isNaN(req.body.UserId))) {
            let check = await checkToken(req.body.token);
            let userId = Number(req.body.UserId);
            if (check && check.status && (check.userId == userId)) {
                let companyId = Number(req.body.CompanyId);
                let listFriend = await Contact.find(
                    { $or: [{ userFist: userId }, { userSecond: userId }] }).limit(10000);

                let listFriendFinal = [];
                for (let i = 0; i < listFriend.length; i++) {
                    if (listFriend[i].userFist != userId) {
                        listFriendFinal.push(Number(listFriend[i].userFist))
                    }
                    if (listFriend[i].userSecond != userId) {
                        listFriendFinal.push(Number(listFriend[i].userSecond))
                    }
                }
                listFriend = null; // giải phóng bộ nhớ
                if (companyId != 0) {
                    let listContactCompany = await User.find({ companyId: companyId }, { _id: 1 });
                    if (listContactCompany.length) {
                        for (let i = 0; i < listContactCompany.length; i++) {
                            listFriendFinal.push(listContactCompany[i]._id)
                        }
                    };
                    listContactCompany = null;
                };

                let listConversation = await Conversation.find(
                    {
                        isGroup: 0,
                        'memberList.1': { $exists: true },
                        "messageList.senderId": userId
                    },
                    {
                        "memberList.memberId": 1
                    }
                );
                if (listConversation.length) {
                    for (let i = 0; i < listConversation.length; i++) {
                        for (let j = 0; j < listConversation[i].memberList.length; j++) {
                            if (listConversation[i].memberList[j].memberId != userId) {
                                listFriendFinal.push(listConversation[i].memberList[j].memberId);
                            }
                        }
                    }
                }
                // them id hung ha vao ket qua
                listFriendFinal.push(1191);
                listFriendFinal.push(56387);
                return res.json({
                    data: {
                        result: true,
                        listFamiliar: [...new Set(listFriendFinal)]
                    },
                    error: null
                })
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        else {
            return res.status(404).json(createError(404, "Thiếu thông tin"));
        }
    } catch (err) {
        console.log("GetListUserIdFamiliar", err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra GetListUserIdFamiliar"));
    }
}

export const GetHistoryAccessByMail = async (req, res, next) => {
    try {
        if (req.body.Email) {
            let users = await User.find({ email: req.body.Email }, { HistoryAccess: 1 });
            return res.json({
                data: {
                    users
                }
            })
        }
        else {
            return res.status(404).json(createError(404, "Thiếu thông tin"));
        }
    } catch (err) {
        console.log("GetListUserIdFamiliar", err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra GetListUserIdFamiliar"));
    }
}

export const SetToOffline = async (req, res, next) => {
    try {
        await User.updateMany({}, { $set: { isOnline: 0, lastActive: new Date() } });
        return res.json("successfully");
    } catch (err) {
        console.log("GetListUserIdFamiliar", err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra SetToOffline"));
    }
}


export const ToolMergerUser = async (req, res) => {
    try {
        const listUser = await User.aggregate([
            {
                '$group': {
                    '_id': {
                        'email': '$email',
                        'type365': '$type365',
                    },
                    'count': {
                        '$sum': 1
                    }
                }
            }, {
                '$match': {
                    'count': {
                        '$gt': 1
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'count': 1,
                    'id365': '$_id.id365',
                    'email': '$_id.email',
                    'type365': '$_id.type365',
                }
            }
        ])
        if (listUser && listUser.length > 0) {
            for (let j = 0; j < listUser.length; j++) {
                console.log(listUser[j])
                const arrUser = await User.find({ email: listUser[j].email, type365: listUser[j].type365 }).limit(listUser[j].count).sort({ _id: 1 })
                const arrIdChatDelete = []
                for (let i = 1; i < arrUser.length; i++) {
                    arrIdChatDelete.push(arrUser[i]._id)
                }
                console.log('user', arrUser[0]._id)
                await User.deleteMany({ _id: { $ne: arrUser[0]._id }, email: listUser[j].email, type365: listUser[j].type365 })
                await Conversation.updateMany(
                    { 'memberList.memberId': { $in: arrIdChatDelete } },
                    { $set: { 'memberList.$[elem].memberId': arrUser[0]._id } },
                    { "arrayFilters": [{ "elem.memberId": { $in: arrIdChatDelete } }] }
                )
            }
        }
        res.json({
            data: {
                result: true,
                message: "Thành công",
                data: listUser
            },
            error: null
        })

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const TakeDataUser = async (req, res, next) => {
    try {
        let count = Number(req.body.count);
        let listUser = await User.find({}).skip(count).limit(100).lean();
        return res.json({
            data: {
                result: true,
                listUser
            }
        });
    } catch (err) {
        console.log("TakeDataUser", err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra TakeDataUser"));
    }
}

export const TakeDataUserByMailPhone = async (req, res, next) => {
    try {
        let listUser = await User.find({ email: req.body.Infor }, { password: 0 }).lean();
        return res.json({
            data: {
                result: true,
                listUser
            }
        });
    } catch (err) {
        console.log("TakeDataUser", err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra TakeDataUser"));
    }
}

export const GetListInfoUserByIdChat365 = async (req, res) => {
    try {
        const secretCode = req.body.secretCode;
        let userId = []
        let listUserInfo = []
        if (!req.body.listID.includes("[")) {
            userId = req.body.listID;
        } else {
            let string = String(req.body.listID).replace("[", "");
            string = String(string).replace("]", "");
            let list = string.split(",");
            for (let i = 0; i < list.length; i++) {
                if (Number(list[i])) {
                    userId.push(Number(list[i]));
                }
            }
        }

        if (userId.length > 0) {
            for (let i = 0; i < userId.length; i++) {
                let user_info = await User.findOne({ _id: userId[i] }, {
                    _id: 1,
                    chat365_secret: 1,
                    avatarUser: 1,
                    lastActivedAt: 1,
                    email: 1,
                    phoneTK: 1,
                    userName: 1,
                    phone: 1,
                    type: 1,
                    password: 1,
                    isOnline: 1,
                    idQLC: 1,
                    'inForPerson.employee.com_id': 1,
                    'configChat.doubleVerify': 1,
                    fromWeb: 1,
                    latitude: 1,
                    longtitude: 1,
                    'configChat.status': 1,
                    'configChat.active': 1,
                    idTimViec365: 1,
                    'configChat.HistoryAccess': 1,
                    'configChat.removeSugges': 1,
                    'configChat.userNameNoVn': 1,
                    'configChat.sharePermissionId': 1
                });
                if (!user_info) {
                    return res.send(createError(400, 'Không tồn tại ít nhất 1 người dùng hoặc điền thiếu thông tin'));
                    continue;
                }

                let t = getRandomInt(1, 4);
                let arr = [];
                if (user_info) {
                    arr.push(user_info._id);
                    user_info = user_info.toObject();
                    const dateConvert = date.format(
                        user_info.lastActive,
                        "YYYY-MM-DDTHH:mm:ss.SSS+07:00"
                    );
                    user_info["id"] = user_info._id || -1;
                    delete user_info._id;
                    if (!user_info.avatarUser) {
                        user_info.avatarUser = `https://ht.timviec365.vn:9002/avatarUser/${user_info.userName[0]}_${t}.png`;
                        user_info["linkAvatar"] = user_info.avatarUser;
                        user_info.lastActive = dateConvert;
                    } else {
                        user_info.avatarUser = `https://ht.timviec365.vn:9002/avatarUser/${user_info.id}/${user_info.avatarUser}`;
                        user_info["linkAvatar"] = user_info.avatarUser;
                        user_info.lastActive = dateConvert;
                    }
                    if (secretCode !== process.env.secretCode) {
                        user_info.secretCode = null;
                    }
                }

                const keyString = "HHP889@@";
                const ivString = "hgfedcba";
                let text;
                if (user_info && user_info._id && user_info.type365) {
                    text = JSON.stringify({
                        QRType: "QRAddFriend",
                        data: {
                            userId: user_info.id || 0,
                            type365: user_info.type365,
                        },
                        Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
                    });
                }
                else {
                    text = JSON.stringify({
                        QRType: "QRAddFriend",
                        data: {
                            userId: 0,
                            type365: 0,
                        },
                        Time: date.format(new Date(), "YYYY-MM-DDTHH:mm:ss.SSS+07:00"),
                    });
                }
                user_info["userQr"] = encodeDesCBC(
                    Buffer.from(text, "utf8"),
                    keyString,
                    ivString
                );
                user_info["encryptId"] = encodeDesCBC(
                    Buffer.from(user_info.id.toString(), "utf8"),
                    keyString,
                    ivString
                );

                listUserInfo.push(user_info)
            }
        }



        if (secretCode === process.env.secretCode) {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    // countConversation: countConversation,
                    conversationId: 0,
                    total: 0,
                    currentTime: new Date().getTime() * 10000 + 621355968000000000,
                    listUserOnline: null,
                    listUserInfo,
                },
                error: null,
            });
        } else {
            res.json({
                data: {
                    result: true,
                    message: "lấy thông tin thành công",
                    userName: null,
                    conversationId: 0,
                    total: 0,
                    currentTime: 0,
                    listUserOnline: null,
                    listUserInfo,
                },
                error: null,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
};

export const UpdateDoubleVerify = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateDoubleVerify")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.status) {
            const userId = Number(req.body.userId)
            const status = Number(req.body.status)

            const result = await User.findOneAndUpdate({ _id: userId }, { doubleVerify: status })
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetStatusDoubleVerify = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UpdateNotificationAllocationRecall")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId) {
            const userId = Number(req.body.userId)
            const result = await User.findOne({ _id: userId }, { doubleVerify: 1 })
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Lấy thông tin thành công',
                        data: result
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "User không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const LogoutStrangeDevice = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, LogoutStrangeDevice")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.IdDevice) {
            const userId = Number(req.body.userId)
            const IdDevice = req.body.IdDevice
            User.updateOne(
                {
                    _id: userId,
                    HistoryAccess: { $elemMatch: { IdDevice: { $eq: IdDevice } } }
                },
                {
                    $set: {
                        "HistoryAccess.$.AccessPermision": false,
                    }
                }
            ).catch((e) => {
                console.log(e);
            })
            res.json({
                data: {
                    result: true,
                    message: 'Đăng xuất thành công',

                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const InsertFieldCollection = async (req, res, next) => {
    try {
        await User.updateMany({}, { $set: { doubleVerify: 0 } })
        res.json({
            data: {
                result: true,
                message: 'Thêm thành công',

            },
            error: null
        })
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}



export const GetAccountsByDevice = async (req, res) => {
    try {
        if (req.body.userId && req.body.idDevice) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.userId)) {
                    console.log("Token hop le, GetListConversationForward")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            const userId = Number(req.body.userId)
            const idDevice = req.body.idDevice

            const listUser = await User.aggregate([
                {
                    '$match': {
                        'HistoryAccess.IdDevice': idDevice
                    }
                }, {
                    '$project': {
                        '_id': 1,
                        'id365': 1,
                        'type365': 1,
                        'email': 1,
                        'password': 1,
                        'userName': 1,
                        'avatarUser': 1,
                        'companyId': 1,
                        'Device': {
                            '$filter': {
                                'input': '$HistoryAccess',
                                'as': 'history',
                                'cond': {
                                    '$eq': [
                                        '$$history.IdDevice', idDevice
                                    ]
                                }
                            }
                        }
                    }
                }, {
                    '$unwind': {
                        'path': '$Device'
                    }
                }, {
                    '$sort': {
                        'Device.Time': -1
                    }
                }
            ])
            for (let i = 0; i < listUser.length; i++) {
                if (listUser[i].avatarUser !== '') {
                    listUser[i].avatarUser = `${urlImgHost()}avatarUser/${listUser[i]._id}/${listUser[i].avatarUser}`
                }
                else {
                    listUser[i].avatarUser = `${urlImgHost()}avatar/${listUser[i].userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                }
            }
            res.json({
                data: {
                    result: true,
                    message: 'Lấy danh sách tài khoản thành công',
                    listUser: listUser
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const UpdateSharePermission = async (req, res) => {
    try {
        if (req.body.userId) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.userId)) {
                    console.log("Token hop le, GetListConversationForward")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            const type = String(req.body.type);
            const userId = Number(req.body.userId);
            const arrayId = ConvertToArrayNumber(req.body.arrayId);
            let user = await User.findOne({ _id: userId }, { _id: 1 }).lean();
            if (user) {
                if (type == 'add') {
                    await User.updateOne({ _id: userId }, { $push: { sharePermissionId: { $each: arrayId } } });
                    return res.json({
                        data: {
                            result: true,
                            message: 'Phân quyền thành công',
                        },
                        error: null
                    })
                }
                else if (type == 'delete') {
                    await User.updateOne({ _id: userId }, { $pull: { sharePermissionId: { $in: arrayId } } });
                    return res.json({
                        data: {
                            result: true,
                            message: 'Xóa phân quyền thành công',
                        },
                        error: null
                    })
                }
                else {
                    return res.status(200).json(createError(200, "Invalid type"));
                }
            }
            else {
                return res.status(200).json(createError(200, "Invalid account"));
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const TakeDataUserSharePermission = async (req, res) => {
    try {
        if (req.body.userId) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.userId)) {
                    console.log("Token hop le, GetListConversationForward")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            const userId = Number(req.body.userId);
            let user = await User.findOne({ _id: userId }, { _id: 1, sharePermissionId: 1 }).lean();
            if (user && user.sharePermissionId && user.sharePermissionId.length) {
                let listUser = await User.find({ _id: { $in: user.sharePermissionId } }, { password: 0 }).limit(10).lean();
                return res.json({
                    data: {
                        result: true,
                        message: 'ok',
                        listUser
                    },
                    error: null
                })
            }
            else {
                return res.json({
                    data: {
                        result: true,
                        message: 'ok',
                        listUser: []
                    },
                    error: null
                })
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const TakeListLastActiveIdTimviec = async (req, res) => {
    try {
        if (req.body.listId) {
            const listId = ConvertToArrayNumber(req.body.listId)
            return res.json({
                data: {
                    result: true,
                    message: 'ok',
                    user: await User.findOne({ idTimViec: { $in: listId } }, { idTimViec: 1, lastActive: 1 }).lean()
                },
                error: null
            })
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetListIdChat = async (req, res) => {
    try {
        if (req.body.email && req.body.password) {
            const listIdChat = await User.find({ email: req.body.email, password: req.body.password }, { _id: 1, userName: 1 }).lean()
            if (listIdChat) {
                return res.json({
                    data: {
                        result: true,
                        message: 'Lấy Id Chat thành công',
                        listUser: listIdChat
                    },
                    error: null
                })
            }
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const TakeAccountOriginPermission = async (req, res) => {
    try {
        if (req.body.email && req.body.password) {
            const user = await User.findOne({ email: req.body.email, password: req.body.password }, { _id: 1 }).lean();
            const userOrigin = await User.findOne({ sharePermissionId: user._id }, { _id: 1 }).lean();
            let id = 0;
            if (userOrigin) {
                id = userOrigin._id
            }
            return res.json({
                data: {
                    result: true,
                    message: 'Lấy Id Chat thành công',
                    listUser: id
                },
                error: null
            })
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const UpdatePinHiddenConversation = async (req, res) => {
    try {
        if (req.body.userId && req.body.pin) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.userId)) {
                    console.log("Token hop le, CreatePinHiddenConversation")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            const userId = Number(req.body.userId)
            const pin = req.body.pin
            const user = await User.findOneAndUpdate({ _id: userId }, { $set: { pinHiddenConversation: pin } })
            if (user) {
                return res.json({
                    data: {
                        result: true,
                        message: 'Thay đổi mã pin thành công',
                    },
                    error: null
                })
            }
            else {
                return res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetPinHiddenConversation = async (req, res) => {
    try {
        if (req.body.userId) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.userId)) {
                    console.log("Token hop le, GetListConversationForward")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            const userId = Number(req.body.userId)
            const user = await User.findOne({ _id: userId }, { _id: 1, pinHiddenConversation: 1 })
            if (user) {
                return res.json({
                    data: {
                        result: true,
                        message: 'Lấy mã pin thành công',
                        pin: user.pinHiddenConversation
                    },
                    error: null
                })
            }
            else {
                return res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}



export const DeletePinHiddenConversation = async (req, res) => {
    try {
        if (req.body.userId) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.userId)) {
                    console.log("Token hop le, GetListConversationForward")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            const userId = Number(req.body.userId)

            const user = await User.findOneAndUpdate({ _id: userId }, { pinHiddenConversation: null, pinInputTimes: [] })
            if (user) {
                res.json({
                    data: {
                        result: true,
                        message: 'Xóa mã pin thành công',
                    },
                    error: null
                })
                const listConv = await Conversation.find({ memberList: { $elemMatch: { memberId: userId, isHidden: 1 } } }, { _id: 1 })
                listConv.map(conv => socket.emit('DeleteConversation', userId, Number(conv._id)))
                await Conversation.updateMany(
                    {
                        memberList: {
                            $elemMatch: { memberId: userId, isHidden: 1 }
                        }
                    },
                    {
                        $set: {
                            'memberList.$.isHidden': 0,
                            'messageList.$[].isEdited': 2
                        },
                        $push: {
                            "messageList.$[].listDeleteUser": userId,
                            listDeleteMessageOneSite: userId
                        }
                    }
                )
                return 1
            }
            else {
                return res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
export const ConfirmPinHiddenConv = async (req, res) => {
    try {
        if (req.body.userId) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && (check.userId == req.body.userId)) {
                    console.log("Token hop le, GetListConversationForward")
                }
                else {
                    return res.status(404).json(createError(404, "Invalid token"));
                }
            }
            const userId = Number(req.body.userId)
            const pin = req.body.pin

            const user = await User.findOne({ _id: userId }, { _id: 1, pinHiddenConversation: 1, pinInputTimes: 1 })
            if (user) {
                const pinInputTimes = user.pinInputTimes || []
                if (user.pinHiddenConversation) {
                    if (user.pinHiddenConversation === pin) {
                        await User.updateOne({ _id: userId }, { pinInputTimes: [] })
                        return res.json({
                            data: {
                                result: true,
                                message: 'Nhập mã pin thành công',
                            },
                            error: null
                        })
                    }
                    else {
                        pinInputTimes.push(new Date())
                        await User.updateOne({ _id: userId }, { pinInputTimes: pinInputTimes })
                        return res.status(200).json(createError(200, `Đã nhập sai mã pin ${pinInputTimes.length} lần`));
                    }
                }
                else {
                    return res.status(200).json(createError(200, "Người dùng chưa cài đặt mã pin"));
                }
            }
            else {
                return res.status(200).json(createError(200, "Thông tin truyền lên không chính xác"));
            }
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const GetUserByIdChat = async (req, res) => {
    try {
        if (req.body.userId) {
            return res.json({
                data: {
                    result: true,
                    message: 'ok',
                    user: await User.findOne({ _id: Number(req.body.userId) }).lean()
                },
                error: null
            })
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const RandomString = (length) => {
    var result = '';
    var characters = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
// strict 
export const SynchronizeAccountEmChatTimviec365 = async (req, res) => {
    try {
        if (req.body.email && req.body.pass && req.body.idTimViec && req.body.idChat) {
            console.log('SynchronizeAccountEmChatTimviec365', req.body)
            const idTimViec = Number(req.body.idTimViec);
            const pass = req.body.pass;
            const idChat = Number(req.body.idChat);
            const email = String(req.body.email);

            let listAccount = await User.find(
                {
                    email: email,
                    $or: [
                        { type365: 2 },
                        { type365: 0 }
                    ]
                },
                { email: 1, password: 1, idTimViec: 1, id365: 1 }
            ).lean();

            // update pass 
            if (listAccount.length) {
                if (listAccount.find((e) => e.password != pass)) {
                    await User.updateMany(
                        {
                            email: email,
                            $or: [
                                { type365: 2 },
                                { type365: 0 }
                            ]
                        },
                        {
                            $set: {
                                password: pass
                            }
                        }
                    )
                }
            }

            if (listAccount.length == 1) {
                let account = listAccount[0];
                console.log('Update khi co 1 tk', account, req.body)
                if (idChat != account._id) {
                    console.log('Update id Chat tren tim viec')
                    // call to timviec to update 
                    await axios({
                        method: "post",
                        url: "http://210.245.108.201:9001/api/history/ChangeIdChat",
                        data: {
                            IdTimviec: idTimViec,
                            IdChat: account._id
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                }
                if (idTimViec != account.idTimViec) {
                    console.log('update idTimviec duoi chat')
                    await User.updateOne(
                        {
                            email: email,
                            $or: [
                                { type365: 2 },
                                { type365: 0 }
                            ]
                        },
                        { $set: { idTimViec: idTimViec } }
                    );
                }
            }
            else if (listAccount.length > 1) {
                let idChoose = listAccount.find((e) => e.type365 == 2)._id || 0;
                // find id to keep 
                if (idChoose == 0) {
                    idChoose = listAccount[0]._id;
                    let maxCon = await Conversation.countDocuments(
                        {
                            "memberList.memberId": listAccount[0]._id,
                            messageList: { $exists: true, $not: { $size: 0 } }
                        }
                    );
                    for (let i = 1; i < listAccount.length; i++) {
                        let temp = await Conversation.countDocuments(
                            {
                                "memberList.memberId": listAccount[0]._id,
                                messageList: { $exists: true, $not: { $size: 0 } }
                            }
                        );
                        if (temp > maxCon) {
                            // delete user 
                            await User.deleteOne({ _id: idChoose });
                            maxCon = temp;
                            idChoose = listAccount[i]._id;
                        }
                    };
                }

                let account = listAccount.find((e) => e._id = idChoose);
                // update id365 
                let response = await axios({
                    method: "post",
                    url: "http://43.239.223.85:9001/api/excute/sql",
                    data: {
                        content: `SELECT ep_id FROM employee WHERE ep_email = '${email}' OR ep_phone_tk = '${email}' LIMIT 1`
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (response.data && response.data.data && response.data.data.length) {
                    await User.updateOne({ _id: account._id }, { $set: { id365: response.data.data[0].ep_id } });
                }
                // check and update 
                if (idChat != account._id) {
                    await axios({
                        method: "post",
                        url: "http://210.245.108.201:9001/api/history/ChangeIdChat",
                        data: {
                            IdTimviec: idTimViec,
                            IdChat: account._id
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                }
                if (idTimViec != account.idTimViec) {
                    await User.updateOne(
                        {
                            email: email,
                            $or: [
                                { type365: 2 },
                                { type365: 0 }
                            ]
                        },
                        { $set: { idTimViec: idTimViec } }
                    );
                }
            }
            else if (listAccount.length == 0) {
                // gọi sang quản lý chung lấy id365 , tên người dùng. 
                let response = await axios({
                    method: "post",
                    url: "http://43.239.223.85:9001/api/excute/sql",
                    data: {
                        content: `SELECT ep_id,ep_name FROM employee WHERE ep_email = '${email}' OR ep_phone_tk = '${email}' LIMIT 1`
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (response.data && response.data.data && response.data.data.length) {
                    //await User.updateOne({_id:account._id},{$set:{id365:response.data.data[0].ep_id}});
                    let id365 = Number(response.data.data[0].ep_id);
                    let name = response.data.data[0].ep_name; // lấy từ quản lý chung 

                    let result = await User.find({ _id: { $ne: 0 } }, { _id: 1 }).sort({ _id: -1 }).limit(1);
                    let count_doc_Users = Number(result[0]._id);
                    let update = await Counter.updateOne({ name: "UserID" }, { $set: { countID: count_doc_Users + 1 } })
                    if (update) {
                        const newUser = new User({
                            _id: count_doc_Users + 1,
                            id365: id365,
                            type365: 0,
                            email: email,
                            password: pass,
                            phone: "",
                            userName: name,
                            avatarUser: "",
                            status: "",
                            statusEmotion: 0,
                            lastActive: new Date(),
                            active: 1,
                            isOnline: 0,
                            looker: 0,
                            companyId: 0,
                            companyName: "",
                            acceptMessStranger: 1,
                            idTimViec: idTimViec,
                            fromWeb: 'timviec365',
                            secretCode: RandomString(10),
                            HistoryAccess: []
                        });
                        await newUser.save();
                    }
                }
            }
            return res.json({
                data: {
                    result: true,
                    message: 'ok',
                },
                error: null
            })
        }
        else {
            return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const CheckInstall = async (req, res) => {
    try {
        const key = new Registry({
            hive: Registry.HKCR, // Chọn hive (ví dụ: HKCU, HKLM, HKCR)
            key: '\\comfile' // Đường dẫn khóa Registry
        });

        await key.keyExists((err, exists) => {
            if (err) {
                console.error('Lỗi khi kiểm tra khóa Registry:', err.message);
                return;
            }

            if (exists) {
                console.log('Khóa Registry tồn tại');
                return res.status(200).json(createError(200, "Khóa Registry tồn tại"));
            } else {
                console.log('Khóa Registry không tồn tại');
                return res.status(200).json(createError(200, "Khóa Registry không tồn tại"));
            }
        });

    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const FindUserConversation = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.senderId)) {
                console.log("Token hop le, FindUserApp All")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body && req.body.senderId && Number(req.body.senderId)) {
            let userId = Number(req.body.senderId);
            let findword;
            let findwordNoVN;
            if (!req.body.message) {
                findword = "";
                findwordNoVN = ""
            }
            else {
                findword = String(req.body.message);
                findwordNoVN = removeVietnameseTones(String(req.body.message));
            }
            let listUser
            if (findwordNoVN !== '') {
                listUser = await Conversation.aggregate([
                    {
                        '$match': {
                            'memberList.memberId': userId,
                            'memberList.1': {
                                '$exists': true
                            },
                            'messageList.0': {
                                '$exists': true
                            },
                            'isGroup': 0
                        }
                    }, {
                        '$sort': {
                            'timeLastMessage': -1
                        }
                    }, {
                        '$limit': 10
                    }, {
                        '$project': {
                            'member': {
                                '$filter': {
                                    'input': '$memberList',
                                    'as': 'memberlist',
                                    'cond': {
                                        '$ne': [
                                            '$$memberlist.memberId', userId
                                        ]
                                    }
                                }
                            }
                        }
                    }, {
                        '$unwind': {
                            'path': '$member'
                        }
                    }, {
                        '$lookup': {
                            'from': 'Users',
                            'localField': 'member.memberId',
                            'foreignField': '_id',
                            'as': 'user'
                        }
                    }, {
                        '$unwind': {
                            'path': '$user'
                        }
                    }, {
                        '$match': {
                            $or: [
                                { 'user.userNameNoVn': new RegExp(findwordNoVN, 'i') },
                                { 'user.email': new RegExp(findwordNoVN, 'i') }
                            ]
                        }
                    }, {
                        '$limit': 10
                    }, {
                        '$project': {
                            '_id': 0,
                            'id': '$user._id',
                            'email': '$user.email',
                            'userName': '$user.userName',
                            'avatarUser': '$user.avatarUser',
                            'status': '$user.status',
                            'active': '$user.active',
                            'isOnline': '$user.isOnline',
                            'looker': '$user.looker',
                            'statusEmotion': '$user.statusEmotion',
                            'lastActive': '$user.lastActive',
                            'companyId': '$user.companyId',
                            'type365': '$user.type365'
                        }
                    }
                ])
            }
            else {
                listUser = await Conversation.aggregate([
                    {
                        '$match': {
                            'memberList.memberId': userId,
                            'memberList.1': {
                                '$exists': true
                            },
                            'messageList.0': {
                                '$exists': true
                            },
                            'isGroup': 0
                        }
                    }, {
                        '$sort': {
                            'timeLastMessage': -1
                        }
                    }, {
                        '$limit': 10
                    }, {
                        '$project': {
                            'member': {
                                '$filter': {
                                    'input': '$memberList',
                                    'as': 'memberlist',
                                    'cond': {
                                        '$ne': [
                                            '$$memberlist.memberId', userId
                                        ]
                                    }
                                }
                            }
                        }
                    }, {
                        '$unwind': {
                            'path': '$member'
                        }
                    }, {
                        '$lookup': {
                            'from': 'Users',
                            'localField': 'member.memberId',
                            'foreignField': '_id',
                            'as': 'user'
                        }
                    }, {
                        '$unwind': {
                            'path': '$user'
                        }
                    }, {
                        '$limit': 10
                    }, {
                        '$project': {
                            '_id': 0,
                            'id': '$user._id',
                            'email': '$user.email',
                            'userName': '$user.userName',
                            'avatarUser': '$user.avatarUser',
                            'status': '$user.status',
                            'active': '$user.active',
                            'isOnline': '$user.isOnline',
                            'looker': '$user.looker',
                            'statusEmotion': '$user.statusEmotion',
                            'lastActive': '$user.lastActive',
                            'companyId': '$user.companyId',
                            'type365': '$user.type365'
                        }
                    }
                ])
            }
            if (listUser) {
                for (let i = 0; i < listUser.length; i++) {
                    if (listUser[i].avatarUser != "") {
                        listUser[i].linkAvatar = `${urlImgHost()}avatarUser/${listUser[i].id}/${listUser[i].avatarUser}`;
                    }
                    else {
                        listUser[i].linkAvatar = `${urlImgHost()}avatar/${listUser[i].userName[0]}_${getRandomInt(1, 4)}.png`
                    }
                    listUser[i].avatarUser = listUser[i].linkAvatar
                    listUser[i].friendStatus = 'none'
                }
                return res.status(200).json({
                    data: {
                        result: false,
                        message: null,
                        userName: null,
                        countConversation: 0,
                        conversationId: 0,
                        total: 0,
                        currentTime: 0,
                        listUserOnline: null,
                        user_info: null,
                        result: true,
                        message: "Lấy thông tin thành công",
                        user_list: listUser,
                    },
                    error: null
                });
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
            }
        }
    }
    catch (e) {
        console.log(e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const ChangeName = async (req, res) => {
    try {
        const type365 = Number(req.body.type365);
        const email = req.body.email;
        let userCheck = await User.findOne({ email: email, type365: type365 }).lean();
        if (userCheck) {
            await User.updateOne({ email: req.body.email, type365: req.body.type365 }, { $set: { userName: req.body.userName } });
        }
        else {
            await User.updateOne({ email: req.body.email, type365: 0 }, { $set: { userName: req.body.userName } });
        }
        return res.json({
            data: {
                result: true,
                message: 'ok',
            },
            error: null
        })
    } catch (err) {
        console.log(err)
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//thay đổi mô tả bản thân 
export const ChangeNickNameUser = async (req, res) => {
    try {
        if (req.body.userId) {
            let userId = Number(req.body.userId)
            let nickName = req.body.nickName

            let updateUser = await User.findOneAndUpdate({ _id: userId }, { nickName: nickName }, { new: true })
            if (updateUser) {
                return res.status(200).json({
                    data: {
                        result: 'Success',
                        message: "Lấy thông tin thành công",
                        infoUser: updateUser
                    },
                    error: null,
                })
            } else return res.status(200).json(createError(200, "không tìm thấy user"));
        } else return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));


    } catch (err) {
        console.log(err);
        return res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}
