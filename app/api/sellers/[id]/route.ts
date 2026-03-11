import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string } }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const id = params.id
    const data = await request.json()

    const seller = await prisma.seller.update({
      where: { id },
      data: {
        name: data.name !== undefined ? String(data.name).trim() : undefined,
        lastName: data.lastName !== undefined ? String(data.lastName).trim() : undefined,
        dni: data.dni !== undefined ? (data.dni ? String(data.dni).trim() : null) : undefined,
        email: data.email !== undefined ? (data.email ? String(data.email).trim() : null) : undefined,
        phone: data.phone !== undefined ? (data.phone ? String(data.phone).trim() : null) : undefined,
        address: data.address !== undefined ? (data.address ? String(data.address).trim() : null) : undefined,
        city: data.city !== undefined ? (data.city ? String(data.city).trim() : null) : undefined,
        province: data.province !== undefined ? (data.province ? String(data.province).trim() : null) : undefined,
        sector: data.sector !== undefined ? (data.sector ? String(data.sector).trim() : null) : undefined,
        active: data.active !== undefined ? Boolean(data.active) : undefined,
      },
    })

    return NextResponse.json(seller)
  } catch (error) {
    console.error('Update seller error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Soft delete: active=false
export async function DELETE(_: Request, { params }: Params) {
  try {
    const id = params.id

    const seller = await prisma.seller.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json(seller)
  } catch (error) {
    console.error('Disable seller error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
