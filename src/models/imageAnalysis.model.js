import mongoose from 'mongoose';

const identifiedItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  confidence: { type: Number, required: true },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  nutritionalInfo: {
    estimatedCalories: Number,
    estimatedPortionSize: {
      value: Number,
      unit: String
    },
    macros: {
      protein: Number,
      carbs: Number,
      fat: Number
    }
  }
}, { _id: false });

const imageAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  dateTime: { type: Date, default: Date.now },
  identifiedItems: [identifiedItemSchema],
  expectedItems: [String],
  notes: String,
  errorMessage: String,
  processingTime: Number
}, {
  timestamps: true
});

const ImageAnalysis = mongoose.model('ImageAnalysis', imageAnalysisSchema);
export default ImageAnalysis;
