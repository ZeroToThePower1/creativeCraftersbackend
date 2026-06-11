import mongoose from "mongoose";

const contactSettingsSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "Get in Touch"
    },
    subtitle: {
        type: String,
        default: "We'd Love to Hear From You"
    },
    description: {
        type: String,
        default: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
    },
    contactInfo: [{
        type: {
            type: String,
            enum: ['phone', 'email', 'address', 'hours'],
            required: true
        },
        label: String,
        value: String,
        link: String,
        icon: String
    }],
    socialLinks: [{
        platform: {
            type: String,
            enum: ['Twitter', 'Instagram', 'Discord', 'YouTube', 'Facebook'],
            required: true
        },
        url: String,
        icon: String,
        order: Number
    }],
    faq: [{
        question: String,
        answer: String,
        order: Number
    }],
    newsletterEnabled: {
        type: Boolean,
        default: true
    },
    newsletterTitle: {
        type: String,
        default: "Stay Updated"
    },
    newsletterDescription: {
        type: String,
        default: "Subscribe to our newsletter for exclusive offers, new product announcements, and RPG tips."
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const ContactSettings = mongoose.model("ContactSettings", contactSettingsSchema);
export default ContactSettings;