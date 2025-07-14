import React from 'react';
import InstagramDemographics from './InstagramDemographics';

// Example data structure based on the API response you provided
const exampleDemographicsData = {
  age_breakdown: [
    {
      metric: "engaged_audience_demographics",
      values: [
        { name: "13-17", value: 40 },
        { name: "18-24", value: 1838 },
        { name: "25-34", value: 1742 },
        { name: "35-44", value: 239 },
        { name: "45-54", value: 109 },
        { name: "55-64", value: 23 },
        { name: "65+", value: 2 },
      ],
    },
    {
      metric: "reached_audience_demographics",
      values: [
        { name: "13-17", value: 929 },
        { name: "18-24", value: 39565 },
        { name: "25-34", value: 21932 },
        { name: "35-44", value: 6761 },
        { name: "45-54", value: 17383 },
        { name: "55-64", value: 565 },
        { name: "65+", value: 251 },
      ],
    },
    {
      metric: "follower_demographics",
      values: [
        { name: "13-17", value: 58 },
        { name: "18-24", value: 1131 },
        { name: "25-34", value: 5859 },
        { name: "35-44", value: 2032 },
        { name: "45-54", value: 609 },
        { name: "55-64", value: 256 },
        { name: "65+", value: 94 },
      ],
    },
  ],
  city_breakdown: [
    {
      metric: "engaged_audience_demographics",
      values: [
        { name: "Los Angeles, California", value: 97 },
        { name: "New York, New York", value: 96 },
        { name: "San Diego, California", value: 100 },
        { name: "Chicago, Illinois", value: 28 },
        { name: "Houston, Texas", value: 35 },
        { name: "Phoenix, Arizona", value: 18 },
        { name: "Philadelphia, Pennsylvania", value: 19 },
        { name: "San Antonio, Texas", value: 18 },
        { name: "Dallas, Texas", value: 14 },
        { name: "San Jose, California", value: 30 },
      ],
    },
    {
      metric: "reached_audience_demographics",
      values: [
        { name: "Los Angeles, California", value: 1659 },
        { name: "New York, New York", value: 2594 },
        { name: "San Diego, California", value: 721 },
        { name: "Chicago, Illinois", value: 666 },
        { name: "Houston, Texas", value: 839 },
        { name: "Phoenix, Arizona", value: 413 },
        { name: "Philadelphia, Pennsylvania", value: 418 },
        { name: "San Antonio, Texas", value: 351 },
        { name: "Dallas, Texas", value: 358 },
        { name: "San Jose, California", value: 333 },
      ],
    },
  ],
  country_breakdown: [
    {
      metric: "engaged_audience_demographics",
      values: [
        { name: "US", value: 3242 },
        { name: "IN", value: 128 },
        { name: "CA", value: 48 },
        { name: "GB", value: 38 },
        { name: "TR", value: 36 },
        { name: "MX", value: 36 },
        { name: "ID", value: 32 },
        { name: "DE", value: 29 },
        { name: "UA", value: 23 },
        { name: "BR", value: 22 },
      ],
    },
    {
      metric: "reached_audience_demographics",
      values: [
        { name: "US", value: 72419 },
        { name: "IN", value: 3326 },
        { name: "TR", value: 1000 },
        { name: "CA", value: 900 },
        { name: "GB", value: 582 },
        { name: "RU", value: 569 },
        { name: "IR", value: 558 },
        { name: "MX", value: 537 },
        { name: "DE", value: 427 },
        { name: "AU", value: 418 },
      ],
    },
  ],
  gender_breakdown: [
    {
      metric: "engaged_audience_demographics",
      values: [
        { name: "F", value: 3190 },
        { name: "M", value: 116 },
        { name: "U", value: 687 },
      ],
    },
    {
      metric: "reached_audience_demographics",
      values: [
        { name: "F", value: 68416 },
        { name: "M", value: 1645 },
        { name: "U", value: 17325 },
      ],
    },
    {
      metric: "follower_demographics",
      values: [
        { name: "F", value: 6331 },
        { name: "M", value: 1273 },
        { name: "U", value: 2435 },
      ],
    },
  ],
  follow_type_breakdown: [
    {
      metric: "reach",
      values: [
        { name: "FOLLOWER", value: 419 },
        { name: "NON_FOLLOWER", value: 1189 },
      ],
    },
    {
      metric: "views",
      values: [
        { name: "UNKNOWN", value: 2 },
        { name: "FOLLOWER", value: 1642 },
        { name: "NON_FOLLOWER", value: 1578 },
      ],
    },
  ],
  media_product_type_breakdown: [
    {
      metric: "reach",
      values: [
        { name: "REEL", value: 551 },
        { name: "CAROUSEL_CONTAINER", value: 953 },
        { name: "STORY", value: 356 },
      ],
    },
    {
      metric: "total_interactions",
      values: [
        { name: "POST", value: 35 },
        { name: "REEL", value: 42 },
        { name: "STORY", value: 2 },
      ],
    },
    {
      metric: "likes",
      values: [
        { name: "POST", value: 29 },
        { name: "REEL", value: 31 },
      ],
    },
  ],
  profileData: {
    account_type: "BUSINESS",
    biography: "San Diego | LA Your aesthetic fashion, beauty + wellness bestie ౨ৎ  Chicana y Chingona 🇲🇽 💌 contactnicoleandrea@gmail.com",
    followers_count: 11218,
    follows_count: 4975,
    id: "30136954149284615",
    media_count: 1131,
    name: "Nicole Andrea",
    username: "nicoleandreaxo",
    website: "https://msha.ke/nicoleandreaxo",
  },
  updatedAt: 1752439257995,
};

// Example component showing how to use InstagramDemographics
const InstagramDemographicsExample: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Instagram Demographics Demo
          </h1>
          <p className="text-gray-600">
            This component visualizes Instagram audience demographics with interactive charts and insights.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg">
          <InstagramDemographics demographicsData={exampleDemographicsData} />
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">📊 Multiple Chart Types</h3>
              <p className="text-sm text-gray-600">
                Supports pie charts, bar charts, and interactive visualizations
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📱 Mobile-First Design</h3>
              <p className="text-sm text-gray-600">
                Responsive layout with horizontal scrolling on mobile devices
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🔍 Interactive Insights</h3>
              <p className="text-sm text-gray-600">
                Real-time insights and performance tips based on your data
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">🌍 Global Data Support</h3>
              <p className="text-sm text-gray-600">
                Handles countries, cities, and large datasets with search functionality
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
              <h3 className="font-semibold text-pink-800 mb-2">⚡ Performance Optimized</h3>
              <p className="text-sm text-gray-600">
                Lazy loading and efficient rendering for large datasets
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <h3 className="font-semibold text-indigo-800 mb-2">🎨 Beautiful UI</h3>
              <p className="text-sm text-gray-600">
                Modern gradient styling with smooth animations and transitions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramDemographicsExample; 