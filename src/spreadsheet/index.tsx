import { useState, useEffect, useCallback, useRef } from "react";
import { Cell } from "./cell";
import { Paper, ActionIcon, Menu } from "@mantine/core";
import {
  TbDots,
  TbPlus,
  TbArrowDown,
  TbTrash,
  TbArrowUp,
} from "react-icons/tb";

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

  const rowCount = Array.isArray(rows)
    ? rows.length + (both ? 1 : 0)
    : Math.max(rows, value.length);
  const colCount = Array.isArray(cols)
    ? cols.length + (both ? 1 : 0)
    : Math.max(cols, value[0]?.length || 0);

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
  const spreadsheetRef = useRef<HTMLDivElement>(null);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      setData((prevData) => {
        const newData = prevData.map((r, i) =>
          i === row ? r.map((c, j) => (j === col ? value : c)) : r
        );
        onChange?.(newData);
        return newData;
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (!data.length) return;
    setRowHeights(data.map(() => 40)); // 40px fixed height for all rows
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

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      // Only process paste events when this spreadsheet has focus
      if (!spreadsheetRef.current?.contains(document.activeElement)) return;

      if (!selectedCell || activeEditing) return;

      const pastedText = e.clipboardData?.getData("text");
      if (!pastedText) return;

      const [startRow, startCol] = selectedCell;

      // If it's just a single value without delimiters, handle it as before
      if (
        !pastedText.includes("\t") &&
        !pastedText.includes(",") &&
        !pastedText.includes("\n")
      ) {
        handleCellChange(startRow, startCol, pastedText);
        return;
      }

      const pastedData = parsePastedData(pastedText);
      const newData = mergeDataAtPosition(data, pastedData, startRow, startCol);

      setData(newData);
      onChange?.(newData);

      e.preventDefault();
    },
    [selectedCell, activeEditing, data, onChange, handleCellChange]
  );

  // Add paste event listener
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  // Keyboard navigation events - scope to this component's ref
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process keyboard events when this spreadsheet has focus
      if (!spreadsheetRef.current?.contains(document.activeElement)) return;

      // Skip all keyboard navigation when a cell is being edited
      if (activeEditing) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveSelection(0, -1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveSelection(0, 1);
      } else if (e.key === "Tab") {
        e.preventDefault();
        moveSelection(0, e.shiftKey ? -1 : 1);
      } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
        if (selectedCell) {
          const [row, col] = selectedCell;
          const cellValue = data[row][col];
          setCopyBuffer(cellValue);
        }
      } else if (e.key === "v" && (e.ctrlKey || e.metaKey) && !activeEditing) {
        if (selectedCell && copyBuffer !== null) {
          const [row, col] = selectedCell;
          handleCellChange(row, col, copyBuffer);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeEditing,
    moveSelection,
    selectedCell,
    data,
    copyBuffer,
    handleCellChange,
  ]);

  const addRow = useCallback(
    (afterRow?: number, before: boolean = false) => {
      setData((prev) => {
        if (!prev.length || !prev[0]?.length) {
          return [[""]];
        }

        const newRow = Array(prev[0].length).fill("");
        const newData = [...prev];

        if (afterRow !== undefined) {
          const insertIndex = before ? afterRow : afterRow + 1;
          newData.splice(insertIndex, 0, newRow);
        } else {
          newData.push(newRow);
        }

        onChange?.(newData);
        return newData;
      });
    },
    [onChange]
  );

  const addColumn = useCallback(
    (afterCol?: number, before: boolean = false) => {
      setData((prev) => {
        if (!prev.length) {
          return [[""]];
        }

        const newData = prev.map((row) => {
          const newRow = [...row];
          if (afterCol !== undefined) {
            const insertIndex = before ? afterCol : afterCol + 1;
            newRow.splice(insertIndex, 0, "");
          } else {
            newRow.push("");
          }
          return newRow;
        });

        onChange?.(newData);
        return newData;
      });
    },
    [onChange]
  );

  const deleteRow = useCallback(
    (rowIndex: number) => {
      setData((prev) => {
        const newData = prev.filter((_, index) => index !== rowIndex);
        onChange?.(newData);
        return newData;
      });
    },
    [onChange]
  );

  const deleteColumn = useCallback(
    (colIndex: number) => {
      setData((prev) => {
        const newData = prev.map((row) =>
          row.filter((_, index) => index !== colIndex)
        );
        onChange?.(newData);
        return newData;
      });
    },
    [onChange]
  );

  const parsePastedData = (pastedString: string): string[][] => {
    // First try to detect if it's tab-separated or comma-separated
    const lines = pastedString
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim() !== "");
    let delimiter = "\t";

    // If no tabs found in first line, assume comma-separated
    if (!lines[0]?.includes("\t")) {
      delimiter = ",";
    }

    return lines.map((line) =>
      line.split(delimiter).map((cell) =>
        // Remove any quotes around the cell content and trim whitespace
        cell.replace(/^["'](.*)["']$/, "$1").trim()
      )
    );
  };

  const mergeDataAtPosition = (
    currentData: string[][],
    pastedData: string[][],
    startRow: number,
    startCol: number
  ): string[][] => {
    const newData = currentData.map((row) => [...row]);

    for (let i = 0; i < pastedData.length; i++) {
      const targetRow = startRow + i;
      if (targetRow >= newData.length) continue;

      for (let j = 0; j < pastedData[i].length; j++) {
        const targetCol = startCol + j;
        if (targetCol >= newData[targetRow].length) continue;

        // Skip header cells if they exist
        if (
          (Array.isArray(rows) && targetCol === 0) ||
          (Array.isArray(cols) && targetRow === 0)
        )
          continue;

        newData[targetRow][targetCol] = pastedData[i][j];
      }
    }

    return newData;
  };

  const handleCellEditStateChange = useCallback(
    (row: number, col: number, editing: boolean) => {
      // Use setTimeout to avoid state updates during render
      if (activeEditing !== editing) {
        setTimeout(() => {
          setActiveEditing(editing);
        }, 0);
      }
    },
    [activeEditing]
  );

  return (
    <Paper p="md" radius="sm" withBorder>
      <div style={{ width: "100%" }} ref={spreadsheetRef} tabIndex={0}>
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
              {!Array.isArray(rows) && <col style={{ width: "55px" }} />}
              {data[0]?.map((_, index) => (
                <col key={index} style={{ width: "120px" }} />
              ))}
            </colgroup>
            {!Array.isArray(cols) && (
              <thead>
                <tr>
                  {!Array.isArray(rows) && (
                    <td
                      style={{ width: "55px", border: "1px solid #e9ecef" }}
                    />
                  )}
                  {data[0]?.map((_, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        border: "1px solid #e9ecef",
                        backgroundColor: "#f8f8f8",
                        padding: 0,
                        height: "32px",
                      }}
                    >
                      {(!Array.isArray(rows) || colIndex > 0) && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-around",
                            gap: "4px",
                            minWidth: "55px",
                          }}
                        >
                          <ActionIcon
                            color="gray"
                            variant="subtle"
                            size="sm"
                            onClick={() => deleteColumn(colIndex)}
                          >
                            <TbTrash size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => addColumn(colIndex)}
                          >
                            <TbPlus size={14} />
                          </ActionIcon>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {!Array.isArray(rows) && (
                    <td
                      style={{
                        width: "55px",
                        border: "1px solid #e9ecef",
                        backgroundColor: "#f8f8f8",
                        padding: 0,
                        verticalAlign: "middle",
                        height: rowHeights[rowIndex]
                          ? `${rowHeights[rowIndex]}px`
                          : "32px",
                      }}
                    >
                      {(!Array.isArray(cols) || rowIndex > 0) && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                          }}
                        >
                          <Menu position="right-start" withArrow offset={8}>
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                color="gray"
                              >
                                <TbDots size={14} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<TbArrowUp size={14} />}
                                onClick={() => addRow(rowIndex, true)}
                              >
                                Add row above
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<TbArrowDown size={14} />}
                                onClick={() => addRow(rowIndex)}
                              >
                                Add row below
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<TbTrash size={14} />}
                                onClick={() => deleteRow(rowIndex)}
                                color="red"
                              >
                                Delete row
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </div>
                      )}
                    </td>
                  )}
                  {row.map((cell, colIndex) => (
                    <Cell
                      isHeader={
                        (rowIndex === 0 && Array.isArray(cols)) ||
                        (colIndex === 0 && Array.isArray(rows))
                      }
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
                        handleCellEditStateChange(rowIndex, colIndex, editing)
                      }
                      rowHeight={rowHeights[rowIndex]}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Paper>
  );
}
