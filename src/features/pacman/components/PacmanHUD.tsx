import React from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { PACMAN_UI } from '../constants/sprites';
import { PACMAN_CONFIG } from '../constants/config';

interface Props {
  score: number;
  lives: number;
  remainingMs: number;
  dotsLeft: number;
  totalDots: number;
}

const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PacmanHUDBase({ score, lives, remainingMs, dotsLeft, totalDots }: Props) {
  const totalLives = PACMAN_CONFIG.initialLives;
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
              source={PACMAN_UI.life}
              style={[styles.heart, !full && styles.heartEmpty]}
              resizeMode="contain"
            />
          ))}
        </View>
      </View>
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>
          🟡 {totalDots - dotsLeft}/{totalDots}
        </Text>
        <Text style={styles.timer}>{formatTime(remainingMs)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A1E2E',
    paddingTop: STATUSBAR_PAD,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#14A3C7',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#14A3C7', fontSize: 24, fontWeight: 'bold' },
  heartsBlock: { flexDirection: 'row', alignItems: 'center' },
  score: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginRight: 10 },
  heart: { width: 26, height: 26, marginLeft: 4 },
  heartEmpty: { opacity: 0.2 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  timerLabel: { color: '#8BD8E8', fontSize: 13 },
  timer: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export const PacmanHUD = React.memo(PacmanHUDBase);
