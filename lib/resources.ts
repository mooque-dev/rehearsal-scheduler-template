export interface LocalizedText {
  ko: string;
  en: string;
}

export interface ResourceLink {
  label: LocalizedText;
  url: string;
}

// Static reference content shown in the Resources panel — rarely changes, so it's
// a code constant rather than a database table. Replace the examples with yours.
export const RESOURCE_LINKS: ResourceLink[] = [
  {
    label: { ko: "공유 폴더 (대본·악보)", en: "Shared folder (scripts, scores)" },
    url: "https://example.com/shared-folder",
  },
  {
    label: { ko: "소셜 미디어", en: "Social media" },
    url: "https://example.com/our-page",
  },
];

export const STANDING_INFO: {
  location: LocalizedText;
  locationQuery: string;
  time: LocalizedText;
  duesEmail: string;
} = {
  location: {
    ko: "스튜디오 A (예시 주소)",
    en: "Studio A (example address)",
  },
  locationQuery: "123 Example St, Springfield",
  time: {
    ko: "일요일 오후 4–7시",
    en: "Sundays, 4–7 PM",
  },
  duesEmail: "hello@example.com",
};

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
