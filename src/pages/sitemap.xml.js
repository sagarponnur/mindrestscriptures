// src/pages/sitemap.xml.js
import { emotions } from '../data/emotions.js';

export async function GET() {
  const baseUrl = 'https://mindrestscriptures.com';
  
  // Helper to match the URL formatting you used in the directory
  const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-');

  // Generate an XML <url> block for every emotion
  const emotionUrls = emotions.map(emotion => 
    `<url><loc>${baseUrl}/prayer-for-${slugify(emotion.name)}</loc></url>`
  ).join('');

  // Wrap it all in the standard XML sitemap format
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>${baseUrl}/</loc></url>
      <url><loc>${baseUrl}/directory</loc></url>
      ${emotionUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
}