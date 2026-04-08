import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import api from "../config/api";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../contexts/AuthContext";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setSession } = useAuth();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");



  const handleLogin = async () => {
    if (loading) return;
    if (!usuario.trim() || !password.trim()) {
      setErrorMsg("Por favor ingresa usuario y contraseña");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const response = await api.post("/auth/login", {
        email: usuario.trim(),
        password,
      });

      const { token, user, expiresIn } = response.data;

      await setSession(token, user);


      navigation.navigate("Home");

    } catch (error: any) {
      let mensaje = "Error al iniciar sesión";
      if (error.response?.data?.message) {
        mensaje = Array.isArray(error.response.data.message)
          ? error.response.data.message.join("\n")
          : error.response.data.message;
      } else {
        mensaje = "No se pudo conectar al servidor";
      }
      setErrorMsg(mensaje);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {/* Fondo */}
      <ImageBackground
        source={require("../../assets/EIAOpacidadAjustada.png")}
        style={styles.headerImage}
        resizeMode="cover"
      />

      {/* Contenedor */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeTitle}>BIENVENIDO A EIAR</Text>
        <Text style={styles.welcomeSubtitle}>
          Ten en cuenta que solo podrás ingresar con{"\n"}
          credenciales institucionales válidas.
        </Text>

        {/* Usuario */}
        <View style={styles.inputWrapper}>
          <Icon name="person-outline" size={22} color="#5c707b" />
          <TextInput
            placeholder="Usuario (correo)"
            placeholderTextColor="#5c707b"
            style={styles.input}
            value={usuario}
            onChangeText={(text) => {
              setUsuario(text);
              if (errorMsg) setErrorMsg(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Contraseña */}
        <View style={styles.inputWrapper}>
          <Icon name="lock-closed-outline" size={22} color="#5c707b" />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#5c707b"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMsg) setErrorMsg(null);
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ paddingHorizontal: 5 }}
          >
            <Icon
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={22}
              color="#5c707b"
            />
          </TouchableOpacity>
        </View>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        {/* Olvidé contraseña */}
        <TouchableOpacity>
          <Text style={styles.forgotPassword}>¿OLVIDASTE LA CONTRASEÑA?</Text>
        </TouchableOpacity>

        {/* Botón */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        {/* Registro */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerLink}>
            ¿No tienes una cuenta?{" "}
            <Text style={styles.registerHighlight}>Regístrate</Text>
          </Text>
        </TouchableOpacity>

        {/* Office */}
        <View style={styles.officeContainer}>
          <Image
            source={require("../../assets/microsoft-icon.png")}
            style={styles.officeIcon}
          />
          <Text style={styles.officeText}>
            INICIAR SESIÓN CON{" "}
            <Text style={styles.officeHighlight}>OFFICE 365</Text>
          </Text>
        </View>
      </View>
    </View>
  );


};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#023048",
  },
  headerImage: {
    width: "100%",
    height: 200,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#023048",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
    alignItems: "center",
    marginTop: -30,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#bbd1dc",
    textAlign: "center",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    width: "100%",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#37434a",
    fontSize: 16,
  },
  forgotPassword: {

  },
  loginButton: {
    backgroundColor: "#219ebc",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#f1191c",
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  registerLink: {
    color: "#ffffff",
    marginTop: 25,
  },
  registerHighlight: {
    color: "#fb8700",
    fontWeight: "bold",
  },
  officeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 40,
  },
  officeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  officeText: {
    color: "#ffffff",
  },
  officeHighlight: {
    color: "#fb8700",
    fontWeight: "bold",
  },
});
