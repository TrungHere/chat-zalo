import express from "express";
import multer from 'multer';
import { UploadAvatarGroup } from "../controllers/file.js";
import { UploadAvatar } from "../controllers/file.js";
import { UploadFile } from "../controllers/file.js";
import { SetupNewAvatar } from "../controllers/file.js";
import { SetupNewAvatarGroup } from "../controllers/file.js";
import { DownLoadAvatar } from "../controllers/file.js";
import { DownloadAvatarGroup } from "../controllers/file.js";
import { DownloadFile } from "../controllers/file.js";
import { DownloadSmallFile } from "../controllers/file.js";
import { UploadNewAvatar } from "../controllers/file.js";
import { UploadNewAvatarGroup } from "../controllers/file.js";
import { ToolUpdateAvatar } from "../controllers/file.js";
import { UploadNewFile } from "../controllers/file.js";
import { uploadfiles } from "../controllers/file.js";
import { ToolDeleteFile } from "../controllers/file.js";
import { DownloadFileWeb } from "../controllers/file.js";
import formData from 'express-form-data';

const router = express.Router();
const storage = multer.memoryStorage()
const upload = multer({storage});

router.post('/UploadAvatarGroup', upload.single(''), UploadAvatarGroup)
router.post('/UploadAvatar', upload.single(''), UploadAvatar)
router.post('/UploadFile', uploadfiles.any(), UploadFile)
router.get('/SetupNewAvatar', SetupNewAvatar)
router.get('/SetupNewAvatarGroup', SetupNewAvatarGroup)
router.get('/ToolDeleteFile',ToolDeleteFile)
router.get('/DownLoadAvatar/:fileName', DownLoadAvatar)
router.get('/DownloadAvatarGroup/:fileName', DownloadAvatarGroup)
router.get('/DownLoadFile/:fileName', DownloadFile)
router.get('/DownloadSmallFile/:fileName', DownloadSmallFile)
router.post('/UploadNewAvatar', upload.single(''), UploadNewAvatar)
router.get('/ToolUpdateAvatar', ToolUpdateAvatar)
router.post('/UploadNewFile', upload.any(), UploadNewFile)
router.post('/DownloadFileWeb', formData.parse(), DownloadFileWeb)
router.post('/UploadNewAvatarGroup', upload.single(''), UploadNewAvatarGroup)


export default router