import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "book.fill": "menu-book",
  "person.fill": "person",
  "arrow.left.arrow.right": "swap-horiz",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "trash.fill": "delete",
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

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
  weight?: string;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
