import { useState, useEffect, useCallback, useRef } from "react";
import { Cell } from "./Cell";
import { Paper, Button } from "@mantine/core";
import { TbPlus, TbTrash } from "react-icons/tb";

interface SpreadsheetProps {
  rows?: number | string[];
  cols?: number | string[];
  value?: string[][];
  onChange?: (value: string[][]) => void;
}

function generateEmptyData(
  value: string[][],
  rows: number | string[],
  cols: number | string[]
): string[][] {

    const both = Array.isArray(rows) && Array.isArray(cols);

    const rowCount = Array.isArray(rows) ? rows.length + (both ? 1 : 0) : Math.max(rows, value.length);
    const colCount = Array.isArray(cols) ? cols.length + (both ? 1 : 0) : Math.max(cols, value[0]?.length || 0);

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) => {
      if (Array.isArray(rows) && colIndex === 0) {
        return both ? rows[rowIndex - 1] ?? "" : rows[rowIndex] ?? "";
      }
      if (Array.isArray(cols) && rowIndex === 0) {
        return both ? cols[colIndex - 1] ?? "" : cols[colIndex] ?? "";
      }
      return value[rowIndex]?.[colIndex] ?? "";
    })
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

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [copyBuffer, setCopyBuffer] = useState<string | null>(null);
  const [activeEditing, setActiveEditing] = useState<boolean>(false);
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      setData((prevData) => {
        const newData = [...prevData];
        const newRow = [...newData[row]];
        newRow[col] = value;
        newData[row] = newRow;
        onChange?.(newData);
        return newData;
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (!data.length) return;

    // Use a fixed height for all rows
    const heights = data.map(() => 40); // 40px fixed height for all rows
    setRowHeights(heights);
  }, [data]);

  const moveSelection = useCallback(
    (rowDelta: number, colDelta: number) => {
      setSelectedCell((prev) => {
        if (!prev) return [0, 0];
        const [row, col] = prev;
        const newRow = Math.max(0, Math.min(data.length - 1, row + rowDelta));
        const newCol = Math.max(
          0,
          Math.min((data[0]?.length || 1) - 1, col + colDelta)
        );
        return [newRow, newCol];
      });
    },
    [data]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activeEditing) return;

      if (!selectedCell) return;
      const [row, col] = selectedCell;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveSelection(-1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveSelection(1, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveSelection(0, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveSelection(0, 1);
          break;
        case "Tab":
          e.preventDefault();
          moveSelection(0, e.shiftKey ? -1 : 1);
          break;
        case "c":
          if (e.ctrlKey || e.metaKey) {
            setCopyBuffer(data[row][col]);
            e.preventDefault();
          }
          break;
        case "v":
          if ((e.ctrlKey || e.metaKey) && copyBuffer !== null) {
            handleCellChange(row, col, copyBuffer);
            e.preventDefault();
          }
          break;
      }
    },
    [
      selectedCell,
      data,
      copyBuffer,
      handleCellChange,
      moveSelection,
      activeEditing,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const addRow = () => {
    setData((prev) => {
      if (!prev.length || !prev[0]?.length) {
        return [[""]];
      }
      return [...prev, Array(prev[0].length).fill("")];
    });
  };

  const addColumn = () => {
    setData((prev) => {
      if (!prev.length) {
        return [[""]];
      }
      return prev.map((row) => [...row, ""]);
    });
  };

  const deleteRow = (rowIndex: number) => {
    if (data.length <= 1) return;
    setData((prev) => prev.filter((_, index) => index !== rowIndex));
  };

  const deleteColumn = (colIndex: number) => {
    if (data[0]?.length <= 1) return;
    setData((prev) =>
      prev.map((row) => row.filter((_, index) => index !== colIndex))
    );
  };

  return (
    <Paper p="md" radius="sm" withBorder>
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            leftSection={<TbPlus size={16} />}
          >
            Add Row
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addColumn}
            leftSection={<TbPlus size={16} />}
          >
            Add Column
          </Button>
        </div>

        <div style={{ position: "relative", overflowX: "auto" }}>
          <table
            ref={tableRef}
            style={{
              borderCollapse: "collapse",
              width: "100%",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              {data[0]?.map((_, index) => (
                <col key={index} style={{ width: "120px" }} />
              ))}
              <col style={{ width: "40px" }} />
            </colgroup>
            {!Array.isArray(cols) && <thead>
              <tr>
                {data[0]?.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      border: "1px solid #e9ecef",
                      padding: 0,
                      height: "32px",
                    }}
                  >
                    {(!Array.isArray(rows) || colIndex > 0) && <Button
                      variant="subtle"
                      size="compact-sm"
                      style={{ width: "100%", height: "32px" }}
                      onClick={() => deleteColumn(colIndex)}
                    >
                      <TbTrash size={16} />
                    </Button>}
                  </td>
                ))}
                <td style={{ width: "40px", border: "1px solid #e9ecef" }} />
              </tr>
            </thead> }
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <Cell
                      isHeader={(rowIndex === 0 && Array.isArray(cols)) || (colIndex === 0 && Array.isArray(rows))}
                      key={`${rowIndex}-${colIndex}`}
                      value={cell}
                      isSelected={
                        selectedCell?.[0] === rowIndex &&
                        selectedCell?.[1] === colIndex
                      }
                      onChange={(value) =>
                        handleCellChange(rowIndex, colIndex, value)
                      }
                      onSelect={() => setSelectedCell([rowIndex, colIndex])}
                      onEditStateChange={(editing: boolean) =>
                        setActiveEditing(editing)
                      }
                      rowHeight={rowHeights[rowIndex]}
                    />
                  ))}
                  { !Array.isArray(rows) && <td
                    style={{
                      width: "40px",
                      border: "1px solid #e9ecef",
                      padding: 0,
                      verticalAlign: "middle",
                      height: rowHeights[rowIndex]
                        ? `${rowHeights[rowIndex]}px`
                        : "32px",
                    }}
                  >
                    {(!Array.isArray(cols) || rowIndex > 0) && <Button
                      variant="subtle"
                      size="compact-sm"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "32px",
                      }}
                      onClick={() => deleteRow(rowIndex)}
                    >
                      <TbTrash size={16} />
                    </Button>}
                  </td> }
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Paper>
  );
}
