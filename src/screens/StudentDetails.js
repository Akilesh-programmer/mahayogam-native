import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
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

const Logo = require("../assets/images/AdminHomeImage.png");

const padMonth = (m) => m.toString().padStart(2, "0");

const StudentDetails = () => {
  const route = useRoute();
  const studentId = route.params?.studentId;
  const [studentData, setStudentData] = useState({
    attendanceSummary: [],
    feeRecords: [],
    attendanceByMonth: {},
    feeRecordsMap: {},
  });
  const [loading, setLoading] = useState(true);
  const [feeStatusLoading, setFeeStatusLoading] = useState({}); // { 'MM/YYYY': true/false }

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Standalone fetch function
  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/students/${studentId}`);
      const { attendanceSummary = [], feeRecords = [] } = response.data;
      // Process attendance by month and year
      const attendanceByMonth = {};
      attendanceSummary.forEach(({ date, status }) => {
        const [year, month] = date.split("-");
        const key = `${padMonth(month)}/${year}`;
        if (!attendanceByMonth[key]) {
          attendanceByMonth[key] = 0;
        }
        if (status === "Present") {
          attendanceByMonth[key]++;
        }
      });
      // Create a map of fee records for quick lookup
      const feeRecordsMap = {};
      feeRecords.forEach(({ month, year, status }) => {
        const key = `${padMonth(month)}/${year}`;
        feeRecordsMap[key] = status;
      });
      setStudentData({ ...response.data, attendanceByMonth, feeRecordsMap });
    } catch (error) {
      console.error("❌ Error fetching student details:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch student details",
        text2: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const toggleFeeStatus = async (month, year) => {
    const key = `${padMonth(month)}/${year}`;
    setFeeStatusLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const currentStatus = studentData.feeRecordsMap[key] || "Unpaid";
      const newStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
      await API.patch(`/api/students/feeStatus/${studentId}`, {
        month: padMonth(month),
        year,
        status: newStatus,
      });
      setStudentData((prevData) => ({
        ...prevData,
        feeRecordsMap: {
          ...prevData.feeRecordsMap,
          [key]: newStatus,
        },
      }));
      Toast.show({
        type: "success",
        text1: `Fee status updated`,
        text2: `Marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating fee status:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update fee status",
        text2: "Please try again.",
      });
    } finally {
      setFeeStatusLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FFF7E0", "#FDE68A"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={Logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{studentData.name}</Text>
        <View style={styles.card}>
          <View style={[styles.gridRow, styles.gridHeader]}>
            <Text style={styles.gridHeaderText}>Month</Text>
            <Text style={styles.gridHeaderText}>Fee Status</Text>
            <Text style={styles.gridHeaderText}>Attendance</Text>
          </View>
          {Object.keys(studentData.attendanceByMonth).map((key, index) => {
            const attendanceCount = studentData.attendanceByMonth[key] || 0;
            let [month, year] = key.split("/");
            month = padMonth(month);
            year = Number(year);
            const feeStatus = studentData.feeRecordsMap?.[key] || "Unpaid";
            return (
              <View key={index} style={styles.gridRow}>
                <Text style={styles.gridCell}>{key}</Text>
                <View
                  style={[
                    styles.gridCell,
                    {
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.feeStatus,
                      feeStatus === "Paid" ? styles.feePaid : styles.feeUnpaid,
                    ]}
                  >
                    {feeStatus}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleFeeStatus(month, year)}
                    disabled={feeStatusLoading[key]}
                  >
                    {feeStatusLoading[key] ? (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginLeft: wp(2) }}
                      />
                    ) : feeStatus === "Unpaid" ? (
                      <Feather
                        name="check-circle"
                        size={wp(5)}
                        color="#fff"
                        style={{ marginLeft: wp(2) }}
                      />
                    ) : (
                      <Feather
                        name="x-circle"
                        size={wp(5)}
                        color="#fff"
                        style={{ marginLeft: wp(2) }}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    styles.gridCell,
                    { textAlign: "center", fontFamily: "Poppins_600SemiBold" },
                  ]}
                >
                  {attendanceCount}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7E0",
  },
  container: {
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
    fontSize: wp(6),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    color: "#374151",
    marginBottom: hp(4),
  },
  card: {
    width: "100%",
    maxWidth: wp(85),
    backgroundColor: "#b91c1c",
    borderRadius: hp(2),
    overflow: "hidden",
    marginTop: hp(2),
    marginBottom: hp(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: hp(2),
    paddingHorizontal: wp(2),
  },
  gridHeader: {
    backgroundColor: "#111827",
    borderTopLeftRadius: hp(2),
    borderTopRightRadius: hp(2),
  },
  gridHeaderText: {
    flex: 1,
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(4),
    textAlign: "center",
  },
  gridCell: {
    flex: 1,
    color: "#fff",
    fontSize: wp(4),
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  feeStatus: {
    fontSize: wp(3.5),
    fontFamily: "Poppins_600SemiBold",
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: hp(1),
    minWidth: wp(18),
    textAlign: "center",
    color: "#fff",
  },
  feePaid: {
    backgroundColor: "#22c55e",
  },
  feeUnpaid: {
    backgroundColor: "#ef4444",
  },
  loadingText: {
    color: "#dc2626",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(4),
    marginTop: hp(2),
  },
});

export default StudentDetails;
