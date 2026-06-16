import { useLocalSearchParams } from 'expo-router';

import { ShareCardScreen } from '@/screens/ShareCardScreen';

export default function ShareCardRoute() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  return <ShareCardScreen cardId={cardId} />;
}
