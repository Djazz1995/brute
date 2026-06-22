import { type ViewProps } from 'react-native';

import { Box } from '@/components/ui/box';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <Box style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
