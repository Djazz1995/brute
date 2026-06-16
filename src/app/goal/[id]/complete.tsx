import { useLocalSearchParams } from 'expo-router';

import { CompletionScreen } from '@/screens/CompletionScreen';

export default function CompleteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CompletionScreen goalId={id} />;
}
