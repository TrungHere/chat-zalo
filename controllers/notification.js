import { createError } from "../utils/error.js";
import { urlImgHost } from '../utils/config.js'
import fs from 'fs'
import Contact from "../models/Contact.js";
import Users from "../models/User.js";
import Notification from "../models/Notification.js";
import Conversation from "../models/Conversation.js";
import { fUsers } from "../functions/fModels/fUsers.js";
import { UsersModelExtra } from "../functions/fModels/fUsers.js";
import { InsertNewUserExtra } from "../functions/fTools/fUsers.js";
import { UpdateInfoUser } from "../functions/fTools/fUsers.js";
import NotificationFireBase from "../models/NotificationFireBase.js";
import { InsertNotification, fParticipantNotification } from "../functions/fTools/fNotification.js";
import { fInfoFile } from "../functions/fModels/fMessages.js";
import { FCreateNewConversation } from "../functions/Fconversation.js";
import { InsertNewUser } from "../functions/handleModels/InsertNewUser.js";
import { FSendMessage } from "../functions/fApi/message.js";
import { GetAvatarUser } from "../utils/GetAvatarUser.js"
import { GetAvatarUserSmall } from "../utils/GetAvatarUser.js"
import {
  GetInfoUser,
  GetUserByID365,
  UserQuitJob,
  UpdateCompany,
} from "../services/user.service.js";
import {
  checkEmptyConversation,
  InsertNewConversation1vs1,
  InsertMessage,
} from "../services/conversation.service.js";
import { GetDisplayMessage } from "../services/message.service.js"
import io from 'socket.io-client';
import axios from 'axios';
import qs from 'qs'
import date from 'date-and-time'
const socket = io.connect('http://43.239.223.142:3000', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});
const socketV3 = io("https://socket.timviec365.vn/", { token: "v3" });
import Counter from "../models/Counter.js";
import md5 from 'md5'
const GetEmployeeInfo = async (SenderId) => {
  try {
    let user;
    let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/get_infor_user.php', qs.stringify({
      'id_user': `${String(SenderId)}`
    }));
    if (response.data) {
      user = fUsers(0, response.data.data.user_info.ep_id, 0, 2, response.data.data.user_info.ep_email, response.data.data.user_info.ep_pass, response.data.data.user_info.ep_phone, response.data.data.user_info.ep_name, response.data.data.user_info.ep_image, "", 1, new Date(), 1, 1, 1, response.data.data.user_info.com_id, response.data.data.user_info.com_name, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
      return user;
    } else {
      return null
    }
  } catch (e) {
    console.log("GetEmployeeInfo", e)
    return null;
  }
}

const sendNewNotificationText = async (userId, contactId, mess, link) => {
  try {
    let convId = await FCreateNewConversation(Number(userId), Number(contactId))
    FSendMessage({
      body: {
        ConversationID: Number(convId),
        SenderID: Number(contactId),
        MessageType: "text",
        Message: mess,
        linkNotification: link,
        link: link
      }
    }).catch((e) => {
      console.log("error when send notificationX", e)
    })
    FSendMessage({
      body: {
        ConversationID: Number(convId),
        SenderID: Number(contactId),
        MessageType: "link",
        Message: link,
      }
    }).catch((e) => {
      console.log("error when send notificationX", e)
    })
  } catch (e) {
    console.log(e)
  }
}
const GetCompanyInfo = async (SenderId) => {
  try {
    let user;
    let response = await axios.get(`https://chamcong.24hpay.vn/api_tinhluong/list_com.php?id_com=${SenderId}`);
    if (response.data) {
      user = fUsers(0, SenderId, 0, 1, response.data.data.items[0].com_email, response.data.data.items[0].com_pass, response.data.data.items[0].com_phone, response.data.data.items[0].com_name, response.data.data.items[0].com_logo, "", 1, new Date(), 1, 1, 1, SenderId, response.data.data.items[0].com_name, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
      return user;
    } else {
      return null
    }
  } catch (e) {
    return null;
    console.log(e)
  }
}
const ConvertToObject = (string) => {
  let stringObject = string.replace(/{|}|"/g, '');
  let obj = {};
  let stringKeyValueArr = stringObject.split(",")
  for (let i = 0; i < stringKeyValueArr.length; i++) {
    obj[`${stringKeyValueArr[i].split(":")[0]}`] = `${stringKeyValueArr[i].slice(stringKeyValueArr[i].split(":")[0].length + 1, stringKeyValueArr[i].length).trim()}`
  }
  return obj
}
const ConvertToArrayObject = (string) => {
  let stringObject = string.replace("]", '').replace("[", '');
  let stringArrayObject = stringObject.split("},{")
  let arrayObject = [];
  for (let i = 0; i < stringArrayObject.length; i++) {
    arrayObject.push(ConvertToObject(stringArrayObject[i]));
  }
  return arrayObject
}
const ConvertToArrayNumber = (string) => {
  try {
    let StringArray = String(string).replace("[", "").replace("]", "");
    let array = StringArray.split(",");
    let arrayFinal = [];
    for (let i = 0; i < array.length; i++) {
      if (!isNaN(array[i])) {
        arrayFinal.push(Number(array[i]))
      }
    }
    return arrayFinal;
  } catch (e) {
    return [];
    console.log(e)
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
export const TransferPicture = async (req, res, next) => {
  try {
    if (req.body && req.body.id && req.body.picture && req.body.room && req.body.time && req.body.shift && req.body.name) {
      socket.emit("Send_cc", req.body.id, req.body.picture, req.body.room, req.body.time, req.body.shift, req.body.name);
      res.json({
        data: {
          result: true,
          message: "Gửi ảnh thành công",
        },
        error: null
      })
    } else {
      res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}

export const ChangeSalary = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.EmployeeId)) {
        console.log("Token hop le, createCanleChangeSalaryrdal")
      } else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    console.log("ChangeSalary", req.body)
    if (req.body && req.body.CompanyId && req.body.EmployeeId && req.body.Salary && req.body.ListReceive && req.body.CreateAt && String(req.body.ListReceive).includes("[")) {
      let ListReceive = [];
      if (req.body.ListReceive.includes("[")) {
        let StringListReceive = req.body.ListReceive;
        StringListReceive = StringListReceive.replace("[", "");
        StringListReceive = StringListReceive.replace("]", "");
        ListReceive = StringListReceive.split(",");
      } else if (req.body.ListReceive.length && req.body.ListReceive.length > 0) {
        ListReceive = req.body.ListReceive;
      } else {
        ListReceive = [];
      }

      let Salary = String(req.body.Salary)
      let dataUser = await Users.find({ idQLC: Number(req.body.EmployeeId), type: 2 }, { "inForPerson.employee.com_id": 1, userName: 1 }).lean();
      let user;
      if (dataUser && dataUser.length > 0) {
        user = dataUser[0];
      }
      if (user) {
        if ((user.inForPerson.employee.com_id && (String(user.inForPerson.employee.com_id) === String(req.body.CompanyId))) || (user.inForPerson.employee.com_id && (user.inForPerson.employee.com_id == req.body.CompanyId))) {
          let companyId = 0;
          if (user.inForPerson.employee.com_id) {
            companyId = Number(user.inForPerson.employee.com_id);
          } else if (user.inForPerson.employee.com_id) {
            companyId = Number(user.inForPerson.employee.com_id);
          }
          let DataCompany = await Users.find({ idQLC: Number(companyId), type: 1 }, { "inForPerson.employee.com_id": 1, userName: 1 }).lean();
          if (DataCompany) {
            if (DataCompany.length > 0) {
              companyId = DataCompany[0]._id;
              let company = fParticipantNotification(DataCompany[0].idQLC, DataCompany[0].userName, DataCompany[0].fromWeb, DataCompany[0]._id, DataCompany[0].idQLC, DataCompany[0].idTimViec365, DataCompany[0].lastActivedAt, DataCompany[0].type, DataCompany[0].userName, DataCompany[0].email ? DataCompany[0].email : DataCompany[0].phoneTK, DataCompany[0].isOnline);
              for (let i = 0; i < ListReceive.length; i++) {
                let receiver_infor = await Users.find({ idQLC: Number(ListReceive[i]), type: 2 }, {}).lean();
                if (receiver_infor && receiver_infor.length > 0) {

                  let newSalary = "";
                  for (let j = 0; j < Salary.length; j++) {
                    newSalary = `${newSalary}${Salary[j]}`
                    if ((Salary.length - 1 - j) % 3 == 0 && (Salary.length - 1 - j) != 0) {
                      newSalary = `${newSalary},`
                    }
                  }

                  let NotiCreateAt = new Date();
                  let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${receiver_infor[0]._id}`;
                  let Status = "";
                  if (ListReceive[i] == req.body.EmployeeId) {
                    Status = "Mức lương của bạn đã có sự thay đổi"
                  } else {
                    Status = `Bạn đã thay đổi mức lương cho nhân viên ${dataUser[0].userName}`
                  }

                  let insert = await InsertNotification(notificationId, receiver_infor[0]._id, companyId, "", Status, "ChangeSalary", "", 0, NotiCreateAt, "https://tinhluong.timviec365.vn/quan-ly-ho-so-ca-nhan.html");
                  if (insert > 0) {
                    let stringTime = "";
                    let hour = new Date().getHours();
                    let minute = new Date().getMinutes();
                    if (minute < 10) {
                      minute = "0" + minute;
                    }
                    let category;
                    if (hour > 12) {
                      hour = hour - 12;
                      category = "PM";
                      if (hour < 10) {
                        hour = `0${hour}`
                      }
                    } else {
                      category = "AM"
                    }
                    if (hour < 10) {
                      hour = `0${hour}`
                    }
                    let month = new Date().getMonth() + 1;
                    if (month < 10) {
                      month = `0${month}`
                    }
                    let date = new Date().getDate();
                    if (date < 10) {
                      date = `0${date}`
                    }

                    let second = new Date().getSeconds();
                    if (second < 10) {
                      second = `0${second}`
                    }
                    stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;
                    socket.emit("SendNotification", receiver_infor[0]._id, {
                      IDNotification: notificationId,
                      UserID: dataUser[0]._id,
                      Participant: company,
                      Title: "",
                      Message: Status,
                      MessageId: null,
                      Time: `Hôm nay lúc ${stringTime}`,
                      IsUnreader: 1,
                      Type: "ChangeSalary",
                      ConversationId: 0,
                      CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
                      Link: "https://tinhluong.timviec365.vn/quan-ly-ho-so-ca-nhan.html"
                    });
                  }
                }
              }
              res.json({
                data: {
                  result: true,
                  message: "Thông báo đến tài khoản Chat365 thành công",
                },
                error: null
              })
            }
            else {
              res.status(200).json(createError(200, "Sai thông tin công ty"));
            }
          }
        }
        else {
          res.status(200).json(createError(200, "Sai thông tin công ty"));
        }
      }
      else {
        res.status(200).json(createError(200, "Không tìm thấy thông tin nhân viên"));
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
export const NotificationRose = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.ID)) {
        console.log("Token hop le, NotificationRose")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body && req.body.ID && req.body.ID365 && req.body.CompanyId) {
      let receiveInfor = req.body;
      if ((Number(receiveInfor.ID) > 0) && (Number(receiveInfor.ID365) > 0) && (Number(receiveInfor.CompanyId) > 0)) {
        axios.post('https://tinhluong.timviec365.vn/api_web/api_hoa_hong_nv.php', qs.stringify({
          'uid': `${String(receiveInfor.ID365)}`,
          'cp': `${String(receiveInfor.CompanyId)}`
        })).then(async (response) => {
          // console.log('CompanyIdChat', response)
          if (response && response.data && response.data.data) {
            let CompanyAccount = await Users.findOne({ idQLC: Number(receiveInfor.CompanyId), type: 1 }, { _id: 1 }).lean();
            let CompanyIdChat = 0;
            if (CompanyAccount) {
              CompanyIdChat = CompanyAccount._id;
            }
            // console.log('CompanyIdChat', CompanyIdChat)
            if (CompanyIdChat != 0) {
              let mess = "Tổng hoa hồng hiện tại của bạn trong tháng này là: " + response.data.data.item_rose.rose_sum + " VNĐ\n" + "Trong đó:\n" + "+ Hoa hồng tiền: " + response.data.data.item_rose.rose1 + " VNĐ\n+ Hoa hồng doanh thu: " + response.data.data.item_rose.rose2 + " VNĐ\n+ Hoa hồng lợi nhuận: " + response.data.data.item_rose.rose3 + " VNĐ\n+ Hoa hồng lệ phí vị trí: " + response.data.data.item_rose.rose4 + " VNĐ\n+ Hoa hồng kế hoạch: " + response.data.data.item_rose.rose5 + " VNĐ";;
              const convId = await FCreateNewConversation(Number(receiveInfor.ID), Number(CompanyIdChat))
              // let convId = await axios({
              //   method: "post",
              //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
              //   data: {
              //     userId: Number(receiveInfor.ID),
              //     contactId: Number(CompanyIdChat),
              //   },
              //   headers: { "Content-Type": "multipart/form-data" }
              // })
              if (convId) {
                FSendMessage({
                  body: {
                    ConversationID: Number(convId),
                    SenderID: Number(CompanyIdChat),
                    MessageType: "text",
                    Message: mess,
                  }
                }).catch((e) => {
                  console.log("error when send notificationX", e)
                })
                // await axios({
                //   method: "post",
                //   url: "http://43.239.223.142:9000/api/message/SendMessage",
                //   data: {
                //     ConversationID: Number(convId),
                //     SenderID: Number(CompanyIdChat),
                //     MessageType: "text",
                //     Message: mess,
                //   },
                //   headers: { "Content-Type": "multipart/form-data" }
                // })
              }
            }
          }
        }).catch((e) => {
          console.log(e);
        });
        res.json({
          data: {
            result: true,
            message: "Thông báo đến tài khoản Chat365 thành công",
          },
          error: null
        })
      }
      else {
        res.status(200).json(createError(200, "Thông tin truyền lên không hợp lệ"));
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

export const SendNewNotification = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, SendNewNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body && req.body.UserId && req.body.SenderId && req.body.Message) {
      let receiveInfor = req.body;
      if ((Number(receiveInfor.UserId) > 0) && (Number(receiveInfor.SenderId) > 0)) {
        axios({
          method: "post",
          url: "http://43.239.223.142:3005/Conversation/CreateNewConversation",
          data: {
            userId: Number(receiveInfor.UserId),
            contactId: Number(receiveInfor.SenderId),
          },
          headers: { "Content-Type": "multipart/form-data" }
        }).then(async (response) => {
          if (response && response.data && response.data.data) {
            let convId = response.data.data.conversationId;
            if (!req.body.Link) {
              FSendMessage({
                body: {
                  ConversationID: Number(convId),
                  SenderID: Number(receiveInfor.SenderId),
                  MessageType: "text",
                  Message: receiveInfor.Message,
                }
              }).catch((e) => {
                console.log("error when send notificationX", e)
              })
              // let sendmess = await axios({
              //   method: "post",
              //   url: "http://43.239.223.142:9000/api/message/SendMessage",
              //   data: {
              //     ConversationID: Number(convId),
              //     SenderID: Number(receiveInfor.SenderId),
              //     MessageType: "text",
              //     Message: receiveInfor.Message,
              //   },
              //   headers: { "Content-Type": "multipart/form-data" }
              // })
            }
            else {
              FSendMessage({
                body: {
                  ConversationID: Number(convId),
                  SenderID: Number(receiveInfor.SenderId),
                  MessageType: "text",
                  Message: receiveInfor.Message,
                }
              }).catch((e) => {
                console.log("error when send FSendMessage", e)
              })
              // let sendmess = await axios({
              //   method: "post",
              //   url: "http://43.239.223.142:9000/api/message/SendMessage",
              //   data: {
              //     ConversationID: Number(convId),
              //     SenderID: Number(receiveInfor.SenderId),
              //     MessageType: "text",
              //     Message: receiveInfor.Message,
              //   },
              //   headers: { "Content-Type": "multipart/form-data" }
              // })
              FSendMessage({
                body: {
                  ConversationID: Number(convId),
                  SenderID: Number(receiveInfor.SenderId),
                  MessageType: "link",
                  Message: receiveInfor.Link,
                }
              }).catch((e) => {
                console.log("error when send FSendMessage", e)
              })
              // let sendmes2 = await axios({
              //   method: "post",
              //   url: "http://43.239.223.142:9000/api/message/SendMessage",
              //   data: {
              //     ConversationID: Number(convId),
              //     SenderID: Number(receiveInfor.SenderId),
              //     MessageType: "link",
              //     Message: receiveInfor.Link,
              //   },
              //   headers: { "Content-Type": "multipart/form-data" }
              // })
            }
          }
        }).catch((e) => {
          console.log(e)
        })
        res.json({
          data: {
            result: true,
            message: "Thông báo đến tài khoản Chat365 thành công",
          },
          error: null
        })
      }
      else {
        res.status(200).json(createError(200, "Thông tin không hợp lệ"));
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
// trao đổi với anh Quang nắm được ý tưởng bài toán 
export const SendNotification = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, SendNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    // console.log("sendNotification",req.body)
    if (req.body && req.body.UserId) {
      let receiveInfor = req.body;
      let userID = Number(receiveInfor.UserId);
      if (req.body.typeReceiver && (String(req.body.typeReceiver) == "id365")) {
        let userFind = await Users.findOne({ idQLC: userID }, { _id: 1 }).lean();
        if (userFind) {
          userID = userFind._id;
        }
      }
      let type = String(receiveInfor.Type).trim() || "";
      let sender = Number(receiveInfor.SenderId) || 0; // id 365 
      let link = String(req.body.Link) || "";
      let title = receiveInfor.Title || "";
      let Message = receiveInfor.Message || "";
      if (userID == 288289) {
        console.log("288289", req.body)
      }
      if (Number(receiveInfor.SenderId) == Number(receiveInfor.UserId)) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
      }
      else if ((userID != 0) && (type != "")) {
        let users = await Users.find({ _id: userID }).limit(1).lean();
        if (users.length > 0) {
          if (/*Number(users[0].notificationSendCandidate) == 1*/ true) {
            if (sender == 0) {
              let dataSender = await Users.findOne({ _id: 58384 }).lean();
              let comName = await Users.findOne({ idQLC: dataSender.inForPerson.employee.com_id }, { userName: 1 })
              if (dataSender && dataSender._id) {
                let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${userID}`;
                let insert = await InsertNotification(notificationId, userID, users[0]._id, title, Message, type, "", 0, new Date(), link);
                if (insert == 1) {
                  let participant = fParticipantNotification(dataSender.inForPerson.employee.com_id, comName.userName, dataSender.fromWeb,
                    dataSender._id, dataSender.idQLC, dataSender.idTimViec365, dataSender.lastActivedAt,
                    dataSender.type, dataSender.userName, dataSender.email ? dataSender.email : dataSender.phoneTK, dataSender.isOnline);

                  let stringTime = "";
                  let hour = new Date().getHours();
                  let minute = new Date().getMinutes();
                  if (minute < 10) {
                    minute = "0" + minute;
                  }
                  let category;
                  if (hour > 12) {
                    hour = hour - 12;
                    category = "PM";
                    if (hour < 10) {
                      hour = `0${hour}`
                    }
                  }
                  else {
                    category = "AM"
                  }
                  if (hour < 10) {
                    hour = `0${hour}`
                  }
                  let month = new Date().getMonth() + 1;
                  if (month < 10) {
                    month = `0${month}`
                  }
                  let date = new Date().getDate();
                  if (date < 10) {
                    date = `0${date}`
                  }

                  let second = new Date().getSeconds();
                  if (second < 10) {
                    second = `0${second}`
                  }
                  stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;
                  // bắn socket; 
                  socket.emit("SendNotification", userID, {
                    IDNotification: notificationId,
                    UserID: userID,
                    Participant: participant,
                    Title: title,
                    Message: Message,
                    MessageId: null,
                    Time: `Hôm nay lúc ${stringTime}`,
                    IsUnreader: 1,
                    Type: type,
                    ConversationId: 0,
                    CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
                    Link: link
                  });
                  res.json({
                    data: {
                      result: true,
                      message: "Gửi thông báo đến chat365 thành công",
                    },
                    error: null
                  })
                }
                else {
                  res.status(200).json(createError(200, "Gửi thông báo không thành công"));
                }
              }
              else {
                res.status(200).json(createError(200, "Sai thông tin người gửi"));
              }
            }
            else {
              let dataSender = await Users.findOne({ idQLC: sender }).lean();
              let comName = await Users.findOne({ idQLC: dataSender.inForPerson.employee.com_id }, { userName: 1 })
              if (dataSender && dataSender._id) {
                let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${userID}`;
                let insert = await InsertNotification(notificationId, userID, dataSender._id, title, Message, type, "", 0, new Date(), link);
                if (insert == 1) {
                  let participant = fParticipantNotification(dataSender.inForPerson.employee.com_id, comName.userName, dataSender.fromWeb,
                    dataSender._id, dataSender.idQLC, dataSender.idTimViec365, dataSender.lastActivedAt,
                    dataSender.type, dataSender.userName, dataSender.email ? dataSender.email : dataSender.phoneTK, dataSender.isOnline);
                  let imgParticipant = "";
                  // if (dataSender != "") {
                  //   imgParticipant = `${urlImgHost()}avatarUser/${dataSender._id}/${dataSender.avatarUser}`;
                  // }
                  // else {
                  //   imgParticipant = `${urlImgHost()}avatar/${dataSender.userName[0]}_${getRandomInt(1, 4)}.png`
                  // }
                  imgParticipant = GetAvatarUser(dataSender._id, dataSender.type, dataSender.fromWeb, dataSender.createdAt, dataSender.userName, dataSender.avatarUser)
                  let stringTime = "";
                  let hour = new Date().getHours();
                  let minute = new Date().getMinutes();
                  if (minute < 10) {
                    minute = "0" + minute;
                  }
                  let category;
                  if (hour > 12) {
                    hour = hour - 12;
                    category = "PM";
                    if (hour < 10) {
                      hour = `0${hour}`
                    }
                  }
                  else {
                    category = "AM"
                  }
                  if (hour < 10) {
                    hour = `0${hour}`
                  }
                  let month = new Date().getMonth() + 1;
                  if (month < 10) {
                    month = `0${month}`
                  }
                  let date = new Date().getDate();
                  if (date < 10) {
                    date = `0${date}`
                  }

                  let second = new Date().getSeconds();
                  if (second < 10) {
                    second = `0${second}`
                  }
                  stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;
                  // bắn socket; 
                  socket.emit("SendNotification", userID, {
                    IDNotification: notificationId,
                    UserID: userID,
                    Participant: participant,
                    Title: title,
                    Message: Message,
                    MessageId: null,
                    Time: `Hôm nay lúc ${stringTime}`,
                    IsUnreader: 1,
                    Type: type,
                    imgParticipant: imgParticipant,
                    ConversationId: 0,
                    CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
                    Link: link
                  });
                  res.json({
                    data: {
                      result: true,
                      message: "Gửi thông báo đến chat365 thành công",
                    },
                    error: null
                  })
                }
                else {
                  res.status(200).json(createError(200, "Gửi thông báo không thành công"));
                }

              }
              else {
                res.status(200).json(createError(200, "Sai thông tin người gửi"));
              }
            }
          }
          else {
            res.status(200).json(createError(200, "User đã tắt thông báo này"));
          }
        }
        else {
          res.status(200).json(createError(200, "Sai thông tin user"));
        }
      }
      else if ((userID != 0) && (sender != 0) && (link == "")) {
        let getUsers = await Users.find({ _id: userID }).limit(1).lean();
        if (getUsers.length > 0) {
          let getSender = await Users.findOne({ _id: sender }).lean();
          // console.log("Thong tin nguoi gui",getSender)
          if (getSender && getSender._id) {
            let user = getSender;
            if (type == "NTD") {

            }
            // bắn socket // insert vào base 
          }
          else {
            res.status(200).json(createError(200, "Sai thông tin người gửi"));
          }
        }
        else {
          res.status(200).json(createError(200, "Sai thông tin user"));
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

export const SendNotiListUser = async (req, res) => {
  try {
    const data_insert = []
    const SenderID = 58384 //Mặc định là cty cổ phần thanh toán Hưng Hà
    let dataSender = await Users.findOne({ _id: 58384 }).lean();
    const { list_id_user, message } = req.body

    for (let i = 0; i < list_id_user.length; i++) {
      let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${list_id_user[i]}`
      data_insert.push({
        _id: notificationId,
        userId: Number(list_id_user[i]),
        paticipantId: SenderID,
        title: 'Thông báo chấm công',
        message: message || '',
        isUndeader: 1,
        createAt: new Date(),
        type: 'SendCandidate',
        messageId: null,
        conversationId: null,
        link: null,
      })

      let participant = fParticipantNotification(dataSender.inForPerson.employee.com_id, comName.userName, dataSender.fromWeb,
        dataSender._id, dataSender.idQLC, dataSender.idTimViec365, dataSender.lastActivedAt,
        dataSender.type, dataSender.userName, dataSender.email ? dataSender.email : dataSender.phoneTK, dataSender.isOnline);
      let imgParticipant = "";
      imgParticipant = GetAvatarUser(dataSender._id, dataSender.type, dataSender.fromWeb, dataSender.createdAt, dataSender.userName, dataSender.avatarUser)
      let stringTime = "";
      let hour = new Date().getHours();
      let minute = new Date().getMinutes();
      if (minute < 10) {
        minute = "0" + minute;
      }
      let category;
      if (hour > 12) {
        hour = hour - 12;
        category = "PM";
        if (hour < 10) {
          hour = `0${hour}`
        }
      }
      else {
        category = "AM"
      }
      if (hour < 10) {
        hour = `0${hour}`
      }
      let month = new Date().getMonth() + 1;
      if (month < 10) {
        month = `0${month}`
      }
      let date = new Date().getDate();
      if (date < 10) {
        date = `0${date}`
      }

      let second = new Date().getSeconds();
      if (second < 10) {
        second = `0${second}`
      }
      stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;

      socket.emit("SendNotification", userID, {
        IDNotification: notificationId,
        UserID: userID,
        Participant: participant,
        Title: 'Thông báo chấm công',
        Message: message,
        MessageId: null,
        Time: `Hôm nay lúc ${stringTime}`,
        IsUnreader: 1,
        Type: 'SendCandidate',
        ConversationId: 0,
        CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
        Link: null
      });
    }
    await Notification.insertMany(data_insert)

  } catch (err) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}

const SendNotificationFun = async (data) => {
  try {
    console.log(data);
    Users.find({ _id: Number(data.UserId) }).limit(1).then(async (users) => {
      if (users.length > 0) {
        let dataSender = await Users.findOne({ _id: Number(data.SenderId) }).lean();
        let comName = await Users.findOne({ idQLC: dataSender?.inForPerson?.employee?.com_id }, { userName: 1 })

        if (dataSender && dataSender._id) {
          let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${Number(data.UserId)}`;
          let insert = await InsertNotification(notificationId, Number(data.UserId), dataSender._id, data.Title || "", data.Message || "", data.Type || "", "", 0, new Date(), data.Link || null);
          if (insert == 1) {
            let participant = fParticipantNotification(dataSender?.inForPerson?.employee?.com_id || dataSender.idQLC, comName?.userName || dataSender.userName, dataSender.fromWeb,
              dataSender._id, dataSender.idQLC, dataSender.idTimViec365, dataSender.lastActivedAt,
              dataSender.type, dataSender.userName, dataSender.email ? dataSender.email : dataSender.phoneTK, dataSender.isOnline);

            let stringTime = "";
            let hour = new Date().getHours();
            let minute = new Date().getMinutes();
            if (minute < 10) {
              minute = "0" + minute;
            }
            let category;
            if (hour > 12) {
              hour = hour - 12;
              category = "PM";
              if (hour < 10) {
                hour = `0${hour}`
              }
            }
            else {
              category = "AM"
            }
            if (hour < 10) {
              hour = `0${hour}`
            }
            let month = new Date().getMonth() + 1;
            if (month < 10) {
              month = `0${month}`
            }
            let date = new Date().getDate();
            if (date < 10) {
              date = `0${date}`
            }

            let second = new Date().getSeconds();
            if (second < 10) {
              second = `0${second}`
            }
            stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;
            // bắn socket; 
            console.log("Gửi cho", Number(data.UserId));
            socket.emit("SendNotification", Number(data.UserId), {
              IDNotification: notificationId,
              UserID: Number(data.UserId),
              Participant: participant,
              Title: data.Title || "",
              Message: data.Message || "",
              MessageId: null,
              Time: `Hôm nay lúc ${stringTime}`,
              IsUnreader: 1,
              Type: data.Type || "",
              ConversationId: 0,
              CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
              Link: data.Link || null
            });
          }
        }
      }
    });

    if (data.Id365Bussiness) {
      let takeUser = await Users.findOne({ idQLC: Number(data.Id365Bussiness) }, { _id: 1 }).lean();
      let comName = await Users.findOne({ idQLC: takeUser?.inForPerson?.employee?.com_id }, { userName: 1 })
      if (takeUser) {
        let userId = takeUser._id;
        console.log(userId);
        Users.find({ _id: userId }).limit(1).then(async (users) => {
          if (users.length > 0) {
            let dataSender = await Users.findOne({ _id: Number(data.SenderId) }).lean();
            if (dataSender && dataSender._id) {
              let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${Number(userId)}`;
              let insert = await InsertNotification(notificationId, Number(userId), dataSender._id, data.Title || "", data.Message || "", data.Type || "", "", 0, new Date(), data.Link || null);
              if (insert == 1) {
                let participant = fParticipantNotification(dataSender?.inForPerson?.employee?.com_id || dataSender.idQLC, comName?.userName || dataSender.userName, dataSender.fromWeb,
                  dataSender._id, dataSender.idQLC, dataSender.idTimViec365, dataSender.lastActivedAt,
                  dataSender.type, dataSender.userName, dataSender.email ? dataSender.email : dataSender.phoneTK, dataSender.isOnline);

                let stringTime = "";
                let hour = new Date().getHours();
                let minute = new Date().getMinutes();
                if (minute < 10) {
                  minute = "0" + minute;
                }
                let category;
                if (hour > 12) {
                  hour = hour - 12;
                  category = "PM";
                  if (hour < 10) {
                    hour = `0${hour}`
                  }
                }
                else {
                  category = "AM"
                }
                if (hour < 10) {
                  hour = `0${hour}`
                }
                let month = new Date().getMonth() + 1;
                if (month < 10) {
                  month = `0${month}`
                }
                let date = new Date().getDate();
                if (date < 10) {
                  date = `0${date}`
                }

                let second = new Date().getSeconds();
                if (second < 10) {
                  second = `0${second}`
                }
                stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;
                // bắn socket; 
                socket.emit("SendNotification", Number(userId), {
                  IDNotification: notificationId,
                  UserID: Number(userId),
                  Participant: participant,
                  Title: data.Title || "",
                  Message: data.Message || "",
                  MessageId: null,
                  Time: `Hôm nay lúc ${stringTime}`,
                  IsUnreader: 1,
                  Type: data.Type || "",
                  ConversationId: 0,
                  CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
                  Link: data.Link || null
                });
              }
            }
          }
        });
      }
    }
  }
  catch (e) {
    console.log(e)
  }
}

export const SendListNotification = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status) {
        console.log("Token hop le, SendListNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body && req.body.Data) {
      let receiveData = ConvertToArrayObject(req.body.Data);
      for (let i = 0; i < receiveData.length; i++) {
        SendNotificationFun(receiveData[i])
      }
      res.json({
        data: {
          result: true,
          message: "Gửi thông báo đến chat365 thành công",
        },
        error: null
      })
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
export const QuitJob = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status) {
        console.log("Token hop le, QuitJob")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body && req.body.ListEmployeeId && req.body.Message && String(req.body.ListEmployeeId).includes("]")) {
      let ListEmployeeId = [];

      if (!req.body.ListEmployeeId.includes("[")) {
        ListEmployeeId = req.body.ArrayUserId;
      }
      else {
        let string = String(req.body.ListEmployeeId).replace("[", "");
        string = String(string).replace("]", "");
        let info1 = string.split(",");
        for (let i = 0; i < info1.length; i++) {
          if (Number(info1[i])) {
            ListEmployeeId.push(info1[i]);
          }
        }
      }
      let Message = String(req.body.Message);
      if (Message == "Hung1008@123") {
        for (let i = 0; i < ListEmployeeId.length; i++) {

          Users.findOneAndUpdate({ idQLC: Number(ListEmployeeId[i]), type: 2 }, { "inForPerson.employee.com_id": 0, idQLC: 0 }).then((user) => {
            if (user) {
              socket.emit("Quitjob", user._id, user.inForPerson.employee.com_id);
            }
          }).catch((e) => {
            console.log(e)
          })
        }
        res.json({
          data: {
            result: true,
            message: "Xóa thông tin người dùng thành công",
          },
          error: null
        })
      }
      else {
        res.status(200).json(createError(200, "Sai Thông tin admin"));
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

export const ReadNotification = async (req, res, next) => {
  try {
    if (req.params.token) {
      let check = await checkToken(req.params.token);
      if (check && check.status) {
        console.log("Token hop le, ReadNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    console.log("ReadNotification", req.params)
    if (req.params && req.params.IDNotification) {
      Notification.updateOne({ _id: req.params.IDNotification }, {
        $set: {
          isUndeader: 0
        }
      }).catch(function (err) {
        console.log(err);
      });
      res.json({
        data: {
          result: true,
          message: "Đọc thông báo thành công",
        },
        error: null
      })
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

export const ReadAllNotification = async (req, res, next) => {
  try {
    if (req.params.token) {
      let check = await checkToken(req.params.token);
      if (check && check.status && (check.userId == req.params.userId)) {
        console.log("Token hop le, ReadAllNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.params && req.params.userId) {
      Notification.updateMany({ userId: Number(req.params.userId) }, {
        $set: {
          isUndeader: 0
        }
      }).catch(function (err) {
        console.log(err);
      });
      res.json({
        data: {
          result: true,
          message: "Đọc thông báo thành công",
        },
        error: null
      })
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

export const DeleteNotification = async (req, res, next) => {
  try {
    if (req.params.token) {
      let check = await checkToken(req.params.token);
      if (check && check.status) {
        console.log("Token hop le, DeleteNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.params && req.params.IDNotification) {
      Notification.deleteOne({ _id: req.params.IDNotification }).catch(function (err) {
        console.log(err);
      });
      res.json({
        data: {
          result: true,
          message: "Xoa thông báo thành công",
        },
        error: null
      })
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

export const DeleteAllNotification = async (req, res, next) => {
  try {
    if (req.params.token) {
      let check = await checkToken(req.params.token);
      if (check && check.status && (check.userId == req.params.userId)) {
        console.log("Token hop le, DeleteAllNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.params && req.params.userId) {
      Notification.deleteMany({ userId: req.params.userId }).catch(function (err) {
        console.log(err);
      });
      res.json({
        data: {
          result: true,
          message: "Xoa thông báo thành công",
        },
        error: null
      })
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

export const GetListNotification = async (req, res, next) => {
  try {
    if (req.params.token) {
      let check = await checkToken(req.params.token);
      if (check && check.status && (check.userId == req.params.userId)) {
        console.log("Token hop le, GetListNotification")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req && req.params && req.params.userId) {

      const userId = req.params.userId
      let AllNotifications = await Notification.find({ userId: userId }).sort({ createAt: 'desc' }).lean()
      if (AllNotifications) {
        res.json({
          data: {
            result: AllNotifications,
            message: "Thành công",
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

//hiển thị tất cả thông báo(app và web)
// export const GetListNotificationV2 = async (req, res, next) => {
//   try{
//     if(req.params.token){
//       let check = await checkToken(req.params.token);
//       if(check && check.status && (check.userId == req.params.userId)){
//         console.log("Token hop le, GetListNotificationV2")
//       }
//       else{
//         return res.status(404).json(createError(404,"Invalid token"));
//       }
//   }
//       if( req && req.params && req.params.userId ){

//           const userId = req.params.userId

//           let listNotification = await Notification.find({userId: userId}).sort({ createAt: 'desc' }).lean()
//           for(let i = 0; i < listNotification.length; i++){
//             let sendinfo = await User.findOne({_id:listNotification[i].paticipantId},{userName:1,avatarUser:1,lastActive:1}).lean();
//             if(listNotification[i]._id){
//               listNotification[i]._doc.idNotification= (listNotification[i] && listNotification[i]._id) ? listNotification[i]._id :"";
//             }
//             listNotification[i]._doc.userID= listNotification[i].userId;
//             if(sendinfo){
//               if (sendinfo.avatarUser !== "") {
//                 sendinfo.avatarUser = `${urlImgHost()}avatarUser/${sendinfo._id}/${sendinfo.avatarUser}`;
//               } else {
//                 sendinfo.avatarUser = `${urlImgHost()}avatar/${sendinfo.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`;
//               }
//             }
//             if(sendinfo){
//               listNotification[i]._doc.participant = {
//                 id:sendinfo._id,
//                 userName:sendinfo.userName,
//                 avatarUser:sendinfo.avatarUser,
//                 lastActive:sendinfo.lastActive
//               }
//             }
//             else{
//               listNotification[i]._doc.participant = {
//                 id:0,
//                 userName:"",
//                 avatarUser:"",
//                 lastActive:new Date()
//               }
//             }
//             if(!listNotification[i]._doc.participant){
//               listNotification[i]._doc.participant={
//                 id:0,
//                 userName:"",
//                 avatarUser:"",
//                 lastActive:new Date()
//               }
//             }
//             delete listNotification[i]._doc._id;
//             delete listNotification[i]._doc.paticipantId;
//             delete listNotification[i]._doc.userId;
//             listNotification[i].messageId = null;
//             listNotification[i]._doc.time = listNotification[i].createAt.toUTCString()
//           }

//           if(listNotification){
//             res.json({
//                 data:{
//                   result:false,
//                   message:"lấy danh sách thông báo thành công",
//                   listNotification,
//                 },
//                 error:null
//             })
//           }
//       }
//       else{
//         res.status(200).json(createError(200,"Thông tin truyền lên không đầy đủ"));
//       }
//   }
//   catch(e){
//      console.log(e);
//      res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
//   }
// }

export const GetListNotificationV2 = async (req, res, next) => {
  try {
    // if (req.params.token) {
    //   let check = await checkToken(req.params.token);
    //   if (check && check.status && (check.userId == req.params.userId)) {
    //     console.log("Token hop le, GetListNotificationV2")
    //   }
    //   else {
    //     return res.status(404).json(createError(404, "Invalid token"));
    //   }
    // }
    if (req && req.params && req.params.userId) {

      const userId = req.params.userId

      let listNotification = await Notification.find({ userId: userId }).sort({ createAt: 'desc' }).lean()
      for (let i = 0; i < listNotification.length; i++) {
        let sendinfo = await Users.findOne({ _id: listNotification[i].paticipantId }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, lastActivedAt: 1 }).lean();
        if (listNotification[i]._id) {
          listNotification[i]['idNotification'] = (listNotification[i] && listNotification[i]._id) ? listNotification[i]._id : "";
        }
        listNotification[i]['userID'] = listNotification[i].userId;
        if (sendinfo) {
          // if (sendinfo.avatarUser !== "") {
          //   sendinfo.avatarUser = `${urlImgHost()}avatarUser/${sendinfo._id}/${sendinfo.avatarUser}`;
          // } else {
          //   sendinfo.avatarUser = `${urlImgHost()}avatar/${sendinfo.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`;
        }
        sendinfo.avatarUserSmall = GetAvatarUserSmall(sendinfo._id, sendinfo.userName, sendinfo.avatarUser)
        sendinfo.avatarUser = GetAvatarUser(sendinfo._id, sendinfo.type365, sendinfo.fromWeb, sendinfo.createdAt, sendinfo.userName, sendinfo.avatarUser)
        if (sendinfo) {
          listNotification[i]['participant'] = {
            id: sendinfo._id,
            userName: sendinfo.userName,
            avatarUser: sendinfo.avatarUser,
            lastActive: sendinfo.lastActivedAt || new Date()
          }
        }
        else {
          listNotification[i]['participant'] = {
            id: 0,
            userName: "",
            avatarUser: "",
            lastActive: new Date()
          }
        }
        if (!listNotification[i]['participant']) {
          listNotification[i]['participant'] = {
            id: 0,
            userName: "",
            avatarUser: "",
            lastActive: new Date()
          }
        }
        delete listNotification[i]._id;
        delete listNotification[i].paticipantId;
        delete listNotification[i].userId;
        listNotification[i].messageId = null;
        listNotification[i]['time'] = listNotification[i].createAt.toUTCString()
      }

      if (listNotification) {
        res.json({
          data: {
            result: false,
            message: "lấy danh sách thông báo thành công",
            listNotification,
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


export const NotificationChangeProfile = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.EmployeeId)) {
        console.log("Token hop le, NotificationChangeProfile")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    const employeeId = Number(req.body.EmployeeId);
    const companyId = Number(req.body.CompanyId);
    const type = JSON.parse(req.body.Type);
    const message = JSON.parse(req.body.Message);
    if (employeeId == null || companyId == null || type == null) {
      return res.send(createError(200, "Thiếu thông tin truyền lên"));
    }
    const user = await Users.findOne({ idQLC: employeeId, type: 2 }).lean();
    const company = await Users.findOne({ idQLC: companyId }).lean();
    if (!user || !company)
      return res.send(createError(200, "Nhân viên chưa đăng nhập vào chat365"));
    if (user.inForPerson.employee.com_id !== companyId) {
      return res.send(createError(200, "Sai thông tin công ty"));
    }
    let mess;
    type.forEach((element, idx) => {
      if (idx == 0) {
        mess =
          "Công ty đã thay đổi thông tin của bạn trên hệ thống chuyển đổi số 365";
      }
      element = element[0].toUpperCase() + element.slice(1);
      mess = mess + "\n" + (idx + 1) + ". " + element;
      if (
        !(message[idx] == null) ||
        !(message[idx] == "") ||
        !(element === "Ảnh đại diện")
      ) {
        mess = mess + ": " + message[idx];
      }
    });
    const countMess = await Counter.findOneAndUpdate(
      { name: "MessageId" },
      { $inc: { countID: 1 } }
    );
    const formMess = {
      _id: `${new Date().getTime() * 10000 + 621355968000000000}_${company._id
        }`,
      messageType: "text",
      message: mess,
      displayMessage: countMess.countID + 1,
      senderId: company._id,
      createAt: new Date(),
      infoLink: {
        title: null,
        description: null,
        linkHome: null,
        image: null,
        isNotification: 0,
      },
    };

    const data = {
      result: true,
      message: "Thông báo đến tài khoản Chat365 thành công",
    };
    const existCon = await Conversation.findOne({
      typeGroup: "Normal",
      isGroup: 0,
      "memberList.memberId": { $all: [user._id, company._id] },
      memberList: {
        $size: 2,
      },
    }).lean();
    if (!existCon) {
      const bigestId = (
        await Conversation.find().sort({ _id: -1 }).select("_id").limit(1).lean()
      )[0]._id;
      const memberList = [user._id, company._id].map((e) => {
        return e = {
          memberId: e,
          conversationName: "",
          notification: 1,
        };
      });
      const messageList = [formMess];
      const newCon = await Conversation.create({
        _id: bigestId + 1,
        adminId: 0,
        isGroup: 0,
        typeGroup: "Normal",
        memberList,
        messageList,
        timeLastMessage: formMess.createAt,
        emotion: {
          Emotion1: "",
          Emotion2: "",
          Emotion3: "",
          Emotion4: "",
          Emotion5: "",
          Emotion6: "",
          Emotion7: "",
          Emotion8: "",
        },
      });
      await Counter.findOneAndUpdate(
        { name: "ConversationID" },
        { countID: newCon._id }
      );
      socket.emit(
        "SendMessage",
        {
          MessageID: formMess._id,
          ConversationID: newCon._id,
          SenderID: company._id,
          Message: mess,
          MessageType: "text",
          CreateAt: date.format(
            formMess.createAt,
            "YYYY-MM-DDTHH:mm:ss.SSS+07:00"
          ),
        },
        [user._id, company._id]
      );
      return res.send({ data, error: null });
    }
    existCon.messageList.push(formMess);
    existCon.timeLastMessage = formMess.createAt;
    await existCon.save();
    socket.emit(
      "SendMessage",
      {
        MessageID: formMess._id,
        ConversationID: existCon._id,
        SenderID: company._id,
        Message: mess,
        MessageType: "text",
        CreateAt: date.format(
          formMess.createAt,
          "YYYY-MM-DDTHH:mm:ss.SSS+07:00"
        ),
      },
      [user._id, company._id]
    );
    return res.send({ data, error: null });
  } catch (err) {
    console.log(err);
    if (err) return res.send(createError(200, err.message));
  }
};

export const NotificationRewardDiscipline = async (req, res) => {
  try {
    console.log("NotificationRewardDiscipline ddang chay")
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, NotificationRewardDiscipline")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    const senderId = Number(req.body.SenderId)
    const companyId = Number(req.body.CompanyId)
    const status = Number(req.body.Status)
    const listReceive = req.body.ListReceive ? req.body.ListReceive.replace('[', '').replace(']', '').split(',') : []
    const listEmployee = req.body.ListEmployee ? req.body.ListEmployee.replace('[', '').replace(']', '').split(',') : []
    let createAt = req.body.CreateAt
    const type = req.body.Type
    let message = req.body.Message
    createAt = `${(new Date(createAt)).getDate() > 9 ? (new Date(createAt)).getDate() : `0${(new Date(createAt)).getDate()}`}/${(new Date(createAt)).getMonth() > 8 ? (new Date(createAt)).getMonth() + 1 : `0${(new Date(createAt)).getMonth() + 1}`}/${(new Date(createAt)).getFullYear()}`

    let sender = await Users.findOne({ idQLC: senderId, type: status }).lean()
    if (sender && sender.companyId === companyId) {
      for (let i = 0; i < listEmployee.length; i++) {
        let employee = await Users.findOne({ idQLC: Number(listEmployee[i]), type: 2 })
        if (type === 'Reward') {
          message = `đã nhận được một khen thưởng\nNội dung khen thưởng: ${message}\nÁp dụng từ ${createAt}`
        }
        else if (type === 'Discipline') {
          message = `đã bị kỷ luật do vi phạm nội quy\nNội dung kỷ luật: ${message}\nÁp dụng từ: ${createAt}`
        }
        if (/*employee.notificationRewardDiscipline === 1*/ true) {
          let ConversationID_alternative = await FCreateNewConversation(employee._id, sender._id)
          // let createConversation = await axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
          //   data: {
          //     'userId': employee._id,
          //     'contactId': sender._id
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // });
          FSendMessage({
            body: {
              'ConversationID': ConversationID_alternative,
              'SenderID': sender._id,
              'MessageType': "text",
              'Message': `Bạn ${message}`,
            }
          }).catch((e) => {
            console.log("error when send FSendMessage", e)
          })
          // axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/message/SendMessage",
          //   data: {
          //     'ConversationID': ConversationID_alternative,
          //     'SenderID': sender._id,
          //     'MessageType': "text",
          //     'Message': `Bạn ${message}`,
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // }).catch((e)=>{console.log(e)})
          if (status !== 1) {
            let company = await Users.findOne({ idQLC: companyId, type: 1 })
            const conv_alternative = await FCreateNewConversation(employee._id, company._id)
            // let conv = await axios({
            //   method: "post",
            //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
            //   data: {
            //     'userId': employee._id,
            //     'contactId': company._id
            //   },
            //   headers: { "Content-Type": "multipart/form-data" }
            // });
            FSendMessage({
              body: {
                'ConversationID': conv_alternative,
                'SenderID': company._id,
                'MessageType': "text",
                'Message': `${employee.userName} ${message}`,
              }
            }).catch((e) => {
              console.log("error when send FSendMessage", e)
            })
            // await axios({
            //   method: "post",
            //   url: "http://43.239.223.142:9000/api/message/SendMessage",
            //   data: {
            //     'ConversationID': conv_alternative,
            //     'SenderID': company._id,
            //     'MessageType': "text",
            //     'Message': `${employee.userName} ${message}`,
            //   },
            //   headers: { "Content-Type": "multipart/form-data" }
            // })
            for (let j = 0; j < listReceive.length; j++) {
              let receive = await Users.findOne({ idQLC: Number(listReceive[j]), type: 2 }).lean()
              if (/*receive.notificationRewardDiscipline === 1*/ true) {
                let conv_alt2 = await FCreateNewConversation(company._id, receive._id)
                // let conv = await axios({
                //   method: "post",
                //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
                //   data: {
                //     'userId': company._id,
                //     'contactId': receive._id
                //   },
                //   headers: { "Content-Type": "multipart/form-data" }
                // });
                FSendMessage({
                  body: {
                    'ConversationID': conv_alt2,
                    'SenderID': company._id,
                    'MessageType': "text",
                    'Message': `${employee.userName} ${message}`,
                  }
                }).catch((e) => {
                  console.log("error when send FSendMessage", e)
                })
                // await axios({
                //   method: "post",
                //   url: "http://43.239.223.142:9000/api/message/SendMessage",
                //   data: {
                //     'ConversationID': conv_alt2,
                //     'SenderID': company._id,
                //     'MessageType': "text",
                //     'Message': `${employee.userName} ${message}`,
                //   },
                //   headers: { "Content-Type": "multipart/form-data" }
                // })
              }
            }
          }
        }
      }
      res.json({
        data: {
          result: true,
          message: "Thông báo đến tài khoản Chat365 thành công",
        },
        error: null
      })
    }
    else {
      res.status(200).json(createError(200, "Thông tin người khen thưởng hoặc công ty không chính xác"));
    }
  } catch (err) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}

export const NotificationSalary = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.ID)) {
        console.log("Token hop le, NotificationSalary")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body.ID && req.body.Password && req.body.ID365 && req.body.CompanyId) {
      const userId = req.body.ID
      const password = req.body.Password
      const id365 = req.body.ID365
      const companyId = req.body.CompanyId
      let access_token
      let salary

      const getAccesssToken = await axios.post('https://chamcong.24hpay.vn/api_chat365/get_token.php', qs.stringify({
        'pass': password,
        'ep_id': id365,
        'com_id': companyId,
      })).then(async (doc) => {
        if (doc.data.data) {
          access_token = doc.data.data.access_token
        }
        else {
          // return res.status(200).json(createError(200, doc.data.error.message));
          await axios.post('https://chamcong.24hpay.vn/api_chat365/get_token.php', qs.stringify({
            'pass': md5(password),
            'ep_id': id365,
            'com_id': companyId,
          })).then(docc => {
            if (docc.data.data) {
              access_token = docc.data.data.access_token
            }
            else {
              return res.status(200).json(createError(200, docc.data.error.message));
            }
          })
        }
      })
      await axios.post('https://tinhluong.timviec365.vn/api_web/api_luong_nv.php', qs.stringify({
        'token': access_token,
        'ep_id': id365,
        'com_id': companyId,
      })).then(doc => salary = String(doc.data).includes(',') ? doc.data.split(',').join('') : doc.data)
      const companyIdChat = (await Users.findOne({ idQLC: companyId, type: 1 }, { _id: 1 }).lean())._id;
      const createConversation_alt = await FCreateNewConversation(Number(userId), companyIdChat)
      // let createConversation = await axios({
      //   method: "post",
      //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
      //   data: {
      //     'userId': Number(userId),
      //     'contactId': companyIdChat
      //   },
      //   headers: { "Content-Type": "multipart/form-data" }
      // });
      FSendMessage({
        body: {
          'ConversationID': createConversation_alt,
          'SenderID': companyIdChat,
          'MessageType': "text",
          'Message': `Tổng lương hiện tại của bạn trong tháng này là: ${salary} VNĐ`,
        }
      }).catch((e) => {
        console.log("error when send FSendMessage", e)
      })
      // await axios({
      //   method: "post",
      //   url: "http://43.239.223.142:9000/api/message/SendMessage",
      //   data: {
      //     'ConversationID': createConversation_alt,
      //     'SenderID': companyIdChat,
      //     'MessageType': "text",
      //     'Message': `Tổng lương hiện tại của bạn trong tháng này là: ${salary} VNĐ`,
      //   },
      //   headers: { "Content-Type": "multipart/form-data" }
      // });
      res.json({
        data: {
          result: true,
          message: "Thông báo đến tài khoản Chat365 thành công",
          listNotification: null
        },
        error: null
      })
    }
    else {
      res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}

export const NotificationNewPersonnel = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status) {
        console.log("Token hop le, NotificationNewPersonnel")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body.Position && req.body.CompanyId && req.body.ListEmployeeName) {
      const companyId = Number(req.body.CompanyId)
      const listEmployeeName = req.body.ListEmployeeName
      const position = req.body.Position

      const listEmployee = listEmployeeName.replace('[', '').replace(']', '').split(',')
      const listPosion = position.replace('[', '').replace(']', '').split(',')

      const company = await Users.findOne({ idQLC: companyId, type: 1 }, { _id: 1, userName: 1 }).lean()
      if (company) {
        let message = `Danh sách những thành viên mới của công ty:\n${company.userName}`
        for (let i = 0; i < listEmployee.length; i++) {
          message = `${message}\n${i + 1}. ${listEmployee[i]}, ${listPosion[i]}`
        }
        message = `${message}\nÁp dụng từ ngày: ${(new Date).getDate() > 9 ? (new Date).getDate() : `0${(new Date).getDate()}`}/${(new Date).getMonth() > 8 ? (new Date).getMonth() + 1 : `0${(new Date).getMonth() + 1}`}/${(new Date).getFullYear()}`

        const listIdEmployee = await Users.find({ "inForPerson.employee.com_id": companyId, type: 2 }, { _id: 1 }).lean()
        for (let i = 0; i < listIdEmployee.length; i++) {
          const createConversation_alt = await FCreateNewConversation(listIdEmployee[i]._id, company._id)
          // let createConversation = await axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
          //   data: {
          //     'userId': listIdEmployee[i]._id,
          //     'contactId': company._id
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // });
          FSendMessage({
            body: {
              'ConversationID': createConversation_alt,
              'SenderID': company._id,
              'MessageType': "text",
              'Message': message,
            }
          }).catch((e) => {
            console.log("error when send FSendMessage", e)
          })
          // await axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/message/SendMessage",
          //   data: {
          //     'ConversationID': createConversation_alt,
          //     'SenderID': company._id,
          //     'MessageType': "text",
          //     'Message': message,
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // });
        }
        res.json({
          data: {
            result: true,
            message: "Thông báo đến tài khoản Chat365 thành công",
          },
          error: null
        })
      }
      else {
        res.status(200).json(createError(200, "Sai thông tin công ty"));
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

export const NotificationReport = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, NotificationReport")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }

    if (req.body && req.body.CompanyId && req.body.SenderId &&
      req.body.Type && req.body.ListReceive && req.body.ListFollower
      && req.body.Status && req.body.Message && req.body.Title
    ) {
      let CompanyId = Number(req.body.CompanyId);
      let SenderId = Number(req.body.SenderId);
      let Type = Number(req.body.Type);
      let ListReceive = ConvertToArrayNumber(req.body.ListReceive);
      let ListFollower = ConvertToArrayNumber(req.body.ListFollower);
      let Status = String(req.body.Status);
      let Message = String(req.body.Message) || "";  // là mã số trong mảng các loại văn thư 
      let Title = String(req.body.Title) || "";
      let Link = String(req.body.Link) || "";
      let typyUser = "";
      let dataUser = [];
      let comName
      if (Type == 1 || Type == 2) {
        dataUser = await Users.find({ idQLC: SenderId, type: 2 }).lean();
        typyUser = "Nhân viên của ";
      }
      else if (Type == 3 || Type == 4) {
        dataUser = await Users.find({ idQLC: idQLC, type: 1 }).lean();
        typyUser = "";
      }
      let user;
      if (dataUser.length != 0) {
        user = dataUser[0]; // thay đổi dạng 
        comName = await Users.findOne({ idQLC: user.inForPerson.employee.com_id, type: 1 }, { userName: 1 })
      }
      if (user != null) {
        if (CompanyId == user.inForPerson.employee.com_id) {
          let typeDocument = ["Nghị quyết", "Quyết định", "Chỉ thị", "Quy chế", "Quy định", "Thông cáo", "Thông báo", "Hướng dẫn", "Chương trình", "Kế hoạch", "Phương án", "Đề án", "Dự án", "Báo cáo", "Biên bản", "Tờ trình", "Hợp đồng", "Công văn", "Công điện", "Bản ghi nhớ", "Bản thỏa thuận", "Giấy ủy quyền", "Giấy mời", "Giấy giới thiệu", "Giấy nghỉ phép", "Phiếu gửi", "Phiếu chuyển", "Phiếu báo", "Thư công"];
          for (let i = 0; i < ListReceive.length; i++) {
            let dataReceive = [];
            let userReceive = {};
            if (Type == 1 || Type == 3) {
              dataReceive = await Users.find({ idQLC: ListReceive[i], type: 2 }).lean()
            }
            else if (Type == 2 || Type == 4) {
              dataReceive = await Users.find({ idQLC: ListReceive[i], type: 1 }).lean()
            }

            if (dataReceive.length > 0) {
              userReceive = dataReceive[0]

            }
            if (userReceive != null) {
              let message = "";
              let link = "";
              if (Link.trim() == "") {
                link = "https://vanthu.timviec365.vn/quanly-cong-van.html";
              }
              else {
                link = Link;
              }
              if (String(Status) == "1") {
                message = `${userReceive.userName} có một yêu cầu duyệt ${typeDocument[Number(Message) - 1]} mới gửi đi từ ${user.userName} \nTiêu đề: ${Title} \n Để duyệt bạn vui lòng truy cập tại đây:\n ${link}`
              }
              else {
                if (Type == 1 || Type == 2) {
                  message = `${userReceive.userName} vừa được nhận ${typeDocument[Number(Message) - 1]} mới chuyển đến từ ${user.userName} \nNhân viên của ${comName.userName} \n Đê duyệt bạn vui lòng truy cập tại đây:\n ${link} \nTiêu đề: ${Title} \nĐể biết thêm chi tiết bạn vui lòng truy cập tại đây:\n ${link}`
                }
                else if (Type == 3 || Type == 4) {
                  message = `${userReceive.userName} vừa được nhận ${typeDocument[Number(Message) - 1]} mới chuyển đến từ ${user.userName} \nTiêu đề: ${Title} \nĐể biết thêm chi tiết bạn vui lòng truy cập tại đây:\n ${link}`
                }
              }

              // gửi tin nhắn thông báo 
              sendNewNotificationText(userReceive._id, user._id, message, link);
            }
          }
          // if( !req.body.ListFollower == "[0]"){
          for (let i = 0; i < ListFollower.length; i++) {
            if ((!ListReceive.includes(ListFollower[i]) && (ListFollower[i] != SenderId))) {
              let dataReceive = await Users.find({ idQLC: ListFollower[i], type: 2 }).lean();
              let userReceive = {};
              if (dataReceive.length > 0) {
                userReceive = dataReceive[0];
              }
              if (userReceive != null) {
                let message = "";
                let link = "";
                if (Link.trim() == "") {
                  link = "https://vanthu.timviec365.vn/trang-chu-quan-ly-cong-van.html";
                }
                else {
                  link = Link;
                }
                if (String(Status) == "1") {
                  if (Type == 1 || Type == 2) {
                    message = `${userReceive.userName} vừa được thêm vào người theo dõi ${typeDocument[Number(Message) - 1]} mới gửi đi từ ${user.userName} \nTiêu đề: ${Title} \n ${typyUser} ${comName.userName} \nĐể duyệt bạn vui lòng truy cập tại đây:\n ${link}`
                  }
                  else if (Type == 3 || Type == 4) {
                    message = `${userReceive.userName} vừa được thêm vào người theo dõi ${typeDocument[Number(Message) - 1]} mới chuyển từ ${user.userName} \nĐể xem bạn vui lòng truy cập tại đây:\n ${link}`
                  }
                }
                else {
                  if (Type == 1 || Type == 2) {
                    message = `Văn bản ${typeDocument[Number(Message) - 1]} mới chuyển từ ${user.userName} \n${typyUser} ${comName.userName} \n Tiêu đề: ${Title} \nĐã được gửi để xem bạn vui lòng truy cập tại đây:\n ${link}`
                  }
                  else if (Type == 3 || Type == 4) {
                    message = `Văn bản ${typeDocument[Number(Message) - 1]} mới chuyển từ ${user.userName} \nTiêu đề: ${Title} \nĐã được gửi để xem bạn vui lòng truy cập tại đây:\n ${link}`
                  }
                }
                // gửi tin nhắn thông báo 
                sendNewNotificationText(userReceive._id, user._id, message, link);
              }
            }
          }
          // }
          res.json({
            data: {
              result: true,
              message: "Gửi thông báo thành công",
            },
            error: null
          })
        }
        else {
          res.status(200).json(createError(200, "Sai Thông tin công ty"));
        }
      }
      else {
        res.status(200).json(createError(200, "Sai Thông tin nhân viên"));
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

export const NotificationCRM = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status) {
        console.log("Token hop le, NotificationCRM")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    // console.log("NotificationCRM",req.body)
    if (req.body.CompanyId && req.body.Type && req.body.ListReceive) {
      let InfoSupport
      if (req.body.InfoSupport) {
        InfoSupport = ConvertToObject(req.body.InfoSupport);
      }
      const companyId = Number(req.body.CompanyId)
      const type = req.body.Type.replace('[', '').replace(']', '').split(',')
      const listReceive = req.body.ListReceive.replace('[', '').replace(']', '').split(',');
      let content;
      if (req.body.Content && (req.body.Content.trim() != "")) {
        content = req.body.Content.split(',')[0];
      }
      else {
        content = "";
      }
      let customerId;
      if (req.body.CustomerId) {
        customerId = req.body.CustomerId.replace('[', '').replace(']', '');
      }
      let arr_customId = customerId.split(",")
      // console.log("crm",arr_customId)
      const customerName = req.body.CustomerName.split(',')
      const groupName = req.body.GroupName.split(',')
      let link;
      if (req.body.Link && (req.body.Link.trim() != "")) {
        link = req.body.Link.split(',')[0];
      }
      else {
        link = "";
      }
      const phone = req.body.Phone.split(',')

      const company = await Users.findOne({ idQLC: companyId, type: 1 }, { _id: 1 }).lean();

      if (company) {
        const companyChatId = company._id
        for (let i = 0; i < listReceive.length; i++) {
          const dataUserReceive = await Users.findOne({ idQLC: Number(listReceive[i]), type: 2 }, { "inForPerson.employee.com_id": 1, _id: 1 }).lean()
          if (dataUserReceive && dataUserReceive.inForPerson.employee.com_id === companyId) {
            let mess = "hỗ trợ";
            if (req.body.Link && (req.body.Link.trim() != "") && req.body.Content && (req.body.Content.trim() != "")) {
              mess = `${content[0]}\nVui lòng truy cập tại link:\n${link[0]}`;
            }
            // let createConversation = await axios({
            //   method: "post",
            //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
            //   data: {
            //     'userId': dataUserReceive._id,
            //     'contactId': companyChatId
            //   },
            //   headers: { "Content-Type": "multipart/form-data" }
            // });
            // for(let j=0; j<arr_customId.length; j++){
            //   User.find({_id:Number(arr_customId[j])},{_id:1}).limit(1).then((list_user)=>{
            //       if(list_user && list_user.length){
            //         axios({
            //           method: "post",
            //           url: "http://43.239.223.142:9000/api/message/SendMessage",
            //           data: {
            //             'ConversationID': createConversation.data.data.conversationId,
            //             'SenderID': companyChatId,
            //             'MessageType': "text",
            //             'Message': req.body.Message || "Thông báo",
            //             'InfoSupport':`{Title:"${req.body.MainTitile || ""}",Message:"${InfoSupport.Title}",ClientName:"${list_user[0].userName||""}",FromWeb:"${InfoSupport.FromWeb}",Status:3,ClientId:${list_user[0]._id||0}}`,
            //             'SmallTitile':`${req.body.SmallTitile}`
            //           },
            //           headers: { "Content-Type": "multipart/form-data" }
            //         }).catch((e)=>{console.log(e)});
            //       }
            //   }).catch((e)=>{console.log(e)})
            // }
            axios({
              method: "post",
              url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification",
              data: {
                'Title': 'Thông báo CRM',
                'Message': content,
                'Type': 'SendCandidate',
                'UserId': dataUserReceive._id,
                'SenderId': companyId,
                'Link': link,
              },
              headers: { "Content-Type": "multipart/form-data" }
            }).catch((e) => { console.log(e) });
            socket.emit('CRMNotification', Number(listReceive[i]), content[i], customerName[i], Number(customerId[i]), groupName[i], link[i], Number(type[i]), phone[i])
          }
          else {
            console.log("Tồn tại thông tin nhân viên không chính xác");
          }
        }
      }
      else {
        return res.status(200).json(createError(200, "Sai thông tin công ty"));
      }
      return res.json({
        data: {
          result: true,
          message: "Thông báo đến tài khoản Chat365 thành công",
        },
        error: null
      })
    }
    else {
      return res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
    }
  } catch (err) {
    // return res.status(200).json(createError(200, err.message));
    console.log("Tien CRM", err)
  }
}

export const UpdateTokenApp = async (req, res, next) => {
  try {
    if (req.body && req.body.user_id && req.body.type_user && req.body.firebase_token
      && req.body.device_id && req.body.from && (!isNaN(req.body.user_id)) &&
      (!isNaN(req.body.type_user)) && (!isNaN(req.body.user_id))) {
      let notifyObject = await NotificationFireBase.find({ userId: Number(req.body.user_id), type: Number(req.body.type_user), idDevice: req.body.device_id, from: req.body.from }).lean();
      if (notifyObject.length > 0 && notifyObject[0] && notifyObject[0]._id) {
        const savedObFireBaseNoti = await NotificationFireBase.findOneAndUpdate({ _id: notifyObject[0]._id }, { token: req.body.firebase_token }, { new: true });
        if (savedObFireBaseNoti && savedObFireBaseNoti._id) {
          res.json({
            data: {
              result: true,
              message: "Cập nhật token thành công",
              ObFireBaseNoti: savedObFireBaseNoti
            },
            error: null
          })
        }
        else {
          res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
      }
      else {
        const newObject = new NotificationFireBase({
          userId: Number(req.body.user_id),
          type: Number(req.body.type_user),
          token: req.body.firebase_token,
          idDevice: req.body.device_id,
          from: req.body.from,
        });
        const savedObFireBaseNoti = await newObject.save();
        if (savedObFireBaseNoti && savedObFireBaseNoti._id) {
          res.json({
            data: {
              result: true,
              message: "Cập nhật token thành công",
              ObFireBaseNoti: savedObFireBaseNoti
            },
            error: null
          })
        }
        else {
          res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
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

//thông báo nhắc chấm công
export const SendNotificationTimekeeping = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status) {
        console.log("Token hop le, SendNotificationTimekeeping")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req && req.body && req.body.ListEmployeeId) {

      let tag = [];
      if (!req.body.ListEmployeeId.includes("[")) {
        tag = req.body.ListEmployeeId;
      } else {
        let string = String(req.body.ListEmployeeId).replace("[", "");
        string = String(string).replace("]", "");
        let list = string.split(",");
        for (let i = 0; i < list.length; i++) {
          if (Number(list[i])) {
            tag.push(Number(list[i]));
          }
        }
      }

      const findE = await Users.find({ idQLC: { $in: tag } }, { "inForPerson.employee.com_id": 1, idQLC: 1 }).lean()


      if (findE) {
        for (let i = 0; i < findE.length; i++) {
          let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${findE[i].idQLC}`;
          let NotiCreateAt = new Date();

          const notification = new Notification({
            _id: notificationId, userId: findE[i].idQlC, companyId: findE[i].inForPerson.employee.com_id,
            message: req.body.Message, title: req.body.Title, type: "Timekeeing",
            createAt: NotiCreateAt
          })
          const savenotification = await notification.save()

          axios({
            method: "post",
            url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification",
            data: {
              IDNotification: notificationId,
              Title: req.body.Title,
              Message: req.body.Message,
              Type: "Timekeeing",
              UserId: findE[i].idQLC
            },
            headers: { "Content-Type": "multipart/form-data" }
          }).catch((e) => {
            console.log(e)
          })
        }
      }
      res.json({
        data: {
          result: true,
          message: "Gửi thông báo đến chat365 thành công",
        },
        error: null
      })

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

export const Notification365 = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, Notification365")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body.CompanyId && req.body.SenderId && req.body.TypeSenderId && req.body.Title && (req.body.ListComReceive || req.body.ListEpReceive)) {
      const companyId = Number(req.body.CompanyId)
      const senderId = Number(req.body.SenderId)
      const typeSenderId = Number(req.body.TypeSenderId)
      const title = req.body.Title
      const listComReceive = req.body.ListComReceive ? req.body.ListComReceive.replace('[', '').replace(']', '').split(',') : null
      const listEpReceive = req.body.ListEpReceive ? req.body.ListEpReceive.replace('[', '').replace(']', '').split(',') : null
      const message = req.body.Message
      const link = req.body.Link

      const user = await Users.findOne({ idQLC: senderId, type: typeSenderId }, { _id: 1, "inForPerson.employee.com_id": 1 }).lean()
      if (user) {

        if (user.inForPerson.employee.com_id === companyId) {
          if (listComReceive) {
            for (let i = 0; i < listComReceive.length; i++) {
              if (Number(listComReceive[i]) !== senderId) {
                let dataReceive = await Users.findOne({ idQLC: Number(listComReceive[i]), type: 1 }, { _id: 1 }).lean()

                if (dataReceive) {
                  let createConversation_alt = await FCreateNewConversation(user._id, dataReceive._id)
                  // let createConversation = await axios({
                  //   method: "post",
                  //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
                  //   data: {
                  //     'userId': user._id,
                  //     'contactId': dataReceive._id
                  //   },
                  //   headers: { "Content-Type": "multipart/form-data" }
                  // });
                  FSendMessage({
                    body: {
                      'ConversationID': createConversation_alt,
                      'SenderID': user._id,
                      'MessageType': "text",
                      'Message': `${title}${message ? `\n${message}` : ''}${link ? `\nĐể xem bạn vui lòng truy cập tại đây:\n${link}` : ''}`,
                    }
                  }).catch((e) => {
                    console.log("error when send FSendMessage", e)
                  })

                  // await axios({
                  //   method: "post",
                  //   url: "http://43.239.223.142:9000/api/message/SendMessage",
                  //   data: {
                  //     'ConversationID': createConversation_alt,
                  //     'SenderID': user._id,
                  //     'MessageType': "text",
                  //     'Message': `${title}${message ? `\n${message}` : ''}${link ? `\nĐể xem bạn vui lòng truy cập tại đây:\n${link}` : ''}`,
                  //   },
                  //   headers: { "Content-Type": "multipart/form-data" }
                  // });
                }
              }
            }
          }
          if (listEpReceive) {
            for (let i = 0; i < listEpReceive.length; i++) {
              if (Number(listEpReceive[i]) !== senderId) {
                let dataReceive = await Users.findOne({ idQLC: Number(listEpReceive[i]), type: 2 }, { _id: 1 }).lean()
                if (dataReceive) {
                  await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
                    data: {
                      'userId': user._id,
                      'contactId': dataReceive._id
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                  });
                  await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/message/SendMessage",
                    data: {
                      // 'ConversationID': createConversation.data.data.conversationId,
                      // 'SenderID': user._id,
                      'ConversationID': 103501,
                      'SenderID': 90229,
                      'MessageType': "text",
                      'Message': `${title}${message ? `\n${message}` : ''}${link ? `\nĐể xem bạn vui lòng truy cập tại đây:\n${link}` : ''}`,
                    },
                    headers: { "Content-Type": "multipart/form-data" }
                  });

                }
              }
            }
          }
          res.json({
            data: {
              result: true,
              message: "Thông báo đến tài khoản Chat365 thành công",
            },
            error: null
          })
        }
        else {
          res.status(200).json(createError(200, "Sai thông tin công ty"));
        }
      }
      else {
        res.status(200).json(createError(200, "Sai thông tin người gửi"));
      }
    } else {
      res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}

//thông báo thu hồi, cấp phát tài sản
export const NotificationAllocation = async (req, res, next) => {
  try {
    console.log("NotificationAllocation ddang chayj")
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.employeeId)) {
        console.log("Token hop le, NotificationAllocation")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req && req.body) {

      let listProperty = [];
      if (!req.body.propertyList.includes("[")) {
        listProperty = req.body.propertyList;
      } else {
        let string = String(req.body.propertyList).replace("[", "");
        string = String(string).replace("]", "");
        let list = string.split(",");
        for (let i = 0; i < list.length; i++) {
          if (String(list[i])) {
            listProperty.push(String(list[i]));
          }
        }
      }

      let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/get_department.php', qs.stringify({
        'dp_id': req.body.dp_id,
        'com_id': req.body.companyId,
      }));

      const findCom = await Users.findOne({ idQLC: req.body.companyId }).lean()
      const findE = await Users.findOne({ idQLC: req.body.employeeId }).lean()
      const findR = await Users.findOne({ idQLC: req.body.receiveId }).lean()



      if (findE && /*findE.notificationTransferAsset == 1*/ true) {
        let mess
        if (req.body.type == 0) {
          if (!req.body.dp_id) {
            mess = `Bạn được thêm vào làm người bàn giao để cấp phát ${listProperty} đến ${findR.userName}`;
          }
          else mess = `Bạn được thêm vào làm người bàn giao để cấp phát ${listProperty} đến ${response.data.data.user_info.dep_name}`;
        }
        else if (req.body.type == 1) {
          if (!req.body.dp_id) {
            mess = `Bạn được thêm vào làm người bàn giao để thu hồi ${listProperty} đến ${findR.userName}`;
          }
          else mess = `Bạn được thêm vào làm người bàn giao để thu hồi ${listProperty} đến ${response.data.data.user_info.dep_name}`;
        }

        if (/*findE.notificationAllocationRecall == 1*/ true) {
          let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${findE.idQLC}`;
          let NotiCreateAt = new Date();

          const notification = new Notification({
            _id: notificationId, userId: findE.idQLC, companyId: findCom.idQLC,
            message: mess, type: "SendCandidate",
            createAt: NotiCreateAt
          })
          const savenotification = await notification.save()
        }

        axios({
          method: "post",
          url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification",
          data: {
            Title: "Thông báo cấp phát/thu hồi tài sản",
            Message: mess,
            Type: "SendCandidate",
            UserId: findE._id
          },
          headers: { "Content-Type": "multipart/form-data" }
        }).catch((e) => {
          console.log(e)
        })
      }


      if (findR && /*findR.notificationTransferAsset == 1*/ true) {
        let mess
        if (req.body.type == 0) {
          if (!req.body.dp_id) {
            mess = `Bạn đã được cấp phát ${listProperty}`;
          }
          else mess = `Phòng bạn đã được cấp phát ${listProperty} `;
        }
        else if (req.body.type == 1) {
          if (listProperty.length == 1) {
            mess = `Tài sản cấp phát ${listProperty} đã được thu hồi`;
          }
          else if (listProperty.length > 1) {
            mess = ` ${listProperty.length} đã được thu h ồi `;
          }
        }

        if (/*findR.notificationAllocationRecall == 1*/ true) {
          let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${findR.idQLC}`;
          let NotiCreateAt = new Date();

          const notification = new Notification({
            _id: notificationId, userId: findR.idQLC, companyId: findCom.idQLC,
            message: mess, type: "SendCandidate",
            createAt: NotiCreateAt
          })
          const savenotification = await notification.save()
        }

        axios({
          method: "post",
          url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification",
          data: {
            Title: "Thông báo cấp phát/thu hồi tài sản",
            Message: mess,
            Type: "SendCandidate",
            UserId: findR._id
          },
          headers: { "Content-Type": "multipart/form-data" }
        }).catch((e) => {
          console.log(e)
        })
      }

      res.json({
        data: {
          result: true,
          message: "Gửi thông báo đến chat365 thành công",
        },
        error: null
      })

    }
    else {
      res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  }
  catch (e) {
    console.log("capphattaisan,hung", e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}

//thong bao dieu chuyen nhan vien
export const NotificationPersonnelChange = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, NotificationPersonnelChange")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    const companyId = Number(req.body.CompanyId);
    const employeeId = Number(req.body.EmployeeId);
    const senderId = Number(req.body.SenderId);
    const status = Number(req.body.Status);
    const newCompanyId = Number(req.body.NewCompanyId);
    const type = req.body.Type;
    const listReceive = JSON.parse(req.body.ListReceive);
    const department = req.body.Department;
    const newCompanyName = req.body.NewCompanyName;
    const position = req.body.Position;
    const listTypes = ["QuitJob", "Appoint", "Transfer"];
    const createAt = req.body.CreateAt;
    if (
      companyId == null ||
      employeeId == null ||
      senderId == null ||
      listReceive == null ||
      status == null ||
      !listTypes.includes(type)
    ) {
      return res.send(createError(200, "Thiếu thông tin truyền lên"));
    }
    let dataUser = await GetUserByID365(senderId, status);
    var user;
    if (dataUser) {
      user = await GetInfoUser(dataUser);

    }
    let dataEmployee = await GetUserByID365(employeeId, 2);

    var employee;
    let comEmpName
    if (dataEmployee) {
      employee = await GetInfoUser(dataEmployee);
      comEmpName = await Users.findOne({ idQLC: employee.inForPerson.employee.com_id, type: 1 }, { userName: 1 })
    }
    if (
      user == undefined ||
      employee == undefined ||
      user.inForPerson.employee.com_id !== companyId ||
      employee.inForPerson.employee.com_id !== companyId
    ) {
      return res
        .status(400)
        .send(
          createError(
            400,
            "Sai thông tin công ty hoặc sai thông tin nhân viên thay đổi "
          )
        );
    }
    for (let i = 0; i < listReceive.length; i++) {
      const dataUserReceive = await GetUserByID365(listReceive[i], 2);
      var userReceive;
      if (dataUserReceive) {
        userReceive = await GetInfoUser(dataUserReceive);
      }
      if (
        userReceive != null &&
        userReceive._id != 0 &&
        userReceive._id != user._id
      ) {
        var conversationId;
        const users = [userReceive._id, user._id];
        const checkExistCon = await checkEmptyConversation(
          userReceive._id,
          user._id
        );
        if (!checkExistCon) {
          const newCon = await InsertNewConversation1vs1(0, "Normal", 0, users);
          conversationId = newCon._id;
        } else {
          conversationId = checkExistCon._id;
        }
        const messageData = {
          _id: `${new Date().getTime() * 1000 + 621355968000000000}_${user._id
            }`,
          displayMessage: await GetDisplayMessage(),
          senderId: user._id,
          messageType: "text",
          isEdited: 0,
          createAt: Date.now()
        };
        if (type === "QuitJob") {
          messageData[
            "message"
          ] = `${employee.userName} đã bị cho thôi việc khỏi công ty:\n${comEmpName.userName}\n Áp dụng từ: ${date.format(
            new Date(createAt),
            "DD/MM/YYYY"
          )}`;
        }
        if (type === "Appoint") {
          messageData[
            "message"
          ] = `${employee.userName}  đã được bổ nhiệm làm  ${position} \nPhòng: ${department}\nCông ty: ${comEmpName.userName}\n Áp dụng từ: ${date.format(
            new Date(createAt),
            "DD/MM/YYYY"
          )}`;
        }
        if (type === "Transfer") {
          messageData[
            "message"
          ] = `${employee.userName} đã được chuyển công tác thành ${position}\nPhòng: ${department}\nCông ty: ${newCompanyName}\n Áp dụng từ: ${date.format(
            new Date(createAt),
            "DD/MM/YYYY"
          )}`;
        }
        const con = await InsertMessage(conversationId, messageData);
        if (con) {
          // console.log(conversationId, user._id, messageData.message);
          const mess = messageData.message;
          FSendMessage({
            body: {
              ConversationID: conversationId,
              SenderID: user._id,
              MessageType: "text",
              Message: mess,
            }
          }).catch((e) => {
            console.log("error when send FSendMessage", e)
          })
          // const ress = await axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/message/SendMessage",
          //   data: {
          //     ConversationID: conversationId,
          //     SenderID: user._id,
          //     MessageType: "text",
          //     Message: mess,
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // });
          // console.log(ress);
        }
      }
    }
    if (employee._id != 0) {
      if (type === "QuitJob") {
        await UserQuitJob(employeeId._id);
        socketV3.emit("Quitjob", employee._id, companyId);
      }
      if (type === "Transfer") {
        var newCompany;
        const dataNewCompany = await GetUserByID365(newCompanyId, 1);
        newCompany = await GetInfoUser(dataNewCompany);
        await UpdateCompany(
          employee._id,
          newCompany.idQLC,
          newCompany.userName,
          employee.idQLC
        );
        socketV3.emit("Quitjob", employee.ID, employee.inForPerson.employee.com_id);
        socketV3.emit(
          "NewMemberCompany",
          employee._id,
          employee.idQLC,
          employee.inForPerson.employee.com_id
        );
      }
    }
    return res.send({
      data: {
        result: true,
        message: "Thông báo đến tài khoản Chat365 thành công",
      },
      error: null,
    });
  } catch (err) {
    console.log(err);
    if (err) return res.send(createError(200, err.message));
  }
};


export const SendContractFile = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, SendContractFile")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    console.log(req.body)
    if (req.body.SenderId && req.body.Type && req.body.ReceiveId && req.body.InfoFile && req.body.NameFile) {
      const senderId = Number(req.body.SenderId)
      const type = Number(req.body.Type)
      const listReceiveId = req.body.ReceiveId.replace('[', '').replace(']', '').split(',')
      const listInfoFile = req.body.InfoFile.replace(/['"]/g, '').replace(']', '').replace('[', '').split(',')
      const listNameFile = req.body.NameFile.replace(/['"]/g, '').replace(']', '').replace('[', '').split(',')
      let userSent
      let companyId
      let errorUserReceive = []
      if (type === 1 || type === 2 || type === 5) {
        userSent = await Users.findOne({ idQLC: senderId, type: 1 }, { _id: 1, idQLC: 1 }).lean()
        companyId = userSent.idQLC
      }
      else if (type === 3 || type === 4 || type === 6) {
        userSent = await Users.findOne({ idQLC: senderId, type: 2 }, { _id: 1, "inForPerson.employee.com_id": 1 }).lean()
        companyId = userSent.inForPerson.employee.com_id

      }
      else if (type === 7) {
        userSent = await Users.findOne({ idQLC: senderId, type: 0 }, { _id: 1, "inForPerson.employee.com_id": 1 }).lean()
        companyId = userSent.inForPerson.employee.com_id

      }

      if (userSent) {
        const listFile = []
        for (let i = 0; i < listInfoFile.length; i++) {
          let typeFile = 'sendFile'
          const response = await axios({
            method: 'GET',
            url: listInfoFile[i],
            responseType: 'stream'
          });
          const fileName = `${Date.now() * 10000 + 621355968000000000}-${listNameFile[i]}`
          await new Promise((resolve, reject) => {
            response.data.pipe(fs.createWriteStream(`C:/Chat365/publish/wwwroot/uploads/${fileName.replace(/[ +!@#$%^&*]/g, '')}`))
              .on('finish', resolve)
              .on('error', reject)
          })
          if (listNameFile[i].toUpperCase().includes('.JPEG') || listNameFile[i].toUpperCase().includes('.JPG') || listNameFile[i].toUpperCase().includes('.PNG') || listNameFile[i].toUpperCase().includes('.JFIF')) {
            typefile = 'sendPhoto'
            await sharp(`C:/Chat365/publish/wwwroot/uploads/${fileName}`)
              .resize({ fit: sharp.fit.contain, width: 120, height: 120 })
              .toFile(`C:/Chat365/publish/wwwroot/uploadsImageSmall/${fileName}`)
          }
          const sizeFile = fs.statSync(`C:/Chat365/publish/wwwroot/uploads/${fileName.replace(/[ +!@#$%^&*]/g, '')}`).size
          let FileSizeInByte = Number(sizeFile);
          if (Number(sizeFile) < 1024) {
            FileSizeInByte = `${FileSizeInByte} bytes`;
          }
          else if ((Number(sizeFile) / 1024 >= 1) && (Number(sizeFile) / 1024 < 1024)) {
            FileSizeInByte = `${String(FileSizeInByte / 1024).split(".")[0]}.${String((FileSizeInByte / 1024) / 1024).split(".")[1].slice(0, 2)} KB`
          }
          else if ((Number(sizeFile) / 1024) / 1024 >= 1) {
            FileSizeInByte = `${String((FileSizeInByte / 1024) / 1024).split(".")[0]}.${String((FileSizeInByte / 1024) / 1024).split(".")[1].slice(0, 2)} MB`
          }
          let nameDisplay = String(fileName).split("-")[1];
          if ((String(nameDisplay).trim() != "") && String(nameDisplay).length > 25) {
            nameDisplay = String(nameDisplay).slice(0, 23);
          }
          const file = {
            TypeFile: typeFile,
            FullName: fileName,
            FileSizeInByte: FileSizeInByte,
            Height: 250,
            Width: 250,
            SizeFile: sizeFile,
            NameDisplay: nameDisplay
          }
          listFile.push(file)
        }
        let userReceive
        let userReceiveCompany
        for (let i = 0; i < listReceiveId.length; i++) {
          if (type === 1 || type === 3) {
            userReceive = await Users.findOne({ idQLC: Number(listReceiveId[i]), type: 2 }, { _id: 1, idQlC: 1 }).lean()
            userReceiveCompany = userReceive.idQLC
          }
          else if (type === 2 || type === 4) {
            userReceive = await Users.findOne({ idQLC: Number(listReceiveId[i]), type: 1 }, { _id: 1, "inForPerson.employee.com_id": 1 }).lean()
            userReceiveCompany = userReceive.inForPerson.employee.com_id

          }
          else if (type === 5 || type === 6 || type === 7) {
            userReceive = await Users.findOne({ idQLC: Number(listReceiveId[i]), type: 0 }, { _id: 1, "inForPerson.employee.com_id": 1 }).lean()
            userReceiveCompany = userReceive.inForPerson.employee.com_id

          }
          if (userReceive) {
            if (userReceiveCompany === companyId) {
              const check = await Contact.findOne({
                $or: [
                  { userFist: userSent._id, userSecond: userReceive._id },
                  { userFist: userReceive._id, userSecond: userSent._id }
                ]
              }).lean()
              if (!check) {
                await Contact.create({ userFist: userSent._id, userSecond: userReceive._id })
                socket.emit('AcceptRequestAddFriend', userSent._id, userReceive._id)
              }
            }
            let createConversation_alt = await FCreateNewConversation(userSent._id, userReceive._id)
            // let createConversation = await axios({
            //   method: "post",
            //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
            //   data: {
            //     'userId': userSent._id,
            //     'contactId': userReceive._id
            //   },
            //   headers: { "Content-Type": "multipart/form-data" }
            // });
            FSendMessage({
              body: {
                'ConversationID': createConversation_alt,
                'SenderID': userSent._id,
                'MessageType': "sendFile",
                'File': JSON.stringify(listFile),
              }
            }).catch((e) => {
              console.log("error when send FSendMessage", e)
            })
            // let sendmess = await axios({
            //   method: "post",
            //   url: "http://43.239.223.142:9000/api/message/SendMessage",
            //   data: {
            //     'ConversationID': createConversation_alt,
            //     'SenderID': userSent._id,
            //     'MessageType': "sendFile",
            //     'File': JSON.stringify(listFile),
            //   },
            //   headers: { "Content-Type": "multipart/form-data" }
            // });
          }
          else {
            if (!errorUserReceive.includes(Number(listReceiveId[i]))) errorUserReceive.push(Number(listReceiveId[i]))
          }
        }
        if (errorUserReceive.length > 0) {
          res.status(200).json(createError(200, `Người dùng ${errorUserReceive} chưa có tài khoản chat`));
        }
        else {
          res.json({
            data: {
              result: true,
              message: "Gửi văn bản đến chat365 thành công",
            },
            error: null
          })
        }
      }
      else {
        res.status(200).json(createError(200, "Tài khoản gửi chưa đăng nhập chat365"));
      }
    }
    else {
      res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
    }

  } catch (err) {
    console.log('Tiến: SendContractFile', err)
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}


export const SendNewNotification_v2 = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, SendNewNotification_v2")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body.SenderId && (req.body.ConversationId || req.body.UserId) && req.body.Message) {
      const userId = req.body.UserId ? Number(req.body.UserId) : null
      const conversationId = req.body.ConversationId ? Number(req.body.ConversationId) : null
      const senderId = Number(req.body.SenderId)
      let title = req.body.Title.replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase())
      const message = req.body.Message
      const link = req.body.Link
      const type = req.body.Type
      if (conversationId) {
        FSendMessage({
          body: {
            'ConversationID': conversationId,
            'SenderID': senderId,
            'MessageType': type,
            'Message': `${title ? title : ''}\n${message}`
          }
        }).catch((e) => {
          console.log("error when send FSendMessage", e)
        })
        // await axios({
        //   method: "post",
        //   url: "http://43.239.223.142:9000/api/message/SendMessage",
        //   data: {
        //     'ConversationID': conversationId,
        //     'SenderID': senderId,
        //     'MessageType': type,
        //     'Message': `${title ? title : ''}\n${message}`
        //   },
        //   headers: { "Content-Type": "multipart/form-data" }
        // })
        if (link) {
          FSendMessage({
            body: {
              'ConversationID': conversationId,
              'SenderID': senderId,
              'MessageType': 'link',
              'Message': link
            }
          }).catch((e) => {
            console.log("error when send FSendMessage", e)
          })
          // await axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/message/SendMessage",
          //   data: {
          //     'ConversationID': conversationId,
          //     'SenderID': senderId,
          //     'MessageType': 'link',
          //     'Message': link
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // })
        }
      }
      else if (userId) {
        if (userId !== senderId) {
          let createConversation_alt = await FCreateNewConversation(userId, senderId)
          // let createConversation = await axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/conversations/CreateNewConversation",
          //   data: {
          //     'userId': userId,
          //     'contactId': senderId
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // })
          FSendMessage({
            body: {
              'ConversationID': createConversation_alt,
              'SenderID': senderId,
              'MessageType': type,
              'Message': `${title ? title : ''}\n${message}`
            }
          }).catch((e) => {
            console.log("error when send FSendMessage", e)
          })
          // await axios({
          //   method: "post",
          //   url: "http://43.239.223.142:9000/api/message/SendMessage",
          //   data: {
          //     'ConversationID': createConversation_alt,
          //     'SenderID': senderId,
          //     'MessageType': type,
          //     'Message': `${title ? title : ''}\n${message}`
          //   },
          //   headers: { "Content-Type": "multipart/form-data" }
          // })
          if (link) {
            FSendMessage({
              body: {
                'ConversationID': createConversation_alt,
                'SenderID': senderId,
                'MessageType': 'link',
                'Message': link
              }
            }).catch((e) => {
              console.log("error when send FSendMessage", e)
            })
            // await axios({
            //   method: "post",
            //   url: "http://43.239.223.142:9000/api/message/SendMessage",
            //   data: {
            //     'ConversationID': createConversation_alt,
            //     'SenderID': senderId,
            //     'MessageType': 'link',
            //     'Message': link
            //   },
            //   headers: { "Content-Type": "multipart/form-data" }
            // })
          }
        }
        else {
          res.status(200).json(createError(200, "Thông tin người nhận không hợp lệ"))
        }
      }
      res.json({
        data: {
          result: true,
          message: "Gửi thông báo đến chat365 thành công",
        },
        error: null
      })
    }
    else {
      res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
    }
  } catch (err) {
    console.log('Tiến SendNewNotification_v2:\n', err)
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
  }
}

export const SendNotification_v2 = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, SendNotification_v2")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body && req.body.UserId) {
      let receiveInfor = req.body;
      let userID = Number(receiveInfor.UserId);
      if (req.body.typeReceiver && (String(req.body.typeReceiver) == "id365")) {
        let userFind = await Users.findOne({ idQLC: userID }, { _id: 1 }).lean();
        if (userFind) {
          userID = userFind._id;
        }
      }
      let type = String(receiveInfor.Type).trim() || "";
      let sender = Number(receiveInfor.SenderId) || 0; // id Chat 
      let link = String(req.body.Link) || "";
      let title = receiveInfor.Title || "";
      let Message = receiveInfor.Message || "";
      let conversationId = req.body.ConversationId ? Number(req.body.ConversationId) : 0
      let users = await Users.find({ _id: userID }).limit(1).lean();
      if (users.length > 0) {
        if (/*Number(users[0].notificationSendCandidate) == 1*/ true) {
          let dataSender = await Users.findOne({ _id: sender });
          let dataSenderComName = await Users.findOne({ idQLC: dataSender?.inForPerson?.employee?.com_id, type: 1 }, { userName: 1 })
          if (dataSender && dataSender._id) {
            let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${userID}`;
            let insert = await InsertNotification(notificationId, userID, users[0]._id, title, Message, type, "", conversationId, new Date(), link);
            if (insert == 1) {
              let participant = fParticipantNotification(dataSender?.inForPerson?.employee?.com_id || dataSender.idQLC, dataSenderComName?.userName || dataSender.userName, dataSender.fromWeb,
                dataSender._id, dataSender.id365, dataSender.idTimViec365, dataSender.lastActivedAt,
                dataSender.type, dataSender.userName, dataSender.email ? dataSender.email : dataSender.phoneTK, dataSender.isOnline);

              let stringTime = "";
              let hour = new Date().getHours();
              let minute = new Date().getMinutes();
              if (minute < 10) {
                minute = "0" + minute;
              }
              let category;
              if (hour > 12) {
                hour = hour - 12;
                category = "PM";
                if (hour < 10) {
                  hour = `0${hour}`
                }
              }
              else {
                category = "AM"
              }
              if (hour < 10) {
                hour = `0${hour}`
              }
              let month = new Date().getMonth() + 1;
              if (month < 10) {
                month = `0${month}`
              }
              let date = new Date().getDate();
              if (date < 10) {
                date = `0${date}`
              }

              let second = new Date().getSeconds();
              if (second < 10) {
                second = `0${second}`
              }
              stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;
              // bắn socket; 
              socket.emit("SendNotification", userID, {
                IDNotification: notificationId,
                UserID: userID,
                Participant: participant,
                Title: title,
                Message: Message,
                MessageId: null,
                Time: `Hôm nay lúc ${stringTime}`,
                IsUnreader: 1,
                Type: type,
                ConversationId: conversationId,
                CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
                Link: link
              });
              res.json({
                data: {
                  result: true,
                  message: "Gửi thông báo đến chat365 thành công",
                },
                error: null
              })
            }
            else {
              res.status(200).json(createError(200, "Gửi thông báo không thành công"));
            }

          }
          else {
            res.status(200).json(createError(200, "Sai thông tin người gửi"));
          }
        }
        else {
          res.status(200).json(createError(200, "User đã tắt thông báo này"));
        }
      }
      else {
        res.status(200).json(createError(200, "Sai thông tin user"));
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

export const NotificationOfferSent = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, NotificationOfferSent")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    console.log('NotificationOfferSent', req.body)
    const companyId = Number(req.body.CompanyId)
    const senderId = Number(req.body.SenderId)
    const employeeId = Number(req.body.EmployeeId)
    const listFollower = req.body.ListFollower.replace('[', '').replace(']', '').split(',')
    const status = req.body.Status
    const message = req.body.Message
    const link = req.body.Link
    const success = req.body.type ? Number(req.body.type) : 0

    let sender = await Users.findOne({ idQLC: senderId, type: 2 }).lean()
    const typeOffer = (success === 0) ? 'AcceptOffer' : 'DecilineOffer'
    if (sender.inForPerson.employee.com_id !== companyId) {
      res.status(200).json(createError(200, "Sai thông tin công ty"))
    }
    let employee = await Users.findOne({ idQLC: employeeId, type: 2 }).lean()
    let company = await Users.findOne({ idQLC: companyId, type: 1 }).lean()

    if (true) {
      const Link = (link || link.trim() === '') ? 'https://vanthu.timviec365.vn/de-xuat-gui-di.html' : link
      let mess
      if (success === 0) {
        mess = `${employee.userName} đã được duyệt đề xuất:\n${status}`
      }
      else {
        mess = `Đề xuất của ${employee.userName} đã bị từ chối\n${status}${message ? `\nGhi chú: ${message}` : ''}`
      }
      //Insert thông báo vào base
      await axios({
        method: "post",
        url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2",
        data: {
          'Message': mess,
          'Type': typeOffer,
          'UserId': company._id,
          'SenderId': company._id,
          'Link': Link,
        },
        headers: { "Content-Type": "multipart/form-data" }
      })
    }
    if (true) {
      const Link = (link || link.trim() === '') ? 'https://vanthu.timviec365.vn/de-xuat-gui-di.html' : link
      let mess
      if (success === 0) {
        mess = `${employee.userName} đã được duyệt đề xuất:\n${status}`
      }
      else {
        mess = `Đề xuất của ${employee.userName} đã bị từ chối\n${status}${message ? `\nGhi chú: ${message}` : ''}`
      }
      if (/*(success === 0 && employee.notificationAcceptOffer === 1) || (success === 1 && employee.notificationDecilineOffer === 1)*/ true) {
        //Insert thông báo vào base
        await axios({
          method: "post",
          url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2",
          data: {
            'Message': mess,
            'Type': typeOffer,
            'UserId': employee._id,
            'SenderId': company._id,
            'Link': Link,
          },
          headers: { "Content-Type": "multipart/form-data" }
        })
      }
    }
    if (senderId !== employeeId) {
      if (true) {
        const Link = (link || link.trim() === '') ? 'https://vanthu.timviec365.vn/de-xuat-gui-di.html' : link
        let mess
        if (success === 0) {
          mess = `${employee.userName} đã được duyệt đề xuất:\n${status}`
        }
        else {
          mess = `Đề xuất của ${employee.userName} đã bị từ chối\n${status}${message ? `\nGhi chú: ${message}` : ''}`
        }
        if (/*(success === 0 && sender.notificationAcceptOffer === 1) || (success === 1 && sender.notificationDecilineOffer === 1)*/ true) {
          //Insert thông báo vào base
          await axios({
            method: "post",
            url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2",
            data: {
              'Message': mess,
              'Type': typeOffer,
              'UserId': sender._id,
              'SenderId': company._id,
              'Link': Link,
            },
            headers: { "Content-Type": "multipart/form-data" }
          })
        }
      }
    }
    for (let i = 0; i < listFollower.length; i++) {
      if (Number(listFollower[i]) !== senderId && Number(listFollower[i]) !== employeeId) {
        let userReceive = await Users.findOne({ idQLC: Number(listFollower[i]), type: 2 }).lean()

        if (true) {
          const Link = (link || link.trim() === '') ? 'https://vanthu.timviec365.vn/de-xuat-gui-di.html' : link
          let mess
          if (success === 0) {
            mess = `${employee.userName} đã được duyệt đề xuất:\n${status}`
          }
          else {
            mess = `Đề xuất của ${employee.userName} đã bị từ chối\n${status}${message ? `\nGhi chú: ${message}` : ''}`
          }
          if (/*(success === 0 && userReceive.notificationAcceptOffer === 1) || (success === 1 && userReceive.notificationDecilineOffer === 1)*/ true) {
            //Insert thông báo vào base
            await axios({
              method: "post",
              url: "http://210.245.108.202:9000/api/V2/Notification/SendNotification_v2",
              data: {
                'Message': mess,
                'Type': typeOffer,
                'UserId': userReceive._id,
                'SenderId': company._id,
                'Link': Link,
              },
              headers: { "Content-Type": "multipart/form-data" }
            })
          }
        }
      }
    }
    res.json({
      data: {
        result: true,
        message: "Gửi thông báo đến chat365 thành công",
      },
      error: null
    })
  } catch (err) {
    console.log('Tiến NotificationOfferSent:\n', err)
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
  }
}


export const SendNotification_v3 = async (req, res) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.userId)) {
        console.log("Token hop le, SendNotification_v3")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    const userId = Number(req.body.userId)
    const conversationId = Number(req.body.conversationId)
    const type = req.body.type
    const link = req.body.link
    const title = req.body.title
    const message = req.body.message
    const participants = req.body.participants.replace('[', '').replace(']', '').split(',')
    const messageId = req.body.messageId || null;

    const dataUser = await Users.findOne({ _id: userId }).lean()
    const comName = await Users.findOne({ idQLC: dataUser.inForPerson.employee.com_id }, { userName: 1 }).lean()
    await Promise.all([
      participants.map(async (participant) => {
        let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${participant}`
        let insert = await InsertNotification(notificationId, Number(participant), userId, title, message, type, "", conversationId, new Date(), link)

        let user = fParticipantNotification(dataUser.inForPerson.employee.com_id, comName.userName, dataUser.fromWeb,
          dataUser._id, dataUser.idQLC, dataUser.idTimViec365, dataUser.lastActivedAt,
          dataUser.type, dataUser.userName, dataUser.email ? dataUser.email : dataUser.phoneTK, dataUser.isOnline);
        let stringTime = "";
        let hour = new Date().getHours();
        let minute = new Date().getMinutes();
        if (minute < 10) {
          minute = "0" + minute;
        }
        let category;
        if (hour > 12) {
          hour = hour - 12;
          category = "PM";
          if (hour < 10) {
            hour = `0${hour}`
          }
        }
        else {
          category = "AM"
        }
        if (hour < 10) {
          hour = `0${hour}`
        }
        let month = new Date().getMonth() + 1;
        if (month < 10) {
          month = `0${month}`
        }
        let date = new Date().getDate();
        if (date < 10) {
          date = `0${date}`
        }

        let second = new Date().getSeconds();
        if (second < 10) {
          second = `0${second}`
        }
        stringTime = `${String(hour).replace(`0`, ``).replace(`0`, ``)}:${minute} ${category}`;
        // bắn socket; 
        socket.emit("SendNotification", Number(participant), {
          IDNotification: notificationId,
          UserID: Number(participant),
          Participant: user,
          Title: title,
          Message: message,
          MessageId: messageId,
          Time: `Hôm nay lúc ${stringTime}`,
          IsUnreader: 1,
          Type: type,
          ConversationId: conversationId,
          CreateAt: `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}6769+07:00`,
          Link: link
        })
      })
    ])
    res.json({
      data: {
        result: true,
        message: "Gửi thông báo đến chat365 thành công",
      },
      error: null
    })
  } catch (err) {
    console.log('Tiến SendNotification_v3:\n', err)
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
  }
}
const SendNewNotificationX = async (userId, contactId, mess, messType, link, uscid) => {
  try {
    let convId = await FCreateNewConversation(Number(userId), Number(contactId));
    FSendMessage({
      body: {
        ConversationID: Number(convId),
        SenderID: Number(contactId),
        MessageType: messType,
        Message: mess,
        Link: link,
        uscid: uscid
      }
    }).catch((e) => {
      console.log("error when send notificationX", e)
    })

    // await axios({
    //   method: "post",
    //   url: "http://43.239.223.142:9000/api/message/SendMessage",
    //   data: {
    //     ConversationID:Number(convId),
    //     SenderID: Number(contactId),
    //     MessageType:messType,
    //     Message:mess,
    //     Link:link,
    //     uscid: uscid
    //   },
    //   headers: { "Content-Type": "multipart/form-data" }
    // }).catch((e)=>{
    //    console.log(e)
    // });
    // await axios({
    //   method: "post",
    //   url: "http://43.239.223.142:9000/api/message/SendMessage",
    //   data: {
    //     ConversationID:Number(convId),
    //     SenderID: Number(contactId),
    //     MessageType:'link',
    //     Message:link,
    //     uscid: uscid
    //   },
    //   headers: { "Content-Type": "multipart/form-data" }
    // }).catch((e)=>{
    //    console.log(e)
    // });
  } catch (e) {
    console.log(e)
  }
}
export const NotificationOfferReceive = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.SenderId)) {
        console.log("Token hop le, NotificationOfferReceive")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (req.body && req.body.CompanyId && req.body.SenderId && req.body.ListReceive && req.body.ListFollower
      && req.body.Status && req.body.Message
    ) {
      let CompanyId = Number(req.body.CompanyId);
      let SenderId = Number(req.body.SenderId);
      let ListReceive = ConvertToArrayNumber(req.body.ListReceive);
      let ListFollower = ConvertToArrayNumber(req.body.ListFollower);
      let Status = String(req.body.Status).replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase()) || "";
      let Message = String(req.body.Message) || "";  // là mã số trong mảng các loại văn thư 
      let Link = String(req.body.Link) || "";

      console.log('Link', Link)
      let dataUser = await Users.find({ idQLC: SenderId, type: 2 }).lean();
      let user = {};
      if (dataUser.length > 0) {
        user = dataUser[0];
      }
      if (user != null) {
        if (user.inForPerson.employee.com_id == CompanyId) {
          for (let i = 0; i < ListReceive.length; i++) {
            if (ListReceive[i] != SenderId) {
              let dataReceive = await Users.find({ idQLC: ListReceive[i], type: 2 }).lean();
              let userReceive;
              if (dataReceive.length > 0) {
                userReceive = dataReceive[0];
              }
              if ((userReceive != null)) {
                let link = "";
                if ((!Link) && (Link.trim() == "")) {
                  link = "https://vanthu.timviec365.vn/de-xuat-gui-den.html"
                }
                else {
                  link = Link;
                }
                await SendNewNotificationX(userReceive._id, user._id, `${Status} \nHọ tên: ${user.userName || ""} \nNội dung ${Message}`, "OfferReceive", link)
              }
            }
          }
          let dataCompany = await Users.find({ idQLC: CompanyId, type: 1 }).lean();
          let userCompany = {};
          if (dataCompany.length > 0) {
            userCompany = dataCompany[0];
          }

          if (userCompany) {
            let link = "";
            if ((!Link) && (Link.trim() == "")) {
              link = "https://vanthu.timviec365.vn/de-xuat-gui-di.htm";
            }
            else {
              link = Link;
            }
            await SendNewNotificationX(userCompany._id, user._id, `${Status} \nHọ tên: ${user.userName || ""} \nNội dung ${Message}`, "OfferReceive", link)
            console.log(userCompany._id, user._id, `${Status} \nHọ tên: ${user.userName || ""} \nNội dung ${Message}`, "OfferReceive", link)
          }

          // if(req.body.ListFollower == "[0]"){
          for (let i = 0; i < ListFollower.length; i++) {
            if (ListFollower[i] != SenderId && (!ListReceive.includes(ListFollower[i]))) {
              let dataReceive = await Users.find({ idQLC: ListFollower[i], type: 2 }).lean();
              let userReceive;
              if (dataReceive.length > 0) {
                userReceive = dataReceive[0];
              }
              if ((userReceive != null)) {
                let link = "";
                if ((!Link) && (Link.trim() == "")) {
                  link = "https://vanthu.timviec365.vn/dang-theo-doi-de-xuat.html"
                }
                else {
                  link = Link;
                }
                await SendNewNotificationX(userReceive._id, user._id, `${Status} \nHọ tên: ${user.userName || ""} \nNội dung ${Message}`, "OfferReceive", link)
              }
            }
          }
          // }
          res.json({
            data: {
              result: true,
              message: "Gửi thông báo thành công",
            },
            error: null
          })
        }
        else {
          res.status(200).json(createError(200, "Sai Thông tin công ty"));
        }
      }
      else {
        res.status(200).json(createError(200, "Sai Thông tin nhân viên"));
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

export const NotificationTimviec365 = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.EmployeeId)) {
        console.log("Token hop le, NotificationOfferReceive")
      }
      else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    const CompanyId = Number(req.body.CompanyId);
    const EmployeeId = Number(req.body.EmployeeId);
    const Type = Number(req.body.Type);
    const Ep_Email = req.body.Ep_Email;
    const Ep_Password = req.body.Ep_Password;
    const Ep_Name = req.body.Ep_Name;
    const Ep_Avatar = req.body.Ep_Avatar;
    const Link = req.body.Link;
    const Position = req.body.Position;
    const city = req.body.City;
    const career = req.body.Career;
    const uscid = req.body.uscid || ''
    if ((EmployeeId != 0 || (Ep_Email != null && Ep_Password != null && Ep_Name != null && Ep_Avatar != null)) && CompanyId != 0 && ((Type == 1) || (Type == 2 && Position != null)) && Link != null) {
      let huhu = "";
      let dataCompany = await Users.findOne({ _id: CompanyId }).lean();
      let Company;
      if (dataCompany) {
        Company = dataCompany;
      }
      let Empoyee;
      if (EmployeeId != 0) {
        let dataEmpoyee = await Users.findOne({ _id: EmployeeId }).lean();
        if (dataEmpoyee) {
          Empoyee = dataEmpoyee;
          console.log(Empoyee)
        }
        else {
          dataEmpoyee = await Users.findOne({ email: Ep_Email, type: 2 }).lean();
          if (dataEmpoyee) {
            Empoyee = dataEmpoyee;
          }
          else {
            dataEmpoyee = await Users.findOne({ phoneTK: Ep_Email, type: 2 }).lean();

            if (dataEmpoyee) {
              Empoyee = dataEmpoyee;
            }
            else {
              dataEmpoyee = await Users.findOne({ email: Ep_Email, type: 0 }).lean();
              if (dataEmpoyee) {
                Empoyee = dataEmpoyee;
              }
              else {
                dataEmpoyee = await Users.findOne({ phoneTK: Ep_Email, type: 0 }).lean();
                if (dataEmpoyee) {
                  Empoyee = dataEmpoyee;
                }

              }
            }
          }
        }
      }

      else {
        let dataEmpoyee = await Users.findOne({ email: Ep_Email, type: 2 }).lean();
        if (dataEmpoyee) {
          Empoyee = dataEmpoyee;
        }
        else {
          dataEmpoyee = await Users.findOne({ phoneTK: Ep_Email, type: 2 }).lean();
          if (dataEmpoyee) {
            Empoyee = dataEmpoyee;
          }
          else {
            dataEmpoyee = await Users.findOne({ email: Ep_Email, type: 0 }).lean();
            if (dataEmpoyee) {
              Empoyee = dataEmpoyee;
            }
            else {
              dataEmpoyee = await Users.findOne({ phoneTK: Ep_Email, type: 0 }).lean();
              if (dataEmpoyee) {
                Empoyee = dataEmpoyee;
              }
            }
          }
        }
      }


      if (Company && Empoyee) {
        let conversationId = 0;
        let users = [];
        users.push(Company._id);
        users.push(Empoyee._id);
        conversationId = await FCreateNewConversation(Company._id, Empoyee._id)
        axios({
          method: "post",
          url: "http://210.245.108.202:9000/api/users/AddFriendAuto",
          data: {
            userId: Company._id,
            contactId: Empoyee._id,
          },
          headers: { "Content-Type": "multipart/form-data" }
        }).catch((e) => {
          console.log(e)
        });
        socket.emit("AcceptRequestAddFriend", Company._id, Empoyee._id)
        if (Type != 1) {
          SendNewNotificationX(Company._id, Empoyee._id, `UV ${Empoyee.userName || ""} đã ứng tuyển tin tuyển dụng của bạn. \n Họ tên: ${Empoyee.userName || ""} \nTỉnh thành: ${city}\nNgành nghề: ${career}`, "applying", Link, uscid)
        }
        console.log(Company._id, Empoyee._id, `UV ${Empoyee.userName || ""} đã ứng tuyển tin tuyển dụng của bạn. \n Họ tên: ${Empoyee.userName || ""} \nTỉnh thành: ${city}\nNgành nghề: ${career}`, "applying", Link, uscid)
      }

      return res.json({
        data: {
          result: true,
          message: "Gửi thông báo thành công",
        },
        error: null
      })
    }
    else {
      return res.send(createError(200, 'Thông tin truyền lên không hợp lệ'));
    }
  } catch (err) {
    console.log(err);
    if (err) return res.send(createError(200, err.message));
  }
};