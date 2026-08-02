import Link from 'next/link';
import { fetchSellerDashboard } from '@/lib/seller/fetch-dashboard';
import { LeadRow } from '@/components/v2/dashboard-helpers';

export default async function VendedorLeadsPage() {
  const data = await fetchSellerDashboard();
  const leads = data?.recentLeads ?? [];

  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>CONSULTAS</div>
          <h1>
            Consultas <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>calientes.</span>
          </h1>
        </div>
      </div>
      <div className="dash-panel">
        {leads.length === 0 ? (
          <p style={{ color: 'var(--gray)', padding: 24 }}>Aún no recibiste consultas.</p>
        ) : (
          leads.map((l, i) => <LeadRow key={l.id} l={l} last={i === leads.length - 1} />)
        )}
      </div>
      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--gray)' }}>
        Las consultas vinculadas a una propiedad abren su ficha pública.{' '}
        <Link href="/vendedor/propiedades" style={{ color: 'var(--gold)' }}>
          Ver mis propiedades →
        </Link>
      </p>
    </>
  );
}
