import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardGestaoPage
})

function DashboardGestaoPage() {
  return <div>Painel Gerencial CORE/MG</div>
}
