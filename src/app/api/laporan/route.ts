import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bulan = searchParams.get('bulan')       // format: "2024-01"
    const tipe = searchParams.get('tipe')          // "INCOME" | "EXPENSE" | null
    const carId = searchParams.get('carId')        // car UUID | null

    const where: Record<string, unknown> = {}

    if (bulan) {
      const [year, month] = bulan.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999) // last day of month
      where.date = { gte: startDate, lte: endDate }
    }

    if (tipe && tipe !== 'ALL') {
      where.type = tipe
    }

    if (carId && carId !== 'ALL') {
      where.carId = carId
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { car: true },
      orderBy: { date: 'asc' },
    })

    // Summary per mobil
    const carSummaryMap: Record<string, {
      carId: string
      plateNumber: string
      brand: string
      totalIncome: number
      totalExpense: number
    }> = {}

    for (const tx of transactions) {
      const key = tx.carId
      if (!carSummaryMap[key]) {
        carSummaryMap[key] = {
          carId: tx.carId,
          plateNumber: tx.car.plateNumber,
          brand: tx.car.brand,
          totalIncome: 0,
          totalExpense: 0,
        }
      }
      if (tx.type === 'INCOME') carSummaryMap[key].totalIncome += tx.amount
      else carSummaryMap[key].totalExpense += tx.amount
    }

    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

    return NextResponse.json({
      transactions,
      carSummary: Object.values(carSummaryMap),
      totals: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        count: transactions.length,
      },
    })
  } catch (error) {
    console.error('Laporan API error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data laporan' }, { status: 500 })
  }
}
