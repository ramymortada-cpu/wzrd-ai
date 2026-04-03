import { Helmet } from 'react-helmet-async';

interface SEOProps {
  /** Page title — will be appended with " | WZZRD AI" */
  title: string;
  /** Arabic page title */
  titleAr?: string;
  /** Meta description (English) */
  description: string;
  /** Meta description (Arabic) */
  descriptionAr?: string;
  /** Canonical path, e.g. "/tools" */
  path?: string;
  /** OG image URL — defaults to /og-image.png */
  image?: string;
  /** Current locale */
  locale?: 'en' | 'ar';
  /** JSON-LD structured data object */
  jsonLd?: Record<string, unknown>;
  /** noindex this page */
  noindex?: boolean;
}

const BASE_URL = 'https://www.wzzrdai.com';

export default function SEO({
  title,
  titleAr,
  description,
  descriptionAr,
  path = '/',
  image = '/og-image.png',
  locale = 'ar',
  jsonLd,
  noindex = false,
}: SEOProps) {
  const isAr = locale === 'ar';
  const displayTitle = isAr && titleAr ? titleAr : title;
  const displayDesc = isAr && descriptionAr ? descriptionAr : description;
  const fullTitle = `${displayTitle} | WZZRD AI`;
  const canonicalUrl = `${BASE_URL}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={displayDesc} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={displayDesc} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="WZZRD AI" />
      <meta property="og:locale" content={isAr ? 'ar_AR' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={displayDesc} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
