import express from "express";
import { CreateFastMessage } from "../controllers/fastMessage.js";
import { EditFastMessage } from "../controllers/fastMessage.js";
import { GetFastMessage } from "../controllers/fastMessage.js";
import { DeleteFastMessage } from "../controllers/fastMessage.js";
import { upload } from "../controllers/fastMessage.js";
import formData from 'express-form-data';

const router = express.Router();
router.post("/CreateFastMessage", upload.single('image'), CreateFastMessage)
router.post("/EditFastMessage", upload.single('image'), EditFastMessage)
router.post("/GetFastMessage", formData.parse(), GetFastMessage)
router.delete("/DeleteFastMessage/:id", DeleteFastMessage)

export default router