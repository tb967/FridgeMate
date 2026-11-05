/*

It will handle:
- Loading ingredients from Supabase.
- Adding new ingredients.
- Displaying your ingredients.
- Editing existing ingredients.
- Deleting ingredients.
- Checking the user's login session.

*/

// Inventory page elements
const inventoryForm = document.getElementById("inventory-form");
const inventoryList = document.getElementById("inventory-list");
const inventoryMessage = document.getElementById("inventory-message");

const ingredientName = document.getElementById("ingredient-name");
const ingredientQuantity = document.getElementById("ingredient-quantity");
const ingredientUnit = document.getElementById("ingredient-unit");
const ingredientCategory = document.getElementById("ingredient-category");
const ingredientExpiry = document.getElementById("ingredient-expiry");

const addIngredientButton = document.getElementById("add-ingredient-button");

// Keep track of the ingredient currently being edited.
let editingIngredientId = null;

// Create a cancel button for edit mode.
const cancelEditButton = document.createElement("button");
cancelEditButton.type = "button";
cancelEditButton.textContent = "Cancel editing";
cancelEditButton.hidden = true;
cancelEditButton.className = "nav-sign-out";
inventoryForm.appendChild(cancelEditButton);

// Check that the user is signed in.
async function checkInventorySession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("index.html");
        return null;
    }

    return data.session.user;
}

// Display a message to the user.
function showInventoryMessage(message) {
    inventoryMessage.textContent = message;
}

// Determine the expiry status of an ingredient.
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

    if (difference === 1) {
        return "Expires tomorrow";
    }

    if (difference <= 7) {
        return `Expires in ${difference} days`;
    }

    return `Expires: ${expiry.toLocaleDateString("en-GB")}`;
}

// Create an ingredient card safely using DOM methods.
function createIngredientCard(ingredient) {
    const card = document.createElement("article");
    card.className = "ingredient-card";

    const name = document.createElement("h3");
    name.textContent = ingredient.name;

    const quantity = document.createElement("p");
    quantity.textContent =
        `Quantity: ${ingredient.quantity} ${ingredient.unit}`;

    const category = document.createElement("p");
    category.textContent = `Category: ${ingredient.category}`;

    const expiry = document.createElement("p");
    expiry.textContent = getExpiryStatus(ingredient.expiry_date);
    expiry.className = "ingredient-expiry";

    if (ingredient.expiry_date) {
        const status = getExpiryStatus(ingredient.expiry_date);

        if (status === "Expired" || status === "Expires today") {
            expiry.classList.add("expiry-urgent");
        } else if (status.startsWith("Expires")) {
            expiry.classList.add("expiry-soon");
        }
    }

    // Edit button
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.className = "ingredient-edit-button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = ingredient.id;

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "ingredient-delete-button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = ingredient.id;

    const actions = document.createElement("div");
    actions.className = "ingredient-actions";
    actions.append(editButton, deleteButton);

    card.append(name, quantity, category, expiry, actions);

    return card;
}

// Load ingredients belonging to the signed-in user.
// Supabase RLS ensures users only see their own records.
async function loadIngredients() {
    inventoryList.replaceChildren();

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Loading your ingredients...";
    inventoryList.appendChild(loadingMessage);

    const { data, error } = await supabaseClient
        .from("inventory_items")
        .select("*")
        .order("expiry_date", {
            ascending: true,
            nullsFirst: false
        });

    if (error) {
        console.error("Error loading inventory:", error.message);
        inventoryList.textContent =
            "Unable to load your ingredients. Please try again.";
        return;
    }

    inventoryList.replaceChildren();

    if (!data || data.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent =
            "Your inventory is empty. Add your first ingredient using the form.";

        inventoryList.appendChild(emptyMessage);
        return;
    }

    data.forEach((ingredient) => {
        inventoryList.appendChild(createIngredientCard(ingredient));
    });
}

// Reset the form after adding or updating an ingredient.
function resetInventoryForm() {
    inventoryForm.reset();

    editingIngredientId = null;

    addIngredientButton.textContent = "+ Add ingredient";
    cancelEditButton.hidden = true;

    showInventoryMessage("Ready to manage your ingredients.");
}

// Handle adding and updating ingredients.
inventoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = await checkInventorySession();

    if (!user) {
        return;
    }

    const name = ingredientName.value.trim();
    const quantity = Number(ingredientQuantity.value);
    const unit = ingredientUnit.value;
    const category = ingredientCategory.value;
    const expiryDate = ingredientExpiry.value || null;

    if (!name || !Number.isFinite(quantity) || quantity <= 0) {
        showInventoryMessage(
            "Please enter a valid ingredient name and quantity."
        );
        return;
    }

    const ingredient = {
        name,
        quantity,
        unit,
        category,
        expiry_date: expiryDate
    };

    addIngredientButton.disabled = true;
    cancelEditButton.disabled = true;

    showInventoryMessage(
        editingIngredientId
            ? "Updating ingredient..."
            : "Adding ingredient..."
    );

    let result;

    if (editingIngredientId) {
        result = await supabaseClient
            .from("inventory_items")
            .update(ingredient)
            .eq("id", editingIngredientId);
    } else {
        result = await supabaseClient
            .from("inventory_items")
            .insert({
                ...ingredient,
                user_id: user.id
            });
    }

    addIngredientButton.disabled = false;
    cancelEditButton.disabled = false;

    if (result.error) {
        console.error("Error saving ingredient:", result.error.message);

        showInventoryMessage(
            "Unable to save the ingredient. Please try again."
        );
        return;
    }

    const wasEditing = editingIngredientId !== null;

    resetInventoryForm();

    showInventoryMessage(
        wasEditing
            ? "Ingredient updated successfully!"
            : "Ingredient added successfully!"
    );

    await loadIngredients();
});

// Handle edit and delete button clicks.
inventoryList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const ingredientId = button.dataset.id;
    const action = button.dataset.action;

    const user = await checkInventorySession();

    if (!user) {
        return;
    }

    if (action === "edit") {
        const { data, error } = await supabaseClient
            .from("inventory_items")
            .select("*")
            .eq("id", ingredientId)
            .single();

        if (error) {
            console.error("Error retrieving ingredient:", error.message);
            showInventoryMessage("Unable to load this ingredient.");
            return;
        }

        ingredientName.value = data.name;
        ingredientQuantity.value = data.quantity;
        ingredientUnit.value = data.unit;
        ingredientCategory.value = data.category;
        ingredientExpiry.value = data.expiry_date || "";

        editingIngredientId = data.id;

        addIngredientButton.textContent = "Save changes";
        cancelEditButton.hidden = false;

        showInventoryMessage(`Editing ${data.name}.`);

        inventoryForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            "Are you sure you want to delete this ingredient?"
        );

        if (!confirmed) {
            return;
        }

        button.disabled = true;

        const { error } = await supabaseClient
            .from("inventory_items")
            .delete()
            .eq("id", ingredientId);

        if (error) {
            console.error("Error deleting ingredient:", error.message);
            showInventoryMessage("Unable to delete this ingredient.");
            button.disabled = false;
            return;
        }

        showInventoryMessage("Ingredient deleted successfully!");

        if (editingIngredientId === ingredientId) {
            resetInventoryForm();
        }

        await loadIngredients();
    }
});

// Cancel editing.
cancelEditButton.addEventListener("click", () => {
    resetInventoryForm();
});

// Start the inventory page.
async function initialiseInventory() {
    const user = await checkInventorySession();

    if (!user) {
        return;
    }

    await loadIngredients();
}

initialiseInventory();
