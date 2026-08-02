'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Lead } from '@/lib/supabase/types';

/**
 * Hook para escuchar la llegada de nuevos leads en tiempo real.
 * Idealmente se debe activar solo cuando el usuario es un vendedor y está en el dashboard.
 */
export function useLeadRealtime() {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  useEffect(() => {
    // Usamos el cliente de supabase (suponiendo que hay un helper para el cliente de cliente)
    // Si no existe un helper global, se inicializa aquí o se pasa por props.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          const newLead = payload.new as Lead;

          // Notificación visual inmediata
          toast.success('¡Nuevo Lead Recibido!', {
            description: `${newLead.name} está interesado en una propiedad. Score: ${newLead.score}`,
            action: {
              label: 'Ver ahora',
              onClick: () => {
                window.location.href = '/vendedor/leads';
              },
            },
          });

          // Actualizar contador de no leídos (optimista)
          setUnreadCount(prev => (prev === null ? 1 : prev + 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { unreadCount, setUnreadCount };
}
