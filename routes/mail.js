import express from "express";
import formData from 'express-form-data';
import {sendMailJob3sApi} from "../controllers/mail.js";
// import {sendMailMarketing142} from "../controllers/mail.js"; 

const router = express.Router();
router.post("/sendMailJob3sApi",formData.parse(),sendMailJob3sApi) 
// router.post("/sendMailMarketing142",formData.parse(),sendMailMarketing142);

export default router