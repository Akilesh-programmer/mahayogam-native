import 'react-native-gesture-handler';
import React, { useEffect, useState, createContext, useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import Login from "./src/screens/Login";
import AdminCities from "./src/screens/AdminCities";
import AdminBatches from "./src/screens/AdminBatches";
import AdminAttendance from "./src/screens/AdminAttendance";
import StudentDetails from "./src/screens/StudentDetails";
import BatchAttendanceSummary from "./src/screens/BatchAttendanceSummary";
import { View, Text, ActivityIndicator } from "react-native";
import { authEventEmitter } from "./src/api/axiosInstance";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

// Auth Context
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const Stack = createStackNavigator();

// Custom Toast Configuration
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#22c55e",
        backgroundColor: "#f0fdf4",
        borderLeftWidth: 6,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 40,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      text1Style={{
        fontSize: 18,
        fontWeight: "600",
        color: "#166534",
      }}
      text2Style={{
        fontSize: 16,
        color: "#374151",
        marginTop: 4,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#ef4444",
        backgroundColor: "#fef2f2",
        borderLeftWidth: 6,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 40,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      text1Style={{
        fontSize: 18,
        fontWeight: "600",
        color: "#dc2626",
      }}
      text2Style={{
        fontSize: 16,
        color: "#374151",
        marginTop: 4,
      }}
    />
  ),
};

const logout = async (navigation) => {
  await AsyncStorage.removeItem("jwtToken");
  navigation.reset({
    index: 0,
    routes: [{ name: "Login" }],
  });
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      setIsAuthenticated(!!token);
      setAuthLoading(false);
    };
    checkAuth();
    // Listen for logout event
    const onLogout = () => {
      setIsAuthenticated(false);
    };
    authEventEmitter.on("logout", onLogout);
    return () => {
      authEventEmitter.off("logout", onLogout);
    };
  }, []);

  const authContextValue = {
    isAuthenticated,
    setIsAuthenticated,
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login" component={Login} />
          ) : (
            <>
              <Stack.Screen name="AdminCities" component={AdminCities} />
              <Stack.Screen name="AdminBatches" component={AdminBatches} />
              <Stack.Screen
                name="AdminAttendance"
                component={AdminAttendance}
              />
              <Stack.Screen name="StudentDetails" component={StudentDetails} />
              <Stack.Screen
                name="BatchAttendanceSummary"
                component={BatchAttendanceSummary}
              />
            </>
          )}
        </Stack.Navigator>
        <Toast config={toastConfig} visibilityTime={3000} />
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
