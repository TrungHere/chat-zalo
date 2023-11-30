export const dataToView = function (objectConversation, conversationName, listMember, unReader) {
    const lastMessage = objectConversation.messageList[objectConversation.messageList.length - 1];
    const picked = (({ _id, conversationName, avatarConversation, isGroup, shareGroupFromLinkOption, browseMemberList, pinMessage, adminId, typeGroup }) => ({ _id, conversationName, avatarConversation, isGroup, shareGroupFromLinkOption, browseMemberList, pinMessage, adminId, typeGroup }))(objectConversation);
    picked.avatarConversation = picked.avatarConversation ? `https://mess.timviec365.vn/avatarGroup/${picked._id}/` : `https://mess.timviec365.vn/avatar/${conversationName.substring(0, 1)}_${Math.floor(Math.random() * 4) + 1}.png`;
    picked['messageId'] = lastMessage ? lastMessage._id : null;
    picked['message'] = lastMessage ? lastMessage.message : null;
    picked['messageType'] = lastMessage ? lastMessage.messageType : null;
    picked['createAt'] = lastMessage ? lastMessage.createAt : null;
    picked['countMessage'] = objectConversation.messageList.length;
    picked['listMember'] = listMember
    picked['unReader'] = unReader
    return picked;
}