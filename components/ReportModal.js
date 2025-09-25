import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const ReportModal = ({ visible, onClose, onSelectCategory }) => {
  const categories = [
    {
      label: "Inappropriate Content",
      subOptions: [
        "Sexual content or nudity",
        "Violence or graphic content",
        "Hate speech, harassment, or threats",
        "Offensive language or slurs",
      ],
    },
    {
      label: "Spam / Irrelevant Content",
      subOptions: [
        "Repeated posts or excessive advertising",
        "Fake or misleading links",
        "Off-topic content meant to disrupt",
      ],
    },
    {
      label: "Harassment / Bullying",
      subOptions: [
        "Targeted insults or personal attacks",
        "Doxxing or exposing personal info",
        "Stalking or persistent unwanted messages",
      ],
    },
    {
      label: "Misinformation / Fraud",
      subOptions: [
        "False news or misleading claims",
        "Scams, phishing, or attempts to steal money/data",
      ],
    },
    {
      label: "Illegal Activities",
      subOptions: [
        "Promoting illegal acts (drugs, weapons, theft, etc.)",
        "Child exploitation or abuse material",
      ],
    },
    {
      label: "Plagiarism / Copyright Violations",
      subOptions: [
        "Sharing someone else's content without permission",
        "Claiming others' work as their own",
      ],
    },
    {
      label: "Harmful or Dangerous Behavior",
      subOptions: [
        "Encouraging self-harm or suicide",
        "Encouraging dangerous challenges or stunts",
      ],
    },
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pendingSubOption, setPendingSubOption] = useState(null);

  const handleBack = () => {
    setSelectedCategory(null);
    setPendingSubOption(null);
  };

  const handleSelectSubOption = (subOption) => {
    setPendingSubOption(subOption); // show confirmation inside modal
  };

  const handleConfirm = () => {
    if (selectedCategory && pendingSubOption) {
      onSelectCategory(selectedCategory.label, pendingSubOption);
      setSelectedCategory(null);
      setPendingSubOption(null);
      onClose();
    }
  };

  const handleCancel = () => setPendingSubOption(null);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {selectedCategory ? (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={20} color="#709775" />
                </TouchableOpacity>
              ) : (
                <View style={styles.iconContainer}>
                  <Ionicons name="warning-outline" size={20} color="#FF6B6B" />
                </View>
              )}
              <Text style={styles.title}>
                {selectedCategory
                  ? pendingSubOption
                    ? "Confirm Report"
                    : selectedCategory.label
                  : "Report Content"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory(null);
                setPendingSubOption(null);
                onClose();
              }}
            >
              <Ionicons name="close" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {!selectedCategory && (
              <Text style={styles.subtitle}>
                Please select a category that best describes the issue
              </Text>
            )}

            {/* Pending confirmation */}
            {pendingSubOption && (
              <View style={{ padding: 16 }}>
                <Text style={{ color: "#fff", marginBottom: 12 }}>
                  Report "{pendingSubOption}" under "{selectedCategory.label}"?
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16 }}>
                  <TouchableOpacity onPress={handleCancel}>
                    <Text style={{ color: "#CCCCCC" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConfirm}>
                    <Text style={{ color: "#FF6B6B", fontWeight: "bold" }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Category or sub-options list */}
            {!pendingSubOption && (
              <FlatList
                style={{ maxHeight: 300 }}
                data={selectedCategory ? selectedCategory.subOptions : categories}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  if (selectedCategory) {
                    return (
                      <TouchableOpacity
                        style={styles.subOptionItem}
                        onPress={() => handleSelectSubOption(item)}
                      >
                        <Text style={styles.subOptionText}>{item}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#709775" />
                      </TouchableOpacity>
                    );
                  } else {
                    return (
                      <TouchableOpacity
                        style={styles.categoryItem}
                        onPress={() => setSelectedCategory(item)}
                      >
                        <Text style={styles.categoryLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#709775" />
                      </TouchableOpacity>
                    );
                  }
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#2D2D2D",
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  headerContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { marginRight: 8 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,107,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold", flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 8 },
  subtitle: { color: "#888888", fontSize: 13, marginBottom: 12 },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  categoryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  subOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  subOptionText: { color: "#CCCCCC", fontSize: 14, flex: 1 },
  separator: { height: 1, backgroundColor: "#2D2D2D" },
});

export default ReportModal;
