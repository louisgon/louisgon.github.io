const ICP = { 'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>' };
export const ic = (n: keyof typeof ICP) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICP[n]}</svg>`;
