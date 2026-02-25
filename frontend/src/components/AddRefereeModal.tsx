import { useState } from 'react'
import { X } from 'lucide-react'

type AddRefereeModalProps = {
  isOpen: boolean
  initialData?: {
    id?: string
    name?: string | null
    phone?: string
    status?: string
  } | null
  isSaving?: boolean
  onClose: () => void
  onSave: (payload: { id?: string; phone: string; name?: string; mpin?: string }) => void
}

export function AddRefereeModal({
  isOpen,
  initialData,
  isSaving,
  onClose,
  onSave,
}: AddRefereeModalProps) {
  const isEdit = Boolean(initialData?.id)

  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [name, setName] = useState(initialData?.name ?? '')
  const [mpin, setMpin] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    if (!isEdit && !mpin.trim()) return
    onSave({
      id: initialData?.id,
      phone: phone.trim(),
      name: name.trim() || undefined,
      mpin: isEdit ? undefined : mpin.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-[50] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900 m-0">
            {isEdit ? 'Edit Referee' : 'Add Referee'}
          </h2>
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="ref-phone">
              Phone Number
            </label>
            <input
              id="ref-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={Boolean(isEdit)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="ref-name">
              Name (optional)
            </label>
            <input
              id="ref-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="Full name"
            />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="ref-mpin">
                mPIN
              </label>
              <input
                id="ref-mpin"
                type="password"
                maxLength={4}
                pattern="\d{4}"
                value={mpin}
                onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="4-digit PIN"
              />
              <p className="text-xs text-slate-500">
                4-digit secure PIN for referee app login.
              </p>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Save Referee'}
          </button>
        </div>
      </div>
    </div>
  )
}

