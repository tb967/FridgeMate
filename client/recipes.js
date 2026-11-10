
/*

FridgeMate recipe generation.

- Retrieves ingredients from inventory_items.
- Uses the signed-in user's Supabase session.
- Displays ingredients with expiry information.
- Sends recipe preferences to the Express backend.
- Uses Gemini AI to generate three recipes.
- Displays recipe details safely using textContent and DOM methods.

*/

const recipeForm = document.getElementById("recipe-form");
const recipeMessage = document.getElementById("recipe-message");
const availableIngredients = document.getElementById("available-ingredients");
const recipeList = document.getElementById("recipe-list");
const generateButton = document.getElementById("generate-recipes-button");
const favouritesList = document.getElementById("favourites-list");

let currentIngredients = [];
let currentSavedRecipes = [];
let favouriteRecipeIds = new Set();

// Check that the user is signed in.
async function checkRecipePageSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("login.html");
        return false;
    }

    return true;
}

// Compare date-only values using local dates to avoid timezone issues.
function getExpiryStatus(expiryDate) {
    if (!expiryDate) {
        return "No expiry date";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${expiryDate}T00:00:00`);

    const difference = Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );

    if (difference < 0) {
        return "Expired";
    }

    if (difference === 0) {
        return "Expires today";
    }

    if (difference <= 3) {
        return `Expires in ${difference} day(s)`;
    }

    if (difference <= 7) {
        return `Expires in ${difference} days`;
    }

    return `Expires: ${expiry.toLocaleDateString("en-GB")}`;
}

// Create an ingredient card safely.
function createIngredientCard(ingredient) {
    const card = document.createElement("article");
    card.className = "ingredient-card";

    const name = document.createElement("h3");
    name.textContent = ingredient.name;

    const details = document.createElement("p");
    details.textContent =
        `${ingredient.quantity} ${ingredient.unit} · ${ingredient.category}`;

    const expiry = document.createElement("p");
    expiry.textContent = getExpiryStatus(ingredient.expiry_date);
    expiry.className = "ingredient-expiry";

    if (ingredient.expiry_date) {
        const status = getExpiryStatus(ingredient.expiry_date);

        if (status === "Expired" || status === "Expires today") {
            expiry.classList.add("expiry-urgent");
        } else if (status.startsWith("Expires in")) {
            expiry.classList.add("expiry-soon");
        }
    }

    card.append(name, details, expiry);

    return card;
}

// Load the signed-in user's ingredients.
async function loadIngredients() {
    availableIngredients.replaceChildren();

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Loading your ingredients...";
    availableIngredients.appendChild(loadingMessage);

    const { data, error } = await supabaseClient
        .from("inventory_items")
        .select("id, name, quantity, unit, category, expiry_date")
        .order("expiry_date", {
            ascending: true,
            nullsFirst: false
        });

    if (error) {
        console.error("Unable to load ingredients:", error.message);

        availableIngredients.textContent =
            "Unable to load your ingredients. Please refresh the page.";

        return;
    }

    currentIngredients = data || [];
    availableIngredients.replaceChildren();

    if (currentIngredients.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent =
            "Your inventory is empty. Add some ingredients to get started.";

        const inventoryLink = document.createElement("a");
        inventoryLink.href = "inventory.html";
        inventoryLink.textContent = "Go to your inventory";

        availableIngredients.append(emptyMessage, inventoryLink);
        return;
    }

    const ingredientGrid = document.createElement("div");
    ingredientGrid.className = "ingredient-grid";

    currentIngredients.forEach((ingredient) => {
        ingredientGrid.appendChild(createIngredientCard(ingredient));
    });

    availableIngredients.appendChild(ingredientGrid);
}

// Create a heading and content section for recipe details.
function createRecipeSection(titleText, content) {
    const section = document.createElement("section");

    const heading = document.createElement("h4");
    heading.textContent = titleText;

    section.appendChild(heading);
    section.appendChild(content);

    return section;
}

// Create a recipe card safely without using innerHTML.
function createRecipeCard(recipe) {
    const card = document.createElement("article");
    card.className = "recipe-card";

    // Recipe title
    const title = document.createElement("h3");
    title.textContent = recipe.title || "Untitled recipe";

    // Description
    const description = document.createElement("p");
    description.textContent = recipe.description || "";

    // Cooking time
    const cookingTime = document.createElement("p");
    cookingTime.className = "recipe-cooking-time";
    cookingTime.textContent =
        `Cooking time: ${recipe.cookingTimeMinutes} minutes`;

    card.append(title, description, cookingTime);

    // Ingredients
    const ingredientList = document.createElement("ul");

    (recipe.ingredients || []).forEach((ingredient) => {
        const item = document.createElement("li");

        const quantity = ingredient.quantity ?? "";
        const unit = ingredient.unit || "";

        item.textContent =
            `${quantity} ${unit} ${ingredient.name}`.trim();

        if (ingredient.fromInventory) {
            const inventoryLabel = document.createElement("span");
            inventoryLabel.textContent = " (In your inventory)";
            item.appendChild(inventoryLabel);
        }

        ingredientList.appendChild(item);
    });

    card.appendChild(
        createRecipeSection("Ingredients", ingredientList)
    );

    // Cooking instructions
    const instructionsList = document.createElement("ol");

    (recipe.instructions || []).forEach((instruction) => {
        const item = document.createElement("li");
        item.textContent = instruction;
        instructionsList.appendChild(item);
    });

    card.appendChild(
        createRecipeSection("Instructions", instructionsList)
    );

    // Estimated nutrition
    if (recipe.estimatedNutrition) {
        const nutrition = recipe.estimatedNutrition;

        const nutritionDetails = document.createElement("p");
        nutritionDetails.textContent =
            `Calories: ${nutrition.calories ?? "N/A"} kcal | ` +
            `Protein: ${nutrition.protein_g ?? "N/A"} g | ` +
            `Carbs: ${nutrition.carbohydrates_g ?? "N/A"} g | ` +
            `Fat: ${nutrition.fat_g ?? "N/A"} g`;

        card.appendChild(
            createRecipeSection("Estimated nutrition per serving", nutritionDetails)
        );
    }

    // Ingredients close to expiry
    if (
        Array.isArray(recipe.usedExpiringIngredients) &&
        recipe.usedExpiringIngredients.length > 0
    ) {
        const expiringDetails = document.createElement("p");
        expiringDetails.className = "recipe-expiring-ingredients";

        expiringDetails.textContent =
            `Helps use up: ${recipe.usedExpiringIngredients.join(", ")}`;

        card.appendChild(expiringDetails);
    }

        // Recipe actions
    const actions = document.createElement("div");
    actions.className = "recipe-actions";

    // Favourite button
    const favouriteButton = document.createElement("button");
    favouriteButton.type = "button";
    favouriteButton.className = "recipe-favourite-button";

    const isFavourite = favouriteRecipeIds.has(recipe.id);

    favouriteButton.textContent = isFavourite
        ? "♥ Remove favourite"
        : "♡ Add to favourites";

    favouriteButton.addEventListener("click", () => {
        toggleFavourite(recipe);
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "recipe-delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
        deleteRecipe(recipe);
    });

    actions.append(favouriteButton, deleteButton);
    card.appendChild(actions);

    return card;
}

// Display generated recipes and favourites in separate sections.
function displayRecipes() {
    recipeList.replaceChildren();
    favouritesList.replaceChildren();

    const favouriteRecipes = currentSavedRecipes.filter((recipe) =>
        favouriteRecipeIds.has(recipe.id)
    );

    // Display generated recipes.
    if (currentSavedRecipes.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "You haven't generated any recipes yet. Generate some recipes to get started.";

        recipeList.appendChild(message);
    } else {
        currentSavedRecipes.forEach((recipe) => {
            recipeList.appendChild(createRecipeCard(recipe));
        });
    }

    // Display favourite recipes separately.
    if (favouriteRecipes.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "You haven't added any favourite recipes yet.";

        favouritesList.appendChild(message);
    } else {
        favouriteRecipes.forEach((recipe) => {
            favouritesList.appendChild(createRecipeCard(recipe));
        });
    }
}

// Load the signed-in user's generated recipes and favourites.
async function loadSavedRecipes() {
    const { data, error } = await supabaseClient
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Unable to load saved recipes:", error);

        recipeList.textContent =
            "Unable to load your recipes. Please refresh the page.";

        return;
    }

    currentSavedRecipes = (data || []).map((recipe) => ({
        ...recipe,
        cookingTimeMinutes: recipe.cooking_time_minutes,
        estimatedNutrition: {
            calories: recipe.calories,
            protein_g: recipe.protein_g,
            carbohydrates_g: recipe.carbohydrates_g,
            fat_g: recipe.fat_g
        }
    }));

    // Load the IDs of recipes the user has favourited.
    const { data: favourites, error: favouritesError } =
        await supabaseClient
            .from("saved_recipes")
            .select("recipe_id")
            .order("saved_at", { ascending: false });

    if (favouritesError) {
        console.error("Unable to load favourites:", favouritesError);
        favouriteRecipeIds = new Set();
    } else {
        favouriteRecipeIds = new Set(
            (favourites || []).map((item) => item.recipe_id)
        );
    }

    displayRecipes();
}

// Add or remove a recipe from the user's favourites.
async function toggleFavourite(recipe) {
    const { data, error: sessionError } =
        await supabaseClient.auth.getSession();

    if (sessionError || !data.session) {
        recipeMessage.textContent =
            "Your session has expired. Please log in again.";
        return;
    }

    const userId = data.session.user.id;
    const isFavourite = favouriteRecipeIds.has(recipe.id);

    if (isFavourite) {
        const { error } = await supabaseClient
            .from("saved_recipes")
            .delete()
            .eq("recipe_id", recipe.id);

        if (error) {
            console.error("Unable to remove favourite:", error);
            recipeMessage.textContent =
                "Unable to remove this favourite. Please try again.";
            return;
        }

        favouriteRecipeIds.delete(recipe.id);
        recipeMessage.textContent =
            "Recipe removed from your favourites.";
    } else {
        const { error } = await supabaseClient
            .from("saved_recipes")
            .insert({
                user_id: userId,
                recipe_id: recipe.id
            });

        if (error) {
            console.error("Unable to save favourite:", error);
            recipeMessage.textContent =
                "Unable to add this favourite. Please try again.";
            return;
        }

        favouriteRecipeIds.add(recipe.id);
        recipeMessage.textContent =
            "Recipe added to your favourites!";
    }

    displayRecipes();
}

// Delete a generated recipe from Supabase.
async function deleteRecipe(recipe) {
    const confirmed = window.confirm(
        `Are you sure you want to delete "${recipe.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const { error } = await supabaseClient
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

    if (error) {
        console.error("Unable to delete recipe:", error);
        recipeMessage.textContent =
            "Unable to delete this recipe. Please try again.";
        return;
    }

    currentSavedRecipes = currentSavedRecipes.filter(
        (savedRecipe) => savedRecipe.id !== recipe.id
    );

    favouriteRecipeIds.delete(recipe.id);

    displayRecipes();

    recipeMessage.textContent = "Recipe deleted successfully.";
}

// Send the user's preferences to the backend and generate recipes.
async function generateRecipes(event) {
    event.preventDefault();

    if (currentIngredients.length === 0) {
        recipeMessage.textContent =
            "Add some ingredients to your inventory before finding recipes.";
        return;
    }

    const dietaryPreference =
        document.getElementById("dietary-preference").value;

    const cookingTime =
        document.getElementById("cooking-time").value;

    const extraIngredients =
        document.getElementById("extra-ingredients").value.trim();

    // Get the latest Supabase session.
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        recipeMessage.textContent =
            "Your session has expired. Please log in again.";

        window.location.replace("login.html");
        return;
    }

    const accessToken = data.session.access_token;

    // Show loading status.
    generateButton.disabled = true;
    generateButton.textContent = "Generating recipes...";
    recipeMessage.textContent =
        "Gemini is creating recipes using your ingredients. Please wait...";

    recipeList.replaceChildren();

    try {
        const response = await fetch(
            "http://localhost:3000/generate-recipes",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    dietaryPreference,
                    cookingTime,
                    extraIngredients
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to generate recipes."
            );
        }

        if (!Array.isArray(result.recipes) || result.recipes.length === 0) {
            throw new Error("No recipes were returned. Please try again.");
        }

        await loadSavedRecipes();

        recipeMessage.textContent =
            "Your recipes have been generated successfully!";

    } catch (error) {
        console.error("Recipe generation error:", error);

        recipeMessage.textContent =
            error.message || "Something went wrong. Please try again.";

    } finally {
        generateButton.disabled = false;
        generateButton.textContent = "Generate recipes";
    }
}

// Handle the recipe preferences form.
recipeForm.addEventListener("submit", generateRecipes);

// Start the page.
async function initialiseRecipesPage() {
    const isSignedIn = await checkRecipePageSession();

    if (!isSignedIn) {
        return;
    }

    await loadIngredients();
    await loadSavedRecipes();
}

initialiseRecipesPage();
