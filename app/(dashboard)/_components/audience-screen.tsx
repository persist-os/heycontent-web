'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { 
  BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis 
} from 'recharts'
import { 
  Users, Heart, Target, Globe, Brain, TrendingUp,
  Zap, Award, DollarSign, Eye
} from 'lucide-react'

interface InterestCategory {
  category: string
  value: number
  trend: string
  subCategories: string[]
  brandAffinity: string[]
  contentTypes: string[]
}

interface ContentPreference {
  type: string
  percentage: number
  growth: string
}

export function AudienceScreen() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState<InterestCategory | null>(null)

  // Engagement patterns data
  const engagementPatterns = [
    { type: 'Comments', value: 85, trend: '+12%' },
    { type: 'Saves', value: 72, trend: '+8%' },
    { type: 'Shares', value: 68, trend: '+15%' },
    { type: 'Click-throughs', value: 90, trend: '+20%' },
    { type: 'Watch Time', value: 78, trend: '+5%' }
  ]

  // Audience interests with expanded insights
  const interestData = [
    { 
      category: 'Technology',
      value: 85,
      trend: '+12%',
      subCategories: ['Web Development', 'AI/ML', 'Mobile Tech'],
      brandAffinity: ['Apple', 'Google', 'Microsoft'],
      contentTypes: ['Tutorials', 'Product Reviews', 'Industry News']
    },
    { 
      category: 'Lifestyle',
      value: 72,
      trend: '+8%',
      subCategories: ['Work-Life Balance', 'Productivity', 'Remote Work'],
      brandAffinity: ['Notion', 'Figma', 'Asana'],
      contentTypes: ['Day in Life', 'Setup Tours', 'Tips & Tricks']
    },
    { 
      category: 'Business',
      value: 68,
      trend: '+15%',
      subCategories: ['Startups', 'Freelancing', 'Digital Marketing'],
      brandAffinity: ['Slack', 'LinkedIn', 'Stripe'],
      contentTypes: ['Case Studies', 'Interviews', 'Analysis']
    },
    { 
      category: 'Education',
      value: 45,
      trend: '+5%',
      subCategories: ['Online Courses', 'Bootcamps', 'Self-Learning'],
      brandAffinity: ['Udemy', 'Coursera', 'edX'],
      contentTypes: ['Course Reviews', 'Learning Paths', 'Resource Guides']
    }
  ]

  const psychographicData = {
    contentPreferences: [
      { type: 'In-depth tutorials', percentage: 75, growth: '+12%' },
      { type: 'Quick tips', percentage: 65, growth: '+8%' },
      { type: 'Behind the scenes', percentage: 85, growth: '+15%' },
      { type: 'Industry news', percentage: 55, growth: '+5%' }
    ],
    behavioralTraits: [
      { trait: 'Early Adopters', value: 'High', color: 'text-green-500', percentage: 82 },
      { trait: 'Brand Loyal', value: 'Medium', color: 'text-yellow-500', percentage: 65 },
      { trait: 'Tech-Savvy', value: 'Very High', color: 'text-green-500', percentage: 90 },
      { trait: 'Price Sensitive', value: 'Low', color: 'text-red-500', percentage: 35 }
    ]
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold mb-1">Audience DNA</h1>
          <p className="text-gray-600">Deep insights into your audience behavior and preferences</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-white/50 backdrop-blur-sm rounded-xl px-4 py-2"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Core Audience', value: '32.5K', trend: '+12%' },
                { icon: Heart, label: 'Engagement Rate', value: '8.2%', trend: '+3.1%' },
                { icon: Target, label: 'Audience Match', value: '92%', trend: '+5.4%' },
                { icon: Globe, label: 'Top Region', value: 'US East', trend: '45%' }
              ].map((metric, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-xl bg-blue-50">
                        <metric.icon className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{metric.label}</p>
                        <h3 className="text-2xl font-semibold">{metric.value}</h3>
                        <span className="text-sm text-green-500">{metric.trend}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Interest Categories & Engagement Patterns Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Interest Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Interest Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interestData.map((interest) => (
                      <div
                        key={interest.category}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          selectedCategory?.category === interest.category
                            ? 'bg-blue-50'
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                        onClick={() => setSelectedCategory(interest)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{interest.category}</h3>
                          <span className="text-green-500 text-sm">{interest.trend}</span>
                        </div>
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-blue-100">
                            <div
                              style={{ width: `${interest.value}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                            />
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{interest.value}% Affinity</span>
                            <span>Growth: {interest.trend}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Patterns with Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col h-[400px]">
                    {/* Summary Stats Above Chart */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-500">85%</div>
                        <div className="text-sm text-gray-600">Average Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-green-500">+12%</div>
                        <div className="text-sm text-gray-600">Monthly Growth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-purple-500">90%</div>
                        <div className="text-sm text-gray-600">Interaction Rate</div>
                      </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={engagementPatterns} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                          <PolarGrid 
                            stroke="#e5e7eb" 
                            strokeWidth={1}
                            gridType="polygon"
                          />
                          <PolarAngleAxis
                            dataKey="type"
                            tick={({ x, y, payload }) => (
                              <g transform={`translate(${x},${y})`}>
                                <text
                                  x={0}
                                  y={0}
                                  dy={5}
                                  textAnchor="middle"
                                  fill="#666"
                                  className="text-sm font-medium"
                                >
                                  {payload.value}
                                </text>
                              </g>
                            )}
                            stroke="#9CA3AF"
                          />
                          <Radar
                            name="Engagement"
                            dataKey="value"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.3}
                          />
                          <Tooltip
                            content={({ payload }) => {
                              if (!payload || !payload[0]) return null;
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 shadow-lg rounded-lg border">
                                  <p className="font-medium">{data.type}</p>
                                  <p className="text-sm text-gray-500">{data.value}%</p>
                                  <p className="text-sm text-green-500">{data.trend}</p>
                                </div>
                              );
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend Below Chart */}
                    <div className="mt-6 flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 opacity-30"></div>
                        <span className="text-gray-600">Current Period</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-blue-500"></div>
                        <span className="text-gray-600">Previous Period</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Category Details */}
            {selectedCategory && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedCategory.category} Insights
                    <span className="text-sm text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                      {selectedCategory.value}% Affinity
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sub-Categories with Engagement Levels */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Sub-Categories & Engagement</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCategory.subCategories.map((sub, i) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{sub}</span>
                            <span className="text-xs text-green-500">+{Math.floor(Math.random() * 20)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brand Affinity with Metrics */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Brand Affinity & Performance</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedCategory.brandAffinity.map((brand, i) => (
                        <div key={i} className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="font-medium text-green-700 mb-1">{brand}</div>
                          <div className="text-xs text-gray-600">Engagement Rate</div>
                          <div className="text-sm font-semibold text-green-600">
                            {Math.floor(Math.random() * 20 + 80)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Performance */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Content Performance</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Avg. Watch Time</div>
                        <div className="text-lg font-semibold text-blue-600">4.2m</div>
                        <div className="text-xs text-green-500">+12% vs avg</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                        <div className="text-lg font-semibold text-purple-600">78%</div>
                        <div className="text-xs text-green-500">+8% vs avg</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Engagement</div>
                        <div className="text-lg font-semibold text-green-600">92%</div>
                        <div className="text-xs text-green-500">+15% vs avg</div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-blue-700">AI Recommendations</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-blue-600">
                        <span className="mt-1">•</span>
                        Consider creating more {selectedCategory.subCategories[0]} content based on high engagement rates
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-600">
                        <span className="mt-1">•</span>
                        Potential collaboration opportunity with {selectedCategory.brandAffinity[0]}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-600">
                        <span className="mt-1">•</span>
                        Optimize content length around 4-5 minutes for maximum retention
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Preferences & Behavioral Traits Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Content Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {psychographicData.contentPreferences.map((pref, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{pref.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{pref.percentage}%</span>
                            <span className="text-xs text-green-500 font-medium">{pref.growth}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Behavioral Traits */}
              <Card>
                <CardHeader>
                  <CardTitle>Behavioral Traits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {psychographicData.behavioralTraits.map((trait, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">{trait.trait}</span>
                          <div className="text-xs text-gray-500">{trait.percentage}% of audience</div>
                        </div>
                        <span className={`text-sm font-medium ${trait.color}`}>
                          {trait.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}