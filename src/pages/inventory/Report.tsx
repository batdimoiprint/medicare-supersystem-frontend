import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Coins, Calendar } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import supabase from '@/utils/supabase'
import ChartRadialSimple from '@/components/ui/chart-radial-simple'
import { DatePicker } from '@/components/ui/date-picker'

const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'usage' | 'cost'>('usage')
  const [dateRange, setDateRange] = useState('Last 6 Months')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  const [usageData, setUsageData] = useState<{ label: string; value: number }[]>([])
  const CATEGORY_COLORS: Record<string, string> = { Consumables: '#58B3FF', Medicines: '#77DD77', Equipment: '#FFD166' }
  // default colors; will override based on categoryFilter or usageData length
  const usageColors = ['#58B3FF', '#77DD77', '#FFD166']
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories')

  // Horizontal bar chart component for usage trends
  function HorizontalBarChart({ data, colors = ['#00a8a8'] }: { data: { label: string; value: number }[]; colors?: string[] }) {
    const total = data.reduce((s, d) => s + d.value, 0)
    const max = Math.max(...data.map(d => d.value)) || 1

    return (
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Total Usage</div>
            <div className="text-2xl font-semibold">{total.toLocaleString()}</div>
          </div>
        </div>
        <div className="space-y-4">
          {data.map((d, i) => (
            <div key={d.label} className="flex items-center gap-4">
              <div className="w-36 text-sm text-slate-600">{d.label}</div>
              <div className="flex-1">
                <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div style={{ width: `${(d.value / max) * 100}%`, background: colors[i % colors.length] }} className="h-4 rounded-full" />
                </div>
              </div>
              <div className="w-28 text-right text-sm text-muted-foreground">{d.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Cost breakdown sample data (for Cost Analysis)
  const [costBreakdownData, setCostBreakdownData] = useState<{ label: string; value: number; color: string }[]>([])

  const totalCost = costBreakdownData.reduce((s, c) => s + c.value, 0)
  const [inventoryValue, setInventoryValue] = useState<number>(0)
  const [monthlyUsageCost, setMonthlyUsageCost] = useState<number>(0)
  type ConsumableRow = { consumable_name: string; quantity: number | string; unit_cost: number | string }
  type MedicineRow = { medicine_name: string; quantity: number | string; unit_cost: number | string }
  type EquipmentRow = { equipment_name: string; quantity: number | string; unit_cost: number | string }
  type StockOutRow = { item_name: string; quantity: number | string; category?: string; created_at?: string }

  // PieChart removed - using ChartRadialSimple component instead

  function formatShortDate(date: Date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function getRangeFor(rangeKey: string) {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    if (rangeKey === 'Last 6 Months') {
      end = new Date()
      start = new Date(end.getFullYear(), end.getMonth() - 5, 1)
    } else if (rangeKey === 'Last Month') {
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      start = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1)
      end = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)
    } else if (rangeKey === 'Year to Date') {
      start = new Date(today.getFullYear(), 0, 1)
      end = today
    } else {
      start = new Date()
      end = new Date()
    }

    return { start, end, formatted: `${formatShortDate(start)} - ${formatShortDate(end)}` }
  }

  // Initialize start/end dates when dateRange changes (unless Custom)
  React.useEffect(() => {
    if (dateRange !== 'Custom') {
      const { start, end } = getRangeFor(dateRange)
      setStartDate(start)
      setEndDate(end)
    }
  }, [dateRange])

  // Calculate active range for display/filtering
  let activeRange = getRangeFor(dateRange)
  if (dateRange === 'Custom') {
    if (startDate && endDate) {
      activeRange = { start: startDate, end: endDate, formatted: `${formatShortDate(startDate)} - ${formatShortDate(endDate)}` }
    }
  }

  useEffect(() => {
    async function loadReportData() {
      try {
        // Fetch inventory tables for unit_cost and quantities
        const [consRes, medRes, equipRes] = await Promise.all([
          supabase.schema('inventory').from('consumables_tbl').select('consumable_name, quantity, unit_cost'),
          supabase.schema('inventory').from('medicine_tbl').select('medicine_name, quantity, unit_cost'),
          supabase.schema('inventory').from('equipment_tbl').select('equipment_name, quantity, unit_cost'),
        ])

        const cons = (consRes.data || []) as ConsumableRow[]
        const meds = (medRes.data || []) as MedicineRow[]
        const equips = (equipRes.data || []) as EquipmentRow[]

        // Calculate inventory total value
        let invTotal = 0
        cons.forEach((c: any) => { invTotal += (parseFloat(c.quantity) || 0) * (parseFloat(c.unit_cost) || 0) })
        meds.forEach((m: any) => { invTotal += (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0) })
        equips.forEach((e: any) => { invTotal += (parseFloat(e.quantity) || 0) * (parseFloat(e.unit_cost) || 0) })
        setInventoryValue(invTotal)

        // Build map of item_name -> unit_cost per category
        const consMap: Record<string, number> = {}
        const medMap: Record<string, number> = {}
        const equipMap: Record<string, number> = {}
        cons.forEach((c: any) => { consMap[c.consumable_name] = parseFloat(c.unit_cost) || 0 })
        meds.forEach((m: any) => { medMap[m.medicine_name] = parseFloat(m.unit_cost) || 0 })
        equips.forEach((e: any) => { equipMap[e.equipment_name] = parseFloat(e.unit_cost) || 0 })

        // Fetch stock_out within active range
        const startISO = activeRange.start.toISOString()
        const endISO = activeRange.end.toISOString()
        const { data: stockOutData } = await supabase.schema('inventory').from('stock_out').select('item_name, quantity, category, created_at').gte('created_at', startISO).lte('created_at', endISO)
        const stockOut = (stockOutData || []) as StockOutRow[]

        const categoryQty: Record<string, number> = { Consumables: 0, Medicines: 0, Equipment: 0 }
        const categoryCost: Record<string, number> = { Consumables: 0, Medicines: 0, Equipment: 0 }

        // If user selected a specific category, group by item_name within that category
        if (categoryFilter !== 'All Categories') {
          // filter stockOut to this category
          const selectedCatRaw = categoryFilter.toLowerCase()
          const filtered = stockOut.filter(s => (s.category || '').toString().toLowerCase().includes(selectedCatRaw))
          // group by item_name
          const itemQtyMap: Record<string, number> = {}
          const itemCostMap: Record<string, number> = {}
          filtered.forEach((s: StockOutRow) => {
            const item = s.item_name || 'Unknown'
            const qty = parseFloat((s.quantity as any) || '0') || 0
            itemQtyMap[item] = (itemQtyMap[item] || 0) + qty
            // determine unit cost from inventory maps
            let unit = 0
            if (categoryFilter === 'Consumables') unit = consMap[item] || 0
            else if (categoryFilter === 'Medicines') unit = medMap[item] || 0
            else if (categoryFilter === 'Equipment') unit = equipMap[item] || 0
            itemCostMap[item] = (itemCostMap[item] || 0) + (unit * qty)
          })

          // convert to arrays
          const items = Object.keys(itemQtyMap).map(name => ({ name, qty: itemQtyMap[name], cost: Math.round(itemCostMap[name] || 0) }))
          items.sort((a, b) => b.qty - a.qty)
          const topItems = items.slice(0, 10)
          setUsageData(topItems.map(i => ({ label: i.name, value: i.qty })))
          setCostBreakdownData(topItems.map((i, idx) => ({ label: i.name, value: i.cost, color: CATEGORY_COLORS[categoryFilter] || usageColors[idx % usageColors.length] })))
          setMonthlyUsageCost(items.reduce((s, x) => s + x.cost, 0))
        } else {
          stockOut.forEach((s: StockOutRow) => {
            const qty = parseFloat((s.quantity as any) || '0') || 0
            const catRaw = (s.category || '').toString().toLowerCase()
            let cat: 'Consumables' | 'Medicines' | 'Equipment' = 'Consumables'
            if (catRaw.includes('medi')) cat = 'Medicines'
            else if (catRaw.includes('equip')) cat = 'Equipment'

            categoryQty[cat] += qty
            // get unit_cost
            let unit = 0
            if (cat === 'Consumables') unit = consMap[(s.item_name as string)] || 0
            else if (cat === 'Medicines') unit = medMap[(s.item_name as string)] || 0
            else if (cat === 'Equipment') unit = equipMap[(s.item_name as string)] || 0
            categoryCost[cat] += unit * qty
          })

          setUsageData([
            { label: 'Consumables', value: categoryQty.Consumables },
            { label: 'Medicines', value: categoryQty.Medicines },
            { label: 'Equipment', value: categoryQty.Equipment },
          ])

          setCostBreakdownData([
            { label: 'Supplies', value: Math.round(categoryCost.Consumables), color: CATEGORY_COLORS.Consumables },
            { label: 'Medicine', value: Math.round(categoryCost.Medicines), color: CATEGORY_COLORS.Medicines },
            { label: 'Equipment', value: Math.round(categoryCost.Equipment), color: CATEGORY_COLORS.Equipment },
          ])

          setMonthlyUsageCost(Math.round(categoryCost.Consumables + categoryCost.Medicines + categoryCost.Equipment))
        }

        // Removed batch breakdown aggregation per request
      } catch (err) {
        console.error('Failed to load report data', err)
      }
    }
    loadReportData()
  }, [dateRange, startDate, endDate, categoryFilter])

  return (
    <div className="px-6 md:px-12">
      <div className="w-full max-w-screen-2xl mx-auto space-y-6">
        <Card className="w-full py-3 -mt-2">
          <CardHeader className="px-6 py-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-0 flex items-center gap-3">Reports</CardTitle>
                <p className="text-muted-foreground">Generate inventory reports and exports</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="w-full max-w-screen-2xl mx-auto px-6">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Category</div>
                  <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                    <SelectTrigger size="sm" className="rounded-3xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Categories">All Categories</SelectItem>
                      <SelectItem value="Consumables">Consumables</SelectItem>
                      <SelectItem value="Medicines">Medicines</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-slate-500 mb-1">Custom Date Range</div>
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      value={startDate}
                      onChange={(d) => { setStartDate(d); setDateRange('Custom') }}
                      placeholder="Start Date"
                    />
                    <DatePicker
                      value={endDate}
                      onChange={(d) => { setEndDate(d); setDateRange('Custom') }}
                      placeholder="End Date"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full max-w-screen-2xl mx-auto px-6 -mt-2">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">Total Inventory Value</div>
                    <div className="ml-auto text-xs text-slate-500 py-1 px-2 rounded bg-slate-100 dark:bg-slate-900">₱</div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(inventoryValue)}</div>
                </div>
                <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">Monthly Usage</div>
                    <div className="ml-auto text-xs text-slate-500 py-1 px-2 rounded bg-slate-100 dark:bg-slate-900">₱</div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(monthlyUsageCost)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full max-w-screen-2xl mx-auto px-6">
          <div className="w-full mt-4 flex rounded-[20px] bg-slate-50 dark:bg-[#0f2b2b] items-center h-[44px] shadow-sm">
            <button onClick={() => setActiveTab('usage')}
              className={cn(
                'w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2',
                activeTab === 'usage' ? 'bg-[#00a8a8] text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-[#0ba3a3] hover:text-white'
              )}
            >
              Usage Trends
            </button>
            <button onClick={() => setActiveTab('cost')}
              className={cn(
                'w-1/2 h-full rounded-[18px] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2',
                activeTab === 'cost' ? 'bg-[#00a8a8] text-white shadow' : 'text-slate-700 dark:text-slate-200 hover:bg-[#0ba3a3] hover:text-white'
              )}
            >
              Cost Analysis
            </button>
          </div>
        </div>

        <div className="w-full max-w-screen-2xl mx-auto px-6">
          {activeTab === 'usage' ? (
            <Card>
              <CardHeader className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    <BarChart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Usage Trends</div>
                    <div className="text-xs text-slate-400 dark:text-slate-300 mt-1">Monthly material usage by category</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-card border">
                    <h3 className="text-lg font-semibold mb-3">Monthly Usage</h3>
                    <div className="w-full">
                      {/* Compute chart colors: If All Categories & showing the three categories, show each category's color; else use the selected category's color for all items */}
                      <HorizontalBarChart data={usageData} colors={
                        categoryFilter === 'All Categories' && usageData.length === 3
                          ? [CATEGORY_COLORS.Consumables, CATEGORY_COLORS.Medicines, CATEGORY_COLORS.Equipment]
                          : usageData.map(() => CATEGORY_COLORS[categoryFilter] ?? usageColors[0])
                      } />
                      <div className="mt-4 flex gap-4 items-center justify-center">
                        {usageData.map((u, i) => (
                          <div key={u.label} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: usageData.length === 3 && categoryFilter === 'All Categories' ? usageColors[i] : (CATEGORY_COLORS[categoryFilter] ?? usageColors[i % usageColors.length]) }} />
                            <div className="text-sm text-muted-foreground">{u.label} — {u.value.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cost Analysis</div>
                    <div className="text-xs text-slate-400 dark:text-slate-300 mt-1">Monthly spending overview and cost breakdown</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* KPIs removed from inside the Cost Analysis container to avoid duplication */}
                {/* Cost Distribution + Breakdown (only visible in cost tab) */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg bg-card border">
                    <h3 className="text-lg font-semibold mb-4 text-primary">Cost Distribution</h3>
                    <div className="flex items-center justify-center">
                      <ChartRadialSimple data={costBreakdownData.map(c => ({ value: c.value, color: c.color }))} size={240} thickness={18} gap={10} />
                    </div>
                  </div>
                  <div className="p-6 rounded-lg bg-card border">
                    <h3 className="text-lg font-semibold mb-4 text-primary">Cost Breakdown</h3>
                    <div className="space-y-3">
                      {costBreakdownData.map((c) => (
                        <div key={c.label} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                            <div>
                              <div className="text-sm font-semibold">{c.label}</div>
                              <div className="text-xs text-muted-foreground">{Math.round((c.value / totalCost) * 100)}%</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold">{formatCurrency(c.value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Top Spending Batches removed per request */}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportPage
