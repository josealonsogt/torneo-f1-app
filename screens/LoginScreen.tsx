import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { accederTorneo } from "../services/authService";
export default function LoginScreen() {
  const navigation = useNavigation<any>(); // <-- MAGIA: any nos quita los errores de TS
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");

  const manejarAcceso = async () => {
    if (!nombre || !correo || !dni) {
      Alert.alert("Faltan datos", "Rellena todos los campos.");
      return;
    }

    if (correo.trim().toLowerCase() === "admin@torneo.com" && dni.trim().toLowerCase() === "admin") {
      navigation.replace("AdminScreen");
      return;
    }

    const resultado = await accederTorneo(nombre, correo, dni);

    if (resultado.id) {
      navigation.replace("HomeScreen", { jugadorId: resultado.id });
    } else {
      Alert.alert("Error", "Inténtalo de nuevo.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Acceso al Torneo</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Correo" keyboardType="email-address" autoCapitalize="none" value={correo} onChangeText={setCorreo} />
      <TextInput style={styles.input} placeholder="DNI" value={dni} onChangeText={setDni} />
      <Button title="ENTRAR" onPress={manejarAcceso} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }, // Fondo blanco
  titulo: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 30, color: "#000" }, // Texto negro
  input: { borderWidth: 1, borderColor: "#000", padding: 15, marginBottom: 15, borderRadius: 0, fontSize: 16 }, // Bordes cuadrados y negros
});