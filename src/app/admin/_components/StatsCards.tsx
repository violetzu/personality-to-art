import type { Stats } from '../_types'

export default function StatsCards({ stats }: { stats: Stats }) {
  const avgImages = stats.avgImagesPerParticipant === null ? '—' : stats.avgImagesPerParticipant.toFixed(2)
  const retryRate = stats.retryParticipantRate === null ? '—' : `${(stats.retryParticipantRate * 100).toFixed(0)}%`

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: '受試者', value: stats.totalParticipants },
        { label: '生成圖片', value: stats.totalPrompts },
        { label: '平均每人生成', value: avgImages },
        { label: '重新生成圖片受試者占比', value: retryRate },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-600">{s.value}</div>
          <div className="text-xs text-gray-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
