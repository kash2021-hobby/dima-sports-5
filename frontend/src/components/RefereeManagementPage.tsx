import { Plus, Search } from 'lucide-react'

export type RefereeListItem = {
  id: string
  name?: string | null
  phone: string
  status: string
  createdAt?: string | null
}

type RefereeManagementPageProps = {
  referees: RefereeListItem[]
  isLoading?: boolean
  onRefresh: () => void
  onAddReferee: () => void
  onEditReferee: (ref: RefereeListItem) => void
}

export function RefereeManagementPage({
  referees,
  isLoading,
  onRefresh,
  onAddReferee,
  onEditReferee,
}: RefereeManagementPageProps) {
  return (
    <div className="min-h-0 flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Referee Management</h1>
          <p className="text-sm text-slate-500 m-0">
            Manage referees who can be assigned to tournament fixtures.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onAddReferee}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={18} />
            <span>+ Add Referee</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search by name or phone…"
              className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              disabled
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">
                  Name
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  Phone
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Loading referees…
                  </td>
                </tr>
              ) : referees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    No referees found. Click &quot;Add Referee&quot; to create one.
                  </td>
                </tr>
              ) : (
                referees.map((ref) => {
                  const status = (ref.status || '').toUpperCase()
                  const isActive = status === 'ACTIVE'
                  return (
                    <tr key={ref.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-900">
                        {ref.name || 'Unnamed referee'}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{ref.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                          onClick={() => onEditReferee(ref)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

