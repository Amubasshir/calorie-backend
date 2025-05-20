import mongoose from 'mongoose';

const portionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weightInGrams: { type: Number, required: true },
  caloriesPerPortion: { type: Number, required: true }
}, { _id: false });

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  commonNames: [String],
  brand: String,
  category: String,
  subcategory: String,
  nutritionPer100g: {
    calories: Number,
    macros: {
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number
    },
    micronutrients: {
      sodium: Number,
      potassium: Number,
      calcium: Number,
      iron: Number,
      vitaminA: Number,
      vitaminC: Number
      // Add more micronutrients as needed
    },
    sugarContent: Number,
    saturatedFat: Number
  },
  commonPortions: [portionSchema],
  ingredients: [String],
  allergens: [String],
  imageUrls: [String],
  verified: { type: Boolean, default: false },
  aiGenerated: { type: Boolean, default: false },
  source: String,
  popularityScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Food = mongoose.model('Food', foodSchema);
export default Food;
