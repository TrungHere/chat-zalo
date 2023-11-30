import express from "express";
import formData from 'express-form-data';
import { findarround } from "../controllers/users.js";
import { TakeListFriend } from "../controllers/users.js";
import { takeListNewFriend } from "../controllers/users.js";
import { SendLocation } from "../controllers/users.js";
import { GetTimeOnlineForUserId } from "../controllers/users.js"; // GetTimeOnlineForUserIdTest
import { GetTimeOnlineForUserIdTest } from "../controllers/users.js";
import { GetHistoryAccessByUserId } from "../controllers/users.js"; // updatelocation
import { updatelocation } from "../controllers/users.js";
import { FindUser } from "../controllers/users.js";
import { FindUserApp } from "../controllers/users.js";
import { createError } from "../utils/error.js";
import {
    TakeListFriend365,
    GetListUserByClassUserAndUserOwner,
    CheckClassUser,
    CreateClassUser,
    InsertUserToClassUser,
    DeleteUserFromClassUser,
    GetListClassOfOneUser,
    EditClassUserName,
    EditClassUserColor,
    DeleteClassUser,
    VerifyClassArrayUser,
    FindUserAppAll,
    FindUserAppCompany,
    FindUserAppNormal,
    FindUserAppConversation,
    FindUserAppCompanyRandom,
    UpdatePhoneNumber,
    UpdatePasswordUser,
    GetIdChat365,
    GetUserName,
    GetListRequest,
    GetListRequestFriend,
    DeleteRequestAddFriend,
    // hai
    GetInfoUser,
    GetContactCompany,
    GetListContactPrivate,
    GetListContact,
    GetListOfferContactByPhone,
    RegisterSuccess,
    CheckContact,
    ChangeActive,
    Logout,
    // ChangeUserName,
    AddFriend,
    GetAllUserOnline,
    DeleteContact,
    AcceptRequestAddFriend,
    DecilineRequestAddFriend,
    UpdateUserName,
    GetAcceptMessStranger,
    UpdateAcceptMessStranger,
    GetListSuggesContact,
    RemoveSugges,
    ChangeUserName,
    ChangePassword,
    NewAccountFromQLC,
    AccountFrom_TimViec365,
    UpdateAllInfomation365,
    AutoLogin,
    Logout_all,
    setupBase,
    OptimizeContact,
    OptimizeRequestContact,
    OptimizeRequestContactStatus,
    CheckStatus,
    GetInfoUserFromHHP365,
    FriendRequest,
    SentRequest,
    RegisterMailOtp,
    UpdatePassword,
    RenderOTPChat365,
    TakeDataFireBaseOTP,
    GetAccountByNumberPhone,
    ChangeAcceptDevice,
    DeleteHistoryOTPPhoneNumber,
    ToolUpdateAvatar,
    UpdatePermissionChangePass,
    TakePermissionChangePass,
    VerifyAccount,
    GetNewContact,
    GetContact_v2,
    GetContactOnline,
    getIdChat,
    QR365,
    getInfoQRLogin,
    GetListInfoUser,
    sendMailQlcApi,
    VerifyUser,
    VerifyAll,
    UpdateCompanyEmail,
    GetListFriendRecentlyAccessed,
    GetDobfromQlc,
    GetnamefromId,
    updateIdchatfromIdtimviec,

    UpdateNotificationCommentFromTimViec,
    UpdateNotificationCommentFromRaoNhanh,
    UpdateNotificationChangeSalary,
    UpdateNotificationAllocationRecall,
    UpdateNotificationAcceptOffer,
    UpdateNotificationDecilineOffer,
    UpdateNotificationMissMessage,
    UpdateNotificationNTDPoint,
    UpdateNotificationNTDExpiredPin,
    UpdateNotificationNTDExpiredRecruit,
    UpdateNotificationSendCandidate,
    UpdateNotificationNTDApplying,
    UpdateNotificationPayoff,
    UpdateNotificationCalendar,
    UpdateNotificationPersionalChange,
    UpdateNotificationRewardDiscipline,
    UpdateNotificationNewPersonnel,
    UpdateNotificationChangeProfile,
    UpdateNotificationTransferAsset,
    GetAppWasOpen,
    TakePass,
    GetIdChatByEmailPhone,
    TakeIdChatById365,
    GetBestFriend,
    updateBestFriend,
    ToolUpdateContact,
    CountHistorySendSmsOtp,
    AddFriendAuto,
    AddUserToManyClass,
    EditClass,
    CheckDoubleContact,
    deleteCompanyFriend,
    deleteRequestCompanyFriend,
    deleteUserChat,
    // NewAccountFromQLC,
    GetListInfoUserTTNB,
    FindUserClass,
    SendManyMesByClassId,
    SendMesListUserId,
    TakeArrayIdChatById365,
    GetListUserIdFamiliar,
    GetHistoryAccessByMail,
    SetToOffline,
    ToolMergerUser,
    TakeDataUser,
    TakeDataUserByMailPhone,
    GetListInfoUserByIdChat365,
    UpdateDoubleVerify,
    GetStatusDoubleVerify,
    LogoutStrangeDevice,
    InsertFieldCollection,
    GetAccountsByDevice,
    TakeDataUserSharePermission,
    //UpdateSharePermission,
    TakeListLastActiveIdTimviec,
    GetListIdChat,
    TakeAccountOriginPermission,
    UpdatePinHiddenConversation,
    GetPinHiddenConversation,
    DeletePinHiddenConversation,
    ConfirmPinHiddenConv,
    GetUserByIdChat,
    SynchronizeAccountEmChatTimviec365,
    CheckInstall,
    FindUserConversation,
    ChangeName,
    ChangeNickNameUser,
    UpdateUser,
    ToolAccount,
    setOnOfflineToBase,
    GetListContactAppPC,
    UpdateStatus
} from "../controllers/users.js";
import { updateBirthday } from "../controllers/users.js";
const router = express.Router();
router.get("/setupBase", setupBase)
router.get("/OptimizeRequestContact", OptimizeRequestContact)
router.get("/OptimizeContact", OptimizeContact)
// router.get("/OptimizeRequestContactStatus",OptimizeRequestContactStatus)
router.post("/RegisterMailOtp", formData.parse(), RegisterMailOtp)
router.get("/findarround/:userId", findarround)
router.post("/finduser", formData.parse(), FindUser)
router.post("/finduser/app", formData.parse(), function (req, res, next) {
    res.setTimeout(40000, function () {
        res.status(200).json(createError(200, "Request Time out"));
    });
    next();
}, FindUserApp)
router.post("/updatelocation", formData.parse(), updatelocation)
router.post("/listfriend", formData.parse(), TakeListFriend)
router.get("/TakeListFriend365/:userId/:type365", TakeListFriend365)
router.get("/listnewfriend/:userId", takeListNewFriend)
router.post("/sendlocation", formData.parse(), SendLocation)
router.post("/getstatus/arrayuser", formData.parse(), GetTimeOnlineForUserId);
router.post("/getstatus/arrayusertest", formData.parse(), GetTimeOnlineForUserIdTest);
router.get("/gethistoryaccess/:id", GetHistoryAccessByUserId)

// find user specipic for app FindUserAppAll FindUserAppNormal
router.post("/finduser/app/all", formData.parse(), FindUserAppAll)
router.post("/finduser/app/FindUserConversation", formData.parse(), FindUserConversation)
router.post("/finduser/app/company", formData.parse(), FindUserAppCompany)
router.post("/finduser/app/normal", formData.parse(), FindUserAppNormal)
router.post("/finduser/app/conversation", formData.parse(), FindUserAppConversation)
router.post("/finduser/app/companyrandom", formData.parse(), FindUserAppCompanyRandom)

// nhãn dán phân loại user 
router.post("/CreateClassUser", formData.parse(), CreateClassUser)
router.post("/InsertUserToClassUser", formData.parse(), InsertUserToClassUser)
router.post("/DeleteUserFromClassUser", formData.parse(), DeleteUserFromClassUser)
router.post("/GetListUserByClassUserAndUserOwner", formData.parse(), GetListUserByClassUserAndUserOwner)
router.post("/CheckClassUser", formData.parse(), CheckClassUser)
router.post("/GetListClassOfOneUser", formData.parse(), GetListClassOfOneUser)
router.post("/EditClassUserName", formData.parse(), EditClassUserName)
router.post("/EditClassUserColor", formData.parse(), EditClassUserColor)
router.post("/DeleteClassUser", formData.parse(), DeleteClassUser);
router.post("/VerifyClassArrayUser", formData.parse(), VerifyClassArrayUser)

router.post("/UpdatePhoneNumber", formData.parse(), UpdatePhoneNumber)

router.post("/GetIdChat365", formData.parse(), GetIdChat365)
router.post("/GetUserName", formData.parse(), GetUserName)
router.post("/GetListRequest", formData.parse(), GetListRequest)
router.post("/GetListRequestFriend", formData.parse(), GetListRequestFriend)
router.post("/AddFriend", formData.parse(), AddFriend)
router.post("/DeleteContact", formData.parse(), DeleteContact)
router.post("/AcceptRequestAddFriend", formData.parse(), AcceptRequestAddFriend)
router.post("/DecilineRequestAddFriend", formData.parse(), DecilineRequestAddFriend)
router.post("/UpdateUserName", formData.parse(), UpdateUserName)
router.post("/UpdatePasswordUser", formData.parse(), UpdatePasswordUser)
router.post("/ChangePassword", formData.parse(), ChangePassword)
//hai api
router.post("/GetInfoUser", formData.parse(), GetInfoUser)
router.post("/GetContactCompany", formData.parse(), GetContactCompany)
router.post("/GetListContactPrivate", formData.parse(), GetListContactPrivate)
router.post("/GetListContactAppPC", formData.parse(), GetListContactAppPC)
router.post("/GetListContact", formData.parse(), GetListContact)
router.post("/GetListContact_v2", formData.parse(), GetListContact)
router.post("/GetListOfferContactByPhone", formData.parse(), GetListOfferContactByPhone)
router.post("/GetAllUserOnline", formData.parse(), GetAllUserOnline)
router.post("/CheckContact", formData.parse(), CheckContact)
router.post("/ChangeActive", formData.parse(), ChangeActive)
router.post("/Logout", formData.parse(), Logout)
router.post("/RegisterSuccess", formData.parse(), RegisterSuccess)
router.post("/DeleteRequestAddFriend", formData.parse(), DeleteRequestAddFriend)
router.post("/GetListSuggesContact", formData.parse(), GetListSuggesContact)

router.post("/GetAcceptMessStranger", formData.parse(), GetAcceptMessStranger)
router.post("/UpdateAcceptMessStranger", formData.parse(), UpdateAcceptMessStranger)
router.post("/RemoveSugges", formData.parse(), RemoveSugges)
// router.post("/NewAccountFromQLC",NewAccountFromQLC)
// router.post("/ChangeUserName",formData.parse(),ChangeUserName)
router.post("/updateBirthday", formData.parse(), updateBirthday)
router.post("/ChangeUserName", formData.parse(), ChangeUserName)
router.post("/NewAccountFromQLC", NewAccountFromQLC)
router.post("/AccountFrom_TimViec365", formData.parse(), AccountFrom_TimViec365)
router.post("/UpdateAllInfomation365", formData.parse(), UpdateAllInfomation365)
router.post("/AutoLogin", formData.parse(), AutoLogin)
router.post("/Logout_all", formData.parse(), Logout_all)
router.post("/CheckStatus", formData.parse(), CheckStatus)
router.post("/GetInfoUserFromHHP365", formData.parse(), GetInfoUserFromHHP365)
router.post("/FriendRequest", formData.parse(), FriendRequest)
router.post("/SentRequest", formData.parse(), SentRequest)
router.post("/UpdatePassword", formData.parse(), UpdatePassword);
router.get("/RenderOTPChat365/:userId/:IdDevice/:number", formData.parse(), RenderOTPChat365)
router.post("/TakeDataFireBaseOTP", formData.parse(), TakeDataFireBaseOTP);
router.post("/GetAccountByNumberPhone", formData.parse(), GetAccountByNumberPhone);
router.post("/ChangeAcceptDevice", formData.parse(), ChangeAcceptDevice);
router.get("/DeleteHistoryOTPPhoneNumber", formData.parse(), DeleteHistoryOTPPhoneNumber);
router.get("/ToolUpdateAvatar", formData.parse(), ToolUpdateAvatar);
router.post("/UpdatePermissionChangePass", formData.parse(), UpdatePermissionChangePass);
router.post("/TakePermissionChangePass", formData.parse(), TakePermissionChangePass);
// router.post("/VerifyAccount",formData.parse(),VerifyAccount); 
router.post("/GetNewContact", formData.parse(), GetNewContact);
router.post("/GetContact_v2", formData.parse(), GetContact_v2);
router.post("/GetContactOnline", formData.parse(), GetContactOnline);
router.post("/getIdChat", formData.parse(), getIdChat)
router.post("/QR365", formData.parse(), QR365)
router.post("/getInfoQRLogin", formData.parse(), getInfoQRLogin)
router.post("/GetListInfoUser", formData.parse(), GetListInfoUser)
router.post("/sendMailQlcApi", formData.parse(), sendMailQlcApi)
router.post("/VerifyUser", formData.parse(), VerifyUser)
router.get("/VerifyAll", formData.parse(), VerifyAll);
router.post("/UpdateCompanyEmail", formData.parse(), UpdateCompanyEmail);
router.post("/GetListFriendRecentlyAccessed", formData.parse(), GetListFriendRecentlyAccessed)
router.post("/GetDobfromQlc", formData.parse(), GetDobfromQlc)
router.post("/GetnamefromId", formData.parse(), GetnamefromId)

router.post("/UpdateNotificationCommentFromTimViec", formData.parse(), UpdateNotificationCommentFromTimViec)
router.post("/UpdateNotificationCommentFromRaoNhanh", formData.parse(), UpdateNotificationCommentFromRaoNhanh)
router.post("/UpdateNotificationChangeSalary", formData.parse(), UpdateNotificationChangeSalary)
router.post("/UpdateNotificationAllocationRecall", formData.parse(), UpdateNotificationAllocationRecall)
router.post("/UpdateNotificationAcceptOffer", formData.parse(), UpdateNotificationAcceptOffer)
router.post("/UpdateNotificationDecilineOffer", formData.parse(), UpdateNotificationDecilineOffer)
router.post("/UpdateNotificationMissMessage", formData.parse(), UpdateNotificationMissMessage)
router.post("/UpdateNotificationNTDPoint", formData.parse(), UpdateNotificationNTDPoint)
router.post("/UpdateNotificationNTDExpiredPin", formData.parse(), UpdateNotificationNTDExpiredPin)
router.post("/UpdateNotificationNTDExpiredRecruit", formData.parse(), UpdateNotificationNTDExpiredRecruit)
router.post("/UpdateNotificationSendCandidate", formData.parse(), UpdateNotificationSendCandidate)
router.post("/UpdateNotificationNTDApplying", formData.parse(), UpdateNotificationNTDApplying)
router.post("/UpdateNotificationPayoff", formData.parse(), UpdateNotificationPayoff)
router.post("/UpdateNotificationCalendar", formData.parse(), UpdateNotificationCalendar)
router.post("/UpdateNotificationPersionalChange", formData.parse(), UpdateNotificationPersionalChange)
router.post("/UpdateNotificationRewardDiscipline", formData.parse(), UpdateNotificationRewardDiscipline)
router.post("/UpdateNotificationNewPersonnel", formData.parse(), UpdateNotificationNewPersonnel)
router.post("/UpdateNotificationChangeProfile", formData.parse(), UpdateNotificationChangeProfile)
router.post("/UpdateNotificationTransferAsset", formData.parse(), UpdateNotificationTransferAsset)
router.post("/GetAppWasOpen", formData.parse(), GetAppWasOpen)
router.post("/updateIdchatfromIdtimviec", formData.parse(), updateIdchatfromIdtimviec)
router.post("/TakePass", formData.parse(), TakePass); // TakeIdChatById365
router.post("/TakeIdChatById365", formData.parse(), TakeIdChatById365);
router.post("/updateBestFriend", formData.parse(), updateBestFriend)
router.post("/GetBestFriend", formData.parse(), GetBestFriend)
router.get("/ToolUpdateContact", ToolUpdateContact)
router.post("/CountHistorySendSmsOtp", formData.parse(), CountHistorySendSmsOtp);
router.post("/GetIdChatByEmailPhone", formData.parse(), GetIdChatByEmailPhone);
router.post("/AddFriendAuto", formData.parse(), AddFriendAuto);
router.post("/AddUserToManyClass", formData.parse(), AddUserToManyClass);
router.post("/EditClass", formData.parse(), EditClass);
router.post("/CheckDoubleContact", formData.parse(), CheckDoubleContact);
router.post("/deleteCompanyFriend", formData.parse(), deleteCompanyFriend)
router.post("/deleteRequestCompanyFriend", formData.parse(), deleteRequestCompanyFriend)
//router.post("/deleteUserChat",formData.parse(),deleteUserChat)
router.post("/GetListInfoUserTTNB", formData.parse(), GetListInfoUserTTNB);
router.post("/FindUserClass", formData.parse(), FindUserClass)
router.post("/SendManyMesByClassId", formData.parse(), SendManyMesByClassId);
router.post("/SendMesListUserId", formData.parse(), SendMesListUserId);
router.post("/TakeArrayIdChatById365", formData.parse(), TakeArrayIdChatById365);
router.post("/GetListUserIdFamiliar", formData.parse(), GetListUserIdFamiliar);
router.post("/GetHistoryAccessByMail", formData.parse(), GetHistoryAccessByMail);
router.get("/SetToOffline", SetToOffline);
router.get("/ToolMergerUser", ToolMergerUser);
router.post("/TakeDataUser", TakeDataUser);
router.post("/TakeDataUserByMailPhone", formData.parse(), TakeDataUserByMailPhone);
router.post("/GetListInfoUserByIdChat365", formData.parse(), GetListInfoUserByIdChat365)

router.post("/UpdateDoubleVerify", formData.parse(), UpdateDoubleVerify);
router.post("/GetStatusDoubleVerify", formData.parse(), GetStatusDoubleVerify);
router.post("/LogoutStrangeDevice", formData.parse(), LogoutStrangeDevice)
router.get("/InsertFieldCollection", InsertFieldCollection)
router.post("/GetAccountsByDevice", formData.parse(), GetAccountsByDevice)
//router.post("/UpdateSharePermission",formData.parse(), UpdateSharePermission)
router.post("/TakeDataUserSharePermission", formData.parse(), TakeDataUserSharePermission)
router.post("/TakeListLastActiveIdTimviec", formData.parse(), TakeListLastActiveIdTimviec)
router.post("/GetListIdChat", formData.parse(), GetListIdChat);
router.post("/TakeAccountOriginPermission", formData.parse(), TakeAccountOriginPermission);
router.post("/UpdatePinHiddenConversation", formData.parse(), UpdatePinHiddenConversation);
router.post("/GetPinHiddenConversation", formData.parse(), GetPinHiddenConversation);
router.post("/DeletePinHiddenConversation", formData.parse(), DeletePinHiddenConversation);
router.post("/ConfirmPinHiddenConv", formData.parse(), ConfirmPinHiddenConv);
router.post("/GetUserByIdChat", formData.parse(), GetUserByIdChat);
router.post("/SynchronizeAccountEmChatTimviec365", formData.parse(), SynchronizeAccountEmChatTimviec365);
router.get("/CheckInstall", CheckInstall);
router.post("/ChangeName", formData.parse(), ChangeName);
router.post("/ChangeNickNameUser", formData.parse(), ChangeNickNameUser);
router.post("/UpdateUser", formData.parse(), UpdateUser);
router.post("/setOnOfflineToBase", formData.parse(), setOnOfflineToBase);
router.post("/UpdateStatus", formData.parse(), UpdateStatus);
router.get("/ToolAccount", ToolAccount);
export default router