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
import * as DocumentPicker from "expo-document-picker";
import Papa from "papaparse";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const Logo = require("../assets/images/AdminHomeImage.png");

const AdminAttendance = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const batchId = route.params?.batchId || route.params?.batchNumber || "";
  const batchName = route.params?.batchName || "Batch";

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSelectingFile, setIsSelectingFile] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchStudents();
  }, [batchId]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(`/api/students/batch/${batchId}`);
      const today_date = new Date();
      const formattedDate = `${today_date.getFullYear()}-${(
        today_date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${today_date.getDate().toString().padStart(2, "0")}`;
      const today = formattedDate;
      const updatedStudents = response.data.map((student) => {
        const todayAttendance = student.attendanceSummary?.find(
          (att) => att.date === today
        );
        return {
          ...student,
          status: todayAttendance ? todayAttendance.status : null,
        };
      });
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load students",
        text2: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAttendance = async (studentId, status) => {
    try {
      await API.patch(`/api/students/${studentId}`, {
        status,
        batchNumber: batchId,
      });
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student._id === studentId ? { ...student, status } : student
        )
      );
      Toast.show({
        type: "success",
        text1: "Attendance updated",
        text2: `Marked as ${status.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update attendance",
        text2: "Please try again.",
      });
    }
  };

  const validateInput = () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Name required",
        text2: "Please enter the student's name.",
      });
      return false;
    }
    if (!age.trim()) {
      Toast.show({
        type: "error",
        text1: "Age required",
        text2: "Please enter the student's age.",
      });
      return false;
    }
    if (!gender.trim()) {
      Toast.show({
        type: "error",
        text1: "Gender required",
        text2: "Please enter the student's gender.",
      });
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateInput()) {
      return;
    }

    setIsCreatingStudent(true);
    try {
      const response = await API.post(`/api/students/`, {
        batchId,
        name: name.trim(),
        age: age.trim(),
        gender: gender.trim(),
      });
      if (response.status === 201) {
        Toast.show({
          type: "success",
          text1: "Student added successfully!",
          text2: `${name.trim()} has been added to ${batchName}.`,
        });
        setShowForm(false);
        setName("");
        setAge("");
        setGender("");
        fetchStudents();
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to add student",
          text2: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to add student",
        text2: "Please try again later.",
      });
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const handleFileSelection = async () => {
    setIsSelectingFile(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "application/octet-stream",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });

      if (result.type === "cancel") {
        return;
      }

      const fileUri = result.assets ? result.assets[0].uri : result.uri;
      const fileName = result.assets
        ? result.assets[0].name
        : result.name || "Selected File";

      setSelectedFile({
        uri: fileUri,
        name: fileName,
      });

      Toast.show({
        type: "success",
        text1: "File selected successfully!",
        text2: `Selected: ${fileName}`,
      });
    } catch (error) {
      console.error("Error selecting file:", error);
      Toast.show({
        type: "error",
        text1: "Failed to select file",
        text2: "Please try again.",
      });
    } finally {
      setIsSelectingFile(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      Toast.show({
        type: "error",
        text1: "No file selected",
        text2: "Please select a file first.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileString = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Parse the file as base64
      const workbook = XLSX.read(fileString, { type: "base64" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Format and send to backend
      const formattedData = jsonData.map((student) => ({
        name: student.Name || "",
        age: student.Age || 0,
        gender: student.Gender || "",
      }));

      await API.post(`/api/students/bulk-add`, {
        batchId,
        studentsData: formattedData,
      });

      Toast.show({
        type: "success",
        text1: "Students uploaded successfully!",
        text2: `${formattedData.length} students have been added to ${batchName}.`,
      });
      setShowBulkAddForm(false);
      setSelectedFile(null);
      fetchStudents();
    } catch (error) {
      console.error("Error processing file:", error);
      Toast.show({
        type: "error",
        text1: "Failed to upload students",
        text2: "Please check your file format and try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      // Create sample data
      const sampleData = [
        { Name: "John Doe", Age: 20, Gender: "Male" },
        { Name: "Jane Smith", Age: 19, Gender: "Female" },
        { Name: "Mike Johnson", Age: 21, Gender: "Male" },
        { Name: "Sarah Wilson", Age: 20, Gender: "Female" },
        { Name: "David Brown", Age: 22, Gender: "Male" },
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      // Generate Excel file as base64
      const excelBuffer = XLSX.write(workbook, {
        type: "base64",
        bookType: "xlsx",
      });

      // Save to temporary file
      const fileUri = FileSystem.documentDirectory + "student_sample.xlsx";
      await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Download Sample File",
          UTI: "org.openxmlformats.spreadsheetml.sheet",
        });

        Toast.show({
          type: "success",
          text1: "Sample file ready",
          text2: "The sample file is ready for download.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Sharing not available",
          text2: "Sharing is not available on this device.",
        });
      }
    } catch (error) {
      console.error("Error downloading sample file:", error);
      Toast.show({
        type: "error",
        text1: "Failed to download sample file",
        text2: "Please try again later.",
      });
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!fontsLoaded) {
    return null;
  }

  // Header for FlatList
  const ListHeader = (
    <View style={styles.headerContainer}>
      <Image source={Logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>ATTENDANCE - {batchName}</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search student..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setName("");
            setAge("");
            setGender("");
            setShowForm(!showForm);
          }}
        >
          <Feather
            name="plus-circle"
            size={wp(5)}
            color="#fff"
            style={{ marginRight: wp(2) }}
          />
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowBulkAddForm(!showBulkAddForm)}
        >
          <Feather
            name="plus-circle"
            size={wp(5)}
            color="#fff"
            style={{ marginRight: wp(2) }}
          />
          <Text style={styles.addButtonText}>Bulk Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#FFF7E0", "#FDE68A"]} style={styles.gradient}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          style={styles.studentList}
          contentContainerStyle={styles.studentListContent}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <View style={styles.studentRow}>
              <Text style={styles.studentName}>{item.name}</Text>
              <View style={styles.studentActions}>
                <TouchableOpacity
                  onPress={() => toggleAttendance(item._id, "Present")}
                >
                  <Feather
                    name="check-circle"
                    size={wp(6.5)}
                    color={item.status === "Present" ? "#22c55e" : "#fff"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleAttendance(item._id, "Absent")}
                >
                  <Feather
                    name="x-circle"
                    size={wp(6.5)}
                    color={item.status === "Absent" ? "#ef4444" : "#fff"}
                  />
                </TouchableOpacity>
                {item.status && (
                  <TouchableOpacity
                    onPress={() => toggleAttendance(item._id, item.status)}
                    style={[
                      styles.statusBadge,
                      item.status === "Present"
                        ? { backgroundColor: "#22c55e" }
                        : { backgroundColor: "#ef4444" },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("StudentDetails", {
                      studentId: item._id,
                      studentName: item.name,
                    })
                  }
                >
                  <Feather name="eye" size={wp(6.5)} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {search
                  ? "No students found matching your search."
                  : "No students available in this batch."}
              </Text>
            </View>
          }
        />
      )}

      {/* Bulk Add Modal */}
      <Modal
        visible={showBulkAddForm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowBulkAddForm(false);
          setSelectedFile(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Details</Text>
            <Text style={styles.modalSubtitle}>
              Upload Excel files (.xlsx or .xls)
            </Text>

            {/* File Selection Section */}
            <TouchableOpacity
              style={[styles.modalButton, styles.uploadButton]}
              onPress={handleFileSelection}
              disabled={isSelectingFile || isUploading}
            >
              {isSelectingFile ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>Selecting...</Text>
                </View>
              ) : (
                <Text style={styles.modalButtonText}>
                  {selectedFile ? "Change File" : "Choose File"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Selected File Display */}
            {selectedFile && (
              <View style={styles.selectedFileContainer}>
                <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
              </View>
            )}

            {/* Upload Button - Only enabled when file is selected */}
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.uploadButton,
                !selectedFile && styles.buttonDisabled,
              ]}
              onPress={handleBulkUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>Uploading...</Text>
                </View>
              ) : (
                <Text style={styles.modalButtonText}>Upload</Text>
              )}
            </TouchableOpacity>

            {/* Download Sample Button */}
            <TouchableOpacity
              style={[styles.modalButton, styles.downloadButton]}
              onPress={handleDownloadSample}
              disabled={isUploading || isSelectingFile}
            >
              <Text style={styles.modalButtonText}>Download Sample File</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowBulkAddForm(false);
                  setSelectedFile(null);
                }}
                disabled={isUploading || isSelectingFile}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        visible={showForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Details</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter name"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Enter age"
              placeholderTextColor="#6B7280"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Enter gender"
              placeholderTextColor="#6B7280"
              value={gender}
              onChangeText={setGender}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowForm(false)}
                disabled={isCreatingStudent}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  isCreatingStudent && styles.buttonDisabled,
                ]}
                onPress={handleCreate}
                disabled={isCreatingStudent}
              >
                {isCreatingStudent ? (
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    paddingBottom: hp(2),
  },
  logo: {
    width: wp(70),
    height: hp(15),
    marginBottom: hp(4),
  },
  title: {
    fontSize: wp(6),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    color: "#374151",
    marginBottom: hp(4),
  },
  searchContainer: {
    width: "100%",
    maxWidth: wp(85),
    marginBottom: hp(3),
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
  buttonRow: {
    flexDirection: "row",
    gap: wp(2),
    marginBottom: hp(2),
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: 999,
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
    fontFamily: "Poppins_600SemiBold",
    color: "#374151",
    marginBottom: hp(1),
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: wp(3.5),
    color: "#6B7280",
    textAlign: "center",
    marginBottom: hp(4),
    fontFamily: "Poppins_400Regular",
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
  modalButton: {
    paddingVertical: hp(1.5),
    borderRadius: hp(1),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: hp(1),
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: hp(3),
    gap: wp(3),
  },
  uploadButton: {
    backgroundColor: "#22c55e",
  },
  downloadButton: {
    backgroundColor: "#22c55e",
  },
  cancelButton: {
    backgroundColor: "#9CA3AF",
    flex: 1,
  },
  createButton: {
    backgroundColor: "#2563EB",
    flex: 1,
  },
  okButton: {
    backgroundColor: "#2563EB",
    flex: 1,
  },
  modalButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(3.5),
    textAlign: "center",
  },
  cancelButtonText: {
    color: "#fff",
  },
  studentList: {
    flex: 1,
    width: "100%",
  },
  studentListContent: {
    gap: hp(1),
    paddingBottom: hp(6),
    alignItems: "center",
    paddingHorizontal: wp(4),
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: hp(1.5),
    paddingVertical: hp(2),
    paddingHorizontal: wp(6),
    marginVertical: hp(0.2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
    justifyContent: "space-between",
    gap: wp(2),
    width: "100%",
    maxWidth: wp(85),
  },
  studentName: {
    color: "#fff",
    fontSize: wp(4),
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
    textAlign: "left",
  },
  studentActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: wp(2),
  },
  statusBadge: {
    borderRadius: hp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    marginHorizontal: wp(1),
  },
  statusBadgeText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(3),
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
    color: "#dc2626",
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
    color: "#fff",
    textAlign: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  selectedFileContainer: {
    backgroundColor: "#F3F4F6",
    padding: wp(3),
    borderRadius: hp(1),
    marginVertical: hp(2),
    borderWidth: 1,
    borderColor: "#D1D5DB",
    width: "100%",
  },
  selectedFileName: {
    fontSize: wp(3.5),
    color: "#374151",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
  },
});

export default AdminAttendance;
