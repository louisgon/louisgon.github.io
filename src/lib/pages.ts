import type { Project } from './site';

export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const workURL = (id: string) => `${BASE}work/${id}/`;
export const slugOf = (path: string) => (path.startsWith(BASE) ? /^work\/([\w-]+)\/?$/.exec(path.slice(BASE.length))?.[1] : undefined);

const NAME = 'Louis Gonzalez';
const LEAD = 'Senior developer in Dallas, building software end to end since 2013.';

export const pageMeta = (p?: Project) => (p ? { title: `${p.title} case study · ${NAME}`, description: p.fact, path: workURL(p.id) } : { title: `${NAME} · Senior developer, Dallas`, description: LEAD, path: BASE });
