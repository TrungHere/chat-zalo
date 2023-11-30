import mongoose from 'mongoose';
const AdsMessageSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
        },
        userId: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            default: '',
        },
        createdAt: {
            type: Number,
            default: 0,
        },
        updatedAt: {
            type: Number,
            default: 0,
        },
        deletedAt: {
            type: Number,
            default: 0,
        },
        isDelete: {
            type: Number,
            default: 0,
        },
        image: {
            type: Array,
            default: [],
        },
    },
    { collection: 'AdsMessage', versionKey: false }
);

export default mongoose.model('AdsMessage', AdsMessageSchema);
