import React from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Check } from 'lucide-react';

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
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-8 pt-6">
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <div className="mt-4">
          <span className="text-5xl font-bold">{displayPrice}</span>
          {displaySubtext && (
            <span className="text-muted-foreground text-lg ml-2">{displaySubtext}</span>
          )}
        </div>
        <CardDescription className="mt-4 text-base">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
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
            {ctaText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
