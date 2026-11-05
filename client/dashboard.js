
const userEmail = document.getElementById("user-email");
const signOutButton = document.getElementById("sign-out-button");

async function loadDashboard() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("index.html");
        return;
    }

    userEmail.textContent = `Signed in as ${data.session.user.email}`;
}

loadDashboard();
