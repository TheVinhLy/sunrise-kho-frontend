// ── IN ──────────────────────────────────────────────────────────────
export function printHtml(content, title = 'In') {
  const w = window.open('', '_blank', 'width=1000,height=750');
  if (!w) {
    alert('Trình duyệt đã chặn popup! Vui lòng cho phép popup cho trang này rồi thử lại.');
    return;
  }
  w.document.open();
  w.document.write(`<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  *    { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Times New Roman',Times,serif; font-size:13px; padding:20px; color:#000; }
  h2,h3{ text-align:center; margin:6px 0; }
  p    { margin:3px 0; }
  table{ width:100%; border-collapse:collapse; margin-top:10px; }
  th,td{ border:1px solid #333; padding:5px 8px; }
  th   { background:#eee; font-weight:bold; text-align:center; }
  tfoot td { font-weight:bold; background:#f5f5f5; }
  .num { text-align:right; }
  .center { text-align:center; }
  .sig-row{ display:flex; justify-content:space-around; margin-top:44px; text-align:center; }
  .sig-row div { min-width:120px; }
  hr   { border:none; border-top:1px solid #ccc; margin:8px 0; }
  @page{ margin:15mm; }
</style>
</head><body>${content}</body></html>`);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

// ── XUẤT EXCEL ──────────────────────────────────────────────────────
export function exportExcel(headers, rows, filename = 'export') {
  // Tạo HTML table → mở trong Excel (cách tương thích mọi trình duyệt)
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>Sheet1</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head><body><table border="1">`;

  // Header row
  html += '<tr>' + headers.map(h => `<th style="background:#1b3a2f;color:white;font-weight:bold;">${h}</th>`).join('') + '</tr>';

  // Data rows
  rows.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';
    html += '<tr>' + row.map(cell => {
      const isNum = typeof cell === 'number' || (typeof cell === 'string' && /^\d+(\.\d+)?$/.test(cell) && cell !== '');
      return `<td style="background:${bg};${isNum ? 'text-align:right;mso-number-format:\"#,##0\";' : ''}">${cell ?? ''}</td>`;
    }).join('') + '</tr>';
  });

  html += '</table></body></html>';

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}_${new Date().toISOString().slice(0,10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── FORMAT ──────────────────────────────────────────────────────────
export const fmt  = n  => Number(n || 0).toLocaleString('vi-VN');
export const fmtD = d  => d ? d.slice(0,10).split('-').reverse().join('/') : '';
