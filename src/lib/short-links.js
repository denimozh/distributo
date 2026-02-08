import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a tracked short link
 * @param {string} destinationUrl - The URL to redirect to
 * @param {string} postId - The post this link belongs to
 * @param {string} userId - The user who owns this link
 * @returns {string} The short URL (e.g. https://distributo.dev/r/AbCd1234)
 */
export async function createTrackedLink(destinationUrl, postId, userId) {
  if (!destinationUrl) return null;
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://distributo.dev';
  const shortCode = generateCode();

  // Add UTM params to destination
  const url = new URL(destinationUrl);
  if (!url.searchParams.has('utm_source')) {
    url.searchParams.set('utm_source', 'distributo');
    url.searchParams.set('utm_medium', 'social');
    if (postId) url.searchParams.set('utm_campaign', postId);
  }

  try {
    const { error } = await supabase.from('link_clicks').insert({
      short_code: shortCode,
      destination_url: url.toString(),
      post_id: postId || null,
      user_id: userId,
      click_count: 0,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[SHORT-LINKS] Insert failed, using raw URL:', error.message);
      return destinationUrl;
    }

    return `${appUrl}/r/${shortCode}`;
  } catch (err) {
    console.warn('[SHORT-LINKS] Error:', err.message);
    return destinationUrl;
  }
}

/**
 * Replace product URLs in plug content with tracked links
 * @param {string} plugContent - The plug/reply content
 * @param {string} productUrl - The product URL to track
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @returns {string} Updated plug content with tracked link
 */
export async function replaceWithTrackedLink(plugContent, productUrl, postId, userId) {
  if (!plugContent || !productUrl) return plugContent;
  
  const trackedUrl = await createTrackedLink(productUrl, postId, userId);
  if (!trackedUrl || trackedUrl === productUrl) return plugContent;

  // Replace the product URL in the plug content
  return plugContent.replace(productUrl, trackedUrl);
}