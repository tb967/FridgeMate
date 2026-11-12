
/*

Choose a new password page.

The reset email links here. Supabase signs the user in from the link
(the details are in the address after "#"), then the user sets a new
password. The link details are removed from the address bar straight
away so they can't be copied or shared.

*/

const resetForm = document.getElementById("reset-form");
const resetDescription = document.getElementById("reset-description");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const passwordHint = document.getElementById("password-hint");
const confirmHint = document.getElementById("confirm-hint");
const saveButton = document.getElementById("save-button");
const saveText = document.getElementById("save-text");
const resetMessage = document.getElementById("reset-message");

function showResetMessage(message, type = "") {
    resetMessage.textContent = message;
    resetMessage.className = `auth-message ${type}`.trim();
}

// Same password rules as the sign-up and profile pages.
function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}

function updatePasswordRequirements() {
    const requirements = validatePassword(newPasswordInput.value);

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

    newPasswordInput.setCustomValidity(
        Object.values(requirements).every(Boolean)
            ? ""
            : "Please meet all password requirements."
    );
}

function updatePasswordMatch() {
    if (!confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity("");
        confirmHint.textContent = "Enter the same password again.";
        confirmHint.className = "field-hint";
        return;
    }

    if (newPasswordInput.value === confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity("");
        confirmHint.textContent = "Passwords match.";
        confirmHint.className = "field-hint success";
    } else {
        confirmPasswordInput.setCustomValidity("The passwords must match.");
        confirmHint.textContent = "Passwords do not match.";
        confirmHint.className = "field-hint error";
    }
}

document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        const showing = input.type === "password";

        input.type = showing ? "text" : "password";
        button.textContent = showing ? "Hide" : "Show";
    });
});

newPasswordInput.addEventListener("input", () => {
    showResetMessage("");
    updatePasswordRequirements();
    updatePasswordMatch();
});

confirmPasswordInput.addEventListener("input", () => {
    showResetMessage("");
    updatePasswordMatch();
});

// Show what to do when the link is expired, used or invalid.
function showInvalidLink(reason) {
    resetForm.hidden = true;
    resetDescription.textContent =
        reason === "otp_expired"
            ? "This reset link has expired or has already been used."
            : "This reset link isn't valid.";

    const link = document.createElement("a");
    link.className = "auth-link";
    link.href = "forgot-password.html";
    link.textContent = "Request a new link";

    resetMessage.replaceChildren(link);
    resetMessage.className = "auth-message";
}

async function initialiseResetPage() {
    // Supabase puts link problems in the address, e.g. an expired link.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const linkError =
        hashParams.get("error_code") ||
        queryParams.get("error_code") ||
        hashParams.get("error") ||
        queryParams.get("error");

    // Wait for Supabase to read the sign-in details from the link.
    const { data } = await supabaseClient.auth.getSession();

    // Then clear the link details from the address bar.
    window.history.replaceState(null, "", window.location.pathname);

    if (linkError || !data.session) {
        showInvalidLink(linkError);
        return;
    }

    resetDescription.textContent =
        `Choose a new password for ${data.session.user.email}.`;
    resetForm.hidden = false;
    updatePasswordRequirements();
    newPasswordInput.focus();
}

resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    updatePasswordRequirements();
    updatePasswordMatch();

    if (!resetForm.checkValidity()) {
        resetForm.reportValidity();
        return;
    }

    saveButton.disabled = true;
    saveText.textContent = "Saving...";

    const { error } = await supabaseClient.auth.updateUser({
        password: newPasswordInput.value
    });

    if (error) {
        console.error("Password update failed:", error);

        saveButton.disabled = false;
        saveText.textContent = "Save new password";

        showResetMessage(
            error.message || "Your password couldn't be saved. Please try again.",
            "error"
        );
        return;
    }

    showResetMessage(
        "Password updated! Taking you to your dashboard...",
        "success"
    );

    setTimeout(() => {
        window.location.replace("dashboard.html");
    }, 1500);
});

initialiseResetPage();
