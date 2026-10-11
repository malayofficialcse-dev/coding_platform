import * as XLSX from "xlsx";

/**
 * Cleanly format cell value for spreadsheet display
 */
function formatCellValue(val) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toLocaleString();
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join(", ");
  }
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  return val;
}

/**
 * Auto-fit column widths based on headers and row values
 */
function getColumnWidths(data) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(data.length, 500); i++) {
      const val = data[i][key];
      const str = val !== null && val !== undefined ? String(val) : "";
      if (str.length > maxLen) {
        maxLen = str.length;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
  });
}

/**
 * Export structured data to an Excel (.xlsx) file.
 * Supports single or multiple worksheets.
 *
 * @param {Object} options
 * @param {string} options.filename - Output file name without extension
 * @param {Array<{sheetName: string, data: Array<Object>}>} [options.sheets] - List of sheets
 * @param {Array<Object>} [options.data] - Flat data for single sheet
 * @param {string} [options.sheetName] - Sheet name for single sheet
 */
export function exportToExcel({ filename = "export", sheets, data, sheetName = "Sheet1" }) {
  try {
    const workbook = XLSX.utils.book_new();

    const sheetsToExport = sheets && sheets.length > 0
      ? sheets
      : [{ sheetName, data: data || [] }];

    let addedSheetCount = 0;

    for (const s of sheetsToExport) {
      const sName = (s.sheetName || `Sheet${addedSheetCount + 1}`)
        .replace(/[:\\/?*[\]]/g, "_")
        .slice(0, 31); // Excel sheet names max 31 chars

      const rows = (s.data || []).map((row) => {
        const cleaned = {};
        for (const [k, v] of Object.entries(row)) {
          cleaned[k] = formatCellValue(v);
        }
        return cleaned;
      });

      const worksheet = rows.length > 0
        ? XLSX.utils.json_to_sheet(rows)
        : XLSX.utils.aoa_to_sheet([["No data available"]]);

      if (rows.length > 0) {
        worksheet["!cols"] = getColumnWidths(rows);
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sName);
      addedSheetCount++;
    }

    const cleanFilename = `${filename.replace(/[/\\?%*:|"<>]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, cleanFilename);
    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
}
