import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.productService.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json()

    // ⚠️ IMPORTANTE:
    // El stock NO se edita desde productos. Se administra en /stock (módulo aparte).
    const updated = await prisma.productService.update({
      where: { id: params.id },
      data: {
        name: typeof data.name === 'string' ? data.name : undefined,
        description:
          typeof data.description === 'string' ? data.description : undefined,
        category: typeof data.category === 'string' ? data.category : undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        unit: typeof data.unit === 'string' ? data.unit : undefined,
        active: typeof data.active === 'boolean' ? data.active : undefined,
        // ✅ NO stock acá
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Patch product error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ soft delete
    const updated = await prisma.productService.update({
      where: { id: params.id },
      data: { active: false },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
