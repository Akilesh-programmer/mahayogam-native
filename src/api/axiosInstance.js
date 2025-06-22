import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import EventEmitter from 'eventemitter3';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;

export const authEventEmitter = new EventEmitter();

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token automatically for all requests
API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Optionally handle error
  }
  return config;
});

// Handle 401 Unauthorized errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token might be expired. Logging out...");
      // Clear token
      await AsyncStorage.removeItem("jwtToken");
      authEventEmitter.emit("logout");
    }
    return Promise.reject(error);
  }
);

export default API;
