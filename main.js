import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import aboutRoutes from './routes/about.js';
import uploadRoutes from './routes/upload.js';
import contactRoutes from './routes/contact.js';


dotenv.config();

import user from './models/user.js';
import { sendEmail } from './services/Emailservice.js';
import productRoutes from './routes/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mongoseLink = process.env.MONGODB_URI;

// Check if MongoDB URI is defined
if (!mongoseLink) {
    console.error('ERROR: MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
// }

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*'
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Use product routes
app.use('/api/products', productRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);

async function connectdb() {
    try {
        await mongoose.connect(mongoseLink);
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
}
connectdb();

function generateOTP(expiry) {
    const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const expiry_Date = new Date(Date.now() + (expiry * 60 * 1000));
    return { otp, expiry_Date };
}

// Temporary storage for pending registrations
const pendingRegistrations = new Map();

// Clean up expired pending registrations every hour
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of pendingRegistrations.entries()) {
        if (data.otpExpire < now) {
            pendingRegistrations.delete(email);
            console.log(`Cleaned up expired registration for ${email}`);
        }
    }
}, 60 * 60 * 1000);

// Clean up unverified users older than 24 hours
async function cleanupUnverifiedUsers() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const result = await user.deleteMany({
            verified: false,
            createdAt: { $lt: twentyFourHoursAgo }
        });
        
        if (result.deletedCount > 0) {
            console.log(`🧹 Cleaned up ${result.deletedCount} unverified users`);
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// Run cleanup every hour
setInterval(cleanupUnverifiedUsers, 60 * 60 * 1000);
cleanupUnverifiedUsers();



// Step 1: Send OTP and store pending registration
app.post('/sendotp', async (req, res) => {
    try {
        const data = req.body;
        const email = data.email;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if user already exists and is verified
        const existingUser = await user.findOne({ email: email });
        if (existingUser && existingUser.verified) {
            return res.status(400).json({ message: "Email already registered and verified" });
        }

        // If user exists but not verified, we can reuse and send new OTP
        if (existingUser && !existingUser.verified) {
            const { otp, expiry_Date } = generateOTP(5);
            
            existingUser.otp = otp;
            existingUser.otpExpire = expiry_Date;
            await existingUser.save();
            
            await sendEmail(email, "verification", otp);
            console.log(`✅ New OTP sent to existing unverified user ${email}: ${otp}`);
            
            return res.status(200).json({ 
                message: "OTP sent successfully. Please verify your email.",
                email: email
            });
        }

        // Check if email is already in pending registration
        if (pendingRegistrations.has(email)) {
            const pending = pendingRegistrations.get(email);
            if (pending.otpExpire > Date.now()) {
                await sendEmail(email, "verification", pending.otp);
                console.log(`✅ Resent OTP to ${email}: ${pending.otp}`);
                return res.status(200).json({ 
                    message: "OTP resent successfully",
                    email: email
                });
            } else {
                pendingRegistrations.delete(email);
            }
        }

        // Generate new OTP
        const { otp, expiry_Date } = generateOTP(5);

        // Send email
        await sendEmail(email, "verification", otp);
        console.log(`✅ OTP sent to ${email}: ${otp}`);

        // Store registration data temporarily
        pendingRegistrations.set(email, {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            address: data.address,
            otp: otp,
            otpExpire: expiry_Date.getTime(),
            createdAt: Date.now()
        });

        res.status(200).json({ 
            message: "OTP sent successfully. Please verify to complete registration.",
            email: email
        });

    } catch (err) {
        console.error('Error in /sendotp:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Step 2: Verify OTP and create user
app.post('/verifyotp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        // First check if user already exists but not verified
        let userDoc = await user.findOne({ email: email });
        
        if (userDoc && !userDoc.verified) {
            if (!userDoc.isOTPValid(otp)) {
                return res.status(400).json({ message: "Invalid or expired OTP" });
            }
            
            userDoc.verified = true;
            userDoc.otp = null;
            userDoc.otpExpire = null;
            await userDoc.save();
            
            const token = jwt.sign(
                {
                    userId: userDoc._id,
                    email: userDoc.email,
                    name: userDoc.name,
                    role: userDoc.role
                },
                process.env.JWT_SECRET || 'fallback-secret-key',
                { expiresIn: '30d' }
            );
            
            return res.status(200).json({
                message: "Email verified successfully",
                token,
                user: {
                    id: userDoc._id,
                    name: userDoc.name,
                    email: userDoc.email,
                    role: userDoc.role
                }
            });
        }
        
        // Check pending registration
        const pending = pendingRegistrations.get(email);
        if (!pending) {
            return res.status(404).json({ message: "No pending registration found. Please start over." });
        }

        // Check if OTP is expired
        if (pending.otpExpire < Date.now()) {
            pendingRegistrations.delete(email);
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        // Verify OTP
        if (pending.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(pending.password, salt);

        // Create user in database
        const newUser = new user({
            name: pending.name,
            email: pending.email,
            phone: pending.phone,
            password: hashedPassword,
            address: pending.address,
            verified: true,
            otp: null,
            otpExpire: null,
            role: 'user'
        });

        const savedUser = await newUser.save();

        // Remove from pending registrations
        pendingRegistrations.delete(email);

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: savedUser._id,
                email: savedUser.email,
                name: savedUser.name,
                role: savedUser.role
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: "Registration completed successfully",
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role
            }
        });

    } catch (err) {
        console.error('Error in /verifyotp:', err);
        
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email or phone already exists" });
        }
        
        res.status(500).json({ message: "Internal server error" });
    }
});

// Resend OTP endpoint
app.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        
        // Check pending registration
        const pending = pendingRegistrations.get(email);
        if (!pending) {
            return res.status(404).json({ message: "No pending registration found" });
        }
        
        // Generate new OTP
        const { otp, expiry_Date } = generateOTP(5);
        
        // Update pending registration
        pending.otp = otp;
        pending.otpExpire = expiry_Date.getTime();
        pendingRegistrations.set(email, pending);
        
        // Send new OTP
        await sendEmail(email, "verification", otp);
        console.log(`✅ New OTP sent to ${email}: ${otp}`);
        
        res.status(200).json({ message: "OTP resent successfully" });
        
    } catch (err) {
        console.error('Error in /resend-otp:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const userDoc = await user.findOne({ email: email });
        if (!userDoc) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (!userDoc.verified) {
            return res.status(401).json({ 
                message: "Please verify your email first. Check your inbox for OTP." 
            });
        }

        const isPasswordValid = await userDoc.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            {
                userId: userDoc._id,
                email: userDoc.email,
                name: userDoc.name,
                role: userDoc.role
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: userDoc._id,
                name: userDoc.name,
                email: userDoc.email,
                phone: userDoc.phone,
                address: userDoc.address,
                role: userDoc.role,
                verified: userDoc.verified
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 API URL: http://localhost:${PORT}`);
    });
}

// ✅ This is what Vercel needs
export default app;
