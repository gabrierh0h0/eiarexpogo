import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  ImageBackground,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import { HUD } from '../components/HUD';
import { Pascal } from '../components/Pascal';
import { FallingItem } from '../components/FallingItem';
import { useGameLoop } from '../hooks/useGameLoop';
import { FOOD_DROP_CONFIG } from '../constants/config';
import { UI_SPRITES } from '../constants/items';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FoodDropGame'>;

/**
 * Pantalla principal del minijuego Food Drop.
 *
 * Layout:
 *   - Un único contenedor gameArea ocupa toda la pantalla.
 *   - El HUD se superpone como overlay absoluto en la parte superior.
 *   - Los items caen desde y=0 (arriba del gameArea) y "emergen" desde detrás
 *     del HUD opaco — efecto natural de caída desde arriba.
 *   - Pascal vive cerca del fondo (ver pascalRowY).
 *
 * El gameArea se mide con onLayout y esas dimensiones alimentan al engine.
 * Hasta que haya medida real, no se monta GameInner (un frame, imperceptible).
 */
export default function FoodDropGameScreen() {
  const navigation = useNavigation<Nav>();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setSize(prev => {
          if (prev && prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      }}
    >
      {size ? <GameInner size={size} navigation={navigation} /> : null}
    </View>
  );
}

interface InnerProps {
  size: { width: number; height: number };
  navigation: Nav;
}

function GameInner({ size, navigation }: InnerProps) {
  const dims = useMemo(
    () => ({
      width: size.width,
      height: size.height,
      pascalRowY:
        size.height - FOOD_DROP_CONFIG.pascalBottomOffset - FOOD_DROP_CONFIG.pascalHeight / 2,
    }),
    [size],
  );

  const { stats, falling, movePascalTo } = useGameLoop(dims, false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (stats.isOver && !navigatedRef.current) {
      navigatedRef.current = true;
      navigation.replace('FoodDropResult', {
        score: stats.score,
        endReason: stats.endReason ?? 'time',
      });
    }
  }, [stats.isOver, stats.score, stats.endReason, navigation]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          movePascalTo(e.nativeEvent.locationX);
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          movePascalTo(e.nativeEvent.locationX);
        },
      }),
    [movePascalTo],
  );

  return (
    <>
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <ImageBackground source={UI_SPRITES.background} style={styles.bg} resizeMode="cover">
          {falling.map(obj => (
            <FallingItem key={obj.uid} def={obj.def} x={obj.x} y={obj.y} />
          ))}
          <Pascal state={stats.pascalState} x={stats.pascalX} y={dims.pascalRowY} />
        </ImageBackground>
      </View>

      {/* HUD encima de todo, sin bloquear el toque sobre los hijos del gameArea */}
      <View style={styles.hudOverlay} pointerEvents="box-none">
        <HUD score={stats.score} lives={stats.lives} remainingMs={stats.remainingMs} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#013A4B',
    overflow: 'hidden',
    position: 'relative',
  },
  hudOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
