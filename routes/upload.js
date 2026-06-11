import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../services/ImageService.js';
import { authenticateAdmin } from '../middleware/authenticator.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload image endpoint
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
    console.log('=== UPLOAD ROUTE HIT ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
    } : 'No file');
    
    try {
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const folder = req.body.folder || 'team';
        console.log('Uploading to Cloudinary folder:', folder);
        
        const imageUrl = await uploadToCloudinary(req.file.buffer, folder);
        console.log('Image uploaded successfully. URL:', imageUrl);
        
        res.status(200).json({ 
            message: 'Image uploaded successfully', 
            imageUrl 
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Error uploading image: ' + error.message });
    }
});

export default router;
