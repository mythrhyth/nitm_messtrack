import { prisma } from '../config/db.js';

export class DashboardService {
  async getStats() {
    const totalStudents = await prisma.student.count();
    const active = await prisma.student.count({ where: { status: 'Active' } });
    const onLeave = await prisma.student.count({ where: { status: 'On Leave' } });

    const collectionAggregate = await prisma.student.aggregate({
      _sum: { amountPaid: true }
    });
    const refundAggregate = await prisma.student.aggregate({
      _sum: { refundEarned: true }
    });

    const collection = collectionAggregate._sum.amountPaid || 0;
    const refunds = refundAggregate._sum.refundEarned || 0;

    return {
      totalStudents,
      active,
      onLeave,
      collection,
      refunds,
      netRevenue: collection - refunds
    };
  }

  async getChartData() {
    const collectionAggregate = await prisma.student.aggregate({
      _sum: { amountPaid: true }
    });
    const refundAggregate = await prisma.student.aggregate({
      _sum: { refundEarned: true }
    });

    const totalCollection = collectionAggregate._sum.amountPaid || 0;
    const totalRefund = refundAggregate._sum.refundEarned || 0;

    const collectionLakhs = Number((totalCollection / 100000).toFixed(2));
    const refundLakhs = Number((totalRefund / 100000).toFixed(2));

    const semCollData = [
      { sem: "Spr'24", collection: 26.5, refund: 1.82 },
      { sem: "Aut'24", collection: 28.2, refund: 2.15 },
      { sem: "Spr'25", collection: 31.0, refund: 2.48 },
      { sem: "Aut'25", collection: 30.5, refund: 2.31 },
      { sem: "Spr'26", collection: collectionLakhs, refund: refundLakhs },
    ];

    const springAutumn = [
      { year: "2023", spring: 24.0, autumn: 25.8 },
      { year: "2024", spring: 26.5, autumn: 28.2 },
      { year: "2025", spring: 31.0, autumn: 30.5 },
      { year: "2026", spring: collectionLakhs, autumn: null },
    ];

    // Students count by hostel
    const studentsByHostel = await prisma.student.groupBy({
      by: ['hostel'],
      _count: { _all: true }
    });
    const hostelStudData = studentsByHostel.map((g) => ({
      name: g.hostel,
      students: g._count._all
    }));

    // Refunds by hostel
    const refundsByHostel = await prisma.student.groupBy({
      by: ['hostel'],
      _sum: { refundEarned: true }
    });
    const hostelRefData = refundsByHostel.map((g) => ({
      name: g.hostel,
      refund: g._sum.refundEarned || 0
    }));

    // Leaves by month
    const leaves = await prisma.leaveRecord.findMany({
      select: { leaveStart: true }
    });
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const monthCounts: Record<string, number> = {};
    monthNames.forEach((m) => { monthCounts[m] = 0; });
    leaves.forEach((l) => {
      const date = new Date(l.leaveStart);
      if (!isNaN(date.getTime())) {
        const mIndex = date.getMonth();
        const mName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mIndex];
        if (monthCounts[mName] !== undefined) {
          monthCounts[mName]++;
        }
      }
    });
    const monthlyData = monthNames.map((m) => ({
      month: m,
      leaves: monthCounts[m]
    }));

    return {
      semCollData,
      springAutumn,
      hostelStudData,
      hostelRefData,
      monthlyData
    };
  }
}

export const dashboardService = new DashboardService();
