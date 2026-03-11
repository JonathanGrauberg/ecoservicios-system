import { NextResponse } from 'next/server'
import { 
  getDashboardStats,
  getRecentBudgets,
  getMonthlyRevenue,
  getBudgetStatusStats
} from '@/lib/dashboard-store'

export async function GET() {
  try {
    const [
      stats,
      recentBudgets,
      revenue,
      statusStats
    ] = await Promise.all([
      getDashboardStats(),
      getRecentBudgets(5),
      getMonthlyRevenue(),
      getBudgetStatusStats()
    ])

    return NextResponse.json({
      stats,
      recentBudgets,
      revenue,
      statusStats,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}
