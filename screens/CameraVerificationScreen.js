import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CLOUD_NAME = "dgdzmrhc4";
const UPLOAD_PRESET = "terratrack";

const CameraVerificationScreen = ({ route, navigation }) => {
  const { task } = route.params; // task includes { id, difficulty }
  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back;

  const [uploading, setUploading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [todaysCount, setTodaysCount] = useState(0);

  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'authorized');
    })();

    const fetchTodaysCount = async () => {
      const user = auth().currentUser;
      const today = new Date().toISOString().split("T")[0];

      const snapshot = await firestore()
        .collection("users")
        .doc(user.uid)
        .collection("verifications")
        .where("date", "==", today)
        .get();

      setTodaysCount(snapshot.size);
    };

    fetchTodaysCount();
  }, []);

  const handleVerification = async () => {
    try {
      const user = auth().currentUser;
      const today = new Date().toISOString().split("T")[0];

      await firestore()
        .collection("users")
        .doc(user.uid)
        .collection("verifications")
        .add({
          taskid: task.id,
          date: today,
          imageurl: null,
          submittedat: firestore.FieldValue.serverTimestamp(),
          skippedphoto: true,
        });

      Alert.alert("Verified", "Task verified without photo (limit reached).");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save verification.");
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current && device) {
      try {
        setUploading(true);

        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'quality',
          flash: 'off',
        });

        const file = {
          uri: `file://${photo.path}`,
          type: "image/jpeg",
          name: "verification.jpg",
        };

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });

        const uploadRes = await res.json();
        if (!uploadRes.secure_url) throw new Error("Upload failed");

        const user = auth().currentUser;
        const today = new Date().toISOString().split("T")[0];

        await firestore()
          .collection("users")
          .doc(user.uid)
          .collection("verifications")
          .add({
            taskid: task.id,
            date: today,
            imageurl: uploadRes.secure_url,
            submittedat: firestore.FieldValue.serverTimestamp(),
            skippedphoto: false,
          });

        Alert.alert("Success", "Verification uploaded!");
        navigation.goBack();
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to upload verification");
      } finally {
        setUploading(false);
      }
    }
  };

  const needsPhoto = !(todaysCount >= 3 && task.difficulty !== "hard");

  if (needsPhoto && (!device || !hasPermission)) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff" }}>
          {hasPermission ? "Loading camera..." : "No camera permission"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {needsPhoto ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
        />
      ) : (
        <View style={styles.noCameraContainer}>
          <Text style={styles.infoText}>Photo not required for this verification</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        {uploading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <TouchableOpacity
            onPress={needsPhoto ? handleCapture : handleVerification}
            style={styles.captureBtn}
          >
            <Text style={styles.captureText}>
              {needsPhoto ? "Capture" : "Verify (No Photo)"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  noCameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: { color: "#fff", fontSize: 16 },
  bottomBar: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
  },
  captureBtn: {
    backgroundColor: "#415D43",
    padding: 20,
    borderRadius: 50,
  },
  captureText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default CameraVerificationScreen;
