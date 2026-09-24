import LaporanClient from "@/components/laporan/LaporanClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Laporan Keuangan - FleetFinance",
  description: "Laporan pemasukan dan pengeluaran armada per bulan dan per mobil",
}

export default function LaporanPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <LaporanClient />
    </main>
  )
}
