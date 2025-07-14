import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  Users,
  ImageIcon,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Eye,
  DollarSign,
  UserCheck,
  Zap,
  Clock,
  Star,
  AlertTriangle
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalMockups: number;
    totalRevenue: number;
    creditsUsed: number;
    averageProcessingTime: number;
  };
  trends: {
    date: string;
    users: number;
    mockups: number;
    revenue: number;
    credits: number;
  }[];
  techniques: {
    name: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  userActivity: {
    hour: number;
    users: number;
    mockups: number;
  }[];
  topProducts: {
    name: string;
    mockups: number;
    revenue: number;
  }[];
  recentActivity: {
    id: string;
    type: 'user_registered' | 'mockup_generated' | 'payment_completed' | 'subscription_created';
    user: string;
    details: string;
    timestamp: string;
  }[];
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  onExport?: (format: 'csv' | 'pdf') => void;
  onRefresh?: () => void;
}

// Mock data for demonstration
const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalUsers: 2847,
    activeUsers: 1234,
    totalMockups: 18567,
    totalRevenue: 45672.50,
    creditsUsed: 156789,
    averageProcessingTime: 3.2
  },
  trends: [
    { date: '2024-01-01', users: 150, mockups: 450, revenue: 1200, credits: 2300 },
    { date: '2024-01-02', users: 180, mockups: 520, revenue: 1450, credits: 2650 },
    { date: '2024-01-03', users: 165, mockups: 480, revenue: 1350, credits: 2400 },
    { date: '2024-01-04', users: 200, mockups: 610, revenue: 1680, credits: 3100 },
    { date: '2024-01-05', users: 190, mockups: 580, revenue: 1590, credits: 2900 },
    { date: '2024-01-06', users: 220, mockups: 670, revenue: 1820, credits: 3400 },
    { date: '2024-01-07', users: 210, mockups: 640, revenue: 1750, credits: 3200 }
  ],
  techniques: [
    { name: 'Screen Printing', count: 4567, percentage: 32.5, color: '#0088FE' },
    { name: 'Embroidery', count: 3421, percentage: 24.3, color: '#00C49F' },
    { name: 'Digital Print', count: 2876, percentage: 20.4, color: '#FFBB28' },
    { name: 'Heat Transfer', count: 1823, percentage: 13.0, color: '#FF8042' },
    { name: 'Laser Engraving', count: 1398, percentage: 9.8, color: '#8884D8' }
  ],
  userActivity: [
    { hour: 0, users: 12, mockups: 25 },
    { hour: 1, users: 8, mockups: 15 },
    { hour: 2, users: 5, mockups: 8 },
    { hour: 3, users: 3, mockups: 5 },
    { hour: 4, users: 4, mockups: 6 },
    { hour: 5, users: 8, mockups: 12 },
    { hour: 6, users: 15, mockups: 28 },
    { hour: 7, users: 25, mockups: 45 },
    { hour: 8, users: 45, mockups: 85 },
    { hour: 9, users: 65, mockups: 120 },
    { hour: 10, users: 85, mockups: 160 },
    { hour: 11, users: 95, mockups: 180 },
    { hour: 12, users: 88, mockups: 165 },
    { hour: 13, users: 92, mockups: 175 },
    { hour: 14, users: 98, mockups: 185 },
    { hour: 15, users: 105, mockups: 195 },
    { hour: 16, users: 112, mockups: 210 },
    { hour: 17, users: 98, mockups: 185 },
    { hour: 18, users: 85, mockups: 160 },
    { hour: 19, users: 70, mockups: 135 },
    { hour: 20, users: 55, mockups: 105 },
    { hour: 21, users: 42, mockups: 80 },
    { hour: 22, users: 30, mockups: 55 },
    { hour: 23, users: 18, mockups: 35 }
  ],
  topProducts: [
    { name: 'T-Shirts', mockups: 4567, revenue: 12456.78 },
    { name: 'Mugs', mockups: 3421, revenue: 8965.43 },
    { name: 'Bags', mockups: 2876, revenue: 7234.56 },
    { name: 'Caps', mockups: 2134, revenue: 5678.90 },
    { name: 'Hoodies', mockups: 1890, revenue: 4567.89 }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'mockup_generated',
      user: 'john.doe@example.com',
      details: 'Generated T-shirt mockup with logo',
      timestamp: '2024-01-07T10:30:00Z'
    },
    {
      id: '2',
      type: 'user_registered',
      user: 'jane.smith@example.com',
      details: 'New user registration',
      timestamp: '2024-01-07T10:25:00Z'
    },
    {
      id: '3',
      type: 'payment_completed',
      user: 'mike.johnson@example.com',
      details: 'Purchased 50 credits for $24.99',
      timestamp: '2024-01-07T10:20:00Z'
    }
  ]
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data = mockAnalyticsData,
  onExport,
  onRefresh
}) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'mockup_generated': return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'payment_completed': return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'subscription_created': return <Star className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform performance and user insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onRefresh}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onExport?.('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.totalUsers)}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.activeUsers)}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+8.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Mockups</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.totalMockups)}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+15.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+22.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Credits Used</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.creditsUsed)}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+18.7%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Process Time</p>
                <p className="text-2xl font-bold">{data.overview.averageProcessingTime}s</p>
              </div>
              <Clock className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">-5.2%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="techniques">Techniques</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users & Mockups Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#0088FE" name="Users" />
                    <Line type="monotone" dataKey="mockups" stroke="#00C49F" name="Mockups" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue & Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="Revenue" />
                    <Area type="monotone" dataKey="credits" stackId="2" stroke="#FF8042" fill="#FF8042" name="Credits" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="techniques" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Technique Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.techniques}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {data.techniques.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technique Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.techniques}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="users" stackId="1" stroke="#0088FE" fill="#0088FE" name="Active Users" />
                  <Area type="monotone" dataKey="mockups" stackId="2" stroke="#00C49F" fill="#00C49F" name="Mockups Generated" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Mockups</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="mockups" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.details}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};