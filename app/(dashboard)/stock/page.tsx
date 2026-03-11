'use client'

import { useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Product = {
  id: string
  name: string
  category: string
  price: number
  unit: string
  active: boolean
  stock: number
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function StockPage() {
  const { data: products = [], isLoading } = useSWR<Product[]>(
    '/api/products',
    fetcher
  )

  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products]
  )

  // buffer local editable
  const [draft, setDraft] = useState<Record<string, number>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const getValue = (p: Product) =>
    draft[p.id] ?? (typeof p.stock === 'number' ? p.stock : 0)

  const saveStock = async (p: Product) => {
    setSavingId(p.id)
    try {
      const nextStock = Math.max(0, Number(draft[p.id] ?? p.stock ?? 0) || 0)
      const currentStock = typeof p.stock === 'number' ? p.stock : 0
      const delta = nextStock - currentStock

      // si no cambió, no pegamos
      if (delta === 0) {
        setSavingId(null)
        return
      }

      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productServiceId: p.id,
          delta,
          reason: 'Ajuste manual desde pantalla Stock',
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to update stock')
      }

      // refrescar lista
      await mutate('/api/products')

      // limpiar el draft para ese producto (opcional)
      setDraft((prev) => {
        const copy = { ...prev }
        delete copy[p.id]
        return copy
      })
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Error al actualizar stock')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Stock"
        description="Gestioná las cantidades disponibles por producto/servicio"
      />

      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Productos activos</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="w-[180px]">Stock</TableHead>
                  <TableHead className="w-[140px]"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Cargando...</TableCell>
                  </TableRow>
                ) : activeProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No hay productos activos</TableCell>
                  </TableRow>
                ) : (
                  activeProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="text-right">
                        ${p.price?.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell>{p.unit}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={getValue(p)}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [p.id]: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => saveStock(p)}
                          disabled={savingId === p.id}
                        >
                          {savingId === p.id ? 'Guardando…' : 'Guardar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
