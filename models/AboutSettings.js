import mongoose from "mongoose";

const aboutSettingsSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "About Creative Crafters RPGROUPS"
    },
    tagline: {
        type: String,
        default: "Bringing Fantasy Worlds to Life Since 2020"
    },
    description: {
        type: String,
        default: "We are a passionate team of RPG enthusiasts, artists, and craftspeople dedicated to providing high-quality products for tabletop gaming communities."
    },
    story: {
        type: String,
        default: "Founded in 2020, Creative Crafters RPGROUPS was born from a passion for tabletop gaming..."
    },
    stats: [{
        number: String,
        label: String,
        icon: String
    }],
    values: [{
        title: String,
        description: String,
        icon: String
    }],
    team: [{
        name: String,
        role: String,
        bio: String,
        image: {                           // ✅ ADD THIS FIELD
            type: String,
            default: ""
        },
        socialLinks: {
            twitter: String,
            instagram: String,
            linkedin: String
        }
    }],
    socialLinks: [{
        platform: String,
        url: String,
        icon: String,
        order: Number
    }],
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const AboutSettings = mongoose.model("AboutSettings", aboutSettingsSchema);
export default AboutSettings;