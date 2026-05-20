import { useState, useCallback } from "react";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook que encapsula la lógica del modal de cierre de sesión.
 *
 * Uso típico en una pantalla:
 *   const logoutFlow = useLogoutFlow();
 *
 *   <MenuOverlay onRequestLogout={logoutFlow.open} ... />
 *   <LogoutModal {...logoutFlow.modalProps} />
 *
 *   // Para abrirlo directamente desde un botón propio (ej. ícono superior):
 *   <TouchableOpacity onPress={logoutFlow.open}>...
 */
export function useLogoutFlow() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleGoToLogin = useCallback(() => {
    setVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  }, [navigation]);

  return {
    open,
    close,
    visible,
    modalProps: {
      visible,
      onClose: close,
      onLogout: handleLogout,
      onGoToLogin: handleGoToLogin,
    },
  };
}
