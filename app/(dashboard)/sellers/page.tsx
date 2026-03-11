'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type Seller = {
  id: string
  name: string
  lastName: string
  dni?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  sector?: string | null
  active: boolean
  createdAt: string
}

const emptyForm = {
  name: '',
  lastName: '',
  dni: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  sector: '',
  active: true,
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Seller | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const fetchSellers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sellers?includeInactive=${includeInactive}`)
      const data = await res.json()
      setSellers(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setOpen(true)
  }

  const openEdit = (s: Seller) => {
    setEditing(s)
    setForm({
      name: s.name ?? '',
      lastName: s.lastName ?? '',
      dni: s.dni ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
      city: s.city ?? '',
      province: s.province ?? '',
      sector: s.sector ?? '',
      active: s.active ?? true,
    })
    setOpen(true)
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        // normalizamos strings vacíos a null para DB
        dni: form.dni.trim() ? form.dni.trim() : null,
        email: form.email.trim() ? form.email.trim() : null,
        phone: form.phone.trim() ? form.phone.trim() : null,
        address: form.address.trim() ? form.address.trim() : null,
        city: form.city.trim() ? form.city.trim() : null,
        province: form.province.trim() ? form.province.trim() : null,
        sector: form.sector.trim() ? form.sector.trim() : null,
        name: form.name.trim(),
        lastName: form.lastName.trim(),
      }

      const url = editing ? `/api/sellers/${editing.id}` : '/api/sellers'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save seller')

      setOpen(false)
      await fetchSellers()
    } catch (e) {
      console.error(e)
      alert('No se pudo guardar el vendedor')
    } finally {
      setSaving(false)
    }
  }

  const onDisable = async (id: string) => {
    if (!confirm('¿Desactivar vendedor?')) return
    const res = await fetch(`/api/sellers/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('No se pudo desactivar')
      return
    }
    await fetchSellers()
  }

  const activeCount = useMemo(
    () => sellers.filter((s) => s.active).length,
    [sellers]
  )

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Vendedores"
        description={`Activos: ${activeCount}`}
      >
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo vendedor
        </Button>
      </PageHeader>

      <div className="p-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Listado</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ver inactivos</span>
              <Switch
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : sellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No hay vendedores
                    </TableCell>
                  </TableRow>
                ) : (
                  sellers.map((s) => (
                    <TableRow key={s.id} className={!s.active ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">
                        {s.name} {s.lastName}
                      </TableCell>
                      <TableCell>{s.sector || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.email || s.phone || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={s.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}>
                          {s.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDisable(s.id)}
                          disabled={!s.active}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar vendedor' : 'Nuevo vendedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Apellido *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Sector</Label>
              <Input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>DNI</Label>
              <Input
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between sm:col-span-2 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Activo</p>
                <p className="text-xs text-muted-foreground">
                  Si lo desactivás, no se puede asignar a nuevos presupuestos
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSave} disabled={saving || !form.name.trim() || !form.lastName.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
