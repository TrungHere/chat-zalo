import Privacy from "../models/Privacy.js";
import User from "../models/User.js";
import { createError } from "../utils/error.js";
import { urlImgHost } from '../utils/config.js'
import { checkToken } from "../utils/checkToken.js";
import { GetAvatarUser } from "../utils/GetAvatarUser.js"
import { GetAvatarUserSmall } from "../utils/GetAvatarUser.js"
//Tao bang quyen rieng tu
export const CreateNewPrivacy = async (req, res, next) => {
    try {
        const userId = Number(req.body.userId || req.body.ID)
        const privacy = await Privacy.findOne({ userId: userId }, { _id: 1 })
        if (!privacy) {
            const formData = {}
            formData.userId = userId
            const result = new Privacy(formData);
            await result.save()
            next()
        }
        else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Thay doi trang thai
export const ChangeActive = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.ID)) {
                console.log("Token hop le, ChangeActive")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.ID && req.body.Active) {
            const userId = Number(req.body.ID)
            const active = Number(req.body.Active)

            const result = await User.findOneAndUpdate({ _id: userId }, { active: active }, { _id: 1 })
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật trạng thái thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Id không tồn tại"))
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

//Thay doi hien thi ngay sinh
export const ChangeShowDateOfBirth = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, ChangeShowDateOfBirth")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.showDateOfBirth) {
            const userId = Number(req.body.userId)
            const showDateOfBirth = Number(req.body.showDateOfBirth)

            const result = await Privacy.findOneAndUpdate({ userId: userId }, { showDateOfBirth: showDateOfBirth }, { _id: 1 })

            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật hiển thi ngày sinh thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Cập nhật hiển thị ngày sinh thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Bo chan tin nhan
export const UnblockMessage = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UnblockMessage")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.userBlocked) {
            const userId = Number(req.body.userId)
            const userBlocked = Number(req.body.userBlocked)

            const result = await Privacy.updateOne({ userId: userId }, { $pull: { blockMessage: userBlocked } })

            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Bỏ chặn tin nhắn thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Bỏ chặn tin nhắn thất bại"));
            }
        }
        else {
            res.status(200).json(createError(200, "userId không tồn tại"));
        }
    } catch (er) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//Chan tin nhan
export const BlockMessage = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, BlockMessage")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.userBlocked) {
            const userId = Number(req.body.userId)
            const userBlocked = Number(req.body.userBlocked)

            const result = await Privacy.updateOne({ userId: userId, blockMessage: { $ne: userBlocked } }, { $push: { blockMessage: userBlocked } })
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Chặn tin nhắn thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Chặn tin nhắn thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Lay danh sach nguoi dung bi chan tin nhan
export const GetListBlockMessage = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, GetListBlockMessage")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.type) {
            if (req.body.type == 1) {
                const result = []
                const userId = Number(req.body.userId)

                const privacy = await Privacy.findOne({ userId: userId }, { blockMessage: 1 })

                if (privacy) {
                    for (let i = 0; i < privacy.blockMessage.length; i++) {
                        const user = await User.findOne({ _id: privacy.blockMessage[i] }, { userName: 1, avatarUser: 1, id365: '$idQLC', type365: '$type', _id: 1, fromWeb: 1, createdAt: 1, })
                        // if (user.avatarUser !== '') {
                        //     user.avatarUser = `${urlImgHost()}avatarUser/${user._id}/${user.avatarUser}`
                        // }
                        // else {
                        //     user.avatarUser = `${urlImgHost()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        // }
                        user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                        user.avatarUser = GetAvatarUser(user._id, user.type365, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                        result.push(user)
                    }
                    res.json({
                        data: {
                            result: true,
                            message: 'Lấy danh sách chặn tin nhắn thành công',
                            data: result
                        },
                        error: null
                    })
                }
                else {
                    res.status(200).json(createError(200, "userId không tồn tại"))
                }

            }

            if (req.body.type == 2) {
                const result = []
                const userId = Number(req.body.userId)

                const privacy = await Privacy.find({ blockMessage: userId }, { blockMessage: 1, userId: 1 })

                for (let i = 0; i < privacy.length; i++) {

                    const user = await User.findOne({ _id: privacy[i].userId }, { userName: 1, avatarUser: 1, id365: '$idQLC', type365: '$type', fromWeb: 1, _id: 1, createdAt: 1, })
                    // if (user.avatarUser !== '') {
                    //     user.avatarUser = `${urlImgHost()}avatarUser/${user._id}/${user.avatarUser}`
                    // }
                    // else {
                    //     user.avatarUser = `${urlImgHost()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    // }
                    user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                    user.avatarUser = GetAvatarUser(user._id, user.type365, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                    result.push(user)
                }
                if (result) {
                    res.json({
                        data: {
                            result: true,
                            message: 'Lấy danh sách chặn tin nhắn của mình thành công',
                            data: result
                        },
                        error: null
                    })
                } else res.status(200).json(createError(200, "không có người chặn tin nhắn mình"))
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

//Kiem tra 2 nguoi dung co chan tin nhan nhau khong
export const CheckBlockMessage = async (req, res, next) => {
    try {
        if (req.body.userId1 && req.body.userId2) {
            const userId1 = Number(req.body.userId1)
            const userId2 = Number(req.body.userId2)
            const result = await Privacy.findOne({
                $or: [
                    { userId: userId1, blockMessage: userId2 },
                    { userId: userId2, blockMessage: userId1 }
                ]
            })
            if (result) {
                res.send(true)
            }
            else {
                res.send(false)
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        console.log(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Bo chan xem tin dang
export const UnblockPost = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UnblockPost")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.userBlocked) {
            const userId = Number(req.body.userId)
            const userBlocked = Number(req.body.userBlocked)

            const result = await Privacy.updateOne({ userId: userId }, { $pull: { blockPost: userBlocked } })

            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Bỏ chặn tin đăng thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Bỏ chặn tin đăng thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"));
        }
    } catch (er) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//Chan xem tin dang
export const BlockPost = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, BlockPost")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.userBlocked) {
            const userId = Number(req.body.userId)
            const userBlocked = Number(req.body.userBlocked)

            const result = await Privacy.updateOne({ userId: userId, blockPost: { $ne: userBlocked } }, { $push: { blockPost: userBlocked } })
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Chặn xem tin đăng thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Chặn xem tin đăng thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Lay danh sach nguoi dung bi chan xem tin dang
export const GetListBlockPost = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, GetListBlockPost")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId) {
            const result = []
            const userId = Number(req.body.userId)

            const privacy = await Privacy.findOne({ userId: userId }, { blockPost: 1 })

            if (privacy) {
                for (let i = 0; i < privacy.blockPost.length; i++) {
                    const user = await User.findOne({ _id: privacy.blockPost[i] }, {_id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                    // if (user.avatarUser !== '') {
                    //     user.avatarUser = `${urlImgHost()}avatarUser/${user._id}/${user.avatarUser}`
                    // }
                    // else {
                    //     user.avatarUser = `${urlImgHost()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    // }
                    user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                    user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                    result.push(user)
                }
                res.json({
                    data: {
                        result: true,
                        message: 'Lấy danh sách chặn tin nhắn thành công',
                        data: result
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "userId không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Bo an tin dang
export const UnhidePost = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, UnhidePost")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.userBlocked) {
            const userId = Number(req.body.userId)
            const userBlocked = Number(req.body.userBlocked)

            const result = await Privacy.updateOne({ userId: userId }, { $pull: { hidePost: userBlocked } })

            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Bỏ ẩn tin đăng thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Bỏ ẩn tin đăng thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "userId không tồn tại"));
        }
    } catch (er) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

//Chan an tin dang
export const HidePost = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, HidePost")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId && req.body.userBlocked) {
            const userId = Number(req.body.userId)
            const userBlocked = Number(req.body.userBlocked)

            const result = await Privacy.updateOne({ userId: userId, hidePost: { $ne: userBlocked } }, { $push: { hidePost: userBlocked } })
            if (result) {
                res.json({
                    data: {
                        result: true,
                        message: 'Ẩn tin đăng thành công'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Ẩn tin đăng thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Lay danh sach nguoi dung bi an tin dang
export const GetListHidePost = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, GetListHidePost")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId) {
            const result = []
            const userId = Number(req.body.userId)

            const privacy = await Privacy.findOne({ userId: userId }, { hidePost: 1 })

            if (privacy) {
                for (let i = 0; i < privacy.hidePost.length; i++) {
                    const user = await User.findOne({ _id: privacy.hidePost[i] }, { _id: 1, userName: 1, avatarUser: 1, createdAt: 1, fromWeb: 1, type: 1, })
                    // if (user.avatarUser !== '') {
                    //     user.avatarUser = `${urlImgHost()}avatarUser/${user._id}/${user.avatarUser}`
                    // }
                    // else {
                    //     user.avatarUser = `${urlImgHost()}avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    // }
                    user.avatarUserSmall = GetAvatarUserSmall(user._id, user.userName, user.avatarUser)
                    user.avatarUser = GetAvatarUser(user._id, user.type, user.fromWeb, user.createdAt , user.userName, user.avatarUser)
                    result.push(user)
                }
                res.json({
                    data: {
                        result: true,
                        message: 'Lấy danh sách ẩn tin đăng thành công',
                        data: result
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "userId không tồn tại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Api xem sbài đăng
export const ChangeShowPost = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, ChangeShowPost")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId)
        const post = req.body.post

        const privacy = await Privacy.findOneAndUpdate({ userId: userId }, { post: post }, { new: true })

        if (privacy) {
            res.json({
                data: {
                    result: true,
                    message: 'Cập nhật thời gian xem bài đăng thành công',
                    data: privacy
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Cập nhật thời gian xem bài đăng thất bại"))
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Api Quyen rieng tu tin nhan
export const ChangeChat = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, ChangeChat")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId)
        const chat = Number(req.body.chat)

        const privacy = await Privacy.findOneAndUpdate({ userId: userId }, { chat: chat }, { new: true })

        if (privacy) {
            res.json({
                data: {
                    result: true,
                    message: 'Cập nhật thành công',
                    data: privacy
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Cập nhật thất bại"))
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//Api quyen rieng tu goi dien
export const ChangeCall = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, ChangeCall")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        const userId = Number(req.body.userId)
        const call = Number(req.body.call)

        const privacy = await Privacy.findOneAndUpdate({ userId: userId }, { call: call }, { new: true })

        if (privacy) {
            res.json({
                data: {
                    result: true,
                    message: 'Cập nhật thành công',
                    data: privacy
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Cập nhật thất bại"))
        }
    } catch (err) {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

export const GetPrivacy = async (req, res, next) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, GetPrivacy")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId) {
            const userId = Number(req.body.userId)

            const privacy = await Privacy.findOne({ userId: userId })
            const user = await User.findOne({ _id: userId }, { active: '$configChat.active' })
            if (privacy && user) {
                privacy._doc.active = user._doc.active
                res.json({
                    data: {
                        result: true,
                        message: 'Lấy thông tin thành công',
                        data: privacy
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Người dùng không tồn tại"))
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

export const SearchSource = async (req, res) => {
    try {
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && (check.userId == req.body.userId)) {
                console.log("Token hop le, SearchSource")
            }
            else {
                return res.status(404).json(createError(404, "Invalid token"));
            }
        }
        if (req.body.userId) {
            const searchSource = {}
            const userId = Number(req.body.userId)
            searchSource.searchByPhone = Number(req.body.searchByPhone)
            searchSource.qrCode = Number(req.body.qrCode)
            searchSource.generalGroup = Number(req.body.generalGroup)
            searchSource.businessCard = Number(req.body.businessCard)
            searchSource.suggest = Number(req.body.suggest)

            const privacy = await Privacy.findOneAndUpdate({ userId: userId }, { searchSource: searchSource }, { new: true })
            if (privacy) {
                res.json({
                    data: {
                        result: true,
                        message: 'Cập nhật thành công',
                        data: privacy
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Cập nhật thất bại"))
            }
        }
        else {
            res.status(200).json(createError(200, "Thiếu thông tin truyền lên"))
        }
    } catch {
        console.error(err)
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

// const ShowPersonal = async (userId) => {
//     const show = await Privacy.findOne({ userId: userId }, { post: 1 })
//     if (show) {
//         if (show.post === '0') {
//             const date = new Date(0)
//             return date
//         }
//         else if (show.post === '1') {
//             const date = new Date()
//             date.setMonth(date.getMonth() - 6)
//             return date
//         }
//         else if (show.post === '2') {
//             const date = new Date()
//             date.setMonth(date.getMonth() - 1)
//             return date
//         }
//         else if (show.post === '3') {
//             const date = new Date()
//             date.setDate(date.getDate() - 7)
//             return date
//         }
//         else {
//             const date = new Date(show.post)
//             return date
//         }
//     }
//     else {
//         return false
//     }
// }

// const showDateOfBirth = async (userId, time) => {
//     const show = await Privacy.findOne({ userId: userId }, { showDateOfBirth: 1 })

//     if (show.showDateOfBirth === 1) {
//         return null
//     }
//     else if (show.showDateOfBirth === 2) {
//         return date.format(time, 'DD/MM/YYYY ')
//     }
//     else {
//         return date.format(time, 'DD/MM')
//     }
// }