import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';      // o 'jwt_access_token'
const USER_KEY  = 'auth_user';       // opcional, para guardar uid/email

export const saveSession = async (token: string, user: { uid: string; email: string }) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    console.log('Sesión guardada en SecureStore');
  } catch (error) {
    console.error('Error guardando token:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error leyendo token:', error);
    return null;
  }
};

export const getUser = async (): Promise<{ uid: string; email: string } | null> => {
  try {
    const json = await SecureStore.getItemAsync(USER_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
};

export const clearSession = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    console.log('Sesión eliminada');
  } catch (error) {
    console.error('Error limpiando sesión:', error);
  }
};