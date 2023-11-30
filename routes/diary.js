import express from "express";
import { createPostDiary } from "../controllers/diary.js";
import { deletePostDiary } from "../controllers/diary.js";
import { getAllPostDiary } from "../controllers/diary.js";
import { getPostDiary } from "../controllers/diary.js";
import { editPostDiary } from "../controllers/diary.js";
import { releaseEmotion } from "../controllers/diary.js";
import { createAlbumDiary } from "../controllers/diary.js";
import { editAlbumDiary } from "../controllers/diary.js";
import { getAllAlbumDiary } from "../controllers/diary.js";
import { deleteAlbumDiary } from "../controllers/diary.js";
import { UploadBackgroundDiary } from "../controllers/diary.js";
import { GetBackgroundDiary } from "../controllers/diary.js";
// import { upload } from "../controllers/diary.js";
import formData from 'express-form-data';
import { GetComments } from "../controllers/diary.js";
import multer from 'multer';
const storage = multer.memoryStorage()
const upload = multer({storage});
const router = express.Router();


router.post('/createpostdiary', upload.array('files'), createPostDiary) 
router.delete('/deletepostdiary/:id', deletePostDiary)
router.post('/editpostdiary', upload.array('files') , editPostDiary)
router.get('/getallpostdiary/:conversationId/:userSeenId', getAllPostDiary)
router.get('/getpostdiary/:_id', getPostDiary)
router.post('/releaseemotion', formData.parse(), releaseEmotion)
router.post('/createAlbumDiary', upload.array('files'), createAlbumDiary) 
router.post('/editAlbumDiary', upload.array('files') , editAlbumDiary) 
router.get('/getAllAlbumDiary/:conversationId/:userSeenId', getAllAlbumDiary)
router.delete('/deleteAlbumDiary/:id', deleteAlbumDiary)
router.post('/GetComments',formData.parse(), GetComments) 
router.post('/UploadBackgroundDiary', upload.single('background'), UploadBackgroundDiary) 
router.post('/GetBackgroundDiary', formData.parse(), GetBackgroundDiary) 

export default router