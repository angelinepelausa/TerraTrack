import React, { useState } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, Modal 
} from "react-native";

const ReportFilterModal = ({ visible, onClose, onApply }) => {
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest");

  const applyFilter = () => {
    onApply({ category, status, sortOrder });
    onClose();
  };

  const clearFilter = () => {
    setCategory(null);
    setStatus(null);
    setSortOrder("latest");
    onApply({ category: null, status: null, sortOrder: "latest" });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Filter Reports</Text>

          {/* Category */}
          <Text style={styles.label}>Report Category</Text>
          <View style={styles.optionsRow}>
            {[
              "All",
              "Inappropriate Content",
              "Spam / Irrelevant Content",
              "Harassment / Bullying",
              "Misinformation / Fraud",
              "Illegal Activities",
              "Plagiarism / Copyright Violations",
              "Harmful or Dangerous Behavior",
            ].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c === "All" ? null : c)}
                style={[
                  styles.optionButton,
                  category === (c === "All" ? null : c) && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    category === (c === "All" ? null : c) && styles.optionTextSelected,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Status */}
          <Text style={styles.label}>Status</Text>
          <View style={styles.optionsRow}>
            {["All", "Pending", "Resolved"].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s === "All" ? null : s)}
                style={[
                  styles.optionButton,
                  status === (s === "All" ? null : s) && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    status === (s === "All" ? null : s) && styles.optionTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort Order */}
          <Text style={styles.label}>Sort By</Text>
          <View style={styles.optionsRow}>
            {["latest", "oldest"].map((o) => (
              <TouchableOpacity
                key={o}
                onPress={() => setSortOrder(o)}
                style={[
                  styles.optionButton,
                  sortOrder === o && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    sortOrder === o && styles.optionTextSelected,
                  ]}
                >
                  {o === "latest" ? "Latest" : "Oldest"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
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
  },
  header: { fontSize: 22, fontWeight: "700", color: "#709775", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 10 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#333",
    borderRadius: 25,
    margin: 4,
  },
  optionButtonSelected: { backgroundColor: "#709775" },
  optionText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  optionTextSelected: { color: "#fff" },
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

export default ReportFilterModal;
