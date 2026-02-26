import { Stack } from "expo-router";
import { ItemProvider } from "../context/Itemscontext";
import { UserProvider } from "../context/Usercontext";

export default function RootLayout() {
  return (
    <ItemProvider>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </UserProvider>
    </ItemProvider>
  );
}