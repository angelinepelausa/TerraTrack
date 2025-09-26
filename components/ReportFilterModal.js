import React, { useState } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, LayoutAnimation, Platform, UIManager 
} from "react-native";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ReportFilterModal = ({ visible, onClose, onApply }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [status, setStatus] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [sortExpanded, setSortExpanded] = useState(false);

  const categories = [
    "Inappropriate Content",
    "Spam / Irrelevant Content",
    "Harassment / Bullying",
    "Misinformation / Fraud",
    "Illegal Activities",
    "Plagiarism / Copyright Violations",
    "Harmful or Dangerous Behavior",
  ];

  const statuses = ["pending", "reviewed"];
  const sortOptions = ["latest", "oldest"];

  const toggleCategory = (category) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleStatus = (s) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStatus(prev => prev === s ? null : s);
    setStatusExpanded(false);
  };

  const toggleSort = (s) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSortOrder(s);
    setSortExpanded(false);
  };

  const applyFilter = () => {
    onApply({ 
      category: selectedCategories.length ? selectedCategories : null, 
      status, 
      sortOrder 
    });
    onClose();
  };

  const clearFilter = () => {
    setSelectedCategories([]);
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
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Categories */}
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setCategoriesExpanded(prev => !prev);
              }}
              style={styles.collapsibleHeader}
            >
              <Text style={styles.label}>Categories ({selectedCategories.length} selected)</Text>
              <Text style={styles.expandIcon}>{categoriesExpanded ? "-" : "+"}</Text>
            </TouchableOpacity>
            {categoriesExpanded && (
              <View style={styles.optionsColumn}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => toggleCategory(c)}
                    style={[styles.checkboxContainer, selectedCategories.includes(c) && styles.checkboxSelected]}
                  >
                    <Text style={[styles.checkboxText, selectedCategories.includes(c) && styles.checkboxTextSelected]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Status */}
            <TouchableOpacity
              onPress={() => setStatusExpanded(prev => !prev)}
              style={styles.collapsibleHeader}
            >
              <Text style={styles.label}>Status ({status ? status.charAt(0).toUpperCase() + status.slice(1) : "All"})</Text>
              <Text style={styles.expandIcon}>{statusExpanded ? "-" : "+"}</Text>
            </TouchableOpacity>
            {statusExpanded && (
              <View style={styles.optionsColumn}>
                {statuses.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => toggleStatus(s)}
                    style={[styles.checkboxContainer, status === s && styles.checkboxSelected]}
                  >
                    <Text style={[styles.checkboxText, status === s && styles.checkboxTextSelected]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sort Order */}
            <TouchableOpacity
              onPress={() => setSortExpanded(prev => !prev)}
              style={styles.collapsibleHeader}
            >
              <Text style={styles.label}>Sort By ({sortOrder === "latest" ? "Latest First" : "Oldest First"})</Text>
              <Text style={styles.expandIcon}>{sortExpanded ? "-" : "+"}</Text>
            </TouchableOpacity>
            {sortExpanded && (
              <View style={styles.optionsColumn}>
                {sortOptions.map(o => (
                  <TouchableOpacity
                    key={o}
                    onPress={() => toggleSort(o)}
                    style={[styles.checkboxContainer, sortOrder === o && styles.checkboxSelected]}
                  >
                    <Text style={[styles.checkboxText, sortOrder === o && styles.checkboxTextSelected]}>
                      {o === "latest" ? "Latest First" : "Oldest First"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
                <Text style={styles.clearButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

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
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#709775",
    marginBottom: 15,
    textAlign: "center"
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5
  },
  expandIcon: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600"
  },
  optionsColumn: {
    flexDirection: "column",
    marginBottom: 10
  },
  checkboxContainer: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 3
  },
  checkboxSelected: {
    backgroundColor: "#709775"
  },
  checkboxText: {
    color: "#fff",
    fontSize: 13
  },
  checkboxTextSelected: {
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 10
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#709775",
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FF4D4D",
    paddingVertical: 10,
    borderRadius: 25,
    marginLeft: 8,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#FF4D4D",
    fontWeight: "600",
    fontSize: 14
  },
  closeButton: {
    alignSelf: "center",
    marginTop: 8,
    padding: 10
  },
  closeButtonText: {
    color: "#709775",
    fontWeight: "600",
    fontSize: 14
  },
});

export default ReportFilterModal;
