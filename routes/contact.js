import express from 'express';
import ContactSettings from '../models/ContactSettings.js';
import ContactMessage from '../models/ContactMessage.js'; // ✅ Add this import
import { authenticateAdmin } from '../middleware/authenticator.js';

const router = express.Router();

// Get contact settings (public)
router.get('/', async (req, res) => {
    try {
        let settings = await ContactSettings.findOne();
        
        if (!settings) {
            // Create default settings if none exist
            settings = new ContactSettings({
                title: "Get in Touch",
                subtitle: "We'd Love to Hear From You",
                description: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
                contactInfo: [
                    { type: "phone", label: "Phone", value: "+1 (555) 123-4567", link: "tel:+15551234567", icon: "phone" },
                    { type: "email", label: "Email", value: "support@creativecrafters.com", link: "mailto:support@creativecrafters.com", icon: "mail" },
                    { type: "address", label: "Address", value: "123 Creative Street, Gaming City, GC 12345", link: null, icon: "map" },
                    { type: "hours", label: "Business Hours", value: "Monday - Friday: 9AM - 6PM", link: null, icon: "clock" }
                ],
                socialLinks: [
                    { platform: "Twitter", url: "https://twitter.com/creativecrafters", icon: "twitter", order: 1 },
                    { platform: "Instagram", url: "https://instagram.com/creativecrafters", icon: "instagram", order: 2 },
                    { platform: "Discord", url: "https://discord.gg/creativecrafters", icon: "discord", order: 3 },
                    { platform: "YouTube", url: "https://youtube.com/creativecrafters", icon: "youtube", order: 4 }
                ],
                faq: [
                    { question: "What is your return policy?", answer: "We offer a 30-day return policy for unused items in original packaging.", order: 1 },
                    { question: "How long does shipping take?", answer: "Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days.", order: 2 },
                    { question: "Do you offer international shipping?", answer: "Yes, we ship worldwide. International shipping takes 10-14 business days.", order: 3 },
                    { question: "Can I track my order?", answer: "Yes, you'll receive a tracking number via email once your order ships.", order: 4 }
                ]
            });
            await settings.save();
        }
        
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching contact settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update contact settings (admin only)
router.put('/', authenticateAdmin, async (req, res) => {
    try {
        let settings = await ContactSettings.findOne();
        
        if (!settings) {
            settings = new ContactSettings();
        }
        
        const updates = req.body;
        Object.assign(settings, updates);
        settings.updatedBy = req.user.userId;
        
        await settings.save();
        res.status(200).json({ message: 'Contact settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating contact settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Submit contact message (public)
// Submit contact message (public)
router.post('/messages', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body; // ✅ Include phone
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        const newMessage = new ContactMessage({
            name,
            email,
            phone: phone || '', // ✅ Save phone (optional)
            subject,
            message,
            status: 'unread'
        });
        
        await newMessage.save();
        
        console.log('Message saved with phone:', phone); // ✅ Debug log
        
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Get all messages (admin only)
router.get('/messages', authenticateAdmin, async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Update message status (admin only)
router.put('/messages/:id', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        res.status(200).json({ message: 'Message updated successfully', message });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ message: 'Error updating message' });
    }
});

// Delete message (admin only)
router.delete('/messages/:id', authenticateAdmin, async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndDelete(req.params.id);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message' });
    }
});


// Send reply to message (admin only)
router.post('/messages/:id/reply', authenticateAdmin, async (req, res) => {
    try {
        const { reply, to, name } = req.body;
        const message = await ContactMessage.findById(req.params.id);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        // Update message status
        message.status = 'replied';
        message.repliedAt = new Date();
        message.replyMessage = reply;
        await message.save();
        
        // Here you would integrate with your email service
        // await sendEmail(to, 'contact_reply', { name, reply, subject: message.subject });
        
        console.log(`Reply sent to ${to}: ${reply}`);
        
        res.status(200).json({ message: 'Reply sent successfully' });
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({ message: 'Error sending reply' });
    }
});

export default router;