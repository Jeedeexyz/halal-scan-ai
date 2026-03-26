import "react-native-gesture-handler";
import React from "react";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Dimensions } from "react-native";
import { AppDrawerContent } from "@/components/navigation/app-drawer-content";
import { HeaderMenuButton } from "@/components/navigation/header-menu-button";

const { width } = Dimensions.get("window");

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" translucent={false} />
        <Drawer
          drawerContent={(props) => <AppDrawerContent {...props} />}
          screenOptions={{
            headerShown: true,
            headerLeft: () => <HeaderMenuButton />,
            drawerType: "slide",
            overlayColor: "rgba(0,0,0,0.3)",
            drawerStyle: {
              width: width * 0.8,
              backgroundColor: "#F8FAFC",
              borderRightWidth: 1,
              borderRightColor: "#E5E7EB",
            },
            sceneStyle: { backgroundColor: "#FFFFFF" },
            swipeEdgeWidth: 80,
          }}
        >
          <Drawer.Screen
            name="index"
            options={{ title: "Halal Scan", drawerLabel: "New Scan" }}
          />
        </Drawer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
