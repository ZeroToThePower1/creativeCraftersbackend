import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (buffer, folder = 'products') => {
    console.log('=== uploadToCloudinary called ===');
    console.log('Folder:', folder);
    console.log('Buffer size:', buffer.length);
    
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                transformation: [
                    { width: 500, height: 500, crop: 'limit' },
                    { quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('✅ Image uploaded to Cloudinary successfully');
                    console.log('Cloudinary URL:', result.secure_url);
                    resolve(result.secure_url);
                }
            }
        );
        
        // Convert buffer to stream
        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Deleted from Cloudinary:', result);
        return true;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return false;
    }
};

// Keep the local functions as fallback or remove them
// For now, let's export Cloudinary as the main upload function
export const uploadToLocal = uploadToCloudinary; // Alias for backward compatibility