'use client'

// app/(dashboard)/budgets/[id]/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArrowLeft,
  Download,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Wrench,
} from 'lucide-react'
import useSWR, { mutate } from 'swr'
import type { Budget, BudgetStatus } from '@/lib/types'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
} from '@/lib/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

async function fetcher(url: string) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Response is not JSON')
  }

  return res.json()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

type StockProblem = {
  productServiceId: string
  name: string
  requested: number
  available: number
  missing: number
}

export default function BudgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string | undefined

  const isValidId = typeof id === 'string' && id !== 'pdf' && id.length > 10

  const { data: budget, isLoading, error } = useSWR<Budget>(
    isValidId ? `/api/budgets/${id}` : null,
    fetcher
  )

  const [isUpdating, setIsUpdating] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockProblems, setStockProblems] = useState<StockProblem[]>([])

  const hasStockProblems = stockProblems.length > 0

  const postStatus = async (newStatus: BudgetStatus, confirmStock = false) => {
    if (!isValidId) return { ok: false, status: 0 as number, json: null as any }

    const res = await fetch(`/api/budgets/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, confirmStock }),
    })

    const json = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, json }
  }

  const handleStatusChange = async (newStatus: BudgetStatus) => {
    if (!isValidId) return

    setIsUpdating(true)
    try {
      const result = await postStatus(newStatus, false)

      if (newStatus === 'approved' && result.status === 409) {
        const problems: StockProblem[] = Array.isArray(result.json?.problems)
          ? result.json.problems
          : []

        setStockProblems(problems)
        setStockModalOpen(true)
        return
      }

      if (!result.ok) {
        console.error('Error updating status:', result.json)
        return
      }

      mutate(`/api/budgets/${id}`)
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const approveAnyway = async () => {
    if (!isValidId) return

    setIsUpdating(true)
    try {
      const result = await postStatus('approved', true)
      if (!result.ok) {
        console.error('Error approving anyway:', result.json)
        return
      }

      setStockModalOpen(false)
      setStockProblems([])
      mutate(`/api/budgets/${id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleGeneratePDF = () => {
    if (!isValidId) return

    setIsGeneratingPDF(true)
    window.open(`/api/budgets/${id}/pdf`, '_blank')

    setTimeout(() => {
      setIsGeneratingPDF(false)
    }, 800)
  }

  if (!isValidId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Presupuesto inválido</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando presupuesto...</p>
      </div>
    )
  }

  if (error || !budget) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Presupuesto no encontrado</p>
        <Link href="/budgets">
          <Button variant="outline">Volver a presupuestos</Button>
        </Link>
      </div>
    )
  }

  const discount = Number(budget.discount ?? 0)
  const tax = Number(budget.tax ?? 0)
  const shippingCost =
    budget.shippingCost === null || budget.shippingCost === undefined
      ? null
      : Number(budget.shippingCost)

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <PageHeader
          title={`Presupuesto #${budget.id.slice(0, 6).toUpperCase()}`}
          description={`Creado el ${formatDate(budget.createdAt)}`}
        >
          <Link href="/budgets">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
                <Download className="mr-2 h-4 w-4" />
                {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generar y descargar PDF del presupuesto</TooltipContent>
          </Tooltip>
        </PageHeader>

        <div className="p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* MAIN */}
            <div className="space-y-6 lg:col-span-2">
              {/* Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  {budget.client ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-lg font-semibold">{budget.client.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {budget.client.company}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {budget.client.email}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {budget.client.phone}
                        </div>
                        {budget.client.address && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {budget.client.address}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Cliente no encontrado</p>
                  )}
                </CardContent>
              </Card>

              {/* Datos comerciales / operativos */}
              <Card>
                <CardHeader>
                  <CardTitle>Asignaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Vendedor</span>
                      </div>
                      <p className="font-medium">
                        {budget.seller
                          ? `${budget.seller.name} ${budget.seller.lastName}`
                          : 'Sin asignar'}
                      </p>
                    </div>

                    <div className="rounded-md border p-3">
                      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        <span>Responsable de instalación</span>
                      </div>
                      <p className="font-medium">
                        {budget.installationResponsible === 'company'
                          ? 'A cargo de Ecoservicios'
                          : budget.installationResponsible === 'client'
                            ? 'A cargo del cliente'
                            : budget.installationResponsible === 'other'
                              ? 'Otro'
                              : 'Sin definir'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="mb-1 text-muted-foreground">Instalador asignado</p>

                    <p className="font-medium">
                      {budget.installer
                        ? `${budget.installer.name} ${budget.installer.lastName}`
                        : 'Sin asignar'}
                    </p>

                    {budget.installer?.phone && (
                      <p className="mt-1 text-muted-foreground">
                        Tel: {budget.installer.phone}
                      </p>
                    )}

                    {budget.installer?.city && (
                      <p className="text-muted-foreground">
                        Ciudad: {budget.installer.city}
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="mb-1 text-muted-foreground">Referencia del instalador</p>
                    <p className="whitespace-pre-wrap">
                      {budget.installerReference?.trim()
                        ? budget.installerReference
                        : '—'}
                    </p>
                  </div>

                  {budget.siteDetails?.trim() && (
                    <div className="rounded-md border p-3">
                      <p className="mb-1 text-muted-foreground">Datos del lugar / uso</p>
                      <p className="whitespace-pre-wrap">{budget.siteDetails}</p>
                    </div>
                  )}

                  {budget.technicalDetails?.trim() && (
                    <div className="rounded-md border p-3">
                      <p className="mb-1 text-muted-foreground">Observaciones técnicas</p>
                      <p className="whitespace-pre-wrap">{budget.technicalDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto/Servicio</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budget.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium">
                              {item.productService?.name ?? 'Producto no encontrado'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[item.productService?.category || 'other']}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total
                        </TableCell>
                        <TableCell className="text-right text-lg font-bold text-primary">
                          {formatCurrency(budget.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* SIDEBAR */}
            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Estado del Presupuesto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge className={STATUS_COLORS[budget.status]}>
                    {STATUS_LABELS[budget.status]}
                  </Badge>

                  <Select
                    value={budget.status}
                    onValueChange={(v) => handleStatusChange(v as BudgetStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(budget.subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}

                  {tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  )}

                  {(shippingCost ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envío</span>
                      <span>{formatCurrency(shippingCost ?? 0)}</span>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg text-primary">
                    <span>Total</span>
                    <span>{formatCurrency(budget.total)}</span>
                  </div>

                  {budget.notes?.trim() && (
                    <div className="pt-4">
                      <p className="text-xs text-muted-foreground">Nota</p>
                      <p className="whitespace-pre-wrap">{budget.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hay productos sin stock</DialogTitle>
              <DialogDescription>
                Podés ir a Stock para ajustar cantidades, o aprobar igual y luego comprar el
                material.
              </DialogDescription>
            </DialogHeader>

            {hasStockProblems ? (
              <div className="mt-2 rounded-md border p-3 text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  {stockProblems.map((p) => (
                    <li key={p.productServiceId}>
                      <span className="font-medium">{p.name}</span> — faltan{' '}
                      <span className="font-semibold">{p.missing}</span>{' '}
                      <span className="text-muted-foreground">
                        (pedido {p.requested} / stock {p.available})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pudimos obtener el detalle del faltante.
              </p>
            )}

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStockModalOpen(false)
                  router.push('/stock')
                }}
              >
                Ir a Stock
              </Button>

              <Button type="button" onClick={approveAnyway} disabled={isUpdating}>
                {isUpdating ? 'Aprobando…' : 'Aprobar igual'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}