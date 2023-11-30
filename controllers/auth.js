import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import QLC_Positions from "../models/qlc/Positions.js";
import QLC_Deparments from "../models/qlc/Deparment.js";
import Contact from "../models/Contact.js";
import Verify from "../models/Verify.js";
import { urlImgHost } from '../utils/config.js'
import { fUsers } from "../functions/fModels/fUsers.js";
import { UsersModelExtra } from "../functions/fModels/fUsers.js";
import { InsertNewUser } from "../functions/handleModels/InsertNewUser.js";
import { InsertNewUserExtra } from "../functions/fTools/fUsers.js";
import { UpdateInfoUser } from "../functions/fTools/fUsers.js";
import { GetUserByID365 } from "../functions/fTools/fUsers.js";
import { downloadImage } from "../functions/fTools/Download.js";
import { createError } from "../utils/error.js";
import { HandleNoSqlInjection } from "../functions/fTools/HandleQueryInjection.js";
import axios from 'axios'
import md5 from 'md5';
import qs from 'qs'
import io from 'socket.io-client';
import geoip from 'geoip-lite';
import jwt from "jsonwebtoken";
import { tokenPassword } from '../utils/checkToken.js'
import { GetAvatarUser } from "../utils/GetAvatarUser.js"
import { GetAvatarUserSmall } from "../utils/GetAvatarUser.js"
import { FCreateNewConversation } from "../functions/Fconversation.js";
import { FSendMessage } from "../functions/fApi/message.js";
let urlImg = `${urlImgHost()}avatarUser`;

const socket2 = io.connect('wss://socket.timviec365.vn', {
    secure: true,
    enabledTransports: ["wss"],
    transports: ['websocket', 'polling'],
});

function isNullOrWhitespace(input) {
    return !input || !input.trim();
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
        str = str.replace(/\u0300|\u0301|\u0305|\u0309|\u0323/g, "");
        str = str.replace(/\u02C6|\u0306|\u031B/g, "");
        str = str.replace(/ + /g, " ");
        str = str.trim();

        str = str.replace(/!|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
        return str;
    } else {
        return ""
    }
}

const CheckVerify = async(emailPhone) => {
    try {
        let checkData = await Verify.find({ EmailPhone: emailPhone }).lean();
        if (checkData) {
            if (checkData.length) {
                return Number(checkData[0].Permission);
            } else {
                return 0;
            }
        }
    } catch (e) {
        return 0;
        console.log(e)
    }
}

const VerifyUser = async(emailPhone, type365) => {
    try {
        let checkData = await Verify.find({ EmailPhone: emailPhone }).lean();
        if (checkData) {
            if (checkData.length) {
                Verify.updateMany({ EmailPhone: emailPhone }, { $set: { Permission: 1 } }).catch((e) => { console.log(e) });
            } else {
                let newVerify = new Verify({
                    EmailPhone: emailPhone,
                    Type: (!isNaN(type365)) ? Number(type365) : 0,
                    Permission: 1,
                });
                newVerify.save().catch((e) => { console.log(e) });
                if (Number(type365 != 0)) {
                    let newVerify2 = new Verify({
                        EmailPhone: emailPhone,
                        Type: 0,
                        Permission: 1,
                    });
                    newVerify2.save().catch((e) => { console.log(e) });
                }
            }
        }
    } catch (e) {
        console.log(e)
    }
}

export const luutrucanhan = async(userId) => {
    let userCheck = await User.findOne({ _id: userId })
    if (userCheck) {
        let checkContact = await Contact.find({
            $or: [
                { userFist: userId, userSecond: 1216972 },
                { userFist: 1216972, userSecond: userId }
            ]
        }).limit(1).lean();

        if (!checkContact.length) {
            let newContact = new Contact({
                userFist: 1216972,
                userSecond: userId
            })
            newContact.save().catch((e) => {
                console.log(e);
            });
        }
    }
}

export const checkNewUser = async(userId) => {
    try {
        console.log("checkNewUser", userId)
        let userCheckExist = await User.find({ _id: userId });
        let flag = true;
        if (userCheckExist && userCheckExist.length > 0 && flag) {
            let checkContact = await Contact.find({
                $or: [
                    { userFist: userId, userSecond: 56387 },
                    { userFist: 56387, userSecond: userId }
                ]
            }).limit(1).lean();

            if (!checkContact.length) {
                let newContact = new Contact({
                    userFist: 56387,
                    userSecond: userId
                })
                newContact.save().catch((e) => {
                    console.log(e);
                });
            }
            let content = 'Chào bạn, bạn đăng ký tài khoản có gặp khó khăn gì không ạ? M xin được hỗ trợ ạ?\n*** Ưu đãi đặc quyền Chat365:\n- Chiết khấu 4-10% khi mua thẻ cào điện thoại trên Chat365.\n- Ví dụ: Mua Thẻ cào điện thoại 100.000 VND chỉ còn 90.000 VND đến 96.000 VND.\n- Nhắn tin với tôi để mua thẻ.';
            if (userCheckExist.length) {
                if ((userCheckExist[0].fromWeb == "timviec365")) {
                    if (userCheckExist[0].type365 == 1) {
                        flag = false;
                    }
                };
                if ((userCheckExist[0].fromWeb == "timviec365")) {
                    if (userCheckExist[0].type365 == 0) {
                        content = 'Ứng viên tạo cv xong cần: Tải app chat365 về và đăng nhập tài khoản ứng viên vào chat365 mục “tài khoản cá nhân”; vào chat365 sau đăng nhập sẽ có tài khoản “Công ty Cổ phần thanh toán Hưng Hà” gửi CV bằng file ảnh hoặc file PDF cho ứng viên trên chat365; tại đây ứng viên có thể tải CV dạng ảnh hoặc dạng PDF về máy hoặc chia sẻ sang các mạng xã hội khác.\n*** Ưu đãi đặc quyền Chat365:\n- Chiết khấu 4-10% khi mua thẻ cào điện thoại trên Chat365.\n- Ví dụ: Mua Thẻ cào điện thoại 100.000 VND chỉ còn 90.000 VND đến 96.000 VND.\n- Nhắn tin với tôi để mua thẻ.'
                    }
                }
                if (flag) {
                    console.log("flag thoa man")
                    const existConversation = await Conversation.findOne({
                        $and: [
                            { "typeGroup": "liveChatV2" },
                            { "memberList.memberId": { $eq: userId } },
                            { "memberList.memberId": { $eq: 56387 } },
                            { "messageList.message": { $eq: content } }
                        ],
                        isGroup: 1,
                    }).lean();
                    if ((!existConversation)) {
                        console.log("Khong ton tai")
                        let today = new Date();
                        let pastday = new Date();
                        pastday.setDate(today.getDate() - 15);
                        const bigestId = (
                            await Conversation.find().sort({ _id: -1 }).select("_id").limit(1).lean()
                        )[0]._id;
                        const newConversation = await Conversation.create({
                            _id: bigestId + 1,
                            isGroup: 1,
                            typeGroup: "liveChatV2",
                            memberList: [{
                                    memberId: userId,
                                    notification: 1,
                                    conversationName: `Hỗ trợ khách hàng lần đầu đăng nhập chat365-${userCheckExist[0]._id}`,
                                    unReader: 1,
                                    liveChat: {
                                        clientId: userId,
                                        fromConversation: 275601,
                                        fromWeb: userCheckExist[0].fromWeb
                                    }
                                },
                                {
                                    memberId: 56387,
                                    unReader: 1,
                                    conversationName: `Hỗ trợ khách hàng lần đầu đăng nhập chat365-${userCheckExist[0]._id}`,
                                    notification: 1,
                                }
                            ],
                            messageList: [],
                            browseMemberList: [],
                            timeLastMessage: new Date(pastday),
                            timeLastChange: new Date(pastday)
                        });
                        let arrayMessage = [{
                            _id: `${((new Date).getTime() * 10000) + 621355968000000000 + 8}_${56387}`,
                            displayMessage: 0,
                            senderId: 56387,
                            messageType: "text",
                            message: content,
                            quoteMessage: "",
                            messageQuote: "",
                            createAt: new Date(pastday),
                            isEdited: 0,
                            infoLink: null,
                            listFile: [],
                            emotion: { Emotion1: "", Emotion2: "", Emotion3: "", Emotion4: "", Emotion5: "", Emotion6: "", Emotion7: "", Emotion8: "", },
                            deleteTime: 0,
                            deleteType: 0,
                            deleteDate: new Date("0001-01-01T00:00:00.000+00:00"),
                            notiClicked: 0,
                            infoSupport: null,
                            liveChat: null,
                        }];
                        await Conversation.findOneAndUpdate({ _id: newConversation._id }, {
                            $push: {
                                messageList: {
                                    $each: arrayMessage
                                }
                            }
                        });
                    }
                } else {
                    console.log("flag khong thoa man")
                }
            }
        }
    } catch (e) {
        console.log("checkNewUser", e)
    }
}

const IDdev = "fb9d65535ac34584";
export const login = async(req, res) => {
    try {
        console.log("login", req.body);
        let flagdev = false;
        if (req.body.IdDevice == IDdev && (req.body.Email != "tuananhhust05@gmail.com")) {
            // flagdev = true;
        }
        let ipAddress = req.socket.remoteAddress;
        let geo = geoip.lookup(ipAddress);
        let IdDevice = req.body.IdDevice;
        let NameDevice = req.body.NameDevice;
        let latitude = 0;
        let longtitude = 0;
        if (geo && geo.ll && (geo.ll.length > 0)) {
            latitude = geo.ll[0];
            longtitude = geo.ll[1];
        }
        if (req && req.body && req.body.Email && req.body.Password) {
            let user = req.body
            let type_pass
            if ((!user.Type_Pass) && (!Number(user.Type_Pass))) {
                type_pass = 0;
            } else {
                type_pass = Number(user.Type_Pass);
            }
            let account = await User.find({
                // type: Number(req.body.Type365),
                $or: [{
                        email: user.Email,
                        password: type_pass == 0 ? String(md5(user.Password)) : user.Password,
                    },
                    {
                        phoneTK: user.Email,
                        password: type_pass == 0 ? String(md5(user.Password)) : user.Password,
                    }
                ]
            }, { type365: '$type' }).lean();
            if (flagdev) {
                console.log("Máy dev")
                account = await User.find({
                    $or: [{
                            email: user.Email
                        },
                        {
                            phoneTK: user.Email
                        }
                    ]
                }, { type365: '$type' }).lean();
                let resfinal = {};
                resfinal._id = account[0]._id;
                resfinal.id = account[0]._id;
                resfinal.iD365 = account[0].id365;
                resfinal.id365 = account[0].id365;
                resfinal.type365 = account[0].type365;
                resfinal.email = account[0].email;
                resfinal.password = account[0].password;
                resfinal.phone = account[0].phone;
                resfinal.userName = account[0].userName;
                // resfinal.avatarUser = `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
                resfinal.avatarUserSmall = GetAvatarUserSmall(account[0]._id, account[0].userName, account[0].avatarUser)
                resfinal.avatarUser = GetAvatarUser(account[0]._id, account[0].type, account[0].fromWeb, account[0].createdAt, account[0].userName, account[0].avatarUser)
                resfinal.status = account[0].status;
                resfinal.statusEmotion = account[0].statusEmotion;
                resfinal.lastActive = account[0].lastActive || new Date();
                resfinal.active = account[0].active;
                resfinal.isOnline = account[0].isOnline;
                resfinal.looker = account[0].looker;
                resfinal.companyId = account[0].companyId;
                resfinal.dep_id = account[0].dep_id;
                if (account[0].dep_id != 0) {
                    let dep = await QLC_Deparments.findOne({ com_id: account[0].companyId, dep_id: account[0].dep_id });
                    const dep_name = dep ? dep.dep_name : "";
                    resfinal.dep_name = dep_name || '';
                }
                resfinal.position_id = account[0].position_id;
                if (account[0].position_id != 0) {
                    let position = await QLC_Positions.findOne({ comId: account[0].companyId, id: account[0].position_id });
                    const position_name = position ? position.positionName : "";
                    resfinal.position_name = position_name || '';
                }
                if (account[0].companyId !== 0) {
                    let company = await User.findOne({ idQLC: account[0].companyId }, { userName: 1 }).lean();
                    const companyName = company ? company.userName : "";
                    resfinal.companyName = companyName || '';
                }
                resfinal.acceptMessStranger = account[0].acceptMessStranger;
                resfinal.idTimViec = account[0].idTimViec;
                resfinal.fromWeb = account[0].fromWeb;
                resfinal.secretCode = account[0].secretCode;
                resfinal.HistoryAccess = account[0].HistoryAccess;
                resfinal.linkAvatar = `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
                resfinal.verified = 1;


                return res.json({
                    data: {
                        result: true,
                        message: "Đăng nhập thành công",
                        userName: account[0].userName,
                        countConversation: 100,
                        conversationId: 0,
                        total: 0,
                        listUserOnline: null,
                        currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                        user_info: resfinal,
                        token: "hhdhhde",
                        refreshtoken: "jdjdjdj",
                        user_list: null,
                        warning: 0,
                    },
                    error: null
                });
            }
            if (account && account.length) {
                let typeData = new Map();
                for (let i = 0; i < account.length; i++) {
                    typeData.set(account[i].type365, true);
                }
                if (!typeData.get(Number(user.Type365))) {
                    if (Number(user.Type365) == 0 && !typeData.get(0) && typeData.get(2)) {
                        user.Type365 = "2";
                    } else {
                        if (typeData.get(0)) {
                            return res.status(450).json(createError(450, "Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                        } else if (typeData.get(1)) {
                            return res.status(451).json(createError(451, "Tài khoản đang sử dụng là tài khoản công ty"));
                        } else if (typeData.get(2)) {
                            return res.status(452).json(createError(452, "Tài khoản đang thuộc diện khách hàng nhân viên, vui lòng chọn đúng loại tài khoản"));
                        }
                    }
                }
            }

            let response
            try {
                response = await axios({
                    method: "post",
                    url: "http://210.245.108.202:3000/api/qlc/employee/login",
                    data: {
                        account: user.Email,
                        password: `${type_pass == 0 ? String(md5(user.Password)) : user.Password}`,
                        type: user.Type365,
                        pass_type: 1
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                })
                if (!response.data.data.data.access_token) {
                    response = await axios({
                        method: "post",
                        url: "http://210.245.108.202:3000/api/qlc/employee/login",
                        data: {
                            account: user.Email,
                            password: `${type_pass == 0 ? String(md5(user.Password)) : user.Password}`,
                            type: 2,
                            pass_type: 1
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    })
                }
            } catch (err) {
                return res.status(308).json(createError(308, "Thông tin tài khoản hoặc mật khẩu không chính xác"));
            }
            if (response.data.data) {
                // checkNewUser(user._id)
                // luutrucanhan(user._id)
                let account = await User.find({
                    $or: [{
                            email: user.Email,
                            password: type_pass == 0 ? String(md5(user.Password)) : user.Password,
                            type: user.Type365
                        },
                        {
                            phoneTK: user.Email,
                            password: type_pass == 0 ? String(md5(user.Password)) : user.Password,
                            type: user.Type365
                        }
                    ]
                }, {
                    _id: 1,
                    id365: '$idQLC',
                    type365: '$type',
                    email: { $cond: { if: { $and: [{ $ne: ['$email', null] }, { $ne: ['$email', ''] }] }, then: '$email', else: '$phoneTK' } },
                    // email: { $ifNull: ['$email', '$phoneTK'] },
                    password: 1,
                    phone: 1,
                    userName: 1,
                    avatarUser: 1,
                    status: '$configChat.status',
                    statusEmotion: '$configChat.statusEmotion',
                    lastActive: '$lastActivedAt',
                    active: '$configChat.active',
                    isOnline: 1,
                    looker: { $ifNull: ['$looker', 1] },
                    companyId: { $ifNull: ['$inForPerson.employee.com_id', '$idQLC'] },
                    dep_id: { $ifNull: ['$inForPerson.employee.dep_id', 0] },
                    position_id: { $ifNull: ['$inForPerson.employee.position_id', 0] },
                    acceptMessStranger: '$configChat.acceptMessStranger',
                    idTimViec: '$idTimViec365',
                    fromWeb: 1,
                    secretCode: '$chat365_secret',
                    HistoryAccess: '$configChat.HistoryAccess',
                    authentic: "$authentic",
                    ep_status: "$inForPerson.employee.ep_status"
                }).limit(1).lean();

                if (!account.length) return res.status(308).json(createError(308, "Thông tin tài khoản hoặc mật khẩu không chính xác"));

                if (account[0].authentic == 0) return res.status(402).json(createError(402, "Tài khoản chưa được xác thực"));
                // if (user.Type365 == 2 && account[0].ep_status == "Pending") return res.status(301).json(createError(301, "Công ty chưa duyệt tài khoản"));
                let count_conv = await Conversation.countDocuments({ "memberList.memberId": Number(account[0]._id), 'messageList.0': { $exists: true } })
                let warning
                let resfinal = {};
                resfinal._id = account[0]._id;
                resfinal.id = account[0]._id;
                resfinal.iD365 = account[0].id365;
                resfinal.id365 = account[0].id365;
                resfinal.type365 = account[0].type365;
                resfinal.email = account[0].email;
                resfinal.password = account[0].password;
                resfinal.phone = account[0].phone;
                resfinal.userName = account[0].userName;
                // resfinal.avatarUser = `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
                resfinal.avatarUserSmall = GetAvatarUserSmall(account[0]._id, account[0].userName, account[0].avatarUser)
                resfinal.avatarUser = GetAvatarUser(account[0]._id, account[0].type, account[0].fromWeb, account[0].createdAt, account[0].userName, account[0].avatarUser)
                resfinal.status = account[0].status;
                resfinal.statusEmotion = account[0].statusEmotion;
                resfinal.lastActive = account[0].lastActive || new Date();
                resfinal.active = account[0].active;
                resfinal.isOnline = account[0].isOnline;
                resfinal.looker = account[0].looker;
                resfinal.companyId = account[0].companyId;
                resfinal.dep_id = account[0].dep_id;
                if (account[0].dep_id != 0) {
                    let dep = await QLC_Deparments.findOne({ com_id: account[0].companyId, dep_id: account[0].dep_id });

                    const dep_name = dep ? dep.dep_name : "";
                    resfinal.dep_name = dep_name || '';
                }
                resfinal.position_id = account[0].position_id;
                if (account[0].position_id != 0) {
                    let pos = await QLC_Positions.findOne({ comId: account[0].companyId, id: account[0].position_id });
                    const position_name = pos ? pos.positionName : "";
                    resfinal.position_name = position_name || '';
                }
                if (account[0].companyId !== 0) {
                    let company = await User.findOne({ idQLC: account[0].companyId }, { userName: 1 }).lean();
                    const companyName = company ? company.userName : "";
                    resfinal.companyName = companyName || '';
                }
                resfinal.acceptMessStranger = account[0].acceptMessStranger;
                resfinal.idTimViec = account[0].idTimViec;
                resfinal.fromWeb = account[0].fromWeb;
                resfinal.secretCode = account[0].secretCode;
                resfinal.HistoryAccess = account[0].HistoryAccess;
                resfinal.linkAvatar = `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
                resfinal.verified = 1;


                res.json({
                    data: {
                        result: true,
                        message: "Đăng nhập thành công",
                        userName: account[0].userName,
                        countConversation: count_conv,
                        conversationId: 0,
                        total: 0,
                        listUserOnline: null,
                        currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                        user_info: resfinal,
                        token: response.data.data.data.access_token,
                        refreshtoken: response.data.data.data.refresh_token,
                        user_list: null,
                        warning,
                    },
                    error: null
                });
                await User.findOneAndUpdate({ _id: resfinal._id }, { 'configChat.userNameNoVn': removeVietnameseTones(resfinal.userName) })
            } else {
                return res.status(308).json(createError(308, "Thông tin tài khoản hoặc mật khẩu không chính xác"));
            }
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin tài khoản"));
        }
    } catch (err) {
        console.log("login", err);
        res.status(200).json(createError(200, err.message));
    }
}

export const login_v2 = async(req, res, next) => {
    try {
        let ipAddress = req.socket.remoteAddress;
        let geo = geoip.lookup(ipAddress);
        let IdDevice = req.body.IdDevice;
        let NameDevice = req.body.NameDevice;
        let latitude = 0;
        let longtitude = 0;
        if (geo && geo.ll && (geo.ll.length > 0)) {
            latitude = geo.ll[0];
            longtitude = geo.ll[1];
        }

        if (req && req.body && req.body.Email && req.body.Password) {
            let verified = await CheckVerify(req.body.Email);
            let type_pass;
            let user = req.body;
            if ((user.Password == "") || (user.Email == "")) {
                res.status(200).json(createError(200, "Thông tin truyền lên không hợp lệ"));
            } else {
                if ((!user.Type_Pass) && (!Number(user.Type_Pass))) {
                    type_pass = 0;
                } else {
                    type_pass = Number(user.Type_Pass);
                }
                let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/login_chat_h.php', qs.stringify({
                    'email': `${String(user.Email)}`,
                    'pass': `${type_pass == 0 ? String(md5(user.Password)) : user.Password}`,
                    'os': 'os',
                    'from': 'chat365',
                    'type': `${String(user.Type365)}`
                }));

                if (response.data.data) {
                    let pass = type_pass == 0 ? String(md5(user.Password)) : user.Password;
                    User.updateMany({ email: user.Email, type365: Number(user.Type365) }, { $set: { password: pass } }).catch((e) => { console.log(e) });
                    if (user.Type365 != 0) {
                        let id365Update = 0;
                        if (user.Type365 == 1) {
                            if (response.data.data.user_info && response.data.data.user_info.com_id) {
                                id365Update = Number(response.data.data.user_info.com_id);
                            }
                        } else if (user.Type365 == 2) {
                            if (response.data.data.user_info && response.data.data.user_info.ep_id) {
                                id365Update = Number(response.data.data.user_info.ep_id)
                            }
                        }
                        if (id365Update) {
                            User.updateMany({ email: user.Email }, { $set: { id365: id365Update } }).catch((e) => {
                                console.log(e);
                            })
                        }
                    }
                    verified = 1;
                    let flag = false;
                    let account = await User.find({ email: user.Email, password: type_pass == 0 ? String(md5(user.Password)) : user.Password }).limit(1);

                    if ((account.length == 0) && (user.Type365 == 0)) {
                        account = await User.find({ email: user.email, type365: Number(user.Type365) });
                        flag = true;
                    }

                    let flagCheckExist = false;
                    if (account && (account.length > 0)) {
                        if (Number(account[0].type365) == Number(user.Type365)) {
                            flagCheckExist = true;
                        } else {
                            account = await User.find({ email: user.Email, password: type_pass == 0 ? String(md5(user.Password)) : user.Password, type365: Number(user.Type365) }).limit(1);
                            if (account && account.length) {
                                flagCheckExist = true;
                            }
                        }
                    }
                    if (flagCheckExist) {
                        await User.updateOne({ _id: account[0]._id }, { $set: { type365: user.Type365 } });
                        if (!account[0].userName) {
                            if (user.Type365 == 1) {
                                User.updateOne({ _id: account[0]._id }, { $set: { userName: response.data.data.user_info.com_name } }).catch((e) => { console.log("api login, update userName company") })
                            } else {
                                User.updateOne({ _id: account[0]._id }, { $set: { userName: response.data.data.user_info.ep_name } }).catch((e) => { console.log("api login, update userNamess") })
                            }
                        }
                        luutrucanhan(account[0]._id)
                        checkNewUser(account[0]._id);

                        if (flag) {
                            account[0].id365 = 0;
                            account[0].companyId = 0;
                            account[0].type365 = 0;
                            account[0].companyName = ""
                        }

                        let resfinal = {};
                        if (true) {
                            if (req.body.Type365 && (String(req.body.Type365) == "2") && response.data.data.user_info.com_id && (Number(response.data.data.user_info.com_id) !== 0)) {
                                User.updateOne({ _id: account[0]._id }, { $set: { companyId: Number(response.data.data.user_info.com_id) } }).catch((e) => { console.log(e) });
                            }
                            resfinal._id = account[0]._id
                            resfinal.id = account[0]._id
                            resfinal.ID365 = account[0].id365;
                            resfinal.type365 = account[0].type365;
                            resfinal.email = account[0].email;
                            resfinal.password = account[0].password;
                            resfinal.phone = account[0].phone;
                            resfinal.userName = account[0].userName;
                            // resfinal.avatarUser = `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
                            resfinal.avatarUserSmall = GetAvatarUserSmall(account[0]._id, account[0].userName, account[0].avatarUser)
                            resfinal.avatarUser = GetAvatarUser(account[0]._id, account[0].type, account[0].fromWeb, account[0].createdAt, account[0].userName, account[0].avatarUser)
                            resfinal.status = account[0].status;
                            resfinal.statusEmotion = account[0].statusEmotion;
                            resfinal.lastActive = account[0].lastActive;
                            resfinal.active = account[0].active;
                            resfinal.isOnline = account[0].isOnline;
                            resfinal.looker = account[0].looker;
                            resfinal.companyId = account[0].companyId;
                            if (req.body.Type365 && (String(req.body.Type365) == "2") && response.data.data.user_info.com_id && (Number(response.data.data.user_info.com_id) !== 0)) {
                                resfinal.companyId = Number(response.data.data.user_info.com_id);
                            }
                            resfinal.companyName = account[0].companyName;
                            resfinal.notificationPayoff = account[0].notificationPayoff;
                            resfinal.notificationCalendar = account[0].notificationCalendar;
                            resfinal.notificationReport = account[0].notificationReport;
                            resfinal.notificationOffer = account[0].notificationOffer;
                            resfinal.notificationPersonnelChange = account[0].notificationPersonnelChange;
                            resfinal.notificationRewardDiscipline = account[0].notificationRewardDiscipline;
                            resfinal.notificationNewPersonnel = account[0].notificationNewPersonnel;
                            resfinal.notificationChangeProfile = account[0].notificationChangeProfile;
                            resfinal.notificationTransferAsset = account[0].notificationTransferAsset;
                            resfinal.acceptMessStranger = account[0].acceptMessStranger;
                            resfinal.idTimViec = account[0].idTimViec;
                            resfinal.fromWeb = account[0].fromWeb;
                            resfinal.secretCode = account[0].secretCode;
                            resfinal.HistoryAccess = account[0].HistoryAccess;
                            resfinal.linkAvatar = `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
                            resfinal.verified = verified;
                        }

                        let time = new Date();
                        let token = jwt.sign({ _id: account[0]._id, timeExpried: time.setDate(time.getDate() + 3) },
                            tokenPassword()
                        );
                        // nếu truyền thêm hai trường này thì trả thêm cảnh báo 
                        if (IdDevice && NameDevice) {
                            let warning = 0;
                            if ((resfinal.HistoryAccess.length == 0)) {
                                // console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                                User.updateOne({ _id: resfinal._id }, {
                                    $push: {
                                        HistoryAccess: {
                                            IdDevice: String(IdDevice),
                                            IpAddress: String(ipAddress),
                                            NameDevice: String(NameDevice),
                                            Time: new Date(),
                                            AccessPermision: true
                                        }
                                    },
                                    $set: {
                                        latitude: Number(latitude),
                                        longtitude: Number(longtitude),
                                        isOnline: 1,
                                    }
                                }).catch((e) => { console.log(e) })
                            } else {
                                // console.log("Có thiết bị đã đăng nhập");
                                let find1 = resfinal.HistoryAccess.find(e => e.IdDevice == IdDevice);
                                if (find1) {
                                    // console.log("Thiết bị này đã đăng nhập");
                                    if (find1.AccessPermision) {
                                        // console.log("Thiết bị này hợp lệ");
                                        User.updateOne({ _id: resfinal._id, "HistoryAccess.IdDevice": String(IdDevice) }, {
                                            $set: {
                                                "HistoryAccess.$.Time": new Date(),
                                                "HistoryAccess.$.IpAddress": String(ipAddress),
                                                "HistoryAccess.$.NameDevice": String(NameDevice),
                                                latitude: Number(latitude),
                                                longtitude: Number(longtitude),
                                                isOnline: 1,
                                            }
                                        }).catch((e) => { console.log(e) })
                                    } else {
                                        // console.log("Thiết bị này k hợp lệ");
                                        warning = 1;
                                        User.updateOne({ _id: resfinal._id, "HistoryAccess.IdDevice": String(IdDevice) }, {
                                            $set: {
                                                "HistoryAccess.$.Time": new Date(),
                                                "HistoryAccess.$.IpAddress": String(ipAddress),
                                                "HistoryAccess.$.NameDevice": String(NameDevice)
                                            }
                                        }).catch((e) => { console.log(e) })
                                    }

                                } else {
                                    // console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                                    warning = 1;
                                    User.updateOne({ _id: resfinal._id }, {
                                        $push: {
                                            HistoryAccess: {
                                                IdDevice: String(IdDevice),
                                                IpAddress: String(ipAddress),
                                                NameDevice: String(NameDevice),
                                                Time: new Date(),
                                                AccessPermision: false
                                            }
                                        }
                                    }).catch((e) => { console.log(e) })
                                }
                            }
                            let checkFrienList = await Contact.find({
                                $or: [
                                    { userFist: resfinal._id },
                                    { userSecond: resfinal._id }
                                ]
                            }).limit(1);
                            if (checkFrienList.length == 0) {
                                warning = 0;
                            }
                            // xóa field 
                            delete resfinal.HistoryAccess;
                            res.json({
                                data: {
                                    result: true,
                                    message: "Đăng nhập thành công",
                                    userName: flag ? null : account[0].userName,
                                    conversationId: 0,
                                    total: 0,
                                    listUserOnline: null,
                                    currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                                    user_info: resfinal,
                                    user_list: null,
                                    warning,
                                    token
                                },
                                error: null
                            });
                        } else {
                            delete resfinal.HistoryAccess;
                            User.updateOne({ _id: resfinal._id }, {
                                $set: {
                                    latitude: Number(latitude),
                                    longtitude: Number(longtitude),
                                    isOnline: 1,
                                }
                            }).catch((e) => { console.log(e) })
                            res.json({
                                data: {
                                    result: true,
                                    message: "Đăng nhập thành công",
                                    userName: flag ? null : account[0].userName,
                                    conversationId: 0,
                                    total: 0,
                                    listUserOnline: null,
                                    currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                                    user_info: resfinal,
                                    user_list: null,
                                    token
                                },
                                error: null
                            });
                        }
                    } else {
                        if (user.Type365 == 1) { // nếu là tài khoản công ty 
                            user = await InsertNewUser(
                                fUsers(-1, response.data.data.user_info.com_id, 0, user.Type365,
                                    response.data.data.user_info.com_email,
                                    type_pass == 0 ? String(md5(user.Password)) : user.Password,
                                    response.data.data.user_info.com_phone,
                                    response.data.data.user_info.com_name,
                                    response.data.data.user_info.com_logo ? response.data.data.user_info.com_logo : "", // logo công ty, có thể null 
                                    "", 0, new Date(),
                                    1, 0, 0,
                                    response.data.data.user_info.com_id,
                                    response.data.data.user_info.com_name,
                                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
                                ),
                                false,
                                "quanlychung365",
                                verified
                            )
                        } else if (user.Type365 == 2) { // tài khoản nhân viên 
                            user = await InsertNewUser(
                                fUsers(-1, response.data.data.user_info.ep_id, 0,
                                    user.Type365, response.data.data.user_info.ep_email,
                                    type_pass == 0 ? String(md5(user.Password)) : user.Password,
                                    response.data.data.user_info.ep_phone,
                                    response.data.data.user_info.ep_name,
                                    response.data.data.user_info.ep_image ? response.data.data.user_info.ep_image : "",
                                    "", 0, new Date(), 1, 0, 0,
                                    response.data.data.user_info.com_id, response.data.data.user_info.com_name,
                                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
                                ),
                                false,
                                "quanlychung365",
                                verified
                            )
                        } else { // tài khoản cá nhân 
                            user = await InsertNewUser(
                                fUsers(-1, 0, 0, user.Type365, response.data.data.user_info.ep_email,
                                    type_pass == 0 ? String(md5(user.Password)) : user.Password,
                                    response.data.data.user_info.ep_phone, response.data.data.user_info.ep_name,
                                    response.data.data.user_info.ep_image ? response.data.data.user_info.ep_image : "", "", 0, new Date(), 1, 0, 0, 0, "",
                                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
                                ),
                                false,
                                "quanlychung365",
                                verified
                            )
                        }
                        // user là dữ liệu trả về từ các lệnh insert trên kia 
                        if (user && user._id) {
                            try {
                                checkNewUser(user._id)
                                luutrucanhan(user._id)
                                let check_com = await GetUserByID365(Number(response.data.data.user_info.com_id), 1);
                                // nếu chưa có công ty của user muốn đăng nhập thì lên quản lý chung lấy dữ liệu xuống và tạo tài khaonr cho công ty đó
                                if (user.companyId && (Number(user.companyId)) && (Number(user.companyId) != 0) && (check_com.length == 0)) {
                                    let response2 = await axios.get(`https://chamcong.24hpay.vn/api_tinhluong/list_com.php?id_com=${response.data.data.user_info.com_id}`);
                                    if (response2.data) {
                                        try {
                                            let user2 = UsersModelExtra(-1, response.data.data.user_info.com_id, 0, 1, response2.data.data.items[0].com_email,
                                                response2.data.data.items[0].com_pass, response2.data.data.items[0].com_phone, response2.data.data.items[0].com_name,
                                                response2.data.data.items[0].com_logo ? response2.data.data.items[0].com_logo : "" // có thể null 
                                                , "", 0, new Date(), 1, 0, 0,
                                                response.data.data.user_info.com_id, response2.data.data.items[0].com_name);
                                            let dataArr;
                                            let bytesize;
                                            let imgUrl;
                                            // nếu có link ảnh thì tiến hành tải ảnh 
                                            if ((user2.AvatarUser) && (user2.AvatarUser != "") && (!(isNullOrWhitespace(String(user2.AvatarUser)))) && (!(user2.AvatarUser.trim() == 0))) {
                                                2
                                                dataArr = await axios.get(`https://chamcong.24hpay.vn/upload/company/logo/${user.AvatarUser}`);
                                                bytesize = String(dataArr).length;
                                                imgUrl = `https://chamcong.24hpay.vn/upload/company/logo/${user.AvatarUser}`;
                                            }
                                            let userId = InsertNewUserExtra(user2.UserName, user2.ID365, user2.IDTimViec, user2.Type365, user2.Email, user2.Password, user2.CompanyId, user2.CompanyName, "quanlychung365");
                                            if (userId > 0) {
                                                if (String(dataArr).length > 0) {
                                                    // console.log('1')
                                                    let filePath = `./public/avatarUser/${userId}`;
                                                    let time_start_file = ((new Date).getTime() * 10000) + 621355968000000000;
                                                    let fileName = `${time_start_file}_${userId}.jpg`;
                                                    await downloadImage(userId, imgUrl, filePath, fileName);
                                                    // update thông tin về avatarUser 
                                                    await UpdateInfoUser(userId, user2.ID365, user2.Type365, user2.UserName, `${time_start_file}_${userId}.jpg`, user2.Password, user2.CompanyId, user2.CompanyName, 0)
                                                }
                                            }
                                            await VerifyUser(response2.data.data.items[0].com_email, 1);
                                        } catch (e) {
                                            //res.status(200).json(createError(200,e));
                                            console.log(e);
                                        }
                                    }
                                }

                                let time = new Date();
                                let token = jwt.sign({ _id: user._id, timeExpried: time.setDate(time.getDate() + 3) },
                                    tokenPassword()
                                );
                                if (IdDevice && NameDevice) {
                                    let warning = 0;
                                    if ((user.HistoryAccess.length == 0)) {
                                        // console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                                        await User.updateOne({ _id: user._id }, {
                                            $push: {
                                                HistoryAccess: {
                                                    IdDevice: String(IdDevice),
                                                    IpAddress: String(ipAddress),
                                                    NameDevice: String(NameDevice),
                                                    Time: new Date(),
                                                    AccessPermision: true
                                                }
                                            },
                                            $set: {
                                                latitude: Number(latitude),
                                                longtitude: Number(longtitude),
                                                isOnline: 1
                                            }
                                        }, ).catch((e) => { console.log(e) })
                                    } else {
                                        // console.log("Có thiết bị đã đăng nhập");
                                        let find1 = user.HistoryAccess.find(e => e.IdDevice == IdDevice);
                                        if (find1) {
                                            // console.log("Thiết bị này đã đăng nhập");
                                            if (find1.AccessPermision) {
                                                // console.log("Thiết bị này hợp lệ");
                                                User.updateOne({ _id: user._id, "HistoryAccess.IdDevice": String(IdDevice) }, {
                                                    $set: {
                                                        "HistoryAccess.$.Time": new Date(),
                                                        "HistoryAccess.$.IpAddress": String(ipAddress),
                                                        "HistoryAccess.$.NameDevice": String(NameDevice),
                                                        latitude: Number(latitude),
                                                        longtitude: Number(longtitude),
                                                        isOnline: 1,
                                                    }
                                                }).catch((e) => { console.log(e) })
                                            } else {
                                                // console.log("Thiết bị này k hợp lệ");
                                                warning = 1;
                                                User.updateOne({ _id: user._id, "HistoryAccess.IdDevice": String(IdDevice) }, {
                                                    $set: {
                                                        "HistoryAccess.$.Time": new Date(),
                                                        "HistoryAccess.$.IpAddress": String(ipAddress),
                                                        "HistoryAccess.$.NameDevice": String(NameDevice)
                                                    }
                                                }).catch((e) => { console.log(e) })
                                            }

                                        } else {
                                            // console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                                            warning = 1;
                                            User.updateOne({ _id: user._id }, {
                                                $push: {
                                                    HistoryAccess: {
                                                        IdDevice: String(IdDevice),
                                                        IpAddress: String(ipAddress),
                                                        NameDevice: String(NameDevice),
                                                        Time: new Date(),
                                                        AccessPermision: false
                                                    }
                                                }
                                            }).catch((e) => { console.log(e) })
                                        }
                                    }
                                    // Không trẩ về mảng lịch sử truye cập 

                                    let checkFrienList = await Contact.find({
                                        $or: [
                                            { userFist: user._id },
                                            { userSecond: user._id }
                                        ]
                                    }).limit(1);
                                    if (checkFrienList.length == 0) {
                                        warning = 0;
                                    }
                                    delete user.HistoryAccess;
                                    res.json({
                                        data: {
                                            result: true,
                                            message: "Đăng nhập thành công",
                                            userName: user.userName ? user.userName : "",
                                            conversationId: 0,
                                            total: 0,
                                            listUserOnline: null,
                                            currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                                            user_info: user,
                                            user_list: null,
                                            warning,
                                            token
                                        },
                                        error: null
                                    });
                                } else {
                                    delete user.HistoryAccess;

                                    res.json({
                                        data: {
                                            result: true,
                                            message: "Đăng nhập thành công",
                                            userName: user.userName ? user.userName : "",
                                            conversationId: 0,
                                            total: 0,
                                            listUserOnline: null,
                                            currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                                            user_info: user,
                                            user_list: null,
                                            token
                                        },
                                        error: null
                                    });
                                }
                                // console.log("Dữ liệu sau khi insert khi có tài khoản quản lý chung nhưng không có tk chat, Đăng nhập thành công ", user)
                            } catch (e) {
                                console.log(e);
                                res.status(200).json(createError(200, e.message));
                            }
                        } else {
                            res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
                        }
                    }
                    if (verified != 0) {
                        await VerifyUser(user.Email, user.Type365);
                    }
                } else {
                    if (response.data.error && Number(response.data.error.code) == 401) {
                        if (response.data.error.message == "Tài khoản của bạn là tài khoản nhân viên") {
                            return res.status(302).json(createError(302, "Tài khoản của bạn là tài khoản nhân viên"));
                        } else {
                            return res.status(301).json(createError(301, response.data.error.message));
                        }
                    }
                    if (response.data.error && Number(response.data.error.code) == 300) {
                        return res.status(300).json(createError(300, "Tài khoản đang sử dụng là tài khoản Cá Nhân"));
                    }
                    if (response.data.error && Number(response.data.error.code) == 400) {
                        return res.status(300).json(createError(300, "Tài khoản đang sử dụng là tài khoản Cá Nhân"));
                    }
                    if (response.data.error && Number(response.data.error.code) == 405) {
                        if (response.data.error.message == "Tài khoản của bạn là tài khoản nhân viên") {
                            return res.status(302).json(createError(302, "Tài khoản của bạn là tài khoản nhân viên"));
                        }
                        if (response.data.error.message == "Tài khoản đang sử dụng là tài khoản Cá Nhân") {
                            return res.status(300).json(createError(300, "Tài khoản đang sử dụng là tài khoản Cá Nhân"));
                        }
                        if (response.data.error.message == "Tài khoản của bạn là tài khoản cá nhân") {
                            return res.status(300).json(createError(300, "Tài khoản đang sử dụng là tài khoản Cá Nhân"));
                        }
                        if (response.data.error.message == "Tài khoản của bạn là tài khoản công ty") {
                            return res.status(305).json(createError(305, "Tài khoản đang sử dụng là tài khoản công ty"));
                        }
                        if (response.data.error.message == "Tài khoản bạn vừa đăng nhập được xác định là tài khoản công ty") {
                            return res.status(305).json(createError(305, "Tài khoản đang sử dụng là tài khoản công ty"));
                        }
                    }

                    if ((response.data.error && Number(response.data.error.code) == 402) || (response.data.error && Number(response.data.error.code) == 400)) {
                        return res.status(402).json(createError(402, "Tài khoản công ty chưa xác thực"));
                    }
                    return res.status(308).json(createError(308, "Thông tin tài khoản hoặc mật khẩu không chính xác"));
                    //  // nếu không phải tài khoản cá nhân và không có tài khoản từ quản lý chung 
                    //  else if(user.Type365 !=0)
                    //  { 
                    //   // lấy ra tài khoản chat từ mail, pass và type 
                    //   let account = await User.find({email: user.Email,type365:Number(user.Type365),password:String(type_pass == 0 ? String(md5(user.Password)) : user.Password)}).limit(1);
                    //   if(account &&(account.length > 0)){  // nếu có dư liệu thì trả về bình thường 
                    //     const updatedIp = await User.findByIdAndUpdate(  // cập nhật ip 
                    //       account[0]._id,
                    //       { $set: {IpAddress:ipAddress} },
                    //       { new: true }
                    //     );

                    //     let resfinal = {};
                    //     if(true){
                    //      resfinal._id=account[0]._id;
                    //      resfinal.id=account[0]._id
                    //      resfinal.ID365=account[0].id365;
                    //      resfinal.id365=account[0].id365;
                    //      resfinal.type365=account[0].type365;
                    //      resfinal.email=account[0].email;
                    //      resfinal.password=account[0].password;
                    //      resfinal.phone=account[0].phone;
                    //      resfinal.userName=account[0].userName;
                    //      resfinal.avatarUser= account[0].avatarUser ?  `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
                    //      resfinal.status=account[0].status;
                    //      resfinal.statusEmotion=account[0].statusEmotion;
                    //      resfinal.lastActive=account[0].lastActive;
                    //      resfinal.active=account[0].active;
                    //      resfinal.isOnline=account[0].isOnline;
                    //      resfinal.looker=account[0].looker;
                    //      resfinal.companyId=account[0].companyId;
                    //      resfinal.companyName=account[0].companyName;
                    //      resfinal.notificationPayoff=account[0].notificationPayoff;
                    //      resfinal.notificationCalendar=account[0].notificationCalendar;
                    //      resfinal.notificationReport=account[0].notificationReport;
                    //      resfinal.notificationOffer=account[0].notificationOffer;
                    //      resfinal.notificationPersonnelChange=account[0].notificationPersonnelChange;
                    //      resfinal.notificationRewardDiscipline=account[0].notificationRewardDiscipline;
                    //      resfinal.notificationNewPersonnel=account[0].notificationNewPersonnel;
                    //      resfinal.notificationChangeProfile=account[0].notificationChangeProfile;
                    //      resfinal.notificationTransferAsset=account[0].notificationTransferAsset;
                    //      resfinal.acceptMessStranger=account[0].acceptMessStranger;
                    //      resfinal.idTimViec=account[0].idTimViec;
                    //      resfinal.fromWeb=account[0].fromWeb;
                    //      resfinal.secretCode=account[0].secretCode;
                    //      resfinal.HistoryAccess=account[0].HistoryAccess;
                    //      resfinal.linkAvatar= account[0].avatarUser ? `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
                    //      resfinal.verified =  verified;
                    //     }

                    //     if(IdDevice && NameDevice){
                    //       let warning = 0;
                    //       if((resfinal.HistoryAccess.length == 0)){
                    //         console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                    //         User.updateOne(
                    //           { _id: resfinal._id },
                    //           { $push: 
                    //             { 
                    //               HistoryAccess:
                    //              {
                    //                 IdDevice: String(IdDevice),
                    //                 IpAddress: String(ipAddress),
                    //                 NameDevice: String(NameDevice),
                    //                 Time: new Date(),
                    //                 AccessPermision: true
                    //               } 
                    //             },
                    //             $set: {
                    //              latitude:Number(latitude),
                    //              longtitude:Number(longtitude),
                    //              isOnline:1
                    //             } 
                    //           }
                    //         ).catch((e)=>{
                    //           console.log(e)
                    //         })
                    //       }
                    //       else{
                    //         console.log("Có thiết bị đã đăng nhập");
                    //         let find1 = resfinal.HistoryAccess.find(e => e.IdDevice == IdDevice);
                    //         if (find1){
                    //           console.log("Thiết bị này đã đăng nhập");
                    //           if(find1.AccessPermision){
                    //             console.log("Thiết bị này hợp lệ");
                    //             User.updateOne(
                    //               { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                    //               {
                    //                 $set :{
                    //                   "HistoryAccess.$.Time": new Date(),
                    //                   "HistoryAccess.$.IpAddress": String(ipAddress),
                    //                   "HistoryAccess.$.NameDevice": String(NameDevice),
                    //                   latitude:Number(latitude),
                    //                   longtitude:Number(longtitude),
                    //                   isOnline:1
                    //                 }
                    //               }
                    //             ).catch((e)=>{
                    //               console.log(e)
                    //             })
                    //           }
                    //           else{
                    //             console.log("Thiết bị này k hợp lệ");
                    //             warning = 1;
                    //             User.updateOne(
                    //               { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                    //               {
                    //                 $set :{
                    //                   "HistoryAccess.$.Time": new Date(),
                    //                   "HistoryAccess.$.IpAddress": String(ipAddress),
                    //                   "HistoryAccess.$.NameDevice": String(NameDevice),

                    //                 }
                    //               }
                    //             ).catch((e)=>{console.log(e)})
                    //           }

                    //         }
                    //         else{
                    //           console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                    //           warning=1;
                    //           User.updateOne(
                    //             { _id: resfinal._id },
                    //             { $push: 
                    //               { 
                    //                 HistoryAccess:
                    //                {
                    //                   IdDevice: String(IdDevice),
                    //                   IpAddress: String(ipAddress),
                    //                   NameDevice: String(NameDevice),
                    //                   Time: new Date(),
                    //                   AccessPermision: false
                    //                 } 
                    //               } 
                    //             }
                    //           ).catch((e)=>{console.log(e)})
                    //         }
                    //       }
                    //       delete resfinal.HistoryAccess;
                    //       let checkFrienList = await Contact.find( {$or: [
                    //         { userFist:resfinal._id },
                    //         { userSecond:resfinal._id }
                    //       ]}).limit(1);
                    //       if(checkFrienList.length==0){
                    //         warning=0;
                    //       }
                    //       res.json({
                    //         data:{
                    //           result:true,
                    //           message:"Đăng nhập thành công",
                    //           userName:resfinal.userName ? resfinal.userName : "",
                    //           conversationId:0,
                    //           total:0,
                    //           listUserOnline:null,
                    //           currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    //           user_info:resfinal,
                    //           user_list:null,
                    //           warning
                    //         },
                    //         error:null 
                    //        });
                    //     }
                    //     else{
                    //       delete resfinal.HistoryAccess;
                    //       User.updateOne(
                    //        { _id: resfinal._id },
                    //        { 
                    //          $set: {
                    //           latitude:Number(latitude),
                    //           longtitude:Number(longtitude),
                    //           isOnline:1                  }
                    //        }
                    //       ).catch((e)=>{console.log(e)})
                    //       res.json({
                    //         data:{
                    //           result:true,
                    //           message:"Đăng nhập thành công",
                    //           userName:resfinal.userName ? resfinal.userName : "",
                    //           conversationId:0,
                    //           total:0,
                    //           listUserOnline:null,
                    //           currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    //           user_info:resfinal,
                    //           user_list:null,
                    //         },
                    //         error:null 
                    //        });
                    //     }
                    //   }
                    //   // check xem có phải sai do type hay không 
                    //   else{
                    //     account= await User.find({email:user.Email,password:type_pass == 0 ? md5(user.Password) : user.Password});
                    //     if(account&&(account.length>0)){
                    //        let array =[];
                    //        for(let i=0; i<account.length; i++){
                    //         if(account[i].type365){
                    //           array.push(Number(account[i].type365));
                    //         }
                    //        }
                    //        if((array.includes(1)) &&(array.includes(0))){
                    //           res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //        else if( Number(account[0].type365) == 0){
                    //           res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //        else if( Number(account[0].type365) == 1 ){
                    //           res.status(305).json(createError(305,"Tài khoản đang thuộc diện khách hàng công ty, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //        else if( Number(account[0].type365) == 2 ){
                    //           res.status(302).json(createError(302,"Tài khoản đang thuộc diện khách hàng nhân viên, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //     }
                    //     else{
                    //       // trả về mã lỗi của response nếu không có tài khoản chính xác 
                    //       let code = Number(response.data.error.code)
                    //       res.status(code).json(createError(code,response.data.error.message));
                    //     }
                    //   }
                    //  }
                    //  // nếu không có tài khoản quản lý chung và là tài khoản cá nhân 
                    //  else{
                    //   let account = await User.find({type365:0,email: user.Email,password:String(type_pass == 0 ? String(md5(user.Password)) : user.Password)}).limit(1);
                    //   if(account && (account.length > 0)){
                    //     User.findByIdAndUpdate(  // cập nhật ip 
                    //       account[0]._id,
                    //       { $set: {IpAddress:ipAddress} },
                    //       { new: true }
                    //     ).catch((e)=>{console.log(e)});

                    //     // nếu id tìm việc thì bắn dữ liệu online cho bên tìm viêc 
                    //     let resfinal = {};
                    //     if(true){
                    //      resfinal._id=account[0]._id
                    //      resfinal.id365=account[0].id365;
                    //      resfinal.id=account[0]._id
                    //      resfinal.ID365=account[0].id365;
                    //      resfinal.type365=account[0].type365;
                    //      resfinal.email=account[0].email;
                    //      resfinal.password=account[0].password;
                    //      resfinal.phone=account[0].phone;
                    //      resfinal.userName=account[0].userName;
                    //      resfinal.avatarUser= account[0].avatarUser ?  `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
                    //      resfinal.status=account[0].status;
                    //      resfinal.statusEmotion=account[0].statusEmotion;
                    //      resfinal.lastActive=account[0].lastActive;
                    //      resfinal.active=account[0].active;
                    //      resfinal.isOnline=account[0].isOnline;
                    //      resfinal.looker=account[0].looker;
                    //      resfinal.companyId=account[0].companyId;
                    //      resfinal.companyName=account[0].companyName;
                    //      resfinal.notificationPayoff=account[0].notificationPayoff;
                    //      resfinal.notificationCalendar=account[0].notificationCalendar;
                    //      resfinal.notificationReport=account[0].notificationReport;
                    //      resfinal.notificationOffer=account[0].notificationOffer;
                    //      resfinal.notificationPersonnelChange=account[0].notificationPersonnelChange;
                    //      resfinal.notificationRewardDiscipline=account[0].notificationRewardDiscipline;
                    //      resfinal.notificationNewPersonnel=account[0].notificationNewPersonnel;
                    //      resfinal.notificationChangeProfile=account[0].notificationChangeProfile;
                    //      resfinal.notificationTransferAsset=account[0].notificationTransferAsset;
                    //      resfinal.acceptMessStranger=account[0].acceptMessStranger;
                    //      resfinal.idTimViec=account[0].idTimViec;
                    //      resfinal.fromWeb=account[0].fromWeb;
                    //      resfinal.secretCode=account[0].secretCode;
                    //      resfinal.HistoryAccess=account[0].HistoryAccess;
                    //      resfinal.linkAvatar= account[0].avatarUser ? `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
                    //      resfinal.verified =  verified;
                    //     }
                    //     // bắn lên tìm việc 
                    //     if(Number(account[0].idTimViec)!=0){
                    //       socket2.emit("checkonlineUser",{uid: String(account[0].idTimViec), uid_type: account[0].type365 == 1 ? "1" : "0"})
                    //     }
                    //     if(IdDevice && NameDevice){
                    //       let warning = 0;
                    //       if((resfinal.HistoryAccess.length == 0)){
                    //         console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                    //         User.updateOne(
                    //           { _id: resfinal._id },
                    //           { $push: 
                    //             { 
                    //               HistoryAccess:
                    //              {
                    //                 IdDevice: String(IdDevice),
                    //                 IpAddress: String(ipAddress),
                    //                 NameDevice: String(NameDevice),
                    //                 Time: new Date(),
                    //                 AccessPermision: true
                    //               } 
                    //             },
                    //             $set: {
                    //              latitude:Number(latitude),
                    //              longtitude:Number(longtitude),
                    //              isOnline:1
                    //             }  
                    //           }
                    //         ).catch((e)=>{console.log(e)})
                    //       }
                    //       else{
                    //         console.log("Có thiết bị đã đăng nhập");
                    //         let find1 = resfinal.HistoryAccess.find(e => e.IdDevice == IdDevice);
                    //         if (find1){
                    //           console.log("Thiết bị này đã đăng nhập");
                    //           if(find1.AccessPermision){
                    //             console.log("Thiết bị này hợp lệ");
                    //             let update2 = await User.updateOne(
                    //               { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                    //               {
                    //                 $set :{
                    //                   "HistoryAccess.$.Time": new Date(),
                    //                   "HistoryAccess.$.IpAddress": String(ipAddress),
                    //                   "HistoryAccess.$.NameDevice": String(NameDevice),
                    //                   latitude:Number(latitude),
                    //                   longtitude:Number(longtitude),
                    //                   isOnline:1
                    //                 }
                    //               }
                    //             )
                    //           }
                    //           else{
                    //             console.log("Thiết bị này k hợp lệ");
                    //             warning = 1;
                    //             User.updateOne(
                    //               { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                    //               {
                    //                 $set :{
                    //                   "HistoryAccess.$.Time": new Date(),
                    //                   "HistoryAccess.$.IpAddress": String(ipAddress),
                    //                   "HistoryAccess.$.NameDevice": String(NameDevice)
                    //                 }
                    //               }
                    //             ).catch((e)=>{console.log(e)})
                    //           }

                    //         }
                    //         else{
                    //           console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                    //           warning=1;
                    //           User.updateOne(
                    //             { _id: resfinal._id },
                    //             { $push: 
                    //               { 
                    //                 HistoryAccess:
                    //                {
                    //                   IdDevice: String(IdDevice),
                    //                   IpAddress: String(ipAddress),
                    //                   NameDevice: String(NameDevice),
                    //                   Time: new Date(),
                    //                   AccessPermision: false
                    //                 } 
                    //               } 
                    //             }
                    //           ).catch((e)=>{console.log(e)})
                    //         }
                    //       }
                    //       // xóa field trả về 
                    //       delete resfinal.HistoryAccess;
                    //       res.json({
                    //         data:{
                    //           result:true,
                    //           message:"Đăng nhập thành công",
                    //           userName:resfinal.userName ? resfinal.userName : "",
                    //           conversationId:0,
                    //           total:0,
                    //           listUserOnline:null,
                    //           currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    //           user_info:resfinal,
                    //           user_list:null,
                    //           warning
                    //         },
                    //         error:null 
                    //        });
                    //     }
                    //     else{
                    //       delete resfinal.HistoryAccess;
                    //       await User.updateOne(
                    //        { _id: resfinal._id },
                    //        { 
                    //          $set: {
                    //           latitude:Number(latitude),
                    //           longtitude:Number(longtitude),
                    //           isOnline:1
                    //          }
                    //        }
                    //       ).catch((e)=>{console.log(e)})
                    //       res.json({
                    //         data:{
                    //           result:true,
                    //           message:"Đăng nhập thành công",
                    //           userName:account[0].userName ? account[0].userName :"",
                    //           conversationId:0,
                    //           total:0,
                    //           listUserOnline:null,
                    //           currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    //           user_info:resfinal,
                    //           user_list:null,
                    //         },
                    //         error:null 
                    //        });
                    //     }
                    //   }
                    //   // nếu không có tài khoản quản lý chung và cũng không có tài khoản chat check xem có sai type không  
                    //   else{
                    //     account= await User.find({email:user.Email,password:String(type_pass == 0 ? String(md5(user.Password)) : user.Password)});
                    //     if(account&&(account.length>0)){
                    //        let array =[];
                    //        for(let i=0; i<account.length; i++){
                    //         if(account[i].type365){
                    //           array.push(Number(account[i].type365));
                    //         }
                    //        }
                    //        if((array.includes(1)) &&(array.includes(0))){
                    //           res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //        else if( Number(account[0].type365) == 0){
                    //           res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //        else if( Number(account[0].type365) == 1 ){
                    //           res.status(305).json(createError(305,"Tài khoản đang thuộc diện khách hàng công ty, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //        else if( Number(account[0].type365) == 2 ){
                    //           res.status(302).json(createError(302,"Tài khoản đang thuộc diện khách hàng nhân viên, vui lòng chọn đúng loại tài khoản"));
                    //        }
                    //     }
                    //     else{
                    //       // trả về mã lỗi của response nếu không có tài khoản chính xác 
                    //       let code = Number(response.data.error.code)
                    //       res.status(code).json(createError(code,response.data.error.message));
                    //     }
                    //   }
                    //  }
                }
            }
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin tài khoản"));
        }
    } catch (err) {
        console.log("login_v2", err);
        res.status(200).json(createError(200, err.message));
    }
}

export const takedatatoverifylogin = async(req, res, next) => {
    try {
        let userId = Number(req.params.userId);
        let temp2 = 0
        let randomArray = [];
        while (temp2 < 3) {
            let t = getRandomInt(1, 7);
            if (!randomArray.includes(t)) {
                randomArray.push(t);
                temp2++;
            }
        }
        randomArray.sort((a, b) => {
                if (a < b) {
                    return -1; // giữ nguyên 
                } else if (a > b) {
                    return 1; // đổi
                }
                return 0;
            })
            // console.log(randomArray);

        // lấy ra userId của 3 người bạn 
        let result1 = await Contact.find({
            $or: [
                { userFist: userId },
                { userSecond: userId }
            ]
        }).limit(3);
        let arrayUserId = [];
        if (result1) {
            for (let i = 0; i < result1.length; i++) {
                arrayUserId.push(result1[i].userFist);
                arrayUserId.push(result1[i].userSecond)
            }
        }
        arrayUserId = arrayUserId.filter(e => e != userId);

        let listAccountFinal = [];
        let listAccount = await User.find({ _id: { $in: arrayUserId } }, { userName: 1, avatarUser: 1, lastActive: 1, isOnline: 1 }).sort({ isOnline: 1, lastActive: -1 });

        // xác định khoảng lấy dữ liệu random 
        let count = await User.find({ _id: { $ne: 0 } }, { _id: 1 }).sort({ _id: -1 }).limit(1);
        let UserIdmax = 40000;
        if (count) {
            if (count.length == 1) {
                UserIdmax = count[0]._id;
            }
        }

        // lấy 6 tài khoản bất kỳ 
        let temp = 0;
        let tempArray = [];
        while (temp < 6) {
            let userId = getRandomInt(1, UserIdmax);
            let user = await User.find({ _id: userId }, { userName: 1, avatarUser: 1, lastActive: 1, isOnline: 1 }).limit(1);
            if (user) {
                if (user.length > 0) {
                    tempArray.push(user[0]);
                    temp++;
                }
            }
        }

        // trộn danh sách người bạn với danh sách người bất kỳ 
        let a = 0; // thứ tự mảng trung gian 
        let b = 0; // thứ tự đếm của mảng thứ tự kết quả 
        let c = randomArray[b];
        while (b < 3) {
            while (a < c) {
                listAccountFinal.push(tempArray[a]);
                a++;
            }
            listAccountFinal.push(listAccount[b]);
            b++;
            c = randomArray[b]
        }
        if (listAccountFinal.length < 9) {
            for (let i = a; i < tempArray.length; i++) {
                listAccountFinal.push(tempArray[i]);
            }
        }
        listAccountFinal = listAccountFinal.filter(e => e != undefined)
        if (result1) {
            if (listAccount) {
                let result = [];
                for (let i = 0; i < listAccountFinal.length; i++) {
                    let a = {};
                    a._id = listAccountFinal[i]._id;
                    a.userName = listAccountFinal[i].userName;
                    a.createdAt = listAccountFinal[i].createdAt;
                    a.fromWeb = listAccountFinal[i].fromWeb;
                    a.avatarUser = listAccountFinal[i].avatarUser;
                    a.type = listAccountFinal[i].type;
                    a.avatarUserSmall = GetAvatarUserSmall(a._id, a.userName, a.avatarUser)
                    a.avatarUser = GetAvatarUser(a._id, a.type, a.fromWeb, a.createdAt, a.userName, a.avatarUser)
                        // if (listAccountFinal[i].avatarUser != "") {
                        //   a.avatarUser = `${urlImgHost()}avatarUser/${listAccountFinal[i]._id}/${listAccountFinal[i].avatarUser}`;
                        // }
                        // else {
                        //   a.avatarUser = `${urlImgHost()}avatar/${removeVietnameseTones(listAccountFinal[i].userName[0])}_${getRandomInt(1, 4)}.png`
                        // }

                    a.listAccountFinal = listAccountFinal[i].lastActive;
                    a.isOnline = listAccountFinal[i].isOnline;
                    result.push(a);
                }
                res.status(200).json({
                    data: {
                        result: true,
                        message: "Lấy thông tin thành công",
                        listAccount: result,
                        friendlist: listAccount
                    },
                    error: null
                });
            }
        }
    } catch (err) {
        console.log("takedatatoverifylogin", err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}


export const takedatatoverifyloginV2 = async(req, res, next) => {
    try {
        const listFriendId = []
        const listAccount = []
        const userId = Number(req.params.userId)
        let currentTime = new Date()
        currentTime.setDate(currentTime.getDate() - 3)
        const lastTime = `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')}`
        let countConv = await Conversation.count({
            "memberList.memberId": userId,
            isGroup: 0,
            "messageList.0": {
                $exists: true,
            },
        })
        if (countConv < 10) {
            return res.status(200).json({
                data: {
                    result: true,
                    message: "Lấy thông tin thành công",
                    listAccount: [],
                    friendlist: []
                },
                error: null
            })
        }
        let conv = await Conversation.aggregate([{
                $match: {
                    "memberList.memberId": userId,
                    isGroup: 0,
                    "messageList.0": {
                        $exists: true,
                    },
                },
            },
            {
                $project: {
                    memberList: 1,
                    sizeListMes: {
                        $size: "$messageList",
                    },
                    timeLastMessage: {
                        $dateToString: {
                            date: "$timeLastMessage",
                            timezone: "+07:00",
                            format: "%G-%m-%d",
                        },
                    },
                },
            },
            {
                $match: {
                    timeLastMessage: {
                        $gte: lastTime,
                    },
                },
            },
            {
                $sort: {
                    sizeListMes: -1,
                },
            },
            {
                $limit: 3,
            },
        ])
        if (conv.length !== 3) {
            const conv1 = await Conversation.aggregate([{
                    $match: {
                        "memberList.memberId": userId,
                        isGroup: 0,
                        "messageList.0": {
                            $exists: true,
                        },
                    },
                },
                {
                    $project: {
                        memberList: 1,
                        sizeListMes: {
                            $size: "$messageList",
                        },
                        timeLastMessage: {
                            $dateToString: {
                                date: "$timeLastMessage",
                                timezone: "+07:00",
                                format: "%G-%m-%d",
                            },
                        },
                    },
                },
                {
                    $sort: {
                        timeLastMessage: -1,
                    },
                },
                {
                    $limit: 3,
                },
                {
                    $skip: 2,
                },
            ])
            conv = await Conversation.aggregate([{
                    $match: {
                        "memberList.memberId": userId,
                        isGroup: 0,
                        "messageList.0": {
                            $exists: true,
                        },
                    },
                },
                {
                    $project: {
                        memberList: 1,
                        sizeListMes: {
                            $size: "$messageList",
                        },
                        timeLastMessage: {
                            $dateToString: {
                                date: "$timeLastMessage",
                                timezone: "+07:00",
                                format: "%G-%m-%d",
                            },
                        },
                    },
                },
                {
                    $match: {
                        timeLastMessage: {
                            $gte: conv1[0].timeLastMessage,
                        },
                    },
                },
                {
                    $sort: {
                        sizeListMes: -1,
                    },
                },
                {
                    $limit: 3,
                },
            ])
        }
        conv.forEach(e => {
            for (let i = 0; i < e.memberList.length; i++) {
                if (e.memberList[i].memberId && e.memberList[i].memberId !== userId) {
                    listFriendId.push(e.memberList[i].memberId)
                }
            }
        })
        const count = 10 - listFriendId.length
        const friendlist = await User.find({ _id: { $in: listFriendId } }, { _id: 1, type: 1, fromWeb: 1, createdAt: 1, userName: 1, avatarUser: 1, lastActive: 1, isOnline: 1 }).limit(3)
        for (let i = 0; i < friendlist.length; i++) {
            // if (friendlist[i].avatarUser != "") {
            //   friendlist[i].avatarUser = `${urlImgHost()}avatarUser/${friendlist[i]._id}/${friendlist[i].avatarUser}`;
            // }
            // else {
            //   friendlist[i].avatarUser = `${urlImgHost()}avatar/${removeVietnameseTones(friendlist[i].userName[0])}_${getRandomInt(1, 4)}.png`
            // }
            friendlist[i].avatarUserSmall = GetAvatarUserSmall(friendlist[i]._id, friendlist[i].userName, friendlist[i].avatarUser)
            friendlist[i].avatarUser = GetAvatarUser(friendlist[i]._id, friendlist[i].type, friendlist[i].fromWeb, friendlist[i].createdAt, friendlist[i].userName, friendlist[i].avatarUser)
            listAccount.push({
                "_id": friendlist[i]._id,
                "userName": friendlist[i].userName,
                "avatarUser": friendlist[i].avatarUser,
                "listAccountFinal": friendlist[i].lastActive,
                "isOnline": friendlist[i].isOnline
            })
        }

        const userIds = await User.aggregate([{
                $match: { _id: { $nin: listFriendId } }
            },
            {
                $project: { _id: 1 }
            },
            {
                $limit: 10000
            }
        ]);

        const randomUserIds = [];
        const totalUsers = userIds.length;

        while (randomUserIds.length < count) {
            const randomIndex = Math.floor(Math.random() * totalUsers);
            const userId = userIds[randomIndex]._id;

            if (!randomUserIds.includes(userId) && !listFriendId.includes(userId)) {
                randomUserIds.push(userId);
            }
        }

        const listUser = await User.find({ _id: { $in: randomUserIds } }, {
            _id: 1,
            userName: 1,
            avatarUser: 1,
            type: 1,
            fromWeb: 1,
            createdAt: 1,
            lastActive: 1,
            isOnline: 1
        });

        for (let i = 0; i < listUser.length; i++) {
            listUser[i].avatarUserSmall = GetAvatarUserSmall(listUser[i]._id, listUser[i].userName, listUser[i].avatarUser)
            listUser[i].avatarUser = GetAvatarUser(listUser[i]._id, listUser[i].type, listUser[i].fromWeb, listUser[i].createdAt, listUser[i].userName, listUser[i].avatarUser)
                // if (listUser[i].avatarUser != "") {
                //   listUser[i].avatarUser = `${urlImgHost()}avatarUser/${listUser[i]._id}/${listUser[i].avatarUser}`;
                // }
                // else {
                //   listUser[i].avatarUser = `${urlImgHost()}avatar/${removeVietnameseTones(listUser[i].userName[0])}_${getRandomInt(1, 4)}.png`
                // }
            listAccount.push({
                "_id": listUser[i]._id,
                "userName": listUser[i].userName,
                "avatarUser": listUser[i].avatarUser,
                "listAccountFinal": listUser[i].lastActive,
                "isOnline": listUser[i].isOnline
            })
        }
        listAccount.sort(() => Math.random() - 0.5)
        res.status(200).json({
            data: {
                result: true,
                message: "Lấy thông tin thành công",
                listAccount: listAccount,
                friendlist: friendlist
            },
            error: null
        })
    } catch (err) {
        console.log("takedatatoverifyloginV2", err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}




export const confirmlogin = async(req, res, next) => {
    try {
        console.log(req.body);
        let ipAddress = req.socket.remoteAddress;
        let geo = geoip.lookup(ipAddress);
        let latitude = 0;
        let longtitude = 0;
        if (geo && geo.ll) {
            latitude = geo.ll[0];
            longtitude = geo.ll[1];
        }
        let info = req.body;
        let listUserId = [];
        if (info.listUserId.includes("[")) {
            info.listUserId = info.listUserId.replace("[", "");
            info.listUserId = info.listUserId.replace("]", "");
            info.listUserId = info.listUserId.replace(`"`, "");
            info.listUserId = info.listUserId.replace(`"`, "");
            info.listUserId = info.listUserId.replace(`"`, "");
            info.listUserId = info.listUserId.replace(`"`, "");
            info.listUserId = info.listUserId.replace(`"`, "");
            info.listUserId = info.listUserId.replace(`"`, "");
            info.listUserId = info.listUserId.replace(`"`, "");

            info.listUserId = info.listUserId.split(",");
            for (let i = 0; i < info.listUserId.length; i++) {
                if (info.listUserId[i].trim() != '' && (!isNaN(info.listUserId[i]))) {
                    listUserId.push(Number(info.listUserId[i]));
                }
            };
        }
        if (info.listUserId.length > listUserId.length) {
            return res.status(200).json(createError(200, "Invalid Input"));
        }
        if (req.body.countReturned) {
            if (Number(req.body.countReturned) > listUserId.length) {
                return res.status(200).json(createError(200, "Invalid count choice"));
            }
        }

        if (req.body.myId && req.body.IdDevice && req.body.NameDevice && req.body.listUserId) {
            let check = true;
            if (listUserId.length == 3) {
                let result1 = await Contact.find({
                    $or: [
                        { userFist: Number(info.myId), userSecond: Number(listUserId[0]) },
                        { userSecond: Number(info.myId), userFist: Number(listUserId[0]) },
                        { userFist: Number(info.myId), userSecond: Number(listUserId[1]) },
                        { userSecond: Number(info.myId), userFist: Number(listUserId[1]) },
                        { userFist: Number(info.myId), userSecond: Number(listUserId[2]) },
                        { userSecond: Number(info.myId), userFist: Number(listUserId[2]) },
                    ]
                });

                for (let i = 0; i < listUserId.length; i++) {
                    if (!result1.find((e) => e.userFist == listUserId[i])) {
                        if (!result1.find((e) => e.userSecond == listUserId[i])) {
                            check = false;
                        }
                    }
                }
                if (result1.length < 3) {
                    check = false;
                }
            } else if (listUserId.length == 2) {
                let result1 = await Contact.find({
                    $or: [
                        { userFist: Number(info.myId), userSecond: Number(listUserId[0]) },
                        { userSecond: Number(info.myId), userFist: Number(listUserId[0]) },
                        { userFist: Number(info.myId), userSecond: Number(listUserId[1]) },
                        { userSecond: Number(info.myId), userFist: Number(listUserId[1]) },
                    ]
                });
                for (let i = 0; i < listUserId.length; i++) {
                    if (!result1.find((e) => e.userFist == listUserId[i])) {
                        if (!result1.find((e) => e.userSecond == listUserId[i])) {
                            check = false;
                        }
                    }
                }
                if (result1.length < 2) {
                    check = false;
                }
            } else if (listUserId.length == 1) {
                let result1 = await Contact.find({
                    $or: [
                        { userFist: Number(info.myId), userSecond: Number(listUserId[0]) },
                        { userSecond: Number(info.myId), userFist: Number(listUserId[0]) },
                    ]
                });
                for (let i = 0; i < listUserId.length; i++) {
                    if (!result1.find((e) => e.userFist == listUserId[i])) {
                        if (!result1.find((e) => e.userSecond == listUserId[i])) {
                            check = false;
                        }
                    }
                }
                if (result1.length < 1) {
                    check = false;
                }
            } else {
                check = false;
            }
            if (check) {
                User.updateOne({
                    _id: Number(info.myId),
                    HistoryAccess: { $elemMatch: { IdDevice: { $eq: String(info.IdDevice) } } }
                }, {
                    $set: {
                        "HistoryAccess.$.AccessPermision": true,
                        "HistoryAccess.$.IpAddress": String(ipAddress),
                        latitude: Number(latitude),
                        longtitude: Number(longtitude),
                    }
                }).catch((e) => {
                    console.log(e);
                    s
                })

                let createConv = await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
                    data: {
                        userId: 114803,
                        contactId: Number(info.myId)
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (createConv && createConv.data && createConv.data.data && createConv.data.data.conversationId) {
                    axios({
                        method: "post",
                        url: "http://43.239.223.142:9000/api/message/SendMessage",
                        data: {
                            MessageID: '',
                            ConversationID: createConv.data.data.conversationId,
                            SenderID: 114803,
                            MessageType: "text",
                            Message: `Thiết bị ${String(req.body.NameDevice).split("-")[0]} đã đăng nhập tài khoản của bạn vào lúc ${new Date().getHours()}:${new Date().getMinutes()} ${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`,
                            Emotion: 1,
                            Quote: "",
                            Profile: "",
                            ListTag: "",
                            File: "",
                            ListMember: "",
                            IsOnline: [],
                            IsGroup: 1,
                            ConversationName: '',
                            DeleteTime: 0,
                            DeleteType: 0,
                        },
                        headers: { "Content-Type": "multipart/form-data" }
                    }).catch((e) => { console.log(e) });
                }
                res.json({
                    data: {
                        result: true,
                        status: true,
                    },
                    error: null
                });
            } else {
                res.status(200).json(createError(200, "Danh sách bạn bè không chính xác"));
            }
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (e) {
        console.log("confirmlogin", e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const AcceptLogin = async(req, res, next) => {
    try {
        let ipAddress = req.socket.remoteAddress;
        let geo = geoip.lookup(ipAddress);
        let latitude = 0;
        let longtitude = 0;
        if (geo && geo.ll) {
            latitude = geo.ll[0];
            longtitude = geo.ll[1];
        }
        if (req.body.UserId && req.body.IdDevice && req.body.NameDevice) {
            User.updateOne({
                _id: Number(req.body.UserId),
                HistoryAccess: { $elemMatch: { IdDevice: { $eq: String(req.body.IdDevice) } } }
            }, {
                $set: {
                    "HistoryAccess.$.AccessPermision": true,
                    "HistoryAccess.$.IpAddress": String(ipAddress),
                    latitude: Number(latitude),
                    longtitude: Number(longtitude),
                }
            }).catch((e) => {
                console.log(e);
            })
            let createConv = await axios({
                method: "post",
                url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
                data: {
                    userId: 114803,
                    contactId: Number(req.body.UserId)
                },
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (createConv && createConv.data && createConv.data.data && createConv.data.data.conversationId) {
                axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/message/SendMessage",
                    data: {
                        MessageID: '',
                        ConversationID: createConv.data.data.conversationId,
                        SenderID: 114803,
                        MessageType: "text",
                        Message: `Thiết bị ${String(req.body.NameDevice).split("-")[0]} đã đăng nhập tài khoản của bạn vào lúc ${new Date().getHours()}:${new Date().getMinutes()} ${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`,
                        Emotion: 1,
                        Quote: "",
                        Profile: "",
                        ListTag: "",
                        File: "",
                        ListMember: "",
                        IsOnline: [],
                        IsGroup: 1,
                        ConversationName: '',
                        DeleteTime: 0,
                        DeleteType: 0,
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                }).catch((e) => { console.log(e) });
            }
            res.json({
                data: {
                    result: true,
                    status: true,
                },
                error: null
            });
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (e) {
        console.log("AcceptLogin", e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const confirmotp = async(req, res, next) => {
    try {
        if (req.body.myId && (!isNaN(req.body.myId)) && req.body.IdDevice && req.body.NameDevice) {
            let check = true;
            let ipAddress = req.socket.remoteAddress;
            let geo = geoip.lookup(ipAddress);
            let latitude = 0;
            let longtitude = 0;
            if (geo && geo.ll) {
                latitude = geo.ll[0];
                longtitude = geo.ll[1];
            }
            if (check) {
                User.updateOne({
                    _id: Number(req.body.myId),
                    HistoryAccess: { $elemMatch: { IdDevice: { $eq: String(req.body.IdDevice) } } }
                }, {
                    $set: {
                        "HistoryAccess.$.AccessPermision": true,
                        "HistoryAccess.$.IpAddress": String(ipAddress),
                        latitude: latitude,
                        longtitude: longtitude,
                    }
                }).catch((e) => {
                    console.log(e)
                })
                let user = await User.find({ _id: Number(req.body.myId) }).limit(1);
                if (user) {
                    if (user.length) {
                        res.json({
                            data: {
                                result: true,
                                status: true,
                                user_info: user[0]
                            },
                            error: null
                        });
                    }
                }
            } else {
                res.status(200).json(createError(200, "Danh sách bạn bè không chính xác"));
            }
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (e) {
        console.log("confirmotp", e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const refreshtoken = async(req, res, next) => {
    try {
        if (req.body.refreshtoken) {
            let dataencode = await jwt.verify(req.body.refreshtoken, tokenPassword());
            let time = new Date();
            let token = jwt.sign({ _id: dataencode._id, timeExpried: time.setDate(time.getDate() + 3) },
                tokenPassword()
            );
            return res.json({
                data: {
                    result: true,
                    token
                },
                error: null
            })
        } else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (e) {
        console.log("confirmotp", e);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const takedatatoverifyloginV3 = async(req, res, next) => {
    try {
        const listFriendId = []
        const listAccount = []
        const userId = Number(req.params.userId)
        let currentTime = new Date()
        currentTime.setDate(currentTime.getDate() - 3)
        const lastTime = `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')}`
        let countConv = await Conversation.count({
            "memberList.memberId": userId,
            isGroup: 0,
            "messageList.0": {
                $exists: true,
            },
        })
        if (countConv < 10) {
            return res.status(200).json({
                data: {
                    result: true,
                    message: "Lấy thông tin thành công",
                    listAccount: [],
                    friendlist: []
                },
                error: null
            })
        }
        let conv = await Conversation.aggregate([{
                $match: {
                    "memberList.memberId": userId,
                    isGroup: 0,
                    "messageList.0": {
                        $exists: true,
                    },
                },
            },
            {
                $project: {
                    memberList: 1,
                    sizeListMes: {
                        $size: "$messageList",
                    },
                    timeLastMessage: {
                        $dateToString: {
                            date: "$timeLastMessage",
                            timezone: "+07:00",
                            format: "%G-%m-%d",
                        },
                    },
                },
            },
            {
                $match: {
                    timeLastMessage: {
                        $gte: lastTime,
                    },
                },
            },
            {
                $sort: {
                    sizeListMes: -1,
                },
            },
            {
                $limit: 3,
            },
        ])
        if (conv.length !== 3) {
            const conv1 = await Conversation.aggregate([{
                    $match: {
                        "memberList.memberId": userId,
                        isGroup: 0,
                        "messageList.0": {
                            $exists: true,
                        },
                    },
                },
                {
                    $project: {
                        memberList: 1,
                        sizeListMes: {
                            $size: "$messageList",
                        },
                        timeLastMessage: {
                            $dateToString: {
                                date: "$timeLastMessage",
                                timezone: "+07:00",
                                format: "%G-%m-%d",
                            },
                        },
                    },
                },
                {
                    $sort: {
                        timeLastMessage: -1,
                    },
                },
                {
                    $limit: 3,
                },
                {
                    $skip: 2,
                },
            ])
            conv = await Conversation.aggregate([{
                    $match: {
                        "memberList.memberId": userId,
                        isGroup: 0,
                        "messageList.0": {
                            $exists: true,
                        },
                    },
                },
                {
                    $project: {
                        memberList: 1,
                        sizeListMes: {
                            $size: "$messageList",
                        },
                        timeLastMessage: {
                            $dateToString: {
                                date: "$timeLastMessage",
                                timezone: "+07:00",
                                format: "%G-%m-%d",
                            },
                        },
                    },
                },
                {
                    $match: {
                        timeLastMessage: {
                            $gte: conv1[0].timeLastMessage,
                        },
                    },
                },
                {
                    $sort: {
                        sizeListMes: -1,
                    },
                },
                {
                    $limit: 3,
                },
            ])
        }
        conv.forEach(e => {
            for (let i = 0; i < e.memberList.length; i++) {
                if (e.memberList[i].memberId && e.memberList[i].memberId !== userId) {
                    listFriendId.push(e.memberList[i].memberId)
                }
            }
        })
        const count = 10 - listFriendId.length
        const friendlist = await User.find({ _id: { $in: listFriendId } }, { userName: 1, avatarUser: 1, lastActive: 1, isOnline: 1, type: 1, fromWeb: 1, createdAt: 1, }).limit(3)
        for (let i = 0; i < friendlist.length; i++) {
            listUser[i].avatarUserSmall = GetAvatarUserSmall(listUser[i]._id, listUser[i].userName, listUser[i].avatarUser)
            listUser[i].avatarUser = GetAvatarUser(listUser[i]._id, listUser[i].type, listUser[i].fromWeb, listUser[i].createdAt, listUser[i].userName, listUser[i].avatarUser)
                // if (friendlist[i].avatarUser != "") {
                //   friendlist[i].avatarUser = `${urlImgHost()}avatarUser/${friendlist[i]._id}/${friendlist[i].avatarUser}`;
                // }
                // else {
                //   friendlist[i].avatarUser = `${urlImgHost()}avatar/${removeVietnameseTones(friendlist[i].userName[0])}_${getRandomInt(1, 4)}.png`
                // }
            listAccount.push({
                "_id": friendlist[i]._id,
                "userName": friendlist[i].userName,
                "avatarUser": friendlist[i].avatarUser,
                "listAccountFinal": friendlist[i].lastActive,
                "isOnline": friendlist[i].isOnline
            })
        }

        const userIds = await User.aggregate([{
                $match: { _id: { $nin: listFriendId } }
            },
            {
                $project: { _id: 1 }
            },
            {
                $limit: 10000
            }
        ]);

        const randomUserIds = [];
        const totalUsers = userIds.length;

        while (randomUserIds.length < count) {
            const randomIndex = Math.floor(Math.random() * totalUsers);
            const userId = userIds[randomIndex]._id;

            if (!randomUserIds.includes(userId) && !listFriendId.includes(userId)) {
                randomUserIds.push(userId);
            }
        }

        const listUser = await User.find({ _id: { $in: randomUserIds } }, {
            _id: 1,
            userName: 1,
            avatarUser: 1,
            lastActive: 1,
            isOnline: 1,
            type: 1,
            fromWeb: 1,
            createdAt: 1,
        });

        for (let i = 0; i < listUser.length; i++) {
            listUser[i].avatarUserSmall = GetAvatarUserSmall(listUser[i]._id, listUser[i].userName, listUser[i].avatarUser)
            listUser[i].avatarUser = GetAvatarUser(listUser[i]._id, listUser[i].type, listUser[i].fromWeb, listUser[i].createdAt, listUser[i].userName, listUser[i].avatarUser)
                // if (listUser[i].avatarUser != "") {
                //   listUser[i].avatarUser = `${urlImgHost()}avatarUser/${listUser[i]._id}/${listUser[i].avatarUser}`;
                // }
                // else {
                //   listUser[i].avatarUser = `${urlImgHost()}avatar/${removeVietnameseTones(listUser[i].userName[0])}_${getRandomInt(1, 4)}.png`
                // }
            listAccount.push({
                "_id": listUser[i]._id,
                "userName": listUser[i].userName,
                "avatarUser": listUser[i].avatarUser,
                "listAccountFinal": listUser[i].lastActive,
                "isOnline": listUser[i].isOnline
            })
        }
        listAccount.sort(() => Math.random() - 0.5)
        res.status(200).json({
            data: {
                result: true,
                message: "Lấy thông tin thành công",
                listAccount: listAccount,
                friendlist: friendlist
            },
            error: null
        })
    } catch (err) {
        console.log("takedatatoverifyloginV2", err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}