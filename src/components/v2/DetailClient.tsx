"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getPropertyPath, getPropertyRef, mapPropertiesFromApi, mapPropertyFromApi, type V2Property } from '@/lib/property-adapter';
import { PropertiesMapDynamic } from '@/components/map';
import { FavoriteButton } from '@/components/v2/PropertyCard';

export const RECENT_KEY = 'recent_listings';
const RECENT_MAX = 20;

export type RecentListing = {
  id: string;
  title: string;
  type: string;
  operation_type: string;
  price: number;
  currency: string;
  city: string;
  neighborhood: string;
  image: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  viewedAt: string;
};

function saveRecent(p: V2Property) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const prev: RecentListing[] = raw ? JSON.parse(raw) : [];
    const entry: RecentListing = {
      id: p.id,
      title: p.title,
      type: p.type,
      operation_type: p.operation_type,
      price: p.priceN,
      currency: p.currency,
      city: p.city ?? '',
      neighborhood: p.neighborhood ?? '',
      image: p.img,
      images: (p.images ?? []).slice(0, 1),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      sqm: p.sqm,
      viewedAt: new Date().toISOString(),
    };
    const next = [entry, ...prev.filter((x) => x.id !== p.id)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* localStorage no disponible */
  }
}

interface DetailClientProps {
  property: Record<string, unknown>;
  similarProperties?: Record<string, unknown>[];
}

type ContactState = { status: 'idle' | 'sending' | 'ok' | 'error'; message?: string };

const TABS = [
  { id: 'descripcion', label: 'Descripción' },
  { id: 'caracteristicas', label: 'Características' },
  { id: 'calculadora', label: 'Calculadora' },
  { id: 'ubicacion', label: 'Ubicación' },
] as const;

export function DetailClient({ property, similarProperties = [] }: DetailClientProps) {
  const p = useMemo(() => mapPropertyFromApi(property), [property]);
  const similar = useMemo(
    () => mapPropertiesFromApi(similarProperties).filter((s) => s.id && s.id !== p.id).slice(0, 8),
    [similarProperties, p.id]
  );
  const gallery = (p.images && p.images.length > 0 ? p.images : [p.img]).filter(Boolean);
  const hasCoords = p.latitude != null && p.longitude != null && !(p.latitude === 0 && p.longitude === 0);
  const isRent = p.operation_type === 'alquiler';
  const amenities = p.amenities ?? [];

  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('descripcion');
  const [thumb, setThumb] = useState(0);

  // Historial (localStorage) + tracking de vista
  useEffect(() => {
    if (!p.id) return;
    saveRecent(p);
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: p.id }),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  // Calculadora (en miles de USD); por defecto 80% del precio
  const defaultLoan = p.currency === 'USD' && p.priceN > 0 ? Math.max(50, Math.min(1000, Math.round((p.priceN * 0.8) / 1000))) : 200;
  const [loanAmount, setLoanAmount] = useState(defaultLoan);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);
  const principal = loanAmount * 1000;
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const monthly = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  // Formulario de contacto
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: `Hola, me interesa la propiedad "${p.title}".` });
  const [contact, setContact] = useState<ContactState>({ status: 'idle' });

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setContact({ status: 'error', message: 'Ingresá tu nombre.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setContact({ status: 'error', message: 'Ingresá un email válido.' });
    if (form.message.trim().length < 5) return setContact({ status: 'error', message: 'Escribí un mensaje un poco más largo.' });
    setContact({ status: 'sending' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: p.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setContact({ status: 'error', message: json.error || 'No pudimos enviar tu consulta. Probá de nuevo.' });
        return;
      }
      setContact({ status: 'ok', message: '¡Listo! El vendedor recibió tu consulta y te va a contactar pronto.' });
      setForm((f) => ({ ...f, message: '' }));
    } catch {
      setContact({ status: 'error', message: 'Error de conexión. Probá de nuevo.' });
    }
  }

  const features: { k: string; v: React.ReactNode }[] = [];
  if (p.beds > 0) features.push({ k: 'Dormitorios', v: p.beds });
  if (p.baths > 0) features.push({ k: 'Baños', v: p.baths });
  if (p.m2 > 0) features.push({ k: 'Superficie', v: <>{p.m2}<span className="unit">m²</span></> });
  if (p.parking != null && p.parking > 0) features.push({ k: 'Cocheras', v: p.parking });
  if (p.year_built) features.push({ k: 'Año', v: p.year_built });
  if (p.floor != null) features.push({ k: 'Piso', v: p.floor });

  const whatsapp = (p.agent_whatsapp || p.agent_phone || '').replace(/\D/g, '');
  const ref = getPropertyRef(p);

  return (
    <div className="page-detail">
      <section className="detail-hero">
        <img src={gallery[thumb] ?? p.img} alt={p.title} />
        <div className="overlay-grad" />

        {gallery.length > 1 && (
          <div className="thumb-strip" role="group" aria-label="Galería de fotos">
            {gallery.map((g, i) => (
              <button
                key={i}
                type="button"
                className={`thumb ${thumb === i ? 'active' : ''}`}
                onClick={() => setThumb(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={thumb === i}
                style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <img src={g} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="h-content">
          <div>
            <div className="h-meta">
              {ref} · {p.type.toUpperCase()} · {isRent ? 'EN ALQUILER' : 'EN VENTA'}
            </div>
            <h1>{p.title}</h1>
            <div className="h-loc">
              <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }} />
              {p.loc}
            </div>
          </div>
          <div className="h-price" style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div>
              <div className="price">{p.price}</div>
              <div className="pricelabel">
                {p.currency} · {isRent ? 'por mes' : 'precio de venta'}
              </div>
            </div>
            <FavoriteButton listingId={p.id} style={{ width: 46, height: 46, fontSize: 22 }} />
          </div>
        </div>
      </section>

      <div className="detail-layout">
        <div>
          <div className="detail-tabs" role="tablist" aria-label="Información de la propiedad">
            {TABS.filter((t) => t.id !== 'calculadora' || !isRent).map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                className={`detail-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'descripcion' && (
            <div className="detail-section" id="panel-descripcion" role="tabpanel" aria-labelledby="tab-descripcion">
              <div className="eyebrow" style={{ marginBottom: 18 }}>SOBRE LA PROPIEDAD</div>
              <h2>{p.title}</h2>
              {p.description ? (
                p.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)
              ) : (
                <p style={{ color: 'var(--gray)' }}>El vendedor todavía no cargó una descripción. Consultá por más detalles.</p>
              )}

              {features.length > 0 && (
                <div className="feature-grid">
                  {features.map((f) => (
                    <div key={f.k} className="feature-cell">
                      <div className="k">{f.k}</div>
                      <div className="v">{f.v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'caracteristicas' && (
            <div className="detail-section" id="panel-caracteristicas" role="tabpanel" aria-labelledby="tab-caracteristicas">
              <div className="eyebrow" style={{ marginBottom: 18 }}>AMENIDADES</div>
              <h2>Todo lo que incluye.</h2>
              {amenities.length > 0 ? (
                <div className="amenities">
                  {amenities.map((a) => (
                    <div key={a} className="amenity">
                      <div className="check" aria-hidden>✓</div>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--gray)' }}>No hay amenidades cargadas para esta propiedad.</p>
              )}
            </div>
          )}

          {tab === 'calculadora' && !isRent && (
            <div className="detail-section" id="panel-calculadora" role="tabpanel" aria-labelledby="tab-calculadora">
              <div className="eyebrow" style={{ marginBottom: 18 }}>SIMULADOR DE CRÉDITO</div>
              <h2>¿Cuánto pagarías por mes?</h2>
              <p>Estimación orientativa. Para una cotización oficial, consultá con tu banco de preferencia.</p>

              <div className="calc">
                <div className="calc-row">
                  <label htmlFor="calc-loan">Monto del préstamo <span className="val">USD {loanAmount}.000</span></label>
                  <input id="calc-loan" type="range" min="50" max="1000" value={loanAmount} onChange={(e) => setLoanAmount(+e.target.value)} />
                </div>
                <div className="calc-row">
                  <label htmlFor="calc-years">Plazo <span className="val">{years} años</span></label>
                  <input id="calc-years" type="range" min="5" max="30" value={years} onChange={(e) => setYears(+e.target.value)} />
                </div>
                <div className="calc-row">
                  <label htmlFor="calc-rate">Tasa anual <span className="val">{rate.toFixed(1)}%</span></label>
                  <input id="calc-rate" type="range" min="5" max="15" step="0.1" value={rate} onChange={(e) => setRate(+e.target.value)} />
                </div>

                <div className="calc-result" aria-live="polite">
                  <div className="quote">Cuota mensual estimada</div>
                  <div>
                    <span className="amount">USD {monthly.toLocaleString('es-PY', { maximumFractionDigits: 0 })}</span>
                    <span className="per">/ mes</span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, marginTop: 22, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gray)', flexWrap: 'wrap' }}>
                    <div><span style={{ color: 'var(--white)' }}>{months}</span> cuotas totales</div>
                    <div>Total: <span style={{ color: 'var(--white)' }}>USD {(monthly * months).toLocaleString('es-PY', { maximumFractionDigits: 0 })}</span></div>
                    <div>Intereses: <span style={{ color: 'var(--gold)' }}>USD {(monthly * months - principal).toLocaleString('es-PY', { maximumFractionDigits: 0 })}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'ubicacion' && (
            <div className="detail-section" id="panel-ubicacion" role="tabpanel" aria-labelledby="tab-ubicacion">
              <div className="eyebrow" style={{ marginBottom: 18 }}>UBICACIÓN</div>
              <h2>{p.loc}.</h2>
              {hasCoords ? (
                <div className="detail-map">
                  <PropertiesMapDynamic
                    items={[{ id: p.id, title: p.title, lat: p.latitude as number, lng: p.longitude as number, price: p.priceFormatted }]}
                    highlightedId={p.id}
                  />
                </div>
              ) : (
                <p style={{ color: 'var(--gray)' }}>La ubicación exacta se comparte al contactar al vendedor.</p>
              )}
            </div>
          )}

          {similar.length > 0 && (
            <div className="similar-section">
              <div className="similar-head">
                <h2 className="similar-title">
                  Propiedades <span className="italic-accent">similares.</span>
                </h2>
                <div className="similar-meta">
                  <span>{similar.length} {similar.length === 1 ? 'resultado' : 'resultados'}</span>
                  <div className="similar-nav">
                    <button type="button" className="snav" data-cursor="hover" aria-label="Anterior" onClick={() => document.querySelector('.similar-strip')?.scrollBy({ left: -300, behavior: 'smooth' })}>←</button>
                    <button type="button" className="snav" data-cursor="hover" aria-label="Siguiente" onClick={() => document.querySelector('.similar-strip')?.scrollBy({ left: 300, behavior: 'smooth' })}>→</button>
                  </div>
                </div>
              </div>
              <div className="similar-strip">
                {similar.map((sp) => (
                  <Link key={sp.id} href={getPropertyPath(sp)} className="similar-card" data-cursor="crosshair" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="sc-img">
                      <img src={sp.img} alt={sp.title} draggable="false" />
                      <div className="sc-tag">{sp.type}</div>
                    </div>
                    <div className="sc-body">
                      <div className="sc-loc">
                        <span className="loc-dot" /> {sp.loc.split(',')[0]}
                      </div>
                      <h4 className="sc-title">{sp.title}</h4>
                      <div className="sc-row">
                        <div className="sc-price">{sp.price}</div>
                        <div className="sc-specs">
                          {sp.beds > 0 && <span><strong>{sp.beds}</strong>dr</span>}
                          {sp.m2 > 0 && <span><strong>{sp.m2}</strong>m²</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="contact-card" aria-label="Contactar al vendedor">
          <div className="top">
            <div className="price-big">{p.price}</div>
            <div className="price-detail">
              {p.currency}
              {p.m2 > 0 && p.priceN > 0 && !isRent && ` · ${p.currency} ${Math.round(p.priceN / p.m2).toLocaleString('es-PY')} / m²`}
              {isRent && ' · por mes'}
            </div>
          </div>
          <div className="agent">
            <div className="agent-pic">
              {p.agent_photo ? (
                <img src={p.agent_photo} alt={p.agent_name ?? 'Vendedor'} />
              ) : (
                <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: 20 }}>
                  {(p.agent_name || 'V').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="agent-info">
              <div className="name">{p.agent_name || 'Vendedor'}</div>
              <div className="role">{(p.agent_title || 'Vendedor').toUpperCase()}</div>
            </div>
          </div>

          {contact.status === 'ok' ? (
            <div role="status" style={{ padding: '18px 0', color: 'var(--gold-light)', lineHeight: 1.5 }}>
              {contact.message}
              <button type="button" className="btn btn-ghost" style={{ marginTop: 16, width: '100%' }} onClick={() => setContact({ status: 'idle' })}>
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleContact} noValidate>
              <label htmlFor="contact-name" style={srOnly}>Nombre y apellido</label>
              <input id="contact-name" placeholder="Nombre y apellido" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <label htmlFor="contact-phone" style={srOnly}>WhatsApp</label>
              <input id="contact-phone" placeholder="WhatsApp · +595" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <label htmlFor="contact-email" style={srOnly}>Email</label>
              <input id="contact-email" placeholder="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <label htmlFor="contact-message" style={srOnly}>Mensaje</label>
              <textarea id="contact-message" placeholder="Hola, me interesa esta propiedad..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              {contact.status === 'error' && (
                <div role="alert" style={{ color: '#ef4444', fontSize: 13, margin: '4px 0 8px' }}>{contact.message}</div>
              )}
              <div className="btn-stack">
                {whatsapp && (
                  <a
                    className="btn btn-whatsapp"
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, me interesa la propiedad ${ref}: ${p.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>WhatsApp directo</span> <span className="btn-arrow">→</span>
                  </a>
                )}
                <button type="submit" className="btn btn-gold" disabled={contact.status === 'sending'}>
                  {contact.status === 'sending' ? 'Enviando…' : 'Enviar consulta'} <span className="btn-arrow">→</span>
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 10 }}>
                ¿Dudas? Escribinos a <a href="mailto:contacto@inmobiliariapy.com" style={{ color: 'var(--gold)' }}>contacto@inmobiliariapy.com</a>
              </p>
            </form>
          )}
        </aside>
      </div>

      <DarkFooterV2 />
    </div>
  );
}

const srOnly: React.CSSProperties = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };

function DarkFooterV2() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="name">InmobiliariaPY<span style={{ color: 'var(--gold)' }}>.</span></div>
          <p>El mercado inmobiliario premium de Paraguay.</p>
        </div>
        <div><h4>Explorar</h4><ul>
          <li><Link href="/propiedades">Propiedades</Link></li>
          <li><Link href="/propiedades?operacion=venta">Comprar</Link></li>
          <li><Link href="/propiedades?operacion=alquiler">Alquilar</Link></li>
        </ul></div>
        <div><h4>Empresa</h4><ul>
          <li><Link href="/vendedor">Portal vendedor</Link></li>
          <li><Link href="/api-docs">API &amp; Widget</Link></li>
        </ul></div>
        <div><h4>Legal</h4><ul>
          <li><Link href="/terminos">Términos</Link></li>
          <li><Link href="/privacidad">Privacidad</Link></li>
          <li><Link href="/cookies">Cookies</Link></li>
        </ul></div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} — INMOBILIARIAPY · ASUNCIÓN, PY</span>
        <span>—25.2867° S · —57.3333° W</span>
      </div>
    </footer>
  );
}
