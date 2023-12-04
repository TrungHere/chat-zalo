import express from "express";
import formData from 'express-form-data';
import { createError } from "../utils/error.js";
import { createInterval } from "../controllers/conversations.js";
import { stopInterval } from "../controllers/conversations.js";
import { testIntervalInTimeOut } from "../controllers/conversations.js";
import { StopIntervalInTimeOut } from "../controllers/conversations.js";
import { createCanlerdal } from "../controllers/conversations.js";
import { takeListCanlerdal } from "../controllers/conversations.js";
import { createNotificationCanlerdal } from "../controllers/conversations.js";
import { takeAllCanlerdal } from "../controllers/conversations.js";
import { deleteCanlerdal } from "../controllers/conversations.js";
import { JoinConversationOffline } from "../controllers/conversations.js";
import { GetListConversation } from "../controllers/conversations.js";
import { GetListConversationUnreader } from "../controllers/conversations.js";
import { GetListUnreaderConversation } from "../controllers/conversations.js";
import { GetListMemberOfGroup } from "../controllers/conversations.js";
import { ChangeBrowseMemberOfGroup } from "../controllers/conversations.js";
import { ChangeNameGroup } from "../controllers/conversations.js";
import { PinMessage } from "../controllers/conversations.js";
import { UnPinMessage } from "../controllers/conversations.js";
import { GetConversation } from "../controllers/conversations.js";
import { OutGroup } from "../controllers/conversations.js";
import { AddToFavoriteConversation } from "../controllers/conversations.js";
import { HiddenConversation } from "../controllers/conversations.js";
import { CreateNewConversation } from "../controllers/conversations.js";
import { DeleteConversation } from "../controllers/conversations.js";
import { ReadMessage } from "../controllers/conversations.js";
import { GetListConversationForward } from "../controllers/conversations.js";
import { GetConversationList } from "../controllers/conversations.js";
import { AddBrowseMember } from "../controllers/conversations.js";
import { MarkUnreader } from "../controllers/conversations.js";
import { ChangeNotificationConversation } from "../controllers/conversations.js";
import { RemoveConversation } from "../controllers/conversations.js";
import { AddNewConversation } from "../controllers/conversations.js";
import { ChangeShareLinkOfGroup } from "../controllers/conversations.js";
import { getAllGroup } from "../controllers/conversations.js";
import { GetCountConversationUnreader } from "../controllers/conversations.js";
import { CreateNewSecretConversation } from "../controllers/conversations.js";
import { AddNewMemberToGroup } from "../controllers/conversations.js";
import { DeleteBrowse } from "../controllers/conversations.js";
import { CheckReconnectInternet } from "../controllers/conversations.js";
import { ReadAllMessage } from "../controllers/conversations.js";
import { GetInfoLiveChat } from "../controllers/conversations.js";
import { ChangeAvatarGroup } from "../controllers/conversations.js";
import { ChangeNickName } from "../controllers/conversations.js";
import { GetListConversationFavoriteOrder } from "../controllers/conversations.js";
import { GetListConversation_V2 } from "../controllers/conversations.js";
import { DeleteLiveChat } from "../controllers/conversations.js";
import { CreateNewLiveChat } from "../controllers/conversations.js";
import { OutManyGroup } from "../controllers/conversations.js";
import { DeleteLiveChatConv } from "../controllers/conversations.js";
import { OptimizeConversationLiveChatSpam } from "../controllers/conversations.js";
import { OptimizeConversation } from "../controllers/conversations.js";
import { DeleteConvSpamOptimize } from "../controllers/conversations.js";
import { SetupDeleteTime } from "../controllers/conversations.js";
import { SetupDeleteTimeV2 } from "../controllers/conversations.js";
import { checkVirtualAccount } from "../controllers/conversations.js";
import { changeNoTifyConv } from "../controllers/conversations.js";
import { checkNoTifyConv } from "../controllers/conversations.js";
import { SetTimechangeNoTifyConv } from "../controllers/conversations.js";
import { UpdateDeleteTime } from "../controllers/conversations.js";
import { GetConversation_v2 } from "../controllers/conversations.js";
import { GetListCall } from "../controllers/conversations.js";
import { ChangeAdmin } from "../controllers/conversations.js";
import { DisbandGroup } from "../controllers/conversations.js";
import { GetListHiddenConversation } from "../controllers/conversations.js";
// import { GetListFavorConversation } from "../controllers/conversations.js";  
import { DeleteConv } from "../controllers/conversations.js";
import { DeleteMessageSecret } from "../controllers/conversations.js";
import { TakeListConvLiveChat_v2 } from "../controllers/conversations.js";
import { SearchByDayConvLiveChat_v2 } from "../controllers/conversations.js";
import { ToolCheckDoubleMemberId } from "../controllers/conversations.js";
import { GetListConversationByClassUser } from "../controllers/conversations.js";
import { UpdateLocalFile } from "../controllers/conversations.js";
import { GetCommonConversation } from "../controllers/conversations.js";
import { createUserZalo } from "../controllers/conversations.js";
import { TokenZalo } from "../controllers/conversations.js";
import {
    deleteFileConversation,
    GetListConversationStrange,
    DeleteAllMessageOneSide,
    GetListConversationStrange_v2,
    AddNewMemberToListGroup,
    ChangeAdminGroup,
    AddNewMemberToGroupV2,
    DeleteMemberToGroup,
    GetListRequestAdmin,
    UpdateMemberApproval,
    GetMemberApproval,
    GetListHiddenConversation_v2,
    UpdateDeputyAdmin,
    GetListConversation_v3,
    GetConversationSendCV,
    GetIdMaxConversation,
    //checkFirstMessageUser
} from "../controllers/conversations.js";
import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
    windowMs: 200, // 15 minutes
    limit: 1, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})
const router = express.Router();
router.get("/OptimizeConversation", OptimizeConversation)
router.get("/DeleteConvSpamOptimize", DeleteConvSpamOptimize)
router.get("/OptimizeConversationLiveChatSpam/:conversationId", OptimizeConversationLiveChatSpam)
router.post("/createInterval", formData.parse(), createInterval)
router.post("/clearInterval", formData.parse(), stopInterval)
router.post("/testintervalintimeout", formData.parse(), testIntervalInTimeOut)
router.post("/cleartimeout", formData.parse(), StopIntervalInTimeOut)

router.post("/createcanlerdal", formData.parse(), createCanlerdal)
router.get("/takelistcanlerdal/:userId", takeListCanlerdal) // take all canlerdal of 1 person and check 
router.post("/createnotificationcanledar", formData.parse(), createNotificationCanlerdal)

router.post("/takeallcanlerdal", formData.parse(), takeAllCanlerdal)
router.post("/deleteCanlerdal", formData.parse(), deleteCanlerdal)

router.post("/joinconvoffline", formData.parse(), JoinConversationOffline)
router.get("/DeleteLiveChatConv", DeleteLiveChatConv)
    // Thang
router.post("/GetListConversation_forcespam", formData.parse(), GetListConversation)
router.post("/GetListConversation", formData.parse(), GetListConversation)
router.post("/GetListConversationUnreader", formData.parse(), GetListConversationUnreader)
router.post("/GetListUnreaderConversation", formData.parse(), GetListUnreaderConversation)
router.post("/GetListMemberOfGroup", formData.parse(), GetListMemberOfGroup)
router.post("/ChangeNameGroup", formData.parse(), ChangeNameGroup)
router.post("/ChangeBrowseMemberOfGroup", formData.parse(), ChangeBrowseMemberOfGroup)
router.post("/PinMessage", formData.parse(), PinMessage)
router.post("/UnPinMessage", formData.parse(), UnPinMessage)
router.post("/GetConversation", formData.parse(), GetConversation)
router.post("/OutGroup", formData.parse(), OutGroup)
router.post("/AddToFavoriteConversation", formData.parse(), AddToFavoriteConversation)
router.post("/HiddenConversation", formData.parse(), HiddenConversation)
router.post("/CreateNewConversation", formData.parse(), CreateNewConversation)
router.post("/DeleteConversation", formData.parse(), DeleteConversation)
router.post("/ReadMessage", formData.parse(), ReadMessage)
router.post("/GetListConversationForward", formData.parse(), GetListConversationForward)
router.post("/GetConversationList", formData.parse(), GetConversationList)
router.post("/AddBrowseMember", formData.parse(), AddBrowseMember)
router.post("/MarkUnreader", formData.parse(), MarkUnreader)
router.post("/ChangeNotificationConversation", formData.parse(), ChangeNotificationConversation)
router.post("/RemoveConversation", formData.parse(), RemoveConversation)
router.post("/ChangeShareLinkOfGroup", formData.parse(), ChangeShareLinkOfGroup)
router.post("/AddNewConversation", formData.parse(), AddNewConversation)
router.post("/getAllGroup", formData.parse(), getAllGroup)
router.post("/GetCountConversationUnreader", formData.parse(), GetCountConversationUnreader)
router.post("/CreateNewSecretConversation", formData.parse(), CreateNewSecretConversation)
router.post("/AddNewMemberToGroup", formData.parse(), AddNewMemberToGroup)
router.post("/DeleteBrowse", formData.parse(), DeleteBrowse)
router.post("/CheckReconnectInternet", formData.parse(), CheckReconnectInternet)
router.post("/ReadAllMessage", formData.parse(), ReadAllMessage)
router.post("/GetInfoLiveChat", formData.parse(), GetInfoLiveChat)
router.post("/ChangeAvatarGroup", formData.parse(), ChangeAvatarGroup)
router.post("/ChangeNickName", formData.parse(), ChangeNickName)
router.post("/GetListConversationFavoriteOrder", formData.parse(), GetListConversationFavoriteOrder)
router.post("/GetListConversation_V2", formData.parse(), GetListConversation_V2)
router.post("/DeleteLiveChat", formData.parse(), DeleteLiveChat)
router.post("/CreateNewLiveChat", formData.parse(), function(req, res, next) {
    res.setTimeout(3500, function() {
        return res.status(200).json(createError(201, "Khách hàng đã được hỗ trợ"));
    });
    next();
}, CreateNewLiveChat)
router.post("/SetupDeleteTime", formData.parse(), SetupDeleteTime)
router.post("/OutManyGroup", formData.parse(), OutManyGroup)
router.post("/SetupDeleteTimeV2", formData.parse(), SetupDeleteTimeV2)
router.post("/checkVirtualAccount", formData.parse(), checkVirtualAccount)
router.post("/changeNoTifyConv", formData.parse(), changeNoTifyConv)
router.post("/checkNoTifyConv", formData.parse(), checkNoTifyConv)
router.post("/SetTimechangeNoTifyConv", formData.parse(), SetTimechangeNoTifyConv)
router.post("/UpdateDeleteTime", formData.parse(), UpdateDeleteTime)
router.post("/GetListCall", formData.parse(), GetListCall)
router.post("/DeleteConv", formData.parse(), DeleteConv)

    // router.post("/GetListFavorConversation",formData.parse(), GetListFavorConversation)
router.post("/GetConversation_v2", formData.parse(), GetConversation_v2)
router.post("/DeleteMessageSecret", formData.parse(), DeleteMessageSecret)
router.post("/TakeListConvLiveChat_v2", formData.parse(), TakeListConvLiveChat_v2)
router.post("/SearchByDayConvLiveChat_v2", formData.parse(), SearchByDayConvLiveChat_v2)
router.post("/ToolCheckDoubleMemberId", formData.parse(), ToolCheckDoubleMemberId)
router.post("/GetListConversationByClassUser", formData.parse(), GetListConversationByClassUser)
router.post("/UpdateLocalFile", formData.parse(), UpdateLocalFile)
router.post("/deleteFileConversation", formData.parse(), deleteFileConversation)
router.post("/ChangeAdmin", formData.parse(), ChangeAdmin)
router.post("/DisbandGroup", formData.parse(), DisbandGroup)
router.post("/GetListHiddenConversation", formData.parse(), GetListHiddenConversation)
router.post("/GetListConversationStrange", formData.parse(), GetListConversationStrange)
router.post("/DeleteAllMessageOneSide", formData.parse(), DeleteAllMessageOneSide)
router.post("/GetListConversationStrange_v2", formData.parse(), GetListConversationStrange_v2)
router.post("/GetCommonConversation", formData.parse(), GetCommonConversation)
router.post("/AddNewMemberToListGroup", formData.parse(), AddNewMemberToListGroup)
router.post("/ChangeAdminGroup", formData.parse(), ChangeAdminGroup)
router.post("/AddNewMemberToGroupV2", formData.parse(), AddNewMemberToGroupV2)
router.post("/GetListRequestAdmin", formData.parse(), GetListRequestAdmin)
router.post("/DeleteMemberToGroup", formData.parse(), DeleteMemberToGroup)
router.post("/UpdateMemberApproval", formData.parse(), UpdateMemberApproval)
router.post("/GetMemberApproval", formData.parse(), GetMemberApproval)
router.post("/GetListHiddenConversation_v2", formData.parse(), GetListHiddenConversation_v2)
router.post("/UpdateDeputyAdmin", formData.parse(), UpdateDeputyAdmin)
router.post("/GetListConversation_v3", limiter, formData.parse(), GetListConversation_v3)
router.post("/GetConversationSendCV", formData.parse(), GetConversationSendCV)
router.post("/GetIdMaxConversation", formData.parse(), GetIdMaxConversation)
// router.post("/checkFirstMessageUser", formData.parse(), checkFirstMessageUser)
router.post("/createUserZalo", formData.parse(), createUserZalo)
router.post("/TokenZalo", formData.parse(), TokenZalo)

export default router