import Conversation from "../../models/Conversation.js";
import axios from 'axios'
import { createError } from "../../utils/error.js";
import RequestContact from "../../models/RequestContact.js";
import UsersClassified from "../../models/UsersClassified.js";
import FirstMessageDay from "../../models/FirstMessageDay.js";
import Counter from "../../models/Counter.js";
import Contact from "../../models/Contact.js";
import * as nodemailer from 'nodemailer'
import { Messages, MessageQuote, MessagesDB, EmotionMessageDBDefault, FileSendDB, infoLink, InfoSupportDB, InfoLiveChat, LiveChatDB } from "../fModels/fMessage.js";
import { fInfoLink, fInfoFile, fEmotion, fMessageQuote, fInfoFile2 } from "../fModels/fMessages.js";
import { getLinkPreview } from "link-preview-js";
import io from 'socket.io-client';
import qs from 'qs';
import cron from 'node-cron'
import multer from 'multer';
import Birthday from "../../models/Birthday.js"
import User from "../../models/User.js";
import fs from 'fs'
import date from "date-and-time"
import e from "cors";
import { urlImgHost } from '../../utils/config.js'
import { downloadFile } from "../DownloadFile.js";
import { FCreateNewConversation } from "../Fconversation.js";
import { FGetListConversationIdStrange } from './conversation.js';
import request from 'request'

const socket = io.connect('http://43.239.223.142:3000', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});

import { ConvertToObject, ConvertToObjectQuote, ConvertToArrayObject, MarkUnreaderMessage, getRandomInt, localfile } from "../../services/message.service.js";

export const FLoadMessage = async (req) => {
  try {
    if (req.body && req.body.conversationId && (!isNaN(req.body.conversationId)) && Number(req.body.conversationId)) {
      let countMess = await Conversation.aggregate([
        { $match: { _id: Number(req.body.conversationId) } },
        { $project: { count: { $size: "$messageList" } } }
      ]);
      let listMess = Number(req.body.listMess) || 0;
      if (countMess && countMess.length && (countMess.length > 0) && countMess[0]._id) {
        let sizeListMess = countMess[0].count - 1;
        if (sizeListMess < 0) {
          sizeListMess = 0;
        }
        let start = sizeListMess - listMess - 15;
        if (start < 0) {
          start = 0;
        }
        let conversation = await Conversation.find({ _id: Number(req.body.conversationId) }, { messageList: { $slice: [start, 16] }, "memberList.favoriteMessage": 1, "memberList.memberId": 1 }).lean()

        if (conversation) {
          if (conversation.length > 0) {
            let ListMessFavour = [];
            if (req.body.adminId && (!isNaN(req.body.adminId))) {
              if (conversation[0].memberList && conversation[0].memberList.length && (conversation[0].memberList.length > 0) && (conversation[0].memberList.findIndex((e) => e.memberId == Number(req.body.adminId)) != -1)) {
                let memberInfor = conversation[0].memberList.find((e) => e.memberId == Number(req.body.adminId));
                if (memberInfor && memberInfor.memberId) {
                  ListMessFavour = memberInfor.favoriteMessage || [];
                }
              }
            }

            let ListMessFinal = [];
            let ListMes = conversation[0].messageList;
            for (let i = 0; i < ListMes.length; i++) {
              if (ListMes[i]._id && ListMes[i].senderId && ListMes[i].messageType) {
                let a = {};
                a.messageID = ListMes[i]._id;
                a.conversationID = Number(req.body.conversationId);
                a.displayMessage = ListMes[i].displayMessage || 0;
                a.senderID = ListMes[i].senderId;
                a.messageType = ListMes[i].messageType;
                a.message = ListMes[i].message || "";
                a.uscid = ListMes[i].uscid || "";
                a.isSecret = ListMes[i].isSecret || 0;
                if (ListMes[i].quoteMessage && (ListMes[i].quoteMessage.trim() != "")) {
                  let conversationTakeMessage = await Conversation.aggregate([
                    {
                      $match:
                      {
                        "messageList._id": ListMes[i].quoteMessage
                      }
                    },
                    {
                      $project: {
                        messageList: {
                          $slice: [
                            {
                              $filter: {
                                input: "$messageList",
                                as: "messagelist",
                                cond: {
                                  $eq: ["$$messagelist._id", ListMes[i].quoteMessage]
                                },
                              }
                            },
                            -1
                          ]
                        }
                      }
                    }
                  ])
                  if (conversationTakeMessage && conversationTakeMessage.length > 0 && conversationTakeMessage[0].messageList && conversationTakeMessage[0].messageList.length && (conversationTakeMessage[0].messageList.length > 0)) {
                    let message = conversationTakeMessage[0].messageList[0];
                    let senderData = await User.findOne({ _id: message.senderId }, { userName: 1 }).lean()
                    if (senderData && senderData.userName && message._id && message.senderId && message.createAt) {
                      a.quoteMessage = fMessageQuote(message._id, senderData.userName, message.senderId, message.messageType || "text", message.message, message.createAt)
                    }
                    else {
                      a.quoteMessage = null;
                    }
                  }
                  else {
                    a.quoteMessage = fMessageQuote(ListMes[i].quoteMessage, "", -1, "text", "", `${JSON.parse(JSON.stringify(new Date(ListMes[i].createAt.setHours(ListMes[i].createAt.getHours() + 7)))).replace("Z", "")}+07:00`)
                  }
                }
                else {
                  a.quoteMessage = null;
                }
                a.messageQuote = ListMes[i].messageQuote || "";
                a.createAt = `${JSON.parse(JSON.stringify(new Date(ListMes[i].createAt.setHours(ListMes[i].createAt.getHours() + 7)))).replace("Z", "")}+07:00`;
                a.isEdited = ListMes[i].isEdited || 0;
                if (ListMes[i].infoLink) {
                  a.infoLink = fInfoLink(ListMes[i]._id, ListMes[i].infoLink.title, ListMes[i].infoLink.description, ListMes[i].infoLink.linkHome, ListMes[i].infoLink.image, ListMes[i].infoLink.isNotification);
                }
                else {
                  a.infoLink = null;
                }
                if (ListMes[i].listFile && ListMes[i].listFile.length && (ListMes[i].listFile.length > 0)) {
                  let listFileFirst = [];
                  for (let j = 0; j < ListMes[i].listFile.length; j++) {
                    listFileFirst.push(
                      fInfoFile(
                        ListMes[i].listFile[j].messageType || "",
                        ListMes[i].listFile[j].nameFile || "",
                        ListMes[i].listFile[j].sizeFile || 0,
                        ListMes[i].listFile[j].height || 0,
                        ListMes[i].listFile[j].width || 0
                      ));
                  }
                  a.listFile = listFileFirst;
                }
                else {
                  a.listFile = [];
                }
                a.emotionMessage = [];
                if (ListMes[i].messageType == "sendCv") {
                  // console.log(ListMes[i])
                  for (let j = 0; j < ListMes[i].listFile.length; j++) {

                    if (ListMes[i].listFile[j].nameFile?.split(".")[ListMes[i].listFile[j].nameFile.split(".").length - 1] == "pdf") {
                      a.linkPdf = `https://ht.timviec365.vn:9002/uploads/${ListMes[i].listFile[j].nameFile}`;
                    }
                    else if (ListMes[i].listFile[j].nameFile?.split(".")[ListMes[i].listFile[j].nameFile.split(".").length - 1] == "png") {
                      a.linkPng = `https://ht.timviec365.vn:9002/uploads/${ListMes[i].listFile[j].nameFile}`;
                    }
                  }
                }
                if (ListMes[i].emotion) {
                  if (ListMes[i].emotion.Emotion1 && (String(ListMes[i].emotion.Emotion1).trim() != "")) {
                    a.emotionMessage.push(fEmotion(1, ListMes[i].emotion.Emotion1.split(","), `${urlImgHost()}Emotion/Emotion1.png`))
                  }
                  if (ListMes[i].emotion.Emotion2 && (String(ListMes[i].emotion.Emotion2).trim() != "")) {
                    a.emotionMessage.push(fEmotion(2, ListMes[i].emotion.Emotion2.split(","), `${urlImgHost()}Emotion/Emotion2.png`))
                  }
                  if (ListMes[i].emotion.Emotion3 && (String(ListMes[i].emotion.Emotion3).trim() != "")) {
                    a.emotionMessage.push(fEmotion(3, ListMes[i].emotion.Emotion3.split(","), `${urlImgHost()}Emotion/Emotion3.png`))
                  }
                  if (ListMes[i].emotion.Emotion4 && (String(ListMes[i].emotion.Emotion4).trim() != "")) {
                    a.emotionMessage.push(fEmotion(4, ListMes[i].emotion.Emotion4.split(","), `${urlImgHost()}Emotion/Emotion4.png`))
                  }
                  if (ListMes[i].emotion.Emotion5 && (String(ListMes[i].emotion.Emotion5).trim() != "")) {
                    a.emotionMessage.push(fEmotion(5, ListMes[i].emotion.Emotion5.split(","), `${urlImgHost()}Emotion/Emotion5.png`))
                  }
                  if (ListMes[i].emotion.Emotion6 && (String(ListMes[i].emotion.Emotion6).trim() != "")) {
                    a.emotionMessage.push(fEmotion(6, ListMes[i].emotion.Emotion6.split(","), `${urlImgHost()}Emotion/Emotion6.png`))
                  }
                  if (ListMes[i].emotion.Emotion7 && (String(ListMes[i].emotion.Emotion7).trim() != "")) {
                    a.emotionMessage.push(fEmotion(7, ListMes[i].emotion.Emotion7.split(","), `${urlImgHost()}Emotion/Emotion7.png`))
                  }
                  if (ListMes[i].emotion.Emotion8 && (String(ListMes[i].emotion.Emotion8).trim() != "")) {
                    a.emotionMessage.push(fEmotion(8, ListMes[i].emotion.Emotion8.split(","), `${urlImgHost()}Emotion/Emotion8.png`))
                  }
                }
                else {
                  a.emotion = ListMes[i].emotion || {};
                  a.emotionMessage = [];
                }
                if (ListMes[i].messageType == "sendProfile") {
                  if (!isNaN(ListMes[i].message)) {
                    let userData = await User.findOne({ _id: ListMes[i].message }, {
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
                    if (userData && userData.userName) {
                      let b = {};
                      b.iD365 = userData.id365;
                      b.idTimViec = userData.idTimViec;
                      b.type365 = userData.type365;
                      b.password = "";
                      b.phone = userData.phone;
                      // b.notificationPayoff= userData.notificationPayoff;
                      b.notificationPayoff = 1
                      // b.notificationCalendar = userData.notificationCalendar;
                      b.notificationCalendar = 1
                      // b.notificationReport = userData.notificationReport;
                      b.notificationReport = 1
                      // b.notificationOffer = userData.notificationOffer;
                      b.notificationOffer = 1
                      // b.notificationPersonnelChange = userData.notificationPersonnelChange;
                      b.notificationPersonnelChange = 1
                      // b.notificationRewardDiscipline = userData.notificationRewardDiscipline;
                      b.notificationRewardDiscipline = 1
                      // b.notificationNewPersonnel = userData.notificationNewPersonnel;
                      b.notificationNewPersonnel = 1
                      // b.notificationChangeProfile = userData.notificationChangeProfile;
                      b.notificationChangeProfile = 1
                      // b.notificationTransferAsset = userData.notificationTransferAsset;
                      b.notificationTransferAsset = 1
                      b.acceptMessStranger = userData.acceptMessStranger;
                      b.type_Pass = 0;
                      b.companyName = userData.companyName;
                      b.secretCode = "";
                      b.notificationMissMessage = 0;
                      b.notificationCommentFromTimViec = 0;
                      b.notificationCommentFromRaoNhanh = 0;
                      b.notificationTag = 0;
                      b.notificationSendCandidate = 0;
                      b.notificationChangeSalary = 0;
                      b.notificationAllocationRecall = 0;
                      b.notificationAcceptOffer = 0;
                      b.notificationDecilineOffer = 0;
                      b.notificationNTDPoint = 0;
                      b.notificationNTDExpiredPin = 0;
                      b.notificationNTDExpiredRecruit = 0;
                      b.fromWeb = userData.fromWeb;
                      b.notificationNTDApplying = 0;
                      b.userQr = null;
                      b.id = userData._id;
                      b.email = userData.email;
                      b.userName = userData.userName;
                      b.avatarUser = userData.avatarUser;
                      b.status = userData.status;
                      b.active = userData.active;
                      b.isOnline = userData.isOnline;
                      b.looker = userData.looker;
                      b.statusEmotion = userData.statusEmotion;
                      b.lastActive = userData.lastActive;

                      if (String(userData.avatarUser).trim != "") {
                        b.linkAvatar = `${urlImgHost()}avatarUser/${userData._id}/${userData.avatarUser}`;
                      }
                      else {
                        b.linkAvatar = `${urlImgHost()}avatar/${userData.userName[0]}_${getRandomInt(1, 4)}.png`
                      }
                      b.companyId = userData.companyId;

                      let status = await RequestContact.findOne({
                        $or: [
                          { userId: Number(req.body.adminId), contactId: userData._id },
                          { userId: userData._id, contactId: Number(req.body.adminId) }
                        ]
                      }).lean();
                      if (status) {
                        if (status.status == "accept") {
                          b.friendStatus = "friend";
                        }
                        else {
                          b.friendStatus = status.status;
                        }
                      }
                      else {
                        b.friendStatus = "none";
                      }
                      a.userProfile = b;
                    }
                    else {
                      a.userProfile = null;
                    }
                  }

                }
                else {
                  a.userProfile = null;
                }
                a.listTag = null;
                a.link = ListMes[i].infoLink?.linkHome;
                a.file = a.listFile;
                a.quote = null;
                a.profile = a.userProfile;
                a.deleteTime = ListMes[i].deleteTime;
                a.deleteType = ListMes[i].deleteType;
                a.deleteDate = String('0001-01-01T00:00:00.000+00:00');
                a.infoSupport = ListMes[i].infoSupport;
                a.liveChat = ListMes[i].liveChat;
                a.linkNotification = ListMes[i].infoLink?.linkHome;
                a.isClicked = 0;
                if (ListMes[i].notiClicked?.includes(Number(req.body.adminId))) {
                  a.isClicked = 1;
                }
                if (ListMessFavour && ListMessFavour.includes(ListMes[i]._id)) {
                  a.IsFavorite = 1;
                }
                else {
                  a.IsFavorite = 0;
                }
                let flagPushMessage = true;
                if (i > 0) {
                  if (ListMes[i - 1] && ListMes[i] && ListMes[i - 1].messageType && ListMes[i].messageType) {
                    if (ListMes[i - 1].messageType == "OfferReceive") {
                      if (ListMes[i].messageType == "link") {
                        flagPushMessage = false;
                      }
                    }
                    else if (ListMes[i - 1].messageType == "applying") {
                      if (ListMes[i].messageType == "link") {
                        flagPushMessage = false;
                      }
                    }
                  }
                }
                if (ListMes[i].infoSupport) {
                  if (ListMes[i].infoSupport.status) {
                    if (ListMes[i].infoSupport.status == 1) {
                      let a = "k add"
                    }
                    else {
                      if (flagPushMessage) {
                        ListMessFinal.push(a)
                      }
                    }
                  }
                  else {
                    if (flagPushMessage) {
                      ListMessFinal.push(a)
                    }
                  }
                }
                else {
                  if (flagPushMessage) {
                    ListMessFinal.push(a)
                  }
                }
              }
            }
            return ListMessFinal

          }
          else {
            return []
          }
        }
      }
      else {
        return []
      }
    }
    else {
      return []
    }
  }
  catch (e) {
    console.log("FLoadMessage", e);
    return []
  }
}



export const FSendMessage = async (req) => {
  try {
    if (req.body && req.body.ConversationID && (!isNaN(req.body.ConversationID)) && req.body.SenderID && (!isNaN(req.body.SenderID))) {
      // 783304 // Vũ Đức Nhân
      // if(req.body.Message.includes('Vũ Đức Nhân')){
      //     console.log('Chan spam ung vien ung tuyen')
      //     return true;
      // }
      let ConversationID = Number(req.body.ConversationID);
      let SenderID = Number(req.body.SenderID);
      let Message = req.body.Message ? String(req.body.Message) : "";
      let Quote = req.body.Quote ? String(req.body.Quote) : "";
      let Profile = req.body.Profile ? String(req.body.Profile) : "";
      let ListTag = req.body.ListTag ? String(req.body.ListTag) : "[]";
      let File = req.body.File ? String(req.body.File) : "";
      let ListMember = req.body.ListMember ? JSON.parse(req.body.ListMember) : [];
      let IsOnline = req.body.IsOnline ? String(req.body.IsOnline) : "";
      let conversationName = req.body.conversationName ? String(req.body.conversationName) : "";
      let isGroup = (req.body.isGroup && (!isNaN(req.body.isGroup))) ? Number(req.body.isGroup) : 0;
      let deleteTime = (req.body.deleteTime && (!isNaN(req.body.deleteTime))) ? Number(req.body.deleteTime) : 0;
      let deleteType = (req.body.deleteType && (!isNaN(req.body.deleteType))) ? Number(req.body.deleteType) : 0;
      let liveChat = req.body.liveChat ? String(req.body.liveChat) : null;
      let infoSupport = req.body.InfoSupport ? String(req.body.InfoSupport) : null;
      let uscid = req.body.uscid ? req.body.uscid : ''
      let isSecret = req.body.isSecret ? Number(req.body.isSecret) : 0
      if (req.body.MessageType && (req.body.File || req.body.Message || req.body.Quote)) {
        let MessageType = String(req.body.MessageType);
        let mess = {};
        mess.MessageID = "";
        if (req.body.MessageID && (req.body.MessageID.trim() != "")) {
          mess.MessageID = req.body.MessageID;
        }
        else {
          mess.MessageID = `${((new Date).getTime() * 10000) + 621355968000000000 + 8}_${SenderID}`;
        }
        mess.CreateAt = `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}+07:00`;
        mess.uscid = uscid
        mess.isSecret = isSecret
        mess.ConversationID = ConversationID;
        mess.SenderID = SenderID;
        mess.MessageType = MessageType;
        mess.Message = Message;
        mess.ListTag = ListTag;
        mess.DeleteTime = deleteTime;
        mess.DeleteType = deleteType;
        mess.DeleteDate = String('0001-01-01T00:00:00.000+00:00');
        mess.IsFavorite = 0;
        mess.linkNotification = req.body.link || req.body.Link || req.body.linkNotification || null

        // if (isGroup == 0) {
        //   console.log('test', ListMember)
        //   const receivedId = ListMember.find(member => member !== SenderID)
        //   const companyIdReceive = req.body.companyIdReceive ? Number(req.body.companyIdReceive) : 0
        //   const [listConvStrange, lastConvStrange] = await FGetListConversationIdStrange(receivedId, companyIdReceive)
        //   mess.strange = [
        //     {
        //       userId: receivedId,
        //       status: 1
        //     },
        //     {
        //       userId: SenderID,
        //       status: listConvStrange.includes(ConversationID) ? 0 : 1
        //     }
        //   ]
        // }
        if (!req.body.Quote || (String(req.body.Quote).trim() == "") || (String(req.body.Quote) == "null")) {
          mess.QuoteMessage = MessageQuote("", "", 0, "", "", `${JSON.parse(JSON.stringify(new Date())).replace("Z", "")}6769+07:00`);
        }
        else {
          mess.QuoteMessage = ConvertToObjectQuote(req.body.Quote);
          mess.QuoteMessage.SenderID = Number(mess.QuoteMessage.SenderID);
        }

        if (req.body.File && (String(req.body.File) != "null")) {
          mess.ListFile = ConvertToArrayObject(req.body.File);
          for (let i = 0; i < mess.ListFile.length; i++) {
            mess.ListFile[i].NameDownload = mess.ListFile[i].FullName.replace(/[ +!@#$%^&*]/g, '');
            mess.ListFile[i].FullName = mess.ListFile[i].FullName.replace(/[ +!@#$%^&*]/g, '');
            if ((!isNaN(mess.ListFile[i].Height))) {
              mess.ListFile[i].Height = Number(mess.ListFile[i].Height);
            }
            else {
              mess.ListFile[i].Height = 10;
            }

            if ((!isNaN(mess.ListFile[i].Width))) {
              mess.ListFile[i].Width = Number(mess.ListFile[i].Width);
            }
            else {
              mess.ListFile[i].Width = 10;
            };
            if (mess.ListFile[i].Width == 0 && mess.ListFile[i].TypeFile == 'sendPhoto') {
              const metadata = await sharp(`C:/Chat365/publish/wwwroot/uploads/${mess.ListFile[i].NameDownload}`).metadata();
              mess.ListFile[i].Height = metadata.height;
              mess.ListFile[i].Width = metadata.width;
            }
            if ((!isNaN(mess.ListFile[i].SizeFile))) {
              mess.ListFile[i].SizeFile = Number(mess.ListFile[i].SizeFile);
            }
            else {
              mess.ListFile[i].SizeFile = 10;
            };
            if (mess.ListFile[i].FullName == 'null') {
              mess.ListFile[i].FullName = mess.ListFile[i].NameDisplay;
            };
            // console.log("Obj file sau khi sua:0",mess.ListFile[i])
          };
          // console.log(mess.ListFile)
        }
        else {
          mess.ListFile = null;
        }

        if (req.body.Profile && (String(req.body.Profile) != "null")) {
          let obj = req.body.Profile;
          console.log(obj);
          mess.Message = String(obj.id);
          mess.UserProfile = {};
          mess.UserProfile.AcceptMessStranger = Number(obj.acceptMessStranger)
          mess.UserProfile.Active = 1
          mess.UserProfile.AvatarUser = obj.avatarUser;
          mess.UserProfile.CompanyId = Number(obj.companyId)
          mess.UserProfile.CompanyName = obj.companyName;
          mess.UserProfile.Email = obj.email;
          mess.UserProfile.FriendStatus = null;
          mess.UserProfile.FromWeb = obj.fromWeb;
          mess.UserProfile.ID = Number(obj.id)
          mess.UserProfile.ID365 = (!isNaN(obj.iD365)) ? Number(obj.iD365) : 0;
          mess.UserProfile.IDTimViec = Number(obj.idTimViec)
          mess.UserProfile.LastActive = `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}+07:00`;
          mess.UserProfile.LinkAvatar = obj.avatarUser;
          mess.UserProfile.Looker = 0;
          mess.UserProfile.NotificationAcceptOffer = 1;
          mess.UserProfile.NotificationAllocationRecall = 1;
          mess.UserProfile.NotificationCalendar = 1;
          mess.UserProfile.NotificationChangeProfile = 1;
          mess.UserProfile.NotificationChangeSalary = 1;
          mess.UserProfile.NotificationCommentFromRaoNhanh = 1;
          mess.UserProfile.NotificationCommentFromTimViec = 1;
          mess.UserProfile.NotificationDecilineOffer = 1;
          mess.UserProfile.NotificationMissMessage = 1;
          mess.UserProfile.NotificationNTDApplying = 0;
          mess.UserProfile.NotificationNTDExpiredPin = 1;
          mess.UserProfile.NotificationNTDExpiredRecruit = 1;
          mess.UserProfile.NotificationNTDPoint = 1;
          mess.UserProfile.NotificationNewPersonnel = 1;
          mess.UserProfile.NotificationOffer = 1;
          mess.UserProfile.NotificationPayoff = 1;
          mess.UserProfile.NotificationPersonnelChange = 1;
          mess.UserProfile.NotificationReport = 1;
          mess.UserProfile.NotificationRewardDiscipline = 1;
          mess.UserProfile.NotificationSendCandidate = 1;
          mess.UserProfile.NotificationTag = 1;
          mess.UserProfile.NotificationTransferAsset = 1;
          mess.UserProfile.Password = obj.password;
          mess.UserProfile.Phone = obj.phone;
          mess.UserProfile.Status = obj.status;
          mess.UserProfile.StatusEmotion = Number(obj.statusEmotion);
          mess.UserProfile.Type365 = Number(obj.type365);
          mess.UserProfile.Type_Pass = Number(obj.type_Pass);
          mess.UserProfile.UserName = obj.userName;
          mess.UserProfile.isOnline = Number(obj.isOnline);
          mess.UserProfile.secretCode = obj.secretCode;
          mess.UserProfile.userQr = obj.userQr;
        }
        else {
          mess.UserProfile = {};
          mess.UserProfile.AcceptMessStranger = 0
          mess.UserProfile.Active = 0
          mess.UserProfile.AvatarUser = null;
          mess.UserProfile.CompanyId = 0
          mess.UserProfile.CompanyName = null;
          mess.UserProfile.Email = null;
          mess.UserProfile.FriendStatus = null;
          mess.UserProfile.FromWeb = null;
          mess.UserProfile.ID = 0
          mess.UserProfile.ID365 = 0
          mess.UserProfile.IDTimViec = 0
          mess.UserProfile.LastActive = `${JSON.parse(JSON.stringify(new Date(new Date().setHours(new Date().getHours() + 7)))).replace("Z", "")}+07:00`;
          mess.UserProfile.LinkAvatar = null;
          mess.UserProfile.Looker = 0
          mess.UserProfile.NotificationAcceptOffer = 0;
          mess.UserProfile.NotificationAllocationRecall = 0;
          mess.UserProfile.NotificationCalendar = 0;
          mess.UserProfile.NotificationChangeProfile = 0;
          mess.UserProfile.NotificationChangeSalary = 0;
          mess.UserProfile.NotificationCommentFromRaoNhanh = 0;
          mess.UserProfile.NotificationCommentFromTimViec = 0;
          mess.UserProfile.NotificationDecilineOffer = 0;
          mess.UserProfile.NotificationMissMessage = 0;
          mess.UserProfile.NotificationNTDApplying = 0;
          mess.UserProfile.NotificationNTDExpiredPin = 0;
          mess.UserProfile.NotificationNTDExpiredRecruit = 0;
          mess.UserProfile.NotificationNTDPoint = 0;
          mess.UserProfile.NotificationNewPersonnel = 0;
          mess.UserProfile.NotificationOffer = 0;
          mess.UserProfile.NotificationPayoff = 0;
          mess.UserProfile.NotificationPersonnelChange = 0;
          mess.UserProfile.NotificationReport = 0;
          mess.UserProfile.NotificationRewardDiscipline = 0;
          mess.UserProfile.NotificationSendCandidate = 0;
          mess.UserProfile.NotificationTag = 0;
          mess.UserProfile.NotificationTransferAsset = 0;
          mess.UserProfile.Password = null;
          mess.UserProfile.Phone = null;
          mess.UserProfile.Status = null;
          mess.UserProfile.StatusEmotion = 0;
          mess.UserProfile.Type365 = 0;
          mess.UserProfile.Type_Pass = 0;
          mess.UserProfile.UserName = null;
          mess.UserProfile.isOnline = 0;
          mess.UserProfile.secretCode = null;
          mess.UserProfile.userQr = null;
        }

        if (mess.DeleteType == 0 && mess.DeleteTime > 0) {
          mess.DeleteDate = (new Date()).setSeconds(new Date().getSeconds() + Number(deleteTime));
        }

        // lấy id kèm mảng trạng thái online 
        let listMember = [];
        let isOnline = [];
        Conversation.findOne({ _id: ConversationID }, { "memberList.memberId": 1, "memberList.liveChat": 1, typeGroup: 1 })
          .then(async (conversation) => {
            // take data user 
            if (conversation && conversation.memberList) {
              for (let i = 0; i < conversation.memberList.length; i++) {
                listMember.push(conversation.memberList[i].memberId);
                isOnline.push(1);
              }
            }
            if (!listMember.find((e) => e == SenderID)) {
              return []
            }
            // live chat
            mess.liveChat = null;
            let typeSendLiveChat = "";
            if (liveChat) {
              mess.liveChat = null;
            }
            else if (conversation && conversation.memberList && (conversation.memberList.length > 0)) {
              let liveChatDB = conversation.memberList.find(e => e.memberId == SenderID);
              if (liveChatDB) {
                liveChatDB = liveChatDB.liveChat;
              }
              if (liveChatDB && liveChatDB.clientId) {  // người gửi là client 
                typeSendLiveChat = "ClientSend";
                listMember = listMember.filter(e => e != SenderID); // id tài khoản tư vấn viên 
                liveChatDB.clientName = liveChatDB.clientName ? liveChatDB.clientName : liveChatDB.clientId;
                mess.liveChat = InfoLiveChat(liveChatDB.clientId, liveChatDB.clientName,
                  `${urlImgHost}avatar/${String(liveChatDB.clientName).trim()[0].toUpperCase()}_${getRandomInt(1, 4)}.png`,
                  liveChatDB.fromWeb
                );
              }
              else {  // người gửi là tư vấn viên 
                if (conversation.typeGroup == "liveChat") {
                  liveChatDB = conversation.memberList.find(e => e.memberId != SenderID);
                  liveChatDB = liveChatDB.liveChat;
                  if (liveChatDB) {
                    typeSendLiveChat = "HostSend";
                    listMember = listMember.filter(e => e == SenderID);// id tài khoản tư vấn viên 
                    liveChatDB.clientName = liveChatDB.clientName ? liveChatDB.clientName : liveChatDB.clientId;
                    mess.liveChat = InfoLiveChat(liveChatDB.clientId, liveChatDB.clientName,
                      `${urlImgHost}avatar/${String(liveChatDB.clientName.trim()[0]).toUpperCase()}_${getRandomInt(1, 4)}.png`,
                      liveChatDB.fromWeb
                    );
                  }
                }
              }
            }

            // to main conversation group 
            let infoSupportDB = null; // tạo infor support để insert vào base 
            let LiveChatInfor = null;
            if (infoSupport) {
              let InfoSupport = ConvertToObject(infoSupport);

              if (InfoSupport.Title == "Tin nhắn nhỡ") {
                mess.InfoSupport = {};
                mess.InfoSupport.HaveConversation = 0;
                mess.InfoSupport.Message = `${InfoSupport.Message}${infoSupport.split(",")[2]}${infoSupport.split(",")[3]}${infoSupport.split(",")[4].replace('"', '').replace('}', '')}`;
                mess.InfoSupport.Status = Number(InfoSupport.Status);
                mess.InfoSupport.SupportId = mess.MessageID;
                mess.InfoSupport.Time = "0001-01-01T00:00:00";
                mess.InfoSupport.Title = InfoSupport.Title;
                mess.InfoSupport.UserId = Number(InfoSupport.UserId);
                mess.InfoSupport.userName = null;

                infoSupportDB = InfoSupportDB(mess.InfoSupport.Title, mess.InfoSupport.Message,
                  mess.InfoSupport.SupportId, mess.InfoSupport.HaveConversation,
                  mess.InfoSupport.UserId, mess.InfoSupport.Status, String('0001-01-01T00:00:00.000+00:00')
                );

                mess.LiveChat = {};
                mess.LiveChat.ClientAvatar = `${urlImgHost()}avatar/K_4.png`;
                mess.LiveChat.ClientId = infoSupport.split(",")[2].split(":")[1].trim();
                mess.LiveChat.ClientName = `Khách hàng ${mess.InfoSupport.Message.split(":")[2].split(",")[0].replace('tôi cần bạn hỗ trợ!', '').trim()}`
                mess.LiveChat.FromWeb = mess.InfoSupport.Message.split(":")[2].split(",")[0].replace('tôi cần bạn hỗ trợ!', '').trim().split(".")[0];
                LiveChatInfor = LiveChatDB(mess.LiveChat.ClientId, mess.LiveChat.ClientName, mess.LiveChat.FromWeb)
                // socket.emit("SendMessage", mess, [mess.LiveChat.ClientId]); // gui lai chinh no 
              }
              // crm 
              else if (InfoSupport.Status && (Number(InfoSupport.Status) == 3)) {
                mess.InfoSupport = {};
                mess.InfoSupport.HaveConversation = 0;
                mess.InfoSupport.Message = req.body.SmallTitile
                mess.InfoSupport.Status = 0;
                mess.InfoSupport.SupportId = mess.MessageID;
                mess.InfoSupport.Time = "0001-01-01T00:00:00";
                mess.InfoSupport.Title = InfoSupport.Title || "Hỗ trợ";
                mess.InfoSupport.UserId = 0;
                mess.InfoSupport.userName = null;

                infoSupportDB = InfoSupportDB(mess.InfoSupport.Title, mess.InfoSupport.Message,
                  mess.InfoSupport.SupportId, mess.InfoSupport.HaveConversation,
                  mess.InfoSupport.UserId, mess.InfoSupport.Status || 0, String('0001-01-01T00:00:00.000+00:00')
                );
                mess.LiveChat = {};
                mess.LiveChat.ClientAvatar = `${urlImgHost()}avatar/K_4.png`;
                mess.LiveChat.ClientId = InfoSupport.ClientId;
                mess.LiveChat.ClientName = InfoSupport.ClientName;
                mess.LiveChat.FromWeb = InfoSupport.FromWeb;
                LiveChatInfor = LiveChatDB(mess.LiveChat.ClientId, mess.LiveChat.ClientName, mess.LiveChat.FromWeb)
                // socket.emit("SendMessage", mess, [mess.LiveChat.ClientId]); // gui lai chinh no 
              }
              else {
                mess.InfoSupport = {};
                mess.InfoSupport.HaveConversation = 0;
                if (infoSupport.split(",")[4]) {
                  mess.InfoSupport.Message = `${InfoSupport.Message}${infoSupport.split(",")[2]}${infoSupport.split(",")[3]}${infoSupport.split(",")[4].replace('"', '').replace('}', '')}`;
                }
                else {
                  mess.InfoSupport.Message = `${InfoSupport.Message}${infoSupport.split(",")[2]}${infoSupport.split(",")[3]}`
                }
                mess.InfoSupport.Status = 0;
                mess.InfoSupport.SupportId = mess.MessageID;
                mess.InfoSupport.Time = "0001-01-01T00:00:00";
                mess.InfoSupport.Title = InfoSupport.Title || "Hỗ trợ";
                mess.InfoSupport.UserId = 0;
                mess.InfoSupport.userName = null;

                infoSupportDB = InfoSupportDB(mess.InfoSupport.Title, mess.InfoSupport.Message,
                  mess.InfoSupport.SupportId, mess.InfoSupport.HaveConversation,
                  mess.InfoSupport.UserId, mess.InfoSupport.Status || 0, String('0001-01-01T00:00:00.000+00:00')
                );

                mess.LiveChat = {};
                mess.LiveChat.ClientAvatar = `${urlImgHost()}avatar/K_4.png`;
                mess.LiveChat.ClientId = infoSupport.split(",")[2].split(":")[1].trim();
                mess.LiveChat.ClientName = `Khách hàng ${mess.InfoSupport.Message.split(":")[2].split(",")[0].replace('tôi cần bạn hỗ trợ!', '').trim()}`
                mess.LiveChat.FromWeb = mess.InfoSupport.Message.split(":")[2].split(",")[0].replace('tôi cần bạn hỗ trợ!', '').trim().split(".")[0];
                LiveChatInfor = LiveChatDB(mess.LiveChat.ClientId, mess.LiveChat.ClientName, mess.LiveChat.FromWeb)
                // socket.emit("SendMessage", mess, [mess.LiveChat.ClientId]); // gui lai chinh no 
              }

            };

            // to single conv live chat
            if (mess.liveChat != null) {
              // config cho giống live chat render 
              mess.EmotionMessage = null;
              mess.File = mess.ListFile;
              mess.InfoLink = null;
              mess.Profile = null;
              mess.InfoSupport = null;
              mess.IsClicked = 0;
              mess.IsEdited = 0;
              mess.Link = null;
              mess.LinkNotification = null;
              mess.Quote = mess.QuoteMessage;
              mess.SenderName = "Hỗ trợ khách hàng";
              mess.LiveChat = mess.liveChat;
              let listDevices = [];
              listDevices.push(mess.liveChat.ClientId);
              let currentWeb = mess.liveChat.FromWeb;
              if (typeSendLiveChat == "HostSend") {
                mess.LiveChat = null;
                mess.liveChat = null;
              }
              // sendNotificationToTimViec(mess, conversationName, mess.ConversationID, listMember, isOnline, isGroup, true);
              if (MessageType != "link") {
                // socket.emit("SendMessage", mess, listMember, listDevices, "SuppportOtherWeb", currentWeb);

                if (MessageType == "sendFile" || MessageType == "sendPhoto" || MessageType == "sendVoice") {
                  let findSend = [];
                  for (let i = 0; i < mess.ListFile.length; i++) {
                    findSend.push(FileSendDB((!isNaN(mess.ListFile[i].SizeFile)) ? Number(mess.ListFile[i].SizeFile) : 100, mess.ListFile[i].FullName ? String(mess.ListFile[i].FullName) : String(mess.ListFile[i].NameDisplay), Number(mess.ListFile[i].Height), Number(mess.ListFile[i].Width)))
                  };
                  Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                    if (counter && counter.length > 0 && counter[0].countID) {
                      const filter = { name: "MessageId" };
                      const update = { countID: counter[0].countID + 1 };
                      await Counter.updateOne(filter, update);
                      Conversation.updateOne({ _id: ConversationID }, { $set: { timeLastMessage: new Date(mess.CreateAt) } }).catch((e) => (console.log(e)));
                      if (typeSendLiveChat == "ClientSend") {
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType,
                              mess.Message, mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0, infoLink(null, null, null, null, 0), findSend, EmotionMessageDBDefault(),
                              mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB,
                              LiveChatDB(mess.liveChat.ClientId, mess.liveChat.ClientName, mess.liveChat.FromWeb),
                              [])
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                      else {
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType,
                              mess.Message, mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0, infoLink(null, null, null, null, 0), findSend, EmotionMessageDBDefault(),
                              mess.DeleteTime, mess.DeleteType, mess.DeleteDate, null, null, [])
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                    }
                  }).catch(function (err) {
                    console.log(err);
                  });
                }
                else if (MessageType == "map") {
                  let z = mess.Message.split(",");
                  let link = `https://www.google.com/maps/search/${z[0].trim()},${z[1].trim()}/${z[0].trim()},${z[1].trim()},10z?hl=vi`;
                  mess.InfoLink = {};
                  mess.InfoLink.HaveImage = "False";
                  let index = link.indexOf("/", 9);
                  if (index != -1) {
                    mess.InfoLink.LinkHome = link.slice(0, index);
                  }
                  else {
                    mess.InfoLink.LinkHome = link;
                  }
                  axios.get(link).then((doc) => {
                    if (doc && doc.data) {
                      mess.InfoLink.Title = String(doc.data).split("<title>")[1].split("</title>")[0].trim() || "Không tìm thấy thông tin website";
                      mess.InfoLink.Description = null;
                      let Image = String(doc.data).split(`property="og:image`)[0].replace(`"`, '');
                      mess.InfoLink.Image = Image.split(`<meta content=`)[Image.split(`<meta content=`).length - 1].replace('"', ``).replace('"', ``);
                      mess.InfoLink.Image = String(mess.InfoLink.Image).replace('amp;', '').replace('amp;', '').replace('amp;', '').replace('amp;', '').replace('amp;', '').replace('amp;', '').trim();
                      if (mess.InfoLink.Image) {
                        mess.InfoLink.HaveImage = "True";
                      }
                      mess.InfoLink.MessageID = null;
                      mess.InfoLink.TypeLink = null;

                      // gửi lại link bằng socket 
                      // socket.emit("SendMessage", mess, listMember, listDevices, "SuppportOtherWeb", currentWeb);
                      // thêm dữ liệu vào base
                      Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {// insert 1 tin nhắn link nữa vào base 
                        if (counter && counter.length > 0 && counter[0].countID) {
                          const filter = { name: "MessageId" };
                          const update = { countID: counter[0].countID + 1 };
                          await Counter.updateOne(filter, update);
                          if (typeSendLiveChat == "ClientSend") {
                            Conversation.updateOne({ _id: ConversationID }, {
                              $push: {
                                messageList: MessagesDB(
                                  mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                  mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                  infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                  mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB,
                                  LiveChatDB(mess.liveChat.ClientId, mess.liveChat.ClientName, mess.liveChat.FromWeb),
                                  [])
                              },
                              $set: { timeLastMessage: new Date(mess.CreateAt) }
                            }).catch(function (err) {
                              console.log(err);
                            });
                          }
                          else {
                            Conversation.updateOne({ _id: ConversationID }, {
                              $push: {
                                messageList: MessagesDB(
                                  mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                  mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                  infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                  mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, null, null, [])
                              },
                              $set: { timeLastMessage: new Date(mess.CreateAt) }
                            }).catch(function (err) {
                              console.log(err);
                            });
                          }
                        }
                      }).catch(function (err) {
                        console.log(err);
                      });
                    }
                  }).catch((e) => {
                    console.log(e)
                  })
                }
                else {

                  Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                    if (counter && counter.length > 0 && counter[0].countID) {
                      const filter = { name: "MessageId" };
                      const update = { countID: counter[0].countID + 1 };
                      await Counter.updateOne(filter, update);
                      if (typeSendLiveChat == "ClientSend") {
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, mess.Message,
                              mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0, infoLink(null, null, null, null, 0),
                              mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB,
                              LiveChatDB(mess.liveChat.ClientId, mess.liveChat.ClientName, mess.liveChat.FromWeb),
                              [])
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                      else {
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, mess.Message,
                              mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0, infoLink(null, null, null, null, 0),
                              mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, null, null, [])
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                    }
                  }).catch(function (err) {
                    console.log(err);
                  });
                }
              }

              if ((MessageType == "link") || (MessageType == "text")) {
                if (MessageType == "link") { // gửi socket 2 lần, lưu vào base 1 tin nhắn 
                  // socket.emit("SendMessage", mess, listMember, listDevices, "SuppportOtherWeb", currentWeb);
                  mess.InfoLink = {};
                  mess.InfoLink.HaveImage = "False";
                  if (String(mess.Message)[String(mess.Message).length - 1] == "/") {
                    mess.Message = String(mess.Message).slice(0, String(mess.Message).length - 1)
                  };
                  mess.InfoLink.LinkHome = mess.Message;

                  let doc = await getLinkPreview(
                    `${mess.Message}`
                  );
                  if (doc) {
                    mess.InfoLink.Title = doc.title || "Không tìm thấy thông tin website";
                    mess.InfoLink.Description = doc.description || null;
                    mess.InfoLink.Image = (doc.images.length > 0) ? doc.images[0] : null;
                    if (mess.InfoLink.Image) {
                      mess.InfoLink.HaveImage = "True";
                    }
                    mess.InfoLink.MessageID = null;
                    mess.InfoLink.TypeLink = null;
                    mess.InfoLink.IsNotification = 0;
                  }
                  else {
                    mess.InfoLink.Title = "Không tìm thấy thông tin website";
                    mess.InfoLink.Description = null;
                    mess.InfoLink.Image = null;
                    mess.InfoLink.MessageID = null;
                    mess.InfoLink.TypeLink = null;
                    mess.InfoLink.IsNotification = 0;
                  }
                  // socket.emit("SendMessage", mess, listMember, listDevices, "SuppportOtherWeb", currentWeb);
                  Conversation.updateOne({ _id: ConversationID }, { $set: { timeLastMessage: new Date(mess.CreateAt) } }).catch((e) => (console.log(e)));
                  // insert link to base 
                  Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                    if (counter && counter.length > 0 && counter[0].countID) {
                      const filter = { name: "MessageId" };
                      const update = { countID: counter[0].countID + 1 };
                      await Counter.updateOne(filter, update);
                      if (typeSendLiveChat == "ClientSend") {
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, mess.Message,
                              mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                              infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                              mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB,
                              LiveChatDB(mess.liveChat.ClientId, mess.liveChat.ClientName, mess.liveChat.FromWeb),
                              [])
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                      else {
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, mess.Message,
                              mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                              infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                              mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, null, null, [])
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                    }
                  }).catch(function (err) {
                    console.log(err);
                  });
                  MarkUnreaderMessage(ConversationID, SenderID, listMember);
                }
                else { // text chứa link; bắn 2 lần socket và lưu 2 tin nhắn 
                  mess.InfoLink = {};
                  mess.InfoLink.HaveImage = "False";
                  let urlCheck = new RegExp("[a-zA-Z\d]+://(\w+:\w+@)?([a-zA-Z\d.-]+\.[A-Za-z]{2,4})(:\d+)?(/.*)?")
                  if (urlCheck.test(mess.Message)) {
                    let link = mess.Message.slice(mess.Message.indexOf('http'), mess.Message.length);
                    getLinkPreview(
                      `${link}`
                    ).then((doc) => {
                      if (doc) {

                        mess.InfoLink.LinkHome = doc.url;
                        mess.InfoLink.Title = doc.title || "Không tìm thấy thông tin website";
                        mess.InfoLink.Description = doc.description || null;
                        mess.InfoLink.Image = (doc.images.length > 0) ? doc.images[0] : null;
                        if (mess.InfoLink.Image) {
                          mess.InfoLink.HaveImage = "True";
                        }
                        mess.InfoLink.MessageID = null;
                        mess.InfoLink.TypeLink = null;
                        mess.InfoLink.IsNotification = 0;
                        // bắn trc 1 socket cho bên app render 
                        mess.Message = doc.url;
                        mess.MessageType = "link";
                        mess.MessageID = `${((new Date).getTime() * 10000) + 621355968000000000 + 8}_${SenderID}`;
                        // socket.emit("SendMessage", mess, listMember, listDevices, "SuppportOtherWeb", currentWeb);
                        Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {// insert 1 tin nhắn link nữa vào base 
                          if (counter && counter.length > 0 && counter[0].countID) {
                            const filter = { name: "MessageId" };
                            const update = { countID: counter[0].countID + 1 };
                            await Counter.updateOne(filter, update);
                            if (typeSendLiveChat == "ClientSend") {
                              Conversation.updateOne({ _id: ConversationID }, {
                                $push: {
                                  messageList: MessagesDB(
                                    mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                    mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                    infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                    mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate,
                                    infoSupportDB,
                                    LiveChatDB(mess.liveChat.ClientId, mess.liveChat.ClientName, mess.liveChat.FromWeb),
                                    [])
                                },
                                $set: { timeLastMessage: new Date(mess.CreateAt) }
                              }).catch(function (err) {
                                console.log(err);
                              });
                            } else {
                              Conversation.updateOne({ _id: ConversationID }, {
                                $push: {
                                  messageList: MessagesDB(
                                    mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                    mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                    infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                    mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, null, null, [])
                                },
                                $set: { timeLastMessage: new Date(mess.CreateAt) }
                              }).catch(function (err) {
                                console.log(err);
                              });
                            }
                          }
                        }).catch(function (err) {
                          console.log(err);
                        });
                        MarkUnreaderMessage(ConversationID, SenderID, listMember);
                      }
                    }).catch((e) => {
                      mess.InfoLink.Title = "Không tìm thấy thông tin website";
                      mess.InfoLink.Description = null;
                      mess.InfoLink.Image = null;
                      mess.InfoLink.MessageID = null;
                      mess.InfoLink.TypeLink = null;
                      mess.InfoLink.LinkHome = link.trim();
                      mess.InfoLink.IsNotification = 0;
                      // bắn trc 1 socket cho bên app render
                      mess.Message = link.trim();
                      mess.MessageType = "link";
                      mess.MessageID = `${((new Date).getTime() * 10000) + 621355968000000000 + 8}_${SenderID}`;
                      // socket.emit("SendMessage", mess, listMember, listDevices, "SuppportOtherWeb", currentWeb);
                      Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {// insert 1 tin nhắn link nữa vào base 
                        if (counter && counter.length > 0 && counter[0].countID) {
                          const filter = { name: "MessageId" };
                          const update = { countID: counter[0].countID + 1 };
                          await Counter.updateOne(filter, update);
                          if (typeSendLiveChat == "ClientSend") {
                            Conversation.updateOne({ _id: ConversationID }, {
                              $push: {
                                messageList: MessagesDB(
                                  mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                  mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                  infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                  mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB,
                                  LiveChatDB(mess.liveChat.ClientId, mess.liveChat.ClientName, mess.liveChat.FromWeb),
                                  [])
                              },
                              $set: { timeLastMessage: new Date(mess.CreateAt) }
                            }).catch(function (err) {
                              console.log(err);
                            });
                          }
                          else {
                            Conversation.updateOne({ _id: ConversationID }, {
                              $push: {
                                messageList: MessagesDB(
                                  mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                  mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                  infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                  mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, null, null, [])
                              },
                              $set: { timeLastMessage: new Date(mess.CreateAt) }
                            }).catch(function (err) {
                              console.log(err);
                            });
                          }
                        }
                      }).catch(function (err) {
                        console.log(err);
                      });
                      MarkUnreaderMessage(ConversationID, SenderID, listMember);
                    });
                  }
                }
              }
              // đánh dấu tin nhắn chưa đọc 
              MarkUnreaderMessage(ConversationID, SenderID, listMember);
            }
            else {
              // console.log("send message normaly")
              if (MessageType != "link") {

                if (req.body.from && (req.body.from == "Chat Winform")) {
                  if (MessageType == "sendFile" || MessageType == "sendPhoto") {
                    console.log("k ban socket vi api upload file da co")
                  }
                  else {
                    if (MessageType == "OfferReceive" || MessageType == "applying") {
                      mess.link = req.body.Link;
                    };
                    socket.emit("SendMessage", mess, listMember);
                  }
                }
                else {
                  if (MessageType == "OfferReceive" || MessageType == "applying") {
                    mess.link = req.body.Link;
                  }
                  socket.emit("SendMessage", mess, listMember);
                }

                if (MessageType == "sendFile" || MessageType == "sendPhoto" || MessageType == "sendVoice" || MessageType == "sendCv") {
                  // console.log('Send Mess File:', req.body.File)
                  let findSend = [];
                  for (let i = 0; i < mess.ListFile.length; i++) {
                    findSend.push(FileSendDB((!isNaN(mess.ListFile[i].SizeFile)) ? Number(mess.ListFile[i].SizeFile) : 100, mess.ListFile[i].FullName ? String(mess.ListFile[i].FullName) : String(mess.ListFile[i].NameDisplay), Number(mess.ListFile[i].Height), Number(mess.ListFile[i].Width)))
                  };
                  Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                    if (counter && counter.length > 0 && counter[0].countID) {
                      const filter = { name: "MessageId" };
                      const update = { countID: counter[0].countID + 1 };
                      await Counter.updateOne(filter, update);
                      Conversation.updateOne({ _id: ConversationID }, {
                        $push: {
                          messageList: MessagesDB(
                            mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType,
                            mess.Message, mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0, infoLink(null, null, null, null, 0), findSend, EmotionMessageDBDefault(),
                            mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [], null, uscid, isSecret)
                        },
                        $set: { timeLastMessage: new Date(mess.CreateAt) }
                      }).catch(function (err) {
                        console.log(err);
                      });
                    }
                  }).catch(function (err) {
                    console.log(err);
                  });
                }
                else if (MessageType == "map") {
                  let z = mess.Message.split(",");
                  let link = `https://www.google.com/maps/search/${z[0].trim()},${z[1].trim()}/${z[0].trim()},${z[1].trim()},10z?hl=vi`;
                  mess.InfoLink = {};
                  mess.InfoLink.HaveImage = "False";
                  let index = link.indexOf("/", 9);
                  if (index != -1) {
                    mess.InfoLink.LinkHome = link.slice(0, index);
                  }
                  else {
                    mess.InfoLink.LinkHome = link;
                  }
                  axios.get(link).then((doc) => {
                    if (doc && doc.data) {
                      mess.InfoLink.Title = String(doc.data).split("<title>")[1].split("</title>")[0].trim() || "Không tìm thấy thông tin website";
                      mess.InfoLink.Description = null;
                      let Image = String(doc.data).split(`property="og:image`)[0].replace(`"`, '');
                      mess.InfoLink.Image = Image.split(`<meta content=`)[Image.split(`<meta content=`).length - 1].replace('"', ``).replace('"', ``);
                      mess.InfoLink.Image = String(mess.InfoLink.Image).replace('amp;', '').replace('amp;', '').replace('amp;', '').replace('amp;', '').replace('amp;', '').replace('amp;', '').trim();
                      if (mess.InfoLink.Image) {
                        mess.InfoLink.HaveImage = "True";
                      }
                      mess.InfoLink.MessageID = null;
                      mess.InfoLink.TypeLink = null;
                      socket.emit("SendMessage", mess, listMember);
                      // thêm dữ liệu vào base
                      Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {// insert 1 tin nhắn link nữa vào base 
                        if (counter && counter.length > 0 && counter[0].countID) {
                          const filter = { name: "MessageId" };
                          const update = { countID: counter[0].countID + 1 };
                          await Counter.updateOne(filter, update);
                          Conversation.updateOne({ _id: ConversationID }, {
                            $push: {
                              messageList: MessagesDB(
                                mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [], null, uscid)
                            },
                            $set: { timeLastMessage: new Date(mess.CreateAt) }
                          }).catch(function (err) {
                            console.log(err);
                          });
                        }
                      }).catch(function (err) {
                        console.log(err);
                      });
                    }
                  }).catch((e) => {
                    console.log(e)
                  })
                }
                else if (MessageType == "OfferReceive" || MessageType == "applying") {
                  console.log('xcv', uscid)
                  console.log('xcv', req.body) // 783304 // Vũ Đức Nhân
                  if (req.body.Message.includes('Vũ Đức Nhân')) {
                    console.log('Chan spam ung vien ung tuye')
                    return true;
                  }
                  Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                    if (counter && counter.length > 0 && counter[0].countID) {
                      const filter = { name: "MessageId" };
                      const update = { countID: counter[0].countID + 1 };
                      await Counter.updateOne(filter, update);
                      Conversation.updateOne({ _id: ConversationID }, {
                        $push: {
                          messageList: MessagesDB(
                            mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, Message,
                            mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0, infoLink(null, null, req.body.Link, null, 0),
                            mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [], null, uscid)
                        },
                        $set: { timeLastMessage: new Date(mess.CreateAt) }
                      }).catch(function (err) {
                        console.log(err);
                      });

                    }
                  }).catch(function (err) {
                    console.log(err);
                  });
                }
                else {
                  Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                    if (counter && counter.length > 0 && counter[0].countID) {
                      const filter = { name: "MessageId" };
                      const update = { countID: counter[0].countID + 1 };
                      await Counter.updateOne(filter, update);
                      Conversation.updateOne({ _id: ConversationID }, {
                        $push: {
                          messageList: MessagesDB(
                            mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, Message,
                            mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0, infoLink(null, null, null, null, 0),
                            mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [], null, uscid)
                        },
                        $set: { timeLastMessage: new Date(mess.CreateAt) }
                      }).catch(function (err) {
                        console.log(err);
                      });

                    }
                  }).catch(function (err) {
                    console.log(err);
                  });
                }
              }
              if ((MessageType == "link") || (MessageType == "text")) {
                if (MessageType == "link") { // gửi socket 2 lần, lưu vào base 1 tin nhắn 
                  socket.emit("SendMessage", mess, listMember);
                  mess.InfoLink = {};
                  mess.InfoLink.HaveImage = "False";
                  if (String(mess.Message)[String(mess.Message).length - 1] == "/") {
                    mess.Message = String(mess.Message).slice(0, String(mess.Message).length - 1)
                  };
                  mess.InfoLink.LinkHome = mess.Message;

                  getLinkPreview(
                    `${mess.Message}`
                  ).then((doc) => {
                    if (doc) {
                      mess.InfoLink.Title = doc.title || "Không tìm thấy thông tin website";
                      mess.InfoLink.Description = doc.description || null;
                      mess.InfoLink.Image = (doc.images && (doc.images.length > 0)) ? doc.images[0] : null;
                      if (mess.InfoLink.Image) {
                        mess.InfoLink.HaveImage = "True";
                      }
                      mess.InfoLink.MessageID = null;
                      mess.InfoLink.TypeLink = null;
                      mess.InfoLink.IsNotification = 0;
                    }
                    else {
                      mess.InfoLink.Title = "Không tìm thấy thông tin website";
                      mess.InfoLink.Description = null;
                      mess.InfoLink.Image = null;
                      mess.InfoLink.MessageID = null;
                      mess.InfoLink.TypeLink = null;
                      mess.InfoLink.IsNotification = 0;
                    }
                    socket.emit("SendMessage", mess, listMember);
                    // insert link to base 
                    Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                      if (counter && counter.length > 0 && counter[0].countID) {
                        const filter = { name: "MessageId" };
                        const update = { countID: counter[0].countID + 1 };
                        await Counter.updateOne(filter, update);
                        console.log("Data message Insert Link", infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0))
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, mess.Message,
                              mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                              infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                              mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [],)
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                    }).catch(function (err) {
                      console.log(err);
                    });
                    MarkUnreaderMessage(ConversationID, SenderID, listMember);
                  }).catch((e) => {
                    mess.InfoLink.Title = "Không tìm thấy thông tin website";
                    mess.InfoLink.Description = null;
                    mess.InfoLink.Image = null;
                    mess.InfoLink.MessageID = null;
                    mess.InfoLink.TypeLink = null;
                    mess.InfoLink.IsNotification = 0;
                    socket.emit("SendMessage", mess, listMember);
                    // insert link to base 
                    Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {
                      if (counter && counter.length > 0 && counter[0].countID) {
                        const filter = { name: "MessageId" };
                        const update = { countID: counter[0].countID + 1 };
                        await Counter.updateOne(filter, update);
                        console.log("Data message Insert Link", infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0))
                        Conversation.updateOne({ _id: ConversationID }, {
                          $push: {
                            messageList: MessagesDB(
                              mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, MessageType, mess.Message,
                              mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                              infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                              mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [], null, uscid)
                          },
                          $set: { timeLastMessage: new Date(mess.CreateAt) }
                        }).catch(function (err) {
                          console.log(err);
                        });
                      }
                    }).catch(function (err) {
                      console.log(err);
                    });
                    MarkUnreaderMessage(ConversationID, SenderID, listMember);
                  })

                }
                else { // text chứa link; bắn 2 lần socket và lưu 2 tin nhắn 
                  mess.InfoLink = {};
                  mess.InfoLink.HaveImage = "False";
                  let urlCheck = new RegExp("[a-zA-Z\d]+://(\w+:\w+@)?([a-zA-Z\d.-]+\.[A-Za-z]{2,4})(:\d+)?(/.*)?")
                  if (urlCheck.test(mess.Message)) {
                    let link = mess.Message.slice(mess.Message.indexOf('http'), mess.Message.length);
                    getLinkPreview(
                      `${link}`
                    ).then((doc) => {
                      if (doc) {
                        mess.InfoLink.LinkHome = doc.url;
                        mess.InfoLink.Title = doc.title || "Không tìm thấy thông tin website";
                        mess.InfoLink.Description = doc.description || null;
                        mess.InfoLink.Image = (doc.images.length > 0) ? doc.images[0] : null;
                        if (mess.InfoLink.Image) {
                          mess.InfoLink.HaveImage = "True";
                        }
                        mess.InfoLink.MessageID = null;
                        mess.InfoLink.TypeLink = null;
                        mess.InfoLink.IsNotification = 0;
                        // bắn trc 1 socket cho bên app render 
                        mess.Message = doc.url;
                        mess.MessageType = "link";
                        mess.MessageID = `${((new Date).getTime() * 10000) + 621355968000000001 + 8}_${SenderID}`;
                        // socket.emit("SendMessage", mess, listMember);
                        Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {// insert 1 tin nhắn link nữa vào base 
                          if (counter && counter.length > 0 && counter[0].countID) {
                            const filter = { name: "MessageId" };
                            const update = { countID: counter[0].countID + 1 };
                            await Counter.updateOne(filter, update);

                            Conversation.updateOne({ _id: ConversationID }, {
                              $push: {
                                messageList: MessagesDB(
                                  mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                  mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                  infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                  mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [], null, uscid)
                              },
                              $set: { timeLastMessage: new Date(mess.CreateAt) }
                            }).catch(function (err) {
                              console.log(err);
                            });
                          }
                        }).catch(function (err) {
                          console.log(err);
                        });
                        MarkUnreaderMessage(ConversationID, SenderID, listMember);
                      }
                    }).catch((e) => {
                      mess.InfoLink.Title = "Không tìm thấy thông tin website";
                      mess.InfoLink.Description = null;
                      mess.InfoLink.Image = null;
                      mess.InfoLink.MessageID = null;
                      mess.InfoLink.TypeLink = null;
                      mess.InfoLink.LinkHome = link.trim();
                      mess.InfoLink.IsNotification = 0;
                      // bắn trc 1 socket cho bên app render
                      mess.Message = link.trim();
                      mess.MessageType = "link";
                      mess.MessageID = `${((new Date).getTime() * 10000) + 621355968000000000 + 8}_${SenderID}`;
                      // socket.emit("SendMessage", mess, listMember);
                      Counter.find({ name: "MessageId" }, { countID: 1 }).then(async (counter) => {// insert 1 tin nhắn link nữa vào base 
                        if (counter && counter.length > 0 && counter[0].countID) {
                          const filter = { name: "MessageId" };
                          const update = { countID: counter[0].countID + 1 };
                          await Counter.updateOne(filter, update);

                          Conversation.updateOne({ _id: ConversationID }, {
                            $push: {
                              messageList: MessagesDB(
                                mess.MessageID, Number(counter[0].countID) + 1, mess.SenderID, mess.MessageType, mess.Message,
                                mess.QuoteMessage.MessageID, mess.QuoteMessage.Message, mess.CreateAt, 0,
                                infoLink(mess.InfoLink.Title, mess.InfoLink.Description, mess.InfoLink.LinkHome, mess.InfoLink.Image, 0),
                                mess.ListFile, EmotionMessageDBDefault(), mess.DeleteTime, mess.DeleteType, mess.DeleteDate, infoSupportDB, LiveChatInfor, [], null, uscid)
                            },
                            $set: { timeLastMessage: new Date(mess.CreateAt) }
                          }).catch(function (err) {
                            console.log(err);
                          });
                        }
                      }).catch(function (err) {
                        console.log(err);
                      });
                      MarkUnreaderMessage(ConversationID, SenderID, listMember);
                    });
                  }
                }
              }
              // if (MessageType != "OfferReceive") {
              //   if (MessageType != "applying") {
              //   }
              // }
              // đánh dấu tin nhắn chưa đọc 
              MarkUnreaderMessage(ConversationID, SenderID, listMember);
            }

            let listUserOffline = [];
            User.find({ _id: { $in: listMember } }, { isOnline: 1, userName: 1 }).then((listUser) => {
              if (listUser && listUser.length) {
                for (let i = 0; i < listMember.length; i++) {
                  let a = listUser.find((e) => e._id == listMember[i]);
                  if (a) {
                    if (a.isOnline == 0) {
                      listUserOffline.push(listMember[i]);
                    }
                  }
                };
                if (listUserOffline.length) {
                  if (req.body.MessageType == "text") {
                    axios({
                      method: "post",
                      url: "http://43.239.223.157:9001/api/V2/Notification/SendNotificationApp",
                      data: {
                        IdReceiver: JSON.stringify(listUserOffline),
                        conversationId: ConversationID,
                        sendername: listUser.find((e) => e._id == mess.SenderID) ? listUser.find((e) => e._id == mess.SenderID).userName : "",
                        ava: 'a',
                        mess: mess.Message,
                        type: 'text',
                        idSender: mess.SenderID,
                        mask: 1
                      },
                      headers: { "Content-Type": "multipart/form-data" }
                    }).catch((e) => {
                      console.log(e)
                    })
                  }
                  else if (req.body.MessageType == "map") {
                    axios({
                      method: "post",
                      url: "http://43.239.223.157:9001/api/V2/Notification/SendNotificationApp",
                      data: {
                        IdReceiver: JSON.stringify(listUserOffline),
                        conversationId: ConversationID,
                        sendername: listUser.find((e) => e._id == mess.SenderID) ? listUser.find((e) => e._id == mess.SenderID).userName : "",
                        ava: 'a',
                        mess: 'Bạn đã nhận được 1 vị trí ',
                        type: 'text',
                        idSender: mess.SenderID,
                        mask: 1
                      },
                      headers: { "Content-Type": "multipart/form-data" }
                    }).catch((e) => {
                      console.log(e)
                    })
                  }
                  else if (req.body.MessageType == "sendProfile") {
                    axios({
                      method: "post",
                      url: "http://43.239.223.157:9001/api/V2/Notification/SendNotificationApp",
                      data: {
                        IdReceiver: JSON.stringify(listUserOffline),
                        conversationId: ConversationID,
                        sendername: listUser.find((e) => e._id == mess.SenderID) ? listUser.find((e) => e._id == mess.SenderID).userName : "",
                        ava: 'a',
                        mess: 'Bạn đã nhận được 1 thẻ liên hệ',
                        type: 'text',
                        idSender: mess.SenderID,
                        mask: 1
                      },
                      headers: { "Content-Type": "multipart/form-data" }
                    }).catch((e) => {
                      console.log(e)
                    })
                  }
                  else {
                    axios({
                      method: "post",
                      url: "http://43.239.223.157:9001/api/V2/Notification/SendNotificationApp",
                      data: {
                        IdReceiver: JSON.stringify(listUserOffline),
                        conversationId: ConversationID,
                        sendername: listUser.find((e) => e._id == mess.SenderID) ? listUser.find((e) => e._id == mess.SenderID).userName : "",
                        ava: 'a',
                        mess: 'Bạn đã nhận được 1 file',
                        type: 'text',
                        idSender: mess.SenderID,
                        mask: 1
                      },
                      headers: { "Content-Type": "multipart/form-data" }
                    }).catch((e) => {
                      console.log(e)
                    })
                  }
                }
              }
              return true;
            }).catch((e) => {
              console.log(e);
              return false
            })
          }).catch(function (err) {
            console.log(err);
            return false;
          });
        return []
      }
      else {
        return []
      }
    }
    else {
      return []
    }
  }
  catch (e) {
    console.log(e);
    return []
  }
}
