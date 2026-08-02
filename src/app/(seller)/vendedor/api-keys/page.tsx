'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getApiKeys, createApiKey, revokeApiKey, deleteApiKey } from '@/lib/supabase/api-key-actions';
import { ApiKey } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Key, Plus, Copy, Trash2, Power, ExternalLink,
  AlertCircle, CheckCircle2, Code2, BookOpen,
} from 'lucide-react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { fetchKeys(); }, []);

  async function fetchKeys() {
    setLoading(true);
    const data = await getApiKeys();
    setKeys(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newKeyName.trim()) { toast.error('Ingresa un nombre para la API key'); return; }
    startTransition(async () => {
      const result = await createApiKey(newKeyName);
      if (!result) {
        toast.error('No se pudo crear la key (límite de 5 keys activas)');
        return;
      }
      setRevealedKey(result.rawKey);
      setNewKeyName('');
      await fetchKeys();
      toast.success('API key creada — ¡cópiala ahora! No volverá a mostrarse.');
    });
  }

  async function handleRevoke(keyId: string) {
    startTransition(async () => {
      const ok = await revokeApiKey(keyId);
      if (ok) { await fetchKeys(); toast.success('Key revocada'); }
      else toast.error('No se pudo revocar la key');
    });
  }

  async function handleDelete(keyId: string) {
    startTransition(async () => {
      const ok = await deleteApiKey(keyId);
      if (ok) { await fetchKeys(); toast.success('Key eliminada'); }
      else toast.error('No se pudo eliminar la key');
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  }

  const activeKeys = keys.filter(k => k.active);
  const revokedKeys = keys.filter(k => !k.active);

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1a2e4a]">API Keys</h1>
          <p className="text-muted-foreground mt-1">Gestiona el acceso programático a tu catálogo de propiedades</p>
        </div>
        <a
          href="/api-docs"
          target="_blank"
          className="flex items-center gap-2 text-sm text-[#B8922A] hover:underline font-medium"
        >
          <BookOpen className="w-4 h-4" />
          Ver documentación
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Key revelada (se muestra solo justo después de crear) */}
      {revealedKey && (
        <div className="rounded-xl border-2 border-[#B8922A] bg-amber-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-semibold">
            <AlertCircle className="w-5 h-5" />
            ¡Guarda esta key ahora! No volverá a mostrarse.
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-amber-200 p-3">
            <code className="flex-1 text-sm font-mono text-[#1a2e4a] break-all">{revealedKey}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(revealedKey)} className="shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="text-amber-700" onClick={() => setRevealedKey(null)}>
            Ya la guardé, cerrar
          </Button>
        </div>
      )}

      {/* Crear nueva key */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="font-semibold text-[#1a2e4a] mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#B8922A]" />
          Crear nueva API key
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="Nombre descriptivo (ej: Portal web, App móvil)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="max-w-sm"
          />
          <Button
            onClick={handleCreate}
            disabled={isPending || activeKeys.length >= 5}
            className="bg-[#B8922A] hover:bg-[#a17f25] text-white gap-2"
          >
            <Key className="w-4 h-4" />
            {activeKeys.length >= 5 ? 'Límite alcanzado (5)' : 'Generar key'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Máximo 5 keys activas · Límite 1 000 requests/día por key</p>
      </div>

      {/* Keys activas */}
      <div className="space-y-3">
        <h2 className="font-semibold text-[#1a2e4a] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Keys activas ({activeKeys.length}/5)
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Cargando...</p>
        ) : activeKeys.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Aún no tienes API keys. Crea una arriba para empezar.
          </div>
        ) : (
          activeKeys.map(k => (
            <div key={k.id} className="rounded-xl border bg-white shadow-sm p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-50">
                <Key className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-[#1a2e4a]">{k.name}</span>
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">Activa</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">{k.key_prefix}...</code>
                  <span>Requests hoy: <strong>{k.requests_today.toLocaleString()}</strong>/1 000</span>
                  <span>Total: <strong>{k.requests_total.toLocaleString()}</strong></span>
                  {k.last_used_at && <span>Último uso: {new Date(k.last_used_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleRevoke(k.id)} disabled={isPending}
                  className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50">
                  <Power className="w-3.5 h-3.5" />
                  Revocar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(k.id)} disabled={isPending}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keys revocadas */}
      {revokedKeys.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-muted-foreground text-sm flex items-center gap-2">
            <Power className="w-4 h-4" /> Keys revocadas
          </h2>
          {revokedKeys.map(k => (
            <div key={k.id} className="rounded-xl border bg-gray-50 p-4 flex items-center gap-4 opacity-60">
              <div className="p-2 rounded-lg bg-gray-100">
                <Key className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 line-through">{k.name}</span>
                  <Badge variant="secondary" className="text-[10px]">Revocada</Badge>
                </div>
                <code className="text-xs font-mono text-gray-400">{k.key_prefix}...</code>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(k.id)} disabled={isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Ejemplo de uso */}
      <div className="rounded-xl border bg-[#1a2e4a] p-6 text-white space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#B8922A]" />
          Ejemplo de uso
        </h2>
        <pre className="text-sm font-mono bg-black/30 rounded-lg p-4 overflow-x-auto text-green-300">
{`curl -H "Authorization: Bearer impy_xxxxxxxx" \
  "${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inmobiliariapy.com'}/api/v1/properties?ciudad=Asunción&limit=10"`}
        </pre>
        <p className="text-xs text-blue-200">
          Respuesta: JSON con <code className="bg-white/10 px-1 rounded">data[]</code> y <code className="bg-white/10 px-1 rounded">meta</code> de paginación.
          Consulta la <a href="/api-docs" target="_blank" className="underline text-[#B8922A]">documentación completa →</a>
        </p>
      </div>
    </div>
  );
}
