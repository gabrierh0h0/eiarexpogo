import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PASCAL_SPRITES, PascalState } from '../constants/items';
import { FOOD_DROP_CONFIG } from '../constants/config';

interface Props {
  state: PascalState;
  x: number; // px del centro
  y: number; // px del centro
}

/**
 * Render del personaje Pascal con sprite-swap según su estado lógico.
 * Posicionado absoluto; el padre define el contenedor del juego.
 */
function PascalBase({ state, x, y }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: x - FOOD_DROP_CONFIG.pascalWidth / 2,
          top: y - FOOD_DROP_CONFIG.pascalHeight / 2,
          width: FOOD_DROP_CONFIG.pascalWidth,
          height: FOOD_DROP_CONFIG.pascalHeight,
        },
      ]}
    >
      <Image source={PASCAL_SPRITES[state]} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export const Pascal = React.memo(PascalBase);
