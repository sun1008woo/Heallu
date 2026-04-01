// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  // Fitness app tabs
  "figure.run": "directions-run",
  "dumbbell.fill": "fitness-center",
  "brain.head.profile": "psychology",
  "chart.bar.fill": "bar-chart",
  "bookmark.fill": "bookmark",
  "person.fill": "person",
  "person.2.fill": "people",
  // Fitness actions
  "flame.fill": "local-fire-department",
  "bolt.fill": "bolt",
  "heart.fill": "favorite",
  "clock.fill": "access-time",
  "checkmark.circle.fill": "check-circle",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "arrow.clockwise": "refresh",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "star.fill": "star",
  "trophy.fill": "emoji-events",
  "target": "gps-fixed",
  "waveform": "graphic-eq",
  "mic.fill": "mic",
  "xmark.circle.fill": "cancel",
  "info.circle": "info",
  "gear": "settings",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "bell.fill": "notifications",
  "pencil": "edit",
  "trash.fill": "delete",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "calendar": "calendar-today",
  "list.bullet": "list",
  "magnifyingglass": "search",
  "xmark": "close",
  "checkmark": "check",
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
