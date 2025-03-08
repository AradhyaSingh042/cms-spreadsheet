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

export function Cell({ value, isSelected, onChange, onSelect, onEditStateChange, rowHeight, isHeader }: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tdRef = useRef<HTMLTableCellElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    onEditStateChange?.(isEditing);
  }, [isEditing, onEditStateChange]);

  useEffect(() => {
    if (isSelected && !isEditing) {
      tdRef.current?.focus();
    }
  }, [isSelected, isEditing]);

  const handleDoubleClick = () => {
    if (isHeader) return;
    // Use setTimeout to avoid React render conflicts
    setTimeout(() => {
      setIsEditing(true);
      setEditValue(value);
    }, 0);
  };

  const handleBlur = () => {
    const newValue = editValue;
    setIsEditing(false);
    // Defer onChange to avoid React render conflicts
    setTimeout(() => {
      onChange(newValue);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isHeader) return;
    if (!isEditing) {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setTimeout(() => {
          setIsEditing(true);
          setEditValue(value || "");
        }, 0);
      }
      if (e.key && e.key.length === 1 && !value) {
        setIsEditing(true);
        setEditValue((prevValue) => prevValue + e.key);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newValue = editValue;
      setIsEditing(false);
      setTimeout(() => {
        onChange(newValue);
      }, 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setEditValue(value);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const newValue = editValue;
      setIsEditing(false);
      setTimeout(() => {
        onChange(newValue);
      }, 0);
    }

    if (isEditing && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.stopPropagation();
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
        backgroundColor: isSelected ? "#f1f3f5" : isHeader ? "#f8f8f8" : "transparent",
        textAlign: isHeader ? "center" : "left",
      }}
      onClick={isHeader ? undefined : onSelect}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}>
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
          }}>
          <Textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.currentTarget.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
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
          }}>
          {value}
        </div>
      )}
    </td>
  );
}
