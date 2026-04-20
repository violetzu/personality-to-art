'use client'

interface LoginScreenProps {
  password: string
  setPassword: (p: string) => void
  loginError: string
  onSubmit: (e: React.FormEvent) => void
}

export default function LoginScreen({ password, setPassword, loginError, onSubmit }: LoginScreenProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📊</div>
          <h1 className="text-xl font-bold text-gray-800">管理員後台</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="管理員密碼"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              autoFocus
            />
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              登入
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
