import ChatGroup from "../models/chatGroup.js";
import ChatMessage from "../models/chatMessage.js";
import PrivateChat from "../models/privateChat.js";
import io from 'socket.io-client';
import { success, setError, getMaxID } from './functions.js';
const chatTimeouts = {};
const socket = io.connect('http://43.239.223.142:3000', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});

// Lấy danh sách tin nhắn trong cuộc trò chuyện chung
// export const  getChatGroupMessages = async (req, res) => {
//   try {
//     const { chatGroupId } = req.body;
//     // Tìm cuộc trò chuyện chung dựa trên tên hoặc ID
//     const chatmessage = await ChatMessage.findOne({ chatGroupId: chatGroupId });

//     if (!chatmessage) {
//       return setError(res, "Cuộc trò chuyện không tồn tại", 400);
//     }
//     return res.status(200).json({
//       result: true,
//       message: "Kết quả",
//       data: { chatmessage },
//       error: null,
//     });
//   } catch (error) {
//     console.error(error);
//     return setError(
//       res,
//       "Lỗi khi lấy tin nhắn cuộc trò chuyện chung",
//       400
//     );
//   }
// };

// Người dùng gửi tin nhắn
export const sendMessage = async (req, res) => {
  try {
    const { senderId, message } = req.body;
    // const senderId = req.cookies.senderID;
    // const senderId = 1;

    const chatmessage = await PrivateChat.findOne({
      messages: {
        $elemMatch: {
          senderID: senderId,
        },
      },
    });
    if (!chatmessage) {
      const chatgroup = await ChatGroup.findOne({ chatGroupId: 1 }).lean();
      const created_at = new Date().getTime();
      // Thêm tin nhắn vào cuộc trò chuyện chung
      const newMessage = new ChatMessage({
        sender: senderId,
        messages: message,
        created_at: created_at,
        chatGroupId: chatgroup.chatGroupId,
        status: 1,
      });
      await newMessage.save();

      const chatmessagegroup = await ChatMessage.findOne({ chatGroupId: 1 });

      if (!chatmessagegroup) {
        return setError(res, "Cuộc trò chuyện không tồn tại", 400);
      }
      // socket gửi thông báo
      // socket.emit('newMessage', { message: message });

      return res.status(200).json({
        result: true,
        message: "Đã gửi tin nhắn vào nhóm chat chung",
        data: { chatmessagegroup },
        error: null,
      });
    } else {
      const created_at = new Date().getTime();
      // Thêm tin nhắn vào cuộc trò riêng
      const newMessage = new ChatMessage({
        sender: senderId,
        messages: message,
        created_at: created_at,
        chatGroupId: 1,
        status: 2,
      });
      await newMessage.save();
      const messageprivate = {
        receivedID: chatmessage.messages[0].receivedID,
        senderID: senderId,
        content: message,
        created_at: created_at,
      };
      chatmessage.messages.push(messageprivate);
      await chatmessage.save();

      // Tạo hẹn giờ cho cuộc trò chuyện
      chatTimeouts[chatmessage._id] = setTimeout(async () => {
        // Kiểm tra xem cuộc trò chuyện đã được trả lời chưa
        if (chatTimeouts[chatmessage._id]) {
          // Gửi tin nhắn trở lại vào nhóm chung (ví dụ: thông báo cuộc trò chuyện hết thời gian)
          await ChatMessage.findByIdAndUpdate(newMessage._id, {
            status: 3,
            created_at: created_at,
          });
          await chatmessage.updateOne({ lock: 1 });
          // socket.emit('newMessage', { message: message });
        }
      }, 30000); // Hẹn giờ trong 30 giây
      return setError(res, "Đã gửi tin nhắn vào nhóm riêng tư", 200);
    }
  } catch (e) {
    console.log(e);
    return setError(res, "Đã có lỗi xảy ra", 400);
  }
};

// Thêm thành viên vào nhóm live chat
export const addMemberToChatGroup = async (req, res) => {
  try {
    const { chatGroupId, memberId } = req.body;

    // Kiểm tra xem chatGroupId và memberId có hợp lệ không
    if (!chatGroupId || !memberId) {
      return res
        .status(400)
        .json({ error: "Chat group ID và member ID là bắt buộc" });
    }

    // Kiểm tra xem chatGroupId có tồn tại không
    const chatGroup = await ChatGroup.findById(chatGroupId);

    if (!chatGroup) {
      return res.status(404).json({ error: "Chat group không tồn tại" });
    }

    // Kiểm tra xem memberId có tồn tại không
    const member = await User.findById(memberId);

    if (!member) {
      return res.status(404).json({ error: "Thành viên không tồn tại" });
    }

    // Kiểm tra xem thành viên đã tồn tại trong nhóm chưa
    if (chatGroup.members.includes(memberId)) {
      return res
        .status(400)
        .json({ error: "Thành viên đã tồn tại trong nhóm" });
    }

    // Thêm memberId vào danh sách thành viên của nhóm
    chatGroup.members.push(memberId);
    await chatGroup.save();

    return res
      .status(201)
      .json({ message: "Thêm thành viên vào nhóm thành công" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Lỗi khi thêm thành viên vào nhóm live chat" });
  }
};

// Cài đặt thời gian trả lời
export const setResponseTime = async (req, res) => {
  try {
    const { chatGroupId, responseTime } = req.body;

    // Kiểm tra xem chatGroupId có hợp lệ không
    if (!chatGroupId) {
      return res.status(400).json({ error: "Chat group ID là bắt buộc" });
    }

    // Kiểm tra xem chatGroupId có tồn tại không
    const chatGroup = await ChatGroup.findById(chatGroupId);

    if (!chatGroup) {
      return res.status(404).json({ error: "Chat group không tồn tại" });
    }

    // Cập nhật thời gian trả lời cho nhóm
    chatGroup.responseTime = responseTime;
    await chatGroup.save();

    return res
      .status(200)
      .json({ message: "Cài đặt thời gian trả lời thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi cài đặt thời gian trả lời" });
  }
};

// Bắt đầu cuộc trò chuyện riêng giữa hai người
export const startPrivateChat = async (req, res) => {
  try {
    const { receivedID, senderID, message, mess_id } = req.body;

    // Kiểm tra xem senderID và receivedID có hợp lệ không
    if (!senderID || !receivedID) {
      return res
        .status(400)
        .json({ error: "senderID và receivedID là bắt buộc" });
    }

    // Kiểm tra xem cuộc trò chuyện riêng giữa nhân viên bất kì và khách hàng đã tồn tại chưa
    const existingChat = await PrivateChat.findOne({
      messages: {
        $elemMatch: {
          senderID: senderID,
        },
      },
    });

    if (existingChat) {
      // cập nhật tin nhắn vào cuộc trò chuyện riêng
      const created_at = new Date().getTime();
      const newMessage = {
        receivedID: receivedID,
        senderID: senderID,
        content: message,
        created_at: created_at,
      };

      // Thêm tin nhắn mới vào mảng messages của existingChat
      existingChat.messages.push(newMessage);
      await existingChat.save();
      // ẩn tin nhắn khỏi nhóm chung
      await ChatMessage.findByIdAndUpdate(mess_id, { status: 2 });
      await existingChat.updateOne({ lock: 0 });
      // await PrivateChat.updateMany(
      //   { messages: [{ senderID: senderID }] },
      //   { lock: 0 }
      // );
      chatTimeouts[existingChat._id] = setTimeout(async () => {
        // Kiểm tra xem cuộc trò chuyện đã được trả lời chưa
        if (chatTimeouts[existingChat._id]) {
          // Gửi tin nhắn trở lại vào nhóm chung (ví dụ: thông báo cuộc trò chuyện hết thời gian)
          await ChatMessage.findByIdAndUpdate(mess_id, {
            status: 3,
            // created_at: created_at,
          });
          await existingChat.updateOne({ lock: 1 });

          // socket.emit('newMessage', { message: message });
        }
      }, 30000); // Hẹn giờ trong 30 giây
      return res.status(200).json({
        result: true,
        message: "Cuộc trò chuyện riêng đã tồn tại trước đó",
        data: existingChat,
        error: null,
      });
    } else {
      // ẩn tin nhắn khỏi nhóm chung
      await ChatMessage.findByIdAndUpdate(mess_id, { status: 2 });
      // Tạo cuộc trò chuyện riêng mới
      const created_at = new Date().getTime();
      const newChat = new PrivateChat({
        messages: [
          {
            receivedID: receivedID,
            senderID: senderID,
            content: message,
            created_at: created_at,
          },
        ],
      });
      await newChat.save();

      chatTimeouts[newChat._id] = setTimeout(async () => {
        // Kiểm tra xem cuộc trò chuyện đã được trả lời chưa
        if (chatTimeouts[newChat._id]) {
          // Gửi tin nhắn trở lại vào nhóm chung (ví dụ: thông báo cuộc trò chuyện hết thời gian)
          await ChatMessage.findByIdAndUpdate(mess_id, {
            status: 3,
            // created_at: created_at,
          });
          await newChat.updateOne({ lock: 1 });
          // socket.emit('newMessage', { message: message });
        }
      }, 30000); // Hẹn giờ trong 30 giây
      return res
        .status(201)
        .json({ message: "Bắt đầu cuộc trò chuyện riêng thành công" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi bắt đầu cuộc trò chuyện riêng" });
  }
};

// Trả lời tin nhắn khách hàng
export const replyToMessage = async (req, res) => {
  try {
    const { senderId, message, receivedID, group_id } = req.body;

    // Kiểm tra các thông tin cần thiết
    if (!senderId || !receivedID || !message || !group_id) {
      return res.status(400).json({ error: "Thiếu thông tin cần thiết." });
    }

    // Tìm và cập nhật tin nhắn PrivateChat
    const existingChat = await PrivateChat.findOne({ _id: group_id, lock: 0 });
    if (existingChat) {
      const created_at = new Date().getTime();
      const newMessage = {
        receivedID: receivedID,
        senderID: senderId,
        content: message,
        created_at: created_at,
      };

      // Thêm tin nhắn mới vào mảng messages của existingChat
      existingChat.messages.push(newMessage);
      await existingChat.save();
      clearTimeout(chatTimeouts[group_id]);
      return res.status(200).json({ message: "Gửi tin nhắn thành công" });
    } else {
      res.status(500).json({ error: "Cuộc trò chuyện không tồn tại" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gửi tin thất bại" });
  }
};

// Danh sách tin nhắn private 1 nhóm theo ID người dùng
export const getMessagePrivatechatUserList = async (req, res) => {
  try {
    let { userID, limit, page } = req.body;
    if (!page) page = 1;
    if (!limit) limit = 10;
    let skip = limit * (page - 1);
    let data = await PrivateChat.findOne({
      $or: [{ "messages.senderID": userID }, { "messages.receivedID": userID }],
    })
      .skip(skip)
      .limit(limit) // Giới hạn số bản ghi trên mỗi trang
      .lean();
    {
      return success(res, "Danh sách tin nhắn", {
        data: data,
      });
    }
  } catch (e) {
    console.log(e);
    return setError(res, e.message);
  }
};

// Danh sách tin nhắn private 1 nhóm theo ID nhân viên
export const getMessagePrivatechatList = async (req, res) => {
  try {
    let { userID, limit, page, group_id } = req.body;
    if (!page) page = 1;
    if (!limit) limit = 10;
    let skip = limit * (page - 1);
    let data = await PrivateChat.find({
      $or: [{ "messages.senderID": userID }, { "messages.receivedID": userID }],
      _id: group_id,
    })
      .sort({ "messages.created_at": 1 })
      .skip(skip)
      .limit(limit) // Giới hạn số bản ghi trên mỗi trang
      .lean();
    {
      return success(res, "Danh sách tin nhắn", {
        data: data,
      });
    }
  } catch (e) {
    console.log(e);
    return setError(res, e.message);
  }
};


// Danh sách tin nhắn nhóm chung
export const getGroupchatList = async (req, res) => {
  try {
    let { chatGroupId, limit, page } = req.body;
    if (!page) page = 1;
    if (!limit) limit = 10;
    let skip = limit * (page - 1);
    let data = await ChatMessage.find({
      chatGroupId: chatGroupId,
      $or: [{ status: 1 }, { status: 3 }],
    })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit) // Giới hạn số bản ghi trên mỗi trang
      .lean();
    {
      return success(res, "Danh sách tin nhắn", {
        data: data,
      });
    }
  } catch (e) {
    console.log(e);
    return setError(res, e.message);
  }
};

// Danh sách các nhóm tin nhắn private theo id nhân viên
export const getPrivatechatList = async (req, res) => {
  try {
    let { userID, limit, page } = req.body;
    if (!page) page = 1;
    if (!limit) limit = 10;
    let skip = limit * (page - 1);
    let data = await PrivateChat.find({
      lock: 0,
      $or: [
        { messages: { $elemMatch: { senderID: userID } } },
        { messages: { $elemMatch: { receivedID: userID } } },
      ],
    })
      .select("_id")
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit) // Giới hạn số bản ghi trên mỗi trang
      .lean();
    {
      return success(res, "Danh sách các nhóm tin nhắn", {
        data: data,
      });
    }
  } catch (e) {
    console.log(e);
    return setError(res, e.message);
  }
};

// Dừng cuộc trò chuyện từ phía khách hàng
export const stopPrivatechat = async (req, res) => {
  try {
    let { cusID, group_id, employee_id } = req.body;
    // let cusID = req.cookied.cusID;
    let data = await PrivateChat.findOneAndUpdate(
      {
        $or: [{ "messages.senderID": cusID }, { "messages.receivedID": cusID }],
        _id: group_id,
      },
      { "messages.senderID": employee_id, "messages.receivedID": employee_id }
    );
    {
      return success(res, "Danh sách tin nhắn", {
        data: data,
      });
    }
  } catch (e) {
    console.log(e);
    return setError(res, e.message);
  }
};

// Thống kê lịch sử trò chuyện bằng tài khoản nhân viên
export const getAllPrivatechatList = async (req, res) => {
  try {
    let { userID, limit, page } = req.body;
    if (!page) page = 1;
    if (!limit) limit = 10;
    let skip = limit * (page - 1);
    let data = await PrivateChat.find({
      $or: [{ "messages.senderID": userID }, { "messages.receivedID": userID }],
      _id: group_id,
    })
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit) // Giới hạn số bản ghi trên mỗi trang
      .lean();
    {
      return success(res, "Danh sách các nhóm tin nhắn", {
        data: data,
      });
    }
  } catch (e) {
    console.log(e);
    return setError(res, e.message);
  }
};

// Thống kê lịch sử trò chuyện bằng tài khoản công ti
export const getPrivatechatListCompany = async (req, res) => {
  try {
    let { userID, limit, page } = req.body;
    if (!page) page = 1;
    if (!limit) limit = 10;
    let skip = limit * (page - 1);
    if (userID) {
      let data = await PrivateChat.find({
        $or: [
          { "messages.senderID": userID },
          { "messages.receivedID": userID },
        ],
        _id: group_id,
      })
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit) // Giới hạn số bản ghi trên mỗi trang
        .lean();
      return success(res, "Danh sách các nhóm tin nhắn", {
        data: data,
      });
    } else {
      let data = await PrivateChat.find()
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit) // Giới hạn số bản ghi trên mỗi trang
        .lean();
      return success(res, "Danh sách các nhóm tin nhắn", {
        data: data,
      });
    }
  } catch (e) {
    console.log(e);
    return setError(res, e.message);
  }
};
