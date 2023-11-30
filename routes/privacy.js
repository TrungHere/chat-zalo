import express from "express";
import { CreateNewPrivacy } from "../controllers/privacy.js";
import { ChangeActive } from "../controllers/privacy.js";
import { ChangeShowPost } from "../controllers/privacy.js";
import { UnblockMessage } from "../controllers/privacy.js";
import { BlockMessage } from "../controllers/privacy.js";
import { GetListBlockMessage } from "../controllers/privacy.js";
import { CheckBlockMessage } from "../controllers/privacy.js";
import { UnblockPost } from "../controllers/privacy.js";
import { BlockPost } from "../controllers/privacy.js";
import { GetListBlockPost } from "../controllers/privacy.js";
import { UnhidePost } from "../controllers/privacy.js";
import { HidePost } from "../controllers/privacy.js";
import { GetListHidePost } from "../controllers/privacy.js";
import { ChangeShowDateOfBirth } from "../controllers/privacy.js";
import { ChangeChat } from "../controllers/privacy.js";
import { ChangeCall } from "../controllers/privacy.js"; 
import { GetPrivacy } from "../controllers/privacy.js";
import { SearchSource } from "../controllers/privacy.js";
//import { ChangeSeenMessage } from "../controllers/privacy.js";
//import { ChangeStatusOnline } from "../controllers/privacy.js";
import formData from 'express-form-data';

const router = express.Router();
router.post("/ChangeActive", formData.parse(),  ChangeActive)
router.post("/ChangeShowPost", formData.parse(), CreateNewPrivacy, ChangeShowPost)
router.post("/UnblockMessage", formData.parse(), CreateNewPrivacy, UnblockMessage)
router.post("/BlockMessage", formData.parse(), CreateNewPrivacy, BlockMessage)
router.post("/GetListBlockMessage", formData.parse(), CreateNewPrivacy, GetListBlockMessage)
router.post("/CheckBlockMessage", formData.parse(), CheckBlockMessage)
router.post("/UnblockPost", formData.parse(), CreateNewPrivacy, UnblockPost)
router.post("/BlockPost", formData.parse(), CreateNewPrivacy, BlockPost)
router.post("/GetListBlockPost", formData.parse(), CreateNewPrivacy, GetListBlockPost)
router.post("/UnhidePost", formData.parse(), CreateNewPrivacy, UnhidePost)
router.post("/HidePost", formData.parse(), CreateNewPrivacy, HidePost)
router.post("/GetListHidePost", formData.parse(), CreateNewPrivacy, GetListHidePost)
router.post("/ChangeChat", formData.parse(), CreateNewPrivacy, ChangeChat)
router.post("/ChangeCall", formData.parse(), CreateNewPrivacy, ChangeCall)
router.post("/GetPrivacy", formData.parse(), CreateNewPrivacy, GetPrivacy)
router.post("/SearchSource", formData.parse(), CreateNewPrivacy, SearchSource)
router.post("/ChangeShowDateOfBirth", formData.parse(), CreateNewPrivacy, ChangeShowDateOfBirth)
//router.post("/ChangeSeenMessage", formData.parse(), CreateNewPrivacy, ChangeSeenMessage)
//router.post("/ChangeStatusOnline", formData.parse(), CreateNewPrivacy, ChangeStatusOnline)
export default router