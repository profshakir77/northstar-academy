import { useEffect } from 'react';

export const SITE = 'https://northstar-tuition-academy.vercel.app';
const NAME = 'Northstar Tuition Academy';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

// Sets title, description, canonical, Open Graph tags and optional JSON-LD for one page.
export function useSeo({ title, description, path = '/', image = '/og.png', jsonLd, noindex = false }) {
  useEffect(() => {
    const full = title ? `${title} | ${NAME}` : `${NAME} | Tuition in Islamabad for Matric, FSc, O & A Level`;
    document.title = full;
    const url = SITE + path;
    if (description) { setMeta('name', 'description', description); setMeta('property', 'og:description', description); setMeta('name', 'twitter:description', description); }
    setMeta('property', 'og:title', full);
    setMeta('name', 'twitter:title', full);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image.startsWith('http') ? image : SITE + image);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;
    let script = document.getElementById('page-jsonld');
    if (jsonLd) {
      if (!script) { script = document.createElement('script'); script.type = 'application/ld+json'; script.id = 'page-jsonld'; document.head.appendChild(script); }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) script.remove();
  }, [title, description, path, image, noindex, JSON.stringify(jsonLd || null)]);
}

export const crumbs = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
});
