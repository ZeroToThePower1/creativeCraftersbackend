// services/Emailservice.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Force IPv4 (disable IPv6)
dns.setDefaultResultOrder('ipv4first');

// Create transporter with IPv4 preference
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    // Add connection options
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Force node to use IPv4
    localAddress: '0.0.0.0'
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
        console.error('Please check your SMTP settings in .env file');
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
    } else if (type === "welcome") {
        subject = `Welcome to ${process.env.FROM_NAME || 'RPGROUPS'}!`;
        html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin: 0;">${process.env.FROM_NAME || 'RPGROUPS'}</h1>
                        <p style="color: #666; margin-top: 5px;">Welcome aboard! 🎉</p>
                    </div>
                    
                    <h2 style="color: #555;">Welcome to Our Community!</h2>
                    <p>Dear User,</p>
                    <p>Thank you for joining ${process.env.FROM_NAME || 'RPGROUPS'}! We're excited to have you with us.</p>
                    
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #666;">Your account has been successfully verified. You can now:</p>
                        <ul style="color: #666; margin-top: 10px;">
                            <li>Browse our products</li>
                            <li>Place orders</li>
                            <li>Track your shipments</li>
                            <li>Get exclusive offers</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions, feel free to contact our support team.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                    
                    <p style="color: #888; font-size: 12px; text-align: center;">
                        © 2024 ${process.env.FROM_NAME || 'RPGROUPS'}. All rights reserved.
                    </p>
                </div>
            </div>
        `;
    }
    
    try {
        console.log(`📧 Attempting to send ${type} email to ${to}...`);
        
        const info = await transporter.sendMail({
            from: `"${process.env.FROM_NAME || 'RPGROUPS'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log(`✅ Email sent successfully to ${to}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        
        // Log preview URL for ethereal email (useful for testing)
        if (nodemailer.getTestMessageUrl(info)) {
            console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        console.error('📧 Error details:', error);
        
        // Provide more specific error messages
        if (error.code === 'ESOCKET' || error.code === 'ENETUNREACH') {
            console.error('🔧 Network error: Unable to reach email server. Check your internet connection and firewall settings.');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('🔧 Timeout error: Email server is not responding. Check your SMTP settings.');
        } else if (error.code === 'EAUTH') {
            console.error('🔧 Authentication error: Invalid email credentials. Check your SMTP_USER and SMTP_PASS in .env');
        }
        
        throw error;
    }
}

// Optional: Function to test email configuration
export async function testEmailConfiguration() {
    try {
        console.log('🔧 Testing email configuration...');
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        return true;
    } catch (error) {
        console.error('❌ Email configuration test failed:', error.message);
        return false;
    }
}