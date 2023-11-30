export const fUsers = (
    id, id365, idTimViec, type365, email, password, phone, userName, avatarUser, status, statusEmotion, lastActive, active, isOnline, looker, companyId,
    companyName, notificationPayoff, notificationCalendar, notificationReport,  notificationOffer, notificationPersonnelChange, notificationRewardDiscipline,  
    notificationNewPersonnel, notificationTransferAsset, notificationChangeProfile, notificationMissMessage,notificationCommentFromTimViec,notificationCommentFromRaoNhanh,
    notificationTag,notificationSendCandidate,
    notificationChangeSalary,notificationAllocationRecall,notificationAcceptOffer,
    notificationDecilineOffer,notificationNTDPoint,notificationNTDExpiredPin,notificationNTDExpiredRecruit) => {
   return {
    ID : id,
    Email : email || "",
    Password : password || "", 
    Phone : phone,
    UserName:  userName,
    AvatarUser : avatarUser || "",
    Status : status || "",
    Active : active || 0,
    isOnline : isOnline || 0,
    Looker : looker || 0,
    StatusEmotion : statusEmotion || 0,
    LastActive : lastActive || new Date(),
    CompanyId : companyId || 0,
    NotificationCalendar:  notificationCalendar  || 1,
    NotificationPayoff : notificationPayoff || 1,
    NotificationReport : notificationReport || 1,
    NotificationOffer : notificationOffer || 1,
    NotificationPersonnelChange : notificationPersonnelChange || 1,
    NotificationRewardDiscipline : notificationRewardDiscipline || 1,
    NotificationNewPersonnel : notificationNewPersonnel || 1,
    NotificationChangeProfile : notificationChangeProfile || 1,
    NotificationTransferAsset : notificationTransferAsset || 1,
    CompanyName : companyName || 1,
    ID365 : id365 || 0,
    Type365 : type365 || 0,
    IDTimViec : idTimViec || 0,
    NotificationMissMessage : notificationMissMessage || 1,
    NotificationCommentFromTimViec : notificationCommentFromTimViec || 1,
    NotificationCommentFromRaoNhanh : notificationCommentFromRaoNhanh || 1,
    NotificationTag : notificationTag || 1,
    NotificationSendCandidate : notificationSendCandidate || 1,
    NotificationChangeSalary : notificationChangeSalary || 1,
    NotificationAllocationRecall : notificationAllocationRecall || 1,
    NotificationAcceptOffer : notificationAcceptOffer || 1,
    NotificationDecilineOffer : notificationDecilineOffer || 1,
    NotificationNTDPoint : notificationNTDPoint || 1,
    NotificationNTDExpiredPin : notificationNTDExpiredPin || 1,
    NotificationNTDExpiredRecruit : notificationNTDExpiredRecruit || 1,
   }
};

export const UsersModelExtra = ( id,  id365, idTimViec, type365,  email,  password,  phone,  userName,
                                avatarUser,  status,  statusEmotion,  lastActive,
                                active,  isOnline,  looker,companyId,  companyName)=>{
    return {
            ID : id,
            Email : email,
            Password : password,
            Phone : phone,
            UserName : userName,
            AvatarUser : avatarUser,
            Status : status,
            Active : active,
            isOnline : isOnline,
            Looker : looker,
            StatusEmotion: statusEmotion,
            LastActive : lastActive,
            CompanyId : companyId,
            CompanyName : companyName,
            ID365 : id365,
            Type365 : type365,
            IDTimViec : idTimViec,
    }
}

export const fUserConv = ( memberId, conversationName , unReader , messageDisplay, isHidden ,
    isFavorite, notification, timeLastSeener, deleteTime, deleteType, favoriteMessage
    ) =>{
return {
memberId, conversationName , unReader , messageDisplay, isHidden ,
isFavorite, notification, timeLastSeener, deleteTime, deleteType, favoriteMessage
}
}