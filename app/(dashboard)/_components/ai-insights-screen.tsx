'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, Target, TrendingUp, Users, Clock, Edit3, 
  Zap, Globe, Camera, Video, MessageCircle, Star
} from 'lucide-react'

export function AIInsightsScreen() {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          New insights available! We&apos;ve analyzed your latest content performance.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Content Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Best posting times: 6-8pm EST</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <span>Audience engagement up 25%</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span>Growth rate: +15% this month</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-red-500" />
                <span>Video content performing best</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>Top regions: US, UK, Canada</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-pink-500" />
                <span>Comment engagement: High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">Increase Video Content</h4>
                <p className="text-sm text-gray-600">Videos are getting 2x more engagement than images</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Edit3 className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Content Strategy</h4>
                <p className="text-sm text-gray-600">Focus on tutorial-style content</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 mt-1" />
              <div>
                <h4 className="font-medium">Engagement Opportunities</h4>
                <p className="text-sm text-gray-600">Respond to comments within 2 hours</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 