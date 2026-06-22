import type { PressableProps } from 'react-native';

import { Button as GSButton, ButtonSpinner, ButtonText } from '@/components/ui/button';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

// Maps our 3 app-level variants onto gluestack's action+variant matrix.
const ACTION = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'negative',
} as const;

/**
 * Shared app button — thin wrapper over gluestack-ui v3 <Button>.
 * Keeps the original {title, variant, loading} API so every caller is unchanged.
 */
export function Button({ title, variant = 'primary', loading, disabled, ...rest }: Props) {
  const isDisabled = disabled || loading;

  return (
    <GSButton
      action={ACTION[variant]}
      variant="solid"
      size="xl"
      isDisabled={isDisabled}
      accessibilityRole="button"
      {...rest}
    >
      {loading ? <ButtonSpinner /> : <ButtonText>{title}</ButtonText>}
    </GSButton>
  );
}
