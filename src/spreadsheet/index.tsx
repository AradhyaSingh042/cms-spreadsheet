import React, { useState, useEffect, useCallback } from 'react';
import { Cell } from './Cell';
import { Paper, Button } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface SpreadsheetProps {
  rows?: number;
  cols?: number;
  value?: string[][];
  onChange?: (value: string[][]) => void;
}

function generateEmptyData(value: string[][], rows: number, cols: number): string[][] {
  rows = Math.max(rows, value.length);
  cols = Math.max(cols, value[0]?.length || 0);
  return Array.from({ length: rows }, (_, rowIndex) => 
    Array.from({ length: cols }, (_, colIndex) => value[rowIndex]?.[colIndex] ?? "")
  );
}

export default function Spreadsheet({ 
  rows = 10, 
  cols = 8,
  value,
  onChange,
}: SpreadsheetProps) {

  const [data, setData] = useState<string[][]>(() => {
    return generateEmptyData(value || [], rows, cols);
  });

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [copyBuffer, setCopyBuffer] = useState<string | null>(null);

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[row] = [...newData[row]];
      newData[row][col] = value;
      onChange && onChange(newData)
      return newData;
    });
  }, []);

  const moveSelection = useCallback((rowDelta: number, colDelta: number) => {
    setSelectedCell(prev => {
      if (!prev) return [0, 0];
      const [row, col] = prev;
      const newRow = Math.max(0, Math.min(data.length - 1, row + rowDelta));
      const newCol = Math.max(0, Math.min(data[0].length - 1, col + colDelta));
      return [newRow, newCol];
    });
  }, [data]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1, 0);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection(0, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveSelection(0, 1);
        break;
      case 'Tab':
        e.preventDefault();
        moveSelection(0, e.shiftKey ? -1 : 1);
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          setCopyBuffer(data[row][col]);
          e.preventDefault();
        }
        break;
      case 'v':
        if ((e.ctrlKey || e.metaKey) && copyBuffer) {
          handleCellChange(row, col, copyBuffer);
          e.preventDefault();
        }
        break;
    }
  }, [selectedCell, data, copyBuffer, handleCellChange, moveSelection]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const addRow = () => {
    setData(prev => [...prev, Array(prev[0].length).fill({ value: '' })]);
  };

  const addColumn = () => {
    setData(prev => prev.map(row => [...row, '']));
  };

  const deleteRow = (rowIndex: number) => {
    if (data.length <= 1) return;
    setData(prev => prev.filter((_, index) => index !== rowIndex));
  };

  const deleteColumn = (colIndex: number) => {
    if (data[0].length <= 1) return;
    setData(prev => prev.map(row => row.filter((_, index) => index !== colIndex)));
  };

  return (
    <Paper p="md" radius="sm" withBorder>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            leftSection={<IconPlus size={16} />}
          >
            Add Row
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addColumn}
            leftSection={<IconPlus size={16} />}
          >
            Add Column
          </Button>
        </div>

        <div style={{ position: 'relative', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <colgroup>
              {data[0].map((_, index) => (
                <col key={index} style={{ width: '120px' }} />
              ))}
              <col style={{ width: '40px' }} />
            </colgroup>
            <thead>
              <tr>
                {data[0].map((_, colIndex) => (
                  <td key={colIndex} style={{ border: '1px solid #e9ecef', padding: 0 }}>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      style={{ width: '100%', height: '32px' }}
                      onClick={() => deleteColumn(colIndex)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </td>
                ))}
                <td style={{ width: '40px', border: '1px solid #e9ecef' }} />
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <Cell
                      key={`${rowIndex}-${colIndex}`}
                      value={cell}
                      isSelected={selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex}
                      onChange={(value) => handleCellChange(rowIndex, colIndex, value)}
                      onSelect={() => setSelectedCell([rowIndex, colIndex])}
                    />
                  ))}
                  <td style={{ width: '40px', border: '1px solid #e9ecef', padding: 0, verticalAlign: 'middle' }}>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      style={{ width: '100%', minHeight: '32px' }}
                      onClick={() => deleteRow(rowIndex)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Paper>
  );
}