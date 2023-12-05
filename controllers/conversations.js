import { v4 as uuidv4 } from 'uuid';
import { createError } from '../utils/error.js';
import axios from 'axios';
import Conversation from '../models/Conversation.js';
import RequestContact from '../models/RequestContact.js';
import Contact from '../models/Contact.js';
import UsersClassified from '../models/UsersClassified.js';
import Users from '../models/User.js';
import UserZalo from '../models/UserZalo.js';
import Token from '../models/TokenZalo.js';
import Counter from '../models/Counter.js';
import { fUserConv } from '../functions/fModels/fUsers.js';
import { CheckDefautNameGroupOneMember } from '../services/conversation.service.js';
import { ToolUpdateAvatarSingle } from '../services/user.service.js';
import { urlImgHost } from '../utils/config.js';
import SaveTurnOffNotifyConv from '../models/SaveTurnOffNotifyConv.js';
import date from 'date-and-time';
import io from 'socket.io-client';
import { removeVietnameseTones } from '../functions/fTools/removeVietnameseTones.js';
import { ConvertToArrayString } from '../functions/fTools/handleInput.js';
import { ConvertToArrayNumber } from '../functions/fTools/handleInput.js';
// api function
import { FGetConversation } from '../functions/fApi/conversation.js';
import { FLoadMessage } from '../functions/fApi/message.js';
import { FSendMessage } from '../functions/fApi/message.js';
import { FCreateNewConversation } from '../functions/fApi/conversation.js';
import { FReadMessage } from '../functions/fApi/conversation.js';
import { FGetListConversationIdStrange } from '../functions/fApi/conversation.js';
import { checkToken } from '../utils/checkToken.js';
import fs from 'fs';
import mongoose from 'mongoose';
import { GetAvatarUser } from '../utils/GetAvatarUser.js';
import { GetAvatarUserSmall } from '../utils/GetAvatarUser.js';
const ObjectId = mongoose.Types.ObjectId;
const socket = io.connect('http://43.239.223.142:3000', {
    secure: true,
    enabledTransports: ['wss'],
    transports: ['websocket', 'polling'],
});
let array_interval = [];
let array_timeout = [];
let i = 0;
const myTimer = async () => {
    i = i + 1;
};

const test_interval_on_timeout = async () => {
    let myInterval = setInterval(myTimer, 1000);
    let ele = {};
    ele.id = String(uuidv4());
    ele.interval = myInterval;
    array_interval.push(ele);
};

export const FCheckStatus = async (req) => {
    try {
        if (
            req.body &&
            req.body.userId &&
            req.body.contactId &&
            !isNaN(req.body.userId) &&
            !isNaN(req.body.contactId)
        ) {
            let checkContact = await Contact.find({
                $or: [
                    { userFist: Number(req.body.userId), userSecond: Number(req.body.contactId) },
                    { userFist: Number(req.body.contactId), userSecond: Number(req.body.userId) },
                ],
            })
                .limit(1)
                .lean();
            if (checkContact && checkContact.length) {
                return {
                    userId: req.body.userId,
                    contactId: req.body.contactId,
                    status: 'accept',
                    type365: 0,
                };
            }
            let listRequestContact = await RequestContact.find({
                $or: [
                    { userId: Number(req.body.userId), contactId: Number(req.body.contactId) },
                    { userId: Number(req.body.contactId), contactId: Number(req.body.userId) },
                ],
            }, { _id: 0, userId: 1, contactId: 1, status: 1, type365: 1 })
                .limit(1)
                .lean();
            if (listRequestContact) {
                if (listRequestContact.length) {
                    return listRequestContact[0];
                } else {
                    return {
                        userId: req.body.userId,
                        contactId: req.body.contactId,
                        status: 'none',
                        type365: 0,
                    };
                }
            }
        } else {
            return {
                userId: req.body.userId,
                contactId: req.body.contactId,
                status: 'none',
                type365: 0,
            };
        }
    } catch (e) {
        console.log('error check status');
        return {
            userId: req.body.userId,
            contactId: req.body.contactId,
            status: 'none',
            type365: 0,
        };
    }
};

export const createInterval = async (req, res, next) => {
    try {
        let myInterval = setInterval(myTimer, 1000);
        console.log(myInterval);
        array_interval.push(myInterval);
        res.send({ id: 1 });
    } catch (e) {
        console.log(e);
    }
};

export const stopInterval = async (req, res, next) => {
    try {
        console.log(array_interval);
        for (let i = 0; i < array_interval.length; i++) {
            clearInterval(array_interval[i].interval);
        }
        res.send({ id: 1 });
    } catch (e) {
        console.log(e);
    }
};

export const testIntervalInTimeOut = async (req, res, next) => {
    try {
        let myTimeout = setTimeout(test_interval_on_timeout, 5000);
        array_timeout.push(myTimeout);
        res.send({ id: 1 });
    } catch (e) {
        console.log(e);
    }
};

export const StopIntervalInTimeOut = async (req, res, next) => {
    try {
        for (let i = 0; i < array_timeout.length; i++) {
            clearTimeout(array_timeout[i]);
        }
        res.send({ id: 1 });
    } catch (e) {
        console.log(e);
    }
};

export const createCanlerdal = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, createCanlerdal');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        console.log(req.body);
        if (
            req &&
            req.body &&
            req.body.time &&
            req.body.content &&
            req.body.type &&
            req.body.emotion &&
            Number(req.body.senderId) &&
            Number(req.body.conversationId)
        ) {
            if (String(req.body.type) == 'manyeveryweek') {
                let times = String(req.body.time).split('/');
                let check = false;
                for (let i = 0; i < times.length; i++) {
                    let date = new Date(times[i]);
                    let time = `${String(date.getFullYear())}-${String(date.getMonth() + 1)}-${String(
                        date.getDate()
                    )}T${String(date.getHours())}:${String(date.getMinutes())}:00+07:00`;
                    let dataContact = await axios({
                        method: 'post',
                        url: 'http://43.239.223.142:3005/Message/SendMessage',
                        data: {
                            MessageID: '',
                            ConversationID: req.body.conversationId,
                            SenderID: req.body.senderId,
                            MessageType: 'Canlerdal',
                            Message: `${String(time)}/${String(req.body.content)}/everyweek/${req.body.emotion}`,
                            Emotion: 1,
                            Quote: '',
                            Profile: '',
                            ListTag: '',
                            File: '',
                            ListMember: '',
                            IsOnline: [],
                            IsGroup: 0,
                            ConversationName: '',
                            DeleteTime: 0,
                            DeleteType: 0,
                        },
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (dataContact) {
                        check = true;
                    }
                }
                if (check) {
                    res.status(200).json({
                        data: {
                            result: true,
                            message: 'insert successfully',
                        },
                        error: null,
                    });
                }
            } else {
                let date = new Date(req.body.time);
                let time = `${String(date.getFullYear())}-${String(date.getMonth() + 1)}-${String(
                    date.getDate()
                )}T${String(date.getHours())}:${String(date.getMinutes())}:00+07:00`;
                let dataContact = await axios({
                    method: 'post',
                    url: 'http://43.239.223.142:3005/Message/SendMessage',
                    data: {
                        MessageID: '',
                        ConversationID: req.body.conversationId,
                        SenderID: req.body.senderId,
                        MessageType: 'Canlerdal',
                        Message: `${String(time)}/${String(req.body.content)}/${req.body.type}/${req.body.emotion}`,
                        Emotion: 1,
                        Quote: '',
                        Profile: '',
                        ListTag: '',
                        File: '',
                        ListMember: '',
                        IsOnline: [],
                        IsGroup: 0,
                        ConversationName: '',
                        DeleteTime: 0,
                        DeleteType: 0,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (dataContact) {
                    res.status(200).json({
                        data: {
                            result: true,
                            message: 'insert successfully',
                        },
                        error: null,
                    });
                }
            }
        } else {
            res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
        }
    } catch (e) {
        console.log('createCanlerdal', e);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// lay danh sach lich cho 1 nguoi va tien hanh check
export const takeListCanlerdal = async (req, res, next) => {
    try {
        if (req.params.token) {
            let check = await checkToken(req.params.token);
            if (check && check.status && check.userId == req.params.userId) {
                console.log('Token hop le, takeListCanlerdal');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let day_to_milisecond = 24 * 60 * 60 * 1000;

        const conversations = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': Number(req.params.userId),
                'messageList.messageType': 'Canlerdal',
            },
        },
        {
            // k đóng vai trò tìm kiếm luôn
            $project: {
                messageList: {
                    $filter: {
                        input: '$messageList',
                        as: 'messagelist',
                        cond: {
                            $eq: ['$$messagelist.messageType', 'Canlerdal'],
                        },
                    },
                },
            },
        },
        ]);
        if (conversations && conversations.length > 0) {
            for (let j = 0; j < conversations.length; j++) {
                let conversation_finded = conversations[j];

                if (conversation_finded && conversation_finded.messageList.length > 0) {
                    let listCanlerdal = conversation_finded.messageList;

                    for (let i = 0; i < listCanlerdal.length; i++) {
                        // nếu là hàng ngày thì check rồi gửi
                        if (String(listCanlerdal[i].message.split('/')[2]) == 'everyday') {
                            let today = new Date();
                            let canlerdal = new Date(String(listCanlerdal[i].message).split('/')[0]);
                            let count = Number(String((today - canlerdal) / day_to_milisecond).split('.')[0]);
                            console.log('So ngay tinh tu hom dat lich ', count);
                            if (count > 0) {
                                let timecheck1 = canlerdal;
                                timecheck1.setDate(canlerdal.getDate() + count);

                                console.log('Thoi diem check so 1', new Date(timecheck1));
                                // kiem tra xem da gui thong bao chua
                                let conversation_finded2 = await Conversation.aggregate([{
                                    $match: { _id: Number(conversation_finded._id) },
                                },
                                { $limit: 1 },
                                {
                                    $project: {
                                        messageList: {
                                            $filter: {
                                                input: '$messageList',
                                                as: 'messagelist',
                                                cond: {
                                                    $and: [{
                                                        $eq: ['$$messagelist.messageType', 'notification'],
                                                    },
                                                    {
                                                        $eq: [
                                                            '$$messagelist.message',
                                                            `Bạn có lịch ${String(listCanlerdal[i].message).split('/')[1]
                                                            } lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth() + 1
                                                            }-${timecheck1.getFullYear()}`,
                                                        ],
                                                    },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                ]);
                                if (
                                    conversation_finded2 &&
                                    conversation_finded2.length > 0 &&
                                    conversation_finded2[0].messageList.length == 0
                                ) {
                                    console.log('Chua co lich tai thoi diem check 1');
                                    let sendmes = await axios({
                                        method: 'post',
                                        url: 'http://43.239.223.142:3005/Message/SendMessage',
                                        data: {
                                            MessageID: '',
                                            ConversationID: Number(conversation_finded._id),
                                            SenderID: Number(req.params.userId),
                                            MessageType: 'notification',
                                            Message: `Bạn có lịch ${String(listCanlerdal[i].message).split('/')[1]
                                                } lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth() + 1
                                                }-${timecheck1.getFullYear()}`,
                                            Emotion: 1,
                                            Quote: '',
                                            Profile: '',
                                            ListTag: '',
                                            File: '',
                                            ListMember: '',
                                            IsOnline: [],
                                            IsGroup: 0,
                                            ConversationName: '',
                                            DeleteTime: 0,
                                            DeleteType: 0,
                                        },
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                }
                            }
                            if (count > 1) {
                                let timecheck2 = canlerdal;
                                // do canledar tu tang
                                timecheck2.setDate(canlerdal.getDate() - 1);
                                let conversation_finded3 = await Conversation.aggregate([{
                                    $match: { _id: Number(conversation_finded._id) },
                                },
                                { $limit: 1 },
                                {
                                    $project: {
                                        messageList: {
                                            $filter: {
                                                input: '$messageList',
                                                as: 'messagelist',
                                                cond: {
                                                    $and: [{
                                                        $eq: ['$$messagelist.messageType', 'notification'],
                                                    },
                                                    {
                                                        $eq: [
                                                            '$$messagelist.message',
                                                            `Bạn có lịch ${String(listCanlerdal[i].message).split('/')[1]
                                                            } lúc ${timecheck2.getHours()}:${timecheck2.getMinutes()} ${timecheck2.getDate()}-${timecheck2.getMonth() + 1
                                                            }-${timecheck2.getFullYear()}`,
                                                        ],
                                                    },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                ]);
                                if (
                                    conversation_finded3 &&
                                    conversation_finded3.length > 0 &&
                                    conversation_finded3[0].messageList.length == 0
                                ) {
                                    console.log('Chua co lich tai thoi diem check 2');
                                    let sendmes = await axios({
                                        method: 'post',
                                        url: 'http://43.239.223.142:3005/Message/SendMessage',
                                        data: {
                                            MessageID: '',
                                            ConversationID: Number(conversation_finded._id),
                                            SenderID: Number(req.params.userId),
                                            MessageType: 'notification',
                                            Message: `Bạn có lịch ${String(listCanlerdal[i].message).split('/')[1]
                                                } lúc ${timecheck2.getHours()}:${timecheck2.getMinutes()} ${timecheck2.getDate()}-${timecheck2.getMonth() + 1
                                                }-${timecheck2.getFullYear()}`,
                                            Emotion: 1,
                                            Quote: '',
                                            Profile: '',
                                            ListTag: '',
                                            File: '',
                                            ListMember: '',
                                            IsOnline: [],
                                            IsGroup: 0,
                                            ConversationName: '',
                                            DeleteTime: 0,
                                            DeleteType: 0,
                                        },
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                }
                                console.log('Thoi diem check so 2', new Date(timecheck2));
                            }
                        } else if (String(listCanlerdal[i].message.split('/')[2]) == 'everyweek') {
                            let today = new Date();
                            let canlerdal = new Date(String(listCanlerdal[i].message).split('/')[0]);
                            let count = Number(String((today - canlerdal) / day_to_milisecond / 7).split('.')[0]);
                            console.log('So tuan tinh tu hom dat lich ', count);
                            if (count > 0) {
                                let timecheck1 = canlerdal;
                                timecheck1.setDate(canlerdal.getDate() + count * 7);

                                console.log('Thoi diem check so 1', new Date(timecheck1));
                                // kiem tra xem da gui thong bao chua
                                let conversation_finded2 = await Conversation.aggregate([{
                                    $match: { _id: Number(conversation_finded._id) },
                                },
                                { $limit: 1 },
                                {
                                    $project: {
                                        messageList: {
                                            $filter: {
                                                input: '$messageList',
                                                as: 'messagelist',
                                                cond: {
                                                    $and: [{
                                                        $eq: ['$$messagelist.messageType', 'notification'],
                                                    },
                                                    {
                                                        $eq: [
                                                            '$$messagelist.message',
                                                            `Bạn có lịch ${String(listCanlerdal[i].message).split('/')[1]
                                                            } lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth() + 1
                                                            }-${timecheck1.getFullYear()}`,
                                                        ],
                                                    },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                ]);
                                if (
                                    conversation_finded2 &&
                                    conversation_finded2.length > 0 &&
                                    conversation_finded2[0].messageList.length == 0
                                ) {
                                    console.log('Chua co lich tai thoi diem check 1');
                                    let sendmes = await axios({
                                        method: 'post',
                                        url: 'http://43.239.223.142:3005/Message/SendMessage',
                                        data: {
                                            MessageID: '',
                                            ConversationID: Number(conversation_finded._id),
                                            SenderID: Number(req.params.userId),
                                            MessageType: 'notification',
                                            Message: `Bạn có lịch ${String(listCanlerdal[i].message).split('/')[1]
                                                } lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth() + 1
                                                }-${timecheck1.getFullYear()}`,
                                            Emotion: 1,
                                            Quote: '',
                                            Profile: '',
                                            ListTag: '',
                                            File: '',
                                            ListMember: '',
                                            IsOnline: [],
                                            IsGroup: 0,
                                            ConversationName: '',
                                            DeleteTime: 0,
                                            DeleteType: 0,
                                        },
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        if (conversations) {
            res.status(200).json({
                data: {
                    result: true,
                    message: 'Lấy thông tin thành công',
                    conversations,
                },
                error: null,
            });
        }
    } catch (e) {
        console.log('takeListCanlerdal', e);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// tạo ra thông báo
export const createNotificationCanlerdal = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, createNotificationCanlerdal');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        console.log(req.body);
        // check xem dưới base có chưa
        let canlerdal = new Date(String(req.body.time));
        let day_to_milisecond = 24 * 60 * 60 * 1000;
        let today = new Date();
        let count = Number(String((today - canlerdal) / day_to_milisecond).split('.')[0]);
        let time_check = canlerdal;
        time_check.setDate(canlerdal.getDate() + count);
        let findword = String(``);
        const checkCanlerdal = await Conversation.aggregate([{
            $match: {
                _id: Number(req.body.conversationId),
                'messageList.messageType': 'Canlerdal',
            },
        },
        {
            // k đóng vai trò tìm kiếm luôn
            $project: {
                messageList: {
                    $filter: {
                        input: '$messageList',
                        as: 'messagelist',
                        cond: {
                            $and: [{
                                $eq: ['$$messagelist.messageType', 'Canlerdal'],
                            },
                            {
                                $eq: [
                                    '$$messagelist.message',
                                    `${String(req.body.time)}/${req.body.content}/${req.body.type}/${req.body.emotion
                                    }`,
                                ],
                            },
                            ],
                        },
                    },
                },
            },
        },
        ]);
        console.log(checkCanlerdal);
        if (checkCanlerdal && checkCanlerdal.length > 0 && checkCanlerdal[0].messageList.length > 0) {
            let conversation_finded = await Conversation.aggregate([{
                $match: { _id: Number(req.body.conversationId) },
            },
            { $limit: 1 },
            {
                $project: {
                    messageList: {
                        $filter: {
                            input: '$messageList',
                            as: 'messagelist',
                            cond: {
                                $and: [{
                                    $eq: ['$$messagelist.messageType', 'notification'],
                                },
                                {
                                    $eq: [
                                        '$$messagelist.message',
                                        `Bạn có lịch ${req.body.content
                                        } lúc ${time_check.getHours()}:${time_check.getMinutes()}`,
                                    ],
                                },
                                ],
                            },
                        },
                    },
                },
            },
            ]);

            // gửi tin nhắn thông báo vào nhóm
            if (conversation_finded && conversation_finded.length > 0) {
                if (conversation_finded.length > 0) {
                    if (conversation_finded[0].messageList.length > 0) {
                        res.status(200).json(createError(200, 'Canlerdal is notified'));
                    } else {
                        let sendmes = await axios({
                            method: 'post',
                            url: 'http://43.239.223.142:3005/Message/SendMessage',
                            data: {
                                MessageID: '',
                                ConversationID: Number(req.body.conversationId),
                                SenderID: Number(req.body.senderId),
                                MessageType: 'notification',
                                Message: `Bạn có lịch ${req.body.content
                                    } lúc ${time_check.getHours()}:${time_check.getMinutes()}`,
                                Emotion: 1,
                                Quote: '',
                                Profile: '',
                                ListTag: '',
                                File: '',
                                ListMember: '',
                                IsOnline: [],
                                IsGroup: 0,
                                ConversationName: '',
                                DeleteTime: 0,
                                DeleteType: 0,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        res.json({
                            data: {
                                result: true,
                                message: 'Inserted successfully',
                            },
                            error: null,
                        });
                    }
                } else {
                    res.status(200).json(createError(200, 'Not found conversation available'));
                }
            }
        } else {
            res.status(200).json(createError(200, 'Không tìm thấy lịch'));
        }
    } catch (err) {
        console.log('createNotificationCanlerdal', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// delete canlerdal by api delete messsage

// take all canlerdal of 1 person va khong check
export const takeAllCanlerdal = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, takeAllCanlerdal');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const conversations = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': Number(req.body.userId),
                'messageList.messageType': 'Canlerdal',
            },
        },
        {
            // k đóng vai trò tìm kiếm luôn
            $project: {
                messageList: {
                    $filter: {
                        input: '$messageList',
                        as: 'messagelist',
                        cond: {
                            $eq: ['$$messagelist.messageType', 'Canlerdal'],
                        },
                    },
                },
            },
        },
        ]);
        if (conversations) {
            res.status(200).json({
                data: {
                    result: true,
                    message: 'Lấy thông tin thành công',
                    conversations,
                },
                error: null,
            });
        }
    } catch (e) {
        console.log('takeAllCanlerdal', e);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const deleteCanlerdal = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, deleteCanlerdal');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let update1 = await Conversation.updateOne({ _id: Number(req.body.conversationId) }, {
            $pull: {
                messageList: {
                    _id: String(req.body.idCanlerdal),
                },
            },
        });
        if (update1) {
            res.json({
                data: {
                    result: true,
                    message: 'Deleted successfully',
                },
                error: null,
            });
        }
    } catch (e) {
        console.log('deleteCanlerdal', e);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// conversations offline
const createConversationOffline = async (code, user) => {
    try {
        // create conv Offline/050901/Thu Oct 20 2022 14:03:56 GMT+0700 (Indochina Time)
        let result = await Conversation.find({ _id: { $ne: 0 } }, { _id: 1 })
            .sort({ _id: -1 })
            .limit(1);
        if (result && result.length == 1) {
            let count = result[0]._id;
            let update = await Counter.updateOne({ name: 'ConversationID' }, { $set: { countID: count + 1 } });
            if (update) {
                const newConversation = new Conversation({
                    _id: count + 1,
                    isGroup: 1,
                    typeGroup: `Offline/${code}/${String(new Date())}`,
                    avatarConversation: '',
                    adminId: Number(user.memberId),
                    shareGroupFromLinkOption: 1,
                    browseMemberOption: 1,
                    pinMessage: '',
                    memberList: [],
                    messageList: [],
                    browseMemberList: [],
                });
                const savedConversation = await newConversation.save();

                // when catch err => log ; this is method save cost
                if (savedConversation) {
                    let update = await Conversation.findOneAndUpdate({ _id: savedConversation._id }, { $push: { memberList: user } });
                    if (update) {
                        // gui tin nhan vao la xong
                        let sendmes = await axios({
                            method: 'post',
                            url: 'http://43.239.223.142:3005/Message/SendMessage',
                            data: {
                                MessageID: '',
                                ConversationID: savedConversation._id,
                                SenderID: user.memberId,
                                MessageType: 'notification',
                                Message: `Bạn đã tạo nhóm Offline`,
                                Emotion: 1,
                                Quote: '',
                                Profile: '',
                                ListTag: '',
                                File: '',
                                ListMember: '',
                                IsOnline: [],
                                IsGroup: 1,
                                ConversationName: '',
                                DeleteTime: 0,
                                DeleteType: 0,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.log('createConversationOffline', e);
    }
};
export const JoinConversationOffline = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, JoinConversationOffline');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (
            req.body &&
            req.body.code &&
            req.body.userId &&
            req.body.lat &&
            req.body.long &&
            req.body.name &&
            Number(req.body.long) &&
            Number(req.body.userId) &&
            Number(req.body.code) &&
            Number(req.body.lat)
        ) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/JoinConversationOffline',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let infor = req.body;
            let time = new Date();
            let timeplus = new Date();
            let timebefore = new Date();
            timeplus.setHours(time.getHours() + 1);
            timebefore.setHours(time.getHours() - 1);
            time = String(time).split(':')[0];
            timeplus = String(timeplus).split(':')[0];
            timebefore = String(timebefore).split(':')[0];

            const conversations = await Conversation.aggregate([{
                $match: {
                    typeGroup: new RegExp('Offline', 'i'),
                    typeGroup: new RegExp(String(req.body.code), 'i'),
                    $or: [
                        { typeGroup: new RegExp(time, 'i') }, // giơ hiện tại
                        { typeGroup: new RegExp(timeplus, 'i') }, // giờ tiếp theo
                        { typeGroup: new RegExp(timebefore, 'i') },
                    ],
                },
            },
            { $limit: 1 },
            {
                $addFields: { admin: { $first: '$memberList.memberId' } },
            },
            {
                $project: {
                    typeGroup: 1,
                    admin: 1,
                    'memberList.memberId': 1,
                },
            },
            ]);

            if (conversations) {
                // lỗi của phần này đưa vào try catch
                if (conversations.length > 0) {
                    const host = await Users.find({ _id: Number(conversations[0].admin) }, { _id: 0, latitude: 1, longtitude: 1 }).lean();

                    // nếu không tồn tại thì đi vào try catch
                    if (host && host.length > 0) {
                        let host2 = host[0];
                        if (
                            Number(host2.latitude) - 0.01 < Number(infor.lat) &&
                            Number(host2.latitude) + 0.01 > Number(infor.lat) &&
                            Number(host2.longtitude) - 0.01 < Number(infor.long) &&
                            Number(host2.longtitude) + 0.01 > Number(infor.long)
                        ) {
                            // check xem trong danh sach thanh vien da co chua
                            if (conversations[0].memberList.find((e) => Number(e.memberId) == Number(infor.userId))) {
                                res.status(200).json({
                                    data: {
                                        result: false,
                                        message: 'User joined before',
                                    },
                                    error: null,
                                });
                            } else {
                                // tiến hành update dưới base và gửi thông báo.
                                let user_info = fUserConv(
                                    Number(infor.userId),
                                    '',
                                    0,
                                    0,
                                    0,
                                    0,
                                    1,
                                    new Date(),
                                    0,
                                    0, []
                                );
                                let update = await Conversation.findOneAndUpdate({ _id: conversations[0]._id }, { $push: { memberList: user_info } });
                                if (update) {
                                    // if have err => try catch log
                                    // gửi tin nhắn vào nhóm
                                    let sendmes = await axios({
                                        method: 'post',
                                        url: 'http://43.239.223.142:3005/Message/SendMessage',
                                        data: {
                                            MessageID: '',
                                            ConversationID: conversations[0]._id,
                                            SenderID: conversations[0].admin,
                                            MessageType: 'notification',
                                            Message: `${String(infor.name)} joined group`,
                                            Emotion: 1,
                                            Quote: '',
                                            Profile: '',
                                            ListTag: '',
                                            File: '',
                                            ListMember: '',
                                            IsOnline: [],
                                            IsGroup: 1,
                                            ConversationName: '',
                                            DeleteTime: 0,
                                            DeleteType: 0,
                                        },
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                    if (sendmes) {
                                        // if have err => try catch log
                                        res.status(200).json({
                                            data: {
                                                result: true,
                                                message: 'Thêm thành công',
                                            },
                                            error: null,
                                        });
                                    }
                                }
                            }
                        } else {
                            let user_infom = fUserConv(
                                Number(infor.userId),
                                `${infor.name}-Offline-${infor.lat}-${infor.long}`,
                                0,
                                0,
                                0,
                                0,
                                1,
                                new Date(),
                                0,
                                0, []
                            );
                            createConversationOffline(String(req.body.code), user_infom);
                            res.status(200).json({
                                data: {
                                    result: false,
                                    message: 'Vị trí không phù hợp, Nhóm offline chưa tồn tại,Đã tạo nhóm offline mới ',
                                },
                                error: null,
                            });
                        }
                    }
                    // nếu thành viên đầu tiên của nhóm không còn tồn tại thì tiến hành xóa nhóm ; user nhập lại mã thì tạo nhóm mới
                    else if (host && Number(host.length) === 0) {
                        const delete_conv = await Conversation.deleteOne({ _id: conversations[0]._id });
                        if (delete_conv) {
                            // nếu không tồn tại thì đi vào try catch
                            res.status(200).json(createError(200, 'Nhóm không hợp lệ'));
                        }
                    }
                } else {
                    // tạo nhóm với tên mặc định
                    let user_info = fUserConv(
                        Number(infor.userId),
                        `${infor.name}-Offline-${infor.lat}-${infor.long}`,
                        0,
                        0,
                        0,
                        0,
                        1,
                        new Date(),
                        0,
                        0, []
                    );
                    createConversationOffline(String(req.body.code), user_info);
                    res.status(200).json({
                        data: {
                            result: false,
                            message: 'Thời gian hoặc mã code không phù hợp, Nhóm offline chưa tồn tại,Đã tạo nhóm offline mới',
                        },
                        error: null,
                    });
                }
            }
        } else {
            res.status(200).json(createError(200, 'Thông tin không đầy đủ'));
        }
    } catch (e) {
        console.log('JoinConversationOffline', e);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const GetListConversation_V2 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversation_V2');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId);
        const page = Number(req.body.page);
        const skip = (page - 1) * 20;
        const limit = page * 20;

        console.time('getConvV2 aggr');
        const listCons = await Users.aggregate([{
            $match: {
                _id: userId,
            },
        },
        {
            $lookup: {
                from: 'Conversations',
                localField: '_id',
                foreignField: 'memberList.memberId',
                as: 'conversations',
            },
        },
        {
            $project: {
                conversations: 1,
            },
        },
        {
            $unwind: {
                path: '$conversations',
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $project: {
                conversationId: '$conversations._id',
                isGroup: '$conversations.isGroup',
                typeGroup: '$conversations.typeGroup',
                avatarConversation: '$conversations.avatarConversation',
                linkAvatar: '$conversations.avatarConversation',
                adminId: '$conversations.adminId',
                shareGroupFromLinkOption: '$conversations.shareGroupFromLinkOption',
                browseMemberOption: '$conversations.browseMemberOption',
                pinMessage: '$conversations.pinMessage',
                memberList: '$conversations.memberList',
                messageList: '$conversations.messageList',
                browseMemberList: '$conversations.browseMemberList',
                timeLastMessage: '$conversations.timeLastMessage',
                timeLastChange: '$conversations.timeLastChange',
                liveChat: '$conversations.liveChat',
                lastMess: {
                    $arrayElemAt: ['$conversations.messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$conversations.memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$conversations.messageList',
                },
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                isFavorite: -1,
                timeLastMessage: -1,
            },
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
        ]);
        console.timeEnd('getConvV2 aggr');
        console.time('getConvV2 preprocess');
        const data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        const contact = await Contact.find({
            $or: [{ userFist: userId }, { userSecond: userId }],
        })
            .limit(100)
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);

                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;

                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');

                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].userName;

            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName = users[0] ? users[0].conversationName : users[0].userName;
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0].conversationName ||
                    owner
                        .map((e) => (e = e.userName))
                        .slice(-2)
                        .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName ||
                    users
                        .map((e) => (e = e.userName))
                        .slice(-3)
                        .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName || owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    dataBrowerMem.lastActive = date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                    dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                        `${urlImgHost()}avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                        `${urlImgHost()}avatar/${dataBrowerMem.userName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                        }.png`;
                    return (e = {
                        userMember: dataBrowerMem,
                        memberAddId: e.memberAddId,
                    });
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        data['listCoversation'] = listCons;
        console.timeEnd('getConvV2 preprocess');
        return res.send({ data, error: null });
    } catch (err) {
        console.log('GetListConversation_V2', err);
        if (err) return res.send(createError(200, err.message));
    }
};

//ChangeShareLinkOfGroup
export const ChangeShareLinkOfGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, ChangeShareLinkOfGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ChangeShareLinkOfGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const shareGroupFromLink = Number(req.body.shareGroupFromLink);
        const existConversation = await Conversation.findById(conversationId).lean();
        if (shareGroupFromLink == null) return res.status(200).send(createError(200, 'Thiếu thông tin truyền lên'));
        if (!existConversation) return res.status(200).send(createError(200, 'Thay đổi chia sẻ link nhóm thất bại'));
        if (shareGroupFromLink > 0) {
            existConversation.shareGroupFromLinkOption = 1;
        }
        if (shareGroupFromLink === 0) {
            existConversation.shareGroupFromLinkOption = 0;
        }
        await existConversation.save();
        const data = {
            result: true,
            message: 'Thay đổi chia sẻ link nhóm thành công',
        };
        return res.status(200).send({ data, error: null });
    } catch (err) {
        if (err) return res.status(200).send(createError(200, err.message));
    }
};
//Danh sach cuoc hoi thoai chua doc
export const GetListConversationUnreader = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversation_V2');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId);
        const page = Number(req.body.page);
        const skip = (page - 1) * 20;
        const limit = page * 20;
        const listCons = await Users.aggregate([{
            $match: {
                _id: userId,
            },
        },
        {
            $lookup: {
                from: 'Conversations',
                localField: '_id',
                foreignField: 'memberList.memberId',
                as: 'conversations',
            },
        },
        {
            $project: {
                conversations: 1,
            },
        },
        {
            $unwind: {
                path: '$conversations',
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $project: {
                conversationId: '$conversations._id',
                isGroup: '$conversations.isGroup',
                typeGroup: '$conversations.typeGroup',
                avatarConversation: '$conversations.avatarConversation',
                linkAvatar: '$conversations.avatarConversation',
                adminId: '$conversations.adminId',
                shareGroupFromLinkOption: '$conversations.shareGroupFromLinkOption',
                browseMemberOption: '$conversations.browseMemberOption',
                pinMessage: '$conversations.pinMessage',
                memberList: '$conversations.memberList',
                messageList: '$conversations.messageList',
                browseMemberList: '$conversations.browseMemberList',
                timeLastMessage: '$conversations.timeLastMessage',
                timeLastChange: '$conversations.timeLastChange',
                liveChat: '$conversations.liveChat',
                lastMess: {
                    $arrayElemAt: ['$conversations.messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$conversations.memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$conversations.messageList',
                },
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
                memberList: {
                    $elemMatch: {
                        memberId: userId,
                        unReader: {
                            $ne: 0,
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                isFavorite: -1,
                timeLastMessage: -1,
            },
        },
        ]);

        const data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        const contact = await Contact.find({
            $or: [{ userFist: userId }, { userSecond: userId }],
        })
            .limit(100)
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');

                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName = users[0] ? users[0].conversationName : users[0].userName;
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0].conversationName ||
                    owner
                        .map((e) => (e = e.userName))
                        .slice(-2)
                        .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName ||
                    users
                        .map((e) => (e = e.userName))
                        .slice(-3)
                        .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName || owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    dataBrowerMem.lastActive = date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                    dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                        `${urlImgHost()}avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                        `${urlImgHost()}avatar/${dataBrowerMem.userName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                        }.png`;
                    return (e = {
                        userMember: dataBrowerMem,
                        memberAddId: e.memberAddId,
                    });
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        data['listCoversation'] = listCons;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};
//Danh sach hoi thoai chua doc (id)
export const GetListUnreaderConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            console.log('test', check);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListUnreaderConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId);
        if (!userId) return res.status(200).send(createError(200, 'Thiếu thông tin truyền lên'));
        const listUnreaderConversations = await Conversation.find({
            memberList: { $elemMatch: { memberId: userId, unReader: { $ne: 0 } } },
        })
            .select('_id')
            .lean();
        if (listUnreaderConversations.length === 0)
            return res.status(200).send(createError(200, 'User không có cuộc trò chuyện chưa đọc nào'));
        const data = {
            result: true,
            message: 'Lấy cuộc trò chuyện thành công',
            conversation: [],
            error: null,
        };
        for (let i = 0; i < listUnreaderConversations.length; i++) {
            data.conversation.push(listUnreaderConversations[i]._id);
        }
        data['countConversation'] = data.conversation.length;

        let lastConv = await Conversation.find({
            memberList: { $elemMatch: { memberId: userId, unReader: { $ne: 0 } } },
        })
            .sort({ timeLastChange: -1 })
            .limit(1)
            .select('_id')
            .lean();
        let dataConv = await FGetConversation({
            body: {
                senderId: userId,
                conversationId: data.conversation[0],
            },
        });
        if (dataConv && dataConv.data && dataConv.data.conversation_info) {
            data['conversationInfor'] = {
                _id: data.conversation[0],
                conversationName: dataConv.data.conversation_info.conversationName,
                message: dataConv.data.conversation_info.message,
            };
        }
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.message));
    }
};

//Danh sach thanh vien trong group
export const GetListMemberOfGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, GetListMemberOfGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const conversationId = Number(req.body.conversationId) || null;
        const existConversation = await Conversation.findOne({ _id: conversationId }, { memberList: 1 }).lean();
        if (!existConversation) return res.status(200).send(createError(200, 'Không tìm thấy kết quả'));
        const data = {
            result: true,
            message: 'Lấy danh sách thành viên thành công',
            userList: [],
            error: null,
        };
        let arrayId = [];
        for (let i = 0; i < existConversation.memberList.length; i++) {
            arrayId.push(existConversation.memberList[i].memberId);
        }
        const dataUser = await Users.find({ _id: { $in: arrayId } });
        let count = 0;
        while (count < dataUser.length) {
            const avatarUser = dataUser[count].avatarUser ?
                `${urlImgHost()}avatarUser/${dataUser[count]._id}/${dataUser[count].avatarUser}` :
                `${urlImgHost()}avatar/${dataUser[count].userName.substring(0, 1)}_${Math.floor(Math.random() * 4) + 1
                }.png`;
            data.userList.push({
                id: dataUser[count]._id,
                userName: dataUser[count].userName,
                avatarUser: avatarUser,
                status: dataUser[count].status,
                active: dataUser[count].active,
                isOnline: dataUser[count].isOnline,
                statusEmotion: dataUser[count]?.configChat?.statusEmotion,
                lastActive: date.format(dataUser[count].lastActivedAt || new Date(), 'DD/MM/YYYY HH:mm:ss A'),
                linkAvatar: avatarUser,
                companyId: dataUser[count]?.inForPerson?.employee?.com_id ?
                    dataUser[count].inForPerson.employee.com_id :
                    dataUser[count].idQLC,
                timeLastSeener: dataUser[count].timeLastSeener,
                idTimViec: dataUser[count].idTimViec365,
                type365: dataUser[count].type,
                friendStatus: 'none',
                liveChat: null,
            });
            count++;
        }
        res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.message));
    }
};

//Thay doi ten nhom
export const ChangeNameGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, ChangeNameGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ChangeNameGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const userId = Number(req.body.userId);
        const conversationName = req.body.conversationName;
        const existConversation = await Conversation.findOne({
            _id: conversationId,
            isGroup: 1,
        });
        if (!existConversation) return res.status(200).send(createError(200, 'Thay đổi tên nhóm thất bại'));
        const data = {
            result: true,
            message: 'Thay đổi tên nhóm thành công',
        };
        const oldConversationName = existConversation.memberList[0].conversationName;
        for (let i = 0; i < existConversation.memberList.length; i++) {
            existConversation.memberList[i].conversationName = conversationName;
        }
        const user = await Users.findOne({ _id: userId }, { userName: 1 }).lean();
        let sendmes = await axios({
            method: 'post',
            url: 'http://210.245.108.202:9000/api/message/SendMessage',
            data: {
                ConversationID: conversationId,
                SenderID: existConversation.memberList[0].memberId,
                MessageType: 'notification',
                Message: `${user.userName} đã đổi tên nhóm từ ${oldConversationName} thành ${conversationName}`,
                dev: 'dev',
            },
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        await existConversation.save();
        return res.status(200).send({ data, error: null });
    } catch (err) {
        // console.log(err)
        if (err) return res.status(200).send(createError(200, err.message));
    }
};
//Bat tat thanh vien kiem duyet
export const ChangeBrowseMemberOfGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, ChangeBrowseMemberOfGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ChangeBrowseMemberOfGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const browseMember = Number(req.body.browseMember) === 0 ? 0 : 1;
        const conversationId = Number(req.body.conversationId) || null;
        if (conversationId === null) return res.status(200).send(createError(200, 'Thiếu thông tin truyền lên'));
        const conversation = await Conversation.findOne({
            _id: conversationId,
            isGroup: 1,
        }).lean();

        if (!conversation) {
            return res.status(200).send(createError(200, 'Thay đổi chia sẻ link nhóm thất bại'));
        }
        conversation.browseMemberOption = browseMember;
        await conversation.save();
        const data = {
            result: true,
            message: 'Thay đổi chia sẻ link nhóm thành công',
        };
        return res.status(200).send({ data, error: null });
    } catch (err) {
        if (err) return res.status(200).send(createError(200, err.message));
    }
};
//Ghim tin nhan
export const PinMessage = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, PinMessage');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/PinMessage',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const pinMessageId = req.body.pinMessageId;
        const existConversation = await Conversation.findOne({
            _id: conversationId,
            'messageList._id': pinMessageId,
        });
        if (!existConversation) return res.status(200).send(createError(200, 'Ghim tin nhắn thất bại'));
        existConversation.timeLastChange = Date.now();
        existConversation.pinMessage = pinMessageId;
        await existConversation.save();
        return res.status(200).send({
            data: {
                result: true,
                message: 'Ghim tin nhắn thành công',
            },
        });
    } catch (err) {
        if (err) return res.status(200).send(createError(200, err.message));
    }
};
//Bo ghim tin nhan
export const UnPinMessage = async (req, res) => {
    try {
        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/UnPinMessage',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const pinMessageId = req.body.pinMessageId;
        const existConversation = await Conversation.findOne({
            _id: conversationId,
        });
        if (!existConversation) return res.status(200).send(createError(200, 'Bỏ ghim tin nhắn thất bại'));
        existConversation.pinMessage = '';
        await existConversation.save();
        return res.status(200).send({
            data: {
                result: true,
                message: 'Bỏ ghim tin nhắn thành công',
            },
            error: null,
        });
    } catch (err) {
        if (err) return res.status(200).send(createError(200, err.message));
    }
};

//Lay 1 cuoc hoi thoai
export const GetConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, GetConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        const conversationId = Number(req.body.conversationId);
        const senderId = Number(req.body.senderId);
        const listCons = await Conversation.aggregate([{
            $match: {
                _id: conversationId,
            },
        },
        { $limit: 1 },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'userCreate',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                userCreate: { $ifNull: ['$userCreate', 0] },
                userNameCreate: { $ifNull: ['$user.userName', ''] },
                memberApproval: { $ifNull: ['$memberApproval', 1] },
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', senderId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                deputyAdminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberApproval: 1,
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                fromWeb: 1,
                count: { $size: '$memberList' },
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
                lastMessageSeen: '$sender.lastMessageSeen',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                deputyAdminId: 1,
                userCreate: 1,
                userNameCreate: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                memberApproval: 1,
                pinMessageId: 1,
                count: { $size: '$memberList' },
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                            statusOnline: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.statusOnline', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                lastMessageSeen: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                // isFavorite: -1,
                timeLastMessage: -1,
            },
        },
        ]);
        if (listCons[0]) console.log(listCons[0].listMember);
        const data = {
            result: true,
            message: 'Lấy thông tin cuộc trò chuyện thành công',
        };
        if (!listCons.length) {
            return res.send(createError(200, 'Cuộc trò chuyện không tồn tại'));
        }
        const contact = await Contact.find({
            $or: [{ userFist: senderId }, { userSecond: senderId }],
        })
            .limit(100)
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == senderId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == senderId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== senderId);
            const owner = newDataMember.filter((mem) => mem._id === senderId);
            let conversationName = owner && owner[0] ? owner[0].conversationName || owner[0].userName : '';
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    if (owner[0] && users[0]) {
                        if ((owner[0] && owner[0].conversationName) || users[0].userName) {
                            conversationName = owner[0].conversationName || users[0].userName;
                        } else {
                            conversationName = '';
                        }
                    } else {
                        conversationName = '';
                    }
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        users[0].conversationName :
                        owner
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            if (!listCons[index]['conversationName']) {
                listCons[index]['conversationName'] = '';
            }
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
        }
        let obj = listCons[0];
        if (!obj.createAt) {
            obj = { ...obj, createAt: new Date() };
        }
        data['conversation_info'] = obj;
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const GetConversation_v2 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, GetConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let conversationId;
        const senderId = Number(req.body.senderId);
        if (Number(req.body.IsGroup == 0) && req.body.contactId) {
            let conversationIdFind = await FCreateNewConversation({
                body: {
                    userId: senderId,
                    contactId: Number(req.body.contactId),
                },
            });
            if (conversationIdFind) {
                conversationId = Number(conversationIdFind);
            } else {
                return res.status(200).send(createError(200, 'Can not find conversation'));
            }
        } else {
            conversationId = Number(req.body.conversationId);
        }
        const listCons = await Conversation.aggregate([{
            $match: {
                _id: conversationId,
            },
        },
        { $limit: 1 },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', senderId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                deputyAdminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                count: { $size: '$memberList' },
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
                lastMessageSeen: '$sender.lastMessageSeen',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                deputyAdminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                count: { $size: '$memberList' },
                memberList: {
                    memberId: 1,
                    conversationName: 1,
                    unReader: 1,
                    messageDisplay: 1,
                    isHidden: 1,
                    isFavorite: 1,
                    notification: 1,
                    timeLastSeener: 1,
                    lastMessageSeen: 1,
                    deleteTime: 1,
                    deleteType: 1,
                    favoriteMessage: 1,
                    liveChat: 1,
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                // isFavorite: -1,
                timeLastMessage: -1,
            },
        },
        ]);
        const data = {
            result: true,
            message: 'Lấy thông tin cuộc trò chuyện thành công',
        };
        if (!listCons.length) {
            return res.send(createError(200, 'Cuộc trò chuyện không tồn tại'));
        }
        const contact = await Contact.find({
            $or: [{ userFist: senderId }, { userSecond: senderId }],
        })
            .limit(100)
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == senderId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == senderId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== senderId);
            const owner = newDataMember.filter((mem) => mem._id === senderId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        users[0].conversationName :
                        owner
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            if (!listCons[index]['conversationName']) {
                listCons[index]['conversationName'] = '';
            }
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
        }
        let obj = listCons[0];
        if (!obj.createAt) {
            obj = { ...obj, createAt: new Date() };
        }
        data['conversation_info'] = obj;
        data['listMessage'] = await FLoadMessage({
            body: {
                conversationId,
                adminId: senderId,
            },
        });
        if (req.body.isRead) {
            FReadMessage({
                body: {
                    conversationId: conversationId,
                    senderId: senderId,
                },
            });
        }
        if (Number(req.body.IsGroup == 0) && req.body.contactId) {
            data['FriendStatus'] = await FCheckStatus({
                body: {
                    userId: senderId,
                    contactId: Number(req.body.contactId),
                },
            });
        }
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};
//Thoat khoi cuoc tro chuyen
export const OutGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, OutGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/OutGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const senderId = Number(req.body.senderId);
        const adminId = Number(req.body.adminId) || 0;
        console.log('OutGroup body', req.body);
        let existConversation;
        if (adminId > 0) {
            existConversation = await Conversation.findOne({
                _id: conversationId,
            }).select({
                adminId: 1,
                memberList: 1,
            });
        } else {
            existConversation = await Conversation.findOne({
                _id: conversationId,
                'memberList.memberId': { $eq: senderId },
            }).select({
                memberList: 1,
            });
        }
        const data = {
            result: true,
        };
        if (!existConversation) return res.status(200).send(createError(200, 'Rời nhóm thất bại'));
        const listMember = existConversation.memberList.map((member) => member.memberId);
        socket.emit('OutGroup', conversationId, senderId, adminId, listMember);
        if (existConversation && adminId === -1) {
            existConversation.timeLastChange = Date.now();
            existConversation.memberList = existConversation.memberList.filter((e) => e.memberId !== senderId);
            await existConversation.save();
            data['message'] = 'Rời nhóm thành công';
            return res.status(200).send({ data, error: null });
        }
        if (existConversation && existConversation.typeGroup == 'Moderate' && adminId > 0) {
            existConversation.adminId = adminId;
            existConversation.timeLastChange = Date.now();
            existConversation.memberList = existConversation.memberList.filter((e) => e.memberId !== senderId);
            await existConversation.save();
            data['message'] = 'Trao quyền quản trị viên nhóm thành công';
            return res.status(200).send({ data, error: null });
        }

        if (existConversation && adminId === 0) {
            existConversation.timeLastChange = Date.now();
            existConversation.memberList = existConversation.memberList.filter((e) => e.memberId !== senderId);
            await existConversation.save();
            data['message'] = 'Rời nhóm thành công';
            return res.status(200).send({ data, error: null });
        }
        if (existConversation && adminId > 0) {
            existConversation.adminId = adminId;
            existConversation.timeLastChange = Date.now();
            existConversation.memberList = existConversation.memberList.filter((e) => e.memberId !== senderId);
            await existConversation.save();
            data['message'] = 'Trao quyền quản trị viên nhóm thành công';
            return res.status(200).send({ data, error: null });
        }
        data['message'] = 'Trao quyền quản trị viên nhóm thất bại';
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) res.status(200).send(createError(200, err.message));
    }
};

export const OutManyGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, OutManyGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/OutManyGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        if (req.body && req.body.userId && req.body.arrayConvId && String(req.body.arrayConvId).includes('[')) {
            let arrayConvId = ConvertToArrayNumber(req.body.arrayConvId);
            for (let i = 0; i < arrayConvId.length; i++) {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/OutGroup',
                    data: {
                        conversationId: arrayConvId[i],
                        senderId: Number(req.body.userId),
                        adminId: 0,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            res.json({
                data: {
                    result: true,
                    message: 'Outed succesfully',
                },
                error: null,
            });
        } else {
            return res.send(createError(200, 'Information is not true'));
        }
    } catch (e) {
        console.log(e);
        if (e) return res.send(createError(200, e.message));
    }
};
//Them cuoc hoi thoait vao yeu thich
export const AddToFavoriteConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, AddToFavoriteConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/AddToFavoriteConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const senderId = Number(req.body.senderId);
        const isFavorite = Number(req.body.isFavorite);
        const existConversation = await Conversation.findById(conversationId).select({ memberList: 1 }).lean();
        const data = {
            result: true,
            error: null,
        };
        if (!existConversation) return res.send(createError(200, 'Sửa Trạng thái yêu thích nhóm thất bại'));
        if (isFavorite == 0) {
            await Conversation.updateOne({ _id: conversationId, 'memberList.memberId': senderId }, { $set: { 'memberList.$.isFavorite': 0 } });
            data['message'] = 'Sửa Trạng thái ẩn nhóm thành công';
            return res.send(data);
        }
        if (isFavorite > 0) {
            await Conversation.updateOne({ _id: conversationId, 'memberList.memberId': senderId }, { $set: { 'memberList.$.isFavorite': 1 } });
            data['message'] = 'Sửa Trạng thái ẩn nhóm thành công';
            return res.send(data);
        }
        return res.send(createError(200, 'Sửa Trạng thái yêu thích nhóm thất bại'));
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//An cuoc hoi thoai
export const HiddenConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, HiddenConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/HiddenConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const senderId = Number(req.body.senderId);
        const isHidden = Number(req.body.isHidden);
        const existConversation = await Conversation.findOne({ _id: conversationId }, { memberList: 1 });
        const data = {
            result: true,
            error: null,
        };
        if (!existConversation) return res.send(createError(200, 'Sửa Trạng thái ẩn nhóm thất bại'));
        if (isHidden == 0) {
            let memberIndex = existConversation.memberList.findIndex((e) => e.memberId === senderId);
            existConversation.memberList[memberIndex].isHidden = 0;
            await existConversation.save();
            data['message'] = 'Sửa Trạng thái yêu thích nhóm thành công';
            return res.send(data);
        }
        if (isHidden > 0) {
            let memberIndex = existConversation.memberList.findIndex((e) => e.memberId === senderId);
            existConversation.memberList[memberIndex].isHidden = 1;
            await existConversation.save();
            data['message'] = 'Sửa Trạng thái ẩn nhóm thành công';
            return res.send(data);
        }
        return res.send(createError(200, 'Sửa Trạng thái ẩn nhóm thất bại'));
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

//Tao cuoc hoi thoai 1 1
export const CreateNewConversation = async (req, res) => {
    try {
        console.log('CreateNewConversation', req.body);
        // if (req.body.token) {
        //     let check = await checkToken(req.body.token);
        //     if (check && check.status && (check.userId == req.body.userId)) {
        //         console.log("Token hop le, CreateNewConversation")
        //     } else {
        //         return res.status(404).json(createError(404, "Invalid token"));
        //     }
        // }
        let conversationId;

        if (req.body.dev === 'dev') {
            conversationId = Number(req.body.conversationId);
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            const response = await axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/CreateNewConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
            conversationId = response.data.data.conversationId;
            if (conversationId) {
                conversationId = Number(conversationId);
            }
        }

        const userId = Number(req.body.userId);
        const contactId = Number(req.body.contactId);
        const data = {
            result: true,
        };
        const bigestId = (await Conversation.find().sort({ _id: -1 }).select('_id').limit(1))[0]._id;
        const existConversation = await Conversation.findOne({
            $and: [{ 'memberList.memberId': { $eq: userId } }, { 'memberList.memberId': { $eq: contactId } }],
            memberList: { $size: 2 },
            isGroup: 0,
        }).lean();
        if (existConversation) {
            Conversation.updateOne({ _id: existConversation._id }, { $set: { timeLastChange: new Date() } }).catch(
                (e) => {
                    console.log('CreateNewConversation error', e);
                }
            );
            data['conversationId'] = existConversation._id;
            return res.send({ data, error: null });
        }
        let user_Favorite = 0;
        let contact_Favorite = 0;
        if (userId === 1216972) {
            contact_Favorite = 1;
        }
        if (contactId === 1216972) {
            user_Favorite = 1;
        }
        const newConversation = await Conversation.create({
            _id: conversationId || bigestId + 1,
            isGroup: 0,
            typeGroup: 'Normal',
            memberList: [{
                memberId: userId,
                notification: 1,
                isFavorite: user_Favorite,
            },
            {
                memberId: contactId,
                notification: 1,
                isFavorite: contact_Favorite,
            },
            ],
            messageList: [],
            browseMemberList: [],
        });
        data['conversationId'] = newConversation._id;
        await Counter.findOneAndUpdate({ name: 'ConversationID' }, { countID: newConversation._id });
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};
//Tao cuoc hoi thoai 1 1 zalo
export const CreateNewConversationZalo = async (req, res) => {
    try {
        console.log('CreateNewConversation', req.body);
        // if (req.body.token) {
        //     let check = await checkToken(req.body.token);
        //     if (check && check.status && (check.userId == req.body.userId)) {
        //         console.log("Token hop le, CreateNewConversation")
        //     } else {
        //         return res.status(404).json(createError(404, "Invalid token"));
        //     }
        // }
        let conversationId;

        if (req.body.dev === 'dev') { // TH giao tiếp giữa máy chủ 142 -202 (142 là máy chủ chứa data chính)
            conversationId = Number(req.body.conversationId);
            // return res.status(404).json(createError(404, "Xong"));
        } else { // TH người dùng gửi req : gửi sang 142 để lấy max converID 
            const response = await axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/CreateNewConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
            conversationId = response.data.data.conversationId;
            if (conversationId) {
                conversationId = Number(conversationId);
            }
        }

        const userId = Number(req.body.userId);
        const contactId = Number(req.body.contactId);
        const data = {
            result: true,
        };
        // lấy maxID trong TH lỗi không call được sang 142
        const bigestId = (await Conversation.find().sort({ _id: -1 }).select('_id').limit(1))[0]._id;
        //check tồn tại cuộc trò chuyện
        const existConversation = await Conversation.findOne({
            $and: [{ 'memberList.memberId': { $eq: userId } }, { 'memberList.memberId': { $eq: contactId } }],
            memberList: { $size: 2 },
            isGroup: 0,
        }).lean();
        if (existConversation) {
            //nếu tồn tại update time và trả ra id Conversation
            Conversation.updateOne({ _id: existConversation._id }, { $set: { timeLastChange: new Date() } }).catch(
                (e) => {
                    console.log('CreateNewConversation error', e);
                }
            );
            data['conversationId'] = existConversation._id;
            return res.send({ data, error: null });
        }
        let user_Favorite = 0;
        let contact_Favorite = 0;
        //phân biệt cuộc trò truyện yêu thích 
        if (userId === 1216972) {
            contact_Favorite = 1;
        }
        if (contactId === 1216972) {
            user_Favorite = 1;
        }
        const newConversation = await Conversation.create({
            _id: conversationId || bigestId + 1,
            isGroup: 0,
            typeGroup: 'zalo',
            memberList: [{
                memberId: userId,
                notification: 1,
                isFavorite: user_Favorite,
            },
            {
                memberId: contactId,
                notification: 1,
                isFavorite: contact_Favorite,
            },
            ],
            messageList: [],
            browseMemberList: [],
        });
        data['conversationId'] = newConversation._id;
        await Counter.findOneAndUpdate({ name: 'ConversationID' }, { countID: newConversation._id });
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};
//Xoa cuoc hoi thoai
export const DeleteConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, DeleteConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/DeleteConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const senderId = Number(req.body.senderId);
        const existConversation = await Conversation.findOne({
            _id: conversationId,
        })
            .select({
                memberList: 1,
                messageList: 1,
            })
            .lean();
        const indexMember = existConversation.memberList.findIndex((e) => e.memberId === senderId);
        const lastMess = existConversation.messageList.at(-1);
        existConversation.memberList[indexMember].messageDisplay = lastMess.displayMessage;
        existConversation.memberList[indexMember].isHidden = 1;
        await existConversation.save();
        const data = {
            result: true,
            message: 'Xóa cuộc trò chuyện thành công',
        };
        return res.status(200).send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//Doc tin nhan
export const ReadMessage = async (req, res) => {
    try {
        // if (req.body.token) {
        //     let check = await checkToken(req.body.token);
        //     if (check && check.status && (check.userId == req.body.senderId)) {
        //         console.log("Token hop le, ReadMessage")
        //     } else {
        //         return res.status(404).json(createError(404, "Invalid token"));
        //     }
        // }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ReadMessage',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const data = {
            result: true,
            message: 'Đánh dấu tin nhắn đã đọc thành công thành công',
        };
        res.send({ data, error: null });

        const senderId = Number(req.body.senderId);
        const conversationId = Number(req.body.conversationId);
        const existUnreadMessage = await Conversation.findOne({
            _id: conversationId,
            'memberList.memberId': senderId,
        }, {
            messageList: 1,
            'memberList.memberId': 1,
        }).lean();
        if (existUnreadMessage && existUnreadMessage.memberList) {
            if (existUnreadMessage.messageList && existUnreadMessage.messageList.length) {
                Conversation.updateOne({ _id: conversationId, 'memberList.memberId': senderId }, {
                    $set: {
                        'memberList.$.unReader': 0,
                        'memberList.$.timeLastSeener': Date.now(),
                        'memberList.$.lastMessageSeen': existUnreadMessage.messageList[existUnreadMessage.messageList.length - 1]._id,
                    },
                }).catch((e) => {
                    console.log('Error readmessage');
                    return false;
                });
            } else {
                if (existUnreadMessage.messageList[existUnreadMessage.messageList.length - 1]) {
                    Conversation.updateOne({ _id: conversationId, 'memberList.memberId': senderId }, {
                        $set: {
                            'memberList.$.unReader': 0,
                            'memberList.$.timeLastSeener': Date.now(),
                            'memberList.$.lastMessageSeen': existUnreadMessage.messageList[existUnreadMessage.messageList.length - 1]._id,
                        },
                    }).catch((e) => {
                        console.log('Error readmessage');
                        return false;
                    });
                }
            }
        }
        return true;
    } catch (err) {
        console.log('ReadMessage', err);
        return false;
    }
};
//lay danh sach de chuyen tiep tin nhan
export const GetListConversationForward = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversationForward');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId) || null;
        const countConversationLoad = Number(req.body.countConversationLoad);
        const message = req.body.message || null;
        if (userId == null) return res.send(createError(200, 'Thiếu thông tin truyền lên'));

        const listCons = await User.aggregate([{
            $match: {
                _id: userId,
            },
        },
        {
            $lookup: {
                from: 'Conversations',
                localField: '_id',
                foreignField: 'memberList.memberId',
                as: 'conversations',
            },
        },
        {
            $project: {
                conversations: 1,
            },
        },
        {
            $unwind: {
                path: '$conversations',
            },
        },
        {
            $project: {
                conversationId: '$conversations._id',
                avatarConversation: '$conversations.avatarConversation',
                linkAvatar: '$conversations.avatarConversation',
                memberList: '$conversations.memberList',
                messageList: '$conversations.messageList',
                isGroup: '$conversations.isGroup',
                timeLastMessage: '$timeLastMessage.isGroup',
                messageList: '$conversations.messageList',
                sender: {
                    $filter: {
                        input: '$conversations.memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                timeLastMessage: '$conversations.timeLastMessage',
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                memberList: 1,
                messageList: 1,
                isFavorite: '$sender.isFavorite',
                isGroup: 1,
                sender: 1,
                timeLastSeener: 1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                memberList: {
                    memberId: 1,
                    conversationName: 1,
                },
                isFavorite: 1,
                isGroup: 1,
                listMember: {
                    _id: 1,
                    userName: 1,
                    avatarUser: 1,
                    status: 1,
                    fromWeb: 1,
                    createdAt: 1,
                },
                name: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $ne: ['$$mem.memberId', userId],
                        },
                    },
                },
                name1: {
                    $filter: {
                        input: '$listMember',
                        as: 'mem',
                        cond: {
                            $ne: ['$$mem._id', userId],
                        },
                    },
                },
                name2: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                isGroup: 1,
                sender: 1,
                timeLastMessage: 1,
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                isGroup: 1,
                memberList: 1,
                isFavorite: 1,
                listMember: 1,
                name: {
                    $arrayElemAt: ['$name', 0],
                },
                name1: {
                    $arrayElemAt: ['$name1', 0],
                },
                name2: {
                    $arrayElemAt: ['$name2', 0],
                },
                sender: 1,
                status: '',
                timeLastMessage: 1,
            },
        },
        {
            $project: {
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                isGroup: 1,
                memberList: 1,
                isFavorite: 1,
                listMember: 1,
                name: {
                    conversationName: 1,
                },
                name1: {
                    userName: 1,
                },
                name2: {
                    conversationName: 1,
                },
                name3: 'Chỉ mình bạn',
                status: 1,
                timeLastMessage: 1,
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                memberList: 1,
                isFavorite: 1,
                listMember: 1,
                timeLastMessage: 1,
                conversationName: {
                    $cond: [{
                        $ne: ['$name2.conversationName', ''],
                    },
                        '$name2.conversationName',
                        '$name1.userName',
                    ],
                },
            },
        },
        {
            $match: {
                conversationName: message ? new RegExp(`.*${message}.*`, 'i') : new RegExp('.*.*', 'i'),
            },
        },
        {
            $skip: countConversationLoad || 0,
        },
        {
            $limit: 20,
        },
        ]);
        if (listCons.length == 0) {
            return res.send(createError(200, 'User không có cuộc trò chuyện nào'));
        }
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                e.linkAvatar = e.avatarUser;
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            let status;
            let avatarConversation;
            if (!con.isGroup && users[0]) {
                avatarConversation = users[0].avatarUser ?
                    `${urlImgHost()}avatarUser/${users[0]._id}/${users[0].avatarUser}` :
                    `${urlImgHost()}avatar/${users[0].userName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
                status = users[0].status;
            }
            if (con.isGroup) {
                avatarConversation = con.avatarConversation ?
                    `${urlImgHost()}avatarGroup/${con.conversationId}/${con.avatarConversation}` :
                    `${urlImgHost()}avatar/${con.conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
                status = `${newDataMember.length} thành viên`;
            }
            listCons[index].status = status;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
            delete listCons[index]['listMember'];
        }
        const data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        data['listCoversation'] = listCons;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) {
            return res.send(createError(200, err.message));
        }
    }
};

//
export const GetConversationList = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetConversationList');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId);
        const countConversation = req.body.countConversation ? Number(req.body.countConversation) : 20;
        const countConversationLoad = req.body.countConversationLoad ? Number(req.body.countConversationLoad) : 0;
        const listCons = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': userId,
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                // isFavorite: -1,
                timeLastMessage: -1,
            },
        },
        {
            $skip: countConversationLoad,
        },
        {
            $limit: countConversation,
        },
        ]);

        const data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        const contact = await RequestContact.find({
            $or: [{ contactId: userId }, { userId: userId }],
        })
            .select(['userId', 'contactId', 'status'])
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                const relationShip = contact.find((e) => {
                    if (
                        (e.userId === userId && e.contactId === user.memberId) ||
                        (e.contactId === userId && e.userId === user.memberId)
                    )
                        return true;
                });
                e['friendStatus'] = relationShip ? relationShip.status : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');

                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName = users[0] ? users[0].conversationName : users[0].userName;
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0].conversationName ||
                    owner
                        .map((e) => (e = e.userName))
                        .slice(-2)
                        .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName ||
                    users
                        .map((e) => (e = e.userName))
                        .slice(-3)
                        .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName || owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    dataBrowerMem.lastActive = date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                    dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                        `${urlImgHost()}avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                        `${urlImgHost()}avatar/${dataBrowerMem.userName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                        }.png`;
                    return (e = {
                        userMember: dataBrowerMem,
                        memberAddId: e.memberAddId,
                    });
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        data['listCoversation'] = listCons;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

//Them nguoi kiem duyet
export const AddBrowseMember = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, AddBrowseMember');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/AddBrowseMember',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const senderId = Number(req.body.senderId);
        const memberList = JSON.parse(req.body.memberList);
        const conversationId = Number(req.body.conversationId);
        const query = {
            _id: conversationId,
        };
        const newBrowse = memberList.map((e) => {
            return (e = {
                memberAddId: senderId,
                memberBrowserId: e,
            });
        });
        const update = {
            $push: { browseMemberList: { $each: newBrowse } },
        };

        const existConversation = await Conversation.findOneAndUpdate(query, update);
        if (!existConversation) return res.status(200).send(createError(200, 'Không thể thêm người kiểm duyệt'));
        const data = {
            result: 'true',
            message: 'Thêm người kiểm duyệt thành công',
        };
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.message));
    }
};

//Danh dau tin nhan chua doc
export const MarkUnreader = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, MarkUnreader');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const conversationId = Number(req.body.conversationId) || null;
        const senderId = Number(req.body.senderId) || null;
        if (conversationId == null || senderId == null) return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        const filter = {
            'memberList.memberId': senderId,
            _id: conversationId,
            $expr: { $gt: [{ $size: '$memberList' }, 1] },
        };
        const updatedConver = await Conversation.findOne(filter);
        if (!updatedConver) return res.send(createError(200, 'Người dùng chưa đọc hết tin nhắn'));
        const idxMem = updatedConver.memberList.findIndex((e) => e.memberId === senderId);
        updatedConver.memberList[idxMem].unReader = 1;
        await updatedConver.save();
        const data = {
            result: true,
            message: 'Đánh dấu tin nhắn chưa đọc thành công thành công',
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//Thayy doi thong bao nhom
export const ChangeNotificationConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.adminId) {
                console.log('Token hop le, ChangeNotificationConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ChangeNotificationConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const adminId = Number(req.body.adminId) || null;
        const conversationId = Number(req.body.conversationId) || null;
        let notification = Number(req.body.notification) === 0 ? 0 : Number(req.body.notification);
        if (notification == null || conversationId == null || adminId == null) {
            return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        }
        notification = notification > 0 ? 1 : 0;
        const query = {
            _id: conversationId,
            memberList: { $elemMatch: { memberId: adminId } },
        };

        const update = {
            $set: { 'memberList.$.notification': notification },
        };
        const updateCon = await Conversation.findOneAndUpdate(query, update);
        const data = {
            result: true,
            message: 'Thay đổi thông báo nhóm thành công',
        };

        socket.emit('CheckNotification', req.body.adminId, req.body.conversationId, req.body.notification);
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.message));
    }
};

//Xoa cuoc tro chuyen ra khoi db
export const RemoveConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, RemoveConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/RemoveConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        // const memberId = Number(req.body.memberId);
        if (conversationId == null) return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        const exCon = await Conversation.findOneAndRemove({
            _id: conversationId,
        });
        if (!exCon) {
            return res.send(createError(200, 'Cuộc trò chuyện không tồn tại'));
        }
        const data = {
            result: true,
            message: 'Xóa cuộc trò chuyện thành công ',
        };
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        return res.send(createError(200, err.message));
    }
};

//Them cuoc tro chuyen
export const AddNewConversation = async (req, res) => {
    try {
        //check token
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, AddNewConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        let conversationId;
        if (req.body.dev === 'dev') {
            conversationId = Number(req.body.conversationId);
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            const response = await axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/AddNewConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
            conversationId = response.data.data.conversation_info.conversationId;
            if (conversationId) {
                conversationId = Number(conversationId);
            }
        }

        const memList = JSON.parse(req.body.memberList);
        const senderId = Number(req.body.senderId);
        const typeGroup = req.body.typeGroup.trim();
        const memberApproval = req.body.memberApproval ? Number(req.body.memberApproval) : 1;
        let conversationName = req.body.conversationName;
        if (!memList || !senderId || !typeGroup)
            return res.status(200).send(createError(200, 'Thiếu thông tin truyền lên'));
        const bigestId = await Conversation.findOne({},{_id: 1}).sort({ _id: -1 }).select('_id').limit(1).lean() || 0;
        const listName = await Users.find({ _id: memList }).select('userName').lean();
        const check = await CheckDefautNameGroupOneMember(Number(memList[0]), conversationName);
        if (check) {
            return res.status(400).send(createError(400, 'Chọn một tên nhóm khác'));
        }
        if (!conversationName && listName.length === 1) {
            conversationName = 'Chỉ mình tôi';
        }
        if (!conversationName && listName.length === 2) {
            conversationName = listName.map((e) => (e = e.userName)).join(', ');
        }
        if (!conversationName && !(listName.length < 3)) {
            conversationName = listName
                .map((e) => (e = e.userName))
                .slice(-3)
                .join(', ');
        }
        const memberList = memList.map((e) => {
            return (e = {
                memberId: e,
                conversationName: conversationName,
                notification: 1,
            });
        });
        const messageList = [];
        const newCon = await Conversation.create({
            _id: conversationId || Number(bigestId._id) + 1,
            adminId: senderId,
            isGroup: 1,
            typeGroup: typeGroup,
            memberList,
            messageList,
            timeLastMessage: new Date(),
            memberApproval,
        });
        // console.log("Cuoc tro chuyen moi tao",newCon)
        await Counter.findOneAndUpdate({ name: 'ConversationID' }, { countID: newCon._id });
        const data = {
            result: true,
            message: 'Tạo nhóm thành công',
        };
        const objectNewCon = newCon.toObject();
        objectNewCon['conversationId'] = objectNewCon._id;
        objectNewCon.memberList = 0;
        objectNewCon.messageList = 0;
        data['conversation_info'] = objectNewCon;
        for (const mem of memberList) {
            let mess;
            if (mem.memberId === senderId) {
                mess = `${senderId} joined this consersation`;
            }
            if (mem.memberId !== senderId) {
                mess = `${senderId} added ${mem.memberId} to this consersation`;
            }

            let result = await axios({
                method: 'post',
                url: 'http://210.245.108.202:9000/api/message/SendMessage',
                data: {
                    dev: 'dev',
                    MessageID: '',
                    ConversationID: objectNewCon._id,
                    SenderID: senderId,
                    MessageType: 'notification',
                    Message: mess,
                    Emotion: '',
                    Quote: '',
                    Profile: '',
                    ListTag: '',
                    File: '',
                    ListMember: '',
                    IsOnline: [],
                    IsGroup: 1,
                    ConversationName: '',
                    DeleteTime: 0,
                    DeleteType: 0,
                },
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.message));
    }
};

//lay het cac nhom
export const getAllGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, getAllGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const senderId = Number(req.body.senderId) || null;
        if (!senderId) return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        const listCons = await Conversation.aggregate([{
            $match: {
                isGroup: 1,
                'memberList.memberId': senderId,
            },
        },
        {
            $project: {
                isGroup: 1,
                conversationId: '$_id',
                status: {
                    $toString: { $size: '$memberList' },
                },
                conversationName: {
                    $first: '$memberList.conversationName',
                },
                avatarConversation: 1,
            },
        },
        ]);
        const data = {
            result: true,
            message: null,
        };
        data['listCoversationInSearch'] = listCons;
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//dem so cuoc hoi thoai chua doc
export const GetCountConversationUnreader = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.ID) {
                console.log('Token hop le, GetCountConversationUnreader');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.ID);
        const getCountConversationUnreader = await Conversation.countDocuments({
            memberList: { $elemMatch: { memberId: userId, unReader: { $ne: 0 } } },
        });

        const data = {
            result: true,
        };
        data['total'] = getCountConversationUnreader;
        return res.send(getCountConversationUnreader.toString());
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//them hoi thoai bi mat
export const CreateNewSecretConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, CreateNewSecretConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/CreateNewSecretConversation',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        if (req.body && req.body.conversationId && req.body.userId && !isNaN(req.body.conversationId)) {
            let conversationId = Number(req.body.conversationId);
            let userId = Number(req.body.userId);
            let conversation = await Conversation.findOne({ _id: conversationId }, { 'memberList.memberId': 1, isGroup: 1, adminId: 1 }).lean();
            let typeGroup = req.body.typeGroup;
            if (conversation) {
                if (conversation.memberList.find((e) => e.memberId == userId)) {
                    if (conversation.isGroup == 0) {
                        await Conversation.updateOne({ _id: conversationId }, { typeGroup: typeGroup });
                        return res.send({
                            data: {
                                result: true,
                                message: 'Updated successfully',
                            },
                            error: null,
                        });
                    } else if (conversation.isGroup == 1) {
                        const deleteType = typeGroup === 'Secret' ? 1 : 0;
                        await Conversation.updateOne({ _id: conversationId }, { typeGroup: typeGroup, 'memberList.$[].deleteType': deleteType });
                        return res.send({
                            data: {
                                result: true,
                                message: 'Updated successfully',
                            },
                            error: null,
                        });
                    } else {
                        return res.send(createError(200, 'Invalid Type'));
                    }
                } else {
                    return res.send(createError(200, "Conversation don't contain user"));
                }
            } else {
                return res.send(createError(200, 'Invalid Conversation'));
            }
        }
        return res.send({ data, error: null });
    } catch (err) {
        if (err) {
            return res.send(createError(200, err.message));
        }
    }
};
//them thanh vien vao hoi thoai
export const AddNewMemberToGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, AddNewMemberToGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/AddNewMemberToGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const memberList = JSON.parse(req.body.memberList);
        const senderId = Number(req.body.senderId);
        const conversationId = Number(req.body.conversationId);
        const conversationName = req.body.conversationName;
        const query = {
            _id: conversationId,
            $and: [{ 'memberList.memberId': { $nin: memberList } }, { 'memberList.memberId': senderId }],
            isGroup: 1,
        };
        const memList = memberList.map(
            (e) =>
            (e = {
                memberId: e,
                conversationName: conversationName || '',
            })
        );
        const update = {
            $push: { memberList: { $each: memList } },
            $set: { timeLastChange: Date.now() },
        };
        const con = await Conversation.findOneAndUpdate(query, update);
        if (!con) return res.send(createError(200, 'Thêm thành viên vào nhóm thất bại'));
        const data = {
            result: true,
            message: 'Thêm thành viên vào nhóm thành công',
        };
        con.memberList = null;
        data['conversation_info'] = con;
        return res.send({ data, error: null });
    } catch (err) {
        if (err) {
            console.log(err);
            return res.send(createError(200, err.message));
        }
    }
};

//Xoa thanh vien cho duyet
export const DeleteBrowse = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, DeleteBrowse');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/DeleteBrowse',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId) || null;
        const memberList = JSON.parse(req.body.memberList) || null;
        if (conversationId == null || memberList == null) {
            return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        }
        const result = memberList.map((e) => {
            return (e = {
                memberBrowserId: e,
            });
        });
        const query = {
            _id: conversationId,
            'browseMemberList.memberBrowserId': { $all: memberList },
            isGroup: 1,
        };
        const exCon = await Conversation.findOne(query).lean();
        exCon.browseMemberList = exCon.browseMemberList.filter((e) => !memberList.includes(e.memberBrowseId));
        if (!exCon) {
            return res.send(createError(200, 'Xóa thành viên duyệt vào nhóm thất bại'));
        }
        await exCon.save();
        const data = {
            result: true,
            message: 'Xóa thành viên duyệt vào nhóm thành công',
        };
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        return res.send(createError(200, err.message));
    }
};

export const CheckReconnectInternet = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, CheckReconnectInternet');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId) || null;
        const lastTimeMess = req.body.lastTimeMess.split(' ')[0] || null;
        if (userId == null || lastTimeMess == null) {
            return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        }
        const listCons = await Users.aggregate([{
            $match: {
                _id: userId,
            },
        },
        {
            $lookup: {
                from: 'Conversations',
                localField: '_id',
                foreignField: 'memberList.memberId',
                as: 'conversations',
            },
        },
        {
            $project: {
                conversations: 1,
            },
        },
        {
            $unwind: {
                path: '$conversations',
            },
        },
        {
            $project: {
                conversationId: '$conversations._id',
                isGroup: '$conversations.isGroup',
                typeGroup: '$conversations.typeGroup',
                avatarConversation: '$conversations.avatarConversation',
                linkAvatar: '$conversations.avatarConversation',
                adminId: '$conversations.adminId',
                shareGroupFromLinkOption: '$conversations.shareGroupFromLinkOption',
                browseMemberOption: '$conversations.browseMemberOption',
                pinMessage: '$conversations.pinMessage',
                memberList: '$conversations.memberList',
                messageList: '$conversations.messageList',
                browseMemberList: '$conversations.browseMemberList',
                timeLastMessage: '$conversations.timeLastMessage',
                liveChat: '$conversations.liveChat',
                lastMess: {
                    $arrayElemAt: ['$conversations.messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$conversations.memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$conversations.messageList',
                },
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
                'messageList.0.createAt': {
                    $gte: new Date(lastTimeMess),
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: {
                    $size: '$memberList',
                },
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: 1,
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                        },
                    },
                },
            },
        },
        ]);
        if (listCons.length === 0) {
            return res.send(createError(200, 'User không có cuộc trò chuyện nào'));
        }
        const data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        const contact = await RequestContact.find({
            $or: [{ contactId: userId }, { userId: userId }],
        })
            .select(['userId', 'contactId', 'status'])
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                const relationShip = contact.find((e) => {
                    if (
                        (e.userId === userId && e.contactId === user.memberId) ||
                        (e.contactId === userId && e.userId === user.memberId)
                    )
                        return true;
                });
                e['friendStatus'] = relationShip ? relationShip.status : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');

                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName = users[0] ? users[0].conversationName : users[0].userName;
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0].conversationName ||
                    owner
                        .map((e) => (e = e.userName))
                        .slice(-2)
                        .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName ||
                    users
                        .map((e) => (e = e.userName))
                        .slice(-3)
                        .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName || owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
        }
        data['listCoversation'] = listCons;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

export const ReadAllMessage = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, ReadAllMessage');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId);
        const query = {
            memberList: { $elemMatch: { memberId: userId, unReader: { $ne: 0 } } },
        };
        const update = {
            $set: { 'memberList.$.unReader': 0 },
        };
        const readMessage = await Conversation.updateMany(query, update);
        if (readMessage.matchedCount === 0) {
            return res.send(createError(200, 'User không có cuộc trò chuyện chưa đọc nào'));
        }
        const data = {
            resutl: true,
            message: 'đọc tất cả tin nhắn thành công',
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//Lay thong tin live chat
export const GetInfoLiveChat = async (req, res) => {
    try {
        const clientId = req.body.clientId;
        const fromWeb = req.body.fromWeb;
        const contactId = Number(req.body.contactId);
        if (clientId == null || fromWeb == null || contactId == null) {
            return res.send(createError(200, 'Thiêu thông tin truyền lên'));
        }
        const pipeline = [{
            $match: {
                _id: contactId,
            },
        },
        {
            $lookup: {
                from: 'Conversations',
                localField: '_id',
                foreignField: 'memberList.memberId',
                as: 'conversations',
            },
        },
        {
            $project: {
                conversations: 1,
            },
        },
        {
            $unwind: {
                path: '$conversations',
            },
        },
        {
            $project: {
                conversationId: '$conversations._id',
                isGroup: '$conversations.isGroup',
                typeGroup: '$conversations.typeGroup',
                avatarConversation: '$conversations.avatarConversation',
                linkAvatar: '$conversations.avatarConversation',
                adminId: '$conversations.adminId',
                shareGroupFromLinkOption: '$conversations.shareGroupFromLinkOption',
                browseMemberOption: '$conversations.browseMemberOption',
                pinMessage: '$conversations.pinMessage',
                memberList: '$conversations.memberList',
                messageList: '$conversations.messageList',
                browseMemberList: '$conversations.browseMemberList',
                timeLastMessage: '$conversations.timeLastMessage',
                liveChat: '$conversations.liveChat',
                lastMess: {
                    $arrayElemAt: ['$conversations.messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$conversations.memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', contactId],
                        },
                    },
                },
                countMessage: {
                    $size: '$conversations.messageList',
                },
            },
        },
        {
            $match: {
                $and: [{
                    typeGroup: 'liveChat',
                },
                {
                    memberList: {
                        $elemMatch: {
                            'liveChat.clientId': clientId,
                            'liveChat.fromWeb': fromWeb,
                        },
                    },
                },
                ],
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    memberId: 1,
                    conversationName: 1,
                    unReader: 1,
                    messageDisplay: 1,
                    isHidden: 1,
                    isFavorite: 1,
                    notification: 1,
                    timeLastSeener: {
                        $dateToString: {
                            date: '$timeLastSeener',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    deleteTime: 1,
                    deleteType: 1,
                    favoriteMessage: 1,
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
            },
        },
        ];
        const listCons = await Users.aggregate(pipeline);

        if (!listCons.length) {
            return res.send(createError(200, 'Người dùng chưa có cuộc trò chuyện'));
        }
        const contact = await RequestContact.find({
            $or: [{ contactId: contactId }, { userId: contactId }],
        })
            .select(['userId', 'contactId', 'status'])
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                const relationShip = contact.find((e) => {
                    if (
                        (e.userId === contactId && e.contactId === user.memberId) ||
                        (e.contactId === contactId && e.userId === user.memberId)
                    )
                        return true;
                });
                e['friendStatus'] = relationShip ? relationShip.status : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');

                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== contactId);
            const owner = newDataMember.filter((mem) => mem._id === contactId);
            let conversationName = owner[0].userName;
            let avatarConversation;
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName = users[0] ? users[0].conversationName : users[0].userName;
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0].conversationName ||
                    owner
                        .map((e) => (e = e.userName))
                        .slice(-2)
                        .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName ||
                    users
                        .map((e) => (e = e.userName))
                        .slice(-3)
                        .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName || owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
        }
        const data = {
            result: true,
            message: 'Lấy thông tin cuộc trò chuyện thành công',
        };
        data['conversation_info'] = listCons[0];
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

//Thay doi anh dai dien nhom
export const ChangeAvatarGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, ChangeAvatarGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ChangeAvatarGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const avatarConversation = req.body.avatarConversation;
        if (conversationId == null || avatarConversation == null) {
            return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        }
        if (!avatarConversation.endsWith('jpg')) {
            return res.send(createError(200, 'Định dạng ảnh không đúng'));
        }
        const con = await Conversation.findOneAndUpdate({
            _id: conversationId,
        }, {
            avatarConversation: avatarConversation,
        });
        if (!con) {
            return res.send(createError(200, 'Thay đổi ảnh nhóm thất bại'));
        }
        const data = {
            result: true,
            message: 'Thay đổi ảnh nhóm thành công',
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.mesesage));
    }
};

//Thay nick name
export const ChangeNickName = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.adminId) {
                console.log('Token hop le, ChangeNickName');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ChangeNickName',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);
        const adminId = Number(req.body.adminId);
        const conversationName = req.body.conversationName;
        if (conversationId == null || adminId == null || conversationName == null) {
            return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        }
        const query = {
            _id: conversationId,
            memberList: { $elemMatch: { memberId: adminId } },
        };
        const update = {
            'memberList.$.conversationName': conversationName,
        };
        const con = await Conversation.findOneAndUpdate(query, update);
        if (!con) {
            return res.send(createError(200, 'Thay đổi biệt hiệu thất bại'));
        }
        const data = {
            result: true,
            message: 'Thay đổi biệt hiệu thành công',
        };
        return res.send({ data, error: null });
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

export const GetListConversationFavoriteOrder = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversationFavoriteOrder');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId);
        const countConversation = Number(req.body.countConversation);
        let countConversationLoad = Number(req.body.countConversationLoad);
        let keyword = req.body.keyword || null;
        let listCons = await Users.aggregate([{
            $match: {
                _id: userId,
            },
        },
        {
            $lookup: {
                from: 'Conversations',
                localField: '_id',
                foreignField: 'memberList.memberId',
                as: 'conversations',
            },
        },
        {
            $project: {
                conversations: 1,
            },
        },
        {
            $unwind: {
                path: '$conversations',
            },
        },
        {
            $project: {
                conversationId: '$conversations._id',
                avatarConversation: '$conversations.avatarConversation',
                linkAvatar: '$conversations.avatarConversation',
                memberList: '$conversations.memberList',
                messageList: '$conversations.messageList',
                isGroup: '$conversations.isGroup',
                sender: {
                    $filter: {
                        input: '$conversations.memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                memberList: 1,
                messageList: 1,
                isFavorite: '$sender.isFavorite',
                isGroup: 1,
                sender: 1,
            },
        },
        {
            $sort: {
                isFavorite: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                memberList: {
                    memberId: 1,
                    conversationName: 1,
                },
                isFavorite: 1,
                isGroup: 1,
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            type365: '$$member.type',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                name: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $ne: ['$$mem.memberId', userId],
                        },
                    },
                },
                name1: {
                    $filter: {
                        input: '$listMember',
                        as: 'mem',
                        cond: {
                            $ne: ['$$mem._id', userId],
                        },
                    },
                },
                isGroup: 1,
                sender: 1,
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                isGroup: 1,
                memberList: 1,
                isFavorite: 1,
                listMember: 1,
                name: {
                    $arrayElemAt: ['$name', 0],
                },
                name1: {
                    $arrayElemAt: ['$name1', 0],
                },
                sender: 1,
            },
        },
        {
            $project: {
                conversationId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                isGroup: 1,
                memberList: 1,
                isFavorite: 1,
                listMember: 1,
                name: {
                    conversationName: 1,
                },
                name1: {
                    userName: 1,
                },
                name3: 'Chỉ mình bạn',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                memberList: 1,
                isFavorite: 1,
                listMember: 1,
                conversationName: {
                    $cond: [{
                        $ne: ['$name.conversationName', ''],
                    },
                        '$name.conversationName',
                        '$name1.userName',
                    ],
                },
            },
        },
        {
            $match: {
                conversationName: {
                    $in: keyword ? [new RegExp(`.*${keyword}.*`, 'i')] : [new RegExp('.*.*', 'i')],
                },
            },
        },
        {
            $skip: countConversationLoad,
        },
        {
            $limit: 20,
        },
        ]);
        // const listOpponent = await Conversation.aggregate([
        //   {
        //     '$match': {
        //       'memberList.memberId': userId,
        //       'memberList': {
        //         '$size': 2
        //       },
        //       'isGroup': 0
        //     }
        //   }, {
        //     '$project': {
        //       'opponentId': {
        //         '$filter': {
        //           'input': '$memberList',
        //           'as': 'mem',
        //           'cond': {
        //             '$ne': [
        //               '$$mem.memberId', userId
        //             ]
        //           }
        //         }
        //       }
        //     }
        //   }, {
        //     '$unwind': {
        //       'path': '$opponentId'
        //     }
        //   }, {
        //     '$project': {
        //       '_id': 0,
        //       'opponentId': '$opponentId.memberId'
        //     }
        //   }, {
        //     '$group': {
        //       '_id': null,
        //       'listOpponent': {
        //         '$push': '$opponentId'
        //       }
        //     }
        //   }
        // ])

        const data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                e.linkAvatar = e.avatarUser;
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            let avatarConversation;
            if (!con.isGroup && users[0]) {
                avatarConversation = users[0].avatarUser ?
                    `${urlImgHost()}avatarUser/${users[0]._id}/${users[0].avatarUser}` :
                    `${urlImgHost()}avatar/${users[0].userName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            if (con.isGroup) {
                avatarConversation = con.avatarConversation ?
                    `${urlImgHost()}avatarGroup/${con.conversationId}/${con.avatarConversation}` :
                    `${urlImgHost()}avatar/${con.conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
            delete listCons[index]['listMember'];
        }
        // if (lengthListCons < 20) {
        //   let skipGuest = lengthListCons > 0 ? 0 : countConversationLoad - lengthListCons
        //   let limitGuest = lengthListCons > 0 ? (20 - lengthListCons) : 20
        //   const listGuest = await User.aggregate([
        //     {
        //       '$match': {
        //         '_id': {
        //           '$nin': [...listOpponent[0].listOpponent, userId]
        //         },
        //         companyId: 3312
        //       }
        //     }, {
        //       '$project': {
        //         'conversationId': null,
        //         'conversationName': '$userName',
        //         'avatarConversation': '$avatarUser',
        //         'linkAvatar': '',
        //         'isGroup': null,
        //         'isFavorite': null
        //       }
        //     }, {
        //       '$skip': skipGuest
        //     }, {
        //       '$limit': limitGuest
        //     }
        //   ])
        //   console.log(listGuest);
        //   const mapListGuest = listGuest.map(e => {
        //     e.avatarConversation = e.avatarConversation
        //     ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarConversation}`
        //     : `${urlImgHost()}avatar/${e.conversationName
        //         .substring(0, 1)
        //         .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
        //         e.linkAvatar = e.avatarConversation
        //     return e = {...e}
        //   })
        //   console.log(mapListGuest);
        //   listCons = [...listCons, ...mapListGuest]
        // }
        data['listCoversation'] = listCons;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};
export const DeleteLiveChat = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, DeleteLiveChat');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/DeleteLiveChat',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const time = req.body.time || null;
        const data = {
            result: true,
            message: 'Xoá live chat thành công',
        };
        if (!time) {
            await Conversation.deleteMany({ typeGroup: 'liveChat' });
            return res.send({ data, error: null });
        }
        const query = {
            typeGroup: 'liveChat',
            createdAt: {
                $lt: new Date(time),
            },
        };
        const result = await Conversation.deleteMany(query);
        if (result.deletedCount === 0) {
            return res.send(createError(200, 'Không có cuộc hội thoại nào để xoá'));
        }
        return res.send({ data, error: null });
    } catch (err) {
        if (err) console.log(err);
        return res.send(createError(200, err.message));
    }
};

const CheckTimeMessage = (message, clientId) => {
    try {
        if (message.senderId != clientId) {
            return true;
        } else {
            let now = new Date();
            let milisnow = now.getTime();
            let timeCheck = new Date(milisnow - 1000 * 60 * 10);
            let timeSendMess = new Date(message.createAt);
            if (timeCheck > timeSendMess) {
                return false;
            } else {
                return true;
            }
        }
    } catch (e) {
        console.log(e);
        return false;
    }
};

const AddFriend = async (userId, contactId) => {
    try {
        let checkContact = await Contact.find({
            $or: [
                { userFist: Number(userId), userSecond: Number(contactId) },
                { userFist: Number(contactId), userSecond: Number(userId) },
            ],
        })
            .limit(1)
            .lean();
        if (Number(checkContact.length) === 0) {
            let newContact = new Contact({
                userFist: userId,
                userSecond: contactId,
            });
            await newContact.save();
            return true;
        }
    } catch (e) {
        console.log('Error when add friend createNewLivwChat', e);
        return false;
    }
};

// export const CreateConverLive = async (req, res) => {
//   const bigestId = (await Conversation.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1))[0]._id;
//   const conv = await Conversation.create({
//     _id: bigestId + 1,
//     isGroup: 1,
//     adminId: contactId,
//     typeGroup: "liveChatV2",
//     memberList: [],
//     messageList: listMes,
//     browseMemberList: [],
//     createdAt: new Date(),
//     timeLastChange: Date.now()
//   })
// }

export const CreateNewLiveChat = async (req, res) => {
    try {
        if (
            req.body &&
            req.body.clientId &&
            req.body.contactId &&
            !isNaN(req.body.contactId) &&
            req.body.conversationName &&
            req.body.fromWeb &&
            req.body.fromConversation
        ) {
            let conversationId;
            if (req.body.dev === 'dev') {
                if (req.body.conversationId) {
                    conversationId = Number(req.body.conversationId);
                }
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                const response = await axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/CreateNewLiveChat',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                console.log('liveChat', response.data);
                if (response.data.data.conversation_info.conversationId) {
                    conversationId = Number(response.data.data.conversation_info.conversationId);
                    console.log(conversationId);
                }
            }

            const senderId = Number(req.body.senderId);
            const clientId = String(req.body.clientId);
            const clientName = String(req.body.clientName);
            const contactId = Number(req.body.contactId);
            let conversationName = String(req.body.conversationName);
            const fromWeb = String(req.body.fromWeb);
            const fromConversation = Number(req.body.fromConversation);
            if (isNaN(clientId)) {
                if (String(clientId).split('_')[String(clientId).split('_').length - 1] == 'liveChatV2') {
                    conversationName = `${conversationName}_${contactId}`;
                    let contactId2 = Number(String(clientId).split('_')[0]);
                    const bigestId = (await Conversation.find().sort({ _id: -1 }).select('_id').limit(1))[0]._id;

                    // add friend
                    AddFriend(contactId, contactId2);

                    let existConversation = await Conversation.findOne({
                        $and: [{ 'memberList.memberId': { $eq: contactId2 } }],
                        isGroup: 1,
                        typeGroup: 'liveChatV2',
                    }, { memberList: 1 }).lean();

                    if (existConversation && existConversation._id) {
                        Conversation.updateOne({ _id: existConversation._id }, { $set: { timeLastChange: new Date() } }).catch((e) => {
                            console.log('CreateNewConversation error', e);
                        });
                        // logic && is not perfect
                        if (String(req.body.Status) == '0') {
                            if (
                                existConversation.memberList &&
                                existConversation.memberList.length &&
                                existConversation.memberList.length > 1 &&
                                !existConversation.memberList.find((e) => e.memberId == contactId)
                            ) {
                                // check again
                                let CheckExistConversation = await Conversation.findOne({
                                    $and: [
                                        { 'memberList.memberId': { $eq: contactId2 } },
                                        { 'memberList.memberId': { $eq: contactId } },
                                    ],
                                    isGroup: 1,
                                    typeGroup: 'liveChatV2',
                                }, { _id: 1 }).lean();
                                console.log('check livechat', CheckExistConversation);
                                if (CheckExistConversation && CheckExistConversation._id) {
                                    Conversation.updateOne({ _id: CheckExistConversation._id }, { $set: { 'memberList.$[elem].conversationName': conversationName } }, { arrayFilters: [{ 'elem.isHidden': 0 }], multi: true }).catch((e) => {
                                        console.log('error when update conversationName CreateNewLiveChat', e);
                                    });
                                    let message = await FLoadMessage({
                                        body: {
                                            conversationId: CheckExistConversation._id,
                                            countConversation: 20,
                                        },
                                    });
                                    let dataConv = await FGetConversation({
                                        body: {
                                            senderId: contactId,
                                            conversationId: CheckExistConversation._id,
                                        },
                                    });
                                    if (dataConv && dataConv.data && dataConv.data.conversation_info) {
                                        res.status(200).json({
                                            data: {
                                                result: true,
                                                message: 'Tạo nhóm thành công',
                                                conversation: null,
                                                countConversation: 0,
                                                conversation_info: dataConv.data.conversation_info,
                                                listMessages: message,
                                            },
                                            error: null,
                                        });
                                        // socket.emit("AddNewConversation", CheckExistConversation._id, [contactId2, contactId], [contactId2], [contactId2, contactId], fromWeb);
                                    } else {
                                        res.send(createError(200, 'Lay cuộc trò chuyện không thành công'));
                                    }
                                } else {
                                    // create newConversation
                                    let listMes = [];
                                    const newConversation1 = new Conversation({
                                        _id: conversationId || bigestId + 1,
                                        isGroup: 1,
                                        adminId: contactId,
                                        typeGroup: 'liveChatV2',
                                        memberList: [],
                                        messageList: listMes,
                                        browseMemberList: [],
                                        createdAt: new Date(),
                                        timeLastChange: Date.now(),
                                    });
                                    let arrayUser = [{
                                        memberId: contactId2,
                                        notification: 1,
                                        conversationName: conversationName,
                                        liveChat: {
                                            clientId: contactId2,
                                            fromConversation: fromConversation,
                                            fromWeb: req.body.fromWeb || 'timviec365',
                                        },
                                    },
                                    {
                                        memberId: contactId,
                                        notification: 1,
                                        conversationName: conversationName,
                                    },
                                    ];
                                    const newConversation = await newConversation1.save();
                                    Conversation.findOneAndUpdate({ _id: newConversation._id }, {
                                        $push: {
                                            memberList: {
                                                $each: arrayUser,
                                            },
                                        },
                                        $set: {
                                            timeLastChange: Date.now(),
                                        },
                                    }).catch((e) => {
                                        console.log('update conversation, createNewLiveChat', e);
                                    });
                                    Counter.findOneAndUpdate({ name: 'ConversationID' }, { countID: newConversation._id }).catch((e) => {
                                        console.log('Update Counter CreateNewLiveChat', e);
                                    });
                                    if (newConversation && newConversation._id) {
                                        // socket.emit("AddNewConversationForClient", newConversation._id, [contactId2]);
                                        let message = await FLoadMessage({
                                            body: {
                                                conversationId: newConversation._id,
                                                countConversation: 20,
                                            },
                                        });
                                        let dataConv = await FGetConversation({
                                            body: {
                                                senderId: contactId,
                                                conversationId: newConversation._id,
                                            },
                                        });
                                        if (dataConv && dataConv.data && dataConv.data.conversation_info) {
                                            if (dataConv.data.conversation_info.listMember.length > 2) {
                                                Conversation.deleteOne({
                                                    _id: Number(dataConv.data.conversation_info.conversationId),
                                                }).catch((e) => {
                                                    console.log('Error delete Conv');
                                                });
                                                return res.send(createError(201, 'Khách hàng đã được hỗ trợ'));
                                            } else {
                                                res.status(200).json({
                                                    data: {
                                                        result: true,
                                                        message: 'Tạo nhóm thành công',
                                                        conversation: null,
                                                        countConversation: 0,
                                                        conversation_info: dataConv.data.conversation_info,
                                                        listMessages: message,
                                                    },
                                                    error: null,
                                                });
                                                // socket.emit("AddNewConversation", newConversation._id, [contactId2, contactId], [contactId2], [contactId2, contactId], fromWeb);
                                            }
                                        } else {
                                            res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                                        }
                                    } else {
                                        res.send(
                                            createError(
                                                200,
                                                'another supported this client, you can create an other conversation but failed'
                                            )
                                        );
                                    }
                                }
                            } else {
                                // client is supported by other
                                if (
                                    existConversation.memberList.length > 1 &&
                                    !existConversation.memberList.find((e) => e.memberId == contactId)
                                ) {
                                    return res.send(createError(201, 'Khách hàng đã được hỗ trợ'));
                                }
                                // exist but client is not supported
                                else {
                                    if (!existConversation.memberList.find((e) => e.memberId == contactId)) {
                                        let arrayUser = [{
                                            memberId: contactId,
                                            notification: 1,
                                            conversationName: conversationName,
                                        },];
                                        await Conversation.updateOne({ _id: existConversation._id }, {
                                            $push: {
                                                memberList: {
                                                    $each: arrayUser,
                                                },
                                            },
                                        });
                                    }
                                    let dataConv = await FGetConversation({
                                        body: {
                                            senderId: contactId,
                                            conversationId: existConversation._id,
                                        },
                                    });
                                    let message = await FLoadMessage({
                                        body: {
                                            conversationId: existConversation._id,
                                            countConversation: 20,
                                        },
                                    });
                                    if (dataConv && dataConv.data && dataConv.data.conversation_info) {
                                        if (dataConv.data.conversation_info.listMember.length > 2) {
                                            Conversation.deleteOne({
                                                _id: Number(dataConv.data.conversation_info.conversationId),
                                            }).catch((e) => {
                                                console.log('Error delete Conv');
                                            });
                                            return res.send(createError(201, 'Khách hàng đã được hỗ trợ'));
                                        }
                                        // socket.emit("AddNewConversationForClient", existConversation._id, [contactId2]);
                                        res.status(200).json({
                                            data: {
                                                result: true,
                                                message: 'Tạo nhóm thành công',
                                                conversation: null,
                                                countConversation: 0,
                                                conversation_info: dataConv.data.conversation_info,
                                                listMessages: message,
                                            },
                                            error: null,
                                        });
                                        // socket.emit("AddNewConversation", existConversation._id, [contactId2, contactId], [contactId2], [contactId2, contactId], fromWeb);
                                    } else {
                                        console.log('data cuoc tro chuyen', dataConv.data, existConversation._id);
                                        res.send(
                                            createError(
                                                200,
                                                'You are supporting this customer, but cannot take dataConversation'
                                            )
                                        );
                                    }
                                }
                            }
                        } else if (String(req.body.Status) == '2') {
                            // socket.emit('OutGroup', existConversation._id, contactId, 0, [contactId, contactId2]);
                            Conversation.updateOne({ _id: existConversation._id }, {
                                $pull: {
                                    memberList: {
                                        memberId: { $ne: contactId2 },
                                    },
                                },
                            }).catch((e) => {
                                console.log('error when pull user', e);
                            });

                            let arrayUser = [{
                                memberId: contactId,
                                notification: 1,
                                conversationName: conversationName,
                            },];
                            Conversation.findOneAndUpdate({ _id: existConversation._id }, {
                                $push: {
                                    memberList: {
                                        $each: arrayUser,
                                    },
                                },
                            }).catch((e) => {
                                console.log('Error update Conversation CreateNewLiveChat', e);
                            });
                            let takeMess = await Conversation.aggregate([{
                                $match: {
                                    _id: fromConversation,
                                },
                            },
                            {
                                $project: {
                                    messageList: {
                                        $filter: {
                                            input: '$messageList',
                                            as: 'messagelist',
                                            cond: {
                                                $and: [{
                                                    $eq: ['$$messagelist.liveChat.clientId', clientId],
                                                },
                                                { $eq: ['$$messagelist.infoSupport.status', 0] }, // nhỏ hơn hiện tại và là tin nhắn cuối
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                            ]);

                            let arr_message_id = [];
                            for (let i = 0; i < takeMess[0].messageList.length; i++) {
                                arr_message_id.push(takeMess[0].messageList[i]._id);
                            }
                            Conversation.updateOne({ _id: Number(fromConversation) }, { $pull: { messageList: { _id: { $in: arr_message_id } } } }).catch((e) => {
                                console.log(e);
                            });

                            let listMes = [];
                            if (takeMess.length > 0) {
                                for (let i = 0; i < takeMess[0].messageList.length; i++) {
                                    let obj = {};
                                    if (takeMess[0].messageList[i]._id) {
                                        obj._id = takeMess[0].messageList[i]._id;
                                        obj.displayMessage = takeMess[0].messageList[i].displayMessage || 0;
                                        obj.senderId = contactId2;
                                        obj.messageType = takeMess[0].messageList[i].messageType || 'text';
                                        obj.message = takeMess[0].messageList[i].message || '';
                                        obj.quoteMessage = takeMess[0].messageList[i].quoteMessage || '';
                                        obj.messageQuote = takeMess[0].messageList[i].messageQuote || '';
                                        obj.createAt = takeMess[0].messageList[i].createAt || new Date();
                                        obj.isEdited = takeMess[0].messageList[i].isEdited || 0;
                                        obj.infoLink = takeMess[0].messageList[i].infoLink || null;
                                        obj.listFile = takeMess[0].messageList[i].listFile || [];
                                        obj.emotion = takeMess[0].messageList[i].emotion || {
                                            Emotion1: '',
                                            Emotion2: '',
                                            Emotion3: '',
                                            Emotion4: '',
                                            Emotion5: '',
                                            Emotion6: '',
                                            Emotion7: '',
                                            Emotion8: '',
                                        };
                                        obj.deleteTime = takeMess[0].messageList[i].deleteTime || 0;
                                        obj.deleteType = takeMess[0].messageList[i].deleteType || 0;
                                        obj.deleteDate =
                                            takeMess[0].messageList[i].deleteDate ||
                                            new Date('0001-01-01T00:00:00.000+00:00');
                                        obj.notiClicked = takeMess[0].messageList[i].notiClicked || {};
                                        obj.infoSupport = null;
                                        obj.liveChat = null;
                                        listMes.push(obj);
                                    }
                                }
                                Conversation.findOneAndUpdate({ _id: existConversation._id }, {
                                    $push: {
                                        messageList: {
                                            $each: listMes,
                                        },
                                    },
                                }).catch((e) => {
                                    console.log(e);
                                });
                            }

                            Conversation.updateOne({ _id: existConversation._id }, { $set: { 'memberList.$[elem].conversationName': conversationName } }, { arrayFilters: [{ 'elem.isHidden': 0 }], multi: true }).catch((e) => {
                                console.log('Error update Conversation Name CreateNewLiveChat', e);
                            });
                            let message = await FLoadMessage({
                                body: {
                                    adminId: contactId2,
                                    conversationId: existConversation._id,
                                    countMessage: 0,
                                    listMess: 0,
                                    messageDisplay: 0,
                                },
                            });
                            let dataConv = await FGetConversation({
                                body: {
                                    senderId: contactId,
                                    conversationId: existConversation._id,
                                },
                            });
                            if (dataConv && dataConv.data && dataConv.data.conversation_info) {
                                // socket.emit("AddNewConversationForClient", existConversation._id, [contactId2]);
                                res.status(200).json({
                                    data: {
                                        result: true,
                                        message: 'Tạo nhóm thành công',
                                        conversation: null,
                                        countConversation: 0,
                                        conversation_info: dataConv.data.conversation_info,
                                        listMessages: message,
                                    },
                                    error: null,
                                });
                                // socket.emit("AddNewConversation", existConversation._id, [contactId2, contactId], [clientId], [senderId, contactId], fromWeb);
                            } else {
                                res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                            }
                        }
                    } else {
                        let listMes = [];
                        const newConversation1 = new Conversation({
                            _id: conversationId || bigestId + 1,
                            isGroup: 1,
                            adminId: contactId,
                            typeGroup: 'liveChatV2',
                            memberList: [],
                            messageList: listMes,
                            browseMemberList: [],
                            createdAt: new Date(),
                        });
                        let arrayUser = [{
                            memberId: contactId2,
                            notification: 1,
                            conversationName: conversationName,
                            liveChat: {
                                clientId: contactId2,
                                fromConversation: fromConversation,
                                fromWeb: req.body.fromWeb || 'timviec365',
                            },
                        },
                        {
                            memberId: contactId,
                            notification: 1,
                            conversationName: conversationName,
                        },
                        ];

                        const newConversation = await newConversation1.save();
                        await Conversation.findOneAndUpdate({ _id: newConversation._id }, {
                            $push: {
                                memberList: {
                                    $each: arrayUser,
                                },
                            },
                        });

                        // delete message
                        Conversation.aggregate([{
                            $match: {
                                _id: fromConversation,
                            },
                        },
                        {
                            $project: {
                                messageList: {
                                    $filter: {
                                        input: '$messageList',
                                        as: 'messagelist',
                                        cond: {
                                            $and: [{
                                                $eq: ['$$messagelist.liveChat.clientId', clientId],
                                            },
                                            { $eq: ['$$messagelist.infoSupport.status', 0] }, // nhỏ hơn hiện tại và là tin nhắn cuối
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        ])
                            .then((takeMess) => {
                                let arr_message_id = [];
                                for (let i = 0; i < takeMess[0].messageList.length; i++) {
                                    arr_message_id.push(takeMess[0].messageList[i]._id);
                                }
                                Conversation.updateOne({ _id: Number(fromConversation) }, { $pull: { messageList: { _id: { $in: arr_message_id } } } }).catch((e) => {
                                    console.log(e);
                                });
                            })
                            .catch((err) => {
                                console.log(err, 'delete message liveChat');
                            });

                        Counter.findOneAndUpdate({ name: 'ConversationID' }, { countID: newConversation._id }).catch(
                            (e) => {
                                console.log('error when update counter createNewLiveChat', e);
                            }
                        );
                        if (newConversation && newConversation._id) {
                            // socket.emit("AddNewConversationForClient", newConversation._id, [contactId2]);
                            let message = await FLoadMessage({
                                body: {
                                    conversationId: newConversation._id,
                                    countConversation: 20,
                                },
                            });
                            let dataConv = await FGetConversation({
                                body: {
                                    senderId: contactId,
                                    conversationId: newConversation._id,
                                },
                            });
                            if (dataConv && dataConv.data && dataConv.data.conversation_info) {
                                res.status(200).json({
                                    data: {
                                        result: true,
                                        message: 'Tạo nhóm thành công',
                                        conversation: null,
                                        countConversation: 0,
                                        conversation_info: dataConv.data.conversation_info,
                                        listMessages: message,
                                    },
                                    error: null,
                                });
                                // socket.emit("AddNewConversation", newConversation._id, [contactId2, contactId], [contactId2], [contactId2, contactId], fromWeb);
                            } else {
                                res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                            }
                        } else {
                            res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                        }
                    }
                } else {
                    console.log('test');
                    const bigestId = (await Conversation.find().sort({ _id: -1 }).select('_id').limit(1).lean())[0]._id;
                    const existConversation = await Conversation.findOne({
                        $and: [
                            { 'memberList.memberId': { $eq: senderId } },
                            { 'memberList.liveChat.clientId': { $eq: clientId } },
                        ],
                        isGroup: 1,
                        typeGroup: 'liveChat',
                    });
                    if (existConversation && existConversation._id) {
                        Conversation.updateOne({ _id: existConversation._id }, { $set: { timeLastChange: new Date() } }).catch((e) => {
                            console.log('CreateNewConversation error', e);
                        });
                        if (
                            existConversation.memberList &&
                            existConversation.memberList.length &&
                            existConversation.memberList.length > 1 &&
                            !existConversation.memberList.find((e) => e.memberId == contactId)
                        ) {
                            return res.send(createError(201, 'Khách hàng đã được hỗ trợ'));
                        }
                        let arrayUser = [{
                            memberId: contactId,
                            notification: 1,
                            conversationName: conversationName,
                        },];
                        await Conversation.findOneAndUpdate({ _id: existConversation._id }, {
                            $pull: {
                                memberList: {
                                    memberId: contactId,
                                },
                            },
                        });
                        await Conversation.findOneAndUpdate({ _id: existConversation._id }, {
                            $push: {
                                memberList: {
                                    $each: arrayUser,
                                },
                            },
                        });
                        let takeMess = await Conversation.aggregate([{
                            $match: {
                                _id: fromConversation,
                            },
                        },
                        {
                            $project: {
                                messageList: {
                                    $filter: {
                                        input: '$messageList',
                                        as: 'messagelist',
                                        cond: {
                                            $and: [{
                                                $eq: ['$$messagelist.liveChat.clientId', clientId],
                                            },
                                            { $eq: ['$$messagelist.infoSupport.status', 0] }, // nhỏ hơn hiện tại và là tin nhắn cuối
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        ]);
                        let arr_message_id = [];
                        for (let i = 0; i < takeMess[0].messageList.length; i++) {
                            arr_message_id.push(takeMess[0].messageList[i]._id);
                        }
                        let listMes = [];
                        if (takeMess.length > 0) {
                            for (let i = 0; i < takeMess[0].messageList.length; i++) {
                                let obj = {};
                                if (takeMess[0].messageList[i]._id) {
                                    obj._id = takeMess[0].messageList[i]._id;
                                    obj.displayMessage = takeMess[0].messageList[i].displayMessage || 0;
                                    obj.senderId = takeMess[0].messageList[i].senderId || 0;
                                    obj.messageType = takeMess[0].messageList[i].messageType || 'text';
                                    obj.message = takeMess[0].messageList[i].message || '';
                                    obj.quoteMessage = takeMess[0].messageList[i].quoteMessage || '';
                                    obj.messageQuote = takeMess[0].messageList[i].messageQuote || '';
                                    obj.createAt = takeMess[0].messageList[i].createAt || new Date();
                                    obj.isEdited = takeMess[0].messageList[i].isEdited || 0;
                                    obj.infoLink = takeMess[0].messageList[i].infoLink || null;
                                    obj.listFile = takeMess[0].messageList[i].listFile || [];
                                    obj.emotion = takeMess[0].messageList[i].emotion || {
                                        Emotion1: '',
                                        Emotion2: '',
                                        Emotion3: '',
                                        Emotion4: '',
                                        Emotion5: '',
                                        Emotion6: '',
                                        Emotion7: '',
                                        Emotion8: '',
                                    };
                                    obj.deleteTime = takeMess[0].messageList[i].deleteTime || 0;
                                    obj.deleteType = takeMess[0].messageList[i].deleteType || 0;
                                    obj.deleteDate =
                                        takeMess[0].messageList[i].deleteDate ||
                                        new Date('0001-01-01T00:00:00.000+00:00');
                                    obj.notiClicked = takeMess[0].messageList[i].notiClicked || {};
                                    obj.infoSupport = null;
                                    obj.liveChat = null;
                                    listMes.push(obj);
                                }
                            }
                            let update2 = await Conversation.findOneAndUpdate({ _id: existConversation._id }, {
                                $push: {
                                    messageList: {
                                        $each: listMes,
                                    },
                                },
                            });
                        }
                        // let dataConv = await axios({
                        //   method: "post",
                        //   url: "http://43.239.223.142:9000/api/conversations/GetConversation",
                        //   data: {
                        //     senderId:contactId,
                        //     conversationId:existConversation._id
                        //   },
                        //   headers: { "Content-Type": "multipart/form-data" }
                        // })
                        let dataConv = await FGetConversation({
                            body: {
                                senderId: contactId,
                                conversationId: existConversation._id,
                            },
                        });
                        // let message = await axios({
                        //   method: "post",
                        //   url: "http://43.239.223.142:9000/api/message/loadMessage",
                        //   data: {

                        //     conversationId:existConversation._id,
                        //     countConversation: 20
                        //   },
                        //   headers: { "Content-Type": "multipart/form-data" }
                        // })
                        let message = await FLoadMessage({
                            body: {
                                conversationId: existConversation._id,
                                countConversation: 20,
                            },
                        });
                        if (dataConv && dataConv.data && dataConv.data.conversation_info) {
                            // socket.emit("AddNewConversation",existConversation._id,[senderId,contactId],[clientId],[senderId,contactId],fromWeb);
                            res.status(200).json({
                                data: {
                                    result: true,
                                    message: 'Tạo nhóm thành công',
                                    conversation: null,
                                    countConversation: 0,
                                    conversation_info: dataConv.data.conversation_info,
                                    listMessages: message,
                                },
                                error: null,
                            });
                            // socket.emit("AddNewConversationForClient", existConversation._id, [senderId, contactId], clientId);
                        } else {
                            res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                        }
                    } else {
                        let takeMess = await Conversation.aggregate([{
                            $match: {
                                _id: fromConversation,
                            },
                        },
                        {
                            $project: {
                                messageList: {
                                    $filter: {
                                        input: '$messageList',
                                        as: 'messagelist',
                                        cond: {
                                            $and: [{
                                                $eq: ['$$messagelist.liveChat.clientId', clientId],
                                            },
                                            { $eq: ['$$messagelist.infoSupport.status', 0] }, // nhỏ hơn hiện tại và là tin nhắn cuối
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        ]);
                        let listMes = [];
                        if (takeMess.length > 0) {
                            for (let i = 0; i < takeMess[0].messageList.length; i++) {
                                let obj = {};
                                if (takeMess[0].messageList[i]._id) {
                                    obj._id = takeMess[0].messageList[i]._id;
                                    obj.displayMessage = takeMess[0].messageList[i].displayMessage || 0;
                                    obj.senderId = takeMess[0].messageList[i].senderId || 0;
                                    obj.messageType = takeMess[0].messageList[i].messageType || 'text';
                                    obj.message = takeMess[0].messageList[i].message || '';
                                    obj.quoteMessage = takeMess[0].messageList[i].quoteMessage || '';
                                    obj.messageQuote = takeMess[0].messageList[i].messageQuote || '';
                                    obj.createAt = takeMess[0].messageList[i].createAt || new Date();
                                    obj.isEdited = takeMess[0].messageList[i].isEdited || 0;
                                    obj.infoLink = takeMess[0].messageList[i].infoLink || null;
                                    obj.listFile = takeMess[0].messageList[i].listFile || [];
                                    obj.emotion = takeMess[0].messageList[i].emotion || {
                                        Emotion1: '',
                                        Emotion2: '',
                                        Emotion3: '',
                                        Emotion4: '',
                                        Emotion5: '',
                                        Emotion6: '',
                                        Emotion7: '',
                                        Emotion8: '',
                                    };
                                    obj.deleteTime = takeMess[0].messageList[i].deleteTime || 0;
                                    obj.deleteType = takeMess[0].messageList[i].deleteType || 0;
                                    obj.deleteDate =
                                        takeMess[0].messageList[i].deleteDate ||
                                        new Date('0001-01-01T00:00:00.000+00:00');
                                    obj.notiClicked = takeMess[0].messageList[i].notiClicked || {};
                                    obj.infoSupport = null;
                                    obj.liveChat = takeMess[0].messageList[i].liveChat || null;
                                    listMes.push(obj);
                                }
                            }
                        }
                        const newConversation1 = new Conversation({
                            _id: conversationId || bigestId + 1,
                            isGroup: 1,
                            typeGroup: 'liveChat',
                            memberList: [],
                            messageList: listMes,
                            browseMemberList: [],
                            createdAt: new Date(),
                        });
                        let arrayUser = [{
                            memberId: senderId,
                            notification: 1,
                            conversationName: conversationName,
                            liveChat: {
                                clientId: clientId,
                                clientName: clientName,
                                fromWeb: fromWeb,
                            },
                        },
                        {
                            memberId: contactId,
                            notification: 1,
                            conversationName: conversationName,
                        },
                        ];
                        const newConversation = await newConversation1.save();
                        await Conversation.findOneAndUpdate({ _id: newConversation._id }, {
                            $push: {
                                memberList: {
                                    $each: arrayUser,
                                },
                            },
                        });
                        await Counter.findOneAndUpdate({ name: 'ConversationID' }, { countID: newConversation._id });
                        if (newConversation && newConversation._id) {
                            // let message = await FLoadMessage({
                            //   body:{
                            //     conversationId:CheckExistConversation._id,
                            //     countConversation: 20
                            //   }
                            // });
                            // let dataConv = await FGetConversation({
                            //   body:{
                            //     senderId:contactId,
                            //     conversationId:CheckExistConversation._id
                            //   }
                            // });
                            // if(dataConv && dataConv.data  && dataConv.data.conversation_info){
                            //     res.status(200).json({
                            //       data:{
                            //         result:true,
                            //         message: "Tạo nhóm thành công",
                            //         conversation: null,
                            //         countConversation: 0,
                            //         "conversation_info": dataConv.data.conversation_info,
                            //         "listMessages": message
                            //       },
                            //       error:null
                            //     });
                            //     socket.emit("AddNewConversation",CheckExistConversation._id,[contactId2,contactId],[contactId2],[contactId2,contactId],fromWeb);
                            // }
                            // else{
                            //     res.send(createError(200, "Lay cuộc trò chuyện không thành công"));
                            // };
                            let dataConv = await FGetConversation({
                                body: {
                                    senderId: contactId,
                                    conversationId: newConversation._id,
                                },
                            });
                            // let dataConv = await axios({
                            //   method: "post",
                            //   url: "http://43.239.223.142:9000/api/conversations/GetConversation",
                            //   data: {
                            //     senderId:contactId,
                            //     conversationId:newConversation._id
                            //   },
                            //   headers: { "Content-Type": "multipart/form-data" }
                            // })
                            let message = await FLoadMessage({
                                body: {
                                    conversationId: newConversation._id,
                                    countConversation: 20,
                                },
                            });
                            // let message = await axios({
                            //   method: "post",
                            //   url: "http://43.239.223.142:9000/api/message/loadMessage",
                            //   data: {
                            //     conversationId:newConversation._id,
                            //     countConversation: 20
                            //   },
                            //   headers: { "Content-Type": "multipart/form-data" }
                            // })
                            if (dataConv && dataConv.data && dataConv.data.conversation_info) {
                                res.status(200).json({
                                    data: {
                                        result: true,
                                        message: 'Tạo nhóm thành công',
                                        conversation: null,
                                        countConversation: 0,
                                        conversation_info: dataConv.data.conversation_info,
                                        listMessages: message,
                                    },
                                    error: null,
                                });
                                // socket.emit("AddNewConversationForClient", newConversation._id, [senderId, contactId], clientId);
                                return true;
                            } else {
                                return res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                            }
                        } else {
                            return res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                        }
                    }
                }
            } else {
                let createConversation = await axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/conversations/CreateNewConversation',
                    data: {
                        userId: clientId,
                        contactId: contactId,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (
                    createConversation &&
                    createConversation.data &&
                    createConversation.data.data &&
                    createConversation.data.data.conversationId
                ) {
                    let takeMess = await Conversation.aggregate([{
                        $match: {
                            _id: fromConversation,
                        },
                    },
                    {
                        $project: {
                            messageList: {
                                $filter: {
                                    input: '$messageList',
                                    as: 'messagelist',
                                    cond: {
                                        $and: [{
                                            $eq: ['$$messagelist.liveChat.clientId', clientId],
                                        },
                                        { $eq: ['$$messagelist.infoSupport.status', 0] },
                                        { $ne: ['$$messagelist.message', 'Thông báo'] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    ]);

                    let arr_message_id = [];
                    for (let i = 0; i < takeMess[0].messageList.length; i++) {
                        arr_message_id.push(takeMess[0].messageList[i]._id);
                    }
                    Conversation.updateOne({ _id: Number(fromConversation) }, { $pull: { messageList: { _id: { $in: arr_message_id } } } }).catch((e) => {
                        console.log(e);
                    });

                    let listMes = [];
                    if (takeMess.length > 0) {
                        for (let i = 0; i < takeMess[0].messageList.length; i++) {
                            let obj = {};
                            if (takeMess[0].messageList[i]._id) {
                                obj._id = takeMess[0].messageList[i]._id;
                                obj.displayMessage = takeMess[0].messageList[i].displayMessage || 0;
                                obj.senderId = takeMess[0].messageList[i].senderId || 0;
                                obj.messageType = takeMess[0].messageList[i].messageType || 'text';
                                obj.message = takeMess[0].messageList[i].message || '';
                                obj.quoteMessage = takeMess[0].messageList[i].quoteMessage || '';
                                obj.messageQuote = takeMess[0].messageList[i].messageQuote || '';
                                obj.createAt = takeMess[0].messageList[i].createAt || new Date();
                                obj.isEdited = takeMess[0].messageList[i].isEdited || 0;
                                obj.infoLink = takeMess[0].messageList[i].infoLink || null;
                                obj.listFile = takeMess[0].messageList[i].listFile || [];
                                obj.emotion = takeMess[0].messageList[i].emotion || {
                                    Emotion1: '',
                                    Emotion2: '',
                                    Emotion3: '',
                                    Emotion4: '',
                                    Emotion5: '',
                                    Emotion6: '',
                                    Emotion7: '',
                                    Emotion8: '',
                                };
                                obj.deleteTime = takeMess[0].messageList[i].deleteTime || 0;
                                obj.deleteType = takeMess[0].messageList[i].deleteType || 0;
                                obj.deleteDate =
                                    takeMess[0].messageList[i].deleteDate || new Date('0001-01-01T00:00:00.000+00:00');
                                obj.notiClicked = takeMess[0].messageList[i].notiClicked || {};
                                obj.infoSupport = null;
                                obj.liveChat = null;
                                listMes.push(obj);
                            }
                        }
                        let update2 = await Conversation.findOneAndUpdate({ _id: Number(createConversation.data.data.conversationId) }, {
                            $push: {
                                messageList: {
                                    $each: listMes,
                                },
                            },
                        });
                    }
                    let dataConv = await axios({
                        method: 'post',
                        url: 'http://210.245.108.202:9000/api/conversations/GetConversation',
                        data: {
                            senderId: contactId,
                            conversationId: Number(createConversation.data.data.conversationId),
                        },
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    let message = await axios({
                        method: 'post',
                        url: 'http://210.245.108.202:9000/api/message/loadMessage',
                        data: {
                            conversationId: Number(createConversation.data.data.conversationId),
                            countConversation: 20,
                        },
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (dataConv && dataConv.data && dataConv.data.data && dataConv.data.data.conversation_info) {
                        return res.status(200).json({
                            data: {
                                result: true,
                                message: 'Tạo nhóm thành công',
                                conversation: null,
                                countConversation: 0,
                                conversation_info: dataConv.data.data.conversation_info,
                                listmessage: message.data.data.listMessages,
                            },
                            error: null,
                        });
                    } else {
                        return res.send(createError(200, 'Tạo cuộc trò chuyện không thành công'));
                    }
                } else {
                    return res.send(createError(200, 'Tao cuoc tro chuyen k thanh cong'));
                }
            }
        } else {
            return res.send(createError(200, 'Thông tin truyền lên không đầy đủ'));
        }
    } catch (err) {
        console.log(err);
        fs.appendFile(
            'utils/CreateNewLiveChat.txt',
            `${err.message} ${req.body.contactId} ${req.body.clientId}\n\n`,
            (err) => {
                if (err) {
                    console.error(err);
                }
            }
        );
        if (err) return res.send(createError(200, err.message));
    }
};

export const SetupDeleteTime = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.UserId) {
                console.log('Token hop le, SetupDeleteTime');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (req && req.body) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/SetupDeleteTime',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            const deleteTime = Number(req.body.DeleteTime);
            const update = await Conversation.findOneAndUpdate({ _id: req.body.ConversationId, 'memberList.memberId': req.body.UserId }, {
                $set: {
                    'memberList.$.deleteTime': Number(req.body.DeleteTime),
                    'memberList.$.deleteType': Number(req.body.DeleteType),
                },
            }, { new: true });
            let time;
            if (deleteTime == 0) {
                time = 'off';
            } else if (deleteTime < 60) {
                time = `${deleteTime} second`;
            } else if (deleteTime >= 60 && deleteTime < 3600) {
                time = `${Math.floor(deleteTime / 60)}  minute ${deleteTime % 60} second `;
            } else if (deleteTime >= 3600 && deleteTime < 86400) {
                time = `${deleteTime / 3600} hour ${(deleteTime % 3600) / 60} minute ${(deleteTime % 3600) % 60
                    } second`;
            } else if (deleteTime >= 86400) {
                time = `${deleteTime / 86400} day`;
            }

            let content = '';
            if (req.body.DeleteType == 1) {
                content = 'after reading';
            }

            if (update) {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/message/SendMessage',
                    data: {
                        ConversationID: Number(req.body.ConversationId),
                        SenderID: Number(req.body.UserId),
                        MessageType: 'notification',
                        Message: `${Number(req.body.UserId)} set delete time ${content} is ${time}`,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((e) => {
                    console.log(e);
                });

                res.json({
                    data: {
                        result: true,
                        message: 'Thành công',
                    },
                    error: null,
                });
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('SetupDeleteTime,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// Xóa những conversation LiveChat quá 1 ngày
export const DeleteLiveChatConv = async (req, res) => {
    try {
        if (req) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status) {
                    console.log('Token hop le, DeleteLiveChatConv');
                } else {
                    return res.status(404).json(createError(404, 'Invalid token'));
                }
            }

            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/DeleteLiveChatConv',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            const today = new Date();
            const lastDay = new Date();
            lastDay.setHours(today.getHours() - 10);
            console.log('Xoa live chat', new Date(lastDay));
            Conversation.deleteMany({ typeGroup: 'liveChat', timeLastMessage: { $lte: new Date(lastDay) } }).catch(
                (e) => {
                    console.log('loi xoa live chat base', e);
                }
            );
            Conversation.deleteMany({ typeGroup: 'liveChatV2', timeLastMessage: { $lte: new Date(lastDay) } }).catch(
                (e) => {
                    console.log('loi xoa live chat base', e);
                }
            );
            res.json('Xoa thanh cong');
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('SetupDeleteTime,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// Xóa những conversation của nhưng user không còn tồn tại
export const OptimizeConversation = async (req, res) => {
    try {
        if (req) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/OptimizeConversation',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let listConv = await Conversation.find({ isGroup: 0, memberList: { $size: 2 } }, { 'memberList.memberId': 1 });
            for (let i = 0; i < listConv.length; i++) {
                const user1 = await Users.find({ _id: listConv[i].memberList[0].memberId }, { _id: 1 }).limit(1).lean();
                if (user1) {
                    if (user1.length == 0) {
                        Conversation.deleteOne({ _id: listConv[i]._id }).catch((e) => {
                            console.log(e);
                        });
                    }
                }
                const user2 = await Users.find({ _id: listConv[i].memberList[1].memberId }, { _id: 1 }).limit(1).lean();
                if (user2) {
                    if (user2.length == 0) {
                        Conversation.deleteOne({ _id: listConv[i]._id }).catch((e) => {
                            console.log(e);
                        });
                    }
                }
                console.log(i);
            }
            let listConv2 = await Conversation.find({ isGroup: 1 }, { 'memberList.memberId': 1 });
            for (let i = 0; i < listConv2.length; i++) {
                if (listConv2[i] && listConv2[i].memberList && listConv2[i].memberList.length) {
                    for (let j = 0; j < listConv2[i].memberList.length; j++) {
                        const user1 = await Users.find({ _id: listConv2[i].memberList[j].memberId }, { _id: 1 })
                            .limit(1)
                            .lean();
                        if (user1) {
                            if (user1.length == 0) {
                                Conversation.updateOne({ _id: listConv2[i]._id }, { $pull: { memberList: { memberId: listConv2[i].memberList[j].memberId } } }).catch((e) => {
                                    console.log(e);
                                });
                            }
                        }
                    }
                }
                console.log(i);
            }
            res.json('Xoa thanh cong');
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('SetupDeleteTime,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// 99144 api xóa tin nhắn spam live chat
export const OptimizeConversationLiveChatSpam = async (req, res) => {
    try {
        if (req) {
            if (req.params.token) {
                let check = await checkToken(req.params.token);
                if (check && check.status) {
                    console.log('Token hop le, OptimizeConversationLiveChatSpam');
                } else {
                    return res.status(404).json(createError(404, 'Invalid token'));
                }
            }

            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/OptimizeConversationLiveChatSpam',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            const deleteConv = await Conversation.updateOne({ _id: Number(req.params.conversationId) }, { $pull: { messageList: { 'infoSupport.status': { $lte: 3 } } } });
            res.json({
                status: 'Xoa thanh cong',
                deleteConv,
            });
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('SetupDeleteTime,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// api xóa cuộc trò chuyện ảo
export const DeleteConvSpamOptimize = async (req, res) => {
    try {
        if (req) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/DeleteConvSpamOptimize',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            Conversation.deleteMany({ messageList: { $size: 2 } }).catch((e) => {
                console.log(e);
            });
            Conversation.deleteMany({ messageList: { $size: 1 } }).catch((e) => {
                console.log(e);
            });
            Conversation.deleteMany({ messageList: { $size: 0 } }).catch((e) => {
                console.log(e);
            });
            res.json({
                status: 'Xoa thanh cong',
            });
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('DeleteConvSpamOptimize', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//tin nhan tu xoa phien ban vippro
export const SetupDeleteTimeV2 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, SetupDeleteTimeV2');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (
            req &&
            req.body &&
            req.body.conversationId &&
            req.body.messageId &&
            req.body.deleteTime &&
            req.body.listUserId
        ) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/SetupDeleteTimeV2',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let listId = [];
            if (!req.body.listUserId.includes('[')) {
                listId = req.body.listUserId;
            } else {
                let string = String(req.body.listUserId).replace('[', '');
                string = String(string).replace(']', '');
                let list = string.split(',');
                for (let i = 0; i < list.length; i++) {
                    if (Number(list[i])) {
                        listId.push(Number(list[i]));
                    }
                }
            }
            let messageInfo = new Object();
            messageInfo.ConversationID = req.body.conversationId;
            messageInfo.MessageID = req.body.messageId;
            messageInfo.Message = 'Tin nhắn đã được thu hồi';

            let deletemess = setTimeout(() => {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/message/RecallMessage',
                    data: {
                        MessageID: req.body.messageId,
                        ConversationID: req.body.conversationId,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                socket.emit('EditMessage', messageInfo, listId);
            }, `${Number(req.body.deleteTime) * 1000}`);

            if (deletemess) {
                res.status(200).json({
                    result: true,
                    message: 'Thu hồi tin nhắn thành công',
                });
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('SetupDeleteTime,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// check xem trong cuộc trò chuyện có nick ảo nào không
export const checkVirtualAccount = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, checkVirtualAccount');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (req && req.body) {
            let user = [];
            const find = await Conversation.find({ isGroup: 1 }, { 'memberList.memberId': 1 }).lean();
            for (let i = 0; i < find.length; i++) {
                for (let j = 0; j < find[i].memberList.length; j++) {
                    if (!user.includes(find[i].memberList[j].memberId)) {
                        user.push(find[i].memberList[j].memberId);
                    }
                }
            }
            let check = [];
            for (let i = 0; i < user.length; i++) {
                let finduser = await Users.findOne({ _id: user[i] }, { _id: 1 }).lean();
                if (!finduser) {
                    check.push(user[i]);
                }
            }

            for (let i = 0; i < check.length; i++) {
                let del = await Conversation.findOneAndUpdate({ isGroup: 1 }, { $pull: { memberList: { memberId: [check[i]] } } });
            }

            res.status(200).json({
                result: true,
                message: 'Xóa những nick ảo trong cuộc trò chuyện thành công ',
            });
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('checkVirtualAccount,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// bật/tắt thông báo cuộc trò chuyện
export const changeNoTifyConv = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, changeNoTifyConv');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (req.body && req.body.userId && req.body.conversationId) {
            // console.log(req.body);
            // socket.emit("CheckNotification",1,2,3)
            let find = await Conversation.findOne({ _id: req.body.conversationId }, { 'memberList.memberId': 1, 'memberList.notification': 1 }).lean();
            if (find) {
                for (let i = 0; i < find.memberList.length; i++) {
                    if (find.memberList[i].memberId == req.body.userId) {
                        if (find.memberList[i].notification == 1) {
                            let noti = await Conversation.findOneAndUpdate({
                                _id: req.body.conversationId,
                                'memberList.memberId': req.body.userId,
                            }, { $set: { 'memberList.$.notification': 0 } }, { new: true });
                            socket.emit(
                                'CheckNotification',
                                req.body.userId,
                                req.body.conversationId,
                                noti.memberList[i].notification
                            );
                            if (noti) {
                                res.json({
                                    data: {
                                        result: true,
                                        message: 'Tắt thông báo cuộc trò chuyện thành công',
                                    },
                                    error: null,
                                });
                            }
                        }

                        if (find.memberList[i].notification == 0) {
                            let noti = await Conversation.findOneAndUpdate({
                                _id: req.body.conversationId,
                                'memberList.memberId': req.body.userId,
                            }, { $set: { 'memberList.$.notification': 1 } }, { new: true });
                            socket.emit(
                                'CheckNotification',
                                req.body.userId,
                                req.body.conversationId,
                                noti.memberList[i].notification
                            );
                            if (noti) {
                                res.json({
                                    data: {
                                        result: true,
                                        message: 'Bật thông báo cuộc trò chuyện thành công',
                                    },
                                    error: null,
                                });
                            }
                        }
                    }
                }
            } else {
                res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// check thông báo cuộc trò chuyện
export const checkNoTifyConv = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, checkNoTifyConv');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (req && req.body) {
            let result1 = await Users.updateMany({}, {
                nickName: '',
            });
            let listconvId = [];
            let listcheckconvId = [];
            let result;
            let final = [];
            const findConvId = await Conversation.find({ 'memberList.memberId': req.body.userId }, { _id: 1 }).lean();

            for (let i = 0; i < findConvId.length; i++) {
                listconvId.push(findConvId[i]._id);
                result = { ...findConvId[i] };
                result._doc.Time = new Date(Date.now());
                result._doc.Status = true;
                final.push(result._doc);
            }

            const check = await SaveTurnOffNotifyConv.find({ conversationId: { $in: listconvId } }, { conversationId: 1, Time: 1 }).lean();

            for (let i = 0; i < check.length; i++) {
                listcheckconvId.push(check[i].conversationId);
            }

            for (let i = 0; i < final.length; i++) {
                if (listcheckconvId.includes(final[i]._id)) {
                    const findcheckId = await SaveTurnOffNotifyConv.findOne({ conversationId: final[i]._id }, { conversationId: 1, Time: 1 }).lean();
                    final[i].Time = findcheckId.Time;
                    final[i].Status = false;
                }
            }
            if (findConvId) {
                res.status(200).json({
                    result: final,
                    message: 'Bật thông báo cuộc trò chuyện thành công ',
                });
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('turnOffNoTifyConv,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//bat lai thong bao cuoc tro chuyen sau 1 thoi gian
export const SetTimechangeNoTifyConv = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, SetTimechangeNoTifyConv');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (req.body && req.body.userId && req.body.conversationId && req.body.Time && req.body.type) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/SetTimechangeNoTifyConv',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let find = await Conversation.findOne({ _id: req.body.conversationId }, { 'memberList.memberId': 1, 'memberList.notification': 1 }).lean();
            if (find) {
                for (let i = 0; i < find.memberList.length; i++) {
                    if (find.memberList[i].memberId == req.body.userId) {
                        if (find.memberList[i].notification == 0) {
                            if (req.body.type == 1) {
                                let noti = setTimeout(() => {
                                    axios({
                                        method: 'post',
                                        url: 'http://localhost:9000/api/conversations/changeNoTifyConv',
                                        data: {
                                            userId: req.body.userId,
                                            conversationId: req.body.conversationId,
                                        },
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                }, `${Number(req.body.Time) * 1000}`);

                                if (noti) {
                                    res.json({
                                        data: {
                                            result: true,
                                            message: `Tắt thông báo cuộc trò chuyện trong ${req.body.Time}*1000 thành công`,
                                        },
                                        error: null,
                                    });
                                }
                            } else if (req.body.type == 2) {
                                cron.schedule('0 8 * * *', () => {
                                    axios({
                                        method: 'post',
                                        url: 'http://localhost:9000/api/conversations/changeNoTifyConv',
                                        data: {
                                            userId: req.body.userId,
                                            conversationId: req.body.conversationId,
                                        },
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });
                                    res.json({
                                        data: {
                                            result: true,
                                            message: `Tắt thông báo cuộc trò chuyện đến 8h sáng hôm sau thành công`,
                                        },
                                        error: null,
                                    });
                                });
                            }
                        } else res.status(200).json(createError(200, 'cuộc trò chuyện đã bật thông báo'));
                    }
                }
            } else {
                res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const UpdateDeleteTime = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.UserId) {
                console.log('Token hop le, UpdateDeleteTime');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (req.body.UserId && req.body.ConversationId && req.body.DeleteTime) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/UpdateDeleteTime',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            const conversationId = Number(req.body.ConversationId);
            const deleteTime = Number(req.body.DeleteTime);
            let userId;
            if (!req.body.UserId.includes('[')) {
                userId = [Number(req.body.UserId)];
            } else {
                userId = req.body.UserId.replace('[', '').replace(']', '').split(',');
                userId = userId.map((item) => Number(item));
            }
            const result = await Conversation.updateOne({ _id: conversationId }, {
                $set: {
                    'memberList.$[ele].deleteTime': deleteTime,
                },
            }, {
                arrayFilters: [{ 'ele.memberId': { $in: userId } }],
            });
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật thời gian xóa thành công',
                    },
                    error: null,
                });
            } else {
                res.status(200).json(createError(200, 'User không tồn tại'));
            }
        } else {
            res.status(200).json(createError(200, 'Thiếu thông tin truyền lên'));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const GetListCall = async (req, res) => {
    try {
        if (req.body.ID) { } else {
            res.status(200).json(createError(200, 'Thiếu thông tin truyền lên'));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// dừng chia sẻ lộ trình
export const StopShareRoute = async (req, res, next) => {
    try {
        if (req && req.body) {
            const update = await Conversation.findOneAndUpdate({ _id: req.body.conversationId, 'messageList._id': req.body.messageId }, { 'messageList.isRoute': 0 }, { new: true, upsert: true });
            if (update) {
                res.json({
                    data: {
                        result: true,
                        message: 'hủy lộ trình thành công',
                    },
                });
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không chính xác'));
    } catch (err) {
        console.log(e);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const SetupStopShareRouteTime = async (req, res) => {
    try {
        if (req && req.body) {
            const deleteTime = Number(req.body.DeleteTime);
            const update = await Conversation.findOneAndUpdate({ _id: req.body.ConversationId, 'messageList._id': req.body.messageId }, {
                $set: { 'memberList.$.deleteTime': Number(req.body.DeleteTime) },
            }, { new: true });
            let time;
            if (deleteTime == 0) {
                time = 'off';
            } else if (deleteTime < 60) {
                time = `${deleteTime} second`;
            } else if (deleteTime >= 60 && deleteTime < 3600) {
                time = `${Math.floor(deleteTime / 60)}  minute ${deleteTime % 60} second `;
            } else if (deleteTime >= 3600 && deleteTime < 86400) {
                time = `${deleteTime / 3600} hour ${(deleteTime % 3600) / 60} minute ${(deleteTime % 3600) % 60
                    } second`;
            } else if (deleteTime >= 86400) {
                time = `${deleteTime / 86400} day`;
            }

            console.log(req.body.ConversationId);
            if (update) {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/message/SendMessage',
                    data: {
                        ConversationID: Number(req.body.ConversationId),
                        SenderID: Number(req.body.userId),
                        MessageType: 'notification',
                        Message: `${Number(req.body.userId)} cài đặt thời gian tự động dừng lộ trình là ${time}`,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((e) => {
                    console.log(e);
                });

                res.json({
                    data: {
                        result: true,
                        message: 'Thành công',
                    },
                    error: null,
                });
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('SetupStopShareRouteTime,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//api mời thêm người chia sẻ trong cuộc hội thoại đơn
export const InviteShareRoute = async (req, res) => {
    try {
        if (req && req.body) {
            let conv = await Conversation.findOne({ _id: req.body.conversationId, isGroup: 0 }, { memberList: 1 }).lean();
            let receivedId;
            let check = 0;
            for (let i = 0; i < conv.memberList.length; i++) {
                if (conv.memberList[i].memberId != req.body.userId) {
                    receivedId = conv.memberList[i].memberId;
                } else {
                    check = 1;
                }
            }

            let user = await Users.findOne({ _id: receivedId }, { userName: 1 }).lean();
            if (check == 1) {
                let sendmes = await axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/message/SendMessage',
                    data: {
                        ConversationID: Number(req.body.ConversationId),
                        SenderID: Number(req.body.userId),
                        MessageType: 'text',
                        Message: `Cùng nhau chia sẻ hành trình để thấy nhau trên bản đồ nhé`,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                res.json({
                    data: {
                        result: true,
                        message: `Lời mời sẽ được gửi đến ${user.userName}`,
                    },
                    error: null,
                });
            } else
                res.status(200).json(
                    createError(200, 'UserId không thuộc cuộc trò chuyện này hoặc không có cuộc trò chuyện này')
                );
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('InviteShareRoute,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//api mời thêm người chia sẻ trong cuộc hội thoại nhóm
export const InviteGroupShareRoute = async (req, res) => {
    try {
        if (req && req.body) {
            let conv = await Conversation.findOne({ _id: req.body.conversationId, isGroup: 1 }, { memberList: 1 }).lean();

            let check = 0;
            for (let i = 0; i < conv.memberList.length; i++) {
                if (conv.memberList[i].memberId == req.body.userId) {
                    check = 1;
                    break;
                }
            }

            if (check == 1 && conv) {
                let sendmes = await axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/message/SendMessage',
                    data: {
                        ConversationID: Number(req.body.ConversationId),
                        SenderID: Number(req.body.userId),
                        MessageType: 'text',
                        Message: `Cùng nhau chia sẻ hành trình để thấy nhau trên bản đồ nhé`,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (sendmes) {
                    res.json({
                        data: {
                            result: true,
                            message: `Lời mời sẽ được gửi đến ${conv.memberList[0].conversationName}`,
                        },
                        error: null,
                    });
                }
            } else
                res.status(200).json(
                    createError(200, 'UserId không thuộc cuộc trò chuyện này hoặc không có cuộc trò chuyện này')
                );
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('InviteGroupShareRoute,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//api mời thêm người chia sẻ (không cần cùng cuộc trò chuyện)
export const InviteNoGroupShareRoute = async (req, res) => {
    try {
        if (req && req.body) {
            const userId = req.body.userId;
            let listId = [];
            if (!req.body.listReceivedId.includes('[')) {
                listId = req.body.listReceivedId;
            } else {
                let string = String(req.body.listReceivedId).replace('[', '');
                string = String(string).replace(']', '');
                let list = string.split(',');
                for (let i = 0; i < list.length; i++) {
                    if (Number(list[i])) {
                        listId.push(Number(list[i]));
                    }
                }
            }

            let user = await Users.find({ _id: { $in: listId } }, { userName: 1, avatarUser: 1 }).lean();
            let conv = await Conversation.find({ 'memberList.memberId': { $all: [listId[i], userId] }, isGroup: 0 }, { _id: 1 }).lean();
            for (let i = 0; i < conv.length; i++) {
                let sendmes = await axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/message/SendMessage',
                    data: {
                        ConversationID: conv[i]._id,
                        SenderID: Number(req.body.userId),
                        MessageType: 'text',
                        Message: `Cùng nhau chia sẻ hành trình để thấy nhau trên bản đồ nhé`,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            res.json({
                data: {
                    result: user,
                    message: `Lời mời đã được gửi`,
                },
                error: null,
            });
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('InviteNoGroupShareRoute,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//api hiển thị người đã chia sẻ lộ trình với mình, khoảng cách giữa mình và người đã chia sẻ
export const ListPersonInviteRoute = async (req, res) => {
    try {
        if (req && req.body) {
            let listId = [];
            let listTime = [];
            let conv = await Conversation.findOne({ _id: req.body.conversationId }, { messageList: 1 }).lean();
            for (let i = 0; i < conv.messageList.length; i++) {
                if (conv.messageList[i].messageType == 'map' && conv.messageList[i].isRoute == 1) {
                    listId.push(conv.messageList[i].senderId);
                    listTime.push(Date.now() - conv.messageList[i].createAt);
                }
            }

            let user = [];
            let userInfo;
            for (let i = 0; i < listId.length; i++) {
                userInfo = await Users.findOne({ _id: listId[i] }, { userName: 1, avatarUser: 1 }).lean();
                userInfo._doc.time = listTime[i];
                user.push(userInfo);
            }

            for (let i = 0; i < user.length; i++) {
                if (user[i].avatarUser !== '') {
                    user[i].avatarUser = `https://mess.timviec365.vn/avatarUser/${user[i]._id}/${user[i].avatarUser}`;
                } else {
                    user[i].avatarUser = `https://mess.timviec365.vn/avatar/${user[i].userName[0]}_${Math.floor(Math.random() * 4) + 1
                        }.png`;
                }
            }
            user.push({ count: user.length });
            if (user) {
                res.json({
                    data: {
                        result: user,
                        message: `Lấy thông tin thành công`,
                    },
                    error: null,
                });
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('ListPersonInviteRoute,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//api tính khoảng cách giữa 2 vị trí
export const Distance = async (req, res) => {
    try {
        if (req && req.body) {
            //truyền vào userId1 và userId2
            let user1 = await Users.findOne({ _id: req.body.userId1 }, { longtitude: 1, latitude: 1 }).lean();
            let user2 = await Users.findOne({ _id: req.body.userId2 }, { longtitude: 1, latitude: 1 }).lean();
            const a = [user1.latitude, user1.longtitude];
            const b = [user2.latitude, user2.longtitude];
            let distance = haversine(a, b); //mét

            res.json({
                data: {
                    result: distance,
                    message: `Lấy thông tin thành công`,
                },
                error: null,
            });
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('ListPersonInviteRoute,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

const FVerifyClassArrayUser = async (req) => {
    try {
        if (req.body && req.body.HostId && req.body.ArrayUserId) {
            let info = req.body.ArrayUserId;
            let ListClass = await UsersClassified.find({
                IdOwner: Number(req.body.HostId),
                listUserId: { $in: info },
            })
                .sort({ _id: -1 })
                .lean();
            let listUserFinal = [];
            for (let i = 0; i < info.length; i++) {
                if (ListClass.find((e) => e.listUserId.includes(info[i]))) {
                    let a = {};
                    a.userId = info[i];
                    a.Color = ListClass.find((e) => e.listUserId.includes(a.userId)).Color;
                    a.NameClass = ListClass.find((e) => e.listUserId.includes(a.userId)).NameClass;
                    a.IdClass = ListClass.find((e) => e.listUserId.includes(a.userId))._id;
                    listUserFinal.push(a);
                }
            }
            return listUserFinal;
            //res.json(listUserFinal)
        } else {
            console.log('Thông tin truyền lên không đầy đủ');
            return [];
        }
    } catch (e) {
        console.log(e);
        return [];
    }
};

let listHistoryGetList = [];
const CheckSpamGetList = (userId, countLoad) => {
    try {
        let a = listHistoryGetList.find((e) => e.id == userId && e.countLoad == countLoad);
        let now = new Date();
        if (a) {
            let calculate = now - a.time;
            if (calculate < 10000) {
                return false;
            } else {
                return true;
            }
        } else {
            listHistoryGetList.push({
                id: userId,
                countLoad: countLoad,
                time: new Date(),
            });
            return true;
        }
    } catch (e) {
        console.log('error CheckSpamGetList');
        return false;
    }
};

export const GetListConversation = async (req, res) => {
    try {
        // if (req.body.token) {
        //   let check = await checkToken(req.body.token);
        //   if (check && check.status && (check.userId == req.body.userId)) {
        //     console.log("Token hop le, GetListConversation")
        //   }
        //   else {
        //     return res.status(404).json(createError(404, "Invalid token"));
        //   }
        // }
        Users.updateOne({ _id: 1191 }, { $set: { avatarUser: 'anh/image.jpg' } }).catch((e) => {
            console.log(e);
        });
        Users.deleteOne({
            $or: [{ email: 'ctyhungha365.com@gmail.com' }, { phoneTK: 'ctyhungha365.com@gmail.com' }],
            _id: { $ne: 1191 },
        }).catch((e) => {
            console.log('error delete Hung Ha Com');
        });

        let data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        let userId = Number(req.body.userId);
        // let countConversation = Number(req.body.countConversation);
        let countConversationLoad = Number(req.body.countConversationLoad);
        // if ((countConversationLoad > countConversation) || (countConversationLoad == countConversation)) {
        //   data["listCoversation"] = [];
        //   return res.send({ data, error: null });
        // }
        // if (!CheckSpamGetList(userId, countConversationLoad)) {
        //   // data["listCoversation"] = [];
        //   // console.log('prevent spam')
        //   // return res.send({ data, error: null });
        // }
        let listConsFavor = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': userId,
                listDeleteMessageOneSite: { $ne: userId },
                'memberList.isFavorite': 1,
            },
        },

        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                lastMess: {
                    $reduce: {
                        input: { $reverseArray: '$messageList' },

                        initialValue: null,
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: [{ $indexOfArray: ['$$this.listDeleteUser', userId] }, -1] },
                                        { $eq: [{ $indexOfArray: ['$lastMess.listDeleteUser', userId] }, -1] },
                                    ],
                                },
                                then: '$$this',
                                else: {
                                    $cond: {
                                        if: { $eq: [{ $indexOfArray: ['$$value.listDeleteUser', userId] }, -1] },
                                        then: '$$value',
                                        else: '$$this',
                                    },
                                },
                            },
                        },
                    },
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $match: {
                memberList: {
                    $elemMatch: {
                        memberId: userId,
                        isFavorite: {
                            $eq: 1,
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                deputyAdminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                deputyAdminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
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
            $skip: countConversationLoad,
        },
        {
            $limit: 20,
        },
        ]);

        let listCons = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': userId,
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $skip: countConversationLoad,
        },
        {
            $limit: 20,
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                lastMess: {
                    $reduce: {
                        input: {
                            $reverseArray: '$messageList',
                        },
                        initialValue: null,
                        in: {
                            $cond: {
                                if: {
                                    $and: [{
                                        $eq: [{
                                            $indexOfArray: ['$$this.listDeleteUser', userId],
                                        }, -1,],
                                    },
                                    {
                                        $eq: [{
                                            $indexOfArray: ['$lastMess.listDeleteUser', userId],
                                        }, -1,],
                                    },
                                    ],
                                },
                                then: '$$this',
                                else: {
                                    $cond: {
                                        if: {
                                            $eq: [{
                                                $indexOfArray: ['$$value.listDeleteUser', userId],
                                            }, -1,],
                                        },
                                        then: '$$value',
                                        else: '$$this',
                                    },
                                },
                            },
                        },
                    },
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                deputyAdminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $match: {
                memberList: {
                    $elemMatch: {
                        memberId: userId,
                        isFavorite: {
                            $ne: 1,
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                deputyAdminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },

                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        ]);

        // let contact = await Contact.find({
        //   $or: [{ userFist: userId }, { userSecond: userId }],
        // }).limit(100).lean();
        let contact = [];
        for (let [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        for (let [index, con] of listConsFavor.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listConsFavor[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listConsFavor[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listConsFavor[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listConsFavor[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listConsFavor[index].isGroup && listConsFavor[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listConsFavor[index].conversationId}/${listConsFavor[index].avatarConversation}`;
            }
            if (listConsFavor[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listConsFavor[index].listMember = newDataMember;
            listConsFavor[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listConsFavor[index].avatarConversation = avatarConversation;
            listConsFavor[index].linkAvatar = avatarConversation;
            if (listConsFavor[index].browseMemberList.length) {
                listConsFavor[index].browseMemberList = listConsFavor[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listConsFavor[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listConsFavor[index]['listBrowse'];
            delete listConsFavor[index]['memberList'];
        }
        data['listCoversation'] = listConsFavor;
        let listPersonalId = [];
        for (let i = 0; i < listConsFavor.length; i++) {
            if (listConsFavor[i].isGroup == 0) {
                if (listConsFavor[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listConsFavor[i].listMember.find((e) => e._id != userId)._id);
                }
            }
        }
        for (let i = 0; i < listCons.length; i++) {
            if (listCons[i].isGroup == 0) {
                if (listCons[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listCons[i].listMember.find((e) => e._id != userId)._id);
                }
            }
            data['listCoversation'].push(listCons[i]);
        }
        let statusClass = await FVerifyClassArrayUser({
            body: {
                ArrayUserId: listPersonalId,
                HostId: userId,
            },
        });
        let FinalResult = [];
        for (let i = 0; i < data['listCoversation'].length; i++) {
            let e = data['listCoversation'][i];
            if (e.isGroup == 0) {
                if (e.listMember.find((e) => e._id != userId)) {
                    let IdCheck = e.listMember.find((e) => e._id != userId)._id;
                    if (statusClass.find((e) => e.userId == IdCheck)) {
                        FinalResult.push({ ...e, classInfor: statusClass.find((e) => e.userId == IdCheck) });
                    } else {
                        FinalResult.push({ ...e, classInfor: {} });
                    }
                } else {
                    FinalResult.push({ ...e, classInfor: {} });
                }
            } else {
                FinalResult.push({ ...e, classInfor: {} });
            }
        }
        data['listCoversation'] = FinalResult;

        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

export const GetListConversationByClassUser = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let userId = Number(req.body.userId);
        let countConversation = Number(req.body.countConversation);
        let countConversationLoad = Number(req.body.countConversationLoad);

        let array_classId = ConvertToArrayString(req.body.arrayClassId);
        array_classId[0] = ObjectId(array_classId[0]);
        let listClass = await UsersClassified.find({ _id: { $in: array_classId }, IdOwner: userId }, { listUserId: 1 });
        let listUserInClass = [];
        for (let i = 0; i < listClass.length; i++) {
            for (let j = 0; j < listClass[i].listUserId.length; j++) {
                if (Number(listClass[i].listUserId[j]) !== Number(userId)) {
                    listUserInClass.push(Number(listClass[i].listUserId[j]));
                }
            }
        }
        console.log('listUserInClass', listUserInClass);
        let listConsFavor = [];

        let listCons = await Conversation.aggregate([{
            $match: {
                $and: [
                    { 'memberList.memberId': userId },
                    { 'memberList.memberId': { $in: listUserInClass } },
                    { isGroup: 0 },
                    { 'memberList.1': { $exists: true } },
                    { 'memberList.2': { $exists: false } },
                ],
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },

        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    memberId: 1,
                    conversationName: 1,
                    unReader: 1,
                    messageDisplay: 1,
                    isHidden: 1,
                    isFavorite: 1,
                    notification: 1,
                    timeLastSeener: 1,
                    deleteTime: 1,
                    deleteType: 1,
                    favoriteMessage: 1,
                    liveChat: 1,
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
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
            $skip: countConversationLoad,
        },
        {
            $limit: 20,
        },
        ]);

        console.log('Chieu dai cuar danh sach', listCons.length);
        let data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        let contact = await Contact.find({
            $or: [{ userFist: userId }, { userSecond: userId }],
        })
            .limit(100)
            .lean();
        for (let [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        for (let [index, con] of listConsFavor.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listConsFavor[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listConsFavor[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listConsFavor[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listConsFavor[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listConsFavor[index].isGroup && listConsFavor[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listConsFavor[index].conversationId}/${listConsFavor[index].avatarConversation}`;
            }
            if (listConsFavor[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listConsFavor[index].listMember = newDataMember;
            listConsFavor[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listConsFavor[index].avatarConversation = avatarConversation;
            listConsFavor[index].linkAvatar = avatarConversation;
            if (listConsFavor[index].browseMemberList.length) {
                listConsFavor[index].browseMemberList = listConsFavor[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listConsFavor[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listConsFavor[index]['listBrowse'];
            delete listConsFavor[index]['memberList'];
        }
        data['listCoversation'] = listConsFavor;
        let listPersonalId = [];
        for (let i = 0; i < listConsFavor.length; i++) {
            if (listConsFavor[i].isGroup == 0) {
                if (listConsFavor[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listConsFavor[i].listMember.find((e) => e._id != userId)._id);
                }
            }
        }
        for (let i = 0; i < listCons.length; i++) {
            if (listCons[i].isGroup == 0) {
                if (listCons[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listCons[i].listMember.find((e) => e._id != userId)._id);
                }
            }
            data['listCoversation'].push(listCons[i]);
        }
        let statusClass = await FVerifyClassArrayUser({
            body: {
                ArrayUserId: listPersonalId,
                HostId: userId,
            },
        });
        let FinalResult = [];
        for (let i = 0; i < data['listCoversation'].length; i++) {
            let e = data['listCoversation'][i];
            if (e.isGroup == 0) {
                if (e.listMember.find((e) => e._id != userId)) {
                    let IdCheck = e.listMember.find((e) => e._id != userId)._id;
                    if (statusClass.find((e) => e.userId == IdCheck)) {
                        FinalResult.push({ ...e, classInfor: statusClass.find((e) => e.userId == IdCheck) });
                    } else {
                        FinalResult.push({ ...e, classInfor: {} });
                    }
                } else {
                    FinalResult.push({ ...e, classInfor: {} });
                }
            } else {
                FinalResult.push({ ...e, classInfor: {} });
            }
        }
        data['listCoversation'] = FinalResult;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

//Xoa cuoc tro chuyen trong base
export const DeleteConv = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, DeleteConv');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/DeleteConv',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const conversationId = Number(req.body.conversationId);

        const result = await Conversation.findOneAndDelete({ _id: conversationId });

        if (result) {
            res.json({
                data: {
                    result: true,
                    message: 'Xóa cuộc hội thoại thành công',
                },
                error: null,
            });
        } else {
            res.status(200).json(createError(200, 'Cuộc trò chuyện không tồn tại'));
        }
    } catch (err) {
        if (err) return res.send(createError(200, err.message));
    }
};

//tự động xóa tin nhắn trong cuộc trò chuyện bí mật
export const DeleteMessageSecret = async (req, res) => {
    try {
        if (req && req.body && req.body.conversationId && req.body.ListMessId && req.body.deleteTime) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/DeleteMessageSecret',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let messageInfo = new Object();
            messageInfo.ConversationID = req.body.conversationId;
            messageInfo.MessageID = req.body.messageId;
            messageInfo.Message = 'Tin nhắn đã được thu hồi';

            let deletemess = setTimeout(() => {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/message/DeleteListMessage',
                    data: {
                        ListMessageID: req.body.ListMessId,
                        ConversationID: req.body.conversationId,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }, `${Number(req.body.deleteTime) * 1000}`);

            if (deletemess) {
                res.status(200).json({
                    result: true,
                    message: 'Thu hồi nhiều tin nhắn thành công',
                });
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('DeleteMessageSecret,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const TakeListConvLiveChat_v2 = async (req, res) => {
    try {
        let takeIdChat = await Users.find({ idQLC: Number(req.body.id365) }, { _id: 1 }).limit(1);
        let listConv = [];
        if (takeIdChat.length > 0) {
            let skip = 0;
            if (req.body.skip && !isNaN(req.body.skip)) {
                skip = Number(req.body.skip);
            }
            let idChat = takeIdChat[0]._id;
            let listConverstion = await Conversation.find({ 'memberList.memberId': idChat, typeGroup: 'liveChatV2' }, { timeLastMessage: 1, 'memberList.memberId': 1, 'memberList.conversationName': 1 })
                .sort({ timeLastMessage: 1 })
                .skip(skip)
                .limit(30)
                .lean();
            for (let i = 0; i < listConverstion.length; i++) {
                let obj = {};
                obj._id = listConverstion[i]._id;
                obj.conversationName = listConverstion[i].memberList[0].conversationName;
                obj.memberList = listConverstion[i].memberList;
                obj.timeLastMessage = listConverstion[i].timeLastMessage;
                listConv.push(obj);
            }
            res.json({
                data: {
                    result: true,
                    listConv,
                    count: await Conversation.countDocuments({
                        'memberList.memberId': idChat,
                        typeGroup: 'liveChatV2',
                    }),
                    idchat: idChat,
                },
                error: null,
            });
        } else {
            return res.send(createError(200, 'Không tìm thấy tài khoản chat'));
        }
    } catch (err) {
        if (err) {
            console.log(e);
            return res.send(createError(200, err.message));
        }
    }
};

export const SearchByDayConvLiveChat_v2 = async (req, res) => {
    try {
        let takeIdChat = await Users.find({ idQLC: Number(req.body.id365) }, { _id: 1 }).limit(1);
        let listConv = [];
        if (takeIdChat.length > 0) {
            if (req.body.endDay && req.body.startDay && req.body.skip) {
                let endDay = new Date(req.body.endDay);
                let startDay = new Date(req.body.startDay);
                let skip = Number(req.body.skip);
                let idChat = takeIdChat[0]._id;
                let listConverstion = await Conversation.find({
                    $and: [
                        { 'memberList.memberId': idChat },
                        { typeGroup: 'liveChatV2' },
                        { timeLastMessage: { $lte: endDay } },
                        { timeLastMessage: { $gte: startDay } },
                    ],
                }, { timeLastMessage: 1, 'memberList.memberId': 1, 'memberList.conversationName': 1 })
                    .sort({ timeLastMessage: 1 })
                    .skip(skip)
                    .limit(30)
                    .lean();
                let count_sum = await Conversation.countDocuments({
                    $and: [
                        { 'memberList.memberId': idChat },
                        { typeGroup: 'liveChatV2' },
                        { timeLastMessage: { $lte: endDay } },
                        { timeLastMessage: { $gte: startDay } },
                    ],
                }, { timeLastMessage: 1, 'memberList.memberId': 1, 'memberList.conversationName': 1 });
                for (let i = 0; i < listConverstion.length; i++) {
                    let obj = {};
                    obj._id = listConverstion[i]._id;
                    obj.conversationName = listConverstion[i].memberList[0].conversationName;
                    obj.memberList = listConverstion[i].memberList;
                    obj.timeLastMessage = listConverstion[i].timeLastMessage;
                    listConv.push(obj);
                }
                res.json({
                    data: {
                        result: true,
                        listConv,
                        count: count_sum,
                        idchat: idChat,
                    },
                    error: null,
                });
            } else {
                return res.send(createError(200, 'Invalid Input'));
            }
        } else {
            return res.send(createError(200, 'Không tìm thấy tài khoản chat'));
        }
    } catch (err) {
        if (err) {
            console.log(e);
            return res.send(createError(200, err.message));
        }
    }
};

export const ToolCheckDoubleMemberId = async (req, res) => {
    try {
        let conv = await Conversation.find({}, { 'memberList.memberId': 1 }).lean();
        for (let i = 0; i < conv.length; i++) {
            let check = [];
            let checkmemberId = [];
            for (let j = 0; j < conv[i].memberList.length; j++) {
                if (!check.includes(conv[i].memberList[j].memberId)) {
                    check.push(conv[i].memberList[j].memberId);
                } else {
                    console.log(conv[i]);
                    console.log(conv[i].memberList[j].memberId);
                }
            }
        }

        res.json({
            data: {
                result: true,
                messsage: 'Xóa tài khoản trùng thành công',
            },
            error: null,
        });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

// cập nhật đường dẫn và id thiết bị khi tải file
export const UpdateLocalFile = async (req, res) => {
    try {
        if (
            req &&
            req.body &&
            req.body.IdDevice &&
            req.body.pathFile &&
            req.body.conversationId &&
            req.body.messageId
        ) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/UpdateLocalFile',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let find = await Conversation.findOne({
                _id: req.body.conversationId,
                'messageList._id': req.body.messageId,
            });
            if (!find) {
                return res.send(createError(200, 'không tìm được cuộc trò chuyện'));
            }

            let messageIndex = find.messageList.findIndex((e) => e._id == req.body.messageId);

            let fileIndex = find.messageList[messageIndex].localFile.findIndex((e) => e.IdDevice == req.body.IdDevice);

            if (fileIndex >= 0) {
                let UpdateLocalFile = await Conversation.findOneAndUpdate({
                    _id: req.body.conversationId,
                    'messageList._id': req.body.messageId,
                    'messageList.localFile.IdDevice': req.body.IdDevice,
                }, {
                    $set: {
                        'messageList.$[elem].localFile.$[file].pathFile': req.body.pathFile,
                    },
                }, {
                    arrayFilters: [{ 'elem._id': req.body.messageId }, { 'file.IdDevice': req.body.IdDevice }],
                    new: true,
                });
                if (UpdateLocalFile) {
                    return res.json({
                        result: true,
                        message: 'đã tải file trước đó, cập nhật đường dẫn file thành công',
                    });
                } else {
                    return res.send(createError(200, 'Cập nhật không thành công'));
                }
            } else {
                let UpdateLocalFile = await Conversation.findOneAndUpdate({ _id: req.body.conversationId, 'messageList._id': req.body.messageId }, {
                    $push: {
                        'messageList.$.localFile': [{
                            IdDevice: req.body.IdDevice,
                            pathFile: req.body.pathFile,
                        },],
                    },
                }, { new: true });
                if (UpdateLocalFile) {
                    return res.json({
                        result: true,
                        message: 'cập nhật đường dẫn file thành công',
                    });
                } else {
                    return res.send(createError(200, 'Cập nhật không thành công'));
                }
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log('DeleteMessageSecret,hùng', err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// xóa tất cả file trong cuộc trò chuyện
export const deleteFileConversation = async (req, res, next) => {
    try {
        if (req.body) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/deleteFileConversation',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let findConv = await Conversation.findOne({ _id: req.body.conversationId }, { _id: 1 }).lean();
            if (!findConv) {
                return res.status(200).json(createError(200, 'không có cuộc trò chuyện'));
            }
            if (req.body.userId) {
                const userId = Number(req.body.userId);
                await Conversation.updateOne({
                    _id: Number(req.body.conversationId),
                    'messageList.isEdited': 0,
                    'messageList.messageType': { $in: ['sendFile', 'sendPhoto'] },
                }, {
                    $push: { 'messageList.$[elem].listDeleteUser': userId },
                    $set: { 'messageList.$[elem].isEdited': 2 },
                }, {
                    arrayFilters: [{ 'elem.isEdited': 0, 'elem.messageType': { $in: ['sendFile', 'sendPhoto'] } }],
                    multi: true,
                });
                return res.json({
                    data: {
                        result: true,
                        message: 'Xóa tất cả file thành công',
                    },
                    error: null,
                });
            } else {
                await Conversation.updateMany({ _id: req.body.conversationId }, {
                    $pull: {
                        messageList: { messageType: { $in: ['sendFile', 'sendPhoto'] } },
                    },
                }, { new: true });
                return res.json({
                    data: {
                        result: true,
                        message: 'Xóa tất cả file thành công',
                    },
                    error: null,
                });
            }
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// Chuyển quyền quản trị viên cho người khác
export const ChangeAdmin = async (req, res, next) => {
    try {
        if (req && req.body && req.body.NewAdminId && req.body.userId && req.body.conversationId) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/ChangeAdmin',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let conv = await Conversation.findOne({ _id: req.body.conversationId }).lean();
            for (let i = 0; i < conv.memberList.length; i++) {
                if (conv.memberList[i].memberId == req.body.userId) {
                    let findconv = await Conversation.findOneAndUpdate({ _id: req.body.conversationId, adminId: req.body.userId, isGroup: 1 }, { adminId: req.body.NewAdminId }, { new: true });
                    if (findconv) {
                        res.json({
                            data: {
                                result: true,
                                message: 'Bạn đã chuyển nhượng quyền admin thành công',
                            },
                        });
                    } else
                        return res
                            .status(200)
                            .json(
                                createError(
                                    200,
                                    'Không tồn tại cuộc trò chuyện này, hoặc bạn không phải là admin , hoặc đây không phải là nhóm'
                                )
                            );
                }
            }
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//Admin Giải tán nhóm
export const DisbandGroup = async (req, res, next) => {
    try {
        if (req && req.body && req.body.AdminId && req.body.conversationId) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/DisbandGroup',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let findconv = await Conversation.findOneAndDelete({
                _id: req.body.conversationId,
                adminId: req.body.AdminId,
                isGroup: 1,
            });
            let memberList = [];
            for (let i = 0; i < findconv.memberList.length; i++) {
                memberList.push(findconv.memberList[i].memberId);
            }
            socket.emit('DisbandGroup', req.body.conversationId, memberList);
            memberList.map((userId) => {
                axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                    data: {
                        Title: 'Thông báo giải tán nhóm',
                        Message: `Nhóm ${findconv.memberList[0].conversationName} đã bị giải tán`,
                        Type: 'SendCandidate',
                        UserId: userId,
                        SenderId: req.body.AdminId,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((e) => {
                    console.log(e);
                });
            });
            if (findconv) {
                res.json({
                    data: {
                        result: true,
                        message: 'Bạn đã giải tán nhóm thành công',
                    },
                });
            } else
                return res
                    .status(200)
                    .json(
                        createError(
                            200,
                            'Không tồn tại cuộc trò chuyện này, hoặc bạn không phải là admin , hoặc đây không phải là nhóm'
                        )
                    );
        } else res.status(200).json(createError(200, 'Thông tin truyền lên không đầy đủ'));
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const GetListHiddenConversation = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListHiddenConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const userId = Number(req.body.userId);
        const listCons = await Users.aggregate([{
            $match: {
                _id: userId,
            },
        },
        {
            $lookup: {
                from: 'Conversations',
                localField: '_id',
                foreignField: 'memberList.memberId',
                as: 'conversations',
            },
        },
        {
            $project: {
                conversations: 1,
            },
        },
        {
            $unwind: {
                path: '$conversations',
            },
        },
        {
            $project: {
                conversationId: '$conversations._id',
                isGroup: '$conversations.isGroup',
                typeGroup: '$conversations.typeGroup',
                avatarConversation: '$conversations.avatarConversation',
                adminId: '$conversations.adminId',
                shareGroupFromLinkOption: '$conversations.shareGroupFromLinkOption',
                browseMemberOption: '$conversations.browseMemberOption',
                pinMessage: '$conversations.pinMessage',
                memberList: '$conversations.memberList',
                messageList: '$conversations.messageList',
                browseMemberList: '$conversations.browseMemberList',
                timeLastMessage: '$conversations.timeLastMessage',
                liveChat: '$conversations.liveChat',
                lastMess: {
                    $arrayElemAt: ['$conversations.messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$conversations.memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$conversations.messageList',
                },
            },
        },
        {
            $match: {
                memberList: {
                    $elemMatch: {
                        memberId: userId,
                        isHidden: {
                            $eq: 1,
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                adminId: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                pinMessage: 1,
                memberList: 1,
                timeLastMessage: 1,
                liveChat: 1,
                senderLastMessage: '$lastMess.senderId',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$lastMess.displayMessage',
                shareGroupFromLink: 1,
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                pinMessage: 1,
                memberList: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                liveChat: 1,
                senderLastMessage: 1,
                message: 1,
                messageType: 1,
                createAt: 1,
                messageDisplay: 1,
                isFavorite: 1,
                notification: 1,
                unReader: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: 1,
                listMember: {
                    _id: 1,
                    userName: 1,
                    type: 1,
                    fromWeb: 1,
                    createdAt: 1,
                    avatarUser: 1,
                },
            },
        },
        ]);
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName = users[0].conversationName || users[0].userName;
                avatarConversation = users[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0].conversationName ||
                    owner
                        .map((e) => (e = e.userName))
                        .slice(-2)
                        .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName ||
                    users
                        .map((e) => (e = e.userName))
                        .slice(-3)
                        .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !listCons[index].avatarConversation && avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${conversationName.substring(0, 1).toUpperCase()}_${Math.floor(Math.random() * 4) + 1
                    }.png`;
            }
            listCons[index]['conversationName'] = conversationName || owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            delete listCons[index]['memberList'];
            delete listCons[index]['listMember'];
        }
        const data = {
            result: true,
            message: 'Lấy cuộc trò chuyện bị ẩn thành công',
        };
        data['conversation'] = listCons;
        data['countConversation'] = listCons.length;
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.message));
    }
};

export const GetListConversationStrange = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let userId = Number(req.body.userId);
        let listUserFamiliar = ConvertToArrayNumber(req.body.listUserFamiliar);
        let listConsFavor = [];
        let listStrangeConvId = [];
        let listUserIdStrange = [];
        let listConv = await Conversation.find({ isGroup: 0, 'memberList.memberId': userId }, { _id: 1, 'memberList.memberId': 1 }).lean();
        for (let i = 0; i < listConv.length; i++) {
            let idOther = listConv[i].memberList.find((e) => e.memberId != userId);
            if (!listUserFamiliar.find((e) => e == idOther.memberId)) {
                listStrangeConvId.push(listConv[i]._id);
                listUserIdStrange.push(idOther);
            }
        }
        console.log('listStrangeConvId', listStrangeConvId);
        let listCons = await Conversation.aggregate([{
            $match: {
                _id: { $in: listStrangeConvId },
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },

        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        ]);

        let data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        let contact = await Contact.find({
            $or: [{ userFist: userId }, { userSecond: userId }],
        })
            .limit(100)
            .lean();
        for (let [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        for (let [index, con] of listConsFavor.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listConsFavor[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listConsFavor[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listConsFavor[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listConsFavor[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listConsFavor[index].isGroup && listConsFavor[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listConsFavor[index].conversationId}/${listConsFavor[index].avatarConversation}`;
            }
            if (listConsFavor[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listConsFavor[index].listMember = newDataMember;
            listConsFavor[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listConsFavor[index].avatarConversation = avatarConversation;
            listConsFavor[index].linkAvatar = avatarConversation;
            if (listConsFavor[index].browseMemberList.length) {
                listConsFavor[index].browseMemberList = listConsFavor[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listConsFavor[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listConsFavor[index]['listBrowse'];
            delete listConsFavor[index]['memberList'];
        }
        data['listCoversation'] = listConsFavor;
        let listPersonalId = [];
        for (let i = 0; i < listConsFavor.length; i++) {
            if (listConsFavor[i].isGroup == 0) {
                if (listConsFavor[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listConsFavor[i].listMember.find((e) => e._id != userId)._id);
                }
            }
        }
        for (let i = 0; i < listCons.length; i++) {
            if (listCons[i].isGroup == 0) {
                if (listCons[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listCons[i].listMember.find((e) => e._id != userId)._id);
                }
            }
            data['listCoversation'].push(listCons[i]);
        }
        let statusClass = await FVerifyClassArrayUser({
            body: {
                ArrayUserId: listPersonalId,
                HostId: userId,
            },
        });
        let FinalResult = [];
        for (let i = 0; i < data['listCoversation'].length; i++) {
            let e = data['listCoversation'][i];
            if (e.isGroup == 0) {
                if (e.listMember.find((e) => e._id != userId)) {
                    let IdCheck = e.listMember.find((e) => e._id != userId)._id;
                    if (statusClass.find((e) => e.userId == IdCheck)) {
                        FinalResult.push({ ...e, classInfor: statusClass.find((e) => e.userId == IdCheck) });
                    } else {
                        FinalResult.push({ ...e, classInfor: {} });
                    }
                } else {
                    FinalResult.push({ ...e, classInfor: {} });
                }
            } else {
                FinalResult.push({ ...e, classInfor: {} });
            }
        }
        data['listCoversation'] = FinalResult;
        data['listUserIdStrange'] = listUserIdStrange;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

// token , userId, CompanyId
export const GetListConversationStrange_v2 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversationStrange_v2');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let userId = Number(req.body.userId);
        // ------
        let companyId = Number(req.body.CompanyId);
        let listFriend = await Contact.find({ $or: [{ userFist: userId }, { userSecond: userId }] }).limit(10000);

        let listFriendFinal = [];
        for (let i = 0; i < listFriend.length; i++) {
            if (listFriend[i].userFist != userId) {
                listFriendFinal.push(Number(listFriend[i].userFist));
            }
            if (listFriend[i].userSecond != userId) {
                listFriendFinal.push(Number(listFriend[i].userSecond));
            }
        }
        listFriend = null; // giải phóng bộ nhớ
        if (companyId != 0) {
            let listContactCompany = await Users.find({ 'inForPerson.employee.com_id': companyId }, { _id: 1 });
            if (listContactCompany.length) {
                for (let i = 0; i < listContactCompany.length; i++) {
                    listFriendFinal.push(listContactCompany[i]._id);
                }
            }
            listContactCompany = null;
        }

        let listConversation = await Conversation.find({
            isGroup: 0,
            'memberList.1': { $exists: true },
            'messageList.senderId': userId,
        }, {
            'memberList.memberId': 1,
        });
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
        listFriendFinal.push(114803);
        // ------
        let listUserFamiliar = [...new Set(listFriendFinal)];
        let listConsFavor = [];
        let listStrangeConvId = [];
        let listUserIdStrange = [];
        let listConv = await Conversation.find({ isGroup: 0, 'memberList.memberId': userId, 'memberList.1': { $exists: true } }, { _id: 1, 'memberList.memberId': 1 }).lean();
        for (let i = 0; i < listConv.length; i++) {
            let idOther = listConv[i].memberList.find((e) => e.memberId && e.memberId != userId);
            if (idOther && idOther.memberId) {
                if (!listUserFamiliar.find((e) => e == idOther.memberId)) {
                    listStrangeConvId.push(listConv[i]._id);
                    listUserIdStrange.push(idOther);
                }
            }
        }

        let listCons = await Conversation.aggregate([{
            $match: {
                _id: { $in: listStrangeConvId },
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
                'memberList.1': { $exists: true },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },

        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $match: {
                'memberList.1': { $exists: true },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        ]);

        let data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        let contact = await Contact.find({
            $or: [{ userFist: userId }, { userSecond: userId }],
        })
            .limit(100)
            .lean();
        for (let [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        for (let [index, con] of listConsFavor.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listConsFavor[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listConsFavor[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listConsFavor[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listConsFavor[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listConsFavor[index].isGroup && listConsFavor[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listConsFavor[index].conversationId}/${listConsFavor[index].avatarConversation}`;
            }
            if (listConsFavor[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listConsFavor[index].listMember = newDataMember;
            listConsFavor[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listConsFavor[index].avatarConversation = avatarConversation;
            listConsFavor[index].linkAvatar = avatarConversation;
            if (listConsFavor[index].browseMemberList.length) {
                listConsFavor[index].browseMemberList = listConsFavor[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listConsFavor[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listConsFavor[index]['listBrowse'];
            delete listConsFavor[index]['memberList'];
        }
        data['listCoversation'] = listConsFavor;
        let listPersonalId = [];
        for (let i = 0; i < listConsFavor.length; i++) {
            if (listConsFavor[i].isGroup == 0) {
                if (listConsFavor[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listConsFavor[i].listMember.find((e) => e._id != userId)._id);
                }
            }
        }
        for (let i = 0; i < listCons.length; i++) {
            if (listCons[i].isGroup == 0) {
                if (listCons[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listCons[i].listMember.find((e) => e._id != userId)._id);
                }
            }
            data['listCoversation'].push(listCons[i]);
        }
        let statusClass = await FVerifyClassArrayUser({
            body: {
                ArrayUserId: listPersonalId,
                HostId: userId,
            },
        });
        let FinalResult = [];
        for (let i = 0; i < data['listCoversation'].length; i++) {
            let e = data['listCoversation'][i];
            if (e.isGroup == 0) {
                if (e.listMember.find((e) => e._id != userId)) {
                    let IdCheck = e.listMember.find((e) => e._id != userId)._id;
                    if (statusClass.find((e) => e.userId == IdCheck)) {
                        FinalResult.push({ ...e, classInfor: statusClass.find((e) => e.userId == IdCheck) });
                    } else {
                        FinalResult.push({ ...e, classInfor: {} });
                    }
                } else {
                    FinalResult.push({ ...e, classInfor: {} });
                }
            } else {
                FinalResult.push({ ...e, classInfor: {} });
            }
        }
        data['listCoversation'] = FinalResult;
        data['listUserIdStrange'] = listUserIdStrange;
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

export const DeleteAllMessageOneSide = async (req, res) => {
    try {
        if (
            req.body.token &&
            req.body.conversationId &&
            req.body.userId &&
            !isNaN(req.body.conversationId) &&
            !isNaN(req.body.userId)
        ) {
            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/DeleteAllMessageOneSide',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == Number(req.body.userId)) {
                console.log('Token hop le, DeleteAllMessageOneSide');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
            let userId = Number(req.body.userId);
            let conversationId = Number(req.body.conversationId);
            let conversation = await Conversation.findOne({ _id: Number(req.body.conversationId) }, { 'memberList.memberId': 1 }).lean();
            if (
                conversation.memberList &&
                conversation.memberList.length &&
                conversation.memberList.find((e) => e.memberId == userId)
            ) {
                await Conversation.updateOne({ _id: conversationId, 'messageList.isEdited': 0 }, {
                    $push: { 'messageList.$[elem].listDeleteUser': userId },
                    $set: { 'messageList.$[elem].isEdited': 2 },
                }, { arrayFilters: [{ 'elem.isEdited': 0 }], multi: true });
                await Conversation.updateOne({ _id: conversationId }, {
                    $push: {
                        listDeleteMessageOneSite: userId,
                    },
                });
                return res.json({
                    data: {
                        result: true,
                        message: 'Delete Successfully',
                    },
                });
            } else {
                console.log('DeleteAllMessageOneSide', e);
                return res.status(200).json(createError(200, 'Deleted failed'));
            }
        }
    } catch (err) {
        console.log('DeleteAllMessageOneSide', err);
        return res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const GetCommonConversation = async (req, res) => {
    try {
        if (req.body.userId && req.body.contactId) {
            console.log(req.body);
            const userId = Number(req.body.userId);
            const contactId = Number(req.body.contactId);

            let listCons = await Conversation.aggregate([{
                $match: {
                    $and: [
                        { 'memberList.memberId': userId },
                        { 'memberList.memberId': contactId },
                        { listDeleteMessageOneSite: { $ne: userId } },
                        { isGroup: 1 },
                    ],
                },
            },
            {
                $match: {
                    'messageList.0': {
                        $exists: true,
                    },
                },
            },
            {
                $sort: {
                    timeLastMessage: -1,
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'browseMemberList.memberBrowserId',
                    foreignField: '_id',
                    as: 'listBrowse',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'memberList.memberId',
                    foreignField: '_id',
                    as: 'listMember',
                },
            },
            {
                $project: {
                    _id: 0,
                    conversationId: '$_id',
                    isGroup: 1,
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: '$avatarConversation',
                    adminId: 1,
                    shareGroupFromLinkOption: 1,
                    browseMemberOption: 1,
                    browseMemberList: 1,
                    listBrowse: 1,
                    pinMessage: 1,
                    memberList: 1,
                    listMember: 1,
                    messageList: 1,
                    listBrowse: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    lastMess: {
                        $reduce: {
                            input: { $reverseArray: '$messageList' },

                            initialValue: null,
                            in: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $eq: [{ $indexOfArray: ['$$this.listDeleteUser', userId] }, -1] },
                                            { $eq: [{ $indexOfArray: ['$lastMess.listDeleteUser', userId] }, -1] },
                                        ],
                                    },
                                    then: '$$this',
                                    else: {
                                        $cond: {
                                            if: {
                                                $eq: [{ $indexOfArray: ['$$value.listDeleteUser', userId] }, -1],
                                            },
                                            then: '$$value',
                                            else: '$$this',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    sender: {
                        $filter: {
                            input: '$memberList',
                            as: 'mem',
                            cond: {
                                $eq: ['$$mem.memberId', userId],
                            },
                        },
                    },
                    countMessage: {
                        $size: '$messageList',
                    },
                },
            },

            {
                $unwind: {
                    path: '$sender',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    adminId: 1,
                    browseMember: '$browseMemberOption',
                    pinMessageId: '$pinMessage',
                    memberList: 1,
                    messageList: 1,
                    listMember: 1,
                    listBrowse: 1,
                    browseMemberList: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    messageId: '$lastMess._id',
                    countMessage: 1,
                    unReader: '$sender.unReader',
                    message: '$lastMess.message',
                    messageType: '$lastMess.messageType',
                    createAt: '$lastMess.createAt',
                    messageDisplay: '$sender.messageDisplay',
                    senderId: '$lastMess.senderId',
                    shareGroupFromLink: '$shareGroupFromLinkOption',
                    isFavorite: '$sender.isFavorite',
                    notification: '$sender.notification',
                    isHidden: '$sender.isHidden',
                    deleteTime: '$sender.deleteTime',
                    deleteType: '$sender.deleteType',
                    timeLastSeener: '$sender.timeLastSeener',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    adminId: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    shareGroupFromLink: 1,
                    browseMember: 1,
                    pinMessageId: 1,
                    memberList: {
                        memberId: 1,
                        conversationName: 1,
                        unReader: 1,
                        messageDisplay: 1,
                        isHidden: 1,
                        isFavorite: 1,
                        notification: 1,
                        timeLastSeener: 1,
                        deleteTime: 1,
                        deleteType: 1,
                        favoriteMessage: 1,
                        liveChat: 1,
                    },
                    browseMemberList: 1,
                    timeLastMessage: {
                        $dateToString: {
                            date: '$timeLastMessage',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    timeLastChange: 1,
                    liveChat: 1,
                    message: 1,
                    unReader: 1,
                    messageType: 1,
                    createAt: {
                        $dateToString: {
                            date: '$createAt',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    messageDisplay: 1,
                    messageId: 1,
                    isFavorite: 1,
                    senderId: 1,
                    notification: 1,
                    isHidden: 1,
                    countMessage: 1,
                    deleteTime: 1,
                    deleteType: 1,
                    timeLastSeener: {
                        $dateToString: {
                            date: '$timeLastSeener',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    listMember: {
                        $map: {
                            input: '$listMember',
                            as: 'member',
                            in: {
                                _id: '$$member._id',
                                id365: '$$member.idQLC',
                                type365: '$$member.type',
                                email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                                password: '$$member.password',
                                phone: '$$member.phone',
                                userName: '$$member.userName',
                                avatarUser: '$$member.avatarUser',
                                linkAvatar: '',
                                status: '$$member.status',
                                statusEmotion: '$$member.configChat.statusEmotion',
                                lastActive: '$$member.lastActivedAt',
                                active: '$$member.active',
                                isOnline: '$$member.isOnline',
                                companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                                idTimViec: '$$member.idTimViec365',
                                fromWeb: '$$member.fromWeb',
                                createdAt: '$$member.createdAt',
                            },
                        },
                    },
                    listBrowse: {
                        $map: {
                            input: '$listBrowse',
                            as: 'browse',
                            in: {
                                _id: '$$browse._id',
                                userName: '$$browse.userName',
                                avatarUser: '$$browse.avatarUser',
                                linkAvatar: '',
                                status: '$$browse.status',
                                statusEmotion: '$$browse.configChat.statusEmotion',
                                lastActive: '$$browse.lastActivedAt',
                                active: '$$browse.active',
                                isOnline: '$$browse.isOnline',
                            },
                        },
                    },
                },
            },
            {
                $sort: {
                    timeLastMessage: -1,
                },
            },
            ]);

            let data = {
                result: true,
                message: 'Lấy danh sách cuộc trò chuyện thành công',
            };
            let contact = await Contact.find({
                $or: [{ userFist: userId }, { userSecond: userId }],
            })
                .limit(100)
                .lean();
            for (let [index, con] of listCons.entries()) {
                const { memberList, listMember } = con;
                const newDataMember = listMember.map((e) => {
                    e['id'] = e._id;
                    const user = memberList.find((mem) => mem.memberId === e._id);
                    e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                    e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                    // e.avatarUser = e.avatarUser
                    //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                    //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                    //     .substring(0, 1)
                    //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                    let relationShip = contact.find((e) => {
                        if (e.userFist == userId && e.userSecond == user.memberId) {
                            return true;
                        }
                        if (e.userSecond == userId && e.userFist == user.memberId) {
                            return true;
                        }
                    });
                    e['friendStatus'] = relationShip ? 'friend' : 'none';
                    e.linkAvatar = e.avatarUser;
                    e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                    if (user && user.timeLastSeener) {
                        e.timeLastSeenerApp = `${JSON.parse(
                            JSON.stringify(
                                new Date(
                                    new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                                )
                            )
                        ).replace('Z', '')}+07:00`;
                    }
                    return (e = { ...e, ...user });
                });
                const users = newDataMember.filter((mem) => mem._id !== userId);
                const owner = newDataMember.filter((mem) => mem._id === userId);
                let conversationName = owner[0].conversationName || owner[0].userName;
                let avatarConversation;
                if (!listCons[index].isGroup) {
                    if (!users[0]) {
                        conversationName = owner[0].userName;
                    } else {
                        conversationName = owner[0].conversationName || users[0].userName;
                    }
                    avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
                }
                if (listCons[index].isGroup && listMember.length === 2) {
                    conversationName =
                        users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
                }
                if (listCons[index].isGroup && listMember.length === 3) {
                    conversationName =
                        owner[0].conversationName != '' ?
                            owner[0].conversationName :
                            users
                                .map((e) => (e = e.userName))
                                .slice(-2)
                                .join(',');
                }
                if (listCons[index].isGroup && listMember.length > 3) {
                    conversationName =
                        owner[0].conversationName != '' ?
                            owner[0].conversationName :
                            users
                                .map((e) => (e = e.userName))
                                .slice(-3)
                                .join(',');
                }
                if (con.conversationId == 60596) { }
                if (listCons[index].isGroup && listCons[index].avatarConversation) {
                    avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
                }
                if (listCons[index].isGroup && !avatarConversation) {
                    avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                        .substring(0, 1)
                        .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                }
                listCons[index].listMember = newDataMember;
                listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
                listCons[index].avatarConversation = avatarConversation;
                listCons[index].linkAvatar = avatarConversation;
                if (listCons[index].browseMemberList.length) {
                    listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                        const memberBrowserId = e.memberBrowserId;
                        const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                        if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                            if (dataBrowerMem && dataBrowerMem.lastActive) {
                                dataBrowerMem.lastActive =
                                    date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                    date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                            } else {
                                dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                            }
                            if (dataBrowerMem && dataBrowerMem.avatarUser) {
                                dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                    `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                    `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(
                                        dataBrowerMem.userName
                                    )
                                        .substring(0, 1)
                                        .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                            }
                            return (e = {
                                userMember: dataBrowerMem,
                                memberAddId: e.memberAddId,
                            });
                        }
                    });
                }
                delete listCons[index]['listBrowse'];
                delete listCons[index]['memberList'];
            }
            data['listCoversation'] = [];
            let listPersonalId = [];
            for (let i = 0; i < listCons.length; i++) {
                if (listCons[i].isGroup == 0) {
                    if (listCons[i].listMember.find((e) => e._id != userId)) {
                        listPersonalId.push(listCons[i].listMember.find((e) => e._id != userId)._id);
                    }
                }
                data['listCoversation'].push(listCons[i]);
            }
            let statusClass = await FVerifyClassArrayUser({
                body: {
                    ArrayUserId: listPersonalId,
                    HostId: userId,
                },
            });
            let FinalResult = [];
            for (let i = 0; i < data['listCoversation'].length; i++) {
                let e = data['listCoversation'][i];
                if (e.isGroup == 0) {
                    if (e.listMember.find((e) => e._id != userId)) {
                        let IdCheck = e.listMember.find((e) => e._id != userId)._id;
                        if (statusClass.find((e) => e.userId == IdCheck)) {
                            FinalResult.push({ ...e, classInfor: statusClass.find((e) => e.userId == IdCheck) });
                        } else {
                            FinalResult.push({ ...e, classInfor: {} });
                        }
                    } else {
                        FinalResult.push({ ...e, classInfor: {} });
                    }
                } else {
                    FinalResult.push({ ...e, classInfor: {} });
                }
            }
            data['listCoversation'] = FinalResult;
            return res.send({ data, error: null });
        } else {
            res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const AddNewMemberToListGroup = async (req, res) => {
    try {
        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/AddNewMemberToListGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const senderId = Number(req.body.senderId);
        const senderName = req.body.senderName;
        const memberId = Number(req.body.memberId);
        const memberName = req.body.memberName;
        let listConvId = req.body.listConversationId.replace('[', '').replace(']', '').split(',');
        const listConvName = req.body.listConversationName.replace('[', '').replace(']', '').split(',');

        listConvId.map((convId, index) => {
            const member = {
                _id: memberId,
                conversationName: listConvName[index],
            };
            Conversation.updateOne({ _id: Number(convId), 'memberList.memberId': senderId }, { $push: { memberList: member }, $set: { timeLastChange: Date.now() } }).catch((e) => {
                console.log(e);
            });
            FSendMessage({
                body: {
                    ConversationID: Number(convId),
                    SenderID: senderId,
                    MessageType: 'notification',
                    Message: `${senderName} đã thêm ${memberName} vào cuộc trò chuyện`,
                },
            }).catch((e) => {
                console.log('Err sendmess AddNewMemberToListGroup', e);
            });
        });
        res.json({
            data: {
                result: true,
                message: 'Thêm thành viên thành công',
            },
            error: null,
        });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

export const ChangeAdminGroup = async (req, res) => {
    try {
        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/ChangeAdminGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        if (req.body.token) {
            let check = await checkToken(req.body.token);
            let flag = false;
            if (check && check.status && check.userId == req.body.senderId) {
                flag = true;
            } else if (Number(req.body.senderId) == -1) {
                flag = true;
            } else if (Number(req.body.senderId) == 0) {
                flag = true;
            } else if (Number(req.body.senderId) == 1) {
                flag = true;
            }
            if (flag) {
                const senderId = Number(req.body.senderId);
                const alternative_admin = Number(req.body.alternative);
                const conversationId = Number(req.body.conversationId);
                const conversationName = req.body.conversationName;
                const query = {
                    _id: conversationId,
                    $and: [{ 'memberList.memberId': alternative_admin }],
                    isGroup: 1,
                };
                let con_check = await Conversation.findOne({
                    $and: [
                        { _id: conversationId },
                        { 'memberList.memberId': alternative_admin },
                        { 'memberList.memberId': senderId },
                        { isGroup: 1 },
                        { adminId: senderId },
                    ],
                }, { _id: 1 }).lean();
                if (con_check) {
                    const deputyAdminId = con_check.deputyAdminId ? con_check.deputyAdminId : [];
                    if (deputyAdminId.includes(alternative_admin)) {
                        deputyAdminId.splice(deputyAdminId.indexOf(alternative_admin), 1);
                    }
                    const update = {
                        $set: {
                            timeLastChange: Date.now(),
                            adminId: alternative_admin,
                            deputyAdminId: deputyAdminId,
                        },
                    };
                    const con = await Conversation.findOneAndUpdate(query, update);
                    if (!con) return res.send(createError(200, 'Chuyển quyền thất bại'));
                    const listUser = await Users.find({ _id: { $in: [senderId, alternative_admin] } }, { _id: 1, userName: 1 });
                    const senderName = listUser[0]._id === senderId ? listUser[0].userName : listUser[1].userName;
                    const alternative_admin_name =
                        listUser[0]._id === alternative_admin ? listUser[0].userName : listUser[1].userName;
                    FSendMessage({
                        body: {
                            ConversationID: conversationId,
                            SenderID: senderId,
                            MessageType: 'notification',
                            Message: `${senderName} vừa chuyển quyền trưởng nhóm cho ${alternative_admin_name}`,
                        },
                    }).catch((e) => {
                        console.log('Err sendmess AddNewMemberToGroupV2', e);
                    });
                    const data = {
                        result: true,
                        message: 'Chuyển quyền thành công',
                    };
                    con.memberList = null;
                    data['conversation_info'] = con;
                    res.send({ data, error: null });
                } else {
                    return res.send(createError(200, 'Failed Permission'));
                }
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
    } catch (err) {
        if (err) {
            console.log(err);
            return res.send(createError(200, err.message));
        }
    }
};

export const AddNewMemberToGroupV2 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, AddNewMemberToGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/AddNewMemberToGroupV2',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        let memberList = JSON.parse(req.body.memberList);
        const senderId = Number(req.body.senderId);
        const conversationId = Number(req.body.conversationId);
        const conversationName = req.body.conversationName;
        const status = req.body.status;

        let con_check = await Conversation.findOne({
            _id: conversationId,
            $and: [{ 'memberList.memberId': { $nin: memberList } }, { 'memberList.memberId': senderId }],
            isGroup: 1,
        }, { _id: 1, requestAdmin: 1, adminId: 1, memberApproval: 1, deputyAdminId: 1, typeGroup: 1 }).lean();
        const requestAdmin = con_check.requestAdmin || [];
        const memberApproval = con_check.memberApproval == null ? 1 : con_check.memberApproval;
        const deputyAdminId = con_check.deputyAdminId ? con_check.deputyAdminId : [];

        if (
            con_check &&
            (con_check.adminId === senderId ||
                deputyAdminId.includes(senderId) ||
                con_check.adminId === 0 ||
                con_check.adminId === -1 ||
                memberApproval === 0 ||
                memberApproval === 2 ||
                con_check.typeGroup.includes('liveChat'))
        ) {
            //luồng admin(có trưởng nhóm) || luồng không có trưởng nhóm
            let memList = memberList.map((e) => {
                return {
                    memberId: e,
                    conversationName: conversationName || '',
                };
            });
            memList = status && status === 'deciline' ? [] : memList;
            const con = await Conversation.findOneAndUpdate({
                _id: conversationId,
                $and: [{ 'memberList.memberId': { $nin: memberList } }, { 'memberList.memberId': senderId }],
                isGroup: 1,
            }, {
                $push: { memberList: { $each: memList } },
                $pull: { requestAdmin: { userId: { $in: memberList } } },
                $set: { timeLastChange: Date.now() },
            }, {
                projection: { _id: 1, memberList: 1 },
            });
            if (!con) return res.send(createError(200, 'Thêm thành viên vào nhóm thất bại'));
            const listMember = [];
            con.memberList.map((member) => listMember.push(member.memberId));
            socket.emit('AddNewMemberToGroup', conversationId, memberList, listMember);
            const listUser = await Users.find({ _id: { $in: memberList } }, { _id: 1, userName: 1 });
            if (memList.length != 0) {
                //Đã được duyệt
                listUser.map((user) => {
                    FSendMessage({
                        body: {
                            ConversationID: conversationId,
                            SenderID: senderId,
                            MessageType: 'notification',
                            Message: `${senderId} added ${user._id} to this consersation`,
                        },
                    }).catch((e) => {
                        console.log('Err sendmess AddNewMemberToGroupV2', e);
                    });
                    const index = requestAdmin.findIndex((item) => item.userId == user._id);
                    if (index >= 0) {
                        axios({
                            method: 'post',
                            url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                            data: {
                                Title: 'Thông báo duyệt thành viên',
                                Message: `Yêu cầu thêm ${user.userName} vào cuộc trò chuyên ${conversationName} đã được chấp nhận`,
                                Type: 'SendCandidate',
                                UserId: requestAdmin[index].userSuggest,
                                ConversationId: conversationId,
                                SenderId: con_check.adminId,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }).catch((e) => {
                            console.log(e);
                        });
                        if (requestAdmin[index].messageId) {
                            axios({
                                method: 'post',
                                url: 'http://210.245.108.202:9000/api/message/DeleteMessage',
                                data: {
                                    MessageID: requestAdmin[index].messageId,
                                    ConversationID: conversationId,
                                },
                                headers: { 'Content-Type': 'multipart/form-data' },
                            }).catch((e) => {
                                console.log(e);
                            });
                            const messageInfo = {
                                ConversationID: conversationId,
                                MessageID: requestAdmin[index].messageId,
                            };
                            socket.emit('DeleteMessage', messageInfo, listMember);
                        }
                    }
                });
            } else {
                //Luồng từ chối
                listUser.map((user) => {
                    let index = requestAdmin.findIndex((item) => item.request == 'add' && item.userId == user._id);
                    axios({
                        method: 'post',
                        url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                        data: {
                            Title: 'Thông báo duyệt thành viên',
                            Message: `Yêu cầu thêm ${user.userName} vào cuộc trò chuyên ${conversationName} đã bị từ chối`,
                            Type: 'SendCandidate',
                            UserId: requestAdmin[index].userSuggest,
                            ConversationId: conversationId,
                            SenderId: con_check.adminId,
                        },
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }).catch((e) => {
                        console.log(e);
                    });
                    if (requestAdmin[index].messageId) {
                        axios({
                            method: 'post',
                            url: 'http://43.239.223.142:9000/api/message/DeleteMessage',
                            data: {
                                MessageID: requestAdmin[index].messageId,
                                ConversationID: conversationId,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }).catch((e) => {
                            console.log(e);
                        });
                        const messageInfo = {
                            ConversationID: conversationId,
                            MessageID: requestAdmin[index].messageId,
                        };
                        socket.emit('DeleteMessage', messageInfo, listMember);
                    }
                });
            }
            const data = {
                result: true,
                message: 'Thêm thành viên vào nhóm thành công',
            };
            return res.send({ data, error: null });
        } else if (con_check) {
            //luồng thành viên(có trưởng nhóm)
            memberList.map((member) => {
                const index = requestAdmin.findIndex(
                    (item) => item.userId === Number(member) && item.userSuggest === Number(senderId)
                );
                if (index == -1) {
                    requestAdmin.push({
                        userId: Number(member),
                        userSuggest: Number(senderId),
                        request: 'add',
                    });
                }
            });
            const con = await Conversation.findOneAndUpdate({
                _id: conversationId,
                $and: [{ 'memberList.memberId': { $nin: memberList } }, { 'memberList.memberId': senderId }],
                isGroup: 1,
            }, {
                // $push: { requestAdmin: { $each: memList } },
                $set: {
                    requestAdmin: requestAdmin,
                    timeLastChange: Date.now(),
                },
            }, {
                projection: { _id: 1, requestAdmin: 1 },
            });
            if (!con) return res.send(createError(200, 'Thêm thành viên vào nhóm thất bại'));
            const listUser = await Users.find({ _id: { $in: [senderId, ...memberList] } }, { _id: 1, userName: 1 }).lean();
            let index = listUser.findIndex((user) => user._id === senderId);
            const senderName = listUser[index].userName;
            await Promise.all(
                listUser.map(async (user) => {
                    if (user._id != senderId) {
                        const memberName = user.userName;
                        axios({
                            method: 'post',
                            url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                            data: {
                                Title: 'Yêu cầu thêm thành viên',
                                Message: `${senderName} yêu cầu thêm ${memberName} vào cuộc trò chuyện ${conversationName}`,
                                Type: 'SendCandidate',
                                UserId: con_check.adminId,
                                ConversationId: conversationId,
                                SenderId: senderId,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }).catch((e) => {
                            console.log(e);
                        });
                        deputyAdminId.map((userId) => {
                            axios({
                                method: 'post',
                                url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                                data: {
                                    Title: 'Yêu cầu thêm thành viên',
                                    Message: `${senderName} yêu cầu thêm ${memberName} vào cuộc trò chuyện ${conversationName}`,
                                    Type: 'SendCandidate',
                                    UserId: userId,
                                    ConversationId: conversationId,
                                    SenderId: senderId,
                                },
                                headers: { 'Content-Type': 'multipart/form-data' },
                            }).catch((e) => {
                                console.log(e);
                            });
                        });
                        const mess = {
                            message: `${senderName} yêu cầu thêm ${memberName} vào cuộc trò chuyện`,
                            request: 'add',
                            conversationId: conversationId,
                            memberList: [user._id],
                            adminId: con_check.adminId,
                            deputyAdminId,
                        };
                        let sendmes = await axios({
                            method: 'post',
                            url: 'http://210.245.108.202:9000/api/message/SendMessage',
                            data: {
                                ConversationID: conversationId,
                                SenderID: senderId,
                                MessageType: 'notificationGroup',
                                Message: JSON.stringify(mess),
                                dev: 'dev',
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        let indx = requestAdmin.findIndex(
                            (item) => item.userId === Number(user._id) && item.userSuggest === Number(senderId)
                        );
                        requestAdmin[indx].messageId = sendmes.data.data.messageId;
                    }
                })
            );
            await Conversation.findOneAndUpdate({ _id: conversationId }, { $set: { requestAdmin: requestAdmin } });
            const data = {
                result: true,
                message: 'Thêm thành viên vào nhóm thành công',
                conversation_info: con,
            };
            return res.send({ data, error: null });
        } else {
            return res.send(createError(200, 'Thông tin truyền lên không chính xác'));
        }
    } catch (err) {
        if (err) {
            console.log(err);
            return res.send(createError(200, err.message));
        }
    }
};

export const GetListRequestAdmin = async (req, res) => {
    try {
        const userId = Number(req.body.userId);
        const conversationId = Number(req.body.conversationId);
        const status = req.body.status || '';
        const type = status === 'add' ? ['add'] : status === 'delete' ? ['delete'] : ['add', 'delete'];

        const conv = await Conversation.findOne({
            $or: [{ adminId: userId }, { deputyAdminId: userId }],
            _id: conversationId,
            'memberList.memberId': userId,
        }, { requestAdmin: 1 });
        if (!conv) {
            return res.send(createError(200, 'Thông tin truyền lên không chính xác'));
        }

        const data = await Conversation.aggregate([{
            $match: {
                _id: conversationId,
                'memberList.memberId': userId,
            },
        },
        {
            $project: {
                requestAdmin: {
                    $filter: {
                        input: '$requestAdmin',
                        as: 'req',
                        cond: {
                            $in: ['$$req.request', type],
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: '$requestAdmin',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'requestAdmin.userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'requestAdmin.userSuggest',
                foreignField: '_id',
                as: 'userSuggest',
            },
        },
        {
            $unwind: {
                path: '$user',
            },
        },
        {
            $unwind: {
                path: '$userSuggest',
            },
        },
        {
            $project: {
                userId: '$user._id',
                avatarUser: '$user.avatarUser',
                userName: '$user.userName',
                type365: '$user.type',
                fromWeb: '$user.fromWeb',
                createdAt: '$user.createdAt',
                userNameSuggest: '$userSuggest.userName',
                request: '$requestAdmin.request',
                reasonForDelete: '$requestAdmin.reasonForDelete',
            },
        },
        ]);
        let dataAdd = [],
            dataDelete = [];
        for (let i = 0; i < data.length; i++) {
            // if (data[i].avatarUser !== '') {
            //   data[i].avatarUser = `${urlImgHost()}/avatarUser/${data[i].userId}/${data[i].avatarUser}`
            // }
            // else {
            //   data[i].avatarUser = `${urlImgHost()}/avatar/${data[i].userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
            // }
            data[i].avatarUserSmall = GetAvatarUserSmall(data[i]._id, data[i].userName, data[i].avatarUser);
            data[i].avatarUser = GetAvatarUser(
                data[i]._id,
                data[i].type365,
                data[i].fromWeb,
                data[i].createdAt,
                data[i].userName,
                data[i].avatarUser
            );
            if (data[i].request === 'add') {
                delete data[i].reasonForDelete;
                dataAdd.push(data[i]);
            } else {
                dataDelete.push(data[i]);
            }
        }
        return res.json({
            data: {
                result: true,
                message: 'Lấy danh sách thành công',
                add: dataAdd,
                delete: dataDelete,
            },
            error: null,
        });
    } catch (err) {
        console.log(err);
        return res.send(createError(200, err.message));
    }
};

export const DeleteMemberToGroup = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, AddNewMemberToGroup');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/DeleteMemberToGroup',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const memberList = JSON.parse(req.body.memberList);
        const senderId = Number(req.body.senderId);
        const conversationId = Number(req.body.conversationId);
        const reasonForDelete = req.body.reasonForDelete || '';
        const status = req.body.status;

        let con_check = await Conversation.findOne({
            $and: [
                { _id: conversationId },
                { 'memberList.memberId': { $in: memberList } },
                { 'memberList.memberId': senderId },
                { isGroup: 1 },
            ],
        }, { _id: 1, requestAdmin: 1, adminId: 1, memberApproval: 1, deputyAdminId: 1, 'memberList.memberId': 1 }).lean();
        const requestAdmin = con_check.requestAdmin || [];
        const memberApproval = con_check.memberApproval == null ? 1 : con_check.memberApproval;
        const deputyAdminId = con_check.deputyAdminId ? con_check.deputyAdminId : [];
        if (
            con_check &&
            con_check.memberList.length > 2 &&
            (con_check.adminId === senderId ||
                deputyAdminId.includes(senderId) ||
                con_check.adminId === 0 ||
                con_check.adminId === -1 ||
                memberApproval === 2)
        ) {
            //luồng admin(có trưởng nhóm) || luồng không có trưởng nhóm
            const member = status && status === 'deciline' ? [] : memberList;
            let con;
            if (status && status === 'deciline') {
                con = await Conversation.updateOne({
                    $and: [
                        { _id: conversationId },
                        { 'memberList.memberId': { $in: memberList } },
                        { 'memberList.memberId': senderId },
                        { isGroup: 1 },
                    ],
                }, {
                    $pull: {
                        memberList: { memberId: { $in: member } },
                        requestAdmin: { userId: { $in: memberList }, userSuggest: senderId },
                    },
                    $set: { timeLastChange: Date.now() },
                }, {
                    projection: { _id: 1, 'memberList.conversationName': 1 },
                });
            } else {
                con = await Conversation.updateOne({
                    $and: [
                        { _id: conversationId },
                        { 'memberList.memberId': { $in: memberList } },
                        { 'memberList.memberId': senderId },
                        { isGroup: 1 },
                    ],
                }, {
                    $pull: {
                        memberList: { memberId: { $in: member } },
                        requestAdmin: { userId: { $in: memberList } },
                    },
                    $set: { timeLastChange: Date.now() },
                }, {
                    projection: { _id: 1, 'memberList.conversationName': 1, 'memberList.memberId': 1 },
                });
            }
            if (!con) return res.send(createError(200, 'Xóa thành viên khỏi nhóm thất bại'));
            const listUser = await Users.find({ _id: { $in: memberList } }, { _id: 1, userName: 1 });
            let listMember = [];
            con.memberList.map((member) => listMember.push(member.memberId));
            if (status !== 'deciline') {
                listUser.map((user) => {
                    FSendMessage({
                        body: {
                            ConversationID: conversationId,
                            SenderID: senderId,
                            MessageType: 'notification',
                            Message: `${senderId} has removed ${user._id} from this conversation`,
                        },
                    }).catch((e) => {
                        console.log('Err sendmess AddNewMemberToGroupV2', e);
                    });
                    let index = requestAdmin.findIndex((item) => item.request == 'delete' && item.userId == user._id);
                    if (index >= 0) {
                        axios({
                            method: 'post',
                            url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                            data: {
                                Title: 'Thông báo duyệt thành viên',
                                Message: `Yêu cầu xóa ${user.userName} khỏi cuộc trò chuyên ${con.memberList[0].conversationName} đã được phê duyệt`,
                                Type: 'SendCandidate',
                                UserId: requestAdmin[index].userSuggest,
                                ConversationId: conversationId,
                                SenderId: con_check.adminId,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }).catch((e) => {
                            console.log(e);
                        });
                    }
                    if (requestAdmin[index].messageId) {
                        axios({
                            method: 'post',
                            url: 'http://210.245.108.202:9000/api/message/DeleteMessage',
                            data: {
                                MessageID: requestAdmin[index].messageId,
                                ConversationID: conversationId,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }).catch((e) => {
                            console.log(e);
                        });
                        const messageInfo = {
                            ConversationID: conversationId,
                            MessageID: requestAdmin[index].messageId,
                        };
                        socket.emit('DeleteMessage', messageInfo, listMember);
                    }
                });
            } else {
                listUser.map((user) => {
                    let index = requestAdmin.findIndex((item) => item.request == 'delete' && item.userId == user._id);
                    axios({
                        method: 'post',
                        url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                        data: {
                            Title: 'Thông báo duyệt thành viên',
                            Message: `Yêu cầu xóa ${user.userName} khỏi cuộc trò chuyên ${con.memberList[0].conversationName} đã bị từ chối`,
                            Type: 'SendCandidate',
                            UserId: requestAdmin[index].userSuggest,
                            ConversationId: conversationId,
                            SenderId: con_check.adminId,
                        },
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }).catch((e) => {
                        console.log(e);
                    });
                    if (requestAdmin[index].messageId) {
                        axios({
                            method: 'post',
                            url: 'http://210.245.108.202:9000/api/message/DeleteMessage',
                            data: {
                                MessageID: requestAdmin[index].messageId,
                                ConversationID: conversationId,
                            },
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }).catch((e) => {
                            console.log(e);
                        });
                        const messageInfo = {
                            ConversationID: conversationId,
                            MessageID: requestAdmin[index].messageId,
                        };
                        socket.emit('DeleteMessage', messageInfo, listMember);
                    }
                });
            }
            const data = {
                result: true,
                message: 'Xóa thành viên khỏi nhóm thành công',
            };
            return res.send({ data, error: null });
        } else if (con_check && con_check.memberList.length > 2) {
            //luồng thành viên(có trưởng nhóm)
            memberList.map((member) => {
                const index = requestAdmin.findIndex(
                    (item) => item.userId === Number(member) && item.userSuggest === Number(senderId)
                );
                if (index == -1) {
                    requestAdmin.push({
                        userId: Number(member),
                        userSuggest: Number(senderId),
                        reasonForDelete: reasonForDelete,
                        request: 'delete',
                    });
                } else if (index != -1) {
                    requestAdmin[index].reasonForDelete = reasonForDelete;
                }
            });
            const con = await Conversation.findOneAndUpdate({
                $and: [
                    { _id: conversationId },
                    { 'memberList.memberId': { $in: memberList } },
                    { 'memberList.memberId': senderId },
                    { isGroup: 1 },
                ],
            }, {
                $set: {
                    requestAdmin: requestAdmin,
                    timeLastChange: Date.now(),
                },
            }, {
                projection: { _id: 1, memberList: 1 },
            });
            if (!con) return res.send(createError(200, 'Xóa thành viên khỏi nhóm thất bại'));
            const listUser = await Users.find({ _id: { $in: [senderId, Number(memberList[0])] } }, { _id: 1, userName: 1 }).lean();
            const index = listUser.findIndex((user) => user._id === senderId);
            const senderName = index === 0 ? listUser[0].userName : listUser[1].userName;
            const memberName = index === 0 ? listUser[1].userName : listUser[0].userName;
            axios({
                method: 'post',
                url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                data: {
                    Title: 'Yêu cầu xóa thành viên',
                    Message: `${senderName} yêu cầu xóa ${memberName} khỏi cuộc trò chuyện ${con.memberList[0].conversationName}`,
                    Type: 'SendCandidate',
                    UserId: con_check.adminId,
                    ConversationId: conversationId,
                    SenderId: senderId,
                },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((e) => {
                console.log(e);
            });
            deputyAdminId.map((userId) => {
                axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2',
                    data: {
                        Title: 'Yêu cầu thêm thành viên',
                        Message: `${senderName} yêu cầu xóa ${memberName} khỏi cuộc trò chuyện ${con.memberList[0].conversationName}`,
                        Type: 'SendCandidate',
                        UserId: userId,
                        ConversationId: conversationId,
                        SenderId: senderId,
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((e) => {
                    console.log(e);
                });
            });
            const mess = {
                message: `${senderName} yêu cầu xóa ${memberName} khỏi cuộc trò chuyện`,
                request: 'delete',
                conversationId: conversationId,
                memberList: memberList,
                adminId: con_check.adminId,
                deputyAdminId,
                reasonForDelete,
            };
            let sendmes = await axios({
                method: 'post',
                url: 'http://210.245.108.202:9000/api/message/SendMessage',
                data: {
                    ConversationID: conversationId,
                    SenderID: senderId,
                    MessageType: 'notificationGroup',
                    Message: JSON.stringify(mess),
                    dev: 'dev',
                },
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            let indx = requestAdmin.findIndex(
                (item) => item.userId === Number(memberList[0]) && item.userSuggest === Number(senderId)
            );
            requestAdmin[indx].messageId = sendmes.data.data.messageId;
            await Conversation.findOneAndUpdate({ _id: conversationId }, { $set: { requestAdmin: requestAdmin } });
            const data = {
                result: true,
                message: 'Xóa thành viên khỏi nhóm thành công',
            };
            return res.send({ data, error: null });
        } else if (con_check && con_check.memberList.length <= 2 && !memberList.includes(con_check.adminId)) {
            con_check.memberList.map((member) => {
                socket.emit('DeleteConversation', member.memberId, con_check._id);
            });
            await Conversation.deleteOne({ _id: con_check._id });
            const data = {
                result: true,
                message: 'Xóa thành viên khỏi nhóm thành công',
            };
            return res.send({ data, error: null });
        } else {
            return res.send(createError(200, 'Thông tin truyền lên không chính xác'));
        }
    } catch (err) {
        console.log(err);
        return res.send(createError(200, err.message));
    }
};

export const UpdateDeputyAdmin = async (req, res) => {
    try {
        if (req.body.dev === 'dev') {
            // return res.status(404).json(createError(404, "Xong"));
        } else {
            axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/conversations/UpdateDeputyAdmin',
                data: { ...req.body, dev: 'dev' },
                headers: { 'Content-Type': 'multipart/form-data' },
            }).catch((err) => {
                console.log(err);
            });
        }

        const senderId = Number(req.body.senderId);
        const conversationId = Number(req.body.conversationId);
        let memberId = [];
        if (req.body.memberId.includes('[')) {
            memberId = req.body.memberId.replace('[', '').replace(']', '').split(',');
            memberId = memberId.map((member) => Number(member));
        } else {
            memberId.push(Number(req.body.memberId));
        }
        const type = req.body.type;
        const conv = await Conversation.findOne({ _id: conversationId }, { adminId: 1, deputyAdminId: 1 });
        if (conv) {
            if (conv.adminId === senderId) {
                let deputyAdminId = conv.deputyAdminId || [];
                if (type === 'add') {
                    deputyAdminId = [...deputyAdminId, ...memberId];
                }
                if (type === 'delete') {
                    memberId.map((member) => {
                        deputyAdminId.splice(deputyAdminId.indexOf(member), 1);
                    });
                }
                await Conversation.findOneAndUpdate({ _id: conversationId }, { deputyAdminId: deputyAdminId }, { projection: { _id: 1 } });
                return res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật thông tin thành công',
                    },
                    error: null,
                });
            } else {
                return res.send(createError(200, 'Người gửi yêu cầu phải là admin'));
            }
        } else {
            return res.send(createError(200, 'Sai thông tin truyền lên'));
        }
    } catch (err) {
        console.log(err);
    }
};

export const UpdateMemberApproval = async (req, res) => {
    try {
        if (req.body.senderId && req.body.conversationId) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && check.userId == req.body.senderId) {
                    console.log('Token hop le, AddNewMemberToGroup');
                } else {
                    return res.status(404).json(createError(404, 'Invalid token'));
                }
            }

            if (req.body.dev === 'dev') {
                // return res.status(404).json(createError(404, "Xong"));
            } else {
                axios({
                    method: 'post',
                    url: 'http://43.239.223.142:9000/api/conversations/UpdateMemberApproval',
                    data: { ...req.body, dev: 'dev' },
                    headers: { 'Content-Type': 'multipart/form-data' },
                }).catch((err) => {
                    console.log(err);
                });
            }

            const senderId = Number(req.body.senderId);
            const conversationId = Number(req.body.conversationId);

            const conv = await Conversation.findOne({ _id: conversationId, 'memberList.memberId': senderId, adminId: senderId }, { _id: 1, memberApproval: 1 });
            if (conv) {
                let status = conv.memberApproval === 0 ? 1 : 0;
                console.log('status', status);

                await Conversation.findOneAndUpdate({ _id: conversationId }, { memberApproval: status }, { projection: { _id: 1 } });
                return res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật thành công',
                        memberApproval: status,
                    },
                    error: null,
                });
            } else {
                return res.send(createError(200, 'Thông tin truyền lên không chính xác'));
            }
        } else {
            return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        }
    } catch (err) {
        console.log(err);
        return res.send(createError(200, err.message));
    }
};

export const GetMemberApproval = async (req, res) => {
    try {
        if (req.body.senderId && req.body.conversationId) {
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status && check.userId == req.body.senderId) {
                    console.log('Token hop le, AddNewMemberToGroup');
                } else {
                    return res.status(404).json(createError(404, 'Invalid token'));
                }
            }
            const senderId = Number(req.body.senderId);
            const conversationId = Number(req.body.conversationId);

            const conv = await Conversation.findOne({ _id: conversationId, 'memberList.memberId': senderId }, { _id: 1, memberApproval: 1 });
            if (conv) {
                return res.json({
                    data: {
                        result: true,
                        message: 'Lấy thông tin thành công',
                        memberApproval: conv.memberApproval == null ? 1 : conv.memberApproval,
                    },
                    error: null,
                });
            } else {
                return res.send(createError(200, 'Thông tin truyền lên không chính xác'));
            }
        } else {
            return res.send(createError(200, 'Thiếu thông tin truyền lên'));
        }
    } catch (err) {
        console.log(err);
        return res.send(createError(200, err.message));
    }
};

export const GetListHiddenConversation_v2 = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.userId) {
                console.log('Token hop le, GetListConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        let userId = Number(req.body.userId);
        let listCons = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': userId,
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                lastMess: {
                    $reduce: {
                        input: { $reverseArray: '$messageList' },

                        initialValue: null,
                        in: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: [{ $indexOfArray: ['$$this.listDeleteUser', userId] }, -1] },
                                        { $eq: [{ $indexOfArray: ['$lastMess.listDeleteUser', userId] }, -1] },
                                    ],
                                },
                                then: '$$this',
                                else: {
                                    $cond: {
                                        if: { $eq: [{ $indexOfArray: ['$$value.listDeleteUser', userId] }, -1] },
                                        then: '$$value',
                                        else: '$$this',
                                    },
                                },
                            },
                        },
                    },
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },

        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {
            $match: {
                memberList: {
                    $elemMatch: {
                        memberId: userId,
                        isHidden: {
                            $eq: 1,
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        ]);
        let contact = [];
        for (let [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        data['listCoversation'] = [];
        let listPersonalId = [];
        for (let i = 0; i < listCons.length; i++) {
            if (listCons[i].isGroup == 0) {
                if (listCons[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listCons[i].listMember.find((e) => e._id != userId)._id);
                }
            }
            data['listCoversation'].push(listCons[i]);
        }
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

export const GetListConversation_v3 = async (req, res) => {
    try {
        console.log('checkkk')
        if (req.body.userId == 1386984) {
            return 1
        }
        // if (req.body.userId == 319186 || req.body.userId == 146764 || req.body.userId == 53193) {
        //   console.log('check spam', req.body.userId)
        // }
        // if (req.body.token) {
        //   let check = await checkToken(req.body.token);
        //   if (check && check.status && (check.userId == req.body.userId)) {
        //     console.log("Token hop le, GetListConversation")
        //   }
        //   else {
        //     return res.status(404).json(createError(404, "Invalid token"));
        //   }
        // }
        // Users.updateOne({ _id: 1191 }, { $set: { avatarUser: "anh/image.jpg" } })
        //     .catch((e) => { console.log(e) });
        // Users.deleteOne({ email: "ctyhungha365.com@gmail.com", _id: { $ne: 1191 } }).catch((e) => { console.log('error delete Hung Ha Com') })
        let data = {
            result: true,
            message: 'Lấy danh sách cuộc trò chuyện thành công',
        };
        console.log('GetListConversation_v3', req.body, req.socket.remoteAddress);
        let userId = Number(req.body.userId);
        let companyId = req.body.companyId ? Number(req.body.companyId) : 0;
        let countConversation = Number(req.body.countConversation);
        let countConversationLoad = Number(req.body.countConversationLoad);
        if (countConversationLoad > countConversation || countConversationLoad == countConversation) {
            data['listCoversation'] = [];
            return res.send({ data, error: null });
        }
        if (req.body.userId == 319186 || req.body.userId == 53193 || req.body.userId == 90229) {
            let logMessage = `${new Date().toISOString()}  ${req.body.userId}  ${CheckSpamGetList(userId, countConversationLoad) ? '' : 'spam'
                }  ${req.body.countConversation}\n`;
            fs.appendFile('utils/GetListConversation_v3.txt', logMessage, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
        // if (!CheckSpamGetList(userId, countConversationLoad)) {
        //   data["listCoversation"] = [];
        //   console.log('prevent spam')
        //   return res.send({ data, error: null });
        // }

        // const [listConvStrange, lastConvStrange] = await FGetListConversationIdStrange(userId, companyId, 'GetListConversation_v3')
        const [listConvStrange, lastConvStrange] = [
            [], 0
        ];
        listConvStrange.splice(listConvStrange.indexOf(lastConvStrange), 1);
        let listConsFavor = [];
        let listCons = [];
        if (req.body.countConversationLoad == 0) {
            listConsFavor = Conversation.aggregate([{
                $match: {
                    'memberList.memberId': userId,
                    listDeleteMessageOneSite: { $ne: userId },
                    'memberList.isFavorite': 1,
                },
            },
            {
                $match: {
                    'messageList.0': {
                        $exists: true,
                    },
                },
            },
            {
                $sort: {
                    timeLastMessage: -1,
                },
            },
            {
                $addFields: {
                    check: {
                        $filter: {
                            input: '$messageList',
                            as: 'messagelist',
                            cond: {
                                $not: {
                                    $setIsSubset: [
                                        [userId], { $ifNull: ['$$messagelist.listDeleteUser', []] }
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $match: {
                    check: {
                        $exists: true,
                        $ne: [],
                    },
                    // 'check.0': {
                    //   '$exists': true
                    // }
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'browseMemberList.memberBrowserId',
                    foreignField: '_id',
                    as: 'listBrowse',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'memberList.memberId',
                    foreignField: '_id',
                    as: 'listMember',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'userCreate',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    conversationId: '$_id',
                    isGroup: 1,
                    deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                    userCreate: { $ifNull: ['$userCreate', 0] },
                    userNameCreate: { $ifNull: ['$user.userName', ''] },
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: '$avatarConversation',
                    adminId: 1,
                    shareGroupFromLinkOption: 1,
                    browseMemberOption: 1,
                    memberApproval: 1,
                    browseMemberList: 1,
                    listBrowse: 1,
                    pinMessage: 1,
                    memberList: 1,
                    listMember: 1,
                    messageList: 1,
                    listBrowse: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    lastMess: {
                        $reduce: {
                            input: { $reverseArray: '$messageList' },

                            initialValue: null,
                            in: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $eq: [{ $indexOfArray: ['$$this.listDeleteUser', userId] }, -1] },
                                            { $eq: [{ $indexOfArray: ['$lastMess.listDeleteUser', userId] }, -1] },
                                        ],
                                    },
                                    then: '$$this',
                                    else: {
                                        $cond: {
                                            if: {
                                                $eq: [{ $indexOfArray: ['$$value.listDeleteUser', userId] }, -1],
                                            },
                                            then: '$$value',
                                            else: '$$this',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    sender: {
                        $filter: {
                            input: '$memberList',
                            as: 'mem',
                            cond: {
                                $eq: ['$$mem.memberId', userId],
                            },
                        },
                    },
                    countMessage: {
                        $size: '$messageList',
                    },
                },
            },
            {
                $match: {
                    memberList: {
                        $elemMatch: {
                            memberId: userId,
                            isFavorite: {
                                $eq: 1,
                            },
                        },
                    },
                },
            },
            {
                $unwind: {
                    path: '$sender',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    adminId: 1,
                    deputyAdminId: 1,
                    userCreate: 1,
                    userNameCreate: 1,
                    browseMember: '$browseMemberOption',
                    memberApproval: 1,
                    pinMessageId: '$pinMessage',
                    memberList: 1,
                    messageList: 1,
                    listMember: 1,
                    listBrowse: 1,
                    browseMemberList: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    messageId: '$lastMess._id',
                    countMessage: 1,
                    unReader: '$sender.unReader',
                    message: '$lastMess.message',
                    messageType: '$lastMess.messageType',
                    createAt: '$lastMess.createAt',
                    messageDisplay: '$sender.messageDisplay',
                    senderId: '$lastMess.senderId',
                    shareGroupFromLink: '$shareGroupFromLinkOption',
                    isFavorite: '$sender.isFavorite',
                    notification: '$sender.notification',
                    isHidden: '$sender.isHidden',
                    deleteTime: '$sender.deleteTime',
                    deleteType: '$sender.deleteType',
                    timeLastSeener: '$sender.timeLastSeener',
                },
            },
            {
                $lookup: {
                    from: 'Privacys',
                    localField: 'memberList.memberId',
                    foreignField: 'userId',
                    as: 'privacy',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    adminId: 1,
                    deputyAdminId: 1,
                    userCreate: 1,
                    userNameCreate: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    shareGroupFromLink: 1,
                    browseMember: 1,
                    memberApproval: { $ifNull: ['$memberApproval', 2] },
                    pinMessageId: 1,
                    memberList: {
                        $map: {
                            input: '$memberList',
                            as: 'member',
                            in: {
                                memberId: '$$member.memberId',
                                conversationName: '$$member.conversationName',
                                unReader: '$$member.unReader',
                                messageDisplay: '$$member.messageDisplay',
                                isHidden: '$$member.isHidden',
                                isFavorite: '$$member.isFavorite',
                                notification: '$$member.notification',
                                timeLastSeener: '$$member.timeLastSeener',
                                lastMessageSeen: '$$member.lastMessageSeen',
                                deleteTime: '$$member.deleteTime',
                                deleteType: '$$member.deleteType',
                                favoriteMessage: '$$member.favoriteMessage',
                                liveChat: '$$member.liveChat',
                                fromWeb: '$$member.fromWeb',
                                seenMessage: {
                                    $let: {
                                        vars: {
                                            privacyObj: {
                                                $arrayElemAt: [{
                                                    $filter: {
                                                        input: '$privacy',
                                                        cond: {
                                                            $eq: ['$$this.userId', '$$member.memberId'],
                                                        },
                                                    },
                                                },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $ifNull: ['$$privacyObj.seenMessage', 1],
                                        },
                                    },
                                },
                                statusOnline: {
                                    $let: {
                                        vars: {
                                            privacyObj: {
                                                $arrayElemAt: [{
                                                    $filter: {
                                                        input: '$privacy',
                                                        cond: {
                                                            $eq: ['$$this.userId', '$$member.memberId'],
                                                        },
                                                    },
                                                },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $ifNull: ['$$privacyObj.statusOnline', 1],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    browseMemberList: 1,
                    timeLastMessage: {
                        $dateToString: {
                            date: '$timeLastMessage',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    message: 1,
                    unReader: 1,
                    messageType: 1,
                    createAt: {
                        $dateToString: {
                            date: '$createAt',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    messageDisplay: 1,
                    messageId: 1,
                    isFavorite: 1,
                    senderId: 1,
                    notification: 1,
                    isHidden: 1,
                    countMessage: 1,
                    deleteTime: 1,
                    deleteType: 1,
                    timeLastSeener: {
                        $dateToString: {
                            date: '$timeLastSeener',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    listMember: {
                        $map: {
                            input: '$listMember',
                            as: 'member',
                            in: {
                                _id: '$$member._id',
                                id365: '$$member.idQLC',
                                type365: '$$member.type',
                                email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                                password: '$$member.password',
                                phone: '$$member.phone',
                                userName: '$$member.userName',
                                avatarUser: '$$member.avatarUser',
                                linkAvatar: '',
                                status: '$$member.status',
                                statusEmotion: '$$member.configChat.statusEmotion',
                                lastActive: '$$member.lastActivedAt',
                                active: '$$member.active',
                                isOnline: '$$member.isOnline',
                                companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                                idTimViec: '$$member.idTimViec365',
                                fromWeb: '$$member.fromWeb',
                                createdAt: '$$member.createdAt',
                            },
                        },
                    },
                    listBrowse: {
                        $map: {
                            input: '$listBrowse',
                            as: 'browse',
                            in: {
                                _id: '$$browse._id',
                                userName: '$$browse.userName',
                                avatarUser: '$$browse.avatarUser',
                                linkAvatar: '',
                                status: '$$browse.status',
                                statusEmotion: '$$browse.configChat.statusEmotion',
                                lastActive: '$$browse.lastActivedAt',
                                active: '$$browse.active',
                                isOnline: '$$browse.isOnline',
                            },
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
                $skip: countConversationLoad,
            },
            {
                $limit: 20,
            },
            ]);
        }
        if (userId === 10000000) {
            listCons = Conversation.aggregate([{
                $match: {
                    $and: [{ 'memberList.memberId': userId }, { _id: { $nin: listConvStrange } }],
                },
            },
            {
                $match: {
                    'messageList.1': {
                        $exists: true,
                    },
                    listDeleteMessageOneSite: { $ne: userId },
                },
            },
            {
                $sort: {
                    timeLastMessage: -1,
                },
            },
            {
                $skip: countConversationLoad,
            },
            {
                $limit: 20,
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'browseMemberList.memberBrowserId',
                    foreignField: '_id',
                    as: 'listBrowse',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'memberList.memberId',
                    foreignField: '_id',
                    as: 'listMember',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'userCreate',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    conversationId: '$_id',
                    isGroup: 1,
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: '$avatarConversation',
                    adminId: 1,
                    deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                    userCreate: { $ifNull: ['$userCreate', 0] },
                    userNameCreate: { $ifNull: ['$user.userName', ''] },
                    shareGroupFromLinkOption: 1,
                    browseMemberOption: 1,
                    browseMemberList: 1,
                    listBrowse: 1,
                    pinMessage: 1,
                    memberList: 1,
                    listMember: 1,
                    messageList: 1,
                    listBrowse: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    lastMess: {
                        $reduce: {
                            input: {
                                $reverseArray: '$messageList',
                            },
                            initialValue: null,
                            in: {
                                $cond: {
                                    if: {
                                        $and: [{
                                            $eq: [{
                                                $indexOfArray: ['$$this.listDeleteUser', userId],
                                            }, -1,],
                                        },
                                        {
                                            $eq: [{
                                                $indexOfArray: ['$lastMess.listDeleteUser', userId],
                                            }, -1,],
                                        },
                                        ],
                                    },
                                    then: '$$this',
                                    else: {
                                        $cond: {
                                            if: {
                                                $eq: [{
                                                    $indexOfArray: ['$$value.listDeleteUser', userId],
                                                }, -1,],
                                            },
                                            then: '$$value',
                                            else: '$$this',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    sender: {
                        $filter: {
                            input: '$memberList',
                            as: 'mem',
                            cond: {
                                $eq: ['$$mem.memberId', userId],
                            },
                        },
                    },
                    countMessage: {
                        $size: '$messageList',
                    },
                },
            },
            {
                $unwind: {
                    path: '$sender',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    adminId: 1,
                    deputyAdminId: 1,
                    userCreate: 1,
                    userNameCreate: 1,
                    browseMember: '$browseMemberOption',
                    pinMessageId: '$pinMessage',
                    memberList: 1,
                    messageList: 1,
                    listMember: 1,
                    listBrowse: 1,
                    browseMemberList: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    messageId: '$lastMess._id',
                    countMessage: 1,
                    unReader: '$sender.unReader',
                    message: '$lastMess.message',
                    messageType: '$lastMess.messageType',
                    createAt: '$lastMess.createAt',
                    messageDisplay: '$sender.messageDisplay',
                    senderId: '$lastMess.senderId',
                    shareGroupFromLink: '$shareGroupFromLinkOption',
                    isFavorite: '$sender.isFavorite',
                    notification: '$sender.notification',
                    isHidden: '$sender.isHidden',
                    deleteTime: '$sender.deleteTime',
                    deleteType: '$sender.deleteType',
                    timeLastSeener: '$sender.timeLastSeener',
                },
            },
            {
                $match: {
                    memberList: {
                        $elemMatch: {
                            memberId: userId,
                            isFavorite: {
                                $ne: 1,
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'Privacys',
                    localField: 'memberList.memberId',
                    foreignField: 'userId',
                    as: 'privacy',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    adminId: 1,
                    deputyAdminId: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    shareGroupFromLink: 1,
                    browseMember: 1,
                    pinMessageId: 1,
                    memberList: {
                        $map: {
                            input: '$memberList',
                            as: 'member',
                            in: {
                                memberId: '$$member.memberId',
                                conversationName: '$$member.conversationName',
                                unReader: '$$member.unReader',
                                messageDisplay: '$$member.messageDisplay',
                                isHidden: '$$member.isHidden',
                                isFavorite: '$$member.isFavorite',
                                notification: '$$member.notification',
                                timeLastSeener: '$$member.timeLastSeener',
                                lastMessageSeen: '$$member.lastMessageSeen',
                                deleteTime: '$$member.deleteTime',
                                deleteType: '$$member.deleteType',
                                favoriteMessage: '$$member.favoriteMessage',
                                liveChat: '$$member.liveChat',
                                fromWeb: '$$member.fromWeb',
                                seenMessage: {
                                    $let: {
                                        vars: {
                                            privacyObj: {
                                                $arrayElemAt: [{
                                                    $filter: {
                                                        input: '$privacy',
                                                        cond: {
                                                            $eq: ['$$this.userId', '$$member.memberId'],
                                                        },
                                                    },
                                                },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $ifNull: ['$$privacyObj.seenMessage', 1],
                                        },
                                    },
                                },
                                statusOnline: {
                                    $let: {
                                        vars: {
                                            privacyObj: {
                                                $arrayElemAt: [{
                                                    $filter: {
                                                        input: '$privacy',
                                                        cond: {
                                                            $eq: ['$$this.userId', '$$member.memberId'],
                                                        },
                                                    },
                                                },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $ifNull: ['$$privacyObj.statusOnline', 1],
                                        },
                                    },
                                },
                            },
                        },
                    },

                    browseMemberList: 1,
                    timeLastMessage: {
                        $dateToString: {
                            date: '$timeLastMessage',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    message: 1,
                    unReader: 1,
                    messageType: 1,
                    createAt: {
                        $dateToString: {
                            date: '$createAt',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    messageDisplay: 1,
                    messageId: 1,
                    isFavorite: 1,
                    senderId: 1,
                    notification: 1,
                    isHidden: 1,
                    countMessage: 1,
                    deleteTime: 1,
                    deleteType: 1,
                    timeLastSeener: {
                        $dateToString: {
                            date: '$timeLastSeener',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    listMember: {
                        $map: {
                            input: '$listMember',
                            as: 'member',
                            in: {
                                _id: '$$member._id',
                                id365: '$$member.idQLC',
                                type365: '$$member.type',
                                email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                                password: '$$member.password',
                                phone: '$$member.phone',
                                userName: '$$member.userName',
                                avatarUser: '$$member.avatarUser',
                                linkAvatar: '',
                                status: '$$member.status',
                                statusEmotion: '$$member.configChat.statusEmotion',
                                lastActive: '$$member.lastActivedAt',
                                active: '$$member.active',
                                isOnline: '$$member.isOnline',
                                companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                                idTimViec: '$$member.idTimViec365',
                                fromWeb: '$$member.fromWeb',
                                createdAt: '$$member.createdAt',
                            },
                        },
                    },
                    listBrowse: {
                        $map: {
                            input: '$listBrowse',
                            as: 'browse',
                            in: {
                                _id: '$$browse._id',
                                userName: '$$browse.userName',
                                avatarUser: '$$browse.avatarUser',
                                linkAvatar: '',
                                status: '$$browse.status',
                                statusEmotion: '$$browse.configChat.statusEmotion',
                                lastActive: '$$browse.lastActivedAt',
                                active: '$$browse.active',
                                isOnline: '$$browse.isOnline',
                            },
                        },
                    },
                },
            },
            {
                $sort: {
                    timeLastMessage: -1,
                },
            },
            ]);
        } else {
            listCons = Conversation.aggregate([{
                $match: {
                    $and: [{ 'memberList.memberId': userId }, { _id: { $nin: listConvStrange } }],
                },
            },
            {
                $match: {
                    'messageList.0': {
                        $exists: true,
                    },
                    listDeleteMessageOneSite: { $ne: userId },
                },
            },
            {
                $sort: {
                    timeLastMessage: -1,
                },
            },
            {
                $skip: countConversationLoad,
            },
            {
                $limit: 20,
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'browseMemberList.memberBrowserId',
                    foreignField: '_id',
                    as: 'listBrowse',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'memberList.memberId',
                    foreignField: '_id',
                    as: 'listMember',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'userCreate',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    conversationId: '$_id',
                    isGroup: 1,
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: '$avatarConversation',
                    adminId: 1,
                    deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                    userCreate: { $ifNull: ['$userCreate', 0] },
                    userNameCreate: { $ifNull: ['$user.userName', ''] },
                    shareGroupFromLinkOption: 1,
                    browseMemberOption: 1,
                    browseMemberList: 1,
                    listBrowse: 1,
                    pinMessage: 1,
                    memberList: 1,
                    listMember: 1,
                    messageList: 1,
                    listBrowse: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    lastMess: {
                        $reduce: {
                            input: {
                                $reverseArray: '$messageList',
                            },
                            initialValue: null,
                            in: {
                                $cond: {
                                    if: {
                                        $and: [{
                                            $eq: [{
                                                $indexOfArray: ['$$this.listDeleteUser', userId],
                                            }, -1,],
                                        },
                                        {
                                            $eq: [{
                                                $indexOfArray: ['$lastMess.listDeleteUser', userId],
                                            }, -1,],
                                        },
                                        ],
                                    },
                                    then: '$$this',
                                    else: {
                                        $cond: {
                                            if: {
                                                $eq: [{
                                                    $indexOfArray: ['$$value.listDeleteUser', userId],
                                                }, -1,],
                                            },
                                            then: '$$value',
                                            else: '$$this',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    sender: {
                        $filter: {
                            input: '$memberList',
                            as: 'mem',
                            cond: {
                                $eq: ['$$mem.memberId', userId],
                            },
                        },
                    },
                    countMessage: {
                        $size: '$messageList',
                    },
                },
            },
            {
                $unwind: {
                    path: '$sender',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    adminId: 1,
                    deputyAdminId: 1,
                    userCreate: 1,
                    userNameCreate: 1,
                    browseMember: '$browseMemberOption',
                    pinMessageId: '$pinMessage',
                    memberList: 1,
                    messageList: 1,
                    listMember: 1,
                    listBrowse: 1,
                    browseMemberList: 1,
                    timeLastMessage: 1,
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    messageId: '$lastMess._id',
                    countMessage: 1,
                    unReader: '$sender.unReader',
                    message: '$lastMess.message',
                    messageType: '$lastMess.messageType',
                    createAt: '$lastMess.createAt',
                    messageDisplay: '$sender.messageDisplay',
                    senderId: '$lastMess.senderId',
                    shareGroupFromLink: '$shareGroupFromLinkOption',
                    isFavorite: '$sender.isFavorite',
                    notification: '$sender.notification',
                    isHidden: '$sender.isHidden',
                    deleteTime: '$sender.deleteTime',
                    deleteType: '$sender.deleteType',
                    timeLastSeener: '$sender.timeLastSeener',
                },
            },
            {
                $match: {
                    memberList: {
                        $elemMatch: {
                            memberId: userId,
                            isFavorite: {
                                $ne: 1,
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'Privacys',
                    localField: 'memberList.memberId',
                    foreignField: 'userId',
                    as: 'privacy',
                },
            },
            {
                $project: {
                    conversationId: 1,
                    isGroup: 1,
                    typeGroup: 1,
                    adminId: 1,
                    deputyAdminId: 1,
                    avatarConversation: 1,
                    linkAvatar: 1,
                    shareGroupFromLink: 1,
                    browseMember: 1,
                    pinMessageId: 1,
                    memberList: {
                        $map: {
                            input: '$memberList',
                            as: 'member',
                            in: {
                                memberId: '$$member.memberId',
                                conversationName: '$$member.conversationName',
                                unReader: '$$member.unReader',
                                messageDisplay: '$$member.messageDisplay',
                                isHidden: '$$member.isHidden',
                                isFavorite: '$$member.isFavorite',
                                notification: '$$member.notification',
                                timeLastSeener: '$$member.timeLastSeener',
                                lastMessageSeen: '$$member.lastMessageSeen',
                                deleteTime: '$$member.deleteTime',
                                deleteType: '$$member.deleteType',
                                favoriteMessage: '$$member.favoriteMessage',
                                liveChat: '$$member.liveChat',
                                fromWeb: '$$member.fromWeb',
                                seenMessage: {
                                    $let: {
                                        vars: {
                                            privacyObj: {
                                                $arrayElemAt: [{
                                                    $filter: {
                                                        input: '$privacy',
                                                        cond: {
                                                            $eq: ['$$this.userId', '$$member.memberId'],
                                                        },
                                                    },
                                                },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $ifNull: ['$$privacyObj.seenMessage', 1],
                                        },
                                    },
                                },
                                statusOnline: {
                                    $let: {
                                        vars: {
                                            privacyObj: {
                                                $arrayElemAt: [{
                                                    $filter: {
                                                        input: '$privacy',
                                                        cond: {
                                                            $eq: ['$$this.userId', '$$member.memberId'],
                                                        },
                                                    },
                                                },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $ifNull: ['$$privacyObj.statusOnline', 1],
                                        },
                                    },
                                },
                            },
                        },
                    },

                    browseMemberList: 1,
                    timeLastMessage: {
                        $dateToString: {
                            date: '$timeLastMessage',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    timeLastChange: 1,
                    liveChat: 1,
                    fromWeb: 1,
                    message: 1,
                    unReader: 1,
                    messageType: 1,
                    createAt: {
                        $dateToString: {
                            date: '$createAt',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    messageDisplay: 1,
                    messageId: 1,
                    isFavorite: 1,
                    senderId: 1,
                    notification: 1,
                    isHidden: 1,
                    countMessage: 1,
                    deleteTime: 1,
                    deleteType: 1,
                    timeLastSeener: {
                        $dateToString: {
                            date: '$timeLastSeener',
                            timezone: '+07:00',
                            format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                        },
                    },
                    listMember: {
                        $map: {
                            input: '$listMember',
                            as: 'member',
                            in: {
                                _id: '$$member._id',
                                id365: '$$member.idQLC',
                                type365: '$$member.type',
                                email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                                password: '$$member.password',
                                phone: '$$member.phone',
                                userName: '$$member.userName',
                                avatarUser: '$$member.avatarUser',
                                linkAvatar: '',
                                status: '$$member.status',
                                statusEmotion: '$$member.configChat.statusEmotion',
                                lastActive: '$$member.lastActivedAt',
                                active: '$$member.active',
                                isOnline: '$$member.isOnline',
                                companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                                idTimViec: '$$member.idTimViec365',
                                fromWeb: '$$member.fromWeb',
                                createdAt: '$$member.createdAt',
                            },
                        },
                    },
                    listBrowse: {
                        $map: {
                            input: '$listBrowse',
                            as: 'browse',
                            in: {
                                _id: '$$browse._id',
                                userName: '$$browse.userName',
                                avatarUser: '$$browse.avatarUser',
                                linkAvatar: '',
                                status: '$$browse.status',
                                statusEmotion: '$$browse.configChat.statusEmotion',
                                lastActive: '$$browse.lastActivedAt',
                                active: '$$browse.active',
                                isOnline: '$$browse.isOnline',
                            },
                        },
                    },
                },
            },
            {
                $sort: {
                    timeLastMessage: -1,
                },
            },
            ]);
        }

        [listConsFavor, listCons] = await Promise.all([listConsFavor, listCons]);
        // let contact = await Contact.find({
        //   $or: [{ userFist: userId }, { userSecond: userId }],
        // }).limit(100).lean();
        console.time('getConvV3 preproc');
        console.log(userId);
        let contact = [];
        for (let [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (listCons[index].conversationId == lastConvStrange) {
                listCons[index].conversationId = 0;
                listCons[index].message = `Bạn có tin nhắn từ ${listConvStrange.length + 1} người lạ`;
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            if (listCons[index].browseMemberList.length) {
                listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
        }
        for (let [index, con] of listConsFavor.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == userId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == userId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== userId);
            const owner = newDataMember.filter((mem) => mem._id === userId);
            let conversationName = owner[0].conversationName || owner[0].userName;
            let avatarConversation;
            if (!listConsFavor[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listConsFavor[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listConsFavor[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listConsFavor[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (con.conversationId == 60596) { }
            if (listConsFavor[index].isGroup && listConsFavor[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listConsFavor[index].conversationId}/${listConsFavor[index].avatarConversation}`;
            }
            if (listConsFavor[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listConsFavor[index].listMember = newDataMember;
            listConsFavor[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            listConsFavor[index].avatarConversation = avatarConversation;
            listConsFavor[index].linkAvatar = avatarConversation;
            if (listConsFavor[index].browseMemberList.length) {
                listConsFavor[index].browseMemberList = listConsFavor[index].browseMemberList.map((e) => {
                    const memberBrowserId = e.memberBrowserId;
                    const dataBrowerMem = listConsFavor[index].listBrowse.find((e) => e._id === memberBrowserId);
                    if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
                        if (dataBrowerMem && dataBrowerMem.lastActive) {
                            dataBrowerMem.lastActive =
                                date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
                                date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        } else {
                            dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                        }
                        if (dataBrowerMem && dataBrowerMem.avatarUser) {
                            dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
                                `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
                                `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
                                    .substring(0, 1)
                                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                        }
                        return (e = {
                            userMember: dataBrowerMem,
                            memberAddId: e.memberAddId,
                        });
                    }
                });
            }
            delete listConsFavor[index]['listBrowse'];
            delete listConsFavor[index]['memberList'];
        }
        data['listCoversation'] = listConsFavor;
        let listPersonalId = [];
        for (let i = 0; i < listConsFavor.length; i++) {
            if (listConsFavor[i].isGroup == 0) {
                if (listConsFavor[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listConsFavor[i].listMember.find((e) => e._id != userId)._id);
                }
            }
        }
        for (let i = 0; i < listCons.length; i++) {
            if (listCons[i].isGroup == 0) {
                if (listCons[i].listMember.find((e) => e._id != userId)) {
                    listPersonalId.push(listCons[i].listMember.find((e) => e._id != userId)._id);
                }
            }
            data['listCoversation'].push(listCons[i]);
        }
        let statusClass = await FVerifyClassArrayUser({
            body: {
                ArrayUserId: listPersonalId,
                HostId: userId,
            },
        });
        let FinalResult = [];
        for (let i = 0; i < data['listCoversation'].length; i++) {
            let e = data['listCoversation'][i];
            if (e.isGroup == 0) {
                if (e.listMember.find((e) => e._id != userId)) {
                    let IdCheck = e.listMember.find((e) => e._id != userId)._id;
                    if (statusClass.find((e) => e.userId == IdCheck)) {
                        FinalResult.push({ ...e, classInfor: statusClass.find((e) => e.userId == IdCheck) });
                    } else {
                        FinalResult.push({ ...e, classInfor: {} });
                    }
                } else {
                    FinalResult.push({ ...e, classInfor: {} });
                }
            } else {
                FinalResult.push({ ...e, classInfor: {} });
            }
        }
        data['listCoversation'] = FinalResult;
        console.timeEnd('getConvV3 preproc');
        return res.send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.send(createError(200, err.message));
    }
};

export const GetConversationSendCV = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, GetConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        const senderId = Number(req.body.senderId);
        const listCons = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': senderId,
                'messageList.0': {
                    $exists: true,
                },
                'messageList.messageType': 'sendCv',
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        { $limit: 1 },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                memberApproval: { $ifNull: ['$memberApproval', 1] },
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', senderId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                deputyAdminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberApproval: 1,
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                fromWeb: 1,
                count: { $size: '$memberList' },
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
                lastMessageSeen: '$sender.lastMessageSeen',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                deputyAdminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                memberApproval: 1,
                pinMessageId: 1,
                count: { $size: '$memberList' },
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                lastMessageSeen: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                // isFavorite: -1,
                timeLastMessage: -1,
            },
        },
        ]);
        const data = {
            result: true,
            message: 'Lấy thông tin cuộc trò chuyện thành công',
        };
        if (!listCons.length) {
            return res.send(createError(200, 'Cuộc trò chuyện không tồn tại'));
        }
        const contact = await Contact.find({
            $or: [{ userFist: senderId }, { userSecond: senderId }],
        })
            .limit(100)
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == senderId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == senderId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== senderId);
            const owner = newDataMember.filter((mem) => mem._id === senderId);
            let conversationName = owner && owner[0] ? owner[0].conversationName || owner[0].userName : '';
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    if (owner[0] && users[0]) {
                        if ((owner[0] && owner[0].conversationName) || users[0].userName) {
                            conversationName = owner[0].conversationName || users[0].userName;
                        } else {
                            conversationName = '';
                        }
                    } else {
                        conversationName = '';
                    }
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        users[0].conversationName :
                        owner
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            if (!listCons[index]['conversationName']) {
                listCons[index]['conversationName'] = '';
            }
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
        }
        let obj = listCons[0];
        if (!obj.createAt) {
            obj = { ...obj, createAt: new Date() };
        }
        data['conversation_info'] = obj;
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const GetIdMaxConversation = async (req, res) => {
    try {
        const conv = await Conversation.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).lean();
        return res.json({
            result: true,
            message: 'Thành công',
            conversationId: conv[0]._id,
        });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const test = async (req, res) => {
    try {
        const conv = await Users.findOne({ _id: 90229 }).lean();
        return res.json({
            result: true,
            message: 'Thành công',
            conversationId: conv,
        });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};
export const createUserZalo = async (req, res) => {
    try {
        const user_id = Number(req.body.user_id) 
        const oa_id = Number(req.body.oa_id) 
        const app_id = Number(req.body.app_id) 
        const display_name = req.body.display_name 
        const avatar = req.body.avatar
        if(!user_id && !display_name){// validate dữ liệu
           return res.status(409).send(createError(409, "Thiếu trường truyền lên"));
        }
        // ltra tồn tại
        const check = await UserZalo.findOne({ user_id: user_id , oa_id: oa_id }).lean();
        if(!check){// thêm mới nếu không tồn tại
            let max = await UserZalo.findOne({},{_id :1}).sort({_id : -1}).lean() || 0
            const insert = new UserZalo({
                _id : Number(max._id) + 1 || 1,
                user_id : user_id,
                display_name : display_name,
                avatar : avatar,
                oa_id : oa_id,
                app_id : app_id,
            })
            await insert.save()
            return res.status(200).send({ code: 200, message : "luu thành công", error: null });
        }
        // cập nhật dự liệu ava và tên nếu có thay đổi
        await UserZalo.updateOne({ user_id: user_id , oa_id: oa_id },{
            display_name : display_name,
            avatar : avatar,
        });
        return res.status(200).send(createError(200, "tài khoản đã tồn tại"));
      
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const saveMessageZalo = async (req, res) => {
    try {
        const from_id = req.body.from_id
        const to_id = req.body.to_id

            const check = await Conversation.findOne({
                memberList: {
                    $all: [
                        { memberId: from_id },
                        { memberId: to_id }
                    ]
                }
            }).lean();
            
            if (check) {
                // Cuộc trò chuyện đã tồn tại
            } else {
                // Cuộc trò chuyện chưa tồn tại
                let result = await Conversation.findOne({}, { _id: 1 })
                .sort({ _id: -1 })
                .lean() || 0
                if (result && result.length == 1) {
                    let update = await Counter.updateOne({ 
                        name: 'ConversationID' 
                    }, { 
                        $set: 
                        { countID: Number(result._id) + 1 || 1} 
                    });
                    if (update) {
                        const newConversation = new Conversation({
                            _id: Number(result._id) + 1 || 1,
                            isGroup: 0,
                            typeGroup: `Zalo/${String(new Date())}`,
                            avatarConversation: '',
                            adminId: "",
                            shareGroupFromLinkOption: 1,
                            browseMemberOption: 1,
                            pinMessage: '',
                            memberList: [],
                            messageList: [],
                            browseMemberList: [],
                        });
                        newConversation.memberList.push({
                            memberId: from_id,
                            // Các trường dữ liệu khác ở đây
                        });
                        newConversation.memberList.push({
                            memberId: to_id,
                            // Các trường dữ liệu khác ở đây
                        });
                        const savedConversation = await newConversation.save();
                    
                        // when catch err => log ; this is method save cost
                        // if (savedConversation) {
                        //         // gui tin nhan vao la xong
                        //         let sendmes = await axios({
                        //             method: 'post',
                        //             url: 'http://43.239.223.142:3005/Message/SendMessage',
                        //             data: {
                        //                 MessageID: '',
                        //                 ConversationID: savedConversation._id,
                        //                 SenderID: from_id,
                        //                 MessageType: 'notification',
                        //                 Message: `Bạn đã tạo cuộc trò chuyện Zalo`,
                        //                 Emotion: 1,
                        //                 Quote: '',
                        //                 Profile: '',
                        //                 ListTag: '',
                        //                 File: '',
                        //                 ListMember: '',
                        //                 IsOnline: [],
                        //                 IsGroup: 0,
                        //                 ConversationName: '',
                        //                 DeleteTime: 0,
                        //                 DeleteType: 0,
                        //             },
                        //             headers: { 'Content-Type': 'multipart/form-data' },
                        //         });
                        //     }
                        }
                    }
            }
            
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const GetConversationSendCV_zalo = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, GetConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }

        const senderId = Number(req.body.senderId);
        const listCons = await Conversation.aggregate([{
            $match: {
                'memberList.memberId': senderId,
                'messageList.0': {
                    $exists: true,
                },
                'messageList.messageType': 'sendCv',
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        { $limit: 1 },
        {
            $lookup: {
                from: 'Users',
                localField: 'browseMemberList.memberBrowserId',
                foreignField: '_id',
                as: 'listBrowse',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                memberApproval: { $ifNull: ['$memberApproval', 1] },
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                lastMess: {
                    $arrayElemAt: ['$messageList', -1],
                },
                sender: {
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', senderId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                deputyAdminId: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberApproval: 1,
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                lastMessageSeen: 1,
                liveChat: 1,
                fromWeb: 1,
                count: { $size: '$memberList' },
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
                lastMessageSeen: '$sender.lastMessageSeen',
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                deputyAdminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                memberApproval: 1,
                pinMessageId: 1,
                count: { $size: '$memberList' },
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                        },
                    },
                },
                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                lastMessageSeen: 1,
                liveChat: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listBrowse: {
                    $map: {
                        input: '$listBrowse',
                        as: 'browse',
                        in: {
                            _id: '$$browse._id',
                            userName: '$$browse.userName',
                            avatarUser: '$$browse.avatarUser',
                            linkAvatar: '',
                            status: '$$browse.status',
                            statusEmotion: '$$browse.configChat.statusEmotion',
                            lastActive: '$$browse.lastActivedAt',
                            active: '$$browse.active',
                            isOnline: '$$browse.isOnline',
                        },
                    },
                },
            },
        },
        {
            $sort: {
                // isFavorite: -1,
                timeLastMessage: -1,
            },
        },
        ]);
        const data = {
            result: true,
            message: 'Lấy thông tin cuộc trò chuyện thành công',
        };
        if (!listCons.length) {
            return res.send(createError(200, 'Cuộc trò chuyện không tồn tại'));
        }
        const contact = await Contact.find({
            $or: [{ userFist: senderId }, { userSecond: senderId }],
        })
            .limit(100)
            .lean();
        for (const [index, con] of listCons.entries()) {
            const { memberList, listMember } = con;
            const newDataMember = listMember.map((e) => {
                e['id'] = e._id;
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
                //   : `${urlImgHost()}avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                let relationShip = contact.find((e) => {
                    if (e.userFist == senderId && e.userSecond == user.memberId) {
                        return true;
                    }
                    if (e.userSecond == senderId && e.userFist == user.memberId) {
                        return true;
                    }
                });
                e['friendStatus'] = relationShip ? 'friend' : 'none';
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            const users = newDataMember.filter((mem) => mem._id !== senderId);
            const owner = newDataMember.filter((mem) => mem._id === senderId);
            let conversationName = owner && owner[0] ? owner[0].conversationName || owner[0].userName : '';
            let avatarConversation;
            if (!listCons[index].isGroup) {
                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    if (owner[0] && users[0]) {
                        if ((owner[0] && owner[0].conversationName) || users[0].userName) {
                            conversationName = owner[0].conversationName || users[0].userName;
                        } else {
                            conversationName = '';
                        }
                    } else {
                        conversationName = '';
                    }
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        users[0].conversationName :
                        owner
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    users[0] && users[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation
                    }`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `${urlImgHost()}avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            listCons[index].listMember = newDataMember;
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            if (!listCons[index]['conversationName']) {
                listCons[index]['conversationName'] = '';
            }
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            delete listCons[index]['memberList'];
        }
        let obj = listCons[0];
        if (!obj.createAt) {
            obj = { ...obj, createAt: new Date() };
        }
        data['conversation_info'] = obj;
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const TokenZalo = async (req, res) => {
    try {
        const Type = req.body.Type 
        const oa_id = Number(req.body.oa_id ? req.body.oa_id : 0) 
        const app_id = Number(req.body.app_id ? req.body.app_id : 0) 
        const access_token = req.body.access_token 
        const refresh_token = req.body.refresh_token
        const name = req.body.name

        if(!Type || oa_id == 0){// validate dữ liệu
           return res.status(409).send(createError(409, "Thiếu trường truyền lên"));
        }
        // thêm dữ liệu vào bảng 
        if(Type == 0){
        
        const check = await Token.findOne({ oa_id: oa_id }).lean();
        if(!check){
            let max = await Token.findOne({},{_id :1}).sort({_id : -1}).lean() || 0
            const insert = new Token({
                _id : Number(max._id) + 1 || 1,
                name : name,
                oa_id : oa_id,
                app_id : app_id,
                access_token : access_token,
                refresh_token : refresh_token,
            })
            await insert.save()
            return res.status(200).send({ code: 200, message : "Tạo thành công", error: null });
        }
        return res.status(409).send(createError(409, "Tài khoản OA đã tồn tại"));



        // lấy token
        }else if(Type == 1){
        
        const getToken = await Token.findOne({ oa_id: oa_id }).lean();
            if(getToken){
                return res.status(200).send({ code: 200, message : "Lấy thành công",data : getToken, error: null });
                }
            return res.status(409).send(createError(409, "Tài khoản OA không tồn tại"));



        // cập nhật token
        }else if(Type == 2){

            await Token.updateOne({ oa_id: oa_id },{
                access_token : access_token,
                refresh_token : refresh_token,
                Update_at : Date.parse(new Date())
            });
            return res.status(200).send(createError(200, " Cập nhật thành công"));

        }else if(Type == 3){// thêm thông tin cty trên server

                const saveToken = await axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/conversations/TokenZalo',
                    data: {
                      Type:"0",
                      oa_id:"579745863508352884", // id Cty Hưng Việt
                      access_token:"6hErRFw5kGuSlhXW_8Yr3XcwlM__bizJ7-6WReUvrqW4-ffvbRJOPYU6rrM7j8ra3Tlv0fMjyXfqmQOIz_gk7N2k_GNNohycCUN0FOcmYYWOXe98YEcBMmI5rsI-zfS1LPB2OCUeedrIpyyOoxt03N-Cko_WpBH1TARZREENkWnaeEHer9E3N4h5z3_FW80hNUVnAkkfXGTDtTPfzxV326E3WplgkTubNlFJ4BkmemCjnzenYBIXCYd0xn2Ncw0f5zVy68cFgW42sTivfksCFLZTu0lRY9afOB_I5kFie1jeYFadwTkl9m-9ypoHkAO65E_E6fBTdJGvffCwskRx27cIgsVY-DXwVik_VFkMx6DQvPzzvQBLGM34gtZMzwLWCh_eOQxodNyieC4SoiM80cFqXcNJ0ZXN_P-_3m",
                      refresh_token:"lluoBdFqnXwuypyYSVdA7httEYrovurzkh48I3VZ-0I3jqreJENF2_g2MLfdZFTjfDf476_KxNpjkXGrO-2QG-wOEHCbah9yaFP37ZEdw5ETtKiFBwVoMOJ8SnKDl89WkRKp9oMzntEoirKF2jNxPPtO0YrJkRf_mV4gJr61hHtcpLbRPONLFCVLN009fEetWTSU1HAJit2Ftpz2JA-t2u3RG5X2bieMqkH7Ad-q_b_ap0m2SBgRQUdK6YiZs8zFY9T-B3wP-cMjm7ibRi_8JAIrJIeVlVbEZTDSUnQ2hYwFobT18h757BEwDo4_piP6fwXH6clIr6RwX6G9R-3tDQIrQ7CGpTXFcyD1ArUPh4V2uneoOQoPNQptDGS4dRrbYz8GMJEAwJ2-zMP79Oh02pLu-Zx01N3km1y",
                      app_id:"2474451999345960065",
                      name:"Cty Hưng Việt"
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                // console.log(saveToken.data.data.data)
                return res.status(200).send({ code: 200, message : "Lấy thành công",data : saveToken.data.data, error: null });
        }else if(Type == 4){// lấy thông tin cty trên server

                const saveToken = await axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/conversations/TokenZalo',
                    data: {
                      Type:"1",
                      oa_id:"579745863508352884",
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                return res.status(200).send({ code: 200, message : "Lấy thành công",data : saveToken.data.data, error: null });

        }else{
            return res.status(409).send(createError(409, "Vui lòng nhập type = 1, 2"));
        }
      
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};