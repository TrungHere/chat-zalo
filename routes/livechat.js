import express from "express";
import formData from 'express-form-data';
import {
    sendMessage,
    addMemberToChatGroup,
    setResponseTime,
    startPrivateChat,
    replyToMessage,
    getMessagePrivatechatList,
    getGroupchatList,
    getPrivatechatList,
    stopPrivatechat,
    getAllPrivatechatList,
    getPrivatechatListCompany,
    getMessagePrivatechatUserList
} from "../controllers/Livechat.js";
const router = express.Router();

// gửi tin nhắn
router.post('/sendMessage', formData.parse(), sendMessage);

// Thêm thành viên vào nhóm live chat
router.post('/addMemberToChatGroup', formData.parse(), addMemberToChatGroup);

// Cài đặt thời gian trả lời
router.post('/setResponseTime', formData.parse(), setResponseTime);

// Bắt đầu cuộc trò chuyện riêng giữa hai người
router.post('/startPrivateChat', formData.parse(), startPrivateChat);

// Trả lời tin nhắn khách hàng
router.post('/replyToMessage', formData.parse(), replyToMessage);

// Danh sách tin nhắn private 1 nhóm theo ID nhân viên
router.post(
    "/getMessagePrivatechatUserList",
    formData.parse(),
    getMessagePrivatechatList
);

// Danh sách tin nhắn private 1 nhóm theo ID người dùng
router.post(
    "/getMessagePrivatechatList",
    formData.parse(),
    getMessagePrivatechatUserList
);


// Danh sách tin nhắn nhóm chung
router.post('/getGroupchatList', formData.parse(), getGroupchatList);

// Danh sách các nhóm tin nhắn private theo id nhân viên
router.post('/getPrivatechatList', formData.parse(), getPrivatechatList);

// Dừng cuộc trò chuyện từ phía khách hàng
router.post('/stopPrivatechat', formData.parse(), stopPrivatechat);

// Thống kê lịch sử trò chuyện bằng tài khoản nhân viên
router.post('/getAllPrivatechatList', formData.parse(), getAllPrivatechatList);

// Thống kê lịch sử trò chuyện bằng tài khoản công ti
router.post('/getPrivatechatListCompany', formData.parse(), getPrivatechatListCompany);

export default router
