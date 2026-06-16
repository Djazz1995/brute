import { useLocalSearchParams } from 'expo-router';

import { SkipScreen } from '@/screens/SkipScreen';

export default function SkipRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SkipScreen goalId={id} />;
}
