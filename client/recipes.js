/*

A few important things this code does:
- Retrieves ingredients from inventory_items.
- Uses your existing Supabase login session.
- Displays only the signed-in user's records through your existing Row Level Security (RLS) policies.
- Sorts ingredients by expiry date, putting undated ingredients last.
- Highlights expired ingredients and those expiring soon.
- Uses textContent to display ingredient information safely rather than inserting user-provided values as HTML.

*/
const recipeForm = document.getElementById("recipe-form");
const recipeMessage = document.getElementById("recipe-message");
const availableIngredients = document.getElementById("available-ingredients");

let currentIngredients = [];

async function checkRecipePageSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("index.html");
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

// Create an ingredient card without inserting user data as HTML.
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

// Handle the recipe preferences form.
recipeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dietaryPreference =
        document.getElementById("dietary-preference").value;

    const cookingTime =
        document.getElementById("cooking-time").value;

    const extraIngredients =
        document.getElementById("extra-ingredients").value.trim();

    if (currentIngredients.length === 0) {
        recipeMessage.textContent =
            "Add some ingredients to your inventory before finding recipes.";
        return;
    }

    recipeMessage.textContent =
        "Your preferences have been selected. AI recipe generation " +
        "will be connected in the next stage.";

    console.log("Recipe preferences:", {
        dietaryPreference,
        cookingTime,
        extraIngredients,
        ingredients: currentIngredients
    });
});

// Start the page.
async function initialiseRecipesPage() {
    const isSignedIn = await checkRecipePageSession();

    if (!isSignedIn) {
        return;
    }

    await loadIngredients();
}

initialiseRecipesPage();
