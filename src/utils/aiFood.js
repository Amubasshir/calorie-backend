import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const generateFoodData = async (query) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: `You are a nutrition database expert. Generate detailed nutritional information for the food item. 
                Return ONLY valid JSON matching this structure:
                {
                    "name": "Food name",
                    "commonNames": ["alternative names"],
                    "category": "main category",
                    "subcategory": "sub category",
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
                }`
            }, {
                role: "user",
                content: `Generate accurate nutritional data for: ${query}`
            }],
            temperature: 0.7,
            max_tokens: 1000
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('AI Generation Error:', error);
        return null;
    }
};
