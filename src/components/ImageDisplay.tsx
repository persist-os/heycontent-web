"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Image from "next/image";
import { useState } from "react";
import { Trash2, Edit3, X, Check } from "lucide-react";

interface ImageDisplayProps {
  noteId?: string;
  showUserImages?: boolean; // Show all user images instead of note-specific
  onImageDeleted?: () => void;
  className?: string;
}

export default function ImageDisplay({ 
  noteId, 
  showUserImages = false,
  onImageDeleted,
  className = ""
}: ImageDisplayProps) {
  console.log('ImageDisplay render:', { noteId, showUserImages, hasClassName: !!className });
  
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  
  // Query images based on whether we want note-specific or all user images
  const images = useQuery(
    showUserImages 
      ? api.images.getImagesByUser 
      : api.images.getImagesByNote, 
    showUserImages ? {} : { noteId: noteId as any }
  );
  
  console.log('ImageDisplay query result:', { images, length: images?.length });
  
  if (images && images.length > 0) {
    console.log('First image data:', images[0]);
    console.log('Image URLs:', images.map(img => ({ id: img._id, url: img.url, filename: img.filename })));
  }
  
  const deleteImage = useMutation(api.images.deleteImage);
  const updateCaption = useMutation(api.images.updateImageCaption);

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await deleteImage({ imageId: imageId as any });
      onImageDeleted?.();
    } catch (error) {
      console.error("Failed to delete image:", error);
      alert("Failed to delete image. Please try again.");
    }
  };

  const handleEditCaption = (imageId: string, currentCaption: string) => {
    setEditingCaption(imageId);
    setCaptionValue(currentCaption || "");
  };

  const handleSaveCaption = async (imageId: string) => {
    try {
      await updateCaption({ 
        imageId: imageId as any, 
        caption: captionValue 
      });
      setEditingCaption(null);
      setCaptionValue("");
    } catch (error) {
      console.error("Failed to update caption:", error);
      alert("Failed to update caption. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingCaption(null);
    setCaptionValue("");
  };

  if (!images || images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p className="text-sm">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} style={{ backgroundColor: 'red', border: '5px solid blue', padding: '20px' }}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700" style={{ color: 'white', fontSize: '20px' }}>
          🚨 IMAGES SECTION - {showUserImages ? 'All Images' : 'Images'} ({images.length})
        </h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={image.url}
                alt={image.filename}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              
              {/* Action buttons overlay */}
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => handleEditCaption(image._id, image.caption || "")}
                  className="p-1.5 bg-white/80 hover:bg-white rounded-md shadow-sm transition-colors"
                  title="Edit caption"
                >
                  <Edit3 className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(image._id)}
                  className="p-1.5 bg-white/80 hover:bg-white rounded-md shadow-sm transition-colors"
                  title="Delete image"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </button>
              </div>
            </div>
            
            {/* Image info and caption */}
            <div className="p-3">
              <div className="mb-2">
                <p className="text-xs text-gray-500 truncate" title={image.filename}>
                  {image.filename}
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round(image.size / 1024)} KB • {new Date(image.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              
              {/* Caption editing */}
              {editingCaption === image._id ? (
                <div className="space-y-2">
                  <textarea
                    value={captionValue}
                    onChange={(e) => setCaptionValue(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full text-xs p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <div className="flex justify-end space-x-1">
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSaveCaption(image._id)}
                      className="p-1 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => handleEditCaption(image._id, image.caption || "")}
                  className="cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                >
                  {image.caption ? (
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {image.caption}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Click to add caption...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 