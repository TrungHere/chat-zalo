import express from "express";
import formData from 'express-form-data';
import { LogsSocketExceptionWpf } from "../controllers/logs.js";
const router = express.Router();
router.post("/LogsSocketExceptionWpf",formData.parse(),LogsSocketExceptionWpf) 
export default router