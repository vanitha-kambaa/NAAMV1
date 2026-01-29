// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'house': 'home',
  // Paper plane
  'paperplane.fill': 'send',
  'paperplane': 'send',
  // Map pin icons
  'mappin': 'place',
  'mappin.circle': 'place',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'pencil': 'edit',
  'xmark': 'close',
  'person.fill': 'person',
  'phone.fill': 'phone',
  'envelope.fill': 'email',
  'location.circle': 'location-on',
  'location.fill': 'location-on',
  'person.circle': 'account-circle',
  'calendar': 'date-range',
  'calendar.badge.clock': 'access-time',
  'briefcase.fill': 'work',
  'chevron.down': 'keyboard-arrow-down',
  'doc.fill': 'description',
  'photo.fill': 'photo',
  'camera.fill': 'camera-alt',
  'checkmark': 'check',
  'eye.fill': 'visibility',
  'gearshape.fill': 'settings',
  'gearshape': 'settings',
  'person.crop.circle.fill': 'account-circle',
  'location.north.line.fill': 'terrain',
  'globe.americas.fill': 'language',
  'power': 'power-settings-new',
  'creditcard.fill': 'credit-card',
  'creditcard': 'credit-card',
  'plus.circle.fill': 'add-circle',
  'plus': 'add',
  'leaf.fill': 'eco',
  'cube': 'inventory-2',
  'cube.fill': 'inventory',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'chart.bar.fill': 'insert-chart',
  'cart.fill': 'shopping-cart',
  'wrench.and.screwdriver.fill': 'build',
  'person.3.fill': 'groups',
  'person.crop.circle.badge.plus': 'person-add',
  'building.columns.fill': 'account-balance',
  'doc.text.fill': 'description',
  'doc.text': 'description',
  'indianrupeesign.circle.fill': 'currency-rupee',
  'bell.fill': 'notifications',
  'chevron.left': 'chevron-left',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  // List bullet mapping
  'list.bullet': 'format-list-bulleted',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
