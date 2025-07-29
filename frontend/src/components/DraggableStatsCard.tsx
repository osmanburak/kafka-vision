'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableStatsCardProps {
  id: string;
  children: React.ReactNode;
  dragText?: string;
}

export function DraggableStatsCard({ id, children, dragText = "Drag to reorder" }: DraggableStatsCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50 opacity-75' : ''}`}
    >
      {/* Drag Handle - More Visible */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing z-20 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded p-2 shadow-md"
        title={dragText}
      >
        <GripVertical size={16} className="text-gray-600 dark:text-gray-300" />
      </div>
      
      {/* Card Content */}
      <div className={`transition-all duration-200 ${isDragging ? 'shadow-xl scale-105 rotate-1' : ''} hover:shadow-md`}>
        {children}
      </div>
    </div>
  );
}