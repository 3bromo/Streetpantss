import { useEffect, useState, FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { usePageTitle } from '../lib/usePageTitle'
import { getBackend } from '../lib/backend'
import { useUI } from '../context/UIContext'
import { Discount } from '../lib/types'
import { formatPrice } from '../lib/format'
import { AdminPageHead, Card, Spinner, Th, Td } from './ui'

const EMPTY = { code: '', type: 'percent' as 'percent' | 'fixed', value: '', expiresAt: '', active: true }

export default function AdminDiscountsPage() {
  usePageTitle('Admin — Discounts')
  const backend = getBackend()
  const { pushToast } = useUI()
  const [discounts, setDiscounts] = useState<Discount[] | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    backend
      .listDiscounts()
      .then(setDiscounts)
      .catch(() => setDiscounts([]))

  useEffect(() => {
    load()
  }, [backend])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = Number(form.value)
    if (!form.code.trim() || !value || value <= 0) return
    if (form.type === 'percent' && value > 100) return
    setBusy(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value,
        active: form.active,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }
      if (editId) {
        await backend.updateDiscount(editId, payload)
        pushToast({ title: 'Discount updated', sub: payload.code })
      } else {
        await backend.createDiscount(payload)
        pushToast({ title: 'Discount created', sub: payload.code })
      }
      setForm(EMPTY)
      setEditId(null)
      await load()
    } catch (err) {
      pushToast({ title: 'Could not save discount', sub: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (d: Discount) => {
    await backend.updateDiscount(d.id, { active: !d.active })
    pushToast({ title: d.active ? 'Code deactivated' : 'Code activated', sub: d.code })
    await load()
  }

  const remove = async (d: Discount) => {
    if (!window.confirm(`Delete code ${d.code}?`)) return
    await backend.deleteDiscount(d.id)
    pushToast({ title: 'Discount deleted', sub: d.code })
    await load()
  }

  const startEdit = (d: Discount) => {
    setEditId(d.id)
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : '',
      active: d.active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!discounts) return <Spinner />

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHead title="Discounts" sub="Codes customers can apply at checkout." />

      <Card className="mb-6 p-6">
        <p className="mb-5 font-display text-[13px] font-bold uppercase tracking-[0.16em] text-navy-950">
          {editId ? 'Edit Code' : 'Create Code'}
        </p>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block lg:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Code</span>
            <input
              className="input mt-1.5 font-mono uppercase"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="WELCOME10"
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Type</span>
            <select
              className="input mt-1.5 appearance-none font-mono text-[12px] uppercase"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
            >
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed EGP</option>
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Value</span>
            <input
              className="input mt-1.5 font-mono"
              type="number"
              min={1}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder={form.type === 'percent' ? '10' : '100'}
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy-900/60">Expires (optional)</span>
            <input
              className="input mt-1.5 font-mono"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </label>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-5">
            <label className="flex cursor-pointer items-center gap-2.5 pb-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 accent-[#0B2555]"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy-900/70">Active</span>
            </label>
            <button type="submit" disabled={busy} className="btn btn-dark btn-sm disabled:opacity-50">
              <Plus size={14} /> {editId ? 'Save Changes' : 'Create Code'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null)
                  setForm(EMPTY)
                }}
                className="btn btn-outline-dark btn-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-navy-900/10">
              <tr>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th>Expires</Th>
                <Th>Active</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/10">
              {discounts.length === 0 && (
                <tr>
                  <Td className="py-10 text-center" >No discount codes yet.</Td>
                </tr>
              )}
              {discounts.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-soft">
                  <Td className="font-mono text-[12px] font-medium text-navy-950">{d.code}</Td>
                  <Td className="font-mono text-[12px]">
                    {d.type === 'percent' ? `${d.value}%` : formatPrice(d.value)}
                  </Td>
                  <Td className="font-mono text-[12px]">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('en-GB') : 'Never'}
                  </Td>
                  <Td>
                    <button
                      onClick={() => toggleActive(d)}
                      aria-label={d.active ? 'Deactivate' : 'Activate'}
                      className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${d.active ? 'bg-navy-800' : 'bg-navy-900/20'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-300 ${d.active ? 'left-[18px]' : 'left-0.5'}`}
                      />
                    </button>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(d)}
                        aria-label="Edit"
                        className="flex h-8 w-8 items-center justify-center border border-navy-900/15 text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(d)}
                        aria-label="Delete"
                        className="flex h-8 w-8 items-center justify-center border border-navy-900/15 text-navy-900 transition-colors hover:border-red-700 hover:bg-red-700 hover:text-white"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
