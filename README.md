# 🍃 FridgeMate

**Your smarter kitchen companion.**

FridgeMate is an AI-powered food inventory and recipe management web application designed to help users organise their ingredients, keep track of expiry dates and discover new meals using the food they already have.

By combining inventory management with AI-generated recipe suggestions, FridgeMate aims to make meal planning easier, reduce food waste and help users make better use of their kitchen ingredients.

## ✨ Features

### 🏠 Public Landing Page
- Responsive landing page introducing FridgeMate and its main features.
- Clear navigation to the login and registration pages.
- Overview of how the application helps users manage ingredients and reduce food waste.

### 🔐 User Authentication
- User registration and login using Supabase Authentication.
- Email and password authentication.
- Password strength validation during registration.
- Password confirmation to prevent mismatched passwords.
- Protected application pages for authenticated users.
- Sign-out functionality.

Registration passwords must contain:
- At least 8 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one number.
- At least one special character.

### 📊 Dashboard
- Personalised dashboard for signed-in users.
- Overview of their kitchen inventory and application activity.
- Navigation to the inventory, recipes and profile sections.

### 🥬 Ingredient Inventory Management
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

### 🤖 AI-Powered Recipe Generation
FridgeMate integrates Google's Gemini API to generate personalised recipes based on the user's available ingredients.

Users can:
- Generate three different recipe suggestions at a time.
- Select a dietary preference.
- Choose a maximum cooking time of 15, 30, 45 or 60 minutes.
- Optionally specify additional ingredients they would like to use.
- View recipe ingredients, quantities and step-by-step cooking instructions.
- View estimated nutritional information, including calories, protein, carbohydrates and fat.

Recipe generation considers:
- Ingredients already stored in the user's inventory.
- Ingredients approaching their expiry dates.
- The user's saved dietary preferences.
- The selected cooking-time limit.
- Minimising the need for additional ingredients.

### 🥗 Dietary Preferences
Users can save dietary preferences through their profile.

Supported saved preferences include:
- Vegetarian
- Vegan
- Pescatarian
- Dairy-free
- Gluten-free
- Nut-free

Saved preferences are combined with the dietary selection made when generating recipes, allowing the application to consider multiple requirements.

### ❤️ Saved Recipes and Favourites
- Save generated recipes for future reference.
- View favourite recipes separately from newly generated recipes.
- Keep saved recipes stored in Supabase.
- Remove recipes when they are no longer needed.

### 👤 User Profile
- View and update personal profile information.
- Manage saved dietary preferences.
- Change account passwords.
- View account information associated with the signed-in user.

### 📱 Responsive Design
- Responsive layouts for desktop and mobile devices.
- Consistent green-themed interface.
- Navigation designed to make the main application features easy to access.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure and page content |
| CSS3 | Styling, responsive layouts and user interface design |
| JavaScript | Frontend functionality and application logic |
| Node.js | Backend runtime environment |
| Express.js | Backend server and API endpoints |
| Supabase | Authentication, database and user data management |
| Supabase Row Level Security (RLS) | Restricting database access to authorised user records |
| Google Gemini API | AI-powered recipe generation |
| `@google/genai` | Integration with Google's Gemini API |
| Git & GitHub | Version control and source code management |
| Visual Studio Code | Development environment |

---

## 🏗️ Application Architecture

FridgeMate uses a frontend and backend architecture.

**Frontend**

The frontend is built using HTML, CSS and JavaScript. It provides the user interface, handles user interactions and communicates with Supabase and the Express backend.

**Backend**

The backend uses Node.js and Express.js to handle recipe-generation requests. It authenticates users through Supabase, retrieves their inventory and communicates with the Gemini API.

**Database and Authentication**

Supabase provides user authentication and PostgreSQL database storage. Row Level Security (RLS) policies help ensure that users can only access their own records.

**AI Integration**

Google Gemini generates recipes based on the user's inventory and preferences. Generated responses are validated before being saved to the database and returned to the frontend.

### Recipe Generation Workflow

1. The user signs in and adds ingredients to their inventory.
2. The user navigates to the recipe generator.
3. They select their dietary preference and maximum cooking time.
4. The frontend sends a request to the Express backend, including the user's Supabase access token.
5. The backend verifies the user's authentication.
6. The backend retrieves the user's inventory from Supabase.
7. Ingredient information and dietary requirements are sent to Google Gemini.
8. Gemini generates three recipe suggestions in JSON format.
9. The response is checked against a defined schema and additional validation rules.
10. If the response is invalid, the backend retries the generation request once.
11. Valid recipes are saved to Supabase and returned to the frontend.
12. The user can view, favourite and manage their generated recipes.

---

## 📁 Project Structure

```text
FridgeMate/
│
├── client/
│   ├── index.html             # Public landing page
│   ├── login.html             # Login and registration
│   ├── dashboard.html         # User dashboard
│   ├── inventory.html         # Ingredient inventory
│   ├── recipes.html           # AI recipe generator
│   ├── profile.html           # User profile and preferences
│   │
│   ├── style.css              # Application styling
│   ├── supabase-client.js     # Frontend Supabase configuration
│   ├── app.js                 # Authentication functionality
│   ├── dashboard.js           # Dashboard functionality
│   ├── inventory.js           # Inventory management
│   ├── recipes.js             # Recipe generation and favourites
│   ├── profile.js             # Profile and dietary preferences
│   └── navigation.js          # Shared navigation functionality
│
├── server/
│   ├── server.js              # Express server and API routes
│   ├── supabase.js            # Backend Supabase configuration
│   ├── recipeValidation.js    # Gemini response validation
│   ├── package.json           # Backend dependencies and scripts
│   └── package-lock.json      # Locked dependency versions
│
├── supabase/
│   └── migrations/
│       └── 20261109140958_grant_authenticated_access_to_recipes.sql
│
├── .gitignore
├── .env                       # Local environment variables (not committed)
└── README.md
```

---

## 🚀 Getting Started

Follow the instructions below to run FridgeMate locally.

### Prerequisites

Before getting started, make sure you have:

- [Node.js](https://nodejs.org/) installed.
- npm installed (included with Node.js).
- [Visual Studio Code](https://code.visualstudio.com/) or another code editor.
- A [Supabase](https://supabase.com/) account and project.
- A [Google AI Studio](https://aistudio.google.com/) account with a Gemini API key.
- A local development server, such as the VS Code Live Server extension.

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

The database must include the columns expected by the application, including user ownership fields and the relevant ingredient and recipe information.

Enable Row Level Security (RLS) and configure policies to ensure users can only access their own records.

The repository includes a migration at:

```text
supabase/migrations/20261109140958_grant_authenticated_access_to_recipes.sql
```

This migration grants authenticated users permission to read, insert and delete their own recipe and saved-recipe records. Existing RLS policies remain responsible for restricting access to individual users.

Make sure the required database tables and RLS policies are configured before running the application.

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
http://localhost:3000/
```

### 7. Start the Frontend

Open the project in Visual Studio Code.

1. Navigate to the `client` folder.
2. Open `index.html`.
3. Right-click the file.
4. Select **Open with Live Server**.

The frontend should open at an address similar to:

```text
http://127.0.0.1:5500
```

Both the frontend and backend must be running for the full application, including AI recipe generation, to work correctly.

---

## 🔌 Backend API

The Express backend currently provides the following main endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Checks that the backend server is running |
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
    ]
}
```

The actual response contains three generated recipes.

---

## 🧪 Recipe Response Validation

FridgeMate includes a dedicated validation module in `server/recipeValidation.js`.

This module helps ensure that AI-generated recipes follow the expected data structure before they are stored in Supabase.

Validation includes:

- Checking that exactly three recipes are returned.
- Checking that recipe titles and descriptions have valid formats.
- Ensuring cooking times are valid and do not exceed the requested limit.
- Checking that recipes contain ingredients and cooking instructions.
- Validating ingredient quantities.
- Checking nutritional values.
- Ensuring the response follows the expected JSON structure.

If Gemini returns an invalid response, the application retries the request once, providing feedback about the validation errors.

This helps reduce the risk of malformed AI responses causing problems when saving or displaying recipes.

---

## 🔒 Security Considerations

FridgeMate uses several measures to help protect user data:

- Supabase Authentication manages user accounts and sessions.
- Backend API requests require a valid Supabase access token.
- Authenticated Supabase clients ensure database queries run in the context of the signed-in user.
- Row Level Security policies restrict access to users' own database records.
- Gemini API credentials are stored in backend environment variables.
- Environment files are excluded from Git using `.gitignore`.
- Recipe-generation requests are validated before being processed.

Never commit API keys, passwords, Supabase secret keys or other sensitive credentials to the repository.

---

## ⚠️ Notes and Limitations

- Recipes are generated using AI and may occasionally require adjustments.
- Nutritional information is approximate and should not be treated as professionally verified nutritional advice.
- Dietary preferences are provided to Gemini as recipe-generation requirements, but AI-generated recipes cannot guarantee that a meal is free from allergens or unsuitable ingredients. Always check ingredient labels and verify recipes independently.
- Expiry dates and recipe suggestions are intended to help with food management, not to determine whether food is safe to consume.
- Recipe generation requires an active internet connection and a valid Gemini API key.
- Gemini API availability and usage limits may affect recipe generation.

---

## 🔮 Future Improvements

Potential areas for further development include:

- More advanced meal-planning functionality.
- Weekly recipe planning.
- Automatic shopping-list generation based on missing ingredients.
- Improved nutritional information and filtering.
- Additional dietary preferences and recipe customisation.
- Further enhancements to inventory tracking and expiry notifications.
- Additional automated testing and backend security improvements.

---

## 👩‍💻 Development

FridgeMate is developed using a modular frontend and backend structure, with separate JavaScript files responsible for individual application features.

Git and GitHub are used for version control and managing project changes.

Repository: [https://github.com/tb967/FridgeMate](https://github.com/tb967/FridgeMate)
