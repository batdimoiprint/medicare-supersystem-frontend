import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Coins, Calendar } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import ChartRadialSimple from '@/components/ui/chart-radial-simple'

const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'usage' | 'cost'>('usage')
  const [dateRange, setDateRange] = useState('Last 6 Months')
  const [startRangeMonth, setStartRangeMonth] = useState<string>('')
  const [endRangeMonth, setEndRangeMonth] = useState<string>('')

  const usageData = [
    { label: 'Latex Gloves', value: 74779 },
    { label: 'Dental Masks', value: 56435 },
    { label: 'Amalgam Capsules', value: 43887 },
  ]
  const usageColors = ['#58B3FF', '#77DD77', '#FFD166']

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
  const costBreakdownData = [
    { label: 'Supplies', value: 15400, color: '#58B3FF' },
    { label: 'Medicine', value: 19800, color: '#77DD77' },
    { label: 'Equipment', value: 9800, color: '#FFD166' },
  ]

  const totalCost = costBreakdownData.reduce((s, c) => s + c.value, 0)

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

  // Use custom month selection when dateRange is set to Custom
  function parseMonthValue(value?: string) {
    if (!value) return null
    const [year, month] = value.split('-').map(Number)
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    return { start, end }
  }

  let activeRange = getRangeFor(dateRange)
  if (dateRange === 'Custom') {
    const s = parseMonthValue(startRangeMonth)
    const e = parseMonthValue(endRangeMonth)
    if (s && e) {
      activeRange = { start: s.start, end: e.end, formatted: `${formatShortDate(s.start)} - ${formatShortDate(e.end)}` }
    }
  }

  // Helpers for months list used in the custom start/end selects
  function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`
  }

  function generateMonthOptions(year?: number) {
    const opts: { value: string; label: string }[] = []
    const y = typeof year === 'number' ? year : new Date().getFullYear()
    for (let i = 0; i < 12; i++) {
      const d = new Date(y, i, 1)
      const value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}` // format YYYY-MM
      // Use only short month (e.g., 'Jun') to minimize label UI
      const label = d.toLocaleString(undefined, { month: 'short' })
      opts.push({ value, label })
    }
    return opts
  }

  // Use the start year from active range (or current year) for the Jan-Dec list
  const monthOptions = React.useMemo(() => generateMonthOptions(activeRange.start.getFullYear()), [activeRange.start])

  // Initialize start/end month values to activeRange months
  React.useEffect(() => {
    const s = activeRange.start
    const e = activeRange.end
    setStartRangeMonth(`${s.getFullYear()}-${pad(s.getMonth() + 1)}`)
    setEndRangeMonth(`${e.getFullYear()}-${pad(e.getMonth() + 1)}`)
  }, [dateRange])

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Date Range</div>
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v)}>
                    <SelectTrigger size="sm" className="rounded-3xl"> 
                      <div className="inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><SelectValue /></div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Last 6 Months">Last 6 Months</SelectItem>
                      <SelectItem value="Last Month">Last Month</SelectItem>
                      <SelectItem value="Year to Date">Year to Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Category</div>
                  <Select value="All Categories" onValueChange={() => {}}>
                    <SelectTrigger size="sm" className="rounded-3xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Categories">All Categories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-slate-500 mb-1">Custom Date Range</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={startRangeMonth} onValueChange={(v) => { setStartRangeMonth(v); setDateRange('Custom') }}>
                      <SelectTrigger size="sm" className="rounded-3xl">
                        <div className="inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><SelectValue>{monthOptions.find(o => o.value === startRangeMonth)?.label ?? 'Start'}</SelectValue></div>
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={endRangeMonth} onValueChange={(v) => { setEndRangeMonth(v); setDateRange('Custom') }}>
                      <SelectTrigger size="sm" className="rounded-3xl">
                        <div className="inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><SelectValue>{monthOptions.find(o => o.value === endRangeMonth)?.label ?? 'End'}</SelectValue></div>
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(45280)}</div>
                </div>
                <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">Monthly Usage</div>
                    <div className="ml-auto text-xs text-slate-500 py-1 px-2 rounded bg-slate-100 dark:bg-slate-900">₱</div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(8540)}</div>
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
                      <HorizontalBarChart data={usageData} colors={usageColors} />
                      <div className="mt-4 flex gap-4 items-center justify-center">
                        {usageData.map((u, i) => (
                          <div key={u.label} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: usageColors[i % usageColors.length] }} />
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
