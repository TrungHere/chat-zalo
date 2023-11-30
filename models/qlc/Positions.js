import mongoose from "mongoose";
// let ContactConversation = mongoose.createConnection('mongodb://localhost:27017/api-base365');

const Positionschema = new mongoose.Schema({
    id: { // id bảng
        type: Number,
        require: true
    },
    comId: { // id công ty
        type: Number,
        require: true
    },

    positionName: { // tên chức vụ
        type: String,
        require: true
    },
    level: {
        type: Number,
        require: true
    },
    isManager: {
        type: Number,
        require: true,
        default: 0
    },
    created_time: {
        type: Number,
        default: 0
    },
    update_time: {
        type: Number,
        default: 0
    }

}, {
    collection: 'QLC_Positions',
    versionKey: false   // loai bo version key 
})


export default mongoose.model("QLC_Positions", Positionschema);
// export default ContactConversation.model("Contact", ContactSchema);