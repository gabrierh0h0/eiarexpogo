import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useFonts } from "expo-font";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import Icon from "react-native-vector-icons/Ionicons";
import { authService } from "../services/authService";

const careers = [
  "Ingeniería de Sistemas y Computación",
  "Ingeniería Biomédica",
  "Ingeniería Mecatrónica",
  "Ingeniería Administrativa",
  "Ingeniería Financiera",
  "Ingeniería Biotecnológica",
  "Medicina",
  "Ingeniería Civil",
  "Ingeniería Ambiental",
  "Ingeniería Industrial",
];

const COLORS = {
  bgSolid: "#023048",
  pageBg: "#023048",
  button: "#219ebc",
  white: "#FFFFFF",
  inputBorder: "rgba(0,0,0,0.08)",
  placeholder: "#8CA3A8",
  ink: "#063845",
  linkOrange: "#FB8700",
};


type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() { 
    const navigation = useNavigation<RegisterScreenNavigationProp>();
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [program, setProgram] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [fontsLoaded] = useFonts({
      DigitalMdm: require("../../assets/DigitalMdm.otf"),
      SourceSansVar: require("../../assets/SourceSans3-Variable.ttf"),
    });
    if (!fontsLoaded) return null;

async function onRegister() {
  console.log("ON REGISTER CLICK");
  try {
    setLoading(true);

    await authService.register({
      firstName,
      middleName,
      lastName,
      email,
      password,
      confirmPassword: confirm,
      career: program,
    });

    Alert.alert("¡Cuenta creada!", "Bienvenido a EIAR.");
    navigation.navigate("Home");
  } catch (e: any) {
    Alert.alert(
      "Error",
      e?.response?.data?.message ?? e.message ?? "No se pudo registrar"
    );
  } finally {
    setLoading(false);
  }
}


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      <Image
        source={require("../../assets/EIAOpacidadAjustada.png")}
        style={{ width: "100%", height: 120, resizeMode: "cover" }}
      />

      <View style={styles.formContainer}>
        <View style={styles.headerSolid}>
          <Text style={styles.title}>CREA TU CUENTA</Text>
          <Text style={styles.subtitle}>
            Usa tu correo institucional para obtener acceso completo a EIAR
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ gap: 12 }}>
            <IconInput
              placeholder="Primer nombre"
              value={firstName}
              onChangeText={setFirstName}
              LeftIcon={<Icon name="person-outline" size={22} color={COLORS.ink} />}
            />
            <IconInput
              placeholder="Segundo nombre"
              value={middleName}
              onChangeText={setMiddleName}
              LeftIcon={<Icon name="person-outline" size={22} color={COLORS.ink} />}
            />
            <IconInput
              placeholder="Apellidos"
              value={lastName}
              onChangeText={setLastName}
              LeftIcon={<Icon name="people-outline" size={22} color={COLORS.ink} />}
            />
            <IconInput
              placeholder="Correo institucional"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              LeftIcon={<Icon name="mail-outline" size={22} color={COLORS.ink} />}
            />

            {/* Picker */}
            <View style={styles.inputWrap}>
              <View style={styles.leftIcon}>
                <Icon name="school-outline" size={22} color={COLORS.ink} />
              </View>
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Picker
                  selectedValue={program}
                  onValueChange={(v) => setProgram(v)}
                  dropdownIconColor={COLORS.ink}
                >
                  <Picker.Item
                    label="Selecciona tu carrera"
                    value=""
                    color={COLORS.placeholder}
                  />
                  {careers.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Password */}
            <IconInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              LeftIcon={<Icon name="lock-closed-outline" size={22} color={COLORS.ink} />}
              RightIcon={
                <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                  <Icon
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={COLORS.ink}
                  />
                </Pressable>
              }
            />
            <IconInput
              placeholder="Confirmar contraseña"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              LeftIcon={<Icon name="lock-closed-outline" size={22} color={COLORS.ink} />}
              RightIcon={
                <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                  <Icon
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={COLORS.ink}
                  />
                </Pressable>
              }
            />

            {/* Botón */}
            <TouchableOpacity
              onPress={onRegister}
              disabled={loading}
              style={[
                styles.button,
                { backgroundColor: loading ? "#219ebccc" : COLORS.button },
              ]}
            >
              <Text style={styles.buttonText}>
                {loading ? "Registrando..." : "Registrarte"}
              </Text>
            </TouchableOpacity>

            {/* Link */}
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={{ color: COLORS.white, textAlign: "center", marginTop: 12 }}>
                    ¿Ya tienes una cuenta?{" "}
                    <Text
                    style={{
                        color: COLORS.linkOrange,
                        textDecorationLine: "underline",
                        fontWeight: "700",
                    }}
                    >
                    Inicia sesión
                    </Text>
                </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type RIProps = React.ComponentProps<typeof TextInput> & {
  LeftIcon?: React.ReactNode;
  RightIcon?: React.ReactNode;
};
function IconInput({ LeftIcon, RightIcon, ...props }: RIProps) {
  return (
    <View style={styles.inputWrap}>
      {LeftIcon ? <View style={styles.leftIcon}>{LeftIcon}</View> : null}
      <TextInput
        {...props}
        placeholderTextColor={COLORS.placeholder}
        style={styles.input}
      />
      {RightIcon ? <View style={styles.rightIcon}>{RightIcon}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.bgSolid,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
    overflow: "hidden",
    zIndex: 2,
  },
  headerSolid: {
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    color: COLORS.white,
    fontSize: 26,
    letterSpacing: 1,
    textAlign: "center",
    fontFamily: "DigitalMdm",
  },
  subtitle: {
    color: COLORS.white,
    opacity: 0.95,
    marginTop: 6,
    textAlign: "center",
    fontFamily: "SourceSansVar",
    fontSize: 20,
    lineHeight: 24,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    height: 50,
  },
  leftIcon: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rightIcon: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0B1F23",
  },
  button: {
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "800",
    textAlign: "center",
  },
});