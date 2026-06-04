const cheerio = require('cheerio');

function cleanAndSemanticize(html) {
  const $ = cheerio.load(html, { decodeEntities: false });

  $('script, noscript, iframe, ads, .advertisement').remove();

  $('*').each((i, el) => {
    const $el = $(el);
    const style = $el.attr('style') || '';

    if (style.includes('display:flex')) {
      $el.attr('data-layout', 'flex');
    }

    if (style.includes('display:grid')) {
      $el.attr('data-layout', 'grid');
    }

    if (style.includes('position:fixed')) {
      $el.attr('data-positioning', 'fixed');
    } else if (style.includes('position:sticky')) {
      $el.attr('data-positioning', 'sticky');
    }

    if (style) {
      const normalizedStyle = style.replace(/\s+/g, ' ').trim();
      $el.attr('data-origin-style', normalizedStyle);
    }

    if ($el.is('button, a, input, select, textarea') || $el.attr('role') === 'button') {
      $el.attr('data-interactive', 'true');
    }
  });

  return $.html();
}
module.exports = { cleanAndSemanticize };
