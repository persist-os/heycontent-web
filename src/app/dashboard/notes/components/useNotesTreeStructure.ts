'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Note } from '../types';
import { Project } from '../types/project';
import { Folder as FolderType } from '../hooks/useFolders';
import { TreeNode, FilterType } from './NotesTree.types';

interface UseNotesTreeStructureProps {
  notes: Note[];
  projects?: Project[];
  searchTerm: string;
  selectedFilter: FilterType;
  firebaseUserId?: string;
  getFoldersByParent: (parentFolderId?: any) => FolderType[];
}

export function useNotesTreeStructure({
  notes,
  projects = [],
  searchTerm,
  selectedFilter,
  firebaseUserId,
  getFoldersByParent
}: UseNotesTreeStructureProps) {
  
  // Get shared notes
  const sharedNotes = useQuery(
    api.noteSharing.getSharedNotes,
    firebaseUserId ? { userId: firebaseUserId } : 'skip'
  );
  
  // Get content shared by current user
  const mySharedContent = useQuery(
    api.contentSharingQueries.getMySharedContent,
    firebaseUserId ? { userId: firebaseUserId, contentType: 'note' } : 'skip'
  );

  const treeStructure = useMemo(() => {
    const filteredNotes = notes.filter(note => {
      const matchesSearch = !searchTerm || 
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = selectedFilter === 'all' || 
        (selectedFilter === 'important' && note.important) ||
        (selectedFilter === 'recent' && Date.now() - note.updatedAt < 7 * 24 * 60 * 60 * 1000) ||
        (selectedFilter === 'projects' && note.type === 'project') ||
        (selectedFilter === 'shared' && note.isSharedWithMe) ||
        (selectedFilter === 'my-shared' && note.isShared) ||
        (selectedFilter === 'folders' && note.folderId);
      
      return matchesSearch && matchesFilter;
    });

    const tree: TreeNode[] = [];
    
    // Recent notes (last 7 days)
    const recentNotes = filteredNotes
      .filter(note => Date.now() - note.updatedAt < 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);
    
    if (recentNotes.length > 0) {
      tree.push({
        id: 'recent',
        type: 'folder',
        title: 'Recent',
        count: recentNotes.length,
        level: 0,
        children: recentNotes.map(note => ({
          id: note._id,
          type: 'note' as const,
          title: note.title || 'Untitled',
          note,
          level: 1,
          children: []
        }))
      });
    }

    // Shared with me notes
    if (sharedNotes && sharedNotes.length > 0) {
      const sharedByOwner = new Map<string, typeof sharedNotes>();
      sharedNotes.forEach(note => {
        const ownerKey = `${note.ownerId}-${note.ownerName}`;
        if (!sharedByOwner.has(ownerKey)) {
          sharedByOwner.set(ownerKey, []);
        }
        sharedByOwner.get(ownerKey)!.push(note);
      });

      const sharedChildren: TreeNode[] = [];
      
      if (sharedByOwner.size === 1) {
        const [ownerNotes] = Array.from(sharedByOwner.values());
        sharedChildren.push(...ownerNotes.map(sharedNote => ({
          id: `shared-${sharedNote._id}`,
          type: 'note' as const,
          title: sharedNote.title || 'Untitled',
          note: {
            ...sharedNote,
            userId: sharedNote.ownerId,
            isSharedWithMe: true,
            ownerName: sharedNote.ownerName,
            ownerId: sharedNote.ownerId,
            permission: sharedNote.permission,
            sharedAt: sharedNote.sharedAt,
          } as Note,
          level: 1,
          children: []
        })));
      } else {
        Array.from(sharedByOwner.entries())
          .sort(([, a], [, b]) => b[0].sharedAt - a[0].sharedAt)
          .forEach(([ownerKey, ownerNotes]) => {
            const ownerName = ownerNotes[0].ownerName;
            sharedChildren.push({
              id: `shared-owner-${ownerKey}`,
              type: 'folder',
              title: `${ownerName} (${ownerNotes.length})`,
              count: ownerNotes.length,
              level: 1,
              children: ownerNotes.map(sharedNote => ({
                id: `shared-${sharedNote._id}`,
                type: 'note' as const,
                title: sharedNote.title || 'Untitled',
                note: {
                  ...sharedNote,
                  userId: sharedNote.ownerId,
                  isSharedWithMe: true,
                  ownerName: sharedNote.ownerName,
                  ownerId: sharedNote.ownerId,
                  permission: sharedNote.permission,
                  sharedAt: sharedNote.sharedAt,
                } as Note,
                level: 2,
                children: []
              }))
            });
          });
      }

      tree.push({
        id: 'shared',
        type: 'folder',
        title: 'Shared with me',
        count: sharedNotes.length,
        level: 0,
        children: sharedChildren
      });
    }

    // Important notes
    const importantNotes = filteredNotes
      .filter(note => note.important)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (importantNotes.length > 0) {
      tree.push({
        id: 'important',
        type: 'folder',
        title: 'Starred',
        count: importantNotes.length,
        level: 0,
        droppableType: 'starred',
        children: importantNotes.map(note => ({
          id: note._id,
          type: 'note' as const,
          title: note.title || 'Untitled',
          note,
          level: 1,
          children: []
        }))
      });
    }

    // Projects - always show this folder even if empty
    const filteredProjects = projects?.filter(project => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return project.name?.toLowerCase().includes(searchLower) ||
             project.description?.toLowerCase().includes(searchLower);
    }).sort((a, b) => b.updatedAt - a.updatedAt) || [];
    
    tree.push({
      id: 'projects',
      type: 'folder',
      title: 'Projects',
      count: filteredProjects.length,
      level: 0,
      children: filteredProjects.map(project => ({
        id: project._id,
        type: 'project' as const,
        title: project.name || 'Untitled Project',
        project,
        level: 1,
        children: [],
        droppableType: 'project',
        projectId: project._id
      }))
    });

    // User-created folders
    const buildFolderTree = (parentFolderId?: string, level = 1): TreeNode[] => {
      const folderChildren = getFoldersByParent(parentFolderId as any);
      return folderChildren.map(folder => {
        const folderNotes = filteredNotes.filter(note => note.folderId === folder._id);
        const subfolders = buildFolderTree(folder._id, level + 1);
        
        return {
          id: folder._id,
          type: 'user-folder' as const,
          title: folder.name,
          folder,
          level,
          count: folderNotes.length + subfolders.length,
          droppableType: 'user-folder',
          folderId: folder._id,
          children: [
            ...subfolders,
            ...folderNotes.map(note => ({
              id: `folder-${folder._id}-${note._id}`,
              type: 'note' as const,
              title: note.title || 'Untitled',
              note,
              level: level + 1,
              children: []
            }))
          ]
        };
      });
    };

    const rootFolders = buildFolderTree();
    if (rootFolders.length > 0) {
      tree.push({
        id: 'user-folders',
        type: 'folder',
        title: 'Folders',
        count: rootFolders.length,
        level: 0,
        children: rootFolders
      });
    }

    // Group by tags
    const tagGroups = new Map<string, Note[]>();
    filteredNotes.forEach(note => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
          tagGroups.get(tag)!.push(note);
        });
      }
    });

    if (tagGroups.size > 0) {
      const tagChildren: TreeNode[] = [];
      Array.from(tagGroups.entries())
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 8) // Show top 8 tags
        .forEach(([tag, tagNotes]) => {
        tagChildren.push({
          id: `tag-${tag}`,
          type: 'folder',
          title: tag,
          count: tagNotes.length,
          level: 1,
          droppableType: 'tag',
          tagName: tag,
          children: tagNotes
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map(note => ({
              id: `${tag}-${note._id}`,
              type: 'note' as const,
              title: note.title || 'Untitled',
              note,
              level: 2,
              children: []
            }))
        });
        });

      tree.push({
        id: 'tags',
        type: 'folder',
        title: 'Tags',
        count: tagGroups.size,
        level: 0,
        children: tagChildren
      });
    }

    // My shared content
    if (mySharedContent && mySharedContent.length > 0) {
      tree.push({
        id: 'my-shared',
        type: 'folder',
        title: 'My shared content',
        count: mySharedContent.length,
        level: 0,
        children: mySharedContent.map(sharedItem => ({
          id: `my-shared-${sharedItem._id}`,
          type: 'note' as const,
          title: sharedItem.title || 'Untitled',
          note: {
            _id: sharedItem._id,
            _creationTime: sharedItem.createdAt,
            userId: firebaseUserId || '',
            title: sharedItem.title,
            content: sharedItem.content,
            createdAt: sharedItem.createdAt,
            updatedAt: sharedItem.updatedAt,
            type: sharedItem.type,
            tags: sharedItem.tags || [],
            important: sharedItem.important,
            isShared: true,
            sharedWithCount: sharedItem.sharedWithCount,
            sharedUsers: sharedItem.sharedUsers,
          } as Note,
          level: 1,
          children: []
        }))
      });
    }

    // All other notes
    const otherNotes = filteredNotes
      .filter(note => 
        !note.important && 
        Date.now() - note.updatedAt >= 7 * 24 * 60 * 60 * 1000 &&
        note.type !== 'project' &&
        !note.isSharedWithMe // Exclude shared notes from "All Notes" section
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);

    if (otherNotes.length > 0) {
      tree.push({
        id: 'all',
        type: 'folder',
        title: 'All Notes',
        count: otherNotes.length,
        level: 0,
        droppableType: 'all-notes',
        children: otherNotes.map(note => ({
          id: `all-${note._id}`,
          type: 'note' as const,
          title: note.title || 'Untitled',
          note,
          level: 1,
          children: []
        }))
      });
    }

    return tree;
  }, [notes, projects, searchTerm, selectedFilter, sharedNotes, mySharedContent, getFoldersByParent, firebaseUserId]);

  return {
    treeStructure,
    sharedNotes,
    mySharedContent
  };
}
