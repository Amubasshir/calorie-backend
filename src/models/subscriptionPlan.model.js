import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  planCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  price: {
    monthly: { type: Number, default: 0 },
    annual: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  features: {
    dailyImageUploads: { type: Number, default: 3 },
    historyRetentionDays: { type: Number, default: 7 },
    customMealPlanning: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    customFoodAddition: { type: Boolean, default: false },
    priorityProcessing: { type: Boolean, default: false }
  },
  apiLimits: {
    uploadsPerDay: { type: Number, default: 3 },
    searchesPerDay: { type: Number, default: 10 },
    requestsPerMinute: { type: Number, default: 30 }
  },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
