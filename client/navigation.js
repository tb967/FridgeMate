
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
const navSignOut = document.getElementById("sign-out-button");

if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

if (navSignOut) {
    navSignOut.addEventListener("click", async () => {
        navSignOut.disabled = true;

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            alert("Unable to sign out. Please try again.");
            navSignOut.disabled = false;
            return;
        }

        window.location.replace("login.html");
    });
}
