import { useEffect, useState } from 'react';
import { useFetch } from '@/shared/hooks/useFetch';
import type { DashboardStats } from '../types/dashboard.types';

export function Dashboard() {
  const { data: stats, isLoading, error } = useFetch<DashboardStats>(
    '/api/v1/dashboard/stats'
  );

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div role="alert">Failed to load dashboard: {error}</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Active Sessions" value={stats.activeSessions} />
        <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} />
      </div>

      <section>
        <h2>Recent Activity</h2>
        <ul>
          {stats.recentActivity.map((activity) => (
            <li key={activity.id}>
              <span>{activity.description}</span>
              <time dateTime={activity.timestamp}>
                {new Date(activity.timestamp).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
