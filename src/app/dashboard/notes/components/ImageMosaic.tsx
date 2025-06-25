'use client';

import React from 'react';
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
  <img
    src={image.url}
    alt={image.originalFilename || image.filename || 'Note image'}
    loading="lazy"
    className="w-full h-full object-cover rounded-lg"
  />
);

const DualImageLayout: React.FC<MultiImageProps> = ({ images }) => (
  <div className="grid grid-cols-2 gap-1 h-full">
    {images.map((img, i) => (
      <img
        key={img.filename || i}
        src={img.url}
        alt={img.originalFilename || img.filename || `Note image ${i + 1}`}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    ))}
  </div>
);

const TrioImageLayout: React.FC<MultiImageProps> = ({ images }) => (
  <div className="grid grid-cols-2 gap-1 h-full">
    <div className="row-span-2">
      <img
        src={images[0].url}
        alt={images[0].originalFilename || images[0].filename || 'Note image 1'}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="grid grid-rows-2 gap-1">
      <img
        src={images[1].url}
        alt={images[1].originalFilename || images[1].filename || 'Note image 2'}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <img
        src={images[2].url}
        alt={images[2].originalFilename || images[2].filename || 'Note image 3'}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
);

const QuadImageLayout: React.FC<QuadImageProps> = ({ images, remainingCount }) => (
  <div className="grid grid-cols-2 gap-1 h-full">
    {images.slice(0, 3).map((img, i) => (
      <img
        key={img.filename || i}
        src={img.url}
        alt={img.originalFilename || img.filename || `Note image ${i + 1}`}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    ))}
    <div className="relative">
      <img
        src={images[3].url}
        alt={images[3].originalFilename || images[3].filename || 'Note image 4'}
        loading="lazy"
        className="w-full h-full object-cover"
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
  const previewImages = images.slice(0, 4);

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer group",
        "aspect-[3/2] sm:aspect-[4/3]",
        "transition-all duration-200 hover:shadow-sm",
        className
      )}
      onClick={onOpenGallery}
    >
      {previewImages.length === 1 && <SingleImageLayout image={previewImages[0]} />}
      {previewImages.length === 2 && <DualImageLayout images={previewImages} />}
      {previewImages.length === 3 && <TrioImageLayout images={previewImages} />}
      {previewImages.length >= 4 && (
        <QuadImageLayout 
          images={previewImages} 
          remainingCount={images.length - 4} 
        />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
    </div>
  );
}; 