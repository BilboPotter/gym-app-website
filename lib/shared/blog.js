const fs = require('node:fs');
const path = require('node:path');

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_META_FIELDS = [
  'title',
  'seoTitle',
  'slug',
  'date',
  'dateModified',
  'description',
  'category',
  'authorName',
  'authorPath',
];

function assertBlogMetadata(meta, filePath) {
  for (const field of REQUIRED_META_FIELDS) {
    if (typeof meta[field] !== 'string' || meta[field].trim() === '') {
      throw new Error(`Missing required blog metadata "${field}" in ${filePath}`);
    }
  }

  for (const field of ['date', 'dateModified']) {
    if (!ISO_DATE_PATTERN.test(meta[field])) {
      throw new Error(`Blog metadata "${field}" must use YYYY-MM-DD in ${filePath}`);
    }
  }

  if (meta.reviewedDate && !ISO_DATE_PATTERN.test(meta.reviewedDate)) {
    throw new Error(`Blog metadata "reviewedDate" must use YYYY-MM-DD in ${filePath}`);
  }

  if (meta.dateModified < meta.date) {
    throw new Error(`Blog dateModified cannot be earlier than date in ${filePath}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) {
    throw new Error(`Blog slug must be lowercase kebab-case in ${filePath}`);
  }

  if (!meta.authorPath.startsWith('/')) {
    throw new Error(`Blog authorPath must be root-relative in ${filePath}`);
  }

  if ((meta.socialImage && !meta.socialImageAlt) || (!meta.socialImage && meta.socialImageAlt)) {
    throw new Error(`Blog socialImage and socialImageAlt must be supplied together in ${filePath}`);
  }
}

function parseBlogPost(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const metaMatch = raw.match(/<!--meta\s*([\s\S]*?)-->/);
  if (!metaMatch) {
    return null;
  }

  const meta = JSON.parse(metaMatch[1]);
  assertBlogMetadata(meta, filePath);
  const content = raw.slice(metaMatch[0].length).trim();
  return { ...meta, content };
}

function stripHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadingTime(html) {
  const plainText = stripHTML(html);
  if (!plainText) {
    return 3;
  }

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(wordCount / 220));
}

function formatBlogDate(dateString, options) {
  try {
    const date = new Date(`${dateString}T00:00:00Z`);
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateString;
  }
}

function escapeXML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadBlogPosts(blogSrcDir) {
  if (!fs.existsSync(blogSrcDir)) {
    return [];
  }

  const posts = [];
  for (const file of fs.readdirSync(blogSrcDir)) {
    if (file.startsWith('_') || !file.endsWith('.html')) {
      continue;
    }

    const post = parseBlogPost(path.join(blogSrcDir, file));
    if (post) {
      posts.push(post);
    }
  }

  posts.sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);
    return dateOrder === 0 ? a.slug.localeCompare(b.slug) : dateOrder;
  });

  return posts.map((post, index) => {
    const readingMinutes = estimateReadingTime(post.content);
    const dateOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };

    return {
      ...post,
      readingMinutes,
      readingTimeLabel: `${readingMinutes} min read`,
      dateShort: formatBlogDate(post.date, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      dateLong: formatBlogDate(post.date, dateOptions),
      dateModifiedLong: formatBlogDate(post.dateModified, dateOptions),
      reviewedDateLong: post.reviewedDate
        ? formatBlogDate(post.reviewedDate, dateOptions)
        : null,
      isFeatured: index === 0,
    };
  });
}

function generateRSS(posts, siteConfig) {
  const items = posts.map((post) => {
    const url = `${siteConfig.siteUrl}/blog/${post.slug}`;
    return `    <item>
      <title>${escapeXML(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${escapeXML(post.authorName)}</dc:creator>
      <description>${escapeXML(post.description)}</description>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${siteConfig.appName} Blog</title>
    <link>${siteConfig.siteUrl}/blog</link>
    <description>Training guides and product notes from ${siteConfig.appName}</description>
    <language>en</language>
    <atom:link href="${siteConfig.siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

module.exports = {
  generateRSS,
  loadBlogPosts,
};
