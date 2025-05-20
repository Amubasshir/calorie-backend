import multer from 'multer';
import AppError from '../utils/appError.js';
import { deleteFromR2, listR2Images, uploadToR2 } from '../utils/r2.js';

const upload = multer({ storage: multer.memoryStorage() });
export const uploadMiddleware = upload.single('image');

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('No file uploaded', 400));
    const url = await uploadToR2(req.file);
    res.status(201).json({ status: 'success', url });
  } catch (err) {
    next(err);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!key) return next(new AppError('No key provided', 400));
    await deleteFromR2(key);
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};

export const listImages = async (req, res, next) => {
  try {
    const images = await listR2Images();
    res.status(200).json({ status: 'success', images });
  } catch (err) {
    next(err);
  }
};
