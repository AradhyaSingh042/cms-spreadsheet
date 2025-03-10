import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@mantine/core";

interface CellProps {
  value: string;
  isSelected: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
  onEditStateChange?: (editing: boolean) => void;
  rowHeight?: number;
  isHeader?: boolean;
}

export function Cell({
  value,
  isSelected,
  onChange,
  onSelect,
  onEditStateChange,
  rowHeight,
  isHeader,
}: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tdRef = useRef<HTMLTableCellElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Track double enter key press
  const lastEnterPressRef = useRef<number>(0);

  // Notify parent about edit state changes
  useEffect(() => {
    onEditStateChange?.(isEditing);
  }, [isEditing, onEditStateChange]);

  // Update edit value when external value changes (but not while editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || "");
    }
  }, [value, isEditing]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // When cell is no longer selected but was in edit mode, save changes
  useEffect(() => {
    if (!isSelected && isEditing) {
      // Use setTimeout to avoid React state update during render
      const timeoutId = setTimeout(() => {
        setIsEditing(false);
        onChange(editValue);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isSelected, isEditing, onChange, editValue]);

  // When cell becomes selected, ensure it gets focus
  useEffect(() => {
    if (isSelected && !isEditing && tdRef.current) {
      tdRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleDoubleClick = () => {
    if (isHeader) return;
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isHeader) return;

    if (isEditing) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // Use safer pattern for state updates
        const newValue = editValue;
        setIsEditing(false);
        onChange(newValue);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsEditing(false);
        setEditValue(value);
      } else if (e.key === "Tab") {
        e.preventDefault();
        const newValue = editValue;
        setIsEditing(false);
        onChange(newValue);
      }
      // Don't propagate any keyboard events while editing
      e.stopPropagation();
      return;
    }

    if (!isEditing) {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();

        // Check for double Enter press (within 500ms)
        const now = Date.now();
        if (now - lastEnterPressRef.current < 500) {
          // Double Enter - enter edit mode
          setIsEditing(true);
          // Reset timer
          lastEnterPressRef.current = 0;
        } else {
          // Single Enter - just select the cell (already done by parent)
          lastEnterPressRef.current = now;
        }
      }
      if (e.key && e.key.length === 1 && !value) {
        setIsEditing(true);
        setEditValue(e.key);
      }
    }
  };

  return (
    <td
      ref={tdRef}
      style={{
        border: "1px solid #e9ecef",
        padding: 0,
        position: "relative",
        overflow: "visible",
        minWidth: "120px",
        height: rowHeight ? `${rowHeight}px` : undefined,
        backgroundColor: isSelected
          ? "#f1f3f5"
          : isHeader
          ? "#f8f8f8"
          : "transparent",
        textAlign: isHeader ? "center" : "left",
      }}
      onClick={isHeader ? undefined : onSelect}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {isEditing ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 100,
            minWidth: "240px",
            maxWidth: "400px",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            borderRadius: "4px",
            padding: "4px",
          }}
        >
          <Textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.currentTarget.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              // For Enter, Escape, and Tab, use our handleKeyDown function
              if (["Enter", "Escape", "Tab"].includes(e.key)) {
                handleKeyDown(e);
              }
              // For all keys, prevent parent components from handling the event
              // This ensures arrow keys work for text navigation while editing
              e.stopPropagation();
            }}
            styles={{
              root: {
                width: "100%",
              },
              wrapper: {
                width: "100%",
              },
              input: {
                border: "none",
                borderRadius: "4px",
                padding: "8px",
                resize: "none",
                width: "100%",
                wordBreak: "break-word",
                lineHeight: "1.5",
                "&:focus": {
                  outline: "2px solid #228be6",
                  outlineOffset: -2,
                },
              },
            }}
            autosize
            minRows={2}
            maxRows={15}
          />
        </div>
      ) : (
        <div
          ref={contentRef}
          style={{
            padding: "8px",
            width: "100%",
            height: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "1.5",
            boxSizing: "border-box",
          }}
        >
          {value}
        </div>
      )}
    </td>
  );
}
