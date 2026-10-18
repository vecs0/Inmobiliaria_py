import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchSellerLeads } from '@/lib/seller/fetch-dashboard';
import { LeadRow } from '@/components/v2/dashboard-helpers';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function VendedorLeadsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const sp = await props.searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page ?? '1')) || 1);
  const data = await fetchSellerLeads(page, PAGE_SIZE);
  if (!data) redirect('/auth/login?redirect=/vendedor/leads');

  const { leads, total, totalPages } = data;
  const prevHref = page > 2 ? `/vendedor/leads?page=${page - 1}` : '/vendedor/leads';
  const nextHref = `/vendedor/leads?page=${page + 1}`;

  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>CONSULTAS · {total}</div>
          <h1>
            Todas tus <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>consultas.</span>
          </h1>
        </div>
      </div>
      <div className="dash-panel">
        {leads.length === 0 ? (
          <p style={{ color: 'var(--gray)', padding: 24 }}>
            {total === 0 ? 'Aún no recibiste consultas.' : 'No hay consultas en esta página.'}
          </p>
        ) : (
          leads.map((l, i) => <LeadRow key={l.id} l={l} last={i === leads.length - 1} />)
        )}
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Paginación de consultas" style={{ marginTop: 16 }}>
          {page > 1 ? (
            <Link href={prevHref} className="chip">← Anterior</Link>
          ) : (
            <span className="chip" aria-disabled="true" style={{ opacity: 0.4 }}>← Anterior</span>
          )}
          <span>
            página {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={nextHref} className="chip">Siguiente →</Link>
          ) : (
            <span className="chip" aria-disabled="true" style={{ opacity: 0.4 }}>Siguiente →</span>
          )}
        </nav>
      )}

      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--gray)' }}>
        Las consultas vinculadas a una propiedad abren su ficha pública.{' '}
        <Link href="/vendedor/propiedades" style={{ color: 'var(--gold)' }}>
          Ver mis propiedades →
        </Link>
      </p>
    </>
  );
}
