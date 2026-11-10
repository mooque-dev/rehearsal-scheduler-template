"use client";

import { t, type Lang } from "@/lib/i18n";
import type { ResourceLink } from "@/lib/season";
import { Button, Icon, Sheet } from "@/components/ui";

export default function ResourcesModal({
  open,
  onClose,
  lang,
  links,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  links: ResourceLink[];
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
      <div className="space-y-2">
        {links.map((r) => {
          const external = !r.url.startsWith("mailto:");
          return (
            <a
              key={r.id}
              href={r.url}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="press flex items-center justify-between gap-3 min-h-12 px-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 active:bg-zinc-700"
            >
              <span className="text-sm font-medium text-zinc-100 break-words min-w-0">{r.label}</span>
              <Icon name="external" className="w-4 h-4 text-zinc-400 shrink-0" />
            </a>
          );
        })}
      </div>
    </Sheet>
  );
}
