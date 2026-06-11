import express from 'express';
import AboutSettings from '../models/AboutSettings.js';
import { authenticateAdmin } from '../middleware/authenticator.js';

const router = express.Router();

// Get about settings (public)
router.get('/', async (req, res) => {
    try {
        let settings = await AboutSettings.findOne();
        
        if (!settings) {
            // Create default settings if none exist
            settings = new AboutSettings({
                stats: [
                    { number: "5000+", label: "Happy Customers", icon: "users" },
                    { number: "50+", label: "Products", icon: "box" },
                    { number: "4.8", label: "Average Rating", icon: "star" },
                    { number: "25+", label: "Team Members", icon: "team" }
                ],
                values: [
                    { title: "Quality First", description: "Every product is vetted for durability and design excellence.", icon: "quality" },
                    { title: "Community Driven", description: "We listen to our customers and create what gamers actually want.", icon: "community" },
                    { title: "Creative Innovation", description: "Pushing boundaries with unique designs and features.", icon: "creative" },
                    { title: "Sustainable Practices", description: "Eco-friendly materials and responsible manufacturing.", icon: "sustainable" }
                ],
                team: [
                    { name: "Rahul Paswan", role: "Founder & Creative Director", bio: "15 years of RPG experience and product design expertise." },
                    { name: "Jordan Lee", role: "Lead Game Master", bio: "Professional DM and content creator with 2000+ sessions run." },
                    { name: "Casey Rivers", role: "Product Designer", bio: "Award-winning designer specializing in gaming accessories." }
                ],
                socialLinks: [
                    { platform: "Twitter", url: "https://twitter.com/creativecrafters", icon: "twitter", order: 1 },
                    { platform: "Instagram", url: "https://instagram.com/creativecrafters", icon: "instagram", order: 2 },
                    { platform: "Discord", url: "https://discord.gg/creativecrafters", icon: "discord", order: 3 },
                    { platform: "YouTube", url: "https://youtube.com/creativecrafters", icon: "youtube", order: 4 }
                ]
            });
            await settings.save();
        }
        
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching about settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update about settings (admin only)
router.put('/', authenticateAdmin, async (req, res) => {
    try {
        let settings = await AboutSettings.findOne();
        
        if (!settings) {
            settings = new AboutSettings();
        }
        
        const updates = req.body;
        Object.assign(settings, updates);
        settings.updatedBy = req.user.userId;
        
        await settings.save();
        res.status(200).json({ message: 'About settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating about settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update social links specifically
router.put('/social-links', authenticateAdmin, async (req, res) => {
    try {
        const { socialLinks } = req.body;
        let settings = await AboutSettings.findOne();
        
        if (!settings) {
            settings = new AboutSettings();
        }
        
        settings.socialLinks = socialLinks;
        settings.updatedBy = req.user.userId;
        
        await settings.save();
        res.status(200).json({ message: 'Social links updated successfully', socialLinks: settings.socialLinks });
    } catch (error) {
        console.error('Error updating social links:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;