
/*

Forgot password page.

Asks Supabase to email a password reset link. The link opens
reset-password.html, where the user chooses a new password.

The success message is the same whether or not an account exists for
the email, so this page can't be used to find out who has an account.

*/

const forgotForm = document.getElementById("forgot-form");
const forgotEmail = document.getElementById("email");
const sendButton = document.getElementById("send-button");
const sendText = document.getElementById("send-text");
const forgotMessage = document.getElementById("forgot-message");

// Wait this long before another link can be requested.
const RESEND_WAIT_SECONDS = 60;

function showForgotMessage(message, type = "") {
    forgotMessage.textContent = message;
    forgotMessage.className = `auth-message ${type}`.trim();
}

// Briefly block repeat requests, which also avoids email rate limits.
function startResendWait() {
    let secondsLeft = RESEND_WAIT_SECONDS;

    sendButton.disabled = true;
    sendText.textContent = `Send again in ${secondsLeft}s`;

    const timer = setInterval(() => {
        secondsLeft -= 1;

        if (secondsLeft <= 0) {
            clearInterval(timer);
            sendButton.disabled = false;
            sendText.textContent = "Send reset link";
            return;
        }

        sendText.textContent = `Send again in ${secondsLeft}s`;
    }, 1000);
}

forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!forgotForm.checkValidity()) {
        forgotForm.reportValidity();
        return;
    }

    sendButton.disabled = true;
    sendText.textContent = "Sending...";
    showForgotMessage("");

    // Send the user to reset-password.html in this same site, whether it
    // is running on Live Server or deployed.
    const redirectTo = new URL("reset-password.html", window.location.href).href;

    const { error } = await supabaseClient.auth.resetPasswordForEmail(
        forgotEmail.value.trim(),
        { redirectTo }
    );

    if (error) {
        console.error("Password reset request failed:", error);

        sendButton.disabled = false;
        sendText.textContent = "Send reset link";

        showForgotMessage(
            error.status === 429
                ? "Too many requests. Please wait a few minutes and try again."
                : "Something went wrong. Please try again.",
            "error"
        );
        return;
    }

    showForgotMessage(
        "If an account exists for that email, we've sent a link to reset " +
            "your password. Check your inbox and spam folder.",
        "success"
    );

    startResendWait();
});
