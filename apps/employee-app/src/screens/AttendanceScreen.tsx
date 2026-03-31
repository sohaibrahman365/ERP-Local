import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function AttendanceScreen() {
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = () => {
    // TODO: Get GPS coordinates and call API
    setCheckedIn(true);
    Alert.alert("Success", "Checked in successfully");
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    Alert.alert("Success", "Checked out successfully");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>

      <TouchableOpacity
        style={[styles.button, checkedIn ? styles.checkOutBtn : styles.checkInBtn]}
        onPress={checkedIn ? handleCheckOut : handleCheckIn}
      >
        <Text style={styles.buttonText}>{checkedIn ? "Check Out" : "Check In"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  date: { fontSize: 16, color: "#666", marginBottom: 40 },
  button: { paddingVertical: 20, paddingHorizontal: 60, borderRadius: 100 },
  checkInBtn: { backgroundColor: "#22c55e" },
  checkOutBtn: { backgroundColor: "#ef4444" },
  buttonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
