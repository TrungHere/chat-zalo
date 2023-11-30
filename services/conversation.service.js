import Conversation from "../models/Conversation.js";
import Counter from "../models/Counter.js";
export const checkEmptyConversation = async (userId, contactId) => {
  const check = await Conversation.findOne({
    isGroup: 0,
    typeGroup: {
      $ne: "Secret",
    },
    memberList: {
      $size: 2,
    },
    $and: [
      {
        "memberList.memberId": userId,
      },
      {
        "memberList.memberId": contactId,
      },
    ],
  });
  if (!check) {
    return false;
  }
  return check;
};

export const InsertNewConversation1vs1 = async (
  isGroup,
  typeGroup,
  adminId,
  members
) => {
  const bigestId = (
    await Conversation.find().sort({ _id: -1 }).select("_id").limit(1)
  )[0]._id;
  const memberList = members.map((e) => {
    return (e = {
      memberId: e,
      conversationName: "",
      notification: 1,
    });
  });
  const newCon = await Conversation.create({
    _id: bigestId + 1,
    adminId: adminId,
    isGroup: isGroup,
    typeGroup: typeGroup,
    memberList,
    messageList: [],
    browseMemberList: [],
    timeLastMessage: null,
    liveChat: null,
  });
  await Counter.findOneAndUpdate(
    { name: "ConversationID" },
    { countID: newCon._id }
  );
  return newCon;
};

export const InsertMessage = async (conversationId, messData) => {
  try {
    const query = {
      _id: conversationId,
    };
    const update = {
      $push: { messageList: messData },
      timeLastMessage: messData.createAt
    };
    console.log(conversationId);
    const con = await Conversation.findOneAndUpdate(query, update)
    if (!con) {
      return false
    }
    return con;
  } catch (err) {
    if (err) return false;
  }
};

export const CheckDefautNameGroupOneMember = async (id, conversationName) => {
  try {
  const conversation = await Conversation.findOne({
  $and: [
  {
  "memberList.memberId": id,
  },
  {
  "memberList.conversationName": conversationName,
  },
  {
  memberList: {
  $size: 1,
  },
  },
  ],
  });
  if (!conversation) {
  return false;
  }
  return true;
  } catch (err) {
  if (err) return false;
  }
  };