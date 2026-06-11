import express from 'express';
import Product from '../models/Product.js';
import { authenticateAdmin } from '../middleware/authenticator.js';
import multer from 'multer';
import { uploadToLocal } from '../services/ImageService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// Get all products (public)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        console.log(`Found ${products.length} products`);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Get trending products (most viewed)
router.get('/trending', async (req, res) => {
    try {
        const trendingProducts = await Product.find()
            .sort({ views: -1 })
            .limit(8);
        res.status(200).json(trendingProducts);
    } catch (error) {
        console.error('Error fetching trending products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get single product (public) - WITH VIEW COUNTER
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Increment view count
        product.views = (product.views || 0) + 1;
        await product.save();
        
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add new product (admin only)
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        console.log('Creating product...');
        
        let productData;
        if (req.body.productData) {
            try {
                productData = JSON.parse(req.body.productData);
            } catch (e) {
                productData = req.body;
            }
        } else {
            productData = req.body;
        }
        
        let imageUrl = '';
        if (req.file) {
            imageUrl = await uploadToLocal(req.file.buffer, 'products');
            console.log('Image saved to:', imageUrl);
        } else {
            imageUrl = 'https://via.placeholder.com/500x500?text=Product+Image';
        }
        
        let featuresArray = [];
        if (productData.features) {
            if (Array.isArray(productData.features)) {
                featuresArray = productData.features;
            } else if (typeof productData.features === 'string') {
                featuresArray = productData.features.split(',').map(f => f.trim()).filter(f => f);
            }
        }
        
        const product = new Product({
            title: productData.title,
            description: productData.description,
            price: parseFloat(productData.price),
            oldPrice: productData.oldPrice ? parseFloat(productData.oldPrice) : null,
            category: productData.category,
            stock: parseInt(productData.stock),
            rating: parseFloat(productData.rating) || 4.5,
            reviews: parseInt(productData.reviews) || 0,
            badge: productData.badge || null,
            colors: productData.colors || [],
            features: featuresArray,
            image: imageUrl,
            views: 0,
            createdBy: req.user.userId
        });
        
        const savedProduct = await product.save();
        console.log('Product saved successfully:', savedProduct._id);
        
        res.status(201).json({ 
            message: 'Product created successfully', 
            product: savedProduct 
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// Update product (admin only)
router.put('/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        let productData;
        if (req.body.productData) {
            try {
                productData = JSON.parse(req.body.productData);
            } catch (e) {
                productData = req.body;
            }
        } else {
            productData = req.body;
        }
        
        if (req.file) {
            productData.image = await uploadToLocal(req.file.buffer, 'products');
        }
        
        Object.assign(product, productData);
        await product.save();
        
        res.status(200).json({ 
            message: 'Product updated successfully', 
            product 
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete product (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;