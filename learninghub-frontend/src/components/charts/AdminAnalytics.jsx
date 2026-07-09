import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios';
import ChartCard from './ChartCard';
import {
  PIE_COLORS, CHART_COLORS, AXIS_STYLE, GRID_STROKE,
  ChartTooltip, ChartLegend,
} from './chartTheme.jsx';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sapphire-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasCourses = data.courseStats?.length > 0;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 border border-sapphire-500/20 bg-sapphire-500/5">
        <p className="text-dark-300 text-sm">Platform completion rate</p>
        <p className="text-4xl font-bold text-white mt-1">{data.completionRate}%</p>
        <p className="text-dark-400 text-xs mt-1">Across all student–course pairs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Users by Role" subtitle="Admin vs student accounts">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.usersByRole}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.usersByRole.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<ChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Student Status" subtitle="Active vs inactive accounts" delay={0.05}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.studentStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                <Cell fill={CHART_COLORS.emerald} />
                <Cell fill={CHART_COLORS.rose} />
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<ChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Learning Progress" subtitle="All platform activity" delay={0.1}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.progressOverview}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                <Cell fill={CHART_COLORS.emerald} />
                <Cell fill={CHART_COLORS.sapphire} />
                <Cell fill={CHART_COLORS.amber} />
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<ChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Student Signups" subtitle="New registrations — last 6 months" delay={0.15}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.signupsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="students"
                name="New students"
                stroke={CHART_COLORS.sapphire}
                strokeWidth={2.5}
                dot={{ fill: CHART_COLORS.sapphire, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Course Engagement"
          subtitle="Per-course completion breakdown"
          delay={0.2}
        >
          {hasCourses ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.courseStats} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<ChartLegend />} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill={CHART_COLORS.emerald} radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill={CHART_COLORS.sapphire} />
                <Bar dataKey="notStarted" name="Not Started" stackId="a" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-dark-400 text-sm text-center py-16">No courses yet — add courses to see engagement data.</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
