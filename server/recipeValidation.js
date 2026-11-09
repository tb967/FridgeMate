/*

Recipe validation for Gemini responses.

1. RECIPE_RESPONSE_SCHEMA asks Gemini to reply with JSON in this exact shape.
2. validateRecipeResponse() checks every recipe before anything is saved,
   so a bad field can't break the database insert or the recipe cards.
3. generateValidatedRecipes() calls Gemini, validates the reply and, if it
   is invalid, tries once more and tells Gemini what was wrong.

*/

const RECIPE_COUNT = 3;
const MAX_LIST_ITEMS = 30;

// The JSON shape Gemini must follow (sent as response_format.schema).
const RECIPE_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        recipes: {
            type: "array",
            minItems: RECIPE_COUNT,
            maxItems: RECIPE_COUNT,
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    cookingTimeMinutes: { type: "integer" },
                    ingredients: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                quantity: { type: "number" },
                                unit: { type: "string" },
                                fromInventory: { type: "boolean" }
                            },
                            required: ["name", "quantity", "unit", "fromInventory"]
                        }
                    },
                    instructions: {
                        type: "array",
                        minItems: 1,
                        items: { type: "string" }
                    },
                    estimatedNutrition: {
                        type: "object",
                        properties: {
                            calories: { type: "number" },
                            protein_g: { type: "number" },
                            carbohydrates_g: { type: "number" },
                            fat_g: { type: "number" }
                        },
                        required: ["calories", "protein_g", "carbohydrates_g", "fat_g"]
                    },
                    usedExpiringIngredients: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: [
                    "title",
                    "description",
                    "cookingTimeMinutes",
                    "ingredients",
                    "instructions",
                    "estimatedNutrition",
                    "usedExpiringIngredients"
                ]
            }
        }
    },
    required: ["recipes"]
};

// Thrown when Gemini's reply can't be used. Holds the list of problems.
class RecipeValidationError extends Error {
    constructor(problems) {
        super(`Invalid recipe response: ${problems.join("; ")}`);
        this.name = "RecipeValidationError";
        this.problems = problems;
    }
}

// Turn Gemini's text into an object, allowing for stray code fences.
function parseRecipeJson(text) {
    if (typeof text !== "string" || text.trim() === "") {
        throw new RecipeValidationError(["the response was empty"]);
    }

    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

    try {
        return JSON.parse(cleaned);
    } catch {
        throw new RecipeValidationError(["the response was not valid JSON"]);
    }
}

// Accept a number, or a string that is only a number ("25", "2.5").
function toNumber(value) {
    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string" && /^\s*-?\d+(\.\d+)?\s*$/.test(value)) {
        return Number(value);
    }

    return NaN;
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
}

// Check one recipe. Adds problems to the list and returns a cleaned copy.
function validateRecipe(recipe, position, maxCookingTime, problems) {
    const label = `recipe ${position}`;

    if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
        problems.push(`${label} is not an object`);
        return null;
    }

    // Title
    if (!isNonEmptyString(recipe.title)) {
        problems.push(`${label} has no title`);
    }

    // Cooking time: a whole number of minutes within the user's limit.
    const minutes = toNumber(recipe.cookingTimeMinutes);

    if (!Number.isInteger(minutes) || minutes < 1) {
        problems.push(
            `${label} cookingTimeMinutes must be a whole number above 0`
        );
    } else if (minutes > maxCookingTime) {
        problems.push(
            `${label} takes ${minutes} minutes, over the ${maxCookingTime}-minute limit`
        );
    }

    // Ingredients
    const ingredients = [];

    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
        problems.push(`${label} has no ingredients`);
    } else if (recipe.ingredients.length > MAX_LIST_ITEMS) {
        problems.push(`${label} has more than ${MAX_LIST_ITEMS} ingredients`);
    } else {
        recipe.ingredients.forEach((ingredient, index) => {
            if (!ingredient || !isNonEmptyString(ingredient.name)) {
                problems.push(`${label} ingredient ${index + 1} has no name`);
                return;
            }

            const quantity =
                ingredient.quantity === null || ingredient.quantity === undefined
                    ? null
                    : toNumber(ingredient.quantity);

            if (quantity !== null && !(quantity > 0)) {
                problems.push(
                    `${label} ingredient "${ingredient.name}" has an invalid quantity`
                );
                return;
            }

            ingredients.push({
                name: ingredient.name.trim(),
                quantity,
                unit: typeof ingredient.unit === "string" ? ingredient.unit.trim() : "",
                fromInventory: ingredient.fromInventory === true
            });
        });
    }

    // Instructions
    let instructions = [];

    if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
        problems.push(`${label} has no instructions`);
    } else if (recipe.instructions.length > MAX_LIST_ITEMS) {
        problems.push(`${label} has more than ${MAX_LIST_ITEMS} steps`);
    } else if (!recipe.instructions.every(isNonEmptyString)) {
        problems.push(`${label} has an empty or non-text instruction`);
    } else {
        instructions = recipe.instructions.map((step) => step.trim());
    }

    // Nutrition: each value a number from 0 to 10,000, or left empty.
    const nutritionIn =
        recipe.estimatedNutrition && typeof recipe.estimatedNutrition === "object"
            ? recipe.estimatedNutrition
            : {};
    const estimatedNutrition = {};

    ["calories", "protein_g", "carbohydrates_g", "fat_g"].forEach((key) => {
        const raw = nutritionIn[key];

        if (raw === null || raw === undefined) {
            estimatedNutrition[key] = null;
            return;
        }

        const value = toNumber(raw);

        if (!Number.isFinite(value) || value < 0 || value > 10000) {
            problems.push(`${label} has an invalid ${key} value`);
            return;
        }

        estimatedNutrition[key] = Math.round(value * 100) / 100;
    });

    // Expiring ingredients: optional list of names.
    const usedExpiringIngredients = Array.isArray(recipe.usedExpiringIngredients)
        ? recipe.usedExpiringIngredients.filter(isNonEmptyString).map((name) => name.trim())
        : [];

    return {
        title: isNonEmptyString(recipe.title) ? recipe.title.trim().slice(0, 200) : "",
        description:
            typeof recipe.description === "string"
                ? recipe.description.trim().slice(0, 1000)
                : "",
        cookingTimeMinutes: minutes,
        ingredients,
        instructions,
        estimatedNutrition,
        usedExpiringIngredients
    };
}

// Check the whole response. Returns cleaned recipes or throws with every problem.
function validateRecipeResponse(data, maxCookingTime) {
    const problems = [];

    if (!data || typeof data !== "object" || !Array.isArray(data.recipes)) {
        throw new RecipeValidationError(['the response has no "recipes" list']);
    }

    if (data.recipes.length !== RECIPE_COUNT) {
        throw new RecipeValidationError([
            `expected ${RECIPE_COUNT} recipes but got ${data.recipes.length}`
        ]);
    }

    const recipes = data.recipes.map((recipe, index) =>
        validateRecipe(recipe, index + 1, maxCookingTime, problems)
    );

    if (problems.length > 0) {
        throw new RecipeValidationError(problems);
    }

    return recipes;
}

// Ask Gemini for recipes, validate them, and retry once if they're invalid.
// Errors that a retry can't fix (rate limits, outages, a bad API key) are
// passed straight back to the caller without retrying.
async function generateValidatedRecipes({ ai, model, prompt, maxCookingTime }) {
    let input = prompt;
    let lastError;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        const interaction = await ai.interactions.create({
            model,
            input,
            store: false,
            response_format: {
                type: "text",
                mime_type: "application/json",
                schema: RECIPE_RESPONSE_SCHEMA
            }
        });

        try {
            const data = parseRecipeJson(interaction.output_text);
            return validateRecipeResponse(data, maxCookingTime);
        } catch (error) {
            if (!(error instanceof RecipeValidationError)) {
                throw error;
            }

            lastError = error;
            console.warn(
                `Gemini attempt ${attempt} returned invalid recipes:`,
                error.problems
            );

            // Second try: repeat the request and say what was wrong.
            input =
                `${prompt}\n\n` +
                "YOUR PREVIOUS RESPONSE WAS REJECTED FOR THESE REASONS:\n" +
                error.problems.map((problem) => `- ${problem}`).join("\n") +
                "\n\nReturn a corrected response that fixes every problem above.";
        }
    }

    throw lastError;
}

module.exports = {
    RECIPE_RESPONSE_SCHEMA,
    RecipeValidationError,
    parseRecipeJson,
    validateRecipeResponse,
    generateValidatedRecipes
};
