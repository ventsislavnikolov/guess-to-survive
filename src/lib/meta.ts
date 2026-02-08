interface MetaSelector {
  name?: string;
  property?: string;
}

function resolveMetaSelector(selector: MetaSelector) {
  if (selector.name) {
    return `meta[name="${selector.name}"]`;
  }
  if (selector.property) {
    return `meta[property="${selector.property}"]`;
  }
  return null;
}

function upsertMeta(selector: MetaSelector, content: string) {
  const resolved = resolveMetaSelector(selector);
  if (!resolved) {
    return;
  }

  const head = document.head;
  const existing = head.querySelector(resolved) as HTMLMetaElement | null;
  const meta = existing ?? document.createElement("meta");

  if (!existing) {
    if (selector.name) {
      meta.setAttribute("name", selector.name);
    }
    if (selector.property) {
      meta.setAttribute("property", selector.property);
    }
    head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  const head = document.head;
  const selector = `link[rel="${rel}"]`;
  const existing = head.querySelector(selector) as HTMLLinkElement | null;
  const link = existing ?? document.createElement("link");

  if (!existing) {
    link.setAttribute("rel", rel);
    head.appendChild(link);
  }

  link.setAttribute("href", href);
}

export interface PageMeta {
  description?: string;
  imagePath?: string;
  title: string;
  url?: string;
}

export function setPageMeta({ description, imagePath, title, url }: PageMeta) {
  document.title = title;

  const baseUrl = new URL(url ?? window.location.href);
  // Canonicals should be stable: strip query params and hash fragments to avoid duplicates
  // (e.g. UTM params, auth redirects, checkout status flags).
  baseUrl.search = "";
  baseUrl.hash = "";
  const resolvedUrl = baseUrl.toString();
  const resolvedImage = imagePath
    ? new URL(imagePath, window.location.origin).toString()
    : new URL("/og-default.svg", window.location.origin).toString();

  if (description) {
    upsertMeta({ name: "description" }, description);
  }

  upsertMeta({ property: "og:site_name" }, "Guess to Survive");
  upsertMeta({ property: "og:title" }, title);
  upsertMeta({ property: "og:type" }, "website");
  upsertMeta({ property: "og:url" }, resolvedUrl);
  upsertMeta({ property: "og:image" }, resolvedImage);
  if (description) {
    upsertMeta({ property: "og:description" }, description);
  }

  upsertMeta({ name: "twitter:card" }, "summary_large_image");
  upsertMeta({ name: "twitter:title" }, title);
  upsertMeta({ name: "twitter:image" }, resolvedImage);
  if (description) {
    upsertMeta({ name: "twitter:description" }, description);
  }

  upsertLink("canonical", resolvedUrl);
}
