import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(clients)
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients', message: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const name = typeof data?.name === 'string' ? data.name.trim() : ''
    const company = typeof data?.company === 'string' && data.company.trim() ? data.company.trim() : null
    const email = typeof data?.email === 'string' ? data.email.trim() : ''
    const phone = typeof data?.phone === 'string' ? data.phone.trim() : ''

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields', missing: ['name', 'email', 'phone'] },
        { status: 400 }
      )
    }

    const allowedClientType = new Set(['home', 'permanent_use', 'hall', 'sanitary', 'company'])
    const type = allowedClientType.has(data?.type) ? data.type : null

    const allowedCommercialStatus = new Set([
      'nuevo',
      'contactado',
      'presupuesto_enviado',
      'interesado',
      'sin_respuesta',
      'rechazado',
      'cliente_activo',
      'cliente_frecuente',
    ])
    const status = allowedCommercialStatus.has(data?.status) ? data.status : 'nuevo'

    const client = await prisma.client.create({
      data: {
        name,
        lastName: data?.lastName ? String(data.lastName).trim() : null,
        company,
        dni: data?.dni ? String(data.dni).trim() : null,
        cuit: data?.cuit ? String(data.cuit).trim() : null,

        email,
        phone,

        address:
          typeof data?.address === 'string' && data.address.trim()
            ? data.address.trim()
            : '—',

        latitude: typeof data?.latitude === 'number' ? data.latitude : null,
        longitude: typeof data?.longitude === 'number' ? data.longitude : null,

        type,
        peopleCount: data?.peopleCount ? Number(data.peopleCount) || null : null,
        usageFrequency: data?.usageFrequency ? String(data.usageFrequency) : null,

        status,
        notes: typeof data?.notes === 'string' ? data.notes : '',

        locationUrl: data?.locationUrl ? String(data.locationUrl).trim() : null,
        assignedSeller: data?.assignedSeller ? String(data.assignedSeller).trim() : null,
        lastContactAt: data?.lastContactAt ? new Date(data.lastContactAt) : null,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client', message: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
