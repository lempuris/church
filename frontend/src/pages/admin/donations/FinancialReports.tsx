import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import {
  DollarSign,
  TrendingUp,
  Users,
  PieChart,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useThemeStore } from '@/store/theme'
import { donationService } from '@/services'
import type { CategorySummary } from '@/types'

function formatCurrency(amount: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function CategoryBarChart({ data }: { data: CategorySummary[] }) {
  if (data.length === 0) return null
  const maxAmount = Math.max(...data.map((c) => c.total_amount), 1)

  return (
    <div className="space-y-3">
      {data.map((category) => {
        const percentage = (category.total_amount / maxAmount) * 100
        return (
          <div key={category.category_id || 'uncategorized'} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate max-w-[200px]">{category.category_name}</span>
              <span className="font-medium">{formatCurrency(category.total_amount)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{category.donation_count} donations</span>
              <span>{category.percentage.toFixed(1)}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SummaryStatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

export function FinancialReports() {
  const { getTheme } = useThemeStore()
  const theme = getTheme()
  
  const today = new Date()
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'))

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['donation-summary', startDate, endDate],
    queryFn: () => donationService.getFinancialSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['donation-trends', startDate, endDate],
    queryFn: () => donationService.getFinancialTrends(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })

  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status'],
    queryFn: () => donationService.getPaymentStatus(),
  })

  const handleQuickRange = (days: number) => {
    const end = new Date()
    const start = subDays(end, days)
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  const handleThisMonth = () => {
    setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
  }

  const isLoading = summaryLoading || trendsLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          View donation statistics and giving trends
        </p>
      </div>

      {/* Payment Provider Status */}
      {paymentStatus && !paymentStatus.is_configured && (
        <div 
          className="rounded-xl p-5 shadow-lg"
          style={{ 
            backgroundColor: theme.colors.card,
            border: `2px solid ${theme.colors.primary}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="flex-shrink-0 p-3 rounded-full"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <AlertTriangle className="h-6 w-6" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <p 
                className="font-bold text-lg"
                style={{ color: theme.colors.foreground }}
              >
                Online Payments Not Configured
              </p>
              <p 
                className="text-sm mt-1"
                style={{ color: theme.colors.mutedForeground }}
              >
                {paymentStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range</CardTitle>
          <CardDescription>Select a date range to view donation data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={handleThisMonth}>
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && summary && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryStatCard
              title="Total Donations"
              value={summary.total_donations}
              icon={DollarSign}
              description={`${format(new Date(summary.period_start), 'MMM d')} - ${format(new Date(summary.period_end), 'MMM d, yyyy')}`}
            />
            <SummaryStatCard
              title="Total Amount"
              value={formatCurrency(summary.total_amount, summary.currency)}
              icon={TrendingUp}
              description={`In ${summary.currency}`}
            />
            <SummaryStatCard
              title="Average Donation"
              value={
                summary.total_donations > 0
                  ? formatCurrency(summary.total_amount / summary.total_donations, summary.currency)
                  : formatCurrency(0, summary.currency)
              }
              icon={Users}
              description="Per donation"
            />
            <SummaryStatCard
              title="Categories"
              value={summary.by_category.length}
              icon={PieChart}
              description="Active categories"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Category */}
            <Card>
              <CardHeader>
                <CardTitle>Donations by Category</CardTitle>
                <CardDescription>Breakdown of giving by category</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.by_category.length > 0 ? (
                  <CategoryBarChart data={summary.by_category} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No donations in this period
                  </p>
                )}
              </CardContent>
            </Card>

            {/* By Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Donations by Payment Method</CardTitle>
                <CardDescription>How donors are giving</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(summary.by_payment_method).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(summary.by_payment_method).map(([method, amount]) => (
                      <div key={method} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                        </div>
                        <span className="text-lg font-bold">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No payment data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          {trends && trends.trends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Donation amounts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Month</th>
                        <th className="text-right py-3 px-2 font-medium">Donations</th>
                        <th className="text-right py-3 px-2 font-medium">Total Amount</th>
                        <th className="text-right py-3 px-2 font-medium">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends.trends.map((trend) => (
                        <tr key={trend.month} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">{trend.month}</td>
                          <td className="py-3 px-2 text-right">{trend.donation_count}</td>
                          <td className="py-3 px-2 text-right font-medium">
                            {formatCurrency(trend.total_amount)}
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {trend.donation_count > 0
                              ? formatCurrency(trend.total_amount / trend.donation_count)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
