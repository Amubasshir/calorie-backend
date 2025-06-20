import Stripe from 'stripe';
import SubscriptionPlan from '../models/subscriptionPlan.model.js';
import UserSubscription from '../models/userSubscription.model.js';
import AppError from '../utils/appError.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ active: true }).sort({ displayOrder: 1 });
    res.status(200).json({ status: 'success', data: { plans } });
  } catch (err) {
    next(err);
  }
};

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { planCode } = req.body;
    const plan = await SubscriptionPlan.findOne({ planCode });
    
    console.log('Plan found:', plan, planCode);
    if (!plan) return next(new AppError('Plan not found', 404));

    // Create Stripe customer if not exists
    let userSub = await UserSubscription.findOne({ user: req.user._id });
    if (!userSub) {
      userSub = await UserSubscription.create({ user: req.user._id, plan: plan._id });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: plan.price.currency,
          product_data: { name: plan.name },
          unit_amount: plan.price.monthly * 100,
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: { userId: req.user._id.toString(), planId: plan._id.toString() }
    });

    res.status(200).json({ status: 'success', url: session.url });
  } catch (err) {
    next(err);
  }
};

export const getUserSubscription = async (req, res, next) => {
  try {
    const userSub = await UserSubscription.findOne({ user: req.user._id }).populate('plan');
    res.status(200).json({ status: 'success', data: { subscription: userSub } });
  } catch (err) {
    next(err);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const userSub = await UserSubscription.findOne({ user: req.user._id });
    if (!userSub || !userSub.stripeSubscriptionId) return next(new AppError('No active subscription', 404));
    await stripe.subscriptions.update(userSub.stripeSubscriptionId, { cancel_at_period_end: true });
    userSub.cancelAtPeriodEnd = true;
    await userSub.save();
    res.status(200).json({ status: 'success', message: 'Subscription will be canceled at period end.' });
  } catch (err) {
    next(err);
  }
};
