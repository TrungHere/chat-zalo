import express from 'express';
import formData from 'express-form-data';

import { createPost } from '../controllers/personal.js';
import { deletePost } from '../controllers/personal.js';
import { getPost } from '../controllers/personal.js';
import { getAllPost } from '../controllers/personal.js';
import { editPost } from '../controllers/personal.js';
import { createAlbum } from '../controllers/personal.js';
import { editAlbum } from '../controllers/personal.js';
import { deleteAlbum } from '../controllers/personal.js';
import { getAlbum } from '../controllers/personal.js';
import { backgroundImg } from '../controllers/personal.js';
import { createComment } from '../controllers/personal.js';
import { updateComment } from '../controllers/personal.js';
import { deleteComment } from '../controllers/personal.js';
import { releaseEmotion } from '../controllers/personal.js';
import { countFile } from '../controllers/personal.js';
import { emotionFile } from '../controllers/personal.js';
import { getAllAlbum } from '../controllers/personal.js';
import { tagPersonal } from '../controllers/personal.js';
import { untagPersonal } from '../controllers/personal.js';
import { GetListLibra } from '../controllers/personal.js';
import { GetComments } from '../controllers/personal.js';
import { GetAllIdPost } from '../controllers/personal.js';
import { GetListLibraApp } from '../controllers/personal.js';
import { GetPostsFriend } from '../controllers/personal.js';
import { deleteFileAlbum } from '../controllers/personal.js';
import { changeDescription } from '../controllers/personal.js';
import { GetListFavorLibra } from '../controllers/personal.js';
import { GetListCommentLibra } from '../controllers/personal.js';
import { getAllPostHistoryOneYear } from '../controllers/personal.js';
import { InsertBase } from '../controllers/personal.js';
import { ShareImg } from '../controllers/personal.js';
import { uploadfiles } from '../controllers/file.js';
// import { UploadFilePersonal } from "../controllers/personal.js";
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post('/createpost', upload.array('file'), createPost);
router.post('/deletepost/:id', formData.parse(), deletePost);
router.get('/getpost/:_id', getPost);
router.post('/getAllPost', formData.parse(), getAllPost);
router.post('/editpost/:id', upload.array('file'), editPost);
router.post('/createalbum', upload.array('file'), createAlbum);
router.post('/editalbum/:id', upload.array('file'), editAlbum);
router.delete('/deletealbum/:id', deleteAlbum);
router.get('/getalbum/:_id', getAlbum);
router.post('/backgroundImg', upload.array('img'), backgroundImg);
router.post('/createcomment', upload.single('image'), createComment);
router.post('/updateComment', upload.single('image'), updateComment);
router.delete('/deleteComment', formData.parse(), deleteComment);
router.post('/releaseemotion', formData.parse(), releaseEmotion);
router.get('/countfile/:userId', countFile);
router.post('/emotionfile', formData.parse(), emotionFile);
router.post('/getAllAlbum', formData.parse(), getAllAlbum);
router.post('/tagPersonal', formData.parse(), tagPersonal);
router.post('/untagPersonal', formData.parse(), untagPersonal);
router.post('/GetListLibra', formData.parse(), GetListLibra);
router.post('/GetComments', formData.parse(), GetComments);
router.get('/GetAllIdPost/:userId', GetAllIdPost);
router.post('/GetListLibraApp', formData.parse(), GetListLibraApp);
router.post('/GetPostsFriend', formData.parse(), GetPostsFriend);
router.post('/deleteFileAlbum', formData.parse(), deleteFileAlbum);
router.post('/changeDescription', formData.parse(), changeDescription);
router.post('/GetListFavorLibra', formData.parse(), GetListFavorLibra);
router.post('/GetListCommentLibra', formData.parse(), GetListCommentLibra);
router.post('/InsertBase', formData.parse(), InsertBase);
router.post('/ShareImg', formData.parse(), ShareImg);
router.get(
    '/getAllPostHistoryOneYear/:userId/:IdSeen/:listpost',
    getAllPostHistoryOneYear
);
// router.post('/UploadFilePersonal', uploadfiles.array('files'), UploadFilePersonal)
export default router;
