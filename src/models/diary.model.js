import mongoose from 'mongoose';

const diaryEntrySchema = new mongoose.Schema({
  mealType: { type: String, required: true }, // Breakfast, Lunch, etc.
  time: { type: String, required: true }, // "HH:MM"
  foodItem: {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    name: { type: String, required: true },
    portionSize: { type: Number, required: true },
    portionUnit: { type: String, required: true },
    totalCalories: { type: Number, required: true },
    macros: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 }
    }
  },
  notes: String,
  images: [String]
}, { _id: false });

const diarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  entries: [diaryEntrySchema],
  dailySummary: {
    totalCalories: { type: Number, default: 0 },
    macroBreakdown: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 }
    },
    calorieGoalMet: { type: Boolean, default: false },
    caloriePercentage: { type: Number, default: 0 }
  }
}, { timestamps: true });

const Diary = mongoose.model('Diary', diarySchema);
export default Diary;
