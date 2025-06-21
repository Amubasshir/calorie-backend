import OpenAI from 'openai';
import Food from '../models/food.model.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function getFoodDescription(imageUrl) {
    // console.log("{imageUrl} 📞📞📞📞📞📞📞📞📞📞📞📞📞");
    // return;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this food image and provide a detailed description. Focus on identifying food items, their approximate portions, and any visible ingredients. 

Format your response as JSON with the following structure:


{
                    "name": "Food name",
                    "commonNames": ["alternative names"],
                    "category": "main category",
                    "subcategory": "sub category",
                    "imageUrls": [${imageUrl}]
                    "nutritionPer100g": {
                        "calories": number,
                        "macros": {
                            "protein": number in grams,
                            "carbs": number in grams,
                            "fat": number in grams,
                            "fiber": number in grams
                        },
                        "micronutrients": {
                            "sodium": number in mg,
                            "potassium": number in mg,
                            "calcium": number in mg,
                            "iron": number in mg,
                            "vitaminA": number in IU,
                            "vitaminC": number in mg
                        },
                        "sugarContent": number in grams,
                        "saturatedFat": number in grams
                    },
                    "commonPortions": [
                        {
                            "name": "common portion name",
                            "weightInGrams": number,
                            "caloriesPerPortion": number
                        }
                    ]
                }
`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                                detail: "high" // Leverages GPT-4.1-mini's improved vision capabilities
                            }
                        }
                    ],
                },
            ],
            max_tokens: 1000, // Increased token limit to take advantage of GPT-4.1-mini's capabilities
            temperature: 0.1, // Lower temperature for more consistent food analysis
            response_format: { type: "json_object" } // Ensures JSON response format
        });
        // console.log("📞📞📞📞📞📞📞📞", response.choices[0].message.content);

        const aiFood = response.choices[0].message.content;

        const parsedFood = JSON.parse(aiFood);

        const searchRegex = new RegExp(parsedFood.name, 'i');
         const matchingFood = await Food.find({
            $or: [
                { name: searchRegex },
                { commonNames: searchRegex }
            ]
        });


        // console.log({object: parsedFood, matchingFood});
        // const food = await Food.create({ ...parsedFood, createdBy: "68400fe5e299dfc1a626d01d" });
        // console.log("Created new food item:", food);

        if(!matchingFood.length){
            // const food = await Food.create({ ...req.body, createdBy: req.user._id });
            const food = await Food.create({ ...parsedFood, createdBy: "68400fe5e299dfc1a626d01d" });
            // return JSON.parse([...food]);
            return [food];
        }
        // return JSON.parse(response.choices[0].message.content);
        return matchingFood;
    } catch (error) {
        console.error('Error in vision API:', error);
        throw error;
    }
}

async function matchFoodItems(visionResults) {
    const matches = [];

    // for (const item of visionResults.items) {
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
    // const foodMatches = await matchFoodItems(visionResults);

    // return foodMatches;
    return visionResults;
}




// {
//   "items": [
//     {
//       "name": "string",
//       "portionEstimate": {
//         "value": "number",
//         "unit": "string"
//       },
//       "confidence": "number (0-1)",
//       "ingredients": ["string array of visible ingredients"],
//       "nutritionalNotes": "string (optional)"
//     }
//   ],
//   "overallAnalysis": "string describing the meal/dish composition"
// }