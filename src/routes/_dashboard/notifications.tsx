import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/notifications"!</div>
}
