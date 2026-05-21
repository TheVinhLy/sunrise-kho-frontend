// ── IN bằng CSS @media print — không dùng popup ──────────────────
export function printHtml(content, title = 'In') {
  const old = document.getElementById('__print_frame__');
  if (old) old.remove();

  const styleId = '__print_style__';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @media print {
      body > *:not(#__print_frame__) { display: none !important; }
      #__print_frame__ {
        display: block !important;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: auto;
        background: white;
        z-index: 99999;
        padding: 20px;
        font-family: 'Times New Roman', Times, serif;
        font-size: 13px;
        color: #000;
      }
      #__print_frame__ h2,
      #__print_frame__ h3 { text-align: center; margin: 6px 0; }
      #__print_frame__ p   { margin: 3px 0; }
      #__print_frame__ table { width:100%; border-collapse:collapse; margin-top:10px; }
      #__print_frame__ th,
      #__print_frame__ td  { border:1px solid #333; padding:5px 8px; }
      #__print_frame__ th  { background:#eee !important; font-weight:bold; text-align:center;
                              -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      #__print_frame__ tfoot td { font-weight:bold; background:#f5f5f5 !important;
                                   -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      #__print_frame__ .num    { text-align:right; }
      #__print_frame__ .center { text-align:center; }
      #__print_frame__ .sig-row { display:flex; justify-content:space-around; margin-top:44px; text-align:center; }
      #__print_frame__ .sig-row div { min-width:120px; }
      #__print_frame__ hr { border:none; border-top:1px solid #ccc; margin:8px 0; }
      @page { margin:15mm; }
    }
    @media screen {
      #__print_frame__ { display: none; }
    }
  `;

  const frame = document.createElement('div');
  frame.id = '__print_frame__';
  frame.innerHTML = content;
  document.body.appendChild(frame);

  const prevTitle = document.title;
  setTimeout(() => {
    document.title = title;
    window.print();
    setTimeout(() => {
      frame.remove();
      document.title = prevTitle;
    }, 1500);
  }, 150);
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
    `<th style="background:#1b3a2f;color:white;font-weight:bold;">${h}</th>`
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
