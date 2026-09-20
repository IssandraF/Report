import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cars = await prisma.car.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(cars)
  } catch (error) {
    console.error("Database Error (GET cars):", error)
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { plateNumber, brand } = body

    if (!plateNumber || !brand) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const car = await prisma.car.create({
      data: {
        plateNumber: plateNumber.toUpperCase(),
        brand
      }
    })

    return NextResponse.json(car, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
  }
}
