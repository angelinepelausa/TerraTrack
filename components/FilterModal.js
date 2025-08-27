import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FilterContext } from "../context/FilterContext";

const FilterModal = ({ visible, onClose }) => {
  const { updateFilter, resetFilter } = useContext(FilterContext);
  const [status, setStatus] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const applyFilter = () => {
    updateFilter({ status, dateRange: { from: fromDate, to: toDate } });
    onClose();
  };

  const clearFilter = () => {
    resetFilter();
    setStatus(null);
    setFromDate(null);
    setToDate(null);
    onClose();
  };

  const formatDate = (date) => {
    if (!date) return "Select Date";
    return date.toLocaleDateString();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Filter Users</Text>

          <Text style={styles.label}>Account Status</Text>
          <View style={styles.statusOptions}>
            {["All", "Active", "Inactive", "Banned", "Suspended"].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s === "All" ? null : s)}
                style={[
                  styles.statusButton,
                  status === (s === "All" ? null : s) && styles.statusButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    status === (s === "All" ? null : s) && styles.statusTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Creation Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 10, fontSize: 16, color: "#fff" }}>–</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(toDate)}</Text>
            </TouchableOpacity>
          </View>

          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              maximumDate={toDate || new Date()}
              onChange={(event, selectedDate) => {
                setShowFromPicker(Platform.OS === "ios");
                if (selectedDate) setFromDate(selectedDate);
              }}
            />
          )}

          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={fromDate || undefined}
              onChange={(event, selectedDate) => {
                setShowToPicker(Platform.OS === "ios");
                if (selectedDate) setToDate(selectedDate);
              }}
            />
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
              <Text style={styles.clearButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  header: { fontSize: 22, fontWeight: "700", color: "#709775", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 10 },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#333",
    borderRadius: 25,
    margin: 4,
  },
  statusButtonSelected: { backgroundColor: "#709775" },
  statusText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  statusTextSelected: { color: "#fff" },
  dateRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dateButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#333",
    borderRadius: 25,
    alignItems: "center",
  },
  dateText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  applyButton: {
    flex: 1,
    backgroundColor: "#709775",
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 8,
    alignItems: "center",
  },
  applyButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FF4D4D",
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 8,
    alignItems: "center",
  },
  clearButtonText: { color: "#FF4D4D", fontWeight: "600", fontSize: 16 },
  closeButton: { alignSelf: "center", marginTop: 10 },
  closeButtonText: { color: "#709775", fontWeight: "600", fontSize: 16 },
});

export default FilterModal;
