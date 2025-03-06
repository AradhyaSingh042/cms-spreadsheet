import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@mantine/core';

interface CellProps {
  value: string;
  isSelected: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
}

export function Cell({ value, isSelected, onChange, onSelect }: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tdRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isSelected) {
      tdRef.current?.focus();
    }
  }, [isSelected])

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing) {
      // Start editing if a printable character is typed
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {

        e.preventDefault();
        setIsEditing(true);
        setEditValue(value || '');
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  return (
    <td 
      ref={tdRef}
      style={{
        border: '1px solid #e9ecef',
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
        minWidth: '120px',
        backgroundColor: isSelected ? '#f1f3f5' : 'transparent'
      }}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {isEditing ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <Textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.currentTarget.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            styles={{
              root: { height: '100%', zIndex: 10 },
              input: {
                border: 'none',
                borderRadius: 0,
                padding: '4px 8px',
                resize: 'none',
                '&:focus': {
                  outline: '2px solid #228be6',
                  outlineOffset: -2
                }
              }
            }}
            variant="unstyled"
            autosize
            minRows={1}
          />
        </div>
      ) : (
        <div style={{ 
          padding: '4px 8px',
          height: '100%',
          width: '120px'
        }} className="truncate">
          {value}
        </div>
      )}
    </td>
  );
}