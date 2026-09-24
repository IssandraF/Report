"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowUpRight, ArrowDownRight, Wallet, Printer, FileText, Car, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Transaction {
  id: string
  date: string
  type: "INCOME" | "EXPENSE"
  category: string
  amount: number
  description?: string
  car: { plateNumber: string; brand: string }
}

interface CarSummary {
  carId: string
  plateNumber: string
  brand: string
  totalIncome: number
  totalExpense: number
}

interface Totals {
  totalIncome: number
  totalExpense: number
  netProfit: number
  count: number
}

interface LaporanData {
  transactions: Transaction[]
  carSummary: CarSummary[]
  totals: Totals
}

interface CarOption {
  id: string
  plateNumber: string
  brand: string
}

// Generate list of months from 2 years ago until 6 months ahead
const generateMonthOptions = () => {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = -24; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push({
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: id }),
    })
  }
  return options.reverse()
}

const MONTH_OPTIONS = generateMonthOptions()

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value)

export default function LaporanClient() {
  const [cars, setCars] = useState<CarOption[]>([])
  const [data, setData] = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(false)

  const currentMonth = format(new Date(), "yyyy-MM")
  const [filterBulan, setFilterBulan] = useState(currentMonth)
  const [filterTipe, setFilterTipe] = useState("ALL")
  const [filterCarId, setFilterCarId] = useState("ALL")

  const printRef = useRef<HTMLDivElement>(null)

  // Fetch available cars for dropdown
  useEffect(() => {
    fetch("/api/cars")
      .then((r) => r.json())
      .then((d) => setCars(Array.isArray(d) ? d : []))
      .catch(() => setCars([]))
  }, [])

  const fetchLaporan = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterBulan !== "ALL") params.set("bulan", filterBulan)
      if (filterTipe !== "ALL") params.set("tipe", filterTipe)
      if (filterCarId !== "ALL") params.set("carId", filterCarId)

      const res = await fetch(`/api/laporan?${params.toString()}`)
      if (!res.ok) throw new Error("Gagal")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Gagal mengambil data laporan")
    } finally {
      setLoading(false)
    }
  }, [filterBulan, filterTipe, filterCarId])

  useEffect(() => {
    fetchLaporan()
  }, [fetchLaporan])

  const resetFilters = () => {
    setFilterBulan(currentMonth)
    setFilterTipe("ALL")
    setFilterCarId("ALL")
  }

  const handlePrint = () => {
    window.print()
  }

  const getFilterLabel = () => {
    const parts: string[] = []
    const monthOpt = MONTH_OPTIONS.find((m) => m.value === filterBulan)
    if (filterBulan !== "ALL" && monthOpt) parts.push(monthOpt.label)
    else if (filterBulan === "ALL") parts.push("Semua Bulan")
    if (filterTipe === "INCOME") parts.push("Pemasukan")
    else if (filterTipe === "EXPENSE") parts.push("Pengeluaran")
    const car = cars.find((c) => c.id === filterCarId)
    if (car) parts.push(`${car.plateNumber} - ${car.brand}`)
    else if (filterCarId === "ALL") parts.push("Semua Armada")
    return parts.join(" · ")
  }

  const totals = data?.totals
  const transactions = data?.transactions ?? []
  const carSummary = data?.carSummary ?? []

  return (
    <>
      {/* ======== PRINT STYLES ======== */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: fixed;
            inset: 0;
            padding: 24px;
            background: white;
            font-family: 'Inter', sans-serif;
          }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 5px 8px; }
          th { background: #f1f5f9; font-weight: 600; }
          .print-header { margin-bottom: 16px; }
          .print-header h1 { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
          .print-header p { font-size: 12px; color: #555; margin: 0; }
          .print-summary { display: flex; gap: 16px; margin-bottom: 16px; }
          .print-summary-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; flex: 1; }
          .print-summary-box .label { font-size: 10px; color: #64748b; }
          .print-summary-box .value { font-size: 15px; font-weight: 700; margin-top: 2px; }
          .text-green { color: #16a34a; }
          .text-red { color: #dc2626; }
          .text-blue { color: #2563eb; }
          .total-row { background: #f8fafc; font-weight: 700; }
          .badge-income { background: #dcfce7; color: #166534; border-radius: 999px; padding: 1px 7px; font-size: 10px; }
          .badge-expense { background: #fee2e2; color: #991b1b; border-radius: 999px; padding: 1px 7px; font-size: 10px; }
          .section-title { font-size: 13px; font-weight: 700; margin: 16px 0 8px; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
        }
      `}</style>

      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* ====== PAGE HEADER ====== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Laporan Keuangan{" "}
              <span className="text-lg font-normal text-muted-foreground">- Armada</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Filter dan cetak laporan pemasukan & pengeluaran per bulan atau per mobil.</p>
          </div>
          <Button onClick={handlePrint} className="gap-2 bg-slate-800 hover:bg-slate-700 text-white">
            <Printer className="h-4 w-4" />
            Cetak / Simpan PDF
          </Button>
        </div>

        {/* ====== FILTER SECTION ====== */}
        <Card className="no-print">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" /> Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Filter Bulan */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bulan</label>
                <Select value={filterBulan} onValueChange={(v) => setFilterBulan(v ?? currentMonth)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="ALL">Semua Bulan</SelectItem>
                    {MONTH_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Tipe */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipe Transaksi</label>
                <Select value={filterTipe} onValueChange={(v) => setFilterTipe(v ?? "ALL")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="INCOME">Pemasukan</SelectItem>
                    <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Mobil */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Armada / Mobil</label>
                <Select value={filterCarId} onValueChange={(v) => setFilterCarId(v ?? "ALL")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Armada</SelectItem>
                    {cars.map((c) => (
                      <SelectItem key={c.id} value={c.plateNumber}>
                        {c.plateNumber} – {c.brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Filter aktif:</span> {getFilterLabel()}
              </p>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground" onClick={resetFilters}>
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ====== PRINT AREA ====== */}
        <div id="print-area" ref={printRef}>
          {/* Print Header (visible only when printing) */}
          <div className="print-header hidden print:block">
            <h1>Laporan Keuangan Armada</h1>
            <p>FleetFinance · Dicetak pada {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: id })}</p>
            <p>Filter: {getFilterLabel()}</p>
          </div>

          {/* ====== SUMMARY CARDS ====== */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                    <div className="h-8 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Print summary boxes */}
              <div className="print-summary hidden print:flex">
                <div className="print-summary-box">
                  <div className="label">Total Pemasukan</div>
                  <div className="value text-green">{formatIDR(totals?.totalIncome ?? 0)}</div>
                </div>
                <div className="print-summary-box">
                  <div className="label">Total Pengeluaran</div>
                  <div className="value text-red">{formatIDR(totals?.totalExpense ?? 0)}</div>
                </div>
                <div className="print-summary-box">
                  <div className="label">Laba Bersih</div>
                  <div className={`value ${(totals?.netProfit ?? 0) >= 0 ? "text-blue" : "text-red"}`}>
                    {formatIDR(totals?.netProfit ?? 0)}
                  </div>
                </div>
                <div className="print-summary-box">
                  <div className="label">Jumlah Transaksi</div>
                  <div className="value">{totals?.count ?? 0} transaksi</div>
                </div>
              </div>

              {/* Screen summary cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:hidden">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatIDR(totals?.totalIncome ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatIDR(totals?.totalExpense ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(totals?.netProfit ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      {formatIDR(totals?.netProfit ?? 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totals?.count ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">transaksi ditemukan</p>
                  </CardContent>
                </Card>
              </div>

              {/* ====== RINGKASAN PER MOBIL ====== */}
              {carSummary.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Car className="h-4 w-4" /> Ringkasan Per Armada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="print-section-title section-title print:block hidden">Ringkasan Per Armada</div>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plat Nomor</TableHead>
                            <TableHead>Merk / Tipe</TableHead>
                            <TableHead className="text-right text-green-700">Total Pemasukan</TableHead>
                            <TableHead className="text-right text-red-700">Total Pengeluaran</TableHead>
                            <TableHead className="text-right">Laba Bersih</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {carSummary.map((c) => {
                            const net = c.totalIncome - c.totalExpense
                            return (
                              <TableRow key={c.carId}>
                                <TableCell className="font-medium">{c.plateNumber}</TableCell>
                                <TableCell className="text-muted-foreground">{c.brand}</TableCell>
                                <TableCell className="text-right text-green-600 font-medium">{formatIDR(c.totalIncome)}</TableCell>
                                <TableCell className="text-right text-red-600 font-medium">{formatIDR(c.totalExpense)}</TableCell>
                                <TableCell className={`text-right font-bold ${net >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                  {formatIDR(net)}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                          {/* Total row */}
                          <TableRow className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t-2">
                            <TableCell colSpan={2} className="font-bold">TOTAL KESELURUHAN</TableCell>
                            <TableCell className="text-right text-green-600 font-bold">{formatIDR(totals?.totalIncome ?? 0)}</TableCell>
                            <TableCell className="text-right text-red-600 font-bold">{formatIDR(totals?.totalExpense ?? 0)}</TableCell>
                            <TableCell className={`text-right font-bold ${(totals?.netProfit ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                              {formatIDR(totals?.netProfit ?? 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ====== TABEL DETAIL TRANSAKSI ====== */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" /> Detail Transaksi
                    <span className="text-sm font-normal text-muted-foreground ml-1">({transactions.length} data)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="print-section-title section-title print:block hidden">Detail Transaksi</div>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Plat Nomor</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Nominal</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length > 0 ? (
                          <>
                            {transactions.map((t, idx) => (
                              <TableRow key={t.id}>
                                <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {format(new Date(t.date), "dd MMM yyyy", { locale: id })}
                                </TableCell>
                                <TableCell className="font-medium">{t.car?.plateNumber ?? "-"}</TableCell>
                                <TableCell>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.type === "INCOME"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                      }`}
                                  >
                                    {t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                                  </span>
                                </TableCell>
                                <TableCell>{t.category}</TableCell>
                                <TableCell
                                  className={`text-right font-medium whitespace-nowrap ${t.type === "INCOME" ? "text-green-600" : "text-red-600"
                                    }`}
                                >
                                  {t.type === "INCOME" ? "+" : "-"}
                                  {formatIDR(t.amount)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{t.description || "-"}</TableCell>
                              </TableRow>
                            ))}

                            {/* Total Row */}
                            <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-t-2 total-row">
                              <TableCell colSpan={5} className="font-bold text-sm">
                                TOTAL ({transactions.length} transaksi)
                              </TableCell>
                              <TableCell className="text-right font-bold text-sm">
                                <div className="text-green-600">+{formatIDR(totals?.totalIncome ?? 0)}</div>
                                <div className="text-red-600">-{formatIDR(totals?.totalExpense ?? 0)}</div>
                                <div className={`mt-1 pt-1 border-t ${(totals?.netProfit ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                  = {formatIDR(totals?.netProfit ?? 0)}
                                </div>
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                              Tidak ada data transaksi untuk filter yang dipilih.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  )
}
