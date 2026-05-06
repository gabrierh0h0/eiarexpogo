import React from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { UI_SPRITES } from '../constants/items';
import { FOOD_DROP_CONFIG } from '../constants/config';

interface Props {
  score: number;
  lives: number;
  remainingMs: number;
}

const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * HUD superior con identidad EIAR, score, tiempo y corazones.
 * Renderiza tantos corazones llenos como vidas tenga el jugador,
 * y los restantes hasta el inicial como vacíos.
 */
function HUDBase({ score, lives, remainingMs }: Props) {
  const totalLives = FOOD_DROP_CONFIG.initialLives;
  const hearts = Array.from({ length: totalLives }, (_, i) => i < lives);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.brand}>EIAR</Text>
        <View style={styles.heartsBlock}>
          <Text style={styles.score}>{score}</Text>
          {hearts.map((full, idx) => (
            <Image
              key={idx}
              source={full ? UI_SPRITES.heartFull : UI_SPRITES.heartEmpty}
              style={styles.heart}
              resizeMode="contain"
            />
          ))}
        </View>
      </View>
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Tiempo restante</Text>
        <Text style={styles.timer}>{formatTime(remainingMs)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C6D87',
    paddingTop: STATUSBAR_PAD,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  heartsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 10,
  },
  heart: {
    width: 26,
    height: 26,
    marginLeft: 4,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timerLabel: {
    color: '#cce6ea',
    fontSize: 12,
  },
  timer: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export const HUD = React.memo(HUDBase);
