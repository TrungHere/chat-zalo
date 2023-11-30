import express from "express";
import formData from 'express-form-data';
import { login } from "../controllers/auth.js";
import { confirmlogin } from "../controllers/auth.js";
import { takedatatoverifylogin } from "../controllers/auth.js";  
import { login_v2 } from "../controllers/auth.js"; 
import { confirmotp } from "../controllers/auth.js";
import { takedatatoverifyloginV2 } from "../controllers/auth.js"; 
import { takedatatoverifyloginV3 } from "../controllers/auth.js"; 
import { AcceptLogin } from "../controllers/auth.js"; 
import { refreshtoken } from "../controllers/auth.js";
const router = express.Router();
router.post("/login",formData.parse(),login) 
router.post("/login_v2",formData.parse(),login_v2) 
router.post("/confirmlogin",formData.parse(), confirmlogin)
router.post("/confirmotp",formData.parse(), confirmotp)
router.get("/takedatatoverifylogin/:userId", takedatatoverifylogin);
router.get("/takedatatoverifyloginV2/:userId", takedatatoverifyloginV2)
router.post("/AcceptLogin", formData.parse(), AcceptLogin);
router.post("/refreshtoken", formData.parse(), refreshtoken)
router.get("/takedatatoverifyloginV3/:userId", takedatatoverifyloginV3)
export default router