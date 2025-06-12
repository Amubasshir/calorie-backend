import Food from '../models/food.model.js';
import UserSubscription from '../models/userSubscription.model.js';
import { generateFoodData } from '../utils/aiFood.js';
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
    const {
      query,
      page = 1,
      limit = 10,
      sortBy = 'name',
      order = 'asc',
      category,
      minCalories,
      maxCalories,
      minProtein,
      maxProtein
    } = req.query;

    const skip = (page - 1) * limit;
    let queryObj = {};
    let foods;
    let total;

    // Build search criteria
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      queryObj.$or = [
        { name: searchRegex },
        { commonNames: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex }
      ];
    }

    // Add category filter
    if (category) {
      queryObj.category = new RegExp(category, 'i');
    }

    // Add nutritional filters
    if (minCalories || maxCalories) {
      queryObj['nutritionPer100g.calories'] = {};
      if (minCalories) queryObj['nutritionPer100g.calories'].$gte = Number(minCalories);
      if (maxCalories) queryObj['nutritionPer100g.calories'].$lte = Number(maxCalories);
    }

    if (minProtein || maxProtein) {
      queryObj['nutritionPer100g.macros.protein'] = {};
      if (minProtein) queryObj['nutritionPer100g.macros.protein'].$gte = Number(minProtein);
      if (maxProtein) queryObj['nutritionPer100g.macros.protein'].$lte = Number(maxProtein);
    }

    // Execute search
    foods = await Food.find(queryObj)
      .populate('createdBy', 'fullName email')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    total = await Food.countDocuments(queryObj);

    // If no results found and there's a search query, try AI generation
    if (foods.length === 0 && query) {
      // Check user's subscription status for AI generation
      const userSub = await UserSubscription.findOne({ user: req.user._id }).populate('plan');
      
      if (!userSub || !userSub.plan.features.customFoodAddition) {
        return next(new AppError('Upgrade to premium to access AI-generated food data', 403));
      }

      const aiGeneratedFood = await generateFoodData(query);
      
      if (aiGeneratedFood) {
        const newFood = await Food.create({
          ...aiGeneratedFood,
          aiGenerated: true,
          createdBy: req.user._id
        });

        foods = [newFood];
        total = 1;
      }
    }

    // Get unique categories for filters
    const categories = await Food.distinct('category');

    res.status(200).json({
      status: 'success',
      results: foods.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      categories, // Include available categories
      data: { foods }
    });
  } catch (err) {
    next(err);
  }
};

export const getFoodsCategories = async (req, res, next) => {
  try {
    const categories = await Food.aggregate([
      {
        $group: {
          _id: "$category",
          subcategories: { $addToSet: "$subcategory" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          subcategories: 1
        }
      },
      {
        $sort: { category: 1 }
      }
    ]);

    res.status(200).json({data:categories});
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
