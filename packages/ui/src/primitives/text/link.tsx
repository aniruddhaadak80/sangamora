/** Anchor that hardens external targets and adds an external-link glyph. */
import { ExternalLink } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/** True when the href leaves the app (absolute or protocol-relative). */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Destination; internal routes stay same-origin. */
  href: string;
}

export function Link({ href, children, className = "", rel, ...rest }: LinkProps): ReactNode {
  const external = isExternalHref(href);
  const joinedRel = [rel ?? "", "noopener noreferrer"].filter(Boolean).join(" ");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? joinedRel : rel}
      className={`inline-flex items-center gap-1 text-saffron underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${className}`}
      {...rest}
    >
      {children}
      {external ? <ExternalLink className="size-3.5" aria-hidden /> : null}
    </a>
  );
}
