export interface LinkAttributeOptions {
  nofollow?: boolean;
  currentOrigin?: string;
}

export interface LinkAttributeResult {
  href: string;
  target?: string;
  rel?: string;
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function isSiteLink(href: string, currentOrigin: string) {
  if (!href.trim()) {
    return true;
  }

  try {
    const url = new URL(href, currentOrigin);
    const currentUrl = new URL(currentOrigin);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      const normalizedHost = normalizeHostname(url.hostname);
      const normalizedCurrentHost = normalizeHostname(currentUrl.hostname);

      if (normalizedHost === normalizedCurrentHost) {
        return true;
      }

      return normalizedHost === 'aerosaga.com' || normalizedHost.endsWith('.aerosaga.com');
    }
  } catch {
    // Fall back to treating malformed or relative values as internal-safe links.
  }

  return true;
}

export function getLinkAttributes(href: string, options: LinkAttributeOptions = {}): LinkAttributeResult {
  const normalizedHref = href.trim();
  if (!normalizedHref) {
    return { href: '' };
  }

  const currentOrigin = options.currentOrigin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

  try {
    const url = new URL(normalizedHref, currentOrigin);
    const isExternal = (url.protocol === 'http:' || url.protocol === 'https:') && !isSiteLink(normalizedHref, currentOrigin);

    if (!isExternal) {
      return { href: normalizedHref };
    }

    const relValues: string[] = ['noopener'];
    if (options.nofollow) {
      relValues.push('nofollow');
    }

    return {
      href: normalizedHref,
      target: '_blank',
      rel: relValues.join(' '),
    };
  } catch {
    return { href: normalizedHref };
  }
}

export function decodeEscapedButtonTags(html: string) {
  if (!html) {
    return html;
  }

  return html
    .replace(/&lt;button\b([^>]*)&gt;/gi, (_match, attributes) => `<button${attributes}>`)
    .replace(/&lt;\/button&gt;/gi, '</button>');
}

export function sanitizeLinkAttributesInHtml(html: string, options: LinkAttributeOptions = {}) {
  if (!html) {
    return html;
  }

  return html.replace(/<a\b([^>]*)>/gi, (match, attributes) => {
    const hrefMatch = attributes.match(/\bhref=(['"])(.*?)\1/i);
    if (!hrefMatch) {
      return match;
    }

    const href = hrefMatch[2] || '';
    const attrs = getLinkAttributes(href, options);

    const newAttributes = attributes
      .replace(/\btarget=(['"]).*?\1/i, '')
      .replace(/\brel=(['"]).*?\1/i, '')
      .replace(/\bhref=(['"]).*?\1/i, `href="${attrs.href}"`);

    const parts = [
      attrs.target ? `target="${attrs.target}"` : '',
      attrs.rel ? `rel="${attrs.rel}"` : '',
      newAttributes.trim(),
    ].filter(Boolean);

    return `<a ${parts.join(' ')}>`;
  });
}
