import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../types/navigation';
import {
  completeFoodDropMission,
  CompleteFoodDropResult,
} from '../services/foodDropService';
import { FOOD_DROP_MISSION_ID } from '../constants/config';
import { PASCAL_SPRITES } from '../constants/items';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FoodDropResult'>;
type Rt = RouteProp<RootStackParamList, 'FoodDropResult'>;

/**
 * Pantalla final del minijuego.
 *
 * Flujo:
 *   1. Llega con `score` y `endReason` del engine.
 *   2. Llama al backend para sumar el score al totalPoints (idempotente).
 *   3. Muestra:
 *      - Score de la partida
 *      - Total de puntos actualizado del usuario
 *      - Mensaje según razón de fin (tiempo o vidas)
 *      - Botón para volver al Home
 *   4. Si la red falla tras los reintentos del service, muestra error
 *      con botón "Reintentar".
 */
export default function FoodDropResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { score, endReason } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompleteFoodDropResult | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await completeFoodDropMission(FOOD_DROP_MISSION_ID, score);
      setResult(r);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        'No pudimos guardar tus puntos. Revisa tu conexión e intenta de nuevo.';
      setError(typeof msg === 'string' ? msg : 'Error guardando los puntos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalSprite = endReason === 'lives' ? PASCAL_SPRITES.bad : PASCAL_SPRITES.eat;
  const reasonText =
    endReason === 'lives'
      ? '¡Pascal se enfermó! Comió demasiada basura.'
      : '¡Se acabó el tiempo!';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>EIAR</Text>
      </View>

      <View style={styles.content}>
        <Image source={finalSprite} style={styles.pascal} resizeMode="contain" />
        <Text style={styles.title}>¡PARTIDA TERMINADA!</Text>
        <Text style={styles.reason}>{reasonText}</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Puntos de esta partida</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {loading && (
          <View style={styles.statusBlock}>
            <ActivityIndicator size="large" color="#1CA9C9" />
            <Text style={styles.statusText}>Guardando tus puntos…</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.statusBlock}>
            <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={submit}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && result && (
          <View style={styles.statusBlock}>
            {result.alreadyCompleted ? (
              <Text style={styles.alreadyText}>
                Ya habías completado esta misión antes. Tus puntos no se sumaron de nuevo.
              </Text>
            ) : (
              <>
                <Text style={styles.totalLabel}>Tus puntos totales ahora son</Text>
                <Text style={styles.totalValue}>
                  {result.newTotalPoints ?? result.totalPoints ?? '--'}
                </Text>
                {result.newAchievements && result.newAchievements.length > 0 && (
                  <Text style={styles.achievement}>
                    🎉 Desbloqueaste {result.newAchievements.length}{' '}
                    {result.newAchievements.length === 1 ? 'logro' : 'logros'}
                  </Text>
                )}
              </>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
        onPress={() => navigation.navigate('Home')}
        disabled={loading}
      >
        <Text style={styles.continueText}>Continuar</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  pascal: {
    width: 140,
    height: 140,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  reason: {
    color: '#cce6ea',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 18,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#0C6D87',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    color: '#cce6ea',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1CA9C9',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 14,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  alreadyText: {
    color: '#cce6ea',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  totalLabel: {
    color: '#cce6ea',
    fontSize: 13,
    marginBottom: 4,
  },
  totalValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  achievement: {
    color: '#FFD166',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: '#1CA9C9',
    marginHorizontal: 32,
    marginBottom: 28,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
