import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    oldPrice: {
        type: Number,
        default: null
    },
    category: {
        type: String,
        required: true,
        enum: ['dice', 'decor', 'accessories', 'dnd', 'supplies', 'books']
    },
    rating: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5
    },
    reviews: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    image: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    badge: {
        type: String,
        enum: ['Best Seller', 'New', 'Sale', 'Top Rated', 'Popular', 'Handmade', null],
        default: null
    },
    colors: [{
        type: String
    }],
    features: [{
        type: String
    }],
    views: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Create index for search
productSchema.index({ title: 'text', description: 'text' });

const Product = mongoose.model("Product", productSchema);
export default Product;