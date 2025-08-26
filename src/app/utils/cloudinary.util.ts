// src/utils/cloudinary.util.ts
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Validate Cloudinary environment variables
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  new Error("Cloudinary environment variables are not defined");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer-Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "user-photos", // Folder in Cloudinary to store images
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  } as any, // Type assertion to avoid strict type issues with Cloudinary params
});

// Multer middleware for handling file uploads
export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Utility to upload a single file to Cloudinary
export const uploadToCloudinary = async (
  file: Express.Multer.File
): Promise<any> => {
  try {
    const result = await cloudinary.uploader.upload(file.path);
    return result.secure_url; // Return the secure URL of the uploaded image
  } catch (error: any) {
    new Error(`Cloudinary upload failed: ${error.message}`);
  }
};
