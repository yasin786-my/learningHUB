import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import api from '../../api/axios';
import ChartCard from './ChartCard';
import {
  CHART_COLORS, AXIS_STYLE, GRID_STROKE, ChartTooltip, ChartLegend,
} from './chartTheme.jsx';

export default function StudentAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/student/analytics').then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasCourses = data.courseProgress?.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-dark-300 text-sm">Completion rate</p>
          <p className="text-3xl font-bold text-white mt-1">{data.completionRate}%</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-dark-300 text-sm">Courses completed</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{data.completedCourses}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-dark-300 text-sm">Total available</p>
          <p className="text-3xl font-bold text-sapphire-400 mt-1">{data.totalCourses}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="My Progress" subtitle="How you're doing overall">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.progressOverview}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
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

        <ChartCard title="Completion Activity" subtitle="Courses finished per month" delay={0.05}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.activityByMonth}>
              <defs>
                <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="completions"
                name="Completions"
                stroke={CHART_COLORS.emerald}
                fill="url(#completionGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Course Progress" subtitle="Progress % for each course" delay={0.1}>
        {hasCourses ? (
          <ResponsiveContainer width="100%" height={Math.max(200, data.courseProgress.length * 48)}>
            <BarChart data={data.courseProgress} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="title"
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="progress"
                name="Progress"
                radius={[0, 6, 6, 0]}
                fill={CHART_COLORS.sapphire}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-dark-400 text-sm text-center py-16">No courses available yet.</p>
        )}
      </ChartCard>
    </div>
  );
}
