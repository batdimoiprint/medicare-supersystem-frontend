import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Coins, DownloadCloud } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import supabase from '@/utils/supabase'
import ChartRadialSimple from '@/components/ui/chart-radial-simple'
import { DatePicker } from '@/components/ui/date-picker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'usage' | 'cost'>('usage')
  const [dateRange, setDateRange] = useState('Last 6 Months')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [isExporting, setIsExporting] = useState(false)

  const [usageData, setUsageData] = useState<{ label: string; value: number }[]>([])
  const CATEGORY_COLORS: Record<string, string> = { Consumables: '#58B3FF', Medicines: '#77DD77', Equipment: '#FFD166' }
  // default colors; will override based on categoryFilter or usageData length
  const usageColors = ['#58B3FF', '#77DD77', '#FFD166']
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories')

  // Export report to PDF using jsPDF directly (without html2canvas)
  function exportReportToPDF() {
    if (isExporting) return
    setIsExporting(true)
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Header
      doc.setFillColor(7, 42, 45)
      doc.rect(0, 0, pageWidth, 32, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Inventory Report', 14, 15)
      
      // Subtitle with active tab
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const tabLabel = activeTab === 'usage' ? 'Usage Trends' : 'Cost Analysis'
      doc.text(`${tabLabel} | ${categoryFilter}`, 14, 23)
      
      // Company name and date on right
      doc.setFontSize(9)
      doc.setTextColor(180, 220, 220)
      doc.setFont('helvetica', 'bold')
      doc.text('MEDICARE DENTAL CLINIC', pageWidth - 14, 12, { align: 'right' })
      
      doc.setFont('helvetica', 'normal')
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`Generated: ${today}`, pageWidth - 14, 19, { align: 'right' })
      
      const timeNow = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(timeNow, pageWidth - 14, 25, { align: 'right' })
      
      let yPos = 45
      
      // Summary Cards
      doc.setFillColor(240, 253, 250)
      doc.roundedRect(14, yPos, 120, 30, 3, 3, 'F')
      doc.roundedRect(144, yPos, 120, 30, 3, 3, 'F')
      
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(9)
      doc.text('Total Inventory Value', 20, yPos + 10)
      doc.text('Monthly Usage', 150, yPos + 10)
      
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      // Format currency for PDF (using PHP instead of ₱)
      const formatPdfCurrency = (value: number) => `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      doc.text(formatPdfCurrency(inventoryValue), 20, yPos + 22)
      doc.text(formatPdfCurrency(monthlyUsageCost), 150, yPos + 22)
      
      yPos += 40
      
      if (activeTab === 'usage') {
        // Usage Trends Table
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(0, 168, 168)
        doc.text('Usage Trends - Monthly Material Usage', 14, yPos)
        yPos += 8
        
        const totalUsage = usageData.reduce((s, d) => s + d.value, 0)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(`Total Usage: ${totalUsage.toLocaleString()} units`, 14, yPos)
        yPos += 8
        
        // Usage data table
        const usageTableData = usageData.map((item) => [
          item.label,
          item.value.toLocaleString(),
          `${totalUsage > 0 ? Math.round((item.value / totalUsage) * 100) : 0}%`
        ])
        
        autoTable(doc, {
          head: [['Category/Item', 'Quantity Used', 'Percentage']],
          body: usageTableData,
          startY: yPos,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 4,
            textColor: [50, 50, 50],
          },
          headStyles: {
            fillColor: [0, 168, 168],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [248, 252, 252],
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' },
            2: { cellWidth: 50, halign: 'center' },
          },
          margin: { left: 14, right: 14 },
        })
        
      } else {
        // Cost Analysis with Pie Chart
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(0, 168, 168)
        doc.text('Cost Analysis - Monthly Spending Overview', 14, yPos)
        yPos += 5
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(`Total Cost: ${formatPdfCurrency(totalCost)}`, 14, yPos)
        yPos += 12
        
        // Draw Pie Chart
        const centerX = 70
        const centerY = yPos + 45
        const radius = 35
        
        // Draw pie chart sections
        let startAngle = -Math.PI / 2 // Start from top
        const pieColors = [
          [88, 179, 255],   // Consumables - #58B3FF
          [119, 221, 119],  // Medicines - #77DD77  
          [255, 209, 102],  // Equipment - #FFD166
        ]
        
        costBreakdownData.forEach((item, idx) => {
          const percentage = totalCost > 0 ? item.value / totalCost : 0
          const sweepAngle = percentage * 2 * Math.PI
          
          if (percentage > 0) {
            // Draw pie slice
            const color = pieColors[idx % pieColors.length]
            doc.setFillColor(color[0], color[1], color[2])
            
            // Draw arc segments
            const segments = Math.max(Math.ceil(sweepAngle * 20), 1)
            const points: [number, number][] = [[centerX, centerY]]
            
            for (let i = 0; i <= segments; i++) {
              const angle = startAngle + (sweepAngle * i / segments)
              points.push([
                centerX + radius * Math.cos(angle),
                centerY + radius * Math.sin(angle)
              ])
            }
            
            // Draw filled polygon
            doc.setDrawColor(255, 255, 255)
            doc.setLineWidth(0.5)
            
            // Use triangle fan approach for pie slice
            for (let i = 1; i < points.length - 1; i++) {
              doc.triangle(
                centerX, centerY,
                points[i][0], points[i][1],
                points[i + 1][0], points[i + 1][1],
                'F'
              )
            }
            
            startAngle += sweepAngle
          }
        })
        
        // Draw center circle for donut effect
        doc.setFillColor(255, 255, 255)
        doc.circle(centerX, centerY, radius * 0.5, 'F')
        
        // Draw total in center
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text('Total', centerX, centerY - 3, { align: 'center' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(formatPdfCurrency(totalCost), centerX, centerY + 4, { align: 'center' })
        
        // Cost Breakdown section (right side)
        const breakdownX = 130
        let breakdownY = yPos
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(0, 168, 168)
        doc.text('Cost Breakdown', breakdownX, breakdownY)
        breakdownY += 10
        
        costBreakdownData.forEach((item, idx) => {
          const color = pieColors[idx % pieColors.length]
          const percentage = totalCost > 0 ? Math.round((item.value / totalCost) * 100) : 0
          
          // Color dot
          doc.setFillColor(color[0], color[1], color[2])
          doc.circle(breakdownX + 3, breakdownY - 2, 3, 'F')
          
          // Category name
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(50, 50, 50)
          doc.text(item.label, breakdownX + 10, breakdownY)
          
          // Percentage
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(120, 120, 120)
          doc.text(`${percentage}%`, breakdownX + 10, breakdownY + 5)
          
          // Amount (right aligned)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(50, 50, 50)
          doc.text(formatPdfCurrency(item.value), pageWidth - 30, breakdownY, { align: 'right' })
          
          breakdownY += 18
        })
        
        yPos = Math.max(centerY + radius + 15, breakdownY + 5)
        
        // Summary table below
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(0, 168, 168)
        doc.text('Detailed Cost Summary', 14, yPos)
        yPos += 8
        
        // Cost breakdown table
        const costTableData = costBreakdownData.map((item) => [
          item.label,
          formatPdfCurrency(item.value),
          `${totalCost > 0 ? Math.round((item.value / totalCost) * 100) : 0}%`
        ])
        
        autoTable(doc, {
          head: [['Category/Item', 'Cost', 'Percentage']],
          body: costTableData,
          startY: yPos,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 4,
            textColor: [50, 50, 50],
          },
          headStyles: {
            fillColor: [0, 168, 168],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [248, 252, 252],
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 70, halign: 'right' },
            2: { cellWidth: 50, halign: 'center' },
          },
          margin: { left: 14, right: 14 },
        })
      }
      
      // Footer
      const footerY = pageHeight - 10
      doc.setDrawColor(200, 210, 210)
      doc.setLineWidth(0.3)
      doc.line(14, footerY - 5, pageWidth - 14, footerY - 5)
      
      doc.setFontSize(8)
      doc.setTextColor(120, 130, 140)
      doc.setFont('helvetica', 'normal')
      doc.text('Medicare Dental Clinic - Inventory Management System', 14, footerY)
      doc.text('Page 1 of 1', pageWidth - 14, footerY, { align: 'right' })
      
      // Save
      const filename = `inventory-report-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF. Check console for details.')
    } finally {
      setIsExporting(false)
    }
  }

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
              <Button 
                size="sm" 
                className="bg-[#00a8a8] hover:bg-[#009090] text-white print:hidden" 
                onClick={exportReportToPDF}
                disabled={isExporting}
              >
                <DownloadCloud className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
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
