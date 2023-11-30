import mongoose from "mongoose";
// let ContactConversation = mongoose.createConnection('mongodb://localhost:27017/api-base365');

const DeparmentSchema = new mongoose.Schema({
    //ID phòng ban
    dep_id: {
        type: Number,
        required: true
    },
    //ID công ty của phòng ban
    com_id: {
        type: Number,
    },
    dep_name: {
        type: String,
    },
    //Ngày lập phòng ban
    dep_create_time: {
        type: Date,
        default: Date.now()
    },
    //ID Trưởng phòng 
    manager_id: {
        type: Number,
        default: 0
    },
    dep_order: {
        type: Number,
        default: 0
    }
}, {
    collection: 'QLC_Deparments',
    versionKey: false   // loai bo version key 
})

export default mongoose.model("QLC_Deparments", DeparmentSchema);
// export default ContactConversation.model("Contact", ContactSchema);