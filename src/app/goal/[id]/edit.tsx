import { useLocalSearchParams } from 'expo-router';

import { GoalEditScreen } from '@/screens/GoalEditScreen';

export default function GoalEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GoalEditScreen goalId={id} />;
}
