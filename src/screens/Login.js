import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import API from "../api/axiosInstance";
import { useAuth } from "../../App";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFonts } from "expo-font";
import {
  Poppins_700Bold,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

const Login = () => {
  const navigation = useNavigation();
  const { setIsAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      if (token) {
        setIsAuthenticated(true);
      }
    };
    checkToken();
  }, [setIsAuthenticated]);

  const validateInputs = () => {
    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Please enter your email address.",
      });
      return false;
    }
    if (!password.trim()) {
      Toast.show({
        type: "error",
        text1: "Password Required",
        text2: "Please enter your password.",
      });
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError("");

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await API.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const token = response.data.token;
      await AsyncStorage.setItem("jwtToken", token);

      Toast.show({
        type: "success",
        text1: "Login successful!",
        text2: "Welcome back!",
      });

      setIsAuthenticated(true);
    } catch (error) {
      console.log(error);
      let errorMessage = "Invalid email or password. Please try again.";

      if (error.response?.status === 401) {
        errorMessage =
          "Invalid credentials. Please check your email and password.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (!error.response) {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>
          Enter your email and password to log in
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="username"
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />
        </View>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.buttonText}>Logging in...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EBC894",
    paddingHorizontal: wp(4),
  },
  card: {
    width: "100%",
    maxWidth: wp(85), // Equivalent to max-w-sm (384px on standard screens)
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: wp(4), // 16px equivalent
    padding: wp(6), // 24px equivalent
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(1) },
    shadowOpacity: 0.1,
    shadowRadius: wp(2.5),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  title: {
    fontSize: wp(6), // 24px equivalent (text-2xl)
    fontWeight: "bold",
    textAlign: "center",
    color: "#000000",
    fontFamily: "Poppins_700Bold",
  },
  subtitle: {
    color: "#374151",
    textAlign: "center",
    marginTop: hp(1),
    fontSize: wp(3.5), // 14px equivalent (text-sm)
    fontFamily: "Poppins_400Regular",
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    marginTop: hp(1),
    fontSize: wp(3.5), // 14px equivalent
    fontFamily: "Poppins_400Regular",
  },
  inputContainer: {
    marginTop: hp(2), // 16px equivalent (mt-4)
  },
  input: {
    width: "100%",
    padding: wp(3), // 12px equivalent (p-3)
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: wp(2), // 8px equivalent (rounded-lg)
    fontSize: wp(3.5), // 14px equivalent (text-sm)
    color: "#000000",
    fontFamily: "Poppins_400Regular",
  },
  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    padding: wp(3), // 12px equivalent (p-3)
    borderRadius: wp(2), // 8px equivalent (rounded-lg)
    marginTop: hp(2), // 16px equivalent (mt-4)
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: wp(3.5), // 14px equivalent (text-sm)
    fontFamily: "Poppins_600SemiBold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2), // Add spacing between spinner and text
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
});

export default Login;
