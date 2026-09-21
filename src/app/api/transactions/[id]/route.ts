import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Sesuaikan dengan lokasi import prisma Anda

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Wajib di-await di Next.js versi baru

    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus transaksi" },
      { status: 500 }
    )
  }
}