export const dataToViewInConversation = function(userObject, unReader, timeLastSeener, friendStatus, liveChat) {
    const picked = (({ _id, userName, avatarUser, status, active, isOnline, statusEmotion, lastActive, companyId, idTimViec, type365 }) => ({ _id, userName, avatarUser, status, active, isOnline, statusEmotion, lastActive, companyId, idTimViec, type365 }))(userObject);
    picked.avatarUser = picked.avatarUser ? `https://mess.timviec365.vn/avatarUser/${picked._id}/${picked.avatarUser}` : `https://mess.timviec365.vn/avatar/${picked.userName.substring(0,1)}_${Math.floor(Math.random() * 4) + 1}.png`;
    picked['unReader'] = unReader;
    picked['timeLastSeener'] = timeLastSeener;
    picked['friendStatus'] = friendStatus;
    picked['liveChat'] = liveChat;
    return picked;
}