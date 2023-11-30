import mongoose from "mongoose";
const CalendarAppointment = new mongoose.Schema(
    {
        senderId: {
            type: Number,
            required: true
        },
        conversationId: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        emotion: {
            type: String,
            default: ''
            // required: true
        },
        createTime: {  //lưu thời gian dưới dạng ngày dương cả
            type: Date,
            required: true
        },
        type: {  // norepeat everyday everyweek 0,1,2,3,4,5,6, everymonth everyyear
            type: String,
            required: true
        },
        timeDoned: {
            type: Date
        },
        typeDate: {
            type: String,  //lunarCalendar solarCalendar
            required: true
        },
        schedule: {
            type: Number,
            default: 0,
            required: true
        },
        participant: {
            type: Array,
            default: []
        },
        noParticipant: {
            type: Array,
            default: []
        },
        messageId: {
            type: String,
            default: "",
        }
    },
    {
        collection: 'CalendarAppointment',
        versionKey: false   // loai bo version key 
    }
);

export default mongoose.model("CalendarAppointment", CalendarAppointment);