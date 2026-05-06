/**
 * Catálogo de los 13 items que pueden caer en el juego Food Drop.
 *
 * - `good`: alimentos que Pascal debe atrapar (+10 puntos cada uno).
 * - `bad`: residuos / basura que Pascal debe esquivar (-5 puntos cada uno).
 *
 * Los `require()` se evalúan al cargar el módulo, por lo que Metro empaqueta
 * los assets en el bundle al inicio (precarga implícita).
 */

export type FoodItemKind = 'good' | 'bad';

export interface FoodItemDef {
  id: string;
  kind: FoodItemKind;
  source: number; // resultado de require(), tipo numérico interno de RN
}

// ---- ALIMENTOS BUENOS (+10) ----
export const GOOD_ITEMS: FoodItemDef[] = [
  { id: 'papas', kind: 'good', source: require('../../../../assets/foodDrop/food/good/papas.png') },
  { id: 'paleta', kind: 'good', source: require('../../../../assets/foodDrop/food/good/paleta.png') },
  { id: 'popcorn', kind: 'good', source: require('../../../../assets/foodDrop/food/good/popcorn.png') },
  { id: 'galletas', kind: 'good', source: require('../../../../assets/foodDrop/food/good/galletas.png') },
  { id: 'dona', kind: 'good', source: require('../../../../assets/foodDrop/food/good/dona.png') },
  { id: 'croissant', kind: 'good', source: require('../../../../assets/foodDrop/food/good/croissant.png') },
  { id: 'hamburguesa', kind: 'good', source: require('../../../../assets/foodDrop/food/good/hamburguesa.png') },
];

// ---- BASURA / RESIDUOS (-5) ----
export const BAD_ITEMS: FoodItemDef[] = [
  { id: 'espina-pescado', kind: 'bad', source: require('../../../../assets/foodDrop/food/bad/espina-pescado.png') },
  { id: 'cascara-banano', kind: 'bad', source: require('../../../../assets/foodDrop/food/bad/cascara-banano.png') },
  { id: 'lata-aplastada', kind: 'bad', source: require('../../../../assets/foodDrop/food/bad/lata-aplastada.png') },
  { id: 'bolsa-plastica', kind: 'bad', source: require('../../../../assets/foodDrop/food/bad/bolsa-plastica.png') },
  { id: 'botella-agua', kind: 'bad', source: require('../../../../assets/foodDrop/food/bad/botella-agua.png') },
  { id: 'corazon-manzana', kind: 'bad', source: require('../../../../assets/foodDrop/food/bad/corazon-manzana.png') },
];

export const ALL_ITEMS: FoodItemDef[] = [...GOOD_ITEMS, ...BAD_ITEMS];

// ---- SPRITES PASCAL ----
export const PASCAL_SPRITES = {
  idle: require('../../../../assets/foodDrop/pascal/pascal.png'),
  eat: require('../../../../assets/foodDrop/pascal/pascal-eat.png'),
  red: require('../../../../assets/foodDrop/pascal/pascal-red.png'),
  bad: require('../../../../assets/foodDrop/pascal/pascal-bad.png'),
} as const;

export type PascalState = keyof typeof PASCAL_SPRITES;

// ---- UI ----
export const UI_SPRITES = {
  heartFull: require('../../../../assets/foodDrop/ui/corazon.png'),
  heartEmpty: require('../../../../assets/foodDrop/ui/corazon-vacio.png'),
  background: require('../../../../assets/foodDrop/background/bg.png'),
} as const;
