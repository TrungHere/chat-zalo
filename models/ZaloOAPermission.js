import mongoose from "mongoose";
const crm_Zalo_OA_Permission = new mongoose.Schema({

    _id: { //id bảng
        type: Number,
        require: true
    },
    com_id: { //id công ty
        type: Number,
        default: 0
    },
    idQLC: { //id nhân viên
        type: Number,
        default: 0
    },
    id_OA: { //id OA
        type: NumberLong,
        default: 0
    },
    app_id: { // id ứng dụng liên kết OA
        type: NumberLong,
        default: 0
    },
    secret_key: { //khoá bí mật ứng dụng liên kết OA
        type: String,
        default: ''
    },
    access_token: { //
        type: String,
        default: ''
    },
    refresh_token: { //
        type: String,
        default: ''
    },
    create_at: {
        type: Date,
        default: new Date()
    }
}, {
    collection: 'CRM_Zalo_OA_Permission',
    versionKey: false,
    timestamp: true
})

export default mongoose.model("CRM_Zalo_OA_Permission", crm_Zalo_OA_Permission);
