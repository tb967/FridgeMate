
const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");
const authForm = document.getElementById("auth-form");

const formTitle = document.getElementById("form-title");
const formDescription = document.getElementById("form-description");
const submitButton = document.getElementById("submit-button");
const submitText = document.getElementById("submit-text");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");

const confirmPasswordField = document.getElementById(
    "confirm-password-field"
);

const passwordHint = document.getElementById("password-hint");
const confirmHint = document.getElementById("confirm-hint");
const authMessage = document.getElementById("auth-message");

let isRegistering = false;

function showMessage(message, type = "") {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`.trim();
}

function clearMessage() {
    showMessage("");
}

function setLoading(loading) {
    submitButton.disabled = loading;
    submitText.textContent = loading
        ? "Please wait..."
        : isRegistering
            ? "Create account"
            : "Log in";
}

function setAuthMode(registering) {
    isRegistering = registering;

    loginTab.classList.toggle("active", !registering);
    registerTab.classList.toggle("active", registering);

    loginTab.setAttribute("aria-selected", String(!registering));
    registerTab.setAttribute("aria-selected", String(registering));

    formTitle.textContent = registering
        ? "Create your account"
        : "Welcome back!";

    formDescription.textContent = registering
        ? "Start making the most of your ingredients."
        : "Your ingredients have been waiting. Let's get cooking.";

    confirmPasswordField.classList.toggle("hidden", !registering);
    confirmPasswordInput.disabled = !registering;
    confirmPasswordInput.required = registering;

    passwordInput.autocomplete = registering
        ? "new-password"
        : "current-password";

    passwordHint.textContent = registering
        ? "Use at least 8 characters."
        : "";

    passwordHint.className = "field-hint";
    confirmHint.textContent = "Enter the same password again.";
    confirmHint.className = "field-hint";

    submitButton.disabled = false;
    submitText.textContent = registering ? "Create account" : "Log in";

    clearMessage();

    if (!registering) {
        confirmPasswordInput.value = "";
        confirmPasswordInput.setCustomValidity("");
    }

    updatePasswordMatch();
}

function updatePasswordMatch() {
    if (!isRegistering || !confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity("");
        confirmHint.textContent = "Enter the same password again.";
        confirmHint.className = "field-hint";
        return;
    }

    if (passwordInput.value === confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity("");
        confirmHint.textContent = "Passwords match.";
        confirmHint.className = "field-hint success";
    } else {
        confirmPasswordInput.setCustomValidity(
            "The passwords must match."
        );
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
        button.setAttribute(
            "aria-label",
            `${showing ? "Hide" : "Show"} ${
                button.dataset.target === "password"
                    ? "password"
                    : "confirmation password"
            }`
        );
    });
});

loginTab.addEventListener("click", () => setAuthMode(false));
registerTab.addEventListener("click", () => setAuthMode(true));

passwordInput.addEventListener("input", () => {
    clearMessage();
    updatePasswordMatch();
});

confirmPasswordInput.addEventListener("input", () => {
    clearMessage();
    updatePasswordMatch();
});

emailInput.addEventListener("input", clearMessage);

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    updatePasswordMatch();

    if (!authForm.checkValidity()) {
        authForm.reportValidity();
        return;
    }

    setLoading(true);

    try {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (isRegistering) {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                showMessage(
                    "Account created successfully! You're now signed in.",
                    "success"
                );
            } else {
                showMessage(
                    "Account created! Check your email for a verification link before logging in.",
                    "success"
                );
            }
        } else {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                window.location.href = "dashboard.html";
            }

            showMessage("Login successful! Welcome back.", "success");
        }
    } catch (error) {
        console.error("Authentication error:", error);

        showMessage(
            error.message || "Something went wrong. Please try again.",
            "error"
        );
    } finally {
        setLoading(false);
    }
});

setAuthMode(false);

// Restore and observe the Supabase session.
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
        console.log("User signed in:", session.user.email);
    }

    if (event === "SIGNED_OUT") {
        console.log("User signed out.");
    }
});
