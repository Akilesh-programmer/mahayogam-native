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
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import Feather from "react-native-vector-icons/Feather";
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

const AdminBatches = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const cityId = route.params?.id || route.params?.city || "";
  const cityName = route.params?.place || "Unknown City";

  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(`/api/batches/${cityId}`);
      setBatches(response.data);
    } catch (error) {
      console.error(error.message);
      Toast.show({
        type: "error",
        text1: "Failed to load batches",
        text2: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [cityId]);

  const validateInput = () => {
    if (!batchName.trim()) {
      Toast.show({
        type: "error",
        text1: "Batch name required",
        text2: "Please enter a batch name.",
      });
      return false;
    }
    return true;
  };

  const handleCreateBatch = async () => {
    if (!validateInput()) {
      return;
    }

    setIsCreatingBatch(true);
    try {
      await API.post("/api/batches", {
        placeId: cityId,
        name: batchName.trim(),
      });

      Toast.show({
        type: "success",
        text1: "Batch created successfully!",
        text2: `${batchName.trim()} has been added to ${cityName}.`,
      });

      setBatchName("");
      setShowModal(false);
      fetchBatches();
    } catch (error) {
      if (error.response && error.response.status === 500) {
        Toast.show({
          type: "error",
          text1: "Duplicate batch",
          text2: "This batch already exists in this city.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to create batch",
          text2: "Please try again later.",
        });
      }
      console.error(error.message);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(search.toLowerCase())
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
        <Text style={styles.title}>Batches in {cityName}</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search batch..."
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3d2c13" />
            <Text style={styles.loadingText}>Loading batches...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBatches}
            keyExtractor={(item) => item._id}
            style={styles.batchList}
            contentContainerStyle={styles.batchListContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.batchButton}
                onPress={() =>
                  navigation.navigate("AdminAttendance", {
                    batchId: item._id,
                    batchName: item.name,
                  })
                }
              >
                <Text style={styles.batchButtonText}>{item.name}</Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation && e.stopPropagation();
                    navigation.navigate("BatchAttendanceSummary", {
                      batchId: item._id,
                      batchName: item.name,
                    });
                  }}
                  style={styles.eyeIcon}
                >
                  <Feather name="eye" size={wp(5)} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {search
                    ? "No batches found matching your search."
                    : "No batches available in this city."}
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setBatchName("");
            setShowModal(true);
          }}
        >
          <Icon
            name="plus"
            size={wp(5)}
            color="#fff"
            style={{ marginRight: wp(2) }}
          />
          <Text style={styles.addButtonText}>Add New Batch</Text>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Batch</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    setBatchName("");
                  }}
                  disabled={isCreatingBatch}
                >
                  <Icon name="times" size={wp(5)} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter batch name"
                placeholderTextColor="#6B7280"
                value={batchName}
                onChangeText={setBatchName}
                autoFocus
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowModal(false);
                    setBatchName("");
                  }}
                  disabled={isCreatingBatch}
                >
                  <Text
                    style={[styles.modalButtonText, styles.cancelButtonText]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.createButton,
                    isCreatingBatch && styles.buttonDisabled,
                  ]}
                  onPress={handleCreateBatch}
                  disabled={isCreatingBatch}
                >
                  {isCreatingBatch ? (
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
  title: {
    fontSize: wp(7.5),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    color: "#374151",
    marginBottom: hp(6),
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
  batchList: {
    width: "100%",
    maxWidth: wp(85),
    flexGrow: 0,
    marginBottom: hp(2),
  },
  batchListContent: {
    gap: hp(2),
  },
  batchButton: {
    width: "100%",
    paddingVertical: hp(2),
    paddingHorizontal: wp(6),
    backgroundColor: "#3d2c13",
    borderRadius: hp(1.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  batchButtonText: {
    color: "#fff",
    fontSize: wp(4),
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  eyeIcon: {
    marginLeft: wp(4),
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: wp(5),
    fontFamily: "Poppins_600SemiBold",
    color: "#374151",
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
    backgroundColor: "#E5E7EB",
  },
  createButton: {
    backgroundColor: "#2563EB",
  },
  modalButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(3.5),
  },
  cancelButtonText: {
    color: "#374151",
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
    fontFamily: "Poppins_400Regular",
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

export default AdminBatches;
