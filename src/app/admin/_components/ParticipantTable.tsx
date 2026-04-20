import type { Participant } from '../_types'

interface ParticipantTableProps {
  participants: Participant[]
  search: string
  onSearch: (q: string) => void
  onViewDetail: (id: number) => void
  onDelete: (id: number) => void
  loading?: boolean
  error?: string
}

export default function ParticipantTable({
  participants, search, onSearch, onViewDetail, onDelete, loading = false, error = '',
}: ParticipantTableProps) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="搜尋姓名或 ID..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      />

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">姓名</th>
                <th className="px-4 py-3 text-left">年齡/性別</th>
                <th className="px-4 py-3 text-left">Big Five (E/A/C/S/O)</th>
                <th className="px-4 py-3 text-left">圖片</th>
                <th className="px-4 py-3 text-left">時間</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">讀取中...</td>
                </tr>
              )}
              {!loading && participants.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{p.id}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.age} / {p.gender}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                    {[p.extraversion, p.agreeableness, p.conscientiousness, p.stability, p.openness]
                      .map(v => v.toFixed(1)).join(' / ')}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p._count.prompts}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.createdAt).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetail(p.id)}
                        className="text-xs px-3 py-1 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors"
                      >
                        詳細
                      </button>
                      <button
                        onClick={() => { if (confirm(`確定刪除「${p.name}」及其所有圖片？`)) onDelete(p.id) }}
                        className="text-xs px-3 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && participants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">暫無資料</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
