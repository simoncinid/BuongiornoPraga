import { cache } from "react";
import { readState } from "./store";
import { siteContent } from "./content";
const publicState = cache(readState);
export const publicSiteContent = cache(async () =>
  siteContent((await publicState()).siteContent),
);
export const catalog = cache(async () => {
  const s = await publicState();
  return s.tours
    .filter((t) => t.published)
    .map((t) => ({
      ...t,
      slots: t.slots.filter(
        (s) =>
          new Date(s.startsAt).getTime() >
          Date.now() + t.bookingCutoffHours * 3600000,
      ),
    }));
});
export const publicPage = cache(async (key: string) => {
  const s = await publicState();
  return s.pages[key]?.published ? s.pages[key] : null;
});
