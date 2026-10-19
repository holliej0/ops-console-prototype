import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  /** How to show the cell. Defaults to the raw value of row[key]. */
  render?: (row: T) => ReactNode;
  /** Value used for sorting. Leave out to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  /** Right-aligns numbers so they line up. */
  numeric?: boolean;
}

export interface DataTableProps<T> {
  caption: string;
  /** Hide the caption visually when a page heading already labels the table. */
  hideCaption?: boolean;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  loading?: boolean;
  /** What to show when there are no rows. Say why and what to do next. */
  emptyState?: ReactNode;
  initialSort?: { key: string; direction: "ascending" | "descending" };
}

export function DataTable<T>({
  caption,
  hideCaption,
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  loading = false,
  emptyState = "No results.",
  initialSort,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.direction === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [rows, columns, sort]);

  const toggleSort = (key: string) =>
    setSort((s) => ({
      key,
      direction: s?.key === key && s.direction === "ascending" ? "descending" : "ascending",
    }));

  // Rows open with Enter or Space as well as a click, so the table works without a mouse.
  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div className="rds-table-wrap">
      <table className="rds-table" aria-busy={loading || undefined}>
        <caption className={hideCaption ? "rds-visually-hidden" : undefined}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={c.numeric ? "rds-num" : undefined}
                  aria-sort={active ? sort!.direction : c.sortValue ? "none" : undefined}
                >
                  {c.sortValue ? (
                    <button type="button" className="rds-sort" onClick={() => toggleSort(c.key)}>
                      {c.header}
                      <span className="rds-sort__icon" aria-hidden="true">
                        {active ? (sort!.direction === "ascending" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((c) => (
                  <td key={c.key}>
                    <span className="rds-skeleton" style={{ width: `${50 + ((i * 17 + c.key.length * 7) % 40)}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="rds-table__state">
                {emptyState}
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const k = rowKey(row);
              return (
                <tr
                  key={k}
                  className={onRowClick ? "rds-row--interactive" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={onRowClick ? selectedKey === k : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => onRowKey(e, row) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.numeric ? "rds-num" : undefined}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
