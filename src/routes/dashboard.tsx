import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Painel Gerencial CORE/MG</h1>
      <p>Sistema operacionalizado e em funcionamento.</p>
    </div>
  )
}
