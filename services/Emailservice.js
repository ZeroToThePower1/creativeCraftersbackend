// services/Emailservice.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with Gmail configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // false for 587, true for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email service is ready to send emails');
    }
});

export async function sendEmail(to, type, otp) {
    let subject, html;
    
    if (type === "verification") {
        subject = `Verify Your Email - ${process.env.FROM_NAME || 'RPGROUPS'}`;
        html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin: 0;">${process.env.FROM_NAME || 'RPGROUPS'}</h1>
                        <p style="color: #666; margin-top: 5px;">Welcome to our community!</p>
                    </div>
                    
                    <h2 style="color: #555;">Verify Your Email Address</h2>
                    <p>Thank you for signing up! Please use the OTP below to verify your email address:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; border-radius: 5px; margin: 25px 0;">
                        ${otp}
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>5 minutes</strong>.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                    
                    <p style="color: #888; font-size: 12px; text-align: center;">
                        © 2024 ${process.env.FROM_NAME || 'RPGROUPS'}. All rights reserved.<br>
                        This is an automated message, please do not reply.
                    </p>
                </div>
            </div>
        `;
    } else if (type === "password-reset") {
        subject = `Password Reset Request - ${process.env.FROM_NAME || 'RPGROUPS'}`;
        html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #555;">Password Reset Request</h2>
                    <p>You requested to reset your password. Use the OTP below:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 25px 0;">
                        ${otp}
                    </div>
                    
                    <p>This OTP is valid for <strong>5 minutes</strong>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                    <p style="color: #888; font-size: 12px; text-align: center;">
                        © 2024 ${process.env.FROM_NAME || 'RPGROUPS'}. All rights reserved.
                    </p>
                </div>
            </div>
        `;
    }
    
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log(`✅ Email sent to ${to}`);
        console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        throw error;
    }
}