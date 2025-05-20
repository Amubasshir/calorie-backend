import Food from '../models/food.model.js';
import AppError from '../utils/appError.js';

export const createFood = async (req, res, next) => {
  try {
    const food = await Food.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ status: 'success', data: { food } });
  } catch (err) {
    next(err);
  }
};

export const getFoods = async (req, res, next) => {
  try {
    const foods = await Food.find().populate('createdBy', 'fullName email');
    res.status(200).json({ status: 'success', results: foods.length, data: { foods } });
  } catch (err) {
    next(err);
  }
};

export const getFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id).populate('createdBy', 'fullName email');
    if (!food) return next(new AppError('Food not found', 404));
    res.status(200).json({ status: 'success', data: { food } });
  } catch (err) {
    next(err);
  }
};

export const updateFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!food) return next(new AppError('Food not found', 404));
    res.status(200).json({ status: 'success', data: { food } });
  } catch (err) {
    next(err);
  }
};

export const deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return next(new AppError('Food not found', 404));
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
};
