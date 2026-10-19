// Placeholder mark (217×141 viewBox): two interlocking rings. Replace these paths
// with your own logo — export it as an SVG, copy each <path d="…"> value here,
// and regenerate the icons (see README → "Make it yours").
const ring = (cx: number, cy: number, outer: number, inner: number) =>
  `M${cx + outer} ${cy}A${outer} ${outer} 0 1 1 ${cx - outer} ${cy}A${outer} ${outer} 0 1 1 ${cx + outer} ${cy}Z` +
  `M${cx + inner} ${cy}A${inner} ${inner} 0 1 0 ${cx - inner} ${cy}A${inner} ${inner} 0 1 0 ${cx + inner} ${cy}Z`;

export const LOGO_PATHS: string[] = [ring(70.5, 70.5, 70.5, 52), ring(146.5, 70.5, 70.5, 52)];
