# Reviews App

A React TypeScript application integrated with Supabase, Material UI, and centralized authentication state management.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env` file is already configured with your Supabase credentials:

```
REACT_APP_SUPABASE_URL=https://mgjdeajsxudrdyrycxlj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Start Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## Material UI Theming

The app uses Material UI with a centralized theme configuration.

### Using the Theme

All Material UI components automatically use the app theme. You can access theme values in your components:

```tsx
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

function MyComponent() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
      }}
    >
      Content
    </Box>
  );
}
```

### Customizing the Theme

Edit `src/theme/theme.ts` to customize colors, typography, spacing, and component styles.

## User Authentication Context

The app provides a `UserContext` that manages authentication state across all components.

### Authentication Flow

- Unauthenticated users are automatically redirected to `/auth/login`
- After signup, users without a profile are redirected to `/auth/complete-signup`
- Authentication pages available:
  - `/auth/login` - Sign in to your account
  - `/auth/signup` - Create a new account
  - `/auth/forgot-password` - Reset your password
  - `/auth/complete-signup` - Complete profile setup (full name, company name)

### Using the UserContext

```tsx
import { useUser } from "./context/UserContext";

function MyComponent() {
  const { user, session, loading, signOut } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protected Routes

The app uses a `ProtectedRoute` component to protect routes that require authentication. Unauthenticated users are automatically redirected to the login page.

## Supabase Integration

### Using the `useSupabase` Hook

The `useSupabase` hook provides easy access to the Supabase client throughout your application.

```tsx
import { useSupabase } from "./hooks/useSupabase";

function MyComponent() {
  const supabase = useSupabase();

  // Fetch data from a table
  const fetchData = async () => {
    const { data, error } = await supabase.from("your_table").select("*");

    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Data:", data);
    }
  };

  return <div>My Component</div>;
}
```

### Example Operations

**Query data:**

```tsx
const { data, error } = await supabase.from("reviews").select("*");
```

**Insert data:**

```tsx
const { data, error } = await supabase
  .from("reviews")
  .insert({ title: "Great product!", rating: 5 });
```

**Update data:**

```tsx
const { data, error } = await supabase
  .from("reviews")
  .update({ rating: 4 })
  .eq("id", 1);
```

**Delete data:**

```tsx
const { data, error } = await supabase.from("reviews").delete().eq("id", 1);
```

**Authentication:**

```tsx
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password123",
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});

// Sign out
const { error } = await supabase.auth.signOut();
```

## Available Scripts

- `npm start` - Starts the development server
- `npm test` - Runs the test suite
- `npm run build` - Creates a production build
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
reviews/
├── src/
│   ├── components/
│   │   ├── Header.tsx         # App header with navigation
│   │   ├── Footer.tsx         # App footer
│   │   ├── Layout.tsx         # Layout wrapper (header + footer)
│   │   └── ProtectedRoute.tsx # Protected route wrapper
│   ├── context/
│   │   └── UserContext.tsx    # User authentication context
│   ├── hooks/
│   │   └── useSupabase.ts     # Custom Supabase hook
│   ├── lib/
│   │   └── supabaseClient.ts  # Supabase client initialization
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx           # Login page
│   │   │   ├── Signup.tsx          # Signup page
│   │   │   ├── ForgotPassword.tsx  # Password reset page
│   │   │   ├── CompleteSignup.tsx  # Complete profile page
│   │   │   └── index.ts            # Auth exports
│   │   ├── Home.tsx           # Home page (protected)
│   │   └── Profile.tsx        # Profile page (protected)
│   ├── theme/
│   │   └── theme.ts           # Material UI theme configuration
│   ├── App.tsx                # Main app with routing
│   └── index.tsx
├── .cursorrules                # Cursor AI rules for this project
├── .env                        # Environment variables (not committed)
└── package.json
```

## Routes

- `/` - Home page (protected, requires authentication and profile)
- `/profile` - User profile page (protected)
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/auth/forgot-password` - Password reset page
- `/auth/complete-signup` - Complete profile setup (redirected after signup)

All routes starting with `/` (except auth routes) are protected and will redirect:

- Unauthenticated users to `/auth/login`
- Authenticated users without a profile to `/auth/complete-signup`

## Key Features

- ✅ **Material UI Integration** - Modern, accessible UI components with theming
- ✅ **Centralized Theme** - Consistent design tokens across the app
- ✅ **Professional Header & Footer** - Branded navigation and footer with Aftermath Technologies link
- ✅ **User Authentication Context** - Global auth state management
- ✅ **Profile Management** - Editable user profile with company information
- ✅ **Protected Routes** - Automatic redirect for unauthenticated users
- ✅ **Supabase Integration** - Backend services for database, auth, and storage
- ✅ **React Router** - Client-side routing
- ✅ **TypeScript** - Full type safety throughout the application
- ✅ **Self-contained Components** - Minimal props, encapsulated logic

## Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/)
- [Material UI Documentation](https://mui.com/material-ui/getting-started/)
- [Supabase JavaScript Documentation](https://supabase.com/docs/reference/javascript/installing)
- [TypeScript Documentation](https://www.typescriptlang.org/)
