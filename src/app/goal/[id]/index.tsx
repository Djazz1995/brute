import { useLocalSearchParams } from 'expo-router';

import { GoalDetailScreen } from '@/screens/GoalDetailScreen';

export default function GoalDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GoalDetailScreen goalId={id} />;
}
