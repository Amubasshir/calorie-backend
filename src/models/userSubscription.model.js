import mongoose from 'mongoose';

const userSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  status: { type: String, enum: ['active', 'canceled', 'past_due', 'incomplete', 'trialing'], default: 'active' },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
export default UserSubscription;
