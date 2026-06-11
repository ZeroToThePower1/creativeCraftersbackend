import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,  
        trim: true        
    },
    phone:{
        type:String,
        required: true,
        unique: true  // Add this to make phone unique too
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        default: ''
    }, 
    verified:{
        type:Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true
    },
    otp: String,
    otpExpire: Date

}, {
    timestamps: true  
});

// REMOVE THE ENTIRE pre('save') middleware - don't use it
// We'll hash passwords manually in the route instead

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!candidatePassword || !this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if OTP is valid
userSchema.methods.isOTPValid = function(enteredOTP) {
    if (!this.otp || !this.otpExpire) return false;
    if (this.otpExpire < Date.now()) return false;
    return this.otp === enteredOTP;
};

const User = mongoose.model("User", userSchema);
export default User;