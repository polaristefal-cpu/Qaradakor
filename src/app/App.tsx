import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-context";
import { UserDataProvider } from "./lib/user-data-context";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserDataProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" richColors theme="system" />
        </UserDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}