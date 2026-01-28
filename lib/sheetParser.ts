import * as XLSX from 'xlsx';

export interface SheetData {
    columns: string[];
    rows: Record<string, any>[];
}

export function parseExcelFile(buffer: Buffer): SheetData {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
        throw new Error('Sheet is empty');
    }

    // Extract column names from first row
    const columns = Object.keys(jsonData[0] as object);

    return {
        columns,
        rows: jsonData as Record<string, any>[],
    };
}

export function parseCSVFile(buffer: Buffer): SheetData {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
        throw new Error('CSV is empty');
    }

    const columns = Object.keys(jsonData[0] as object);

    return {
        columns,
        rows: jsonData as Record<string, any>[],
    };
}
