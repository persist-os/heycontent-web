import React from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Check } from 'lucide-react';
import { T } from '@/components/translation';

interface PricingCardProps {
  name: string;
  price: string;
  priceSubtext?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  popular?: boolean;
  annualPrice?: string;
  showAnnual?: boolean;
}

export function PricingCard({
  name,
  price,
  priceSubtext,
  description,
  features,
  ctaText,
  ctaLink,
  popular = false,
  annualPrice,
  showAnnual = false,
}: PricingCardProps) {
  const displayPrice = showAnnual && annualPrice ? annualPrice : price;
  const displaySubtext = showAnnual && annualPrice ? '/year' : priceSubtext;

  return (
    <Card className={`relative flex flex-col ${popular ? 'border-primary shadow-xl scale-105' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <T context="pricingCard.mostPopular">Most Popular</T>
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-8 pt-6">
        <CardTitle className="text-2xl font-bold">
          <T context={`pricingCard.${name.toLowerCase()}.name`}>{name}</T>
        </CardTitle>
        <div className="mt-4">
          <span className="text-5xl font-bold">{displayPrice}</span>
          {displaySubtext && (
            <span className="text-muted-foreground text-lg ml-2">
              <T context={`pricingCard.${showAnnual ? 'year' : 'month'}`}>{displaySubtext}</T>
            </span>
          )}
        </div>
        <CardDescription className="mt-4 text-base">
          <T context={`pricingCard.${name.toLowerCase()}.description`}>{description}</T>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">
                <T context={`pricingCard.${name.toLowerCase()}.feature${index + 1}`}>{feature}</T>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Link href={ctaLink} className="w-full">
          <Button 
            size="lg" 
            className="w-full"
            variant={popular ? 'default' : 'outline'}
          >
            <T context={`pricingCard.${name.toLowerCase()}.cta`}>{ctaText}</T>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
