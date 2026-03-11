// lib/dashboard-store.ts
import { prisma } from '@/lib/prisma'

/**
 * =========================
 * DASHBOARD AGGREGATES
 * =========================
 * Esta capa NO hace CRUD
 * Solo lectura, agregación y métricas
 */

// ---------- TYPES ----------

export interface DashboardStats {
  totalClients: number
  totalProducts: number
  totalBudgets: number
  approvedBudgets: number
  draftBudgets: number
  sentBudgets: number
  rejectedBudgets: number
  totalRevenue: number
}

export interface RecentBudget {
  id: string
  total: number
  status: string
  createdAt: Date
  clientName: string | null
  companyName: string | null
}

// ---------- FUNCTIONS ----------

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalClients,
    totalProducts,
    totalBudgets,
    approvedBudgets,
    draftBudgets,
    sentBudgets,
    rejectedBudgets,
    approvedRevenue,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.productService.count({ where: { active: true } }),
    prisma.budget.count(),
    prisma.budget.count({ where: { status: 'approved' } }),
    prisma.budget.count({ where: { status: 'draft' } }),
    prisma.budget.count({ where: { status: 'sent' } }),
    prisma.budget.count({ where: { status: 'rejected' } }),
    prisma.budget.aggregate({
      where: { status: 'approved' },
      _sum: { total: true },
    }),
  ])

  return {
    totalClients,
    totalProducts,
    totalBudgets,
    approvedBudgets,
    draftBudgets,
    sentBudgets,
    rejectedBudgets,
    totalRevenue: approvedRevenue._sum.total || 0,
  }
}

// ------------------------------

export async function getRecentBudgets(limit = 5): Promise<RecentBudget[]> {
  const budgets = await prisma.budget.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
    },
  })

  return budgets.map(b => ({
    id: b.id,
    total: b.total,
    status: b.status,
    createdAt: b.createdAt,
    clientName: b.client?.name ?? null,
    companyName: b.client?.company ?? null,
  }))
}

// ------------------------------

export async function getMonthlyRevenue() {
  const approved = await prisma.budget.findMany({
    where: { status: 'approved' },
    select: {
      total: true,
      createdAt: true,
    },
  })

  const map = new Map<string, number>()

  approved.forEach(b => {
    const key = `${b.createdAt.getFullYear()}-${b.createdAt.getMonth() + 1}`
    map.set(key, (map.get(key) || 0) + b.total)
  })

  return Array.from(map.entries()).map(([month, total]) => ({
    month,
    total,
  }))
}

// ------------------------------

export async function getBudgetStatusStats() {
  const grouped = await prisma.budget.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  return grouped.map(g => ({
    status: g.status,
    count: g._count.status,
  }))
}
