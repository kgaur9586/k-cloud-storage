# ✅ Authentication Flow - Final Implementation

## Overview
The authentication system has been successfully refactored to a **Frontend-Driven** approach using Logto. This ensures a smooth user experience for both Email and Phone login methods, handling cases where user data (like email) might be missing from the initial token.

## 🔄 The Flow

### 1. Sign In (Frontend)
- User clicks "Sign In" -> Redirects to Logto.
- User authenticates via **Email OTP** or **Phone OTP**.
- Logto redirects back to `/callback`.

### 2. Callback Handling (Frontend)
- `CallbackPage.jsx` handles the OAuth callback.
- Retrieves the **Access Token** from Logto SDK.
- **Sets the Access Token** in the API client (`api.js`) for all future requests.
- Calls `GET /api/auth/user` to check if the user exists in our database.

### 3. User Check (Backend)
- `requireAuth` middleware validates the token via Logto Introspection & UserInfo endpoints.
- **Crucial Fix**: Middleware allows requests even if `email` is missing from the token (common for Phone login).
- If user exists -> Returns 200 OK -> Frontend redirects to `/dashboard`.
- If user does not exist -> Returns 404 Not Found.

### 4. Profile Creation (Frontend)
- If 404 is received, `CallbackPage` shows the **UserProfileModal**.
- **Smart Form**:
  - If email is present in token, it's shown as read-only.
  - If email is missing (Phone login), an **Email Input** is displayed.
- User fills details (Name, Phone, Email, Age, Gender).
- Submits to `POST /api/auth/user`.

### 5. User Creation (Backend)
- `createUser` controller receives the data.
- **Robust Email Handling**: Uses email from the token if available; otherwise, uses the email sent in the request body.
- Creates user in PostgreSQL database.
- Returns 201 Created.

### 6. Completion
- Frontend receives success response.
- Redirects user to `/dashboard`.

## 🛠 Key Components

### Frontend
- **`src/pages/auth/CallbackPage.jsx`**: Orchestrates the entire post-login flow.
- **`src/components/auth/UserProfileModal.jsx`**: Dynamic form that adapts to missing data.
- **`src/services/api.js`**: Centralized token management with `setAccessToken`.

### Backend
- **`src/middleware/logto.ts`**: Validates tokens and fetches user info from Logto.
- **`src/controllers/authController.ts`**: Handles user creation with fallback logic for missing claims.
- **`src/models/User.ts`**: Defines the user schema (Email is required).

## 🚀 Future Improvements
- **Google Sign-In**: Currently disabled. To enable, add the Redirect URI (`https://[your-logto-app].logto.app/callback/google`) to your Google Cloud Console credentials.

---
**Status**: ✅ Complete & Verified
