import OpenAI from 'openai';
import Food from '../models/food.model.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function getFoodDescription(imageUrl) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this food image and provide a detailed description. Focus on identifying food items, their approximate portions, and any visible ingredients. Format your response as JSON with the following structure: { items: [{ name: string, portionEstimate: { value: number, unit: string }, confidence: number }] }"
                        },
                        {
                            type: "image_url",
                            image_url: imageUrl
                        }
                    ],
                },
            ],
            max_tokens: 500,
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('Error in vision API:', error);
        throw error;
    }
}

async function matchFoodItems(visionResults) {
    const matches = [];
    
    for (const item of visionResults.items) {
        // Search for matching food in database
        const searchRegex = new RegExp(item.name, 'i');
        const matchingFood = await Food.findOne({
            $or: [
                { name: searchRegex },
                { commonNames: searchRegex }
            ]
        });

        // Calculate portion-adjusted nutritional values
        let nutritionalInfo = null;
        if (matchingFood) {
            const portionMultiplier = item.portionEstimate.value / 100; // Convert to 100g basis
            nutritionalInfo = {
                estimatedCalories: matchingFood.nutritionPer100g.calories * portionMultiplier,
                estimatedPortionSize: item.portionEstimate,
                macros: {
                    protein: matchingFood.nutritionPer100g.macros.protein * portionMultiplier,
                    carbs: matchingFood.nutritionPer100g.macros.carbs * portionMultiplier,
                    fat: matchingFood.nutritionPer100g.macros.fat * portionMultiplier
                }
            };
        }

        matches.push({
            name: item.name,
            confidence: item.confidence,
            foodId: matchingFood?._id || null,
            nutritionalInfo
        });
    }

    return matches;
}

export async function analyzeImage(imageUrl, expectedItems = []) {
    const visionResults = await getFoodDescription(imageUrl);
    const foodMatches = await matchFoodItems(visionResults);
    
    return foodMatches;
}
