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

function shouldNofollow(href: string, options: LinkAttributeOptions = {}) {
  if (options.nofollow) {
    return true;
  }

  try {
    const normalizedHref = href.trim().toLowerCase();
    return normalizedHref.includes('amzn.to') || normalizedHref.includes('amazon.com');
  } catch {
    return false;
  }
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
    if (shouldNofollow(normalizedHref, options)) {
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

  const normalizedButtonHtml = html.replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi, (match, buttonAttributes, innerHtml) => {
    const linkMatch = innerHtml.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    if (!linkMatch) {
      return match;
    }

    const linkAttributes = linkMatch[1] || '';
    const linkContent = linkMatch[2] || '';
    const hrefMatch = linkAttributes.match(/\bhref=(['"])(.*?)\1/i);
    if (!hrefMatch) {
      return match;
    }

    const href = hrefMatch[2] || '';
    const attrs = getLinkAttributes(href, options);

    const relValues = new Set<string>();
    if (attrs.target) {
      const existingRelMatch = linkAttributes.match(/\brel=(['"])(.*?)\1/i);
      const existingRel = existingRelMatch ? existingRelMatch[2] : '';
      existingRel.split(/\s+/).filter(Boolean).forEach((value: string) => relValues.add(value));
    }

    if (attrs.rel) {
      attrs.rel.split(/\s+/).filter(Boolean).forEach((value) => relValues.add(value));
    }

    const classValues = new Set<string>();
    const buttonClassMatch = buttonAttributes.match(/\bclass=(['"])(.*?)\1/i);
    const linkClassMatch = linkAttributes.match(/\bclass=(['"])(.*?)\1/i);

    [buttonClassMatch?.[2], linkClassMatch?.[2]].filter(Boolean).forEach((className: string) => {
      className.split(/\s+/).filter(Boolean).forEach((value: string) => classValues.add(value));
    });

    const cleanedButtonAttributes = buttonAttributes
      .replace(/\bclass=(['"]).*?\1/i, '')
      .replace(/\btype=(['"]).*?\1/i, '');

    const parts = [
      classValues.size > 0 ? `class="${Array.from(classValues).join(' ')}"` : '',
      attrs.target ? `target="${attrs.target}"` : '',
      relValues.size > 0 ? `rel="${Array.from(relValues).join(' ')}"` : '',
      `role="button"`,
      cleanedButtonAttributes.trim(),
      `href="${attrs.href}"`,
    ].filter(Boolean);

    return `<a ${parts.join(' ')}>${linkContent}</a>`;
  });

  return normalizedButtonHtml.replace(/<a\b([^>]*)>/gi, (match, attributes) => {
    const hrefMatch = attributes.match(/\bhref=(['"])(.*?)\1/i);
    if (!hrefMatch) {
      return match;
    }

    const href = hrefMatch[2] || '';
    const attrs = getLinkAttributes(href, options);

    const relValues = new Set<string>();
    if (attrs.target) {
      const existingRelMatch = attributes.match(/\brel=(['"])(.*?)\1/i);
      const existingRel = existingRelMatch ? existingRelMatch[2] : '';
      existingRel.split(/\s+/).filter(Boolean).forEach((value: string) => relValues.add(value));
    }

    if (attrs.rel) {
      attrs.rel.split(/\s+/).filter(Boolean).forEach((value) => relValues.add(value));
    }

    const newAttributes = attributes
      .replace(/\btarget=(['"]).*?\1/i, '')
      .replace(/\brel=(['"]).*?\1/i, '')
      .replace(/\bhref=(['"]).*?\1/i, `href="${attrs.href}"`);

    const parts = [
      attrs.target ? `target="${attrs.target}"` : '',
      relValues.size > 0 ? `rel="${Array.from(relValues).join(' ')}"` : '',
      newAttributes.trim(),
    ].filter(Boolean);

    return `<a ${parts.join(' ')}>`;
  });
}
