import { ExternalLink } from "lucide-react";
import { socialLinks } from "@/lib/site";

export function SocialLinks({ compact = false }: { compact?: boolean }) {
  if (!socialLinks.length) return null;

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "grid gap-3"}>
      {socialLinks.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="me noreferrer"
          className={compact ? "button-secondary !min-h-10 !px-4" : "flex items-center justify-between rounded-sm border border-hairline-soft px-4 py-3 text-sm text-ink"}
        >
          <span>{link.label}</span>
          <ExternalLink size={16} />
        </a>
      ))}
    </div>
  );
}
