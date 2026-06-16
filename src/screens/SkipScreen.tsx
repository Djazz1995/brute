import { ScreenPlaceholder } from '@/components/screen-placeholder';

type Props = {
  goalId: string;
};

export function SkipScreen({ goalId }: Props) {
  return (
    <ScreenPlaceholder
      title="I can't today"
      section="§4.5"
      note={`Friction flow: reason → countdown → final roast for goal ${goalId}.`}
    />
  );
}
