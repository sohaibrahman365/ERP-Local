import ExcelJS from "exceljs";

interface SheetData {
  name: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, unknown>[];
}

export async function generateExcel(sheets: SheetData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WisePlatform ERP";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    ws.columns = sheet.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 15,
    }));

    // Style header row
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    for (const row of sheet.rows) {
      ws.addRow(row);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
