import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        car: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Database Error (GET transactions):", error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { carId, type, category, amount, date, description } = body

    if (!carId || !type || !category || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        carId,
        type,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description
      },
      include: {
        car: true
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
