import { ScreenPlaceholder } from '@/components/screen-placeholder';

type Props = {
  goalId: string;
};

export function GoalDetailScreen({ goalId }: Props) {
  return (
    <ScreenPlaceholder
      title="Goal Detail"
      section="§4.7"
      note={`Streak, completion rate, timeline, roasts-received for goal ${goalId}.`}
    />
  );
}
