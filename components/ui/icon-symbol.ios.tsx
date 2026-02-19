import { Image, OpaqueColorValue, type ImageStyle, type StyleProp } from 'react-native';

const IMAGE_MAPPING = {
  'chevron.right': require('../../photo/mingcute_arrow-up-fill.png'),
  'search': require('../../photo/search.png'),
  'map': require('../../photo/map.png'),
  'gps': require('../../photo/gps.png'),
  'version': require('../../photo/version.png'),
} as const;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<ImageStyle>;
  weight?: unknown;
}) {
  const source = (IMAGE_MAPPING as Record<string, any>)[name];
  if (!source) return null;

  return (
    <Image
      source={source}
      style={[{ width: size, height: size, tintColor: color as any }, style]}
      resizeMode="contain"
    />
  );
}
