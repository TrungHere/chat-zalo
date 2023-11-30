import Notification from "../../models/Notification.js";
export const InsertNotification = async(id, userId, paticipantId, title, message, type, mesageId, conversationId, createAt, link) => {
    try {
        let countNotification = await Notification.countDocuments({ userId: Number(userId) });
        if (countNotification > 20) {
            let deleteNotification = await Notification.deleteOne({ userId: Number(userId) });
        }
        let notification = new Notification({
            _id: id,
            userId: Number(userId),
            paticipantId: Number(paticipantId),
            title: title,
            message: message,
            isUndeader: 1,
            createAt: new Date(),
            type: type,
            messageId: null,
            conversationId: Number(conversationId),
            link: link,
        })
        let notificationSaved = await notification.save()

        if (notificationSaved && notificationSaved._id) {
            return 1;
        } else {
            return 0
        }
    } catch (e) {
        console.log(e);
        return 0;
    }
}

export const fParticipantNotification = (companyId, CompanyName, fromWeb, id, id365, idTimviec, lastActive, type365, userName, email, isOnline) => {
    return {
        AcceptMessStranger: 0,
        Active: 1,
        AvatarUser: "",
        CompanyId: companyId,
        CompanyName: CompanyName,
        Email: email,
        FriendStatus: "none",
        FromWeb: fromWeb,
        ID: id,
        ID365: id365,
        IDTimViec: idTimviec,
        LastActive: lastActive,
        LinkAvatar: "https://mess.timviec365.vn/avatar/C_4.png",
        Looker: 0,
        NotificationAcceptOffer: 1,
        NotificationAllocationRecall: 1,
        NotificationCalendar: 1,
        NotificationChangeProfile: 1,
        NotificationChangeSalary: 1,
        NotificationCommentFromRaoNhanh: 1,
        NotificationCommentFromTimViec: 1,
        NotificationDecilineOffer: 1,
        NotificationMissMessage: 1,
        NotificationNTDApplying: 1,
        NotificationNTDExpiredPin: 1,
        NotificationNTDExpiredRecruit: 1,
        NotificationNTDPoint: 1,
        NotificationNewPersonnel: 1,
        NotificationOffer: 1,
        NotificationPayoff: 1,
        NotificationPersonnelChange: 1,
        NotificationReport: 1,
        NotificationRewardDiscipline: 1,
        NotificationSendCandidate: 1,
        NotificationTag: 1,
        NotificationTransferAsset: 1,
        Password: "",
        Phone: "",
        Status: "",
        StatusEmotion: 0,
        Type365: type365,
        Type_Pass: 0,
        UserName: userName,
        isOnline: isOnline,
        secretCode: null,
        userQr: null,
    }
}