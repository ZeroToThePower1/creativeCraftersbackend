import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {  // ✅ Added phone field
        type: String,
        required: false
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied'],
        default: 'unread'
    },
    repliedAt: {
        type: Date
    },
    replyMessage: {
        type: String
    }
}, {
    timestamps: true
});

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
export default ContactMessage;