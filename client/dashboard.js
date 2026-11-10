
const userEmail = document.getElementById("user-email");
const signOutButton = document.getElementById("sign-out-button");

// Dashboard statistic elements
const inventoryCount = document.getElementById("inventory-count");
const expiringCount = document.getElementById("expiring-count");
const recipesCount = document.getElementById("recipes-count");
const favouritesCount = document.getElementById("favourites-count");

// Dashboard list elements
const expiringList = document.getElementById("expiring-list");
const recentRecipes = document.getElementById("recent-recipes");

// Get today's date in YYYY-MM-DD format using local time.
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Calculate the number of days until an ingredient expires.
function getDaysUntilExpiry(expiryDate) {
    const [year, month, day] = expiryDate.split("-").map(Number);

    const expiry = Date.UTC(year, month - 1, day);

    const todayDate = new Date();
    const today = Date.UTC(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        todayDate.getDate()
    );

    return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

// Display a friendly expiry message.
function getExpiryMessage(days) {
    if (days === 0) {
        return "Expires today";
    }

    if (days === 1) {
        return "Expires tomorrow";
    }

    return `Expires in ${days} days`;
}

// Display ingredients that are expiring soon.
function displayExpiringIngredients(ingredients) {
    expiringList.replaceChildren();

    const today = getLocalDateString(new Date());

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const endDate = getLocalDateString(sevenDaysLater);

    const expiringIngredients = ingredients
        .filter((ingredient) =>
            ingredient.expiry_date &&
            ingredient.expiry_date >= today &&
            ingredient.expiry_date <= endDate
        )
        .sort((a, b) =>
            a.expiry_date.localeCompare(b.expiry_date)
        )
        .slice(0, 5);

    if (expiringIngredients.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "Great news! You have no ingredients expiring within the next 7 days.";

        expiringList.appendChild(message);
        return;
    }

    expiringIngredients.forEach((ingredient) => {
        const item = document.createElement("div");
        item.className = "dashboard-list-item";

        const name = document.createElement("h3");
        name.textContent = ingredient.name;

        const quantity = document.createElement("p");
        quantity.textContent = [
            ingredient.quantity,
            ingredient.unit
        ].filter(Boolean).join(" ");

        const days = getDaysUntilExpiry(ingredient.expiry_date);

        const expiry = document.createElement("p");
        expiry.textContent = getExpiryMessage(days);

        expiry.className = days <= 2
            ? "dashboard-expiry-urgent"
            : "dashboard-expiry-soon";

        item.append(name, quantity, expiry);
        expiringList.appendChild(item);
    });
}

// Display the three most recently generated recipes.
function displayRecentRecipes(recipes) {
    recentRecipes.replaceChildren();

    if (!recipes || recipes.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            "You haven't generated any recipes yet. Head to the Recipes page to get started!";

        recentRecipes.appendChild(message);
        return;
    }

    recipes.forEach((recipe) => {
        const item = document.createElement("div");
        item.className = "dashboard-list-item";

        const title = document.createElement("h3");
        title.textContent = recipe.title;

        const description = document.createElement("p");
        description.textContent = recipe.description || "";

        const cookingTime = document.createElement("p");

        if (recipe.cooking_time_minutes) {
            cookingTime.textContent =
                `⏱ ${recipe.cooking_time_minutes} minutes`;
        }

        item.append(title, description, cookingTime);
        recentRecipes.appendChild(item);
    });
}

// Load the dashboard information from Supabase.
async function loadDashboard() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("login.html");
        return;
    }

    userEmail.textContent =
        `Signed in as ${data.session.user.email}`;

    // Fetch the user's dashboard information.
    const [
        inventoryResult,
        recipesCountResult,
        favouritesCountResult,
        recentRecipesResult
    ] = await Promise.all([
        supabaseClient
            .from("inventory_items")
            .select("id, name, quantity, unit, expiry_date")
            .order("expiry_date", { ascending: true }),

        supabaseClient
            .from("recipes")
            .select("id", { count: "exact", head: true }),

        supabaseClient
            .from("saved_recipes")
            .select("id", { count: "exact", head: true }),

        supabaseClient
            .from("recipes")
            .select("id, title, description, cooking_time_minutes, created_at")
            .order("created_at", { ascending: false })
            .limit(3)
    ]);

    // Inventory information
    if (inventoryResult.error) {
        console.error(
            "Unable to load inventory:",
            inventoryResult.error
        );

        inventoryCount.textContent = "—";
        expiringCount.textContent = "—";

        expiringList.textContent =
            "Unable to load your ingredients.";
    } else {
        const ingredients = inventoryResult.data || [];

        inventoryCount.textContent = ingredients.length;

        const today = getLocalDateString(new Date());

        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        const endDate = getLocalDateString(sevenDaysLater);

        const expiringIngredients = ingredients.filter(
            (ingredient) =>
                ingredient.expiry_date &&
                ingredient.expiry_date >= today &&
                ingredient.expiry_date <= endDate
        );

        expiringCount.textContent = expiringIngredients.length;

        displayExpiringIngredients(ingredients);
    }

    // Generated recipe count
    if (recipesCountResult.error) {
        console.error(
            "Unable to load recipe count:",
            recipesCountResult.error
        );

        recipesCount.textContent = "—";
    } else {
        recipesCount.textContent =
            recipesCountResult.count ?? 0;
    }

    // Favourite recipe count
    if (favouritesCountResult.error) {
        console.error(
            "Unable to load favourite count:",
            favouritesCountResult.error
        );

        favouritesCount.textContent = "—";
    } else {
        favouritesCount.textContent =
            favouritesCountResult.count ?? 0;
    }

    // Recently generated recipes
    if (recentRecipesResult.error) {
        console.error(
            "Unable to load recent recipes:",
            recentRecipesResult.error
        );

        recentRecipes.textContent =
            "Unable to load your recent recipes.";
    } else {
        displayRecentRecipes(recentRecipesResult.data);
    }
}

loadDashboard();
