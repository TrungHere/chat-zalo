import express from "express";
import formData from 'express-form-data';
import {
    TransferPicture,
    ChangeSalary,
    NotificationRose,
    SendNewNotification,
    QuitJob,
    ReadNotification,
    ReadAllNotification,
    DeleteAllNotification,
    DeleteNotification,
    SendNotification,
    GetListNotification,
    GetListNotificationV2,
    NotificationChangeProfile,
    NotificationRewardDiscipline,
    NotificationSalary,
    NotificationNewPersonnel,
    SendListNotification,
    NotificationReport,
    NotificationCRM,
    UpdateTokenApp,
    SendNotificationTimekeeping,
    Notification365,
    NotificationAllocation,
    NotificationPersonnelChange,
    SendContractFile,
    SendNewNotification_v2,
    SendNotification_v2,
    SendNotification_v3,
    NotificationOfferSent,
    NotificationOfferReceive,
    NotificationTimviec365
} from "../controllers/notification.js";
const router = express.Router();
router.post("/NotificationTimviec365", formData.parse(), NotificationTimviec365)
router.post("/TransferPicture", formData.parse(), TransferPicture)
router.post("/ChangeSalary", formData.parse(), ChangeSalary);
router.post("/NotificationRose", formData.parse(), NotificationRose)
router.post("/SendNotification", formData.parse(), SendNotification)
router.post("/SendNewNotification", formData.parse(), SendNewNotification)
router.get("/ReadNotification/:IDNotification", ReadNotification)
router.get("/DeleteAllNotification/:userId", DeleteAllNotification)
router.get("/DeleteNotification/:IDNotification", DeleteNotification)
router.get("/ReadAllNotification/:userId", ReadAllNotification)
router.get("/GetListNotification/:userId", GetListNotification)
router.get("/GetListNotificationV2/:userId", GetListNotificationV2)
router.post("/NotificationChangeProfile", formData.parse(), NotificationChangeProfile)
router.post("/NotificationRewardDiscipline", formData.parse(), NotificationRewardDiscipline)
router.post("/NotificationSalary", formData.parse(), NotificationSalary)
router.post("/NotificationNewPersonnel", formData.parse(), NotificationNewPersonnel)
router.post("/QuitJob", formData.parse(), QuitJob)
router.post("/SendListNotification", formData.parse(), SendListNotification)
router.post("/NotificationReport", formData.parse(), NotificationReport)
router.post("/NotificationCRM", formData.parse(), NotificationCRM)
    // router.post("/UpdateTokenApp",formData.parse(),UpdateTokenApp) 
router.post("/SendNotificationTimekeeping", formData.parse(), SendNotificationTimekeeping)
router.post("/Notification365", formData.parse(), Notification365)
router.post("/NotificationAllocation", formData.parse(), NotificationAllocation)
router.post("/NotificationPersonnelChange", formData.parse(), NotificationPersonnelChange)
router.post("/SendContractFile", formData.parse(), SendContractFile)
router.post("/SendNewNotification_v2", formData.parse(), SendNewNotification_v2)
router.post("/SendNotification_v2", formData.parse(), SendNotification_v2)
router.post("/SendNotification_v3", formData.parse(), SendNotification_v3)
router.post("/NotificationOfferSent", formData.parse(), NotificationOfferSent)
router.post("/NotificationOfferReceive", formData.parse(), NotificationOfferReceive)
export default router