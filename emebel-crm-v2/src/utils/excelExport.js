import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Ma'lumotlarni chiroyli formatlangan Excel fayliga yuklab oluvchi funksiya.
 * 
 * @param {string} filename - Yuklanadigan faylning nomi (sanani o'zi qo'shib oladi).
 * @param {Array} sheetsParams - Varaqlar ro'yxati (har biriga { name, columns, data, summary } beriladi).
 */
export async function exportBeautifulExcel(filename, sheetsParams) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'e-Mebel CRM';
  wb.created = new Date();

  for (const sheet of sheetsParams) {
    const ws = wb.addWorksheet(sheet.name || 'Sheet 1');
    
    // Agar tepada xulosa stori (summaryData) bo'lsa qo'shish
    let startRowOffset = 0;
    if (sheet.summary && sheet.summary.length > 0) {
      sheet.summary.forEach(rowArr => {
        const xlRow = ws.addRow(rowArr);
        xlRow.font = { bold: true, size: 12, color: { argb: 'FF333333' } };
      });
      ws.addRow([]); // bitta bo'sh qator
      startRowOffset = sheet.summary.length + 1;
    }

    // Ustunlarni o'rnatamiz
    if (sheet.columns) {
      ws.columns = sheet.columns;
    } else if (sheet.data && sheet.data.length > 0) {
      const keys = Object.keys(sheet.data[0]);
      ws.columns = keys.map(k => ({ header: k, key: k }));
    }

    // Sarlavhani topamiz va stil beramiz (toq ko'k fon, oq matn)
    const headerRow = ws.getRow(startRowOffset + 1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1a2540' } // Quyi interfeys rangida toq ko'k
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94a3b8' } },
        left: { style: 'thin', color: { argb: 'FF94a3b8' } },
        bottom: { style: 'thin', color: { argb: 'FF94a3b8' } },
        right: { style: 'thin', color: { argb: 'FF94a3b8' } }
      };
    });
    headerRow.height = 28;

    // Ma'lumotlarni qo'shish
    if (sheet.data && sheet.data.length > 0) {
      sheet.data.forEach((item, index) => {
        const row = ws.addRow(item);
        
        // Qator rangi zebra kabi (toq-juft)
        const isEven = index % 2 === 0;

        row.eachCell((cell) => {
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: typeof cell.value === 'number' ? 'right' : 'left',
            wrapText: true 
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } // Oq va sal kulrang
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });
    } else if (sheet.rowsData && sheet.rowsData.length > 0) {
      // Maxsus jadval (objectlarsiz, shunchaki arraylarlar)
      sheet.rowsData.forEach((rowArr, index) => {
        const row = ws.addRow(rowArr);
        const isEven = index % 2 === 0;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', wrapText: true };
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });
    }

    // Ustun kengliklarini eng uzun yozuvga qarab avtomatlashtirish
    ws.columns.forEach(column => {
      let maxLen = column.header ? column.header.length : 10;
      column.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.value) {
          const valLen = cell.value.toString().length;
          if (valLen > maxLen) { maxLen = valLen; }
        }
      });
      // O'ta katta yoki o'ta kichik bo'lib ketishini oldini olamiz
      column.width = Math.min(Math.max(maxLen + 2, 14), 70);
    });
  }

  // Faylni brouzerni o'zida saqlash
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dString = new Date().toISOString().slice(0, 10);
  saveAs(blob, `${filename}-${dString}.xlsx`);
}
