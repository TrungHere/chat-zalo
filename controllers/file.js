import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import qs from 'qs';
import sharp from 'sharp';
import FormData from 'form-data';
import io from 'socket.io-client';
import { createError } from '../utils/error.js';
import { fInfoFile } from '../functions/fModels/fMessages.js';
import { Console } from 'console';
import { urlImgHost } from '../utils/config.js';
const socket = io.connect('http://43.239.223.142:3000', {
    secure: true,
    enabledTransports: ['wss'],
    transports: ['websocket', 'polling'],
});

const FileDanger = [
    '.BAT',
    '.CHM',
    '.CMD',
    '.COM',
    'CPL',
    '.EXE',
    '.HLP',
    '.HTA',
    '.JS',
    '.JSE',
    '.LNK',
    '.MSI',
    '.PIF',
    '.REG',
    '.SCR',
    '.SCT',
    '.SHB',
    '.SHS',
    '.VB',
    '.VBE',
    '.VBS',
    '.WSC',
    '.WSF',
    'WSH',
];
//upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(`/root/app/storage/chat365/uploads`)) {
            fs.mkdirSync(`/root/app/storage/chat365/uploads`);
        }
        if (!fs.existsSync(`/root/app/storage/chat365/uploadsImageSmall`)) {
            fs.mkdirSync(`/root/app/storage/chat365/uploadsImageSmall`);
        }
        cb(null, `/root/app/storage/chat365/uploads`);
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.replace(/[ +!@#$%^&*]/g, '');
        cb(null, Date.now() * 10000 + 621355968000000000 + '-' + fileName);
    },
});

export const uploadfiles = multer({
    storage: storage,
});

//api upload avatar nhóm
export const UploadAvatarGroup = async (req, res, next) => {
    try {
        if (req.file) {
            let formData = new FormData();
            formData.append('dev', 'dev');
            if (req.body.token) {
                let check = await checkToken(req.body.token);
                if (check && check.status) {
                    console.log('Token hop le, UploadAvatarGroup');
                } else {
                    return res.status(404).json(createError(404, 'Invalid token'));
                }
            }
            if (
                req.file.mimetype === 'application/octet-stream' ||
                req.file.mimetype === 'image/jpeg' ||
                req.file.mimetype === 'image/jpg' ||
                req.file.mimetype === 'image/png'
            ) {
                let conversationId;
                if (req.file.originalname.includes('.')) {
                    conversationId = req.file.originalname.slice(
                        req.file.originalname.indexOf('_') + 1,
                        req.file.originalname.indexOf('.')
                    );
                } else {
                    conversationId = req.file.originalname.slice(req.file.originalname.indexOf('_') + 1);
                }
                if (!fs.existsSync('/root/app/storage/chat365/avatarGroup')) {
                    fs.mkdirSync('/root/app/storage/chat365/avatarGroup');
                }
                if (!fs.existsSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`)) {
                    fs.mkdirSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`);
                }
                formData.append('conversationId', conversationId);
                const avatarConversation = `${Date.now() * 10000 + 621355968000000000}_${conversationId}.jpg`;
                await sharp(req.file.buffer)
                    .resize({ fit: sharp.fit.contain, width: 120, height: 120 })
                    .toFile(`/root/app/storage/chat365/avatarGroup/${conversationId}/${avatarConversation}`);
                formData.append(
                    '',
                    fs.createReadStream(`/root/app/storage/chat365/avatarGroup/${conversationId}/${avatarConversation}`)
                );
                const fileDelete = fs.readdirSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`)[0];
                if (fs.readdirSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`).length >= 10) {
                    fs.unlinkSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}/${fileDelete}`);
                }
                const conversation = await Conversation.findOneAndUpdate(
                    { _id: conversationId },
                    { avatarConversation: avatarConversation },
                    { _id: 1 }
                );
                if (conversation) {
                    await axios({
                        method: 'post',
                        url: 'http://43.239.223.142:9000/api/file/UploadAvatarGroup',
                        data: formData,
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    // conversation.avatarConversation = `${urlImgHost()}avatarConversation/${conversation._id}/${conversation.avatarConversation}`
                    res.json({
                        data: {
                            result: true,
                            message: avatarConversation,
                        },
                        error: null,
                    });
                } else {
                    res.status(200).json(createError(200, 'Cập nhật ảnh đại diện thất bại'));
                }
            } else {
                res.status(200).json(createError(200, 'File không phải là hình ảnh'));
            }
        } else {
            res.status(200).json(createError(200, 'Dữ liệu truyền lên không đầy đủ'));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};
//api upload ảnh đại diện
export const UploadAvatar = async (req, res, next) => {
    if (req.file) {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status) {
                console.log('Token hop le, UploadAvatar');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        if (
            req.file.mimetype === 'application/octet-stream' ||
            req.file.mimetype === 'image/jpeg' ||
            req.file.mimetype === 'image/jpg' ||
            req.file.mimetype === 'image/png'
        ) {
            let userId;
            if (req.file.originalname.includes('.')) {
                userId = req.file.originalname.slice(
                    req.file.originalname.indexOf('_') + 1,
                    req.file.originalname.indexOf('.')
                );
            } else {
                userId = req.file.originalname.slice(req.file.originalname.indexOf('_') + 1);
            }
            if (!fs.existsSync('C:/Chat365/publish/wwwroot/avatarUser')) {
                fs.mkdirSync('C:/Chat365/publish/wwwroot/avatarUser');
            }
            if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`)) {
                fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`);
            }
            const avatarUser = `${Date.now() * 10000 + 621355968000000000}_${userId}.jpg`;
            await sharp(req.file.buffer)
                .resize({ fit: sharp.fit.contain, width: 120, height: 120 })
                .toFile(`C:/Chat365/publish/wwwroot/avatarUser/${userId}/${avatarUser}`);
            if (fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`).length >= 10) {
                const fileDelete = fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`)[0];
                fs.unlinkSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}/${fileDelete}`);
            }
            const user = await User.findOneAndUpdate(
                { _id: userId },
                { avatarUser: avatarUser },
                { new: true, projection: { avatarUser: 1, email: 1, password: 1, type365: 1, id365: 1, idTimViec: 1 } }
            );
            if (user) {
                user.avatarUser = `${urlImgHost()}avatarUser/${user._id}/${user.avatarUser}`;
                const send1 = () => {
                    if (user.type365 != 0) {
                        let response = axios.post(
                            'https://chamcong.24hpay.vn/api_chat365/update_avatar.php',
                            qs.stringify({
                                email: `${String(user.email)}`,
                                link: user.avatarUser,
                                type: `${String(user.type365)}`, // truyền sai type đúng  quản lý chung vẫn nhận
                            })
                        );
                    }
                };
                const send2 = () => {
                    if (user.idTimViec != 0) {
                        let response = axios.post(
                            'https://timviec365.vn/api_app/update_tt_chat365.php',
                            qs.stringify({
                                email: `${String(user.email)}`,
                                type: `${String(user.type365)}`,
                                name: user.userName,
                                id: `${String(user.id365)}`,
                                pass: user.password,
                                file: fs.readFileSync(file, { encoding: 'utf8' }),
                            })
                        );
                    }
                };
                // const send2 = () => {
                //     if (user.id365 != 0) {
                //         if (user.type365 != 0) {
                //             let response = axios.post('https://timviec365.vn/api_app/update_tt_chat365.php', qs.stringify({
                //                 'email': `${String(user.email)}`,
                //                 'file': user.avatarUser,
                //                 'type': `${String(user.type365)}`  // truyền sai type đúng  quản lý chung vẫn nhận
                //             }));
                //             response
                //                 .then(a => console.log(a))
                //         }
                //         else {
                //             console.log('3')
                //             let response = axios.post('https://timviec365.vn/api_app/update_tt_chat365.php', qs.stringify({
                //                 'id': `${String(user.type365)}`,
                //                 'file': user.avatarUser,
                //             }));
                //         }
                //     }
                // }
                Promise.all([send1(), send2()]);
                res.json({
                    data: {
                        result: true,
                        message: avatarUser,
                    },
                    error: null,
                });
            } else {
                res.status(200).json(createError(200, 'Thông tin truyền không chính xác'));
            }
        } else {
            res.status(200).json(createError(200, 'File không phải là hình ảnh'));
        }
    } else {
        res.status(200).json(createError(200, 'Dữ liệu truyền lên không đầy đủ'));
    }
};

// api upload File
export const UploadFile = async (req, res, next) => {
    try {
        console.log('UploadFile', req.body);
        let formData = new FormData();
        formData.append('dev', 'dev');
        if (req.files.length > 0) {
            let files = [];
            // console.log(req.files)
            for (let i = 0; i < req.files.length; i++) {
                const name = req.files[i].filename.slice(
                    req.files[i].filename.indexOf('.'),
                    req.files[i].filename.length
                );
                if (FileDanger.includes(name.toUpperCase())) {
                    return res.status(200).json(createError(200, 'File được chọn không thể upload'));
                }
                // files.push(req.files[i].filename);
                // console.log(req.files[i])
                files.push(`${req.files[i].filename.split('-')[0]}-${req.files[i].originalname}`);
                // console.log(`${req.files[i].filename.split('-')[0]}-${req.files[i].originalname}`)
            }
            // console.log(files);
            for (let i = 0; i < files.length; i++) {
                if (
                    req.files[i].filename
                        .toUpperCase()
                        .split('.')
                    [req.files[i].filename.toUpperCase().split('.').length - 1].includes('JPEG')
                ) {
                    await sharp(`/root/app/storage/chat365/uploads/${files[i].replace(/[ +!@#$%^&*]/g, '')}`)
                        .resize({ fit: sharp.fit.contain, width: 1200, height: 1200 })
                        .toFile(`/root/app/storage/chat365/uploadsImageSmall/${files[i]}`);
                    formData.append(
                        'file',
                        fs.createReadStream(
                            `/root/app/storage/chat365/uploads/${files[i].replace(/[ +!@#$%^&*]/g, '')}`
                        )
                    );
                } else if (
                    req.files[i].filename
                        .toUpperCase()
                        .split('.')
                    [req.files[i].filename.toUpperCase().split('.').length - 1].includes('JPG')
                ) {
                    await sharp(`/root/app/storage/chat365/uploads/${files[i].replace(/[ +!@#$%^&*]/g, '')}`)
                        .resize({ fit: sharp.fit.contain, width: 1200, height: 1200 })
                        .toFile(`/root/app/storage/chat365/uploadsImageSmall/${files[i]}`);
                    formData.append(
                        'file',
                        fs.createReadStream(
                            `/root/app/storage/chat365/uploads/${files[i].replace(/[ +!@#$%^&*]/g, '')}`
                        )
                    );
                } else if (
                    req.files[i].filename
                        .toUpperCase()
                        .split('.')
                    [req.files[i].filename.toUpperCase().split('.').length - 1].includes('PNG')
                ) {
                    await sharp(`/root/app/storage/chat365/uploads/${files[i].replace(/[ +!@#$%^&*]/g, '')}`)
                        .resize({ fit: sharp.fit.contain, width: 1200, height: 1200 })
                        .toFile(`/root/app/storage/chat365/uploadsImageSmall/${files[i]}`);
                    formData.append(
                        'file',
                        fs.createReadStream(
                            `/root/app/storage/chat365/uploads/${files[i].replace(/[ +!@#$%^&*]/g, '')}`
                        )
                    );
                }
            }
            await axios({
                method: 'post',
                url: 'http://43.239.223.142:9000/api/file/UploadFile',
                data: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log('Du lieu file tra ve', files);
            res.json({
                data: {
                    result: true,
                    message: 'Upload File thành công',
                    listNameFile: files,
                },
                error: null,
            });
        } else {
            res.status(200).json(createError(200, 'Vui lòng chọn file muốn Upload'));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//api cài ảnh đại diện mới
export const SetupNewAvatar = async (req, res, next) => {
    try {
        const user = await User.find({ avatarUser: { $ne: '' } }, { _id: 1 });
        if (user) {
            for (let i = 0; i < user.length; i++) {
                if (fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`)) {
                    fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`).forEach(
                        (file, index) => {
                            const curPath = path.join(
                                `C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`,
                                file
                            );
                            if (
                                fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(user[i]._id)}`).length >
                                1
                            ) {
                                fs.unlinkSync(curPath);
                            }
                        }
                    );
                }
            }
            res.json({
                data: {
                    message: 'Setup thành công',
                },
                error: null,
            });
        } else {
            res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
        }
    } catch (err) {
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// api ảnh đại diện mới cho nhóm:
export const SetupNewAvatarGroup = async (req, res, next) => {
    try {
        const conversation = await Conversation.find({ avatarConversation: { $ne: '' } }, { _id: 1 });
        if (conversation) {
            for (let i = 0; i < conversation.length; i++) {
                if (fs.existsSync(`C:/Chat365/publish/wwwroot/avatarGroup/${String(conversation[i]._id)}`)) {
                    fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarGroup/${String(conversation[i]._id)}`).forEach(
                        (file, index) => {
                            const curPath = path.join(
                                `C:/Chat365/publish/wwwroot/avatarGroup/${String(conversation[i]._id)}`,
                                file
                            );
                            if (
                                fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarGroup/${String(conversation[i]._id)}`)
                                    .length > 1
                            ) {
                                fs.unlinkSync(curPath);
                            }
                        }
                    );
                }
            }
            res.json({
                data: {
                    message: 'Setup thành công',
                },
                error: null,
            });
        } else {
            res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
        }
    } catch (err) {
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const UploadNewFile = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.SenderID) {
                console.log('Token hop le, UploadNewFile');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        let formData = new FormData();
        formData.append('MessageID', req.body.MessageID);
        formData.append('ConversationID', req.body.ConversationID);
        formData.append('SenderID', req.body.SenderID);
        formData.append('MessageType', req.body.MessageType);
        formData.append('DeleteTime', req.body.DeleteTime);
        formData.append('MemberList', req.body.MemberList);
        formData.append('ListFile', req.body.ListFile);
        const MessageID = req.body.MessageID;
        const ConversationID = Number(req.body.ConversationID);
        const SenderID = Number(req.body.SenderID);
        const MessageType = req.body.MessageType;
        const DeleteTime = req.body.DeleteTime;
        const MemberList = req.body.MemberList.replace('[', '').replace(']', '').split(',');
        for (let i = 0; i < MemberList.length; i++) {
            MemberList[i] = Number(MemberList[i]);
        }
        let listFile = req.body.ListFile.replace('[', '').replace(']', '');
        while (listFile.includes('},{')) {
            listFile = listFile.replace('},{', '};{');
        }
        listFile = listFile.split(';');
        for (let i = 0; i < listFile.length; i++) {
            listFile[i] = JSON.parse(listFile[i]);
        }
        let files = [];
        for (let i = 0; i < req.files.length; i++) {
            listFile[i].NameDownload = listFile[i].FullName.replace(/[ +!@#$%^&*]/g, '');
            const name = req.files[i].originalname.slice(
                req.files[i].originalname.indexOf('.'),
                req.files[i].originalname.length
            );
            if (FileDanger.includes(name.toUpperCase())) {
                return res.status(200).json(createError(200, 'File được chọn không thể upload'));
            }
            fs.writeFileSync(
                `/root/app/storage/chat365/uploads/${listFile[i].FullName.replace(/[ +!@#$%^&*]/g, '')}`,
                req.files[i].buffer
            );
            formData.append(
                'file',
                fs.createReadStream(
                    `/root/app/storage/chat365/uploads/${listFile[i].FullName.replace(/[ +!@#$%^&*]/g, '')}`
                ),
                {
                    filename: `req.files[i].originalname`,
                }
            );
            if (
                req.files[i].originalname.toUpperCase().includes('JPEG') ||
                req.files[i].originalname.toUpperCase().includes('JPG') ||
                req.files[i].originalname.toUpperCase().includes('PNG')
            ) {
                await sharp(req.files[i].buffer)
                    .resize({ fit: sharp.fit.contain, width: 120, height: 120 })
                    .toFile(
                        `/root/app/storage/chat365/uploadsImageSmall/${listFile[i].FullName.replace(
                            /[ +!@#$%^&*]/g,
                            ''
                        )}`
                    );
            }
        }
        const test = await axios({
            method: 'post',
            url: 'http://43.239.223.142:9000/api/file/UploadNewFile',
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('tesst', test);
        const index =
            (
                await Conversation.aggregate([
                    {
                        $match: {
                            _id: Number(ConversationID),
                        },
                    },
                    {
                        $unwind: {
                            path: '$messageList',
                        },
                    },
                    {
                        $count: 'count',
                    },
                ])
            )[0].count - 1;
        const objUpdate = {};
        const updateQuery = 'messageList.' + index + '.isEdited';
        objUpdate[updateQuery] = 0;
        const conv = await Conversation.findOneAndUpdate(
            { _id: Number(ConversationID) },
            { $set: objUpdate },
            { projection: { _id: 1, memberList: 1, typeGroup: 1 } }
        );
        const mess = {
            MessageID: MessageID,
            ConversationID: Number(ConversationID),
            SenderID: Number(SenderID),
            MessageType: MessageType,
            Message: '',
            CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace(
                'Z',
                ''
            )}+07:00`,
            IsEdited: 0,
            DeleteTime: 0,
            DeleteDate: new Date(),
            DeleteType: 0,
            IsFavorite: 0,
            ListFile: listFile,
        };
        const listMember = [],
            listDevices = [],
            listfromWeb = [],
            isOnline = [];
        let currentWeb = '';
        for (let i = 0; i < conv.memberList.length; i++) {
            if ((mess.LiveChat && mess.LiveChat.ClientId) || conv.typeGroup === 'liveChat') {
                if (conv.memberList[i].liveChat && conv.memberList[i].liveChat.clientId) {
                    if (!listDevices.includes(conv.memberList[i].liveChat.clientId))
                        listDevices.push(conv.memberList[i].liveChat.clientId);
                    if (listMember.includes(conv.memberList[i].memberId))
                        listMember.splice(listMember.indexOf(conv.memberList[i].memberId), 1);
                    if (conv.memberList[i].memberId === mess.SenderID) currentWeb = conv.memberList[i].liveChat.fromWeb;
                } else {
                    if (!listMember.includes(conv.memberList[i].memberId))
                        listMember.push(Number(conv.memberList[i].memberId));
                }
            } else {
                if (!listMember.includes(conv.memberList[i].memberId))
                    listMember.push(Number(conv.memberList[i].memberId));
            }
            // if (listMember.includes(conv.memberList[i].memberId)) {
            //     let uu = await User.findOne({_id: conv.memberList[i].memberId}, {isOnline: 1})
            //     if(uu) isOnline.push(uu.isOnline)
            // }
        }
        if ((mess.LiveChat && messages.LiveChat.ClientId) || (conv && conv.typeGroup === 'liveChat')) {
            const checkUser = await User.findOne({ _id: mess.SenderID }, { userName: 1 });
            mess.SenderName = checkUser.userName;
            socket.emit('SendMessage', mess, listMember, listDevices, 'SuppportOtherWeb', currentWeb);
        } else {
            socket.emit('SendMessage', mess, MemberList);
        }
        res.json({
            data: {
                message: MessageID,
            },
            error: null,
        });
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const DownLoadAvatar = async (req, res, next) => {
    try {
        if (req.params) {
            const fileName = req.params.fileName;
            const sfileName = fileName.slice(0, fileName.indexOf('.'));
            const user = sfileName.slice(sfileName.indexOf('_') + 1, sfileName.length);
            const filePath = `C:/Chat365/publish/wwwroot/avatarUser/${user}/${fileName}`;
            if (fs.existsSync(filePath)) {
                res.send(fs.readFileSync(filePath, { encoding: 'utf8' }));
                // res.download(filePath)
            } else {
                res.status(200).json(createError(200, 'Avatar không tồn tại'));
            }
        } else {
            res.status(200).json(createError(200, 'Chưa truyền params'));
        }
    } catch (err) {
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// api tải ảnh nhóm:
export const DownloadAvatarGroup = async (req, res, next) => {
    try {
        if (req.params) {
            const fileName = req.params.fileName;
            const sfileName = fileName.slice(0, fileName.indexOf('.'));
            const conversation = sfileName.slice(sfileName.indexOf('_') + 1, sfileName.length);
            const filePath = `/root/app/storage/chat365/avatarGroup/${conversation}/${fileName}`;
            if (fs.existsSync(filePath)) {
                // res.download(filePath)
                res.send(fs.readFileSync(filePath, { encoding: 'utf8' }));
            } else {
                res.status(200).json(createError(200, 'Avatar không tồn tại'));
            }
        } else {
            res.status(200).json(createError(200, 'Chưa truyền params'));
        }
    } catch (err) {
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// api tải file
export const DownloadFile = async (req, res, next) => {
    try {
        if (req.params) {
            const filePath = `/root/app/storage/chat365/uploads/${req.params.fileName}`;
            if (fs.existsSync(filePath)) {
                res.download(filePath);
                // res.send(fs.readFileSync(filePath, {encoding: 'utf8'}))
            } else {
                res.redirect('http://43.239.223.142:9000/api/file/DownloadFile/' + req.params.fileName);
                // res.redirect("http://43.239.223.142:9000/api/file/DownloadFile/"+req.params.fileName);
                // res.status(200).json(createError(200, "File không tồn tại"))
            }
        } else {
            res.status(200).json(createError(200, 'Chưa truyền params'));
        }
    } catch (err) {
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

// api tải file
export const DownloadSmallFile = async (req, res, next) => {
    try {
        if (req.params) {
            const filePath = `/root/app/storage/chat365/uploadsImageSmall/${req.params.filename}`;

            if (fs.existsSync(filePath)) {
                res.send(fs.readFileSync(filePath, { encoding: 'utf8' }));
                // res.download(filePath)
            } else {
                res.status(200).json(createError(200, 'File không tồn tại'));
            }
        } else {
            res.status(200).json(createError(200, 'Chưa truyền params'));
        }
    } catch (err) {
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

//api upload ảnh đại diện 2
export const UploadNewAvatar = async (req, res, next) => {
    if (req.body.ID && req.file) {
        if (
            req.file.mimetype === 'application/octet-stream' ||
            req.file.mimetype === 'image/jpeg' ||
            req.file.mimetype === 'image/jpg' ||
            req.file.mimetype === 'image/png'
        ) {
            const userId = Number(req.body.ID);
            const checkUser = await User.findOne({ _id: userId }, { _id: 1, type: 1, fromWeb: 1, createdAt: 1 })
            if (!checkUser) {
                return res.status(200).json(createError(200, 'Tài khoản không tồn tại'));
            }
            if (!fs.existsSync('C:/Chat365/publish/wwwroot/avatarUser')) {
                fs.mkdirSync('C:/Chat365/publish/wwwroot/avatarUser');
            }
            if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`)) {
                fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`);
            }
            const avatarUser = `${Date.now() * 10000 + 621355968000000000}_${userId}.jpg`;
            await sharp(req.file.buffer).toFile(`C:/Chat365/publish/wwwroot/avatarUser/${userId}/${avatarUser}`);
            if (fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`).length >= 10) {
                const fileDelete = fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}`)[0];
                fs.unlinkSync(`C:/Chat365/publish/wwwroot/avatarUser/${String(userId)}/${fileDelete}`);
            }

            const user = await User.findOneAndUpdate(
                { _id: userId },
                { avatarUser: avatarUser },
                { new: true, projection: { avatarUser: 1, email: 1, password: 1, type365: 1, id365: 1, idTimViec: 1 } }
            );
            if (user) {
                res.json({
                    data: {
                        result: true,
                        message: avatarUser,
                    },
                    error: null,
                });
            } else {
                res.status(200).json(createError(200, 'Thông tin truyền không chính xác'));
            }
        } else {
            res.status(200).json(createError(200, 'File không phải là hình ảnh'));
        }
    } else {
        res.status(200).json(createError(200, 'Dữ liệu truyền lên không đầy đủ'));
    }
};

export const UploadNewAvatarGroup = async (req, res, next) => {
    try {
        if (req.body.conversationId && req.file) {
            if (
                req.file.originalname.toUpperCase().includes('JPEG') ||
                req.file.originalname.toUpperCase().includes('JPG') ||
                req.file.originalname.toUpperCase().includes('PNG')
            ) {
                const conversationId = Number(req.body.conversationId);
                if (!fs.existsSync('/root/app/storage/chat365/avatarGroup')) {
                    fs.mkdirSync('/root/app/storage/chat365/avatarGroup');
                }
                if (!fs.existsSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`)) {
                    fs.mkdirSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`);
                }
                const avatarConversation = `${Date.now() * 10000 + 621355968000000000}_${conversationId}.jpg`;
                await sharp(req.file.buffer).toFile(
                    `/root/app/storage/chat365/avatarGroup/${conversationId}/${avatarConversation}`
                );
                const fileDelete = fs.readdirSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`)[0];
                if (fs.readdirSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}`).length >= 10) {
                    fs.unlinkSync(`/root/app/storage/chat365/avatarGroup/${String(conversationId)}/${fileDelete}`);
                }
                const conversation = await Conversation.findOneAndUpdate(
                    { _id: Number(conversationId) },
                    { avatarConversation: avatarConversation },
                    { _id: 1 }
                );
                if (conversation) {
                    // conversation.avatarConversation = `${urlImgHost()}avatarConversation/${conversation._id}/${conversation.avatarConversation}`
                    res.json({
                        data: {
                            result: true,
                            message: avatarConversation,
                        },
                        error: null,
                    });
                } else {
                    res.status(200).json(createError(200, 'Cập nhật ảnh đại diện thất bại'));
                }
            } else {
                res.status(200).json(createError(200, 'File không phải là hình ảnh'));
            }
        } else {
            res.status(200).json(createError(200, 'Dữ liệu truyền lên không đầy đủ'));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, err.message));
    }
};

export const ToolUpdateAvatar = async (req, res) => {
    try {
        const user = await User.find({}, { avatarUser: 1 });
        for (let i = 0; i < user.length; i++) {
            console.log(i);
            if (user[i].avatarUser !== '' && fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}`)) {
                if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}/${user[i].avatarUser}`)) {
                    const count = fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}`).length;
                    if (count !== 0) {
                        const fileName = fs.readdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user[i]._id}`)[
                            count - 1
                        ];
                        await User.findOneAndUpdate({ _id: user[i]._id }, { avatarUser: fileName }, { _id: 1 });
                    } else {
                        await User.findOneAndUpdate({ _id: user[i]._id }, { avatarUser: '' }, { _id: 1 });
                    }
                }
            }
        }
        res.json({
            data: {
                result: true,
                message: 'Update thành công',
            },
            error: null,
        });
    } catch (err) {
        console.log(err);
    }
};

// xoa file
export const ToolDeleteFile = async (req, res, next) => {
    try {
        const time = new Date();
        time.setDate(time.getDate() - 20);
        const folderUpload = fs.readdirSync('C:/Chat365/publish/wwwroot/uploads');
        for (let i = 0; i < folderUpload.length; i++) {
            console.log(folderUpload[i]);
            if (fs.statSync(`C:/Chat365/publish/wwwroot/uploads/${folderUpload[i]}`).birthtime < time) {
                fs.unlinkSync(`C:/Chat365/publish/wwwroot/uploads/${folderUpload[i]}`);
                if (fs.existsSync(`C:/Chat365/publish/wwwroot/uploadsImageSmall/${folderUpload[i]}`)) {
                    fs.unlinkSync(`C:/Chat365/publish/wwwroot/uploadsImageSmall/${folderUpload[i]}`);
                }
            }
        }
        res.json({
            data: {
                result: true,
                message: 'Cập nhật File thành công',
            },
            error: null,
        });
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

export const DownloadFileWeb = async (req, res) => {
    try {
        if (req.body.fileName) {
            const fileName = req.body.fileName;
            const filePath = `C:/Chat365/publish/wwwroot/uploads/${fileName.replace(/[ +!@#$%^&*]/g, '')}`;
            const newFile = `C:/Chat365/publish/wwwroot/uploads/${fileName.slice(fileName.indexOf('-') + 1)}`;
            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, newFile);
                res.download(newFile, function (err) {
                    fs.unlinkSync(newFile);
                });
            } else {
                res.status(200).json(createError(200, 'File không tồn tại'));
            }
        } else {
            res.status(200).json(createError(200, 'Thiếu thông tin truyền lên'));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, 'Đã có lỗi xảy ra'));
    }
};

const storageImageAds = (destination) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            let formDestination = ' ';
            formDestination = `${destination}/${req.body.userId}`; // Tạo đường dẫn đến thư mục của người dùng
            if (!fs.existsSync(formDestination)) {
                // Nếu thư mục chưa tồn tại thì tạo mới
                fs.mkdirSync(formDestination, { recursive: true });
            }
            cb(null, formDestination);
        },
        fileFilter: function (req, file, cb) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only .jpeg, .png, .jpg format allowed!'));
            }
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + '.' + file.originalname.split('.').pop());
        },
    });
};

export const uploadImageAds = multer({
    storage: storageImageAds('../../storage/chat365/adsImage'),
}).any('images');
