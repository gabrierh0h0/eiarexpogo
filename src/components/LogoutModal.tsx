import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  scrim: "rgba(0,0,0,0.55)",
  card: "#136c88",
  white: "#ffffff",
  buttonOutline: "rgba(255,255,255,0.85)",
  buttonFill: "#1f8cae",
};

export type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => Promise<void> | void;
  onGoToLogin: () => void;
};

/**
 * Modal de cierre de sesión con dos pasos:
 *  1) Confirmación: "Cerrar sesión" + botones [CERRAR SESIÓN] / [SEGUIR EN EIAR]
 *  2) Éxito:        "¡Sesión cerrada exitosamente!" + botón [VOLVER AL INICIO DE SESIÓN]
 *
 * Comportamiento:
 *  - onClose: se llama al pulsar "SEGUIR EN EIAR" (cancelar).
 *  - onLogout: se ejecuta cuando el usuario confirma "CERRAR SESIÓN".
 *  - onGoToLogin: se llama tras el éxito al pulsar "VOLVER AL INICIO DE SESIÓN".
 */
export default function LogoutModal({
  visible,
  onClose,
  onLogout,
  onGoToLogin,
}: LogoutModalProps) {
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [busy, setBusy] = useState(false);

  // Cuando el modal se vuelve a abrir, siempre empezamos en "confirm".
  React.useEffect(() => {
    if (visible) {
      setStep("confirm");
      setBusy(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (busy) return;
    try {
      setBusy(true);
      await onLogout();
      setStep("success");
    } catch (e) {
      console.warn("Error cerrando sesión:", e);
    } finally {
      setBusy(false);
    }
  };

  const handleGoToLogin = () => {
    onGoToLogin();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // En el paso de éxito no permitimos volver atrás con back de Android.
        if (step === "confirm") onClose();
      }}
      statusBarTranslucent
    >
      <View style={styles.scrim}>
        {step === "confirm" ? (
          <View style={styles.card}>
            <Text style={styles.title}>Cerrar sesión</Text>
            <Text style={styles.message}>
              Podrás volver a entrar cuando{"\n"}
              quieras y continuar explorando la EIA
            </Text>

            <Pressable
              onPress={handleConfirm}
              disabled={busy}
              style={({ pressed }) => [
                styles.buttonOutline,
                pressed && { opacity: 0.75 },
                busy && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.buttonOutlineText}>
                {busy ? "CERRANDO..." : "CERRAR SESIÓN"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={busy}
              style={({ pressed }) => [
                styles.buttonFill,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.buttonFillText}>SEGUIR EN EIAR</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>¡Sesión cerrada exitosamente!</Text>
            <Text style={styles.message}>
              Nos encantó acompañarte hoy.{"\n"}
              Vuelve cuando quieras continuar,{"\n"}
              aún quedan experiencias por{"\n"}
              descubrir en EIAR.
            </Text>

            <Pressable
              onPress={handleGoToLogin}
              style={({ pressed }) => [
                styles.buttonFill,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.buttonFillText}>
                VOLVER AL INICIO DE SESIÓN
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    opacity: 0.95,
    marginBottom: 22,
  },
  buttonOutline: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: COLORS.buttonOutline,
    backgroundColor: "transparent",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonOutlineText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  buttonFill: {
    width: "100%",
    backgroundColor: COLORS.buttonFill,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonFillText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
