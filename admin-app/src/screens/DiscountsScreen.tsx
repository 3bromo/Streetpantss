import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { createDiscount, deleteDiscount, fetchDiscounts, updateDiscount } from '../lib/api'
import { useNav } from '../App'
import { Discount } from '../lib/types'
import { ConfirmDialog, EmptyState, ErrorState, ListSkeleton, Sheet, Spinner, Toggle, TopBar, useSnack } from '../components/ui'

const EMPTY_FORM = { code: '', type: 'percent' as 'percent' | 'fixed', value: '', expiresAt: '', active: true }

export default function DiscountsScreen() {
  const nav = useNav()
  const { show } = useSnack()
  const [discounts, setDiscounts] = useState<Discount[] | null>(null)
  const [error, setError] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setDiscounts(await fetchDiscounts())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load discounts.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  const openEdit = (d: Discount) => {
    setEditId(d.id)
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : '',
      active: d.active,
    })
    setSheetOpen(true)
  }

  const save = async () => {
    const value = Number(form.value)
    if (!form.code.trim() || !value || value <= 0 || (form.type === 'percent' && value > 100)) {
      show('Enter a valid code and value', 'error')
      return
    }
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
        await updateDiscount(editId, payload)
        show('Discount updated')
      } else {
        await createDiscount(payload)
        show('Discount created')
      }
      setSheetOpen(false)
      await load()
    } catch (e) {
      show(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (d: Discount) => {
    try {
      await updateDiscount(d.id, { active: !d.active })
      show(d.active ? 'Code deactivated' : 'Code activated')
      await load()
    } catch (e) {
      show(e instanceof Error ? e.message : 'Update failed', 'error')
    }
  }

  const doDelete = async () => {
    if (!deleteId) return
    setBusy(true)
    try {
      await deleteDiscount(deleteId)
      show('Discount deleted')
      setDeleteId(null)
      await load()
    } catch (e) {
      show(e instanceof Error ? e.message : 'Delete failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <TopBar title="Discounts" onBack={nav.pop} />
      <div className="space-y-4 px-4 pt-4">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !discounts ? (
          <ListSkeleton rows={4} />
        ) : discounts.length === 0 ? (
          <EmptyState
            title="No discount codes"
            sub="Create codes customers can apply at checkout."
            action={
              <button onClick={openNew} className="btn btn-primary h-11 px-6">
                <Plus size={16} /> Create Code
              </button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {discounts.map((d) => (
              <li key={d.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-mono text-[14px] font-medium text-navy-950">
                      <Tags size={14} className="text-navy-800" /> {d.code}
                    </p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-navy-900/50">
                      {d.type === 'percent' ? `${d.value}% off` : `${d.value} EGP off`} ·{' '}
                      {d.expiresAt ? `expires ${new Date(d.expiresAt).toLocaleDateString('en-GB')}` : 'no expiry'}
                    </p>
                  </div>
                  <Toggle checked={d.active} onChange={() => toggleActive(d)} />
                </div>
                <div className="mt-3 flex gap-2 border-t border-navy-900/10 pt-3">
                  <button onClick={() => openEdit(d)} className="btn btn-ghost h-10 flex-1 !text-[10px]">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(d.id)} className="btn btn-ghost h-10 flex-1 !text-[10px] !text-red-700">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button onClick={openNew} className="btn btn-primary w-full">
          <Plus size={16} /> Create Discount Code
        </button>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editId ? 'Edit code' : 'New code'}>
        <div className="space-y-4">
          <div>
            <span className="label">Code</span>
            <input className="input font-mono uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WELCOME10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">Type</span>
              <select className="input appearance-none font-mono text-[13px]" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}>
                <option value="percent">Percent %</option>
                <option value="fixed">Fixed EGP</option>
              </select>
            </div>
            <div>
              <span className="label">Value</span>
              <input className="input font-mono text-[13px]" type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percent' ? '10' : '100'} />
            </div>
          </div>
          <div>
            <span className="label">Expires (optional)</span>
            <input className="input font-mono text-[13px]" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-ink/75">Active</span>
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
          </div>
          <button onClick={save} disabled={busy} className="btn btn-primary w-full">
            {busy ? <Spinner light /> : editId ? 'Save Changes' : 'Create Code'}
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete code?"
        message="Customers will no longer be able to use this code at checkout."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={doDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}
