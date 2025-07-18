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
  ResponsiveContainer
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

// Data transformation utilities
const transformAgeData = (age_breakdown: any[]) => {
  const colors = ['#9046FF', '#B266FF', '#C285FF', '#EC4899', '#F97316', '#45E290'];
  return age_breakdown.map((breakdown, index) => ({
    metric: breakdown.metric,
    title: getMetricLabel(breakdown.metric),
    chart: breakdown.values.map((item: any, itemIndex: number) => ({
      name: item.name,
      value: item.value,
      color: colors[itemIndex % colors.length]
    })),
    type: 'bar' as const,
    insights: generateAgeInsights(breakdown.values)
  }));
};

const transformGenderData = (gender_breakdown: any[]) => {
  const genderColors = { 'F': '#EC4899', 'M': '#3B82F6', 'U': '#45E290' };
  const genderLabels = { 'F': 'Female', 'M': 'Male', 'U': 'Unknown' };
  
  return gender_breakdown.map(breakdown => ({
    metric: breakdown.metric,
    title: getMetricLabel(breakdown.metric),
    chart: breakdown.values.map((item: any) => ({
      name: genderLabels[item.name as keyof typeof genderLabels] || item.name,
      value: item.value,
      color: genderColors[item.name as keyof typeof genderColors] || '#6B7280'
    })),
    type: 'pie' as const,
    insights: generateGenderInsights(breakdown.values)
  }));
};

const transformLocationData = (location_breakdown: any[], type: 'city' | 'country') => {
  const colors = ['#9046FF', '#B266FF', '#C285FF', '#EC4899', '#F97316', '#45E290', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'];
  
  return location_breakdown.map(breakdown => ({
    metric: breakdown.metric,
    title: getMetricLabel(breakdown.metric),
    chart: breakdown.values
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
      .map((item: any, index: number) => ({
        name: type === 'country' ? getCountryName(item.name) : item.name,
        value: item.value,
        color: colors[index % colors.length]
      })),
    fullData: breakdown.values
      .sort((a: any, b: any) => b.value - a.value)
      .map((item: any, index: number) => ({
        name: type === 'country' ? getCountryName(item.name) : item.name,
        value: item.value,
        color: colors[index % colors.length]
      })),
    type: 'bar' as const,
    hasLargeDataset: breakdown.values.length > 10,
    insights: generateLocationInsights(breakdown.values, type)
  }));
};

const transformFollowTypeData = (follow_type_breakdown: any[]) => {
  const colors = ['#45E290', '#F97316', '#9046FF'];
  const labels = { 'FOLLOWER': 'Followers', 'NON_FOLLOWER': 'Non-Followers', 'UNKNOWN': 'Unknown' };
  
  return follow_type_breakdown.map(breakdown => ({
    metric: breakdown.metric,
    title: getMetricLabel(breakdown.metric),
    chart: breakdown.values.map((item: any, index: number) => ({
      name: labels[item.name as keyof typeof labels] || item.name,
      value: item.value,
      color: colors[index % colors.length]
    })),
    type: 'pie' as const,
    insights: generateFollowTypeInsights(breakdown.values)
  }));
};

const transformMediaTypeData = (media_product_type_breakdown: any[]) => {
  const colors = ['#EF4444', '#3B82F6', '#9046FF', '#45E290', '#F97316', '#EC4899'];
  const labels = { 
    'REEL': 'Reels', 
    'CAROUSEL_CONTAINER': 'Carousel Posts', 
    'POST': 'Photo Posts',
    'STORY': 'Stories',
    'IGTV': 'IGTV',
    'VIDEO': 'Video Posts'
  };
  
  return media_product_type_breakdown.map(breakdown => ({
    metric: breakdown.metric,
    title: getMetricLabel(breakdown.metric),
    chart: breakdown.values.map((item: any, index: number) => ({
      name: labels[item.name as keyof typeof labels] || item.name,
      value: item.value,
      color: colors[index % colors.length]
    })),
    type: 'bar' as const,
    insights: generateMediaTypeInsights(breakdown.values)
  }));
};

// Helper functions
const getMetricLabel = (metric: string) => {
  const labels = {
    'engaged_audience_demographics': 'Engaged Audience',
    'reached_audience_demographics': 'Reached Audience', 
    'follower_demographics': 'Followers',
    'reach': 'Reach',
    'views': 'Views',
    'total_interactions': 'Total Interactions',
    'likes': 'Likes',
    'comments': 'Comments',
    'shares': 'Shares',
    'saves': 'Saves'
  };
  return labels[metric as keyof typeof labels] || metric.replace(/_/g, ' ');
};

const getCountryName = (code: string) => {
  const countries = {
    'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'AU': 'Australia', 
    'DE': 'Germany', 'FR': 'France', 'BR': 'Brazil', 'IN': 'India', 'CN': 'China',
    'JP': 'Japan', 'KR': 'South Korea', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
    'MX': 'Mexico', 'TR': 'Turkey', 'RU': 'Russia', 'SA': 'Saudi Arabia', 'AE': 'UAE',
    'PH': 'Philippines', 'TH': 'Thailand', 'ID': 'Indonesia', 'MY': 'Malaysia', 'SG': 'Singapore',
    'NO': 'Norway', 'SE': 'Sweden', 'DK': 'Denmark', 'FI': 'Finland', 'CH': 'Switzerland',
    'AT': 'Austria', 'BE': 'Belgium', 'IE': 'Ireland', 'PT': 'Portugal', 'GR': 'Greece',
    'PL': 'Poland', 'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'BG': 'Bulgaria',
    'HR': 'Croatia', 'SI': 'Slovenia', 'SK': 'Slovakia', 'LT': 'Lithuania', 'LV': 'Latvia',
    'EE': 'Estonia', 'IS': 'Iceland', 'LU': 'Luxembourg', 'MT': 'Malta', 'CY': 'Cyprus',
    'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'NP': 'Nepal', 'BT': 'Bhutan',
    'MV': 'Maldives', 'AF': 'Afghanistan', 'IR': 'Iran', 'IQ': 'Iraq', 'SY': 'Syria',
    'LB': 'Lebanon', 'JO': 'Jordan', 'IL': 'Israel', 'PS': 'Palestine', 'KW': 'Kuwait',
    'BH': 'Bahrain', 'QA': 'Qatar', 'OM': 'Oman', 'YE': 'Yemen', 'EG': 'Egypt',
    'LY': 'Libya', 'TN': 'Tunisia', 'DZ': 'Algeria', 'MA': 'Morocco', 'SD': 'Sudan',
    'SS': 'South Sudan', 'ET': 'Ethiopia', 'ER': 'Eritrea', 'DJ': 'Djibouti', 'SO': 'Somalia',
    'KE': 'Kenya', 'UG': 'Uganda', 'TZ': 'Tanzania', 'RW': 'Rwanda', 'BI': 'Burundi',
    'MG': 'Madagascar', 'MU': 'Mauritius', 'SC': 'Seychelles', 'KM': 'Comoros',
    'ZA': 'South Africa', 'NA': 'Namibia', 'BW': 'Botswana', 'ZW': 'Zimbabwe',
    'ZM': 'Zambia', 'MW': 'Malawi', 'MZ': 'Mozambique', 'SZ': 'Eswatini', 'LS': 'Lesotho',
    'AO': 'Angola', 'CD': 'Democratic Republic of Congo', 'CG': 'Republic of Congo',
    'CM': 'Cameroon', 'CF': 'Central African Republic', 'TD': 'Chad', 'NE': 'Niger',
    'NG': 'Nigeria', 'BJ': 'Benin', 'TG': 'Togo', 'GH': 'Ghana', 'CI': 'Ivory Coast',
    'LR': 'Liberia', 'SL': 'Sierra Leone', 'GN': 'Guinea', 'GW': 'Guinea-Bissau',
    'SN': 'Senegal', 'GM': 'Gambia', 'ML': 'Mali', 'BF': 'Burkina Faso', 'MR': 'Mauritania',
    'CV': 'Cape Verde', 'ST': 'São Tomé and Príncipe', 'GQ': 'Equatorial Guinea', 'GA': 'Gabon',
    'AR': 'Argentina', 'CL': 'Chile', 'PE': 'Peru', 'BO': 'Bolivia', 'PY': 'Paraguay',
    'UY': 'Uruguay', 'CO': 'Colombia', 'VE': 'Venezuela', 'GY': 'Guyana', 'SR': 'Suriname',
    'EC': 'Ecuador', 'PA': 'Panama', 'CR': 'Costa Rica', 'NI': 'Nicaragua', 'HN': 'Honduras',
    'GT': 'Guatemala', 'BZ': 'Belize', 'SV': 'El Salvador', 'CU': 'Cuba', 'JM': 'Jamaica',
    'HT': 'Haiti', 'DO': 'Dominican Republic', 'PR': 'Puerto Rico', 'TT': 'Trinidad and Tobago',
    'BB': 'Barbados', 'GD': 'Grenada', 'VC': 'Saint Vincent and the Grenadines',
    'LC': 'Saint Lucia', 'DM': 'Dominica', 'AG': 'Antigua and Barbuda', 'KN': 'Saint Kitts and Nevis',
    'BS': 'Bahamas', 'VN': 'Vietnam', 'LA': 'Laos', 'KH': 'Cambodia', 'MM': 'Myanmar',
    'BN': 'Brunei', 'TL': 'East Timor', 'FJ': 'Fiji', 'PG': 'Papua New Guinea',
    'SB': 'Solomon Islands', 'VU': 'Vanuatu', 'NC': 'New Caledonia', 'PF': 'French Polynesia',
    'WS': 'Samoa', 'KI': 'Kiribati', 'TO': 'Tonga', 'MH': 'Marshall Islands',
    'FM': 'Federated States of Micronesia', 'PW': 'Palau', 'NR': 'Nauru', 'TV': 'Tuvalu',
    'NZ': 'New Zealand', 'UA': 'Ukraine', 'BY': 'Belarus', 'MD': 'Moldova', 'GE': 'Georgia',
    'AM': 'Armenia', 'AZ': 'Azerbaijan', 'KZ': 'Kazakhstan', 'KG': 'Kyrgyzstan',
    'TJ': 'Tajikistan', 'TM': 'Turkmenistan', 'UZ': 'Uzbekistan', 'MN': 'Mongolia',
    'HK': 'Hong Kong', 'MO': 'Macau', 'TW': 'Taiwan'
  };
  return countries[code as keyof typeof countries] || code;
};

// Insight generation functions
const generateAgeInsights = (values: any[]) => {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const youngAdults = values.filter(item => ['18-24', '25-34'].includes(item.name)).reduce((sum, item) => sum + item.value, 0);
  const percentage = Math.round((youngAdults / total) * 100);
  return `Your audience is ${percentage}% young adults (18-34), which is ideal for trendy content. This demographic shows high engagement rates and strong purchasing power.`;
};

const generateGenderInsights = (values: any[]) => {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const female = values.find(item => item.name === 'F')?.value || 0;
  const percentage = Math.round((female / total) * 100);
  return `Your audience is ${percentage}% female, which aligns well with beauty, fashion, and lifestyle content. Consider creating content that resonates with this demographic while maintaining inclusive messaging.`;
};

const generateLocationInsights = (values: any[], type: 'city' | 'country') => {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const topLocation = values.sort((a, b) => b.value - a.value)[0];
  const percentage = Math.round((topLocation.value / total) * 100);
  const locationName = type === 'country' ? getCountryName(topLocation.name) : topLocation.name;
  return `${locationName} represents your strongest market at ${percentage}% of your audience. This geographic concentration offers opportunities for localized content and partnerships.`;
};

const generateFollowTypeInsights = (values: any[]) => {
  const followerData = values.find(item => item.name === 'FOLLOWER');
  const nonFollowerData = values.find(item => item.name === 'NON_FOLLOWER');
  const total = values.reduce((sum, item) => sum + item.value, 0);
  
  if (followerData && nonFollowerData) {
    const followerPercentage = Math.round((followerData.value / total) * 100);
    return `${followerPercentage}% of your reach comes from existing followers, indicating strong content quality and audience loyalty. The remaining reach from non-followers shows good discoverability.`;
  }
  return 'Your content reaches both followers and non-followers, showing good organic growth potential.';
};

const generateMediaTypeInsights = (values: any[]) => {
  const sortedValues = values.sort((a, b) => b.value - a.value);
  const topType = sortedValues[0];
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const percentage = Math.round((topType.value / total) * 100);
  return `${topType.name} content performs best, representing ${percentage}% of your engagement. Consider creating more of this content type to maximize reach and engagement.`;
};

interface InstagramDemographicsProps {
  demographicsData: {
    age_breakdown: any[];
    gender_breakdown: any[];
    city_breakdown: any[];
    country_breakdown: any[];
    follow_type_breakdown: any[];
    media_product_type_breakdown: any[];
    profileData: any;
    updatedAt: number;
  };
}

const InstagramDemographics: React.FC<InstagramDemographicsProps> = ({ demographicsData }) => {
  const [selectedCategory, setSelectedCategory] = useState('age');
  const [selectedMetric, setSelectedMetric] = useState(0);
  const [showFullData, setShowFullData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Transform API data into chart format
  const processedData = React.useMemo(() => {
    return {
      age: transformAgeData(demographicsData.age_breakdown || []),
      gender: transformGenderData(demographicsData.gender_breakdown || []),
      cities: transformLocationData(demographicsData.city_breakdown || [], 'city'),
      countries: transformLocationData(demographicsData.country_breakdown || [], 'country'),
      followTypes: transformFollowTypeData(demographicsData.follow_type_breakdown || []),
      mediaTypes: transformMediaTypeData(demographicsData.media_product_type_breakdown || [])
    };
  }, [demographicsData]);

  // Menu items with data availability check
  const menuItems = [
    { key: 'age', label: 'Age Groups', icon: Users, color: 'from-purple-500 to-pink-500', available: processedData.age.length > 0 },
    { key: 'gender', label: 'Gender', icon: UserCheck, color: 'from-pink-500 to-rose-500', available: processedData.gender.length > 0 },
    { key: 'cities', label: 'Top Cities', icon: MapPin, color: 'from-blue-500 to-purple-500', available: processedData.cities.length > 0 },
    { key: 'countries', label: 'Countries', icon: Globe, color: 'from-green-500 to-blue-500', available: processedData.countries.length > 0 },
    { key: 'followTypes', label: 'Follow Types', icon: Target, color: 'from-amber-500 to-orange-500', available: processedData.followTypes.length > 0 },
    { key: 'mediaTypes', label: 'Media Types', icon: Camera, color: 'from-red-500 to-pink-500', available: processedData.mediaTypes.length > 0 }
  ].filter(item => item.available);

  // Get current data
  const currentDataSet = processedData[selectedCategory as keyof typeof processedData] || [];
  const currentData = currentDataSet[selectedMetric] || currentDataSet[0];

  // Reset states when category changes
  React.useEffect(() => {
    setSelectedMetric(0);
    setShowFullData(false);
    setSearchTerm('');
  }, [selectedCategory]);
  
  // Handle large dataset display logic
  const getDisplayData = () => {
    if (!currentData) return [];
    
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-3 rounded-lg shadow-lg border border-border">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
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

  // Render chart based on type
  const renderChart = () => {
    if (!currentData) return null;
    
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
                label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                outerRadius="65%"
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
      
      default:
        return null;
    }
  };

  if (!currentData) {
    return (
      <div className="w-full h-full bg-background relative overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Looks like you’re blazing a new trail—no demographics here yet, but that just means you’re ahead of the curve! Keep sharing your story—your audience is waiting to discover you!</p>
          </div>
        </div>
      </div>
    );
  }

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
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="px-6 pb-6">
        <div className="min-h-[600px]">
          
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

            {/* Metric Selection */}
            {currentDataSet.length > 1 && (
              <div className="mb-6">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-card-foreground">Metrics</h3>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentDataSet.map((data, index) => (
                    <button
                      key={index}
                      className={`
                        px-3 py-2 rounded-lg transition-all duration-300 text-xs font-medium whitespace-nowrap
                        ${selectedMetric === index 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                          : 'bg-background text-foreground border border-border hover:border-purple-300 dark:hover:border-purple-700'
                        }
                      `}
                      onClick={() => setSelectedMetric(index)}
                    >
                      {data.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                
                <div className="h-[300px] lg:h-[400px]">
                  {renderChart()}
                  
                  {/* Others click hint */}
                  {(currentData as any).hasLargeDataset && !showFullData && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        💡 Click "Show All" to see all items
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
                
                <div className="p-4 lg:p-5 h-[300px] lg:h-[400px] overflow-y-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(demographicsData.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-card-foreground leading-relaxed text-sm">
                      {currentData.insights}
                    </p>
                    
                    {/* Additional insight cards */}
                    <div className="space-y-3 mt-6">
                      <div className="p-3">
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
                      
                      <div className="p-3">
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