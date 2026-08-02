'use client';

import Link from 'next/link';
import type { V2Property } from '@/lib/property-adapter';
import { getPropertyPath } from '@/lib/property-adapter';

export function PropertyCard({ p, size = 'normal' }: { p: V2Property; size?: 'normal' | 'large' }) {
  return (
    <Link href={getPropertyPath(p)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className={`prop-card ${size === 'large' ? 'large' : ''}`}>
        <div className="img-wrap">
          <img src={p.img} alt={p.title} />
          <div className="img-grain" />
          <div className="tag">{p.type}</div>
          {p.boosted && <div className="boost-tag">★ DESTACADO</div>}
          {p.operation_type === 'alquiler' && <div className="op-tag">ALQUILER</div>}
          <div className="id-tag">{p.id}</div>
        </div>
        <div className="body">
          <div className="type">{p.type} - {p.sqm} m2</div>
          <h3 className="title">{p.title}</h3>
          <div className="loc">{p.loc}</div>
          <div className="price-row">
            <div className="price">
              {p.priceFormatted}
              {p.operation_type === 'alquiler' && <span className="permo">/mes</span>}
            </div>
            <div className="specs">
              {p.bedrooms > 0 && <span>{p.bedrooms} dorm</span>}
              <span>{p.bathrooms} banos</span>
              <span>{p.sqm} m2</span>
            </div>
          </div>
        </div>
        <div className="reveal">Ver propiedad</div>
      </article>
    </Link>
  );
}
