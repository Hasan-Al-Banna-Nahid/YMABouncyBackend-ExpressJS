"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = exports.upload = void 0;
// src/utils/cloudinary.util.ts
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Validate Cloudinary environment variables
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  new Error("Cloudinary environment variables are not defined");
}
// Configure Cloudinary
cloudinary_1.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configure Multer-Cloudinary storage
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
  cloudinary: cloudinary_1.v2,
  params: {
    folder: "user-photos", // Folder in Cloudinary to store images
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  }, // Type assertion to avoid strict type issues with Cloudinary params
});
// Multer middleware for handling file uploads
exports.upload = (0, multer_1.default)({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});
// Utility to upload a single file to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary_1.v2.uploader.upload(file.path);
    return result.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
    new Error(`Cloudinary upload failed: ${error.message}`);
  }
};
exports.uploadToCloudinary = uploadToCloudinary;
