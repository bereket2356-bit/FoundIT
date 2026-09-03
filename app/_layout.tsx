import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider } from "../context/AlertContext";
import { ItemProvider } from "../context/Itemscontext";
import { ThemeProvider } from "../context/ThemeContext";
import { UserProvider } from "../context/Usercontext";

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ThemeProvider>
        <ItemProvider>
          <UserProvider>
            <AlertProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </AlertProvider>
          </UserProvider>
        </ItemProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
