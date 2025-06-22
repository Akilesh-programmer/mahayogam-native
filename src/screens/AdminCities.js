import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import API from "../api/axiosInstance";
import Toast from "react-native-toast-message";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const AdminHomeImage = require("../assets/images/AdminHomeImage.png");

const AdminCities = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [cities, setCities] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newPlace, setNewPlace] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const response = await API.get("/api/places/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load cities",
        text2: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCityClick = (id, place) => {
    navigation.navigate("AdminBatches", { id, place });
  };

  const validateInput = () => {
    if (!newPlace.trim()) {
      Toast.show({
        type: "error",
        text1: "Place name required",
        text2: "Please enter a place name.",
      });
      return false;
    }
    return true;
  };

  const handleAddPlace = async () => {
    if (!validateInput()) {
      return;
    }

    setIsAddingPlace(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      await API.post(
        "/api/places/",
        { place: newPlace.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: "success",
        text1: "Place added successfully!",
        text2: `${newPlace.trim()} has been added to the list.`,
      });

      setNewPlace("");
      setShowPopup(false);
      fetchCities();
    } catch (error) {
      if (error.response && error.response.status === 500) {
        Toast.show({
          type: "error",
          text1: "Duplicate place",
          text2: "This place already exists in the list.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to add place",
          text2: "Please try again later.",
        });
      }
      console.error("Error adding place:", error);
    } finally {
      setIsAddingPlace(false);
    }
  };

  const filteredCities = cities.filter((city) =>
    city.place.toLowerCase().includes(search.toLowerCase())
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient colors={["#EBC894", "#fff"]} style={styles.gradient}>
      <View style={styles.container}>
        <Image
          source={AdminHomeImage}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city..."
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3d2c13" />
            <Text style={styles.loadingText}>Loading cities...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item._id}
            style={styles.cityList}
            contentContainerStyle={styles.cityListContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityButton}
                onPress={() => handleCityClick(item._id, item.place)}
              >
                <Text style={styles.cityButtonText}>{item.place}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {search
                    ? "No cities found matching your search."
                    : "No cities available."}
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setNewPlace("");
            setShowPopup(true);
          }}
        >
          <Icon
            name="plus"
            size={wp(5)}
            color="#fff"
            style={{ marginRight: wp(2) }}
          />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>

        <Modal
          visible={showPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPopup(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Place</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter place name"
                placeholderTextColor="#6B7280"
                value={newPlace}
                onChangeText={setNewPlace}
                autoFocus
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setNewPlace("");
                    setShowPopup(false);
                  }}
                  disabled={isAddingPlace}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.createButton,
                    isAddingPlace && styles.buttonDisabled,
                  ]}
                  onPress={handleAddPlace}
                  disabled={isAddingPlace}
                >
                  {isAddingPlace ? (
                    <View style={styles.buttonLoadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.modalButtonText}>Creating...</Text>
                    </View>
                  ) : (
                    <Text style={styles.modalButtonText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    paddingBottom: hp(6),
  },
  logo: {
    width: wp(70),
    height: hp(15),
    marginBottom: hp(4),
  },
  searchContainer: {
    width: "100%",
    maxWidth: wp(85),
    marginBottom: hp(4),
    position: "relative",
  },
  searchInput: {
    width: "100%",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(12),
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    borderRadius: 999,
    fontSize: wp(4),
    color: "#000000",
    fontFamily: "Poppins_400Regular",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
  },
  searchIcon: {
    position: "absolute",
    left: wp(4),
    top: "50%",
    transform: [{ translateY: -hp(2) }],
    fontSize: wp(4.5),
    color: "#6B7280",
  },
  cityList: {
    width: "100%",
    maxWidth: wp(85),
    flexGrow: 0,
    marginBottom: hp(2),
  },
  cityListContent: {
    gap: hp(2),
  },
  cityButton: {
    width: "100%",
    paddingVertical: hp(2),
    backgroundColor: "#3d2c13",
    borderRadius: hp(1.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
    alignItems: "center",
  },
  cityButtonText: {
    color: "#fff",
    fontSize: wp(4),
    fontFamily: "Poppins_600SemiBold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderRadius: hp(1.5),
    marginTop: hp(6),
    marginBottom: hp(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
  },
  addButtonText: {
    color: "#fff",
    fontSize: wp(4),
    fontFamily: "Poppins_600SemiBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: wp(6),
    borderRadius: hp(2),
    width: wp(85),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(2) },
    shadowOpacity: 0.25,
    shadowRadius: wp(6),
    elevation: 10,
  },
  modalTitle: {
    fontSize: wp(5),
    fontFamily: "Poppins_700Bold",
    color: "#374151",
    marginBottom: hp(2),
  },
  modalInput: {
    width: "100%",
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: hp(1),
    fontSize: wp(3.5),
    color: "#000000",
    marginTop: hp(2),
    backgroundColor: "transparent",
    fontFamily: "Poppins_400Regular",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: hp(3),
    gap: wp(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: hp(1),
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6B7280",
  },
  createButton: {
    backgroundColor: "#2563EB",
  },
  modalButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(3.5),
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(4),
    gap: wp(2),
  },
  loadingText: {
    fontSize: wp(4),
    fontFamily: "Poppins_600SemiBold",
    color: "#3d2c13",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(8),
  },
  emptyText: {
    fontSize: wp(4),
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    textAlign: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
  },
});

export default AdminCities;
