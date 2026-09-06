'use client';

import { createPlan, deletePlan, listPlans, setSalesEnabled, updatePlan } from '@/actions/sales';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

type Plans = Awaited<ReturnType<typeof listPlans>>;
type Plan = Plans[number];

// Preço em reais (o que o admin digita) <-> centavos (o que o banco guarda).
// Sempre Math.round: parseFloat("19.90") * 100 dá 1989.9999... sem arredondar.
function reaisToCents(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function PlanDialog({
  eventId,
  plan,
  onClose,
  onSaved,
}: {
  eventId: string;
  plan: Plan | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [digitalQuota, setDigitalQuota] = useState('0');
  const [printQuota, setPrintQuota] = useState('0');
  const [price, setPrice] = useState('0,00');
  const [extraDigitalPrice, setExtraDigitalPrice] = useState('0,00');
  const [extraPrintPrice, setExtraPrintPrice] = useState('0,00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) return;
    if (plan === 'new') {
      setName('');
      setDigitalQuota('0');
      setPrintQuota('0');
      setPrice('0,00');
      setExtraDigitalPrice('0,00');
      setExtraPrintPrice('0,00');
    } else {
      setName(plan.name);
      setDigitalQuota(String(plan.digitalQuota));
      setPrintQuota(String(plan.printQuota));
      setPrice(centsToReais(plan.priceCents));
      setExtraDigitalPrice(centsToReais(plan.extraDigitalPriceCents));
      setExtraPrintPrice(centsToReais(plan.extraPrintPriceCents));
    }
    setError(null);
  }, [plan]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const input = {
      name,
      digitalQuota: Number.parseInt(digitalQuota, 10) || 0,
      printQuota: Number.parseInt(printQuota, 10) || 0,
      priceCents: reaisToCents(price),
      extraDigitalPriceCents: reaisToCents(extraDigitalPrice),
      extraPrintPriceCents: reaisToCents(extraPrintPrice),
    };
    const result =
      plan === 'new'
        ? await createPlan(eventId, input)
        : await updatePlan((plan as Plan).id, input);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={!!plan} onClose={onClose} title={plan === 'new' ? 'Novo plano' : 'Editar plano'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="plan-name">Nome</Label>
          <Input id="plan-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="plan-digital">Fotos digitais</Label>
            <Input
              id="plan-digital"
              type="number"
              min={0}
              value={digitalQuota}
              onChange={(e) => setDigitalQuota(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plan-print">Fotos impressas</Label>
            <Input
              id="plan-print"
              type="number"
              min={0}
              value={printQuota}
              onChange={(e) => setPrintQuota(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="plan-price">Preço do plano (R$)</Label>
          <Input id="plan-price" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="border-[var(--border)] border-t pt-4">
          <p className="mb-2 text-[var(--muted-foreground)] text-sm">
            Preço avulso — cobrado por unidade quando o carrinho passa da quota deste plano.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="plan-extra-digital">Digital avulsa (R$)</Label>
              <Input
                id="plan-extra-digital"
                value={extraDigitalPrice}
                onChange={(e) => setExtraDigitalPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-extra-print">Impressa avulsa (R$)</Label>
              <Input
                id="plan-extra-print"
                value={extraPrintPrice}
                onChange={(e) => setExtraPrintPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
        {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
        <Button type="submit" variant="accent" disabled={loading} className="w-full">
          {loading ? 'Salvando...' : 'Salvar plano'}
        </Button>
      </form>
    </Dialog>
  );
}

export function EventSalesCard({
  eventId,
  initialSalesEnabled,
}: {
  eventId: string;
  initialSalesEnabled: boolean;
}) {
  const router = useRouter();
  const [salesEnabled, setSalesEnabledState] = useState(initialSalesEnabled);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | 'new' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const loadPlans = useCallback(async () => {
    setPlans(await listPlans(eventId));
  }, [eventId]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  async function toggleSales() {
    setToggling(true);
    try {
      await setSalesEnabled(eventId, !salesEnabled);
      setSalesEnabledState(!salesEnabled);
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleDeletePlan(plan: Plan) {
    if (!window.confirm(`Remover o plano "${plan.name}"?`)) return;
    setBusyId(plan.id);
    await deletePlan(plan.id);
    await loadPlans();
    setBusyId(null);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display uppercase">Venda de fotos</h2>
      </div>

      <Label htmlFor="sales-enabled" className="flex cursor-pointer items-center gap-2">
        <Checkbox
          id="sales-enabled"
          checked={salesEnabled}
          disabled={toggling}
          onCheckedChange={toggleSales}
        />
        Vender fotos neste evento (carrinho, planos, checkout e fila de impressão)
      </Label>

      {salesEnabled && (
        <div className="border-[var(--border)] border-t pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-sm">Planos</p>
            <Button size="sm" variant="outline" onClick={() => setEditingPlan('new')}>
              Novo plano
            </Button>
          </div>
          {!plans ? null : plans.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm">Nenhum plano cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-[var(--muted-foreground)]">
                      {plan.digitalQuota} digitais · {plan.printQuota} impressas · R${' '}
                      {centsToReais(plan.priceCents)}
                    </p>
                    <p className="text-[var(--muted-foreground)] text-xs">
                      Avulsa: R$ {centsToReais(plan.extraDigitalPriceCents)} digital · R${' '}
                      {centsToReais(plan.extraPrintPriceCents)} impressa
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === plan.id}
                      onClick={() => setEditingPlan(plan)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === plan.id}
                      onClick={() => handleDeletePlan(plan)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PlanDialog
        eventId={eventId}
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
        onSaved={() => {
          setEditingPlan(null);
          loadPlans();
        }}
      />
    </Card>
  );
}
