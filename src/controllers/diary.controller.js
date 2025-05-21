import Diary from '../models/diary.model.js';
import AppError from '../utils/appError.js';

export const createDiary = async (req, res, next) => {
  try {
    const diary = await Diary.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ status: 'success', data: { diary } });
  } catch (err) {
    next(err);
  }
};

export const getMyDiaries = async (req, res, next) => {
  try {
    const diaries = await Diary.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json({ status: 'success', results: diaries.length, data: { diaries } });
  } catch (err) {
    next(err);
  }
};

export const getDiaryByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const diary = await Diary.findOne({ userId: req.user._id, date: new Date(date) });
    if (!diary) return next(new AppError('Diary entry not found for this date', 404));
    res.status(200).json({ status: 'success', data: { diary } });
  } catch (err) {
    next(err);
  }
};

export const updateDiary = async (req, res, next) => {
  try {
    const diary = await Diary.findOneAndUpdate(
      { userId: req.user._id, _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!diary) return next(new AppError('Diary entry not found', 404));
    res.status(200).json({ status: 'success', data: { diary } });
  } catch (err) {
    next(err);
  }
};

export const deleteDiary = async (req, res, next) => {
  try {
    const diary = await Diary.findOneAndDelete({ userId: req.user._id, _id: req.params.id });
    if (!diary) return next(new AppError('Diary entry not found', 404));
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
};
