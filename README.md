# FridgeMate

**Your smarter kitchen companion.**

FridgeMate is an AI-powered food inventory and recipe management web application designed to help users organise their ingredients, keep track of expiry dates and discover new meals using the food they already have.

By combining inventory management with AI-generated recipe suggestions, FridgeMate aims to make meal planning easier, reduce food waste and help users make better use of their kitchen ingredients.

## Features

### Public Landing Page
- Responsive landing page introducing FridgeMate and its main features.
- Clear navigation to the login and registration pages.
- Overview of how the application helps users manage ingredients and reduce food waste.

### User Authentication
- User registration and login using Supabase Authentication.
- Email and password authentication.
- Email verification: new accounts confirm their email address through a link, which returns them to FridgeMate and signs them in.
- Forgot password: users can request a reset link from the login page and choose a new password.
- Password strength validation during registration and password reset.
- Password confirmation to prevent mismatched passwords.
- Sign-up and password-reset messages never reveal whether an email address is already registered.
- Protected application pages for authenticated users.
- Sign-out functionality.

Passwords must contain:
- At least 8 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one number.
- At least one special character.

### Dashboard
- Personalised dashboard for signed-in users.
- Counts of inventory items, items expiring soon, generated recipes and favourites.
- Lists of ingredients that are expiring soon and recently generated recipes.
- Navigation to the inventory, recipes and profile sections.

### Ingredient Inventory Management
- Add ingredients to a personal digital inventory.
- Record ingredient names, quantities, units and categories.
- Optionally add expiry dates.
- View and manage stored ingredients.
- Keep track of ingredients that are approaching their expiry dates.

Supported inventory units include:
- Items
- Grams (g)
- Kilograms (kg)
- Millilitres (ml)
- Litres (l)
- Packs

Ingredient categories include dairy, fruit, vegetables, meat, fish, grains, canned goods and other.

### AI-Powered Recipe Generation
FridgeMate integrates Google's Gemini API to generate personalised recipes based on the user's available ingredients.

Users can:
- Generate three different recipe suggestions at a time, each serving 2 people.
- Select a dietary preference (no preference, vegetarian, vegan, high-protein or dairy-free).
- Choose a maximum cooking time of 15, 30, 45 or 60 minutes.
- Optionally specify additional ingredients they would like to use.
- View recipe ingredients, quantities and step-by-step cooking instructions.
- View estimated nutritional information per serving, including calories, protein, carbohydrates and fat.

Recipe generation considers:
- Ingredients already stored in the user's inventory, without using more of an item than the user has.
- Ingredients approaching their expiry dates, which are prioritised.
- The user's saved dietary preferences.
- The selected cooking-time limit.
- Minimising the need for additional ingredients.

Recipe generation also protects against unsuitable ingredients:
- **Expired ingredients are removed before anything is sent to the AI**, so they can never appear in a recipe. If every ingredient has expired, the user is told which ones instead.
- **Items that aren't recognisable food** (for example gibberish, cleaning products or other non-food items) are never used. If nothing usable is left, no recipes are created and the user is told which items were skipped.
- After generating, the page tells the user about any ingredients that were left out and why.

### Dietary Preferences
Users can save dietary preferences through their profile.

Supported saved preferences include:
- Vegetarian
- Vegan
- Pescatarian
- Dairy-free
- Gluten-free
- Nut-free

Saved preferences are combined with the dietary selection made when generating recipes, allowing the application to consider multiple requirements. Pescatarian, gluten-free and nut-free are currently available as saved profile preferences only, not in the recipe page's dropdown.

### Saved Recipes and Favourites
- Every generated recipe is saved automatically to the user's recipe list in Supabase.
- Mark recipes as favourites and view them separately from generated recipes.
- Remove recipes from favourites, or delete them when they are no longer needed.

### User Profile
- View and update personal profile information.
- Manage saved dietary preferences.
- Change account passwords.
- View account information associated with the signed-in user.

### Responsive Design
- Responsive layouts for desktop and mobile devices.
- Consistent green-themed interface.
- Navigation designed to make the main application features easy to access.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure and page content |
| CSS3 | Styling, responsive layouts and user interface design |
| JavaScript | Frontend functionality and application logic |
| Node.js | Backend runtime environment |
| Express.js | Backend server, API endpoints and serving the frontend pages |
| Supabase | Authentication, database and user data management |
| Supabase Row Level Security (RLS) | Restricting database access to authorised user records |
| Google Gemini API | AI-powered recipe generation |
| `@google/genai` | Integration with Google's Gemini API |
| Git & GitHub | Version control and source code management |
| Visual Studio Code | Development environment |

---

## Application Architecture

FridgeMate uses a frontend and backend architecture.

**Frontend**

The frontend is built using HTML, CSS and JavaScript. It provides the user interface and handles user interactions. It talks to Supabase directly for sign-in, inventory, favourites and profile data, and to the Express backend for recipe generation.

**Backend**

The backend uses Node.js and Express.js. It serves the frontend pages from the `client` folder and handles recipe-generation requests: it authenticates users through Supabase, retrieves their inventory, removes expired items and communicates with the Gemini API. Recipe generation goes through the backend so that the Gemini API key is never exposed to the browser.

**Database and Authentication**

Supabase provides user authentication and PostgreSQL database storage. Row Level Security (RLS) policies help ensure that users can only access their own records.

**AI Integration**

Google Gemini generates recipes based on the user's inventory and preferences. The request includes a JSON schema describing the exact structure required, and responses are validated again before being saved to the database and returned to the frontend.

### Recipe Generation Workflow

1. The user signs in and adds ingredients to their inventory.
2. The user navigates to the recipe generator.
3. They select their dietary preference and maximum cooking time.
4. The frontend sends a request to the Express backend, including the user's Supabase access token.
5. The backend verifies the user's authentication.
6. The backend retrieves the user's inventory from Supabase and removes any expired items, working out how many days each remaining item has left.
7. Today's date, the remaining ingredients and the dietary requirements are sent to Google Gemini.
8. Gemini returns three recipe suggestions in JSON format, or none if no recognisable food is available, along with a list of any items it could not use.
9. The response is checked against a defined schema and additional validation rules.
10. If the response is invalid, the backend retries the generation request once.
11. Valid recipes are saved to Supabase and returned to the frontend, together with any expired or unusable ingredients that were left out.
12. The user can view, favourite and manage their generated recipes.

---

## Project Structure

```text
FridgeMate/
│
├── client/
│   ├── index.html             # Public landing page
│   ├── login.html             # Login and registration
│   ├── forgot-password.html   # Request a password reset link
│   ├── reset-password.html    # Choose a new password
│   ├── privacy.html           # Privacy notice
│   ├── dashboard.html         # User dashboard
│   ├── inventory.html         # Ingredient inventory
│   ├── recipes.html           # AI recipe generator
│   ├── profile.html           # User profile and preferences
│   │
│   ├── style.css              # Application styling
│   ├── supabase-client.js     # Frontend Supabase configuration
│   ├── app.js                 # Login, registration and email verification
│   ├── forgot-password.js     # Password reset requests
│   ├── reset-password.js      # Setting a new password
│   ├── dashboard.js           # Dashboard functionality
│   ├── inventory.js           # Inventory management
│   ├── recipes.js             # Recipe generation and favourites
│   ├── profile.js             # Profile and dietary preferences
│   └── navigation.js          # Shared navigation functionality
│
├── server/
│   ├── server.js              # Express server, API routes and frontend hosting
│   ├── supabase.js            # Backend Supabase configuration
│   ├── recipeValidation.js    # Gemini response schema, validation and retry
│   ├── package.json           # Backend dependencies and scripts
│   └── package-lock.json      # Locked dependency versions
│
├── supabase/
│   └── migrations/
│       ├── 20261105000000_initial_schema.sql
│       ├── 20261105143214_revoke_public_execute_rls_auto_enable.sql
│       └── 20261109140958_grant_authenticated_access_to_recipes.sql
│
├── .gitignore
├── .env                       # Local environment variables (not committed)
└── README.md
```

---

## Getting Started

Follow the instructions below to run FridgeMate locally.

### Prerequisites

Before getting started, make sure you have:

- [Node.js](https://nodejs.org/) installed (developed and tested with Node.js 24).
- npm installed (included with Node.js).
- [Visual Studio Code](https://code.visualstudio.com/) or another code editor.
- A [Supabase](https://supabase.com/) account and project.
- A [Google AI Studio](https://aistudio.google.com/) account with a Gemini API key.
- A local development server, such as the VS Code Live Server extension (optional: the Express server can also serve the pages).

### 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/tb967/FridgeMate.git
```

Navigate into the project:

```bash
cd FridgeMate
```

### 2. Configure Supabase

Create a new project through the [Supabase Dashboard](https://supabase.com/dashboard).

You will need:

- Your Supabase project URL.
- Your Supabase publishable key.

Enable email and password authentication in the Supabase Authentication settings.

The application uses the following database tables:

| Table | Purpose |
|---|---|
| `inventory_items` | Stores users' ingredient inventory |
| `recipes` | Stores generated recipes |
| `saved_recipes` | Stores users' favourite recipes |

**Create the database by applying the three migrations in `supabase/migrations/`, in filename order.** You can paste each file into the Supabase SQL Editor and run it, or use the Supabase CLI.

| Migration | What it does |
|---|---|
| `20261105000000_initial_schema.sql` | Creates the three tables, their columns, checks and indexes, enables Row Level Security and adds policies so users can only access their own records |
| `20261105143214_revoke_public_execute_rls_auto_enable.sql` | Stops the helper function that switches on RLS for new tables from being called through the public API |
| `20261109140958_grant_authenticated_access_to_recipes.sql` | Grants signed-in users permission to read, insert and delete their own recipe and saved-recipe records |

The initial migration also adds an event trigger that switches on RLS automatically for any new table. If your Supabase project does not allow event triggers to be created, that part can be skipped: the same migration enables RLS on all three tables directly.

**Configure the authentication URLs.** In the Supabase Dashboard, go to **Authentication → URL Configuration**:

- **Site URL:** the address of the login page, for example `http://127.0.0.1:5500/client/login.html` for local development, or `https://your-deployed-site/login.html` once deployed.
- **Redirect URLs:** add `http://127.0.0.1:5500/**` and `http://localhost:5500/**` for local development, plus your deployed address followed by `/**`.

Email verification and password reset links only return users to addresses on this list. Without it, those links will not reach the FridgeMate pages.

### 3. Configure Frontend Supabase Credentials

Open:

```text
client/supabase-client.js
```

Configure the Supabase project URL and publishable key:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
```

Use your project's publishable key (or legacy anon key), never a Supabase service-role or secret key in frontend code.

### 4. Configure Environment Variables

Create a `.env` file in the **root project directory**, alongside the `client` and `server` folders.

Add the following environment variables:

```env
PORT=3000

CLIENT_ORIGIN=http://localhost:5500,http://127.0.0.1:5500

SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Replace the placeholder values with your own credentials.

`CLIENT_ORIGIN` lists the addresses allowed to call the backend from another origin, such as Live Server. It is optional: if it is left out, the two Live Server addresses above are allowed by default.

**Important:** The backend reads this `.env` file from the project root. Do not create or commit a file containing real credentials to GitHub.

The `.gitignore` file is configured to exclude `.env` files.

### 5. Install Backend Dependencies

Open a terminal in the project directory and navigate to the server folder:

```bash
cd server
```

Install the required dependencies:

```bash
npm install
```

On Windows PowerShell, if `npm` is blocked with a message about running scripts being disabled, use `npm.cmd` instead (for example `npm.cmd install`).

### 6. Start the Backend Server

For development, run:

```bash
npm run dev
```

Alternatively, start the server using:

```bash
npm start
```

The backend should now be running at:

```text
http://localhost:3000
```

You can check that the Express server is running by visiting:

```text
http://localhost:3000/health
```

### 7. Open the Frontend

There are two ways to open FridgeMate locally.

**Option A: through the Express server (the same way it runs when deployed)**

With the backend running, open:

```text
http://localhost:3000/
```

The server serves the pages from the `client` folder, so no separate frontend server is needed. Email verification and password reset links will only return to this address if it has been added to the Supabase Redirect URLs.

**Option B: with Live Server (useful while editing pages)**

Open the project in Visual Studio Code.

1. Navigate to the `client` folder.
2. Open `index.html`.
3. Right-click the file.
4. Select **Open with Live Server**.

The frontend should open at an address similar to:

```text
http://127.0.0.1:5500/client/index.html
```

When opened through Live Server on port 5500, the recipe page sends recipe requests to the backend at `http://localhost:3000`. If Live Server opens on a different port (for example because another Live Server window is already open), close the other window or add the new address to `CLIENT_ORIGIN`.

Both the frontend and backend must be running for the full application, including AI recipe generation, to work correctly.

---

## Backend API

The Express backend currently provides the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` and other page addresses | Serves the frontend pages from the `client` folder (for example `/` serves the landing page) |
| `GET` | `/health` | Checks that the backend server is running |
| `GET` | `/supabase-test` | Checks the Supabase Auth connection |
| `GET` | `/inventory-test` | Performs a basic inventory database connection test |
| `POST` | `/generate-recipes` | Generates, validates and saves AI recipes |

### Generate Recipes

**Endpoint:**

```http
POST /generate-recipes
```

**Authentication:**

Requires a valid Supabase access token supplied through the request's Authorization header.

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Example request body:**

```json
{
    "dietaryPreference": "vegetarian",
    "cookingTime": 30,
    "extraIngredients": "tomatoes, spinach"
}
```

**Example response structure:**

```json
{
    "message": "Recipes generated and saved successfully!",
    "recipes": [
        {
            "id": "recipe-id",
            "title": "Example Recipe",
            "description": "A simple meal using available ingredients.",
            "cookingTimeMinutes": 25,
            "ingredients": [],
            "instructions": [],
            "estimatedNutrition": {
                "calories": 350,
                "protein_g": 20,
                "carbohydrates_g": 40,
                "fat_g": 12
            },
            "usedExpiringIngredients": []
        }
    ],
    "unusableIngredients": [],
    "expiredIngredients": []
}
```

A successful response contains three generated recipes. `unusableIngredients` lists any items the AI did not recognise as food, and `expiredIngredients` lists any items left out because they had expired.

**Error responses:**

Every error response includes a `message` that can be shown to the user.

| Status | When it happens |
|---|---|
| `400` | Invalid dietary preference or cooking time; the inventory is empty; or every ingredient has expired |
| `401` | The user is not logged in, or their session is invalid |
| `422` | None of the ingredients are recognisable food (`code: "NO_USABLE_INGREDIENTS"`) |
| `429` | The AI service's usage limit has been reached |
| `500` | Server or database problem, or the server is missing its AI configuration |
| `502` | The AI returned unusable recipes twice in a row (`code: "AI_INVALID_RESPONSE"`) |
| `503` | The AI service is temporarily busy |

---

## Recipe Response Validation

FridgeMate includes a dedicated validation module in `server/recipeValidation.js`.

This module helps ensure that AI-generated recipes follow the expected data structure before they are stored in Supabase.

Each request to Gemini includes a JSON schema describing the exact structure required. The response is then validated again on the server.

Validation includes:

- Checking that exactly three recipes are returned, or none if no recognisable food was available (in which case the response must list the unusable items).
- Checking that recipes do not use any item the AI itself listed as unusable.
- Checking that recipe titles and descriptions have valid formats.
- Ensuring cooking times are whole numbers of minutes and do not exceed the requested limit.
- Checking that recipes contain ingredients and cooking instructions.
- Validating ingredient quantities.
- Checking nutritional values.
- Ensuring the response follows the expected JSON structure, converting numbers sent as text and dropping any unexpected fields.

If Gemini returns an invalid response, the application retries the request once, providing feedback about the validation errors.

This helps reduce the risk of malformed AI responses causing problems when saving or displaying recipes.

---

## Security Considerations

FridgeMate uses several measures to help protect user data:

- Supabase Authentication manages user accounts and sessions.
- Backend API requests require a valid Supabase access token.
- Authenticated Supabase clients ensure database queries run in the context of the signed-in user.
- Row Level Security policies restrict access to users' own database records.
- Gemini API credentials are stored in backend environment variables and never sent to the browser.
- Environment files are excluded from Git using `.gitignore`.
- Only the `client` folder is served publicly; server code and environment files are not.
- Recipe-generation requests are validated before being processed.
- Ingredient names and extra ingredients typed by users are treated as data in the AI prompt, never as instructions.
- Sign-up and password-reset messages do not reveal whether an email address has an account.
- Sign-in details from email verification and password reset links are removed from the browser's address bar as soon as they have been used.

Never commit API keys, passwords, Supabase secret keys or other sensitive credentials to the repository.

---

## Your Data and Deleting Your Account

FridgeMate is a bootcamp demonstration project, not a commercial service. The full privacy notice is in the app at [`client/privacy.html`](client/privacy.html), linked from the login page and the landing page footer.

**What is stored:** your email address and password (handled by Supabase and stored hashed), your name if you add one, any dietary preferences you save, your ingredients, and your generated and favourite recipes.

**Who receives it:**

| Service | What it receives | Why |
|---|---|---|
| Supabase (Frankfurt, EU) | Everything above | Login and database |
| Google Gemini API | Ingredients, dietary requirements, cooking time and extra ingredients (no email address or name) | Creating recipes |
| Web host (if deployed) | Requests to the website and server | Running the site |

**Deleting your account:** email **[alyswilliams1@outlook.com](mailto:alyswilliams1@outlook.com)** from the address you signed up with. Accounts are deleted within one month of a request. Deleting an account also deletes that user's ingredients, recipes and favourites, because every table is linked to the account and set to delete with it.

The same address can be used to ask for a copy of your data, to correct it, or for any other question about how it is used.

**For the team:** to delete an account, open the Supabase Dashboard, go to **Authentication → Users**, find the user, and choose **Delete user**.

---

## Data Protection Considerations

FridgeMate is only intended for demonstration by the project team. These points were considered, and would need action before it was opened to real users:

- **Gemini paid tier.** Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) say that only paid services may be used when making an app available to users in the UK, the EEA or Switzerland, and that personal information should not be sent to unpaid services. FridgeMate currently uses a free API key, which is suitable for the team's own demonstration only. Billing would be enabled before any public launch.
- **Self-service account deletion.** A "Delete my account" button on the profile page was considered. For the demonstration, deletion is handled by email request instead, which meets the requirement to act on erasure requests within one month.
- **Sensitive dietary preferences.** Preferences such as gluten-free or nut-free can reveal health conditions, and vegan or vegetarian can reveal beliefs, which UK data protection law treats as special category data. They are optional and only used to tailor recipes. A public version would ask for explicit consent before saving them.
- **Data retention.** Every generated recipe is kept until the account is deleted. A public version would need a defined retention period, for example removing inactive accounts after a set time.
- **Data location.** The Supabase project is hosted in Frankfurt (EU). The web host should also use an EU or UK region where possible.
- **Data minimisation.** Only the data needed to run the app is collected. There is no advertising, analytics or tracking, and only the session needed to stay logged in is stored in the browser.

---

## Notes and Limitations

- Recipes are generated using AI and may occasionally require adjustments.
- Nutritional information is approximate and should not be treated as professionally verified nutritional advice.
- Dietary preferences are provided to Gemini as recipe-generation requirements, but AI-generated recipes cannot guarantee that a meal is free from allergens or unsuitable ingredients. Always check ingredient labels and verify recipes independently.
- Expiry dates and recipe suggestions are intended to help with food management, not to determine whether food is safe to consume.
- Recipe generation requires an active internet connection and a valid Gemini API key.
- Gemini API availability and usage limits may affect recipe generation.
- **Privacy:** to create recipes, the user's ingredients, dietary requirements, cooking time and extra ingredients are sent to Google's Gemini API. Email addresses and names are not sent. See the "Your Data and Deleting Your Account" section above.
- Supabase's built-in email service only sends a small number of emails per hour, so verification and password reset emails may be delayed or refused during heavy testing.
- Leaked password protection (checking new passwords against known data breaches) requires a paid Supabase plan and is not enabled.
- The quantity field on the inventory page starts from 0.01 when using the arrow buttons or keys, so quantities can end up stored as values such as 5.01. Typing the quantity directly avoids this.
- The "Helps use up" note on recipe cards does not currently appear, because the list of expiring ingredients a recipe uses is not stored with the recipe.
- Users cannot delete their own account from within the application; instead they can request deletion by email (see the "Your Data and Deleting Your Account" section above).
- The `/supabase-test` and `/inventory-test` endpoints are development checks and are publicly reachable on a deployed site. They do not expose any user data.

---

## Future Improvements

Potential areas for further development include:

- More advanced meal-planning functionality.
- Weekly recipe planning.
- Automatic shopping-list generation based on missing ingredients.
- Improved nutritional information and filtering.
- Additional dietary preferences and recipe customisation, including all saved preferences in the recipe page's dropdown.
- Further enhancements to inventory tracking and expiry notifications.
- Fixing the inventory quantity field and storing the "Helps use up" information with each recipe.
- Self-service account deletion from the profile page.
- Enabling the Gemini paid tier, a consent step for dietary preferences and a data retention period before any public launch.
- Splitting the recipe-generation route into one file per step (login check, preferences, inventory, prompt, AI call, saving).
- Sharing code that is currently repeated across pages, such as the password rules and ingredient cards.
- Additional automated testing and backend security improvements.

---

## Contact

For questions about FridgeMate, your data or deleting your account, email **[alyswilliams1@outlook.com](mailto:alyswilliams1@outlook.com)**.

---

## Development

FridgeMate is developed using a frontend and backend structure, with a separate JavaScript file for each page and a dedicated module for validating AI responses.

Git and GitHub are used for version control and managing project changes.

Repository: [https://github.com/tb967/FridgeMate](https://github.com/tb967/FridgeMate)
