import { getProjects } from '../lib/site';

export async function GET() {
  const projects = await getProjects();
  return new Response(JSON.stringify(Object.fromEntries(projects.map((p) => [p.id, p.story ?? null]))), { headers: { 'Content-Type': 'application/json' } });
}
