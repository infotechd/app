import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const CustomButton = ({ title, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2980b9",
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: "#fff",
    textAlign: "center",
  },
});

export default CustomButton;
