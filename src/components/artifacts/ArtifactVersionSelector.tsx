"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ArtifactVersionSelectorProps {
  artifactId: Id<"artifacts">;
  currentVersion: number;
  onVersionChange: (versionNumber: number) => void;
}

export function ArtifactVersionSelector({
  artifactId,
  currentVersion,
  onVersionChange,
}: ArtifactVersionSelectorProps) {
  const versions = useQuery(
    api.artifactVersionQueries.getArtifactVersions,
    { artifactId, limit: 100 }
  );

  if (!versions) {
    return <div className="text-sm text-muted-foreground">Loading versions...</div>;
  }

  if (versions.length === 0) {
    return null; // Don't show selector if no versions
  }

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <span className="hidden md:inline text-sm text-muted-foreground">Version:</span>
      <Select
        value={currentVersion.toString()}
        onValueChange={(value) => onVersionChange(parseInt(value))}
      >
        <SelectTrigger 
          className="w-[90px] md:w-[120px] min-h-[44px] text-xs md:text-sm"
          aria-label="Select artifact version"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem 
              key={version._id} 
              value={version.versionNumber.toString()}
              className="min-h-[44px] text-xs md:text-sm"
            >
              v{version.versionNumber}
              {version.isLatest && " (latest)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

