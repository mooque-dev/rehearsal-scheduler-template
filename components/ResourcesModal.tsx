"use client";

import { t, type Lang } from "@/lib/i18n";
import { RESOURCE_LINKS, STANDING_INFO, mapsUrl } from "@/lib/resources";
import { Button, FieldLabel, Icon, Sheet } from "@/components/ui";

export default function ResourcesModal({
  open,
  onClose,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
}) {
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={l("resources")}
      icon="link"
      closeLabel={l("close")}
      footer={
        <Button className="w-full" onClick={onClose}>
          {l("close")}
        </Button>
      }
    >
      <div className="space-y-5">
        {RESOURCE_LINKS.length > 0 && (
          <div className="space-y-2">
            {RESOURCE_LINKS.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="press flex items-center justify-between gap-3 min-h-12 px-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 active:bg-zinc-700"
              >
                <span className="text-sm font-medium text-zinc-100">{r.label[lang]}</span>
                <Icon name="external" className="w-4 h-4 text-zinc-400 shrink-0" />
              </a>
            ))}
          </div>
        )}

        <div>
          <FieldLabel>{l("standingInfo")}</FieldLabel>
          <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/60 divide-y divide-zinc-800">
            <InfoRow
              label={l("rehearsalLocation")}
              value={STANDING_INFO.location[lang]}
              href={mapsUrl(STANDING_INFO.locationQuery)}
            />
            <InfoRow label={l("rehearsalTime")} value={STANDING_INFO.time[lang]} />
            <InfoRow
              label={l("duesContact")}
              value={STANDING_INFO.duesEmail}
              href={`mailto:${STANDING_INFO.duesEmail}`}
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <div className="text-xs text-zinc-400 mb-0.5">{label}</div>
      <div className={`text-sm ${href ? "text-blue-400" : "text-zinc-100"} break-words`}>{value}</div>
    </>
  );
  if (!href) return <div className="px-3.5 py-3">{content}</div>;
  const external = !href.startsWith("mailto:");
  // the whole row is the link, not just the text inside it
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors first:rounded-t-xl last:rounded-b-xl"
    >
      <div className="min-w-0">{content}</div>
      <Icon name={external ? "external" : "link"} className="w-4 h-4 text-zinc-500 shrink-0" />
    </a>
  );
}
