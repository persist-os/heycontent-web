import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface InstagramDemographicsData {
  age_breakdown: any[];
  gender_breakdown: any[];
  city_breakdown: any[];
  country_breakdown: any[];
  follow_type_breakdown: any[];
  media_product_type_breakdown: any[];
  profileData: any;
  updatedAt: number;
}

export const useInstagramDemographics = (userId?: string) => {
  const [demographicsData, setDemographicsData] = useState<InstagramDemographicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query Instagram account data
  const instagramAccount = useQuery(
    api.instagramQueries.getInstagramAccount,
    userId ? { userId } : "skip"
  );

  // Process and transform the data
  useEffect(() => {
    if (instagramAccount === undefined) {
      setLoading(true);
      return;
    }

    if (instagramAccount === null) {
      setError('No Instagram account found');
      setLoading(false);
      return;
    }

    try {
      // Transform the account data into the expected format
      const transformedData: InstagramDemographicsData = {
        age_breakdown: instagramAccount.age_breakdown || [],
        gender_breakdown: instagramAccount.gender_breakdown || [],
        city_breakdown: instagramAccount.city_breakdown || [],
        country_breakdown: instagramAccount.country_breakdown || [],
        follow_type_breakdown: instagramAccount.follow_type_breakdown || [],
        media_product_type_breakdown: instagramAccount.media_product_type_breakdown || [],
        profileData: instagramAccount.profileData || {},
        updatedAt: instagramAccount.updatedAt || Date.now()
      };

      setDemographicsData(transformedData);
      setError(null);
    } catch (err) {
      setError('Failed to process demographics data');
      console.error('Error processing Instagram demographics:', err);
    } finally {
      setLoading(false);
    }
  }, [instagramAccount]);

  // Check if we have any demographics data
  const hasData = demographicsData && (
    demographicsData.age_breakdown.length > 0 ||
    demographicsData.gender_breakdown.length > 0 ||
    demographicsData.city_breakdown.length > 0 ||
    demographicsData.country_breakdown.length > 0 ||
    demographicsData.follow_type_breakdown.length > 0 ||
    demographicsData.media_product_type_breakdown.length > 0
  );

  return {
    demographicsData,
    loading,
    error,
    hasData: Boolean(hasData)
  };
}; 