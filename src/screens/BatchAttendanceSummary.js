import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
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

const BatchAttendanceSummary = () => {
  const route = useRoute();
  const batchId = route.params?.batchId;
  const batchName = route.params?.batchName;
  const [latestDates, setLatestDates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);
  const dateColumnWidth = wp(22);
  const stickyColWidth = wp(36);
  const screenWidth = wp(100);
  const [rowHeights, setRowHeights] = useState([]);
  const [headerHeight, setHeaderHeight] = useState();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const datesRes = await API.get(`/api/dates/${batchId}`);
        // First format all dates to YYYY-MM-DD, then remove duplicates
        const formattedDates = datesRes.data.latestDates.map(
          (date) => new Date(date).toISOString().split("T")[0]
        );
        // Remove duplicates from formatted dates
        const uniqueFormattedDates = [...new Set(formattedDates)];
        setLatestDates(uniqueFormattedDates);
        const studentsRes = await API.get(`/api/batches/students/${batchId}`);
        setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        Toast.show({
          type: "error",
          text1: "Failed to load attendance summary",
          text2: "Please check your connection and try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId]);

  useEffect(() => {
    // Calculate total table width (sticky + all date columns)
    const totalTableWidth =
      stickyColWidth + latestDates.length * dateColumnWidth;
    setShowScrollHint(totalTableWidth > screenWidth);
  }, [latestDates]);

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading attendance summary...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#EBC894", "#fff"]} style={styles.gradientBg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Attendance Summary of</Text>
        <View style={{ alignItems: "center", width: "100%" }}>
          <LinearGradient
            colors={["#2563eb", "#7c3aed"]}
            style={styles.batchNameGradient}
          >
            <Text style={styles.batchName}>{batchName}</Text>
          </LinearGradient>
        </View>
        {showScrollHint && (
          <View style={styles.swipeHintContainer}>
            <Text style={styles.swipeHintText}>Swipe to scroll →</Text>
          </View>
        )}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>
              Loading attendance summary...
            </Text>
          </View>
        ) : students.length === 0 ? (
          <Text style={styles.noStudents}>
            No students found in this batch or no Attendance Record found in
            this batch.
          </Text>
        ) : (
          <View style={{ flexDirection: "row", width: "100%" }}>
            {/* Sticky column */}
            <View>
              {/* Header for sticky column */}
              <View
                style={[
                  styles.tableRow,
                  styles.tableHeaderRow,
                  {
                    minWidth: wp(36),
                    position: "relative",
                    zIndex: 3,
                    height: headerHeight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tableHeaderCell,
                    styles.firstColHeader,
                    styles.stickyHeaderCell,
                  ]}
                  onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setHeaderHeight(height);
                  }}
                >
                  Student Name
                </Text>
              </View>
              {/* Student names */}
              {students.map((student, index) => (
                <View
                  key={student._id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    { minWidth: wp(36), height: rowHeights[index] },
                  ]}
                >
                  <Text
                    style={[
                      styles.tableCell,
                      styles.studentNameCell,
                      styles.stickyBodyCell,
                    ]}
                    numberOfLines={2}
                    onLayout={(event) => {
                      const { height } = event.nativeEvent.layout;
                      setRowHeights((prev) => {
                        const newHeights = [...prev];
                        newHeights[index] = height;
                        return newHeights;
                      });
                    }}
                  >
                    {student.name}
                  </Text>
                </View>
              ))}
            </View>
            {/* Scrollable columns */}
            <ScrollView
              horizontal
              style={{ flex: 1 }}
              showsHorizontalScrollIndicator={true}
              onContentSizeChange={(contentWidth) => {
                setScrollContentWidth(contentWidth);
                setShowScrollHint(contentWidth > screenWidth);
              }}
            >
              <View>
                {/* Header row for dates, NO placeholder cell */}
                <View
                  style={[
                    styles.tableRow,
                    styles.tableHeaderRow,
                    { height: headerHeight },
                  ]}
                >
                  {latestDates.map((date, i) => (
                    <Text key={date + "-" + i} style={styles.tableHeaderCell}>
                      {new Date(date).toLocaleDateString()}
                    </Text>
                  ))}
                </View>
                {/* Attendance rows, NO placeholder cell */}
                {students.map((student, index) => (
                  <View
                    key={student._id}
                    style={[
                      styles.tableRow,
                      index % 2 === 0
                        ? styles.tableRowEven
                        : styles.tableRowOdd,
                      { height: rowHeights[index] },
                    ]}
                  >
                    {latestDates.map((date, i) => {
                      const dateString = new Date(date)
                        .toISOString()
                        .split("T")[0];
                      const attendance = student.attendanceSummary?.find(
                        (att) =>
                          new Date(att.date).toISOString().split("T")[0] ===
                          dateString
                      );
                      return (
                        <View
                          key={student._id + "-" + date + "-" + i}
                          style={styles.tableCell}
                        >
                          {attendance ? (
                            attendance.status.toLowerCase() === "present" ? (
                              <Icon
                                name="check-circle"
                                size={wp(5.5)}
                                color="#22c55e"
                                style={{ alignSelf: "center" }}
                              />
                            ) : (
                              <Icon
                                name="times-circle"
                                size={wp(5.5)}
                                color="#ef4444"
                                style={{ alignSelf: "center" }}
                              />
                            )
                          ) : (
                            <Text style={styles.naText}>N/A</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    paddingBottom: hp(6),
  },
  heading: {
    fontSize: wp(5.5),
    fontFamily: "Poppins_700Bold",
    color: "#374151",
    textAlign: "center",
    marginBottom: hp(0.5),
  },
  batchNameGradient: {
    borderRadius: hp(1.5),
    marginBottom: hp(2),
    paddingHorizontal: wp(6),
    paddingVertical: hp(1),
    alignSelf: "center",
    maxWidth: "80%",
  },
  batchName: {
    fontSize: wp(4),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    color: "white",
    letterSpacing: 1,
  },
  noStudents: {
    color: "#ef4444",
    textAlign: "center",
    fontSize: wp(4),
    marginTop: hp(6),
    fontFamily: "Poppins_600SemiBold",
  },
  scrollHint: {
    color: "#6B7280",
    fontSize: wp(3.5),
    marginBottom: hp(1),
    alignSelf: "flex-end",
    marginRight: wp(2),
    fontFamily: "Poppins_400Regular",
  },
  tableScroll: {
    width: "100%",
    marginTop: hp(2),
    paddingHorizontal: wp(1),
  },
  tableWrapper: {
    paddingHorizontal: wp(2),
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: hp(4),
  },
  tableHeaderRow: {
    backgroundColor: "#2563eb",
    borderTopLeftRadius: hp(2),
    borderTopRightRadius: hp(2),
  },
  tableHeaderCell: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(3.5),
    paddingVertical: hp(2),
    paddingHorizontal: wp(3),
    textAlign: "center",
    minWidth: wp(22),
  },
  firstColHeader: {
    backgroundColor: "#1e293b",
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    minWidth: wp(30),
    textAlign: "left",
  },
  tableRowEven: {
    backgroundColor: "#fff",
  },
  tableRowOdd: {
    backgroundColor: "#f3f4f6",
  },
  tableCell: {
    fontSize: wp(3.5),
    color: "#374151",
    paddingVertical: hp(2),
    paddingHorizontal: wp(3),
    textAlign: "center",
    minWidth: wp(22),
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Poppins_400Regular",
  },
  stickyCol: {
    backgroundColor: "#fff",
    fontFamily: "Poppins_600SemiBold",
    zIndex: 2,
    elevation: 2,
    minWidth: wp(36),
    textAlign: "left",
    position: "absolute",
    left: 0,
  },
  studentNameCell: {
    color: "#374151",
  },
  naText: {
    color: "#9ca3af",
    fontSize: wp(3.5),
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EBC894",
  },
  loadingText: {
    color: "#2563eb",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(4),
    marginTop: hp(2),
  },
  stickyHeaderCell: {
    width: wp(36),
    minWidth: wp(36),
    maxWidth: wp(36),
    textAlign: "left",
    backgroundColor: "#111827",
    color: "#fff",
    zIndex: 3,
    elevation: 3,
  },
  stickyBodyCell: {
    width: wp(36),
    minWidth: wp(36),
    maxWidth: wp(36),
    textAlign: "left",
    backgroundColor: "#fff",
    zIndex: 2,
    elevation: 2,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  swipeHintContainer: {
    alignSelf: "flex-end",
    marginTop: 0,
    marginBottom: hp(1),
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
    elevation: 2,
  },
  swipeHintText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: wp(3.5),
  },
});

export default BatchAttendanceSummary;
