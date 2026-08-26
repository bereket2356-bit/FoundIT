import { Stack } from "expo-router";
import { ItemProvider } from "../context/Itemscontext";
import { UserProvider } from "../context/Usercontext";
import { AlertProvider } from "../context/AlertContext";

export default function RootLayout() {
  return (
    <ItemProvider>
      <UserProvider>
        <AlertProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
            </AlertProvider>
      </UserProvider>
    </ItemProvider>
  );
}