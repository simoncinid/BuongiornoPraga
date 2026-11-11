import { publicSiteContent } from "@/lib/platform/public";
import { tripAdvisor } from "@/lib/site";
import { TripAdvisorWidget } from "./TripAdvisorWidget";
export async function TripAdvisorSection() {
  const { globals: g } = await publicSiteContent();
  return (
    <TripAdvisorWidget
      tripAdvisor={{
        ...tripAdvisor,
        profileUrl: g.tripAdvisorUrl,
        title: g.tripAdvisorTitle,
        body: g.tripAdvisorBody,
      }}
    />
  );
}
