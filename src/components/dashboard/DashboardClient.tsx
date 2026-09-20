"use client"

import { useState, useEffect } from "react"
import { Overview } from "@/components/dashboard/Overview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { CarFront, ArrowUpRight, ArrowDownRight, Wallet, Trash2, Plus, Download } from "lucide-react"
import { format } from "date-fns"

export default function DashboardClient() {
  const [cars, setCars] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCarModalOpen, setIsCarModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("ALL")
  
  // Transaction Form State
  const [txCarId, setTxCarId] = useState("")
  const [txType, setTxType] = useState("INCOME")
  const [txCategory, setTxCategory] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txDesc, setTxDesc] = useState("")

  // New Car Form State
  const [newCarPlate, setNewCarPlate] = useState("")
  const [newCarBrand, setNewCarBrand] = useState("")

  const incomeCategories = ["Sewa", "Muatan"]
  const expenseCategories = ["BBM", "Tol", "Servis", "Cuci", "Lainnya"]

  const fetchData = async () => {
    try {
      const [carsRes, txRes] = await Promise.all([
        fetch('/api/cars'),
        fetch('/api/transactions')
      ])
      const carsData = await carsRes.json()
      const txData = await txRes.json()
      
      if (!carsRes.ok || !txRes.ok) {
        throw new Error("API returned an error. Ensure database is connected and migrated.")
      }
      
      setCars(Array.isArray(carsData) ? carsData : [])
      setTransactions(Array.isArray(txData) ? txData : [])
    } catch (error) {
      toast.error("Gagal mengambil data dari server. Pastikan database sudah berjalan.")
      setCars([])
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleInstallClick = async () => {
    // PWA install logic can be complex, just show a toast for demonstration
    toast.info("Gunakan menu browser 'Add to Home Screen' untuk menginstall aplikasi.")
  }

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCarPlate || !newCarBrand) return toast.error("Isi semua field!")
    
    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plateNumber: newCarPlate, brand: newCarBrand })
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Mobil berhasil ditambahkan!")
      setIsCarModalOpen(false)
      setNewCarPlate("")
      setNewCarBrand("")
      fetchData()
    } catch (error) {
      toast.error("Gagal menambahkan mobil")
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txCarId || !txCategory || !txAmount || !txDate) return toast.error("Isi semua field wajib!")
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: txCarId,
          type: txType,
          category: txCategory,
          amount: txAmount.replace(/\D/g, ''), // Strip non-numeric
          date: txDate,
          description: txDesc
        })
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Transaksi berhasil disimpan!")
      setTxAmount("")
      setTxDesc("")
      fetchData()
    } catch (error) {
      toast.error("Gagal menyimpan transaksi")
    }
  }

  const handleDeleteTx = async (id: string) => {
    if (!confirm("Yakin hapus transaksi ini?")) return
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed")
      toast.success("Transaksi dihapus!")
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus transaksi")
    }
  }

  // Format currency
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setTxAmount(value)
  }

  // KPIs calculation
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalIncome - totalExpense
  const activeCarsCount = cars.filter(c => c.status === 'ACTIVE').length

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const matchSearch = t.car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = filterType === 'ALL' || t.type === filterType
    return matchSearch && matchType
  })

  // Chart data calculation
  const getChartData = () => {
    const monthlyData: Record<string, { name: string, Pemasukan: number, Pengeluaran: number }> = {}
    
    transactions.forEach(t => {
      const month = format(new Date(t.date), 'MMM yyyy')
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, Pemasukan: 0, Pengeluaran: 0 }
      }
      if (t.type === 'INCOME') monthlyData[month].Pemasukan += t.amount
      else monthlyData[month].Pengeluaran += t.amount
    })
    
    return Object.values(monthlyData).reverse()
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Memuat data...</div>

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">FleetFinance <span className="text-lg font-normal text-muted-foreground">- Laporan Armada</span></h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleInstallClick} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Install PWA
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatIDR(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatIDR(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatIDR(netProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Armada Aktif</CardTitle>
            <CarFront className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCarsCount}</div>
            <p className="text-xs text-muted-foreground">Dari total {cars.length} mobil terdaftar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Grafik Keuangan Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {transactions.length > 0 ? <Overview data={getChartData()} /> : <p className="text-center text-muted-foreground py-10">Belum ada data transaksi</p>}
          </CardContent>
        </Card>
        
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Input Transaksi Cepat</CardTitle>
              <CardDescription>Catat pemasukan atau pengeluaran armada.</CardDescription>
            </div>
            <Dialog open={isCarModalOpen} onOpenChange={setIsCarModalOpen}>
              <DialogTrigger className={buttonVariants({ variant: "outline", size: "icon" })}>
                  <Plus className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddCar}>
                  <DialogHeader>
                    <DialogTitle>Tambah Mobil Baru</DialogTitle>
                    <DialogDescription>Daftarkan armada baru ke dalam sistem.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="plate">Plat Nomor</Label>
                      <Input id="plate" placeholder="B 1234 ABC" value={newCarPlate} onChange={e => setNewCarPlate(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="brand">Merk / Tipe Mobil</Label>
                      <Input id="brand" placeholder="Toyota Avanza" value={newCarBrand} onChange={e => setNewCarBrand(e.target.value)} required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Simpan Mobil</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid gap-2">
                <Label>Pilih Mobil</Label>
                <Select value={txCarId} onValueChange={setTxCarId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih armada...">
                      {txCarId ? (() => {
                        const selectedCar = cars.find(c => c.id === txCarId);
                        return selectedCar ? `${selectedCar.plateNumber} - ${selectedCar.brand}` : "Pilih armada...";
                      })() : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cars.length === 0 ? (
                      <SelectItem value="empty" disabled>Belum ada mobil terdaftar</SelectItem>
                    ) : (
                      cars.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.plateNumber} - {c.brand}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipe Transaksi</Label>
                  <Select value={txType} onValueChange={setTxType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Pemasukan</SelectItem>
                      <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Kategori</Label>
                  <Select value={txCategory} onValueChange={setTxCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {(txType === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Nominal (Rp)</Label>
                <Input 
                  type="text" 
                  placeholder="100.000" 
                  value={txAmount ? parseInt(txAmount).toLocaleString('id-ID') : ''}
                  onChange={handleAmountChange}
                  required 
                />
              </div>

              <div className="grid gap-2">
                <Label>Tanggal</Label>
                <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required />
              </div>

              <div className="grid gap-2">
                <Label>Catatan (Opsional)</Label>
                <Input placeholder="Keterangan tambahan..." value={txDesc} onChange={e => setTxDesc(e.target.value)} />
              </div>

              <Button type="submit" className="w-full">Simpan Transaksi</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histori Transaksi</CardTitle>
          <CardDescription>Daftar seluruh transaksi yang masuk ke dalam sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input 
              placeholder="Cari Plat Nomor..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="INCOME">Pemasukan</SelectItem>
                <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Plat Nomor</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-medium">{t.car.plateNumber}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className={t.type === 'INCOME' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatIDR(t.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTx(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      Tidak ada data transaksi ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
