'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createListing, updateListing } from '@/lib/actions/properties';

// ─── Datos estáticos ──────────────────────────────────────────────────────────

const TIPOS = ['Casa', 'Apartamento', 'Terreno', 'Local', 'Oficina', 'Penthouse'];
const AMENITIES_LIST = [
  'Piscina', 'Jardín', 'Parrillero', 'Seguridad 24hs',
  'Ascensor', 'Gimnasio', 'Laundry', 'Amoblado', 'Cochera techada',
];
const DEPARTAMENTOS: Record<string, string[]> = {
  Asunción:         ['Asunción'],
  Central:          ['San Lorenzo', 'Fernando de la Mora', 'Luque', 'Lambaré', 'Ñemby', 'Capiatá', 'Mariano Roque Alonso', 'Villa Elisa'],
  'Alto Paraná':    ['Ciudad del Este', 'Presidente Franco', 'Hernandarias', 'Minga Guazú'],
  Itapúa:          ['Encarnación', 'Fram', 'Coronel Bogado'],
  Amambay:          ['Pedro Juan Caballero', 'Bella Vista'],
  Caaguazú:         ['Coronel Oviedo', 'Caaguazú', 'Vaquería'],
  Concepción:       ['Concepción', 'Horqueta'],
  'San Pedro':      ['San Pedro del Ycuamandiyú', 'Lima'],
  Cordillera:       ['Caacupé', 'Tobatí', 'Caraguatay'],
  Guairá:           ['Villarrica', 'Natalicio Talavera'],
  Caazapá:          ['Caazapá', 'Yuty'],
  Misiones:         ['San Juan Bautista', 'San Ignacio'],
  Paraguarí:        ['Paraguarí', 'Pirayú'],
  Ñeembucú:        ['Pilar', 'Humaitá'],
  'Presidente Hayes':['Villa Hayes', 'Benjamín Aceval'],
  Boquerón:         ['Filadelfia', 'Loma Plata', 'Mariscal Estigarribia'],
  'Alto Paraguay':  ['Fuerte Olimpo', 'Puerto Casado'],
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FormState = {
  // Step 1
  type: string;
  operation_type: 'venta' | 'alquiler';
  title: string;
  description: string;
  // Step 2
  department: string;
  city: string;
  neighborhood: string;
  address: string;
  // Step 3
  price: string;
  currency: 'USD' | 'PYG';
  sqm: string;
  sqm_built: string;
  bedrooms: number;
  bathrooms: number;
  garage: boolean;
  amenities: string[];
  // Step 4
  images: string[];
};

const INITIAL: FormState = {
  type: '', operation_type: 'venta', title: '', description: '',
  department: '', city: '', neighborhood: '', address: '',
  price: '', currency: 'USD', sqm: '', sqm_built: '',
  bedrooms: 1, bathrooms: 1, garage: false, amenities: [],
  images: [],
};

// ─── Helpers UI ───────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6,
  background: 'var(--bg-dark)', border: '1px solid var(--gray-line)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--fg)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--gray)',
  letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
};
const errStyle: React.CSSProperties = { color: '#ff6b6b', fontSize: 13, marginTop: 8 };

function Label({ children }: { children: React.ReactNode }) {
  return <span style={labelStyle}>{children}</span>;
}

function Counter({
  value, onChange, min = 0, max = 20,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--gray-line)', background: 'var(--bg-dark)', color: 'var(--fg)', cursor: 'pointer', fontSize: 18, lineHeight: 1, display:'flex',alignItems:'center',justifyContent:'center' }}
      >−</button>
      <span style={{ minWidth: 24, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{value}</span>
      <button type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--gray-line)', background: 'var(--bg-dark)', color: 'var(--fg)', cursor: 'pointer', fontSize: 18, lineHeight: 1, display:'flex',alignItems:'center',justifyContent:'center' }}
      >+</button>
    </div>
  );
}

// ─── Pasos ────────────────────────────────────────────────────────────────────

function Step1({ f, set }: { f: FormState; set: (p: Partial<FormState>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Tipo */}
      <div>
        <Label>Tipo de propiedad *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
          {TIPOS.map((t) => (
            <button key={t} type="button"
              onClick={() => set({ type: t })}
              style={{
                padding: '14px 8px', borderRadius: 10, border: `1px solid ${f.type === t ? 'var(--gold)' : 'var(--gray-line)'}`,
                background: f.type === t ? 'rgba(200,168,100,0.08)' : 'var(--bg-dark)',
                color: f.type === t ? 'var(--gold)' : 'var(--fg)',
                cursor: 'pointer', fontSize: 13, fontWeight: f.type === t ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Operación */}
      <div>
        <Label>Operación *</Label>
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          {(['venta', 'alquiler'] as const).map((op) => (
            <button key={op} type="button"
              onClick={() => set({ operation_type: op })}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 10,
                border: `1px solid ${f.operation_type === op ? 'var(--gold)' : 'var(--gray-line)'}`,
                background: f.operation_type === op ? 'rgba(200,168,100,0.08)' : 'var(--bg-dark)',
                color: f.operation_type === op ? 'var(--gold)' : 'var(--fg)',
                cursor: 'pointer', fontSize: 14, textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >{op}</button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div>
        <label>
          <Label>Título *</Label>
          <input
            value={f.title}
            onChange={(e) => set({ title: e.target.value.slice(0, 80) })}
            placeholder="Ej: Casa moderna en Lambaré con piscina"
            style={fieldStyle}
          />
          <span style={{ fontSize: 11, color: 'var(--gray)', float: 'right', marginTop: 4 }}>
            {f.title.length}/80
          </span>
        </label>
      </div>

      {/* Descripción */}
      <div>
        <label>
          <Label>Descripción *</Label>
          <textarea
            value={f.description}
            onChange={(e) => set({ description: e.target.value.slice(0, 1000) })}
            rows={5}
            placeholder="Describí las características principales, el entorno, accesos, estado, etc."
            style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
          <span style={{ fontSize: 11, color: 'var(--gray)', float: 'right', marginTop: 4 }}>
            {f.description.length}/1000
          </span>
        </label>
      </div>
    </div>
  );
}

function Step2({ f, set }: { f: FormState; set: (p: Partial<FormState>) => void }) {
  const cities = f.department ? DEPARTAMENTOS[f.department] ?? [] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label>
          <Label>Departamento *</Label>
          <select
            value={f.department}
            onChange={(e) => set({ department: e.target.value, city: '' })}
            style={fieldStyle}
          >
            <option value="">Seleccioná</option>
            {Object.keys(DEPARTAMENTOS).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label>
          <Label>Ciudad *</Label>
          <select
            value={f.city}
            onChange={(e) => set({ city: e.target.value })}
            disabled={!f.department}
            style={{ ...fieldStyle, opacity: f.department ? 1 : 0.5 }}
          >
            <option value="">Seleccioná</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <label>
        <Label>Barrio / Localidad</Label>
        <input
          value={f.neighborhood}
          onChange={(e) => set({ neighborhood: e.target.value })}
          placeholder="Ej: Villa Morra, Recoleta"
          style={fieldStyle}
        />
      </label>

      <label>
        <Label>Dirección (opcional)</Label>
        <input
          value={f.address}
          onChange={(e) => set({ address: e.target.value })}
          placeholder="Ej: Avda. Mcal. López 1234 (se mostrará aproximada)"
          style={fieldStyle}
        />
        <span style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6, display: 'block' }}>
          ℹ La dirección exacta es opcional y no se muestra públicamente.
        </span>
      </label>
    </div>
  );
}

function Step3({ f, set }: { f: FormState; set: (p: Partial<FormState>) => void }) {
  function toggleAmenity(a: string) {
    set({
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Precio */}
      <div>
        <Label>Precio *</Label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <input
            type="number"
            min={0}
            value={f.price}
            onChange={(e) => set({ price: e.target.value })}
            placeholder="0"
            style={{ ...fieldStyle, flex: 1 }}
          />
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--gray-line)' }}>
            {(['USD', 'PYG'] as const).map((cur) => (
              <button key={cur} type="button"
                onClick={() => set({ currency: cur })}
                style={{
                  padding: '0 16px', background: f.currency === cur ? 'var(--gold)' : 'var(--bg-dark)',
                  color: f.currency === cur ? '#000' : 'var(--gray)',
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >{cur}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Superficies */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label>
          <Label>Superficie total (m²) *</Label>
          <input
            type="number" min={0}
            value={f.sqm}
            onChange={(e) => set({ sqm: e.target.value })}
            placeholder="Ej: 200"
            style={fieldStyle}
          />
        </label>
        <label>
          <Label>Superficie construida (m²)</Label>
          <input
            type="number" min={0}
            value={f.sqm_built}
            onChange={(e) => set({ sqm_built: e.target.value })}
            placeholder="Ej: 150"
            style={fieldStyle}
          />
        </label>
      </div>

      {/* Dormitorios / Baños */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <Label>Dormitorios</Label>
          <div style={{ marginTop: 12 }}>
            <Counter value={f.bedrooms} onChange={(v) => set({ bedrooms: v })} min={0} max={20} />
          </div>
        </div>
        <div>
          <Label>Baños</Label>
          <div style={{ marginTop: 12 }}>
            <Counter value={f.bathrooms} onChange={(v) => set({ bathrooms: v })} min={1} max={10} />
          </div>
        </div>
      </div>

      {/* Garaje */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="button"
          onClick={() => set({ garage: !f.garage })}
          style={{
            width: 48, height: 26, borderRadius: 13,
            background: f.garage ? 'var(--gold)' : 'var(--gray-line)',
            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: f.garage ? 25 : 3,
            width: 20, height: 20, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
        <span style={{ fontSize: 14 }}>Garaje / Cochera</span>
      </div>

      {/* Amenities */}
      <div>
        <Label>Amenities</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {AMENITIES_LIST.map((a) => {
            const active = f.amenities.includes(a);
            return (
              <button key={a} type="button"
                onClick={() => toggleAmenity(a)}
                style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 13,
                  border: `1px solid ${active ? 'var(--gold)' : 'var(--gray-line)'}`,
                  background: active ? 'rgba(200,168,100,0.1)' : 'var(--bg-dark)',
                  color: active ? 'var(--gold)' : 'var(--gray)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{a}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step4({ f, set }: { f: FormState; set: (p: Partial<FormState>) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadErr('');
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/seller/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) { setUploadErr(json.error ?? 'Error al subir imagen'); break; }
      urls.push(json.url);
    }
    set({ images: [...f.images, ...urls] });
    setUploading(false);
  }, [f.images, set]);

  function removeImage(idx: number) {
    set({ images: f.images.filter((_, i) => i !== idx) });
  }

  function moveImage(from: number, to: number) {
    const imgs = [...f.images];
    const [moved] = imgs.splice(from, 1);
    imgs.splice(to, 0, moved);
    set({ images: imgs });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed var(--gray-line)', borderRadius: 12, padding: '40px 24px',
          textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s', background: 'var(--bg-dark)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
        <p style={{ color: 'var(--fg)', marginBottom: 4 }}>
          {uploading ? 'Subiendo...' : 'Arrastrá fotos aquí o hacé clic para seleccionar'}
        </p>
        <p style={{ color: 'var(--gray)', fontSize: 13 }}>JPG, PNG o WebP · Máx 8 MB por foto</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploadErr && <p style={errStyle}>{uploadErr}</p>}

      {f.images.length > 0 && (
        <div>
          <p style={{ ...labelStyle, marginBottom: 12 }}>
            {f.images.length} foto{f.images.length !== 1 ? 's' : ''} · La primera es la portada
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {f.images.map((url, i) => (
              <div key={url + i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3', border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--gray-line)' }}>
                <img src={url} alt={`foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {i === 0 && (
                  <span style={{ position: 'absolute', top: 6, left: 6, background: 'var(--gold)', color: '#000', fontSize: 9, letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    PORTADA
                  </span>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 4, padding: 6, background: 'rgba(0,0,0,0.6)' }}>
                  {i > 0 && (
                    <button type="button" onClick={() => moveImage(i, i - 1)}
                      title="Mover izquierda"
                      style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, padding: '3px 0' }}>←</button>
                  )}
                  {i < f.images.length - 1 && (
                    <button type="button" onClick={() => moveImage(i, i + 1)}
                      title="Mover derecha"
                      style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, padding: '3px 0' }}>→</button>
                  )}
                  <button type="button" onClick={() => removeImage(i)}
                    title="Eliminar"
                    style={{ flex: 1, background: 'rgba(255,50,50,0.3)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, padding: '3px 0' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step5({ f }: { f: FormState }) {
  const rows: [string, string][] = [
    ['Tipo', f.type],
    ['Operación', f.operation_type],
    ['Título', f.title],
    ['Descripción', f.description.length > 120 ? f.description.slice(0, 120) + '…' : f.description],
    ['Departamento', f.department],
    ['Ciudad', f.city],
    ['Barrio', f.neighborhood || '—'],
    ['Dirección', f.address || '—'],
    ['Precio', `${f.price} ${f.currency}`],
    ['Superficie total', `${f.sqm} m²`],
    ['Sup. construida', f.sqm_built ? `${f.sqm_built} m²` : '—'],
    ['Dormitorios', String(f.bedrooms)],
    ['Baños', String(f.bathrooms)],
    ['Garaje', f.garage ? 'Sí' : 'No'],
    ['Amenities', f.amenities.length ? f.amenities.join(', ') : '—'],
    ['Fotos', `${f.images.length} cargadas`],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Preview fotos */}
      {f.images.length > 0 && (
        <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/7' }}>
          <img src={f.images[0]} alt="portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--gray-line)', borderRadius: 12, overflow: 'hidden' }}>
        {rows.map(([label, value], idx) => (
          <div key={label} style={{ display: 'flex', borderBottom: idx === rows.length - 1 ? 'none' : '1px solid var(--gray-line)' }}>
            <div style={{ width: 160, minWidth: 160, padding: '10px 16px', color: 'var(--gray)', fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '1px solid var(--gray-line)' }}>
              {label}
            </div>
            <div style={{ padding: '10px 16px', fontSize: 14, lineHeight: 1.5 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(200,168,100,0.06)', border: '1px solid rgba(200,168,100,0.2)', borderRadius: 10, padding: '14px 18px' }}>
        <p style={{ color: 'var(--gold)', fontSize: 13 }}>
          ✓ Tu propiedad quedará en estado <strong>activo</strong> una vez publicada. Podés pausarla o editarla en cualquier momento desde "Mis propiedades".
        </p>
      </div>
    </div>
  );
}

// ─── Validación ───────────────────────────────────────────────────────────────

function validate(step: number, f: FormState): string | null {
  if (step === 1) {
    if (!f.type) return 'Seleccioná el tipo de propiedad.';
    if (!f.title.trim()) return 'El título es obligatorio.';
    if (!f.description.trim()) return 'La descripción es obligatoria.';
  }
  if (step === 2) {
    if (!f.department) return 'Seleccioná el departamento.';
    if (!f.city) return 'Seleccioná la ciudad.';
  }
  if (step === 3) {
    if (!f.price || Number(f.price) <= 0) return 'Ingresá un precio válido.';
    if (!f.sqm || Number(f.sqm) <= 0) return 'Ingresá la superficie total.';
  }
  if (step === 4) {
    if (f.images.length < 1) return 'Subí al menos 1 foto.';
  }
  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NuevaPropertyClient({
  sellerProfileId,
  listingId,
  initialData,
}: {
  sellerProfileId: string;
  listingId?: string;
  initialData?: Partial<FormState>;
}) {
  const isEdit = !!listingId;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...initialData });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const patchForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  function handleNext() {
    const err = validate(step, form);
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setError('');
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(status: 'active' | 'draft') {
    const err = validate(step, form);
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    try {
      let result: { success: boolean; error?: string };

      if (isEdit && listingId) {
        result = await updateListing({
          listingId,
          city: form.city,
          neighborhood: form.neighborhood,
          address: form.address,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          sqm: Number(form.sqm),
          parking: form.garage ? 1 : 0,
          title: form.title,
          description: form.description,
          price: Number(form.price),
          currency: form.currency,
          operation_type: form.operation_type,
          image: form.images[0] ?? '',
          images: form.images,
          amenities: form.amenities,
          status,
        });
      } else {
        result = await createListing({
          city: form.city,
          neighborhood: form.neighborhood,
          address: form.address,
          latitude: 0,
          longitude: 0,
          type: form.type as any,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          sqm: Number(form.sqm),
          parking: form.garage ? 1 : 0,
          title: form.title,
          description: form.description,
          price: Number(form.price),
          currency: form.currency,
          operation_type: form.operation_type,
          image: form.images[0] ?? '',
          images: form.images,
          amenities: form.amenities,
          featured: false,
          seller_profile_id: sellerProfileId,
        });
      }

      if (!result.success) {
        setError(result.error ?? 'Error al guardar.');
        setSubmitting(false);
        return;
      }

      router.push('/vendedor/propiedades');
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado.');
      setSubmitting(false);
    }
  }

  const STEPS = ['Información', 'Ubicación', 'Detalles', 'Fotos', 'Revisión'];

  const stepContent = [
    <Step1 key={1} f={form} set={patchForm} />,
    <Step2 key={2} f={form} set={patchForm} />,
    <Step3 key={3} f={form} set={patchForm} />,
    <Step4 key={4} f={form} set={patchForm} />,
    <Step5 key={5} f={form} />,
  ];

  return (
    <div>
      {/* Topbar */}
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{isEdit ? 'EDITAR PROPIEDAD' : 'NUEVA PROPIEDAD'}</div>
          <h1>{isEdit ? 'Editar' : 'Publicar'} <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>propiedad.</span></h1>
        </div>
      </div>

      {/* Progress */}
      <div className="dash-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', top: 14, right: '50%', width: '100%', height: 2,
                    background: done ? 'var(--gold)' : 'var(--gray-line)',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', zIndex: 1,
                  background: done ? 'var(--gold)' : active ? 'rgba(200,168,100,0.2)' : 'var(--bg-dark)',
                  border: `2px solid ${done || active ? 'var(--gold)' : 'var(--gray-line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: done ? '#000' : active ? 'var(--gold)' : 'var(--gray)',
                }}>
                  {done ? '✓' : n}
                </div>
                <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? 'var(--gold)' : done ? 'var(--fg)' : 'var(--gray)' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido del paso */}
      <div className="dash-panel">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 28 }}>
          Paso {step} — {STEPS[step - 1]}
        </h2>

        {stepContent[step - 1]}

        {error && <p style={{ ...errStyle, marginTop: 20 }}>{error}</p>}

        {/* Navegación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--gray-line)' }}>
          <button
            type="button"
            onClick={handleBack}
            style={{ visibility: step > 1 ? 'visible' : 'hidden', background: 'none', border: '1px solid var(--gray-line)', borderRadius: 8, padding: '10px 24px', color: 'var(--gray)', cursor: 'pointer', fontSize: 14 }}
          >
            ← Anterior
          </button>

          {step < 5 ? (
            <button type="button" onClick={handleNext} className="btn-gold" style={{ padding: '10px 28px', fontSize: 14 }}>
              Siguiente →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
                style={{ background: 'none', border: '1px solid var(--gray-line)', borderRadius: 8, padding: '10px 20px', color: 'var(--gray)', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14 }}
              >
                Guardar borrador
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('active')}
                disabled={submitting}
                className="btn-gold"
                style={{ padding: '10px 24px', fontSize: 14, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Publicando…' : 'Publicar propiedad'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
