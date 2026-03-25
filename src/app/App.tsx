import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-context";
import { UserDataProvider } from "./lib/user-data-context";
import { SidebarProvider } from "./lib/sidebar-context";
import { LangProvider } from "./lib/lang-context";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <UserDataProvider>
            <SidebarProvider>
              <RouterProvider router={router} />
              <Toaster position="bottom-left" richColors theme="system" />
            </SidebarProvider>
          </UserDataProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}