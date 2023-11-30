import express from "express";
import { createCalendar } from "../controllers/calendarAppointment.js";
import { editCalendar } from "../controllers/calendarAppointment.js";
import { deleteCalendar } from "../controllers/calendarAppointment.js";
import { getDetailCalendar } from "../controllers/calendarAppointment.js";
import { getAllCalendarOfUserOfConversation } from "../controllers/calendarAppointment.js";
import { getAllCalendarOfUser } from "../controllers/calendarAppointment.js";
import { handleParticipantCalendar } from "../controllers/calendarAppointment.js";
import { getAllCalendarOfConv } from "../controllers/calendarAppointment.js";
import formData from 'express-form-data';
const router = express.Router();

router.post("/createcalendar", formData.parse(), createCalendar)
router.post("/editcalendar", formData.parse(), editCalendar)
router.delete("/deletecalendar/:_id", deleteCalendar)
router.get("/getdetailcalendar/:_id", getDetailCalendar)
router.post("/getallcalendarofuserofconversation", formData.parse(), getAllCalendarOfUserOfConversation)
router.post("/getallcalendarofuser", formData.parse(), getAllCalendarOfUser)
// router.get("/getallcalendarofuser", getAllCalendarOfUser)
router.post("/handleparticipantcalendar", formData.parse(), handleParticipantCalendar)
router.post("/getAllCalendarOfConv", formData.parse(), getAllCalendarOfConv)


export default router