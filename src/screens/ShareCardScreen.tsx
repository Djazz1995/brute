import { ScreenPlaceholder } from '@/components/screen-placeholder';

type Props = {
  cardId: string;
};

export function ShareCardScreen({ cardId }: Props) {
  return (
    <ScreenPlaceholder
      title="Share Roast"
      section="§4.8"
      note={`Watermarked card ${cardId}; export to IG / TikTok / X / WhatsApp.`}
    />
  );
}
