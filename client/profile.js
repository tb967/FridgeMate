
const profileForm = document.getElementById("profile-form");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileMessage = document.getElementById("profile-message");
const saveProfileButton = document.getElementById("save-profile-button");

const profileDisplayName = document.getElementById("profile-display-name");
const profileInitials = document.getElementById("profile-initials");

const dietaryForm = document.getElementById("dietary-form");
const dietaryMessage = document.getElementById("dietary-message");
const saveDietaryButton = document.getElementById("save-dietary-button");
const dietaryCheckboxes = document.querySelectorAll('input[name="dietary-preference"]');

const passwordForm = document.getElementById("password-form");
const newPassword = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");
const passwordMessage = document.getElementById("password-message");
const changePasswordButton = document.getElementById("change-password-button");
const passwordHint = document.getElementById("password-hint");
const confirmHint = document.getElementById("confirm-hint");

// Generate initials from the user's name.
function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "U";
}

// Update the profile overview.
function updateProfileOverview(name) {
    const displayName = name.trim() || "Welcome!";

    profileDisplayName.textContent = displayName;
    profileInitials.textContent = getInitials(name);
}

// Load the user's profile information.
async function loadProfile() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("login.html");
        return;
    }

    const user = data.session.user;
    const fullName = user.user_metadata?.full_name || "";

    // Personal information
    profileName.value = fullName;
    profileEmail.value = user.email || "";

    updateProfileOverview(fullName);

    profileForm.hidden = false;
    profileMessage.textContent = "Your account details are loaded.";

    // Dietary preferences
    const savedPreferences =
        user.user_metadata?.dietary_preferences || [];

    dietaryCheckboxes.forEach((checkbox) => {
        checkbox.checked = savedPreferences.includes(checkbox.value);
    });

    dietaryForm.hidden = false;
    dietaryMessage.textContent = savedPreferences.length > 0
        ? "Your dietary preferences are loaded."
        : "Choose any preferences that apply to you.";
}

// Save personal information.
profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = profileName.value.trim();

    if (!name) {
        profileMessage.textContent = "Please enter your name.";
        profileName.focus();
        return;
    }

    saveProfileButton.disabled = true;
    profileMessage.textContent = "Saving your changes...";

    const { data, error } = await supabaseClient.auth.updateUser({
        data: { full_name: name }
    });

    saveProfileButton.disabled = false;

    if (error) {
        profileMessage.textContent =
            "Unable to save your changes. Please try again.";

        console.error("Profile update failed:", error.message);
        return;
    }

    profileName.value = data.user.user_metadata?.full_name || name;
    updateProfileOverview(profileName.value);

    profileMessage.textContent = "Your profile has been updated.";
});

// Save dietary preferences.
dietaryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedPreferences = Array.from(dietaryCheckboxes)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);

    saveDietaryButton.disabled = true;
    dietaryMessage.textContent = "Saving your preferences...";

    const { error } = await supabaseClient.auth.updateUser({
        data: {
            dietary_preferences: selectedPreferences
        }
    });

    saveDietaryButton.disabled = false;

    if (error) {
        dietaryMessage.textContent =
            "Unable to save your preferences. Please try again.";

        console.error("Dietary preferences update failed:", error.message);
        return;
    }

    dietaryMessage.textContent = selectedPreferences.length > 0
        ? "Your dietary preferences have been saved."
        : "Your dietary preferences have been cleared.";
});

// Check the password requirements.
function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}

// Display live password requirement feedback.
function updatePasswordRequirements() {
    const requirements = validatePassword(newPassword.value);

    const messages = [
        { key: "length", text: "At least 8 characters" },
        { key: "uppercase", text: "At least one uppercase letter" },
        { key: "lowercase", text: "At least one lowercase letter" },
        { key: "number", text: "At least one number" },
        { key: "special", text: "At least one special character" }
    ];

    passwordHint.replaceChildren();

    messages.forEach((requirement) => {
        const item = document.createElement("div");
        const met = requirements[requirement.key];

        item.textContent = `${met ? "✓" : "○"} ${requirement.text}`;
        item.className = met ? "requirement met" : "requirement";

        passwordHint.appendChild(item);
    });

    const allRequirementsMet = Object.values(requirements).every(Boolean);

    newPassword.setCustomValidity(
        allRequirementsMet
            ? ""
            : "Please meet all password requirements."
    );

    return allRequirementsMet;
}

// Check whether the passwords match.
function updatePasswordMatch() {
    if (!confirmPassword.value) {
        confirmPassword.setCustomValidity("");
        confirmHint.textContent = "Enter the same password again.";
        confirmHint.className = "field-hint";
        return;
    }

    if (newPassword.value === confirmPassword.value) {
        confirmPassword.setCustomValidity("");
        confirmHint.textContent = "Passwords match.";
        confirmHint.className = "field-hint success";
    } else {
        confirmPassword.setCustomValidity(
            "The passwords must match."
        );
        confirmHint.textContent = "Passwords do not match.";
        confirmHint.className = "field-hint error";
    }
}

// Update password requirements as the user types.
newPassword.addEventListener("input", () => {
    passwordMessage.textContent = "";
    updatePasswordRequirements();
    updatePasswordMatch();
});

// Check password confirmation as the user types.
confirmPassword.addEventListener("input", () => {
    passwordMessage.textContent = "";
    updatePasswordMatch();
});

// Update the user's password.
passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = newPassword.value;
    const confirmation = confirmPassword.value;

    if (!updatePasswordRequirements()) {
        passwordMessage.textContent =
            "Please meet all password requirements.";
        newPassword.focus();
        return;
    }

    if (password !== confirmation) {
        passwordMessage.textContent =
            "Your passwords do not match.";
        confirmPassword.focus();
        return;
    }

    changePasswordButton.disabled = true;
    passwordMessage.textContent = "Updating your password...";

    const { error } = await supabaseClient.auth.updateUser({
        password: password
    });

    changePasswordButton.disabled = false;

    if (error) {
        passwordMessage.textContent =
            "Unable to update your password. Please try again.";

        console.error("Password update failed:", error.message);
        return;
    }

    passwordForm.reset();
    updatePasswordRequirements();
    updatePasswordMatch();

    passwordMessage.textContent =
        "Your password has been updated successfully.";
});

// Load the profile when the page opens.
loadProfile();
