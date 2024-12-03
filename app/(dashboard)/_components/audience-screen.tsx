'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, 
  Radar, PolarGrid, PolarAngleAxis 
} from 'recharts'
import { Users, MapPin, Clock, Brain, TrendingUp } from 'lucide-react'

const ageData = [
  { name: '18-24', value: 30 },
  { name: '25-34', value: 45 },
  { name: '35-44', value: 15 },
  { name: '45+', value: 10 }
]

const engagementData = [
  { name: 'Jan', views: 4000, likes: 2400 },
  { name: 'Feb', views: 3000, likes: 1398 },
  { name: 'Mar', views: 2000, likes: 9800 },
  { name: 'Apr', views: 2780, likes: 3908 },
  { name: 'May', views: 1890, likes: 4800 },
  { name: 'Jun', views: 2390, likes: 3800 }
]

const interestData = [
  { subject: 'Tech', A: 120, fullMark: 150 },
  { subject: 'Gaming', A: 98, fullMark: 150 },
  { subject: 'Education', A: 86, fullMark: 150 },
  { subject: 'Lifestyle', A: 99, fullMark: 150 },
  { subject: 'Music', A: 85, fullMark: 150 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function AudienceScreen() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#8884d8" />
                <Line type="monotone" dataKey="likes" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Interest Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={interestData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <Radar name="Interests" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}