"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PROPERTIES, IMG } from '@/lib/v2-data';
import { getPropertyPath, mapPropertyFromApi } from '@/lib/property-adapter';
import { MapMock } from './ListingClient';
import { useTrackPropertyView } from '@/hooks/use-recent-views';

function toDetailProp(p: Record<string, unknown>) {
  const base = mapPropertyFromApi(p);
  const fallbackImgs = [IMG.v1, IMG.v2, IMG.v3, IMG.v4, IMG.v5, IMG.v6, IMG.v7, IMG.v8];
  const imgs: string[] = Array.isArray(p.images) && (p.images as string[]).length > 0
    ? (p.images as string[])
    : base.images?.length
      ? base.images
      : [base.img];
  return {
    ...base,
    imgs: imgs.length >= 4 ? imgs : [...imgs, ...fallbackImgs].slice(0, 4),
    description: (p.description as string) ?? base.description ?? '',
    amenities: Array.isArray(p.amenities) ? (p.amenities as string[]) : [],
    agentName: base.agent_name || 'Agente Inmobiliario',
    agentPhone: base.agent_phone || '',
    agentEmail: base.agent_email || 'contacto@inmobiliaripy.com',
    agentWhatsapp: base.agent_whatsapp || '',
    agentPhoto: base.agent_photo || IMG.agent,
    operation_type: base.operation_type,
  };
}

interface DetailClientProps {
  propertyId?: string;
  property?: any;
  similarProperties?: any[];
}

export function DetailClient({ propertyId, property: rawProperty, similarProperties = [] }: DetailClientProps) {
  const mockP = PROPERTIES.find((x: any) => x.id === propertyId) || PROPERTIES[0];
  const p: any = rawProperty ? toDetailProp(rawProperty) : {
    ...mockP,
    imgs: [mockP.img, IMG.v4, IMG.v5, IMG.v8],
    description: '',
    amenities: [],
    agentName: 'Agente Inmobiliario',
    agentPhone: '',
    agentEmail: 'contacto@inmobiliaripy.com',
  };
  const [tab, setTab] = React.useState('descripcion');
  const [thumb, setThumb] = React.useState(0);

  // Track property view in localStorage for non-logged-in users
  useTrackPropertyView(propertyId || null, rawProperty || null);
  const [loanAmount, setLoanAmount] = React.useState(380);
  const [years, setYears] = React.useState(20);
  const [rate, setRate] = React.useState(8.5);

  // Mortgage calc
  const principal = loanAmount * 1000;
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const monthly = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  const gallery = p.imgs || [p.img, IMG.v4, IMG.v5, IMG.v8];

  return (
    <div className="page-detail">
      {/* Image hero */}
      <section className="detail-hero">
        <img src={gallery[thumb]} alt={p.title} />
        <div className="overlay-grad" />

        <div className="thumb-strip">
          {gallery.map((g: string, i: number) => (
            <div key={i} className={`thumb ${thumb === i ? 'active' : ''}`} onClick={() => setThumb(i)}>
              <img src={g} alt="" />
            </div>
          ))}
        </div>

        <div className="h-content">
          <div>
            <div className="h-meta">{p.id} · {p.type.toUpperCase()} · EN VENTA</div>
            <h1>{p.title}</h1>
            <div className="h-loc">
              <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }} />
              {p.loc}
            </div>
          </div>
          <div className="h-price">
            <div className="price">{p.price}</div>
            <div className="pricelabel">USD · Negociable</div>
          </div>
        </div>
      </section>

      {/* Tabs + content */}
      <div className="detail-layout">
        <div>
          <div className="detail-tabs">
            {[
              { id: 'descripcion', label: 'Descripción' },
              { id: 'caracteristicas', label: 'Características' },
              { id: 'calculadora', label: 'Calculadora' },
              { id: 'ubicacion', label: 'Ubicación' }
            ].map(t => (
              <button key={t.id} className={`detail-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'descripcion' && (
            <div className="detail-section" key="d">
              <div className="eyebrow" style={{ marginBottom: 18 }}>SOBRE LA PROPIEDAD</div>
              <h2>Una residencia pensada<br />para el clima paraguayo.</h2>
              <p>
                {p.description || `Arquitectura contemporánea con techos altos, ventanales de piso a techo y un patio interior que distribuye luz natural a todos los ambientes. La propiedad se desarrolla en ${p.m2} m² construidos sobre un terreno de 480 m², con orientación nor-este para aprovechar las brisas del río.`}
              </p>
              {!p.description && (
                <p>
                  Materiales nobles en toda la obra: pisos de mármol travertino, carpintería de cedro paraguayo y herrería negra mate. La cocina, equipada con isla central de cuarzo, conecta directamente con el living y la galería techada que da al jardín y la piscina.
                </p>
              )}

              <div className="feature-grid">
                <div className="feature-cell">
                  <div className="k">Dormitorios</div>
                  <div className="v">{p.beds}</div>
                </div>
                <div className="feature-cell">
                  <div className="k">Baños</div>
                  <div className="v">{p.baths}</div>
                </div>
                <div className="feature-cell">
                  <div className="k">Superficie</div>
                  <div className="v">{p.m2}<span className="unit">m²</span></div>
                </div>
                <div className="feature-cell">
                  <div className="k">Terreno</div>
                  <div className="v">480<span className="unit">m²</span></div>
                </div>
                <div className="feature-cell">
                  <div className="k">Año</div>
                  <div className="v">2023</div>
                </div>
                <div className="feature-cell">
                  <div className="k">Cocheras</div>
                  <div className="v">3</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'caracteristicas' && (
            <div className="detail-section" key="c">
              <div className="eyebrow" style={{ marginBottom: 18 }}>AMENIDADES</div>
              <h2>Todo lo que incluye.</h2>
              <p>Lista completa de características de la propiedad. Todas las amenidades están verificadas por nuestro equipo durante una visita en sitio.</p>

              <div className="amenities">
                {(p.amenities && p.amenities.length > 0 ? p.amenities : ['Piscina climatizada', 'Garage para 3 autos', 'Jardín de 320 m²', 'Quincho con parrilla', 'Aire acondicionado central', 'Calefacción por piso', 'Sistema de seguridad 24/7', 'Cisterna 5.000 L', 'Cámaras CCTV', 'Cocina equipada', 'Lavandería', 'Vestidor en suite', 'Internet fibra óptica', 'Paneles solares', 'Vista panorámica al jardín']).map((a: string) => (
                  <div key={a} className="amenity">
                    <div className="check">✓</div>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'calculadora' && (
            <div className="detail-section" key="x">
              <div className="eyebrow" style={{ marginBottom: 18 }}>SIMULADOR DE CRÉDITO</div>
              <h2>¿Cuánto pagarías por mes?</h2>
              <p>Estimación basada en tasas promedio de bancos paraguayos. Para una cotización oficial, consultá con tu banco de preferencia.</p>

              <div className="calc">
                <div className="calc-row">
                  <label>Monto del préstamo <span className="val">USD {loanAmount}.000</span></label>
                  <input type="range" min="50" max="1000" value={loanAmount} onChange={e => setLoanAmount(+e.target.value)} />
                </div>
                <div className="calc-row">
                  <label>Plazo <span className="val">{years} años</span></label>
                  <input type="range" min="5" max="30" value={years} onChange={e => setYears(+e.target.value)} />
                </div>
                <div className="calc-row">
                  <label>Tasa anual <span className="val">{rate.toFixed(1)}%</span></label>
                  <input type="range" min="5" max="15" step="0.1" value={rate} onChange={e => setRate(+e.target.value)} />
                </div>

                <div className="calc-result">
                  <div className="quote">Cuota mensual estimada</div>
                  <div>
                    <span className="amount">USD {monthly.toLocaleString('es-PY', { maximumFractionDigits: 0 })}</span>
                    <span className="per">/ mes</span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, marginTop: 22, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gray)' }}>
                    <div><span style={{ color: 'var(--white)' }}>{months}</span> cuotas totales</div>
                    <div>Total: <span style={{ color: 'var(--white)' }}>USD {(monthly * months).toLocaleString('es-PY', { maximumFractionDigits: 0 })}</span></div>
                    <div>Intereses: <span style={{ color: 'var(--gold)' }}>USD {(monthly * months - principal).toLocaleString('es-PY', { maximumFractionDigits: 0 })}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'ubicacion' && (
            <div className="detail-section" key="u">
              <div className="eyebrow" style={{ marginBottom: 18 }}>EN EL MAPA</div>
              <h2>{p.loc}.</h2>
              <p>Una de las zonas más solicitadas de Asunción. A 8 min del Shopping del Sol, a 15 min del aeropuerto Silvio Pettirossi.</p>

              <div className="detail-map">
                <MapMock />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
                {[
                  { l: 'Aeropuerto', v: '15 min' },
                  { l: 'Shopping', v: '8 min' },
                  { l: 'Costanera', v: '12 min' }
                ].map(s => (
                  <div key={s.l} style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: 10, padding: 18 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gray)' }}>{s.l}</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold)', marginTop: 6 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar properties strip */}
          <div className="similar-section">
            <div className="similar-head">
              <h2 className="similar-title">
                Propiedades <span className="italic-accent">similares.</span>
              </h2>
              <div className="similar-meta">
                <span>{PROPERTIES.length - 1} resultados en {p.loc.split(',')[1] || p.loc}</span>
                <div className="similar-nav">
                  <button className="snav" data-cursor="hover" aria-label="Anterior" onClick={() => document.querySelector('.similar-strip')?.scrollBy({ left: -300, behavior: 'smooth' })}>←</button>
                  <button className="snav" data-cursor="hover" aria-label="Siguiente" onClick={() => document.querySelector('.similar-strip')?.scrollBy({ left: 300, behavior: 'smooth' })}>→</button>
                </div>
              </div>
            </div>
            <div className="similar-strip">
              {PROPERTIES.filter(sp => sp.id !== p.id).slice(0, 8).map(sp => (
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
                        <span><strong>{sp.beds}</strong>dr</span>
                        <span><strong>{sp.m2}</strong>m²</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Contact card */}
        <aside className="contact-card">
          <div className="top">
            <div className="price-big">{p.price}</div>
            <div className="price-detail">USD · USD {Math.round(p.priceN / p.m2).toLocaleString('es-PY')} / m²</div>
          </div>
          <div className="agent">
            <div className="agent-pic"><img src={IMG.agent} alt="" /></div>
            <div className="agent-info">
              <div className="name">{p.agentName}</div>
              <div className="role">VENDEDOR · 4.9 ★</div>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); window.location.href = `mailto:${p.agentEmail}?subject=Consulta por propiedad ${p.id}`; }}>
            <input placeholder="Nombre y apellido" defaultValue="" />
            <input placeholder="WhatsApp · +595" defaultValue="" />
            <input placeholder="Email" defaultValue="" />
            <textarea placeholder="Hola, me interesa esta propiedad..." defaultValue="" />
            <div className="btn-stack">
              {p.agentPhone && (
                <button type="button" className="btn btn-whatsapp" onClick={() => window.open(`https://wa.me/${p.agentPhone.replace(/\D/g,'')}?text=Hola, me interesa la propiedad ${p.id}`, '_blank')}>
                  <span>WhatsApp directo</span> <span className="btn-arrow">→</span>
                </button>
              )}
              <button type="submit" className="btn btn-gold">
                Agendar visita <span className="btn-arrow">→</span>
              </button>
            </div>
          </form>
        </aside>
      </div>

      <DarkFooterV2 />
    </div>
  );
}



// Inline footer

// Inline footer
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
        </ul></div>
        <div><h4>Empresa</h4><ul>
          <li><Link href="/vendedor">Portal vendedor</Link></li>
          <li><Link href="/api-docs">API &amp; Widget</Link></li>
        </ul></div>
        <div><h4>Legal</h4><ul>
          <li><Link href="/terminos">Términos</Link></li>
          <li><Link href="/privacidad">Privacidad</Link></li>
        </ul></div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} — INMOBILIARIAPY · ASUNCIÓN, PY</span>
        <span>—25.2867° S · —57.3333° W</span>
      </div>
    </footer>
  );
}
