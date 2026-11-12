
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
const forgotPasswordLink = document.getElementById("forgot-password-link");

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
    forgotPasswordLink.classList.toggle("hidden", registering);
    confirmPasswordInput.disabled = !registering;
    confirmPasswordInput.required = registering;

    passwordInput.autocomplete = registering
        ? "new-password"
        : "current-password";

    passwordHint.textContent = registering
    ? "Password must meet all the requirements below."
    : "Enter your password.";

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

    updatePasswordRequirements();
    updatePasswordMatch();
}

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
    if (!isRegistering) {
        return;
    }

    const requirements = validatePassword(passwordInput.value);

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

    passwordInput.setCustomValidity(
        allRequirementsMet
            ? ""
            : "Please meet all password requirements."
    );
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
    updatePasswordRequirements();
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
                password,
                options: {
                    // After verifying, come back to this login page on
                    // the same site (Live Server or the deployed site).
                    emailRedirectTo: new URL(
                        "login.html",
                        window.location.href
                    ).href
                }
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
                // Supabase doesn't say whether the email is already
                // registered (that would reveal who has an account), so
                // this message covers both cases.
                showMessage(
                    "Check your email for a verification link. If you " +
                        "already have an account, log in or reset your " +
                        "password instead.",
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

// Handle arriving here from an email link (sign-up verification).
async function handleEmailLink() {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);

    const linkError =
        hashParams.get("error_code") ||
        queryParams.get("error_code") ||
        hashParams.get("error") ||
        queryParams.get("error");
    const linkType = hashParams.get("type");

    if (!linkError && !hashParams.has("access_token")) {
        return;
    }

    // Wait for Supabase to read the sign-in details from the link...
    const { data } = await supabaseClient.auth.getSession();

    // ...then clear them from the address bar so they can't be shared.
    window.history.replaceState(null, "", window.location.pathname);

    if (linkError) {
        showMessage(
            linkError === "otp_expired"
                ? "That link has expired or has already been used. Log in, or create your account again to get a new link."
                : "That link isn't valid. Please log in or try again.",
            "error"
        );
        return;
    }

    // A password reset link that landed here: finish it on its own page.
    if (linkType === "recovery" && data.session) {
        window.location.replace("reset-password.html");
        return;
    }

    if (data.session) {
        showMessage(
            "Email verified! Taking you to your dashboard...",
            "success"
        );

        setTimeout(() => {
            window.location.replace("dashboard.html");
        }, 1500);
    }
}

handleEmailLink();

// Restore and observe the Supabase session.
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
        console.log("User signed in:", session.user.email);
    }

    if (event === "SIGNED_OUT") {
        console.log("User signed out.");
    }
});
