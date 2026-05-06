import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import { PASCAL_SPRITES } from '../constants/items';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FoodDropAlreadyPlayed'>;

/**
 * Pantalla mostrada cuando el usuario escanea de nuevo el QR de la
 * Tienda de la Confianza pero ya completó la misión anteriormente.
 *
 * No hay penalización ni reenvío de score: solo aviso amigable.
 */
export default function FoodDropAlreadyPlayedScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>EIAR</Text>
      </View>

      <View style={styles.content}>
        <Image source={PASCAL_SPRITES.idle} style={styles.pascal} resizeMode="contain" />
        <Text style={styles.title}>¡Ya jugaste esta misión!</Text>
        <Text style={styles.subtitle}>
          La Tienda de la Confianza solo se puede completar una vez. Tus puntos ya
          están sumados a tu total.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002C40',
  },
  header: {
    backgroundColor: '#0C6D87',
    paddingTop: 50,
    paddingBottom: 14,
    alignItems: 'center',
  },
  brand: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pascal: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#cce6ea',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  button: {
    backgroundColor: '#1CA9C9',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
