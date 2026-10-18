import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicChrome } from '@/components/PublicChrome';
import { GET as getOpenApiSpec } from '@/app/api/v1/openapi.json/route';

export const metadata: Metadata = {
  title: 'API pública v1 | InmobiliariaPY',
  description: 'Documentación de la API B2B de InmobiliariaPY: endpoints, parámetros y autenticación por API key.',
};

export const revalidate = 3600;

type Param = { name: string; in: string; required?: boolean; description?: string; schema?: { type?: string; enum?: string[]; default?: unknown; maximum?: number } };
type Operation = { summary?: string; description?: string; parameters?: Param[]; responses?: Record<string, { description?: string }> };
type Spec = {
  info?: { title?: string; version?: string; description?: string; contact?: { email?: string } };
  servers?: { url: string; description?: string }[];
  components?: { securitySchemes?: Record<string, { type?: string; scheme?: string; in?: string; name?: string; description?: string }> };
  paths?: Record<string, Record<string, Operation>>;
};

async function loadSpec(): Promise<Spec | null> {
  try {
    const call = getOpenApiSpec as unknown as (req?: Request) => Promise<Response>;
    const res = await call(new Request('http://localhost/api/v1/openapi.json'));
    return (await res.json()) as Spec;
  } catch (e) {
    console.error('[api-docs] no se pudo leer el spec:', e);
    return null;
  }
}

const METHOD_COLORS: Record<string, string> = { get: '#7BA88F', post: '#B8922A', put: '#6b8cce', patch: '#6b8cce', delete: '#ef4444' };

const mono = { fontFamily: 'var(--font-mono)' } as const;

export default async function ApiDocsPage() {
  const spec = await loadSpec();
  const baseUrl = spec?.servers?.[0]?.url ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1`;
  const schemes = Object.values(spec?.components?.securitySchemes ?? {});
  const authHeader = schemes.some((s) => s.type === 'http' && s.scheme === 'bearer')
    ? 'Authorization: Bearer impy_xxxxxxxxxxxx'
    : schemes.find((s) => s.type === 'apiKey' && s.in === 'header')?.name
      ? `${schemes.find((s) => s.type === 'apiKey')!.name}: impy_xxxxxxxxxxxx`
      : 'Authorization: Bearer impy_xxxxxxxxxxxx';

  const paths = Object.entries(spec?.paths ?? {});

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 24px 80px' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            <span /> API PÚBLICA · v{spec?.info?.version ?? '1'} <span />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', marginBottom: 16 }}>
            Integrá nuestro <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>inventario.</span>
          </h1>
          <p style={{ color: 'var(--gray)', maxWidth: 680, lineHeight: 1.7, marginBottom: 40 }}>
            {spec?.info?.description ?? 'API B2B para acceder al catálogo de propiedades de InmobiliariaPY.'}
          </p>

          <section className="dash-panel glass-card" style={{ marginBottom: 32 }} aria-labelledby="auth-title">
            <h2 id="auth-title" style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>Autenticación</h2>
            <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: 16 }}>
              Generá tu API key desde{' '}
              <Link href="/vendedor/api-keys" style={{ color: 'var(--gold)' }}>
                Portal vendedor → API Keys
              </Link>{' '}
              (plan empresa) y enviala en cada request:
            </p>
            <pre style={{ ...mono, background: '#0b0b0b', border: '1px solid var(--gray-line)', borderRadius: 10, padding: 16, overflowX: 'auto', fontSize: 13, color: 'var(--gold-light)' }}>
              {`curl -H "${authHeader}" \\\n  "${baseUrl}/properties?ciudad=Asunción&limit=10"`}
            </pre>
            {schemes.map((s, i) => s.description && (
              <p key={i} style={{ color: 'var(--gray)', fontSize: 13, marginTop: 12 }}>{s.description.replace(/`/g, '')}</p>
            ))}
            <p style={{ color: 'var(--gray)', fontSize: 13, marginTop: 12 }}>
              Base URL: <code style={{ ...mono, color: 'var(--white)' }}>{baseUrl}</code> · Spec OpenAPI:{' '}
              <a href="/api/v1/openapi.json" style={{ color: 'var(--gold)' }}>/api/v1/openapi.json</a>
            </p>
          </section>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, marginBottom: 20 }}>Endpoints</h2>

          {paths.length === 0 && <p style={{ color: 'var(--gray)' }}>No se pudo cargar la especificación en este momento.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {paths.flatMap(([path, methods]) =>
              Object.entries(methods).map(([method, op]) => (
                <article key={method + path} className="dash-panel" style={{ margin: 0 }} aria-label={`${method.toUpperCase()} ${path}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ ...mono, fontSize: 11, letterSpacing: '0.15em', fontWeight: 600, color: '#0e0e0e', background: METHOD_COLORS[method] ?? 'var(--gray)', padding: '4px 10px', borderRadius: 4 }}>
                      {method.toUpperCase()}
                    </span>
                    <code style={{ ...mono, fontSize: 15, color: 'var(--white)' }}>/api/v1{path}</code>
                  </div>
                  {op.summary && <h3 style={{ fontSize: 17, marginBottom: 4 }}>{op.summary}</h3>}
                  {op.description && <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{op.description}</p>}

                  {op.parameters && op.parameters.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="list-table" style={{ width: '100%' }}>
                        <caption style={{ textAlign: 'left', ...mono, fontSize: 10, letterSpacing: '0.2em', color: 'var(--gold)', padding: '8px 0' }}>PARÁMETROS</caption>
                        <thead>
                          <tr>
                            <th scope="col">Nombre</th>
                            <th scope="col">En</th>
                            <th scope="col">Tipo</th>
                            <th scope="col">Descripción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {op.parameters.map((p) => (
                            <tr key={p.in + p.name}>
                              <td className="gold" style={mono}>
                                {p.name}
                                {p.required && <span style={{ color: '#ef4444' }}> *</span>}
                              </td>
                              <td style={{ color: 'var(--gray)' }}>{p.in}</td>
                              <td style={{ ...mono, fontSize: 12 }}>
                                {p.schema?.type ?? '—'}
                                {p.schema?.enum && <div style={{ color: 'var(--gray)' }}>{p.schema.enum.join(' | ')}</div>}
                                {p.schema?.default !== undefined && <div style={{ color: 'var(--gray)' }}>default: {String(p.schema.default)}</div>}
                              </td>
                              <td style={{ color: 'var(--gray)' }}>{p.description ?? ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {op.responses && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, ...mono, fontSize: 12 }}>
                      {Object.entries(op.responses).map(([code, r]) => (
                        <span key={code} style={{ color: code.startsWith('2') ? '#7BA88F' : '#ef4444' }}>
                          {code} <span style={{ color: 'var(--gray)' }}>{r.description}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {spec?.info?.contact?.email && (
            <p style={{ color: 'var(--gray)', marginTop: 40, fontSize: 14 }}>
              ¿Dudas o necesitás más cuota? Escribinos a{' '}
              <a href={`mailto:${spec.info.contact.email}`} style={{ color: 'var(--gold)' }}>{spec.info.contact.email}</a>.
            </p>
          )}
        </div>
      </PublicChrome>
    </main>
  );
}
