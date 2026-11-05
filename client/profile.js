
const profileForm = document.getElementById("profile-form");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileMessage = document.getElementById("profile-message");
const saveProfileButton = document.getElementById("save-profile-button");

async function loadProfile() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("index.html");
        return;
    }

    const user = data.session.user;

    profileName.value = user.user_metadata?.full_name || "";
    profileEmail.value = user.email || "";
    profileForm.hidden = false;
    profileMessage.textContent = "Your account details are loaded.";
}

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
    profileMessage.textContent = "Your profile has been updated.";
});

loadProfile();
