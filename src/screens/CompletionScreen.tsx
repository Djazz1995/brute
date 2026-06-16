import { ScreenPlaceholder } from '@/components/screen-placeholder';

type Props = {
  goalId: string;
};

export function CompletionScreen({ goalId }: Props) {
  return (
    <ScreenPlaceholder
      title="Done!"
      section="§4.3"
      note={`Tap-to-complete verdict card for goal ${goalId}; updates streak.`}
    />
  );
}
