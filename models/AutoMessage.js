import mongoose from 'mongoose';
const AutoMessageSchema = new mongoose.Schema(
    {
        newId: {
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
        options: {
            type: Array,
            default: [],
        },
    },
    { collection: 'AutoMessage', versionKey: false }
);

export default mongoose.model('AutoMessage', AutoMessageSchema);
