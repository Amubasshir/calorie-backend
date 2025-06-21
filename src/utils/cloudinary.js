// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file) => {
  try {
    // Convert buffer to base64 data URI
    // const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const base64Data = file;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, {
      resource_type: 'auto', // Automatically detect file type
      folder: 'uploads', // Optional: organize uploads in a folder
      public_id: `${Date.now()}`, // Custom public ID
      use_filename: true,
      unique_filename: false,
    });

    console.log("iu am result ✅✅✅", {result});

    return result.secure_url;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    // Extract public ID from URL if full URL is passed
    let id = publicId;
    if (publicId.includes('/')) {
      // If it's a full URL, extract the public ID
      const urlParts = publicId.split('/');
      const filename = urlParts[urlParts.length - 1];
      id = filename.split('.')[0]; // Remove file extension
      
      // If the file is in a folder, include the folder path
      const folderIndex = urlParts.findIndex(part => part === 'upload');
      if (folderIndex !== -1 && folderIndex + 2 < urlParts.length) {
        const folderPath = urlParts.slice(folderIndex + 2, -1).join('/');
        if (folderPath) {
          id = `${folderPath}/${id}`;
        }
      }
    }

    const result = await cloudinary.uploader.destroy(id);
    return result;
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

export const listCloudinaryImages = async (folder = 'uploads') => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder, // Filter by folder
      max_results: 500, // Adjust as needed
      resource_type: 'image', // Only images, use 'auto' for all file types
    });

    return result.resources.map(resource => ({
      key: resource.public_id,
      url: resource.secure_url,
      created_at: resource.created_at,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
    }));
  } catch (error) {
    throw new Error(`List failed: ${error.message}`);
  }
};