import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/devices')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/devices"!</div>
}
