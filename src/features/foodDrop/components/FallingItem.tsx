import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FoodItemDef } from '../constants/items';
import { FOOD_DROP_CONFIG } from '../constants/config';

interface Props {
  def: FoodItemDef;
  x: number;
  y: number;
}

/**
 * Render de un item cayendo. Posicionado absoluto.
 * Memoizado para que solo se redibuje cuando cambian sus props.
 */
function FallingItemBase({ def, x, y }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: x - FOOD_DROP_CONFIG.itemSize / 2,
          top: y - FOOD_DROP_CONFIG.itemSize / 2,
          width: FOOD_DROP_CONFIG.itemSize,
          height: FOOD_DROP_CONFIG.itemSize,
        },
      ]}
    >
      <Image source={def.source} style={styles.image} resizeMode="contain" />
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

export const FallingItem = React.memo(FallingItemBase);
