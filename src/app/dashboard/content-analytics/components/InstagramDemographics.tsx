"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  Heart, 
  Clock, 
  Globe,
  Calendar,
  Target,
  Smartphone,
  UserCheck,
  Camera
} from 'lucide-react';

// Mock data for different categories
const demographicsData = {
  ageGroups: {
    chart: [
      { name: '13-17', value: 8, color: '#9046FF' },
      { name: '18-24', value: 32, color: '#B266FF' },
      { name: '25-34', value: 28, color: '#C285FF' },
      { name: '35-44', value: 18, color: '#EC4899' },
      { name: '45-54', value: 10, color: '#F97316' },
      { name: '55+', value: 4, color: '#45E290' }
    ],
    insights: "Your audience is predominantly young adults aged 18-34 (60%), which is ideal for trendy fashion and lifestyle content. The 25-34 age group shows the highest engagement rates and purchasing power.",
    title: "Age Distribution",
    type: "pie"
  },
  gender: {
    chart: [
      { name: 'Female', value: 68, color: '#EC4899' },
      { name: 'Male', value: 30, color: '#3B82F6' },
      { name: 'Non-binary', value: 2, color: '#45E290' }
    ],
    insights: "Your audience is predominantly female (68%), which aligns well with beauty, fashion, and lifestyle content. Consider creating content that resonates with female interests while not excluding your male audience.",
    title: "Gender Breakdown",
    type: "pie"
  },
  topCities: {
    chart: [
      { name: 'New York', value: 15, followers: 23400 },
      { name: 'Los Angeles', value: 12, followers: 18600 },
      { name: 'London', value: 8, followers: 12400 },
      { name: 'Toronto', value: 6, followers: 9300 },
      { name: 'Paris', value: 5, followers: 7800 },
      { name: 'Sydney', value: 4, followers: 6200 },
      { name: 'Berlin', value: 3, followers: 4700 },
      { name: 'Miami', value: 3, followers: 4500 },
      { name: 'Tokyo', value: 2, followers: 3200 },
      { name: 'Amsterdam', value: 2, followers: 3100 },
      { name: 'Others', value: 36, followers: 56300, isOthers: true }
    ],
    fullData: [
      { name: 'New York', value: 15, followers: 23400 },
      { name: 'Los Angeles', value: 12, followers: 18600 },
      { name: 'London', value: 8, followers: 12400 },
      { name: 'Toronto', value: 6, followers: 9300 },
      { name: 'Paris', value: 5, followers: 7800 },
      { name: 'Sydney', value: 4, followers: 6200 },
      { name: 'Berlin', value: 3, followers: 4700 },
      { name: 'Miami', value: 3, followers: 4500 },
      { name: 'Tokyo', value: 2, followers: 3200 },
      { name: 'Amsterdam', value: 2, followers: 3100 },
      { name: 'Barcelona', value: 2, followers: 2900 },
      { name: 'Rome', value: 2, followers: 2800 },
      { name: 'Madrid', value: 2, followers: 2700 },
      { name: 'Singapore', value: 2, followers: 2600 },
      { name: 'Dubai', value: 2, followers: 2500 },
      { name: 'Mumbai', value: 2, followers: 2400 },
      { name: 'São Paulo', value: 2, followers: 2300 },
      { name: 'Mexico City', value: 2, followers: 2200 },
      { name: 'Bangkok', value: 2, followers: 2100 },
      { name: 'Seoul', value: 1, followers: 1900 },
      { name: 'Stockholm', value: 1, followers: 1800 },
      { name: 'Copenhagen', value: 1, followers: 1700 },
      { name: 'Vienna', value: 1, followers: 1600 },
      { name: 'Zurich', value: 1, followers: 1500 },
      { name: 'Brussels', value: 1, followers: 1400 },
      { name: 'Oslo', value: 1, followers: 1300 },
      { name: 'Helsinki', value: 1, followers: 1200 },
      { name: 'Dublin', value: 1, followers: 1100 },
      { name: 'Lisbon', value: 1, followers: 1000 }
    ],
    insights: "Your top cities show strong metropolitan concentration with 64% from major urban centers. The remaining 36% is distributed across 95+ cities globally. NYC and LA lead your US presence, while London represents your strongest international market.",
    title: "Top Cities",
    type: "bar",
    hasLargeDataset: true
  },
  countries: {
    chart: [
      { name: 'United States', value: 45, color: '#9046FF' },
      { name: 'Canada', value: 15, color: '#B266FF' },
      { name: 'United Kingdom', value: 12, color: '#EC4899' },
      { name: 'Australia', value: 8, color: '#45E290' },
      { name: 'Germany', value: 6, color: '#F97316' },
      { name: 'France', value: 4, color: '#EF4444' },
      { name: 'Others', value: 10, color: '#6B7280', isOthers: true }
    ],
    fullData: [
      { name: 'United States', value: 45, color: '#9046FF' },
      { name: 'Canada', value: 15, color: '#B266FF' },
      { name: 'United Kingdom', value: 12, color: '#EC4899' },
      { name: 'Australia', value: 8, color: '#45E290' },
      { name: 'Germany', value: 6, color: '#F97316' },
      { name: 'France', value: 4, color: '#EF4444' },
      { name: 'Netherlands', value: 2, color: '#3B82F6' },
      { name: 'Spain', value: 2, color: '#10B981' },
      { name: 'Italy', value: 2, color: '#F59E0B' },
      { name: 'Brazil', value: 2, color: '#8B5CF6' },
      { name: 'Sweden', value: 1, color: '#EC4899' },
      { name: 'Norway', value: 1, color: '#06B6D4' }
    ],
    insights: "Your audience spans 65+ countries with strong English-speaking market dominance (80%). The US leads with 45%, followed by Canada and UK. This global reach offers opportunities for international brand partnerships and localized content strategies.",
    title: "Country Distribution",
    type: "pie",
    hasLargeDataset: true
  },
  interests: {
    chart: [
      { category: 'Fashion', score: 85, color: '#EC4899' },
      { category: 'Lifestyle', score: 78, color: '#9046FF' },
      { category: 'Beauty', score: 72, color: '#F97316' },
      { category: 'Travel', score: 65, color: '#45E290' },
      { category: 'Food', score: 58, color: '#EF4444' },
      { category: 'Fitness', score: 45, color: '#3B82F6' }
    ],
    insights: "Fashion and lifestyle dominate your audience interests, followed by beauty content. This suggests your audience is highly engaged with aspirational content. Consider expanding into travel and food content to capture growing interest.",
    title: "Audience Interests",
    type: "radar"
  },
  engagement: {
    chart: [
      { time: '6 AM', likes: 120, comments: 15, shares: 8 },
      { time: '9 AM', likes: 340, comments: 42, shares: 18 },
      { time: '12 PM', likes: 580, comments: 78, shares: 35 },
      { time: '3 PM', likes: 720, comments: 95, shares: 42 },
      { time: '6 PM', likes: 890, comments: 125, shares: 55 },
      { time: '9 PM', likes: 950, comments: 140, shares: 68 },
      { time: '12 AM', likes: 420, comments: 35, shares: 20 }
    ],
    insights: "Peak engagement occurs between 6-9 PM when your audience is most active. Evening posts receive 3x more engagement than morning posts. Schedule your most important content during these golden hours.",
    title: "Engagement Patterns",
    type: "line"
  },
  deviceUsage: {
    chart: [
      { name: 'Mobile', value: 78, color: '#9046FF' },
      { name: 'Desktop', value: 15, color: '#EC4899' },
      { name: 'Tablet', value: 7, color: '#45E290' }
    ],
    insights: "Your audience primarily uses mobile devices (78%), which means your content should be optimized for mobile viewing. Vertical videos and mobile-first design are crucial for maximum engagement.",
    title: "Device Usage",
    type: "pie"
  },
  followTypes: {
    chart: [
      { name: 'Organic Followers', value: 82, color: '#45E290' },
      { name: 'Paid Campaigns', value: 12, color: '#F97316' },
      { name: 'Influencer Collabs', value: 6, color: '#9046FF' }
    ],
    insights: "Most of your followers (82%) found you organically, indicating strong content quality and discoverability. Your paid campaigns show good ROI, and influencer collaborations could be expanded for growth.",
    title: "Follow Sources",
    type: "pie"
  },
  contentTypes: {
    chart: [
      { name: 'Reels', engagement: 8.9, reach: 156, saves: 12.4, color: '#EF4444' },
      { name: 'Video Posts', engagement: 6.8, reach: 92, saves: 8.7, color: '#3B82F6' },
      { name: 'Carousel Posts', engagement: 5.4, reach: 79, saves: 15.2, color: '#9046FF' },
      { name: 'Photo Posts', engagement: 4.2, reach: 85, saves: 6.1, color: '#45E290' },
      { name: 'Stories', engagement: 3.7, reach: 67, saves: 2.8, color: '#F97316' },
      { name: 'IGTV', engagement: 2.1, reach: 35, saves: 4.3, color: '#EC4899' }
    ],
    insights: "Reels are your top performing content type with 8.9% engagement and 156% reach. Carousel posts generate the most saves (15.2%), indicating high value content. Consider creating more Reels and carousels to maximize your reach and engagement.",
    title: "Content Performance",
    type: "bar"
  }
};

const menuItems = [
  { key: 'ageGroups', label: 'Age Groups', icon: Users, color: 'from-purple-500 to-pink-500' },
  { key: 'gender', label: 'Gender', icon: UserCheck, color: 'from-pink-500 to-rose-500' },
  { key: 'topCities', label: 'Top Cities', icon: MapPin, color: 'from-blue-500 to-purple-500' },
  { key: 'countries', label: 'Countries', icon: Globe, color: 'from-green-500 to-blue-500' },
  { key: 'interests', label: 'Interests', icon: Heart, color: 'from-orange-500 to-pink-500' },
  { key: 'engagement', label: 'Engagement', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
  { key: 'deviceUsage', label: 'Devices', icon: Smartphone, color: 'from-indigo-500 to-purple-500' },
  { key: 'followTypes', label: 'Follow Sources', icon: Target, color: 'from-amber-500 to-orange-500' },
  { key: 'contentTypes', label: 'Content Types', icon: Camera, color: 'from-red-500 to-pink-500' }
];

const InstagramDemographics = () => {
  const [selectedCategory, setSelectedCategory] = useState('ageGroups');
  const [showFullData, setShowFullData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentData = demographicsData[selectedCategory as keyof typeof demographicsData];
  
  // Reset full data view when category changes
  React.useEffect(() => {
    setShowFullData(false);
    setSearchTerm('');
  }, [selectedCategory]);
  
  // Handle large dataset display logic
  const getDisplayData = () => {
    if (!(currentData as any).hasLargeDataset) {
      return currentData.chart;
    }
    
    if (showFullData) {
      const fullData = (currentData as any).fullData || currentData.chart;
      if (searchTerm) {
        return fullData.filter((item: any) => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return fullData;
    }
    
    return currentData.chart;
  };

  // Custom tooltip component for dark/light mode compatibility
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-3 rounded-lg shadow-lg border border-border">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name === 'Engagement %' || entry.name === 'Reach %' || entry.name === 'Saves %' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle chart interactions
  const handleChartClick = (data: any) => {
    if (data?.payload?.isOthers && (currentData as any).hasLargeDataset) {
      setShowFullData(!showFullData);
    }
  };

  const renderChart = () => {
    const displayData = getDisplayData();
    
    switch (currentData.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
                onClick={handleChartClick}
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        // Special handling for content types with multiple metrics
        if (selectedCategory === 'contentTypes') {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="engagement" fill="#9046FF" radius={[4, 4, 0, 0]} name="Engagement %" />
                <Bar dataKey="reach" fill="#EC4899" radius={[4, 4, 0, 0]} name="Reach %" />
                <Bar dataKey="saves" fill="#45E290" radius={[4, 4, 0, 0]} name="Saves %" />
              </BarChart>
            </ResponsiveContainer>
          );
        }
        // Standard bar chart for other categories
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#9046FF" radius={[4, 4, 0, 0]} onClick={handleChartClick} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={displayData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" fontSize={11} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
              <Radar
                name="Interest Score"
                dataKey="score"
                stroke="#9046FF"
                fill="#9046FF"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="#9046FF" strokeWidth={3} />
              <Line type="monotone" dataKey="comments" stroke="#EC4899" strokeWidth={2} />
              <Line type="monotone" dataKey="shares" stroke="#45E290" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Demographics Insights
            </h1>
            <p className="text-muted-foreground mt-2">
              Explore your audience data with interactive visualizations
            </p>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Data
          </Badge>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="px-6 pb-6">
        <div className="min-h-[600px] bg-card rounded-xl border shadow-xl">
          
          {/* Mobile-First Responsive Layout */}
          <div className="p-4 lg:p-6">
            
            {/* Mobile Category Menu - Horizontal Pills */}
            <div className="lg:hidden mb-6">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-card-foreground">Categories</h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
              
                             <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = selectedCategory === item.key;
                  
                  return (
                    <button
                      key={item.key}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-xs font-medium whitespace-nowrap
                        ${isSelected 
                          ? `bg-gradient-to-r ${item.color} text-white shadow-md` 
                          : 'bg-background text-foreground border border-border hover:border-purple-300 dark:hover:border-purple-700'
                        }
                      `}
                      onClick={() => setSelectedCategory(item.key)}
                    >
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Chart Area - Full width on mobile, 40% on desktop */}
              <div className="lg:col-span-5">
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold text-card-foreground mb-2">
                        {currentData.title}
                      </h2>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </div>
                    
                    {/* Large dataset controls - Mobile optimized */}
                    {(currentData as any).hasLargeDataset && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {showFullData && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Search..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="px-3 py-2 text-sm border rounded-md bg-background text-foreground w-full sm:w-auto"
                            />
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {getDisplayData().length} items
                            </Badge>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowFullData(!showFullData);
                            setSearchTerm('');
                          }}
                          className="text-xs whitespace-nowrap"
                        >
                          {showFullData ? 'Show Top 10' : 'Show All'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-background rounded-xl p-3 lg:p-4 border h-[300px] lg:h-[400px]">
                  {renderChart()}
                  
                  {/* Others click hint */}
                  {(currentData as any).hasLargeDataset && !showFullData && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        💡 Click "Others" to see all items
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insights Panel - Full width on mobile, 35% on desktop */}
              <div className="lg:col-span-4">
                <div className="mb-4">
                  <h3 className="text-lg lg:text-xl font-bold text-card-foreground mb-2">
                    Key Insights
                  </h3>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl p-4 lg:p-5 border border-purple-200/50 dark:border-purple-800/50 h-[300px] lg:h-[400px] overflow-y-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated 2 min ago
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-card-foreground leading-relaxed text-sm">
                      {currentData.insights}
                    </p>
                    
                    {/* Additional insight cards */}
                    <div className="space-y-3 mt-6">
                      <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Performance Tip
                          </span>
                        </div>
                        <p className="text-sm text-card-foreground">
                          This demographic shows high engagement rates. Consider creating more content targeted to this group.
                        </p>
                      </div>
                      
                      <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Growth Opportunity
                          </span>
                        </div>
                        <p className="text-sm text-card-foreground">
                          Expanding reach in underrepresented segments could increase overall audience diversity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Category Menu - Hidden on mobile */}
              <div className="hidden lg:block lg:col-span-3">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-card-foreground mb-2">
                    Categories
                  </h3>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
                
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = selectedCategory === item.key;
                    
                    return (
                      <button
                        key={item.key}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-left text-sm
                          ${isSelected 
                            ? `bg-gradient-to-r ${item.color} text-white shadow-md` 
                            : 'bg-background text-foreground hover:bg-muted border border-border hover:border-purple-300 dark:hover:border-purple-700'
                          }
                        `}
                        onClick={() => setSelectedCategory(item.key)}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramDemographics; 