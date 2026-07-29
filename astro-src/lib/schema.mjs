import { siteConfig } from './site.mjs';

export const schemaIds = Object.freeze({
  organization: `${siteConfig.siteUrl}/#organization`,
  website: `${siteConfig.siteUrl}/#website`,
  application: `${siteConfig.siteUrl}/#app`,
  author: `${siteConfig.siteUrl}/authors/maatriks-team#author`,
});

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': schemaIds.organization,
    name: 'Maatriks',
    legalName: siteConfig.companyName,
    url: `${siteConfig.siteUrl}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.siteUrl}/assets/favicon.svg`,
      width: 100,
      height: 100,
    },
    email: siteConfig.supportEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Papli tn 5c',
      addressLocality: 'Lüganuse alevik',
      addressRegion: 'Ida-Viru maakond',
      postalCode: '43301',
      addressCountry: 'EE',
    },
  };
}

export function authorSchema() {
  return {
    '@type': 'Organization',
    '@id': schemaIds.author,
    name: 'Maatriks Team',
    url: `${siteConfig.siteUrl}/authors/maatriks-team`,
    parentOrganization: {
      '@id': schemaIds.organization,
    },
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': schemaIds.website,
    name: 'Maatriks',
    alternateName: 'maatriks.ai',
    url: `${siteConfig.siteUrl}/`,
    publisher: {
      '@id': schemaIds.organization,
    },
    inLanguage: 'en',
  };
}

export function applicationSchema(description) {
  return {
    '@type': ['SoftwareApplication', 'MobileApplication'],
    '@id': schemaIds.application,
    name: 'Maatriks',
    applicationCategory: 'HealthApplication',
    operatingSystem: ['iOS', 'Android'],
    description,
    url: `${siteConfig.siteUrl}/`,
    installUrl: [
      siteConfig.iosAppStoreUrl,
      siteConfig.googlePlayUrl,
    ],
    isAccessibleForFree: true,
    featureList: [
      'Structured workout planning',
      'Gym workout logging for warm-ups and working sets',
      'Exercise demonstrations and instructions',
      'Built-in rest and timed-exercise timers',
      'Optional deterministic Auto-progression',
      'Post-workout summaries and AI feedback',
    ],
    author: {
      '@id': schemaIds.organization,
    },
    publisher: {
      '@id': schemaIds.organization,
    },
  };
}

export function homepageSchema(description) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema(),
      authorSchema(),
      websiteSchema(),
      applicationSchema(description),
    ],
  };
}

export function webPageSchema({ path, name, description, type = 'WebPage' }) {
  const url = `${siteConfig.siteUrl}${path}`;

  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: {
      '@id': schemaIds.website,
    },
    about: {
      '@id': schemaIds.application,
    },
    publisher: {
      '@id': schemaIds.organization,
    },
    inLanguage: 'en',
  };
}

export function blogPostingSchema(post) {
  const url = `${siteConfig.siteUrl}/blog/${post.slug}`;
  const entry = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
    },
    datePublished: post.date,
    dateModified: post.dateModified,
    author: {
      '@type': 'Organization',
      '@id': schemaIds.author,
      name: 'Maatriks Team',
      url: `${siteConfig.siteUrl}/authors/maatriks-team`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': schemaIds.organization,
      name: 'Maatriks',
      legalName: siteConfig.companyName,
      url: `${siteConfig.siteUrl}/`,
    },
    isPartOf: {
      '@id': schemaIds.website,
    },
    inLanguage: 'en',
  };

  if (post.socialImage) {
    entry.image = {
      '@type': 'ImageObject',
      url: `${siteConfig.siteUrl}${post.socialImage}`,
      caption: post.socialImageAlt,
    };
  }

  return entry;
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}
