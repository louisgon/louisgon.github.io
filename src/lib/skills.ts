export const LOGO = 'M1,0H.5L0,.5v4L.5,5h2V4H1ZM2,2.5H4v2L3.5,5H3V3.5H2ZM1.5,0V1H3v.5H4V.5L3.5,0Z';

export const SKILLS = [
  { t: 'Front end', d: 'Interfaces that move and still load fast.', ic: '<path d="M8 6 2 12l6 6M16 6l6 6-6 6M14 4l-4 16"/>', items: ['Astro, React, Preact', 'Alpine.js', 'GSAP and Rive', 'WebGL, three.js', 'Sass, Tailwind', 'Accessibility'] },
  { t: 'Back end', d: 'APIs, data and the logic underneath.', ic: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>', items: ['Laravel, PHP', 'Hono on Workers', 'REST APIs', 'MySQL', 'Legacy migrations', 'Auth, payments'] },
  { t: 'CMS', d: 'Content tools editors actually enjoy.', ic: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M13 13h4M13 17h4"/>', items: ['Craft CMS', 'WordPress', 'Headless setups', 'Editor experience', 'Content models', 'Multi-site'] },
  { t: 'Ship + run', d: 'Shipped, then cared for over the years.', ic: '<path d="M12 2c3 2.6 4.5 6.2 4.5 10.5L15 18H9l-1.5-5.5C7.5 8.2 9 4.6 12 2Z"/><circle cx="12" cy="10" r="2"/><path d="M9 18l-2.5 3.5M15 18l2.5 3.5M12 18v4"/>', items: ['Cloudflare Workers', 'Vite and bun', 'DDEV', 'CI and deploys', 'Performance', 'Years of upkeep'] },
];

export const CARD_GRID = `<svg class="grid" viewBox="0 0 200 284" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(143,211,255,.5)" stroke-width="1" vector-effect="non-scaling-stroke"><rect x="10" y="10" width="180" height="264" rx="9"/>${Array.from({ length: 5 }, (_, i) => `<rect x="${22 + i * 7}" y="${22 + i * 9}" width="${156 - i * 14}" height="${240 - i * 18}" rx="${7 - i}"/>`).join('')}<path d="M10 10 L70 80 M190 10 L130 80 M10 274 L70 204 M190 274 L130 204"/></g></svg>`;
