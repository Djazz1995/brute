import { ScreenPlaceholder } from '@/components/screen-placeholder';

type Props = {
  /** Goal id when editing; undefined when creating. */
  goalId?: string;
};

export function GoalEditScreen({ goalId }: Props) {
  return (
    <ScreenPlaceholder
      title={goalId ? 'Edit Goal' : 'New Goal'}
      section="§4.1"
      note="Name, category, cue, schedule, rudeness, escalation speed, buddy."
    />
  );
}
