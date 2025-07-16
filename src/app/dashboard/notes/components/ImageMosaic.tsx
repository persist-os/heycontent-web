'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageData } from '../types';
import { cn } from '@/lib/utils';

interface ImageMosaicProps {
  images: ImageData[];
  onOpenGallery: (e: React.MouseEvent) => void;
  className?: string;
}

interface SingleImageProps {
  image: ImageData;
}

interface MultiImageProps {
  images: ImageData[];
}

interface QuadImageProps {
  images: ImageData[];
  remainingCount: number;
}

// Layout Components
const SingleImageLayout: React.FC<SingleImageProps> = ({ image }) => (
  <Image
    src={image.url}
    alt={image.originalFilename || image.filename || 'Note image'}
    width={400}
    height={192}
    loading="lazy"
    className="w-full max-h-48 object-scale-down rounded-lg bg-muted"
  />
);

const DualImageLayout: React.FC<MultiImageProps> = ({ images }) => (
  <div className="grid grid-cols-2 gap-1">
    {images.map((img, i) => (
      <Image
        key={img.filename || i}
        src={img.url}
        alt={img.originalFilename || img.filename || `Note image ${i + 1}`}
        width={200}
        height={128}
        loading="lazy"
        className="w-full max-h-32 object-scale-down bg-muted"
      />
    ))}
  </div>
);

const TrioImageLayout: React.FC<MultiImageProps> = ({ images }) => (
  <div className="grid grid-cols-3 gap-1">
    {images.map((img, i) => (
      <Image
        key={img.filename || i}
        src={img.url}
        alt={img.originalFilename || img.filename || `Note image ${i + 1}`}
        width={133}
        height={96}
        loading="lazy"
        className="w-full max-h-24 object-scale-down bg-muted"
      />
    ))}
  </div>
);

const QuadImageLayout: React.FC<QuadImageProps> = ({ images, remainingCount }) => (
  <div className="grid grid-cols-2 gap-1">
    {images.slice(0, 3).map((img, i) => (
      <Image
        key={img.filename || i}
        src={img.url}
        alt={img.originalFilename || img.filename || `Note image ${i + 1}`}
        width={200}
        height={96}
        loading="lazy"
        className="w-full max-h-24 object-scale-down bg-muted"
      />
    ))}
    <div className="relative bg-muted">
      <Image
        src={images[3].url}
        alt={images[3].originalFilename || images[3].filename || 'Note image 4'}
        width={200}
        height={96}
        loading="lazy"
        className="w-full max-h-24 object-scale-down"
      />
      {remainingCount > 0 && (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-sm font-medium rounded">
          +{remainingCount} more
        </div>
      )}
    </div>
  </div>
);

// Main Component
export const ImageMosaic: React.FC<ImageMosaicProps> = ({ 
  images, 
  onOpenGallery, 
  className 
}) => {
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const hasMoreThan4 = images.length > 4;
  
  // Get current set of images by rotating through them
  const getDisplayImages = () => {
    if (images.length <= 4) return images;
    
    // Create a rotated array starting from currentOffset
    const rotated = [];
    for (let i = 0; i < 4; i++) {
      rotated.push(images[(currentOffset + i) % images.length]);
    }
    return rotated;
  };
  
  const displayImages = getDisplayImages();

  // Auto-cycling effect - just increment offset
  useEffect(() => {
    if (!hasMoreThan4 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentOffset(prev => (prev + 1) % images.length);
    }, 2000); // 2 seconds per rotation

    return () => clearInterval(interval);
  }, [hasMoreThan4, isPaused, images.length]);

  const handleMouseEnter = () => {
    if (hasMoreThan4) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (hasMoreThan4) {
      setIsPaused(false);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer group",
        "transition-all duration-200 hover:shadow-sm",
        className
      )}
      onClick={onOpenGallery}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image content with fade transition */}
      <div className="transition-opacity duration-300">
        {displayImages.length === 1 && <SingleImageLayout image={displayImages[0]} />}
        {displayImages.length === 2 && <DualImageLayout images={displayImages} />}
        {displayImages.length === 3 && <TrioImageLayout images={displayImages} />}
        {displayImages.length === 4 && (
          <QuadImageLayout 
            images={displayImages} 
            remainingCount={hasMoreThan4 ? images.length - 4 : 0}
          />
        )}
      </div>

      {/* Total image count for cycling */}
      {hasMoreThan4 && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {images.length} images
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
    </div>
  );
}; 