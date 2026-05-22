// ── IN qua iframe ẩn — không popup, không treo ─────────────────────
export function printHtml(content, title = 'In') {
  const oldIframe = document.getElementById('__print_iframe__');
  if (oldIframe) oldIframe.remove();

  const iframe = document.createElement('iframe');
  iframe.id = '__print_iframe__';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body {
    font-family:'Times New Roman',Times,serif;
    font-size:12px;
    color:#000;
    width:170mm;
    margin:0 auto;
    padding:10mm 0;
  }
  h2,h3 { text-align:center; margin:5px 0; font-size:14px; }
  p { margin:2px 0; font-size:12px; line-height:1.4; }
  table {
    width:100%;
    border-collapse:collapse;
    margin-top:8px;
    font-size:11px;
    table-layout:fixed;
  }
  th,td {
    border:1px solid #333;
    padding:3px 5px;
    word-wrap:break-word;
    overflow-wrap:break-word;
  }
  th {
    background:#ddd;
    font-weight:bold;
    text-align:center;
    font-size:11px;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  tfoot td {
    font-weight:bold;
    background:#eee;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .num    { text-align:right; white-space:nowrap; }
  .center { text-align:center; }
  .sig-row {
    display:flex;
    justify-content:space-around;
    margin-top:30px;
    text-align:center;
    font-size:12px;
  }
  .sig-row div { min-width:100px; }
  hr { border:none; border-top:1px solid #999; margin:6px 0; }
  @page {
    size: A4 portrait;
    margin: 15mm 20mm 15mm 20mm;
  }
</style>
</head><body>${content}</body></html>`);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {
      console.error('Print error:', e);
    }
    setTimeout(() => iframe.remove(), 3000);
  };
}

// ── XUẤT EXCEL ──────────────────────────────────────────────────────
export function exportExcel(headers, rows, filename = 'export') {
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>Sheet1</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head><body><table border="1">`;

  html += '<tr>' + headers.map(h =>
    `<th style="background:#1b3a2f;color:white;font-weight:bold;white-space:nowrap;">${h}</th>`
  ).join('') + '</tr>';

  rows.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';
    html += '<tr>' + row.map(cell => {
      const isNum = typeof cell === 'number';
      return `<td style="background:${bg};${isNum ? 'text-align:right;mso-number-format:\"#,##0\";' : ''}">${cell ?? ''}</td>`;
    }).join('') + '</tr>';
  });

  html += '</table></body></html>';

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0,10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── FORMAT ──────────────────────────────────────────────────────────
export const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
export const fmtD = d => d ? d.slice(0,10).split('-').reverse().join('/') : '';
