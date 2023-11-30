import { v4 as uuidv4 } from 'uuid';
import { createError } from "../../utils/error.js";
import axios from "axios"
import Conversation from "../../models/Conversation.js";
import RequestContact from "../../models/RequestContact.js";
import Contact from "../../models/Contact.js";
import UsersClassified from "../../models/UsersClassified.js";
import User from "../../models/User.js";
import Counter from "../../models/Counter.js";
import { fUserConv } from '../fModels/fUsers.js';
import { CheckDefautNameGroupOneMember } from '../../services/conversation.service.js'
import { urlImgHost } from '../../utils/config.js'
import SaveTurnOffNotifyConv from "../../models/SaveTurnOffNotifyConv.js"
import date from "date-and-time";
import io from 'socket.io-client';
import { fInfoLink, fInfoFile, fEmotion, fMessageQuote } from "../fModels/fMessages.js";
import { removeVietnameseTones } from '../fTools/removeVietnameseTones.js'
import { ConvertToArrayString } from '../fTools/handleInput.js'

const socket = io.connect('http://43.239.223.142:3000', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});

export const FCreateNewConversation = async (req) => {
  try {
    const userId = Number(req.body.userId);
    const contactId = Number(req.body.contactId);
    const data = {
      result: true,
    };
    const bigestId = (
      await Conversation.find().sort({ _id: -1 }).select("_id").limit(1).lean()
    )[0]._id;
    const existConversation = await Conversation.findOne({
      $and: [
        { "memberList.memberId": { $eq: userId } },
        { "memberList.memberId": { $eq: contactId } },
      ],
      memberList: { $size: 2 },
      isGroup: 0,
    }).lean();

    if (existConversation) {
      data["conversationId"] = existConversation._id;
      return existConversation._id
    }
    let user_Favorite = 0
    let contact_Favorite = 0
    if (userId === 1216972) {
      contact_Favorite = 1
    }
    if (contactId === 1216972) {
      user_Favorite = 1
    }
    const newConversation = await Conversation.create({
      _id: bigestId + 1,
      isGroup: 0,
      typeGroup: "Normal",
      memberList: [
        {
          memberId: userId,
          notification: 1,
          isFavorite: user_Favorite
        },
        {
          memberId: contactId,
          notification: 1,
          isFavorite: contact_Favorite
        },
      ],
      messageList: [],
      browseMemberList: [],
    });
    data["conversationId"] = newConversation._id;
    await Counter.findOneAndUpdate({ name: "ConversationID" }, { countID: newConversation._id })
    return newConversation._id;
  } catch (err) {
    console.log(err)
    return false;
  }
};

export const FGetConversation = async (req) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.senderId)) {
        console.log("Token hop le, GetConversation")
      }
      else {
        return (createError(404, "Invalid token"));
      }
    }
    const conversationId = Number(req.body.conversationId);
    const senderId = Number(req.body.senderId);
    const listCons = await Conversation.aggregate([
      {
        $match: {
          _id: conversationId,
        },
      },
      { $limit: 1 },
      {
        $lookup: {
          from: "Users",
          localField: "browseMemberList.memberBrowserId",
          foreignField: "_id",
          as: "listBrowse",
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "memberList.memberId",
          foreignField: "_id",
          as: "listMember",
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "userCreate",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $project: {
          _id: 0,
          conversationId: "$_id",
          isGroup: 1,
          typeGroup: 1,
          avatarConversation: 1,
          linkAvatar: "$avatarConversation",
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
            $arrayElemAt: ["$messageList", -1],
          },
          sender: {
            $filter: {
              input: "$memberList",
              as: "mem",
              cond: {
                $eq: ["$$mem.memberId", senderId],
              },
            },
          },
          countMessage: {
            $size: "$messageList",
          },
        },
      },
      {
        $unwind: {
          path: "$sender",
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
          browseMember: "$browseMemberOption",
          pinMessageId: "$pinMessage",
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
          count: { $size: "$memberList" },
          messageId: "$lastMess._id",
          countMessage: 1,
          unReader: "$sender.unReader",
          message: "$lastMess.message",
          messageType: "$lastMess.messageType",
          createAt: "$lastMess.createAt",
          messageDisplay: "$sender.messageDisplay",
          senderId: "$lastMess.senderId",
          shareGroupFromLink: "$shareGroupFromLinkOption",
          isFavorite: "$sender.isFavorite",
          notification: "$sender.notification",
          isHidden: "$sender.isHidden",
          deleteTime: "$sender.deleteTime",
          deleteType: "$sender.deleteType",
          timeLastSeener: "$sender.timeLastSeener",
          lastMessageSeen: "$sender.lastMessageSeen"
        },
      },
      {
        $lookup: {
          from: "Privacys",
          localField: "memberList.memberId",
          foreignField: "userId",
          as: "privacy",
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
          count: { $size: "$memberList" },
          memberList: {
            $map: {
              input: "$memberList",
              as: "member",
              in: {
                memberId: "$$member.memberId",
                conversationName:
                  "$$member.conversationName",
                unReader: "$$member.unReader",
                messageDisplay:
                  "$$member.messageDisplay",
                isHidden: "$$member.isHidden",
                isFavorite: "$$member.isFavorite",
                notification: "$$member.notification",
                timeLastSeener:
                  "$$member.timeLastSeener",
                lastMessageSeen:
                  "$$member.lastMessageSeen",
                deleteTime: "$$member.deleteTime",
                deleteType: "$$member.deleteType",
                favoriteMessage:
                  "$$member.favoriteMessage",
                liveChat: "$$member.liveChat",
                fromWeb: "$$member.fromWeb",
                seenMessage: {
                  $let: {
                    vars: {
                      privacyObj: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$privacy",
                              cond: {
                                $eq: [
                                  "$$this.userId",
                                  "$$member.memberId",
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      $ifNull: [
                        "$$privacyObj.seenMessage",
                        1,
                      ],
                    },
                  },
                },
                statusOnline: {
                  $let: {
                    vars: {
                      privacyObj: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$privacy",
                              cond: {
                                $eq: [
                                  "$$this.userId",
                                  "$$member.memberId",
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      $ifNull: [
                        "$$privacyObj.statusOnline",
                        1,
                      ],
                    },
                  },
                },
              },
            },
          },
          browseMemberList: 1,
          timeLastMessage: {
            $dateToString: {
              date: "$timeLastMessage",
              timezone: "+07:00",
              format: "%G-%m-%dT%H:%M:%S.%L+07:00",
            },
          },
          lastMessageSeen: 1,
          liveChat: 1,
          message: 1,
          unReader: 1,
          messageType: 1,
          createAt: {
            $dateToString: {
              date: "$createAt",
              timezone: "+07:00",
              format: "%G-%m-%dT%H:%M:%S.%L+07:00",
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
              date: "$timeLastSeener",
              timezone: "+07:00",
              format: "%G-%m-%dT%H:%M:%S.%L+07:00",
            },
          },
          listMember: {
            $map: {
              input: "$listMember",
              as: "member",
              in: {
                _id: "$$member._id",
                id365: "$$member.idQLC",
                type365: "$$member.type",
                email: { $ifNull: ["$$member.email", "$$member.phoneTk"] },
                password: "$$member.password",
                phone: "$$member.phone",
                userName: "$$member.userName",
                avatarUser: "$$member.avatarUser",
                linkAvatar: "",
                status: "$$member.status",
                statusEmotion: "$$member.configChat.statusEmotion",
                lastActive: "$$member.lastActivedAt",
                active: "$$member.active",
                isOnline: "$$member.isOnline",
                companyId: { $ifNull: ["$$member.inForPerson.employee.com_id", "$$member.idQLC"] },
                idTimViec: "$$member.idTimViec365",
                fromWeb: "$$member.fromWeb",
              }
            }

          },
          listBrowse: {
            $map: {
              input: "$listBrowse",
              as: "browse",
              in: {
                _id: "$$browse._id",
                userName: "$$browse.userName",
                avatarUser: "$$browse.avatarUser",
                linkAvatar: "",
                status: "$$browse.status",
                statusEmotion: "$$browse.configChat.statusEmotion",
                lastActive: "$$browse.lastActivedAt",
                active: "$$browse.active",
                isOnline: "$$browse.isOnline",
              }
            }
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
      message: "Lấy thông tin cuộc trò chuyện thành công",
    };
    if (!listCons.length) {
      return (createError(200, "Cuộc trò chuyện không tồn tại"))
    }
    const contact = await Contact.find({
      $or: [{ userFist: senderId }, { userSecond: senderId }]
    }).limit(100).lean()
    for (const [index, con] of listCons.entries()) {
      const { memberList, listMember } = con;
      const newDataMember = listMember.map((e) => {
        e["id"] = e._id;
        const user = memberList.find((mem) => mem.memberId === e._id);
        e.avatarUser = e.avatarUser
          ? `${urlImgHost()}avatarUser/${e._id}/${e.avatarUser}`
          : `${urlImgHost()}avatar/${e.userName
            .substring(0, 1)
            .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
        let relationShip = contact.find((e) => {
          if ((e.userFist == senderId && e.userSecond == user.memberId)
          ) {
            return true;
          }
          if ((e.userSecond == senderId && e.userFist == user.memberId)) {
            return true;
          }
        });
        e["friendStatus"] = relationShip ? "friend" : "none";
        e.linkAvatar = e.avatarUser;
        e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
        if (user && user.timeLastSeener) {
          e.timeLastSeenerApp = `${JSON.parse(JSON.stringify(new Date(new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)))).replace("Z", "")}+07:00`;
        }
        return (e = { ...e, ...user });
      })
      const users = newDataMember.filter((mem) => mem._id !== senderId);
      const owner = newDataMember.filter((mem) => mem._id === senderId);
      let conversationName = "";
      if (owner[0]) {
        if (owner[0].conversationName || owner[0].userName) {
          conversationName = owner[0].conversationName || owner[0].userName;
        }
      }
      let avatarConversation;
      if (!listCons[index].isGroup) {
        if (!users[0]) {
          conversationName = owner[0].userName;
        } else {
          conversationName = owner[0].conversationName || users[0].userName;
        }
        avatarConversation = users[0]
          ? users[0].avatarUser
          : owner[0].avatarUser;
      }
      if (listCons[index].isGroup && listMember.length === 2) {
        conversationName = users[0] && users[0].conversationName != ""
          ? users[0].conversationName
          : users[0].userName;
      }
      if (listCons[index].isGroup && listMember.length === 3) {
        conversationName = users[0] && users[0].conversationName != "" ?
          users[0].conversationName :
          owner
            .map((e) => (e = e.userName))
            .slice(-2)
            .join(",");
      }
      if (listCons[index].isGroup && listMember.length > 3) {
        conversationName = users[0] && users[0].conversationName != "" ?
          owner[0].conversationName :
          users
            .map((e) => (e = e.userName))
            .slice(-3)
            .join(",");
      }
      if (listCons[index].isGroup && listCons[index].avatarConversation) {
        avatarConversation = `${urlImgHost()}avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
      }
      if (listCons[index].isGroup && !avatarConversation) {
        avatarConversation = `${urlImgHost()}avatar/${removeVietnameseTones(conversationName)
          .substring(0, 1)
          .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
      }
      listCons[index].listMember = newDataMember;
      listCons[index]["conversationName"] = conversationName !== "" ? conversationName : owner.userName
      if (!listCons[index]["conversationName"]) {
        listCons[index]["conversationName"] = ""
      }
      listCons[index].avatarConversation = avatarConversation;
      listCons[index].linkAvatar = avatarConversation;
      delete listCons[index]["memberList"];
    }
    let obj = listCons[0];
    if (!obj.createAt) {
      obj = { ...obj, createAt: new Date() };
    }
    data["conversation_info"] = obj;
    return ({ data, error: null });
  } catch (err) {
    console.log(err);
    if (err) return (createError(200, err.mesesage));
  }
};

export const FReadMessage = async (req) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status && (check.userId == req.body.senderId)) {
        console.log("Token hop le, ReadMessage")
      }
      else {
        return (createError(404, "Invalid token"));
      }
    }
    const data = {
      result: true,
      message: "Đánh dấu tin nhắn đã đọc thành công thành công",
    };
    const senderId = Number(req.body.senderId);
    const conversationId = Number(req.body.conversationId);
    const existUnreadMessage = await Conversation.findOne({
      _id: conversationId,
      "memberList.memberId": senderId
    },
      {
        messageList: 1,
        "memberList.memberId": 1
      }
    ).lean();
    if (existUnreadMessage && existUnreadMessage.memberList) {
      if (existUnreadMessage.messageList && existUnreadMessage.messageList.length) {
        Conversation.updateOne(
          { _id: conversationId, "memberList.memberId": senderId },
          {
            $set: {
              "memberList.$.unReader": 0,
              "memberList.$.timeLastSeener": Date.now(),
              "memberList.$.lastMessageSeen": existUnreadMessage.messageList[existUnreadMessage.messageList.length - 1]._id,
            }
          }
        ).catch((e) => { console.log("Error readmessage") })
      }
      else {
        if (existUnreadMessage && existUnreadMessage.messageList && existUnreadMessage.messageList.length && existUnreadMessage.messageList[existUnreadMessage.messageList.length - 1]) {
          Conversation.updateOne(
            { _id: conversationId, "memberList.memberId": senderId },
            {
              $set: {
                "memberList.$.unReader": 0,
                "memberList.$.timeLastSeener": Date.now(),
                "memberList.$.lastMessageSeen": existUnreadMessage.messageList[existUnreadMessage.messageList.length - 1]._id,
              }
            }
          ).catch((e) => { console.log("Error readmessage") })
        }
      }
    };
    return ({ data, error: null });
  } catch (err) {
    console.log("ReadMessage", err);
    return (createError(err, err.message));
  }
};

export const FGetListConversationIdStrange = async (userId, companyId, type) => {
  let listFriend = await Contact.find(
    { $or: [{ userFist: userId }, { userSecond: userId }] }).limit(10000)

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
    let listContactCompany = await User.find({ _id: { $ne: userId }, $or: [{ 'inForPerson.employee.com_id': companyId }, { idQLC: companyId }] }, { _id: 1 });
    if (listContactCompany.length) {
      for (let i = 0; i < listContactCompany.length; i++) {
        listFriendFinal.push(listContactCompany[i]._id)
      }
    };
    listContactCompany = null;
  };
  if (userId != 1191) {
    listFriendFinal.push(1191);
  }
  if (userId != 56387) {
    listFriendFinal.push(56387);
  }
  if (userId != 114803) {
    listFriendFinal.push(114803);
  }
  let conv
  if (type && type !== 'sendMessage') {
    conv = await Conversation.find(
      {
        $and: [
          { isGroup: 0 },
          { 'memberList.memberId': userId },
          { 'messageList.0': { $exists: true } },
          { 'messageList.senderId': { $ne: userId } },
          { 'messageList.senderId': { $nin: listFriendFinal } }
        ]
      },
      {
        _id: 1,
        timeLastMessage: 1
      }
    ).sort({ timeLastMessage: -1 })
  }
  else {
    conv = await Conversation.find(
      {
        $and: [
          { isGroup: 0 },
          { 'memberList.memberId': userId },
          { 'messageList.senderId': { $ne: userId } },
          { 'messageList.senderId': { $nin: listFriendFinal } }
        ]
      },
      {
        _id: 1,
        timeLastMessage: 1
      }
    ).sort({ timeLastMessage: -1 })
  }
  const listConvStrange = []
  let lastConvStrange = conv[0]?._id ? conv[0]?._id : 0
  if (conv && conv.length > 0) {
    conv.map(item => {
      listConvStrange.push(item._id)
    })
  }
  return [listConvStrange, lastConvStrange]
}