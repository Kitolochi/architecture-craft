export interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  revenue: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  userId: string;
  type: 'login' | 'purchase' | 'signup' | 'update';
}
