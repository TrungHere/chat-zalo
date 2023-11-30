import FastMessage from "../models/FastMessage.js";
import multer from 'multer';
import { createError } from "../utils/error.js";
import { urlChat365 } from '../utils/config.js'
import fs from 'fs'
import axios from 'axios'
import FormData from "form-data";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(`/root/app/storage/chat365/uploads`)) {
            fs.mkdirSync(`/root/app/storage/chat365/uploads`);
        }
        cb(null, `/root/app/storage/chat365/uploads`)
    },
    filename: function (req, file, cb) {
        let fileName = 'image.jpg'
        if (!file.originalname.includes('utf-8')) {
            fileName = file.originalname.replace(/[ +!@#$%^&*]/g, '')
        }
        cb(null, Date.now() * 10000 + 621355968000000000 + '-' + fileName);
    }
});

export const upload = multer({
    storage: storage,
})

export const CreateFastMessage = async (req, res, next) => {
    try {
        if (req.body.userId && req.body.title && req.body.message) {
            const userId = Number(req.body.userId)
            const title = req.body.title
            const message = req.body.message
            const image = req.file ? req.file.filename : ''
            let infoImage = {
                TypeFile: null,
                FullName: null,
                FileSizeInByte: null,
                Height: null,
                Width: null,
                SizeFile: null,
                NameDisplay: null
            }
            let formData = new FormData();
            formData.append('dev', 'dev')

            if (title.includes(' ')) {
                return res.status(200).json(createError(200, "Dữ liệu truyền lên không hợp lệ"))
            }
            if (req.file) {
                const sizeFile = req.file.size
                let FileSizeInByte = Number(sizeFile);
                if (Number(sizeFile) < 1024) {
                    FileSizeInByte = `${FileSizeInByte} bytes`;
                }
                else if ((Number(sizeFile) / 1024 >= 1) && (Number(sizeFile) / 1024 < 1024)) {
                    FileSizeInByte = `${String(FileSizeInByte / 1024).split(".")[0]}.${String((FileSizeInByte / 1024) / 1024).split(".")[1].slice(0, 2)} KB`
                }
                else if ((Number(sizeFile) / 1024) / 1024 >= 1) {
                    FileSizeInByte = `${String((FileSizeInByte / 1024) / 1024).split(".")[0]}.${String((FileSizeInByte / 1024) / 1024).split(".")[1].slice(0, 2)} MB`
                }
                let nameDisplay = String(image).split("-")[1];
                if ((String(nameDisplay).trim() != "") && String(nameDisplay).length > 25) {
                    nameDisplay = String(nameDisplay).slice(0, 23);
                }
                infoImage = {
                    TypeFile: 'sendPhoto',
                    FullName: image,
                    FileSizeInByte: FileSizeInByte,
                    Height: 250,
                    Width: 250,
                    SizeFile: sizeFile,
                    NameDisplay: nameDisplay
                }
            }
            const fastMessage = await FastMessage.create({ userId: userId, title: title, message: message, image: image, infoImage: infoImage })
            if (fastMessage) {
                if (fastMessage.image !== '') {
                    fastMessage.image = `${urlChat365()}uploads/${fastMessage.image}`
                    fastMessage._doc.infoImage.pathImage = fastMessage.image
                    formData.append('file', fs.createReadStream(`/root/app/storage/chat365/uploads/${image}`))
                    await axios({
                        method: "post",
                        url: "http://43.239.223.142:9000/api/file/UploadFile",
                        data: formData,
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                }
                else {
                    fastMessage.infoImage = null
                }
                res.json({
                    data: {
                        result: true,
                        message: 'Thêm tin nhắn nhanh thành công',
                        data: fastMessage
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Thêm tin nhắn nhanh thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const EditFastMessage = async (req, res) => {
    try {
        if (req.body.id) {
            let formData = new FormData();
            formData.append('dev', 'dev')
            const id = req.body.id
            const title = req.body.title
            const message = req.body.message
            const image = req.file ? req.file.filename : ''
            const isImage = req.body.isImage ? req.body.isImage : 1
            let infoImage = {
                TypeFile: null,
                FullName: null,
                FileSizeInByte: null,
                Height: null,
                Width: null,
                SizeFile: null,
                NameDisplay: null
            }
            let fastMessage
            if (req.file) {
                const sizeFile = req.file.size
                let FileSizeInByte = Number(sizeFile);
                if (Number(sizeFile) < 1024) {
                    FileSizeInByte = `${FileSizeInByte} bytes`;
                }
                else if ((Number(sizeFile) / 1024 >= 1) && (Number(sizeFile) / 1024 < 1024)) {
                    FileSizeInByte = `${String(FileSizeInByte / 1024).split(".")[0]}.${String((FileSizeInByte / 1024) / 1024).split(".")[1].slice(0, 2)} KB`
                }
                else if ((Number(sizeFile) / 1024) / 1024 >= 1) {
                    FileSizeInByte = `${String((FileSizeInByte / 1024) / 1024).split(".")[0]}.${String((FileSizeInByte / 1024) / 1024).split(".")[1].slice(0, 2)} MB`
                }
                let nameDisplay = String(image).split("-")[1];
                if ((String(nameDisplay).trim() != "") && String(nameDisplay).length > 25) {
                    nameDisplay = String(nameDisplay).slice(0, 23);
                }
                infoImage = {
                    TypeFile: 'sendPhoto',
                    FullName: image,
                    FileSizeInByte: FileSizeInByte,
                    Height: 250,
                    Width: 250,
                    SizeFile: sizeFile,
                    NameDisplay: nameDisplay
                }
                formData.append('file', fs.createReadStream(`/root/app/storage/chat365/uploads/${image}`))
                await axios({
                    method: "post",
                    url: "http://43.239.223.142:9000/api/file/UploadFile",
                    data: formData,
                    headers: { "Content-Type": "multipart/form-data" }
                });
                fastMessage = await FastMessage.findOneAndUpdate({ _id: id }, { title: title, image: image, message: message, infoImage: infoImage }, { new: true })
            }
            else {
                if (isImage == 1) {
                    fastMessage = await FastMessage.findOneAndUpdate({ _id: id }, { title: title, message: message }, { new: true })
                }
                else {
                    fastMessage = await FastMessage.findOneAndUpdate({ _id: id }, { title: title, image: image, message: message, infoImage: infoImage }, { new: true })
                }
            }

            if (fastMessage) {
                if (fastMessage.image !== '') {
                    fastMessage.image = `${urlChat365()}uploads/${fastMessage.image}`
                    fastMessage._doc.infoImage.pathImage = fastMessage.image
                }
                else {
                    fastMessage.infoImage = null
                }
                res.json({
                    data: {
                        result: true,
                        message: 'Sửa tin nhắn nhanh thành công',
                        data: fastMessage
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Sửa tin nhắn nhanh thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const GetFastMessage = async (req, res) => {
    try {
        if (req.body.userId) {
            const userId = Number(req.body.userId)

            const fastMessage = await FastMessage.find({ userId: userId }).limit(20)

            if (fastMessage && fastMessage.length > 0) {
                for (let i = 0; i < fastMessage.length; i++) {
                    if (fastMessage[i].image !== '') {
                        fastMessage[i].image = `${urlChat365()}uploads/${fastMessage[i].image}`
                        fastMessage[i]._doc.infoImage.pathImage = fastMessage[i].image
                    }
                    else {
                        fastMessage[i].infoImage = null
                    }
                }
                res.json({
                    data: {
                        result: true,
                        message: 'Lấy tin nhắn nhanh thành công',
                        data: fastMessage
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Không có tin nhắn nào"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const DeleteFastMessage = async (req, res) => {
    try {
        if (req.params.id) {
            const id = req.params.id

            const fastMessage = await FastMessage.findOneAndDelete({ _id: id })

            if (fastMessage) {
                res.json({
                    data: {
                        result: true,
                        message: 'Xóa tin nhắn thành công',
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Dữ liệu truyền lên không chính xác"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}