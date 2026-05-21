// ── IN — không dùng popup, dùng CSS media print trực tiếp ────────────
// Cách này 100% hoạt động, không bị block popup
export function printContent(htmlContent, title = 'In') {
  // Tạo div ẩn để in
  const printId = 'sk-print-area';
  let area = document.getElementById(printId);
  if (!area) {
    area = document.createElement('div');
    area.id = printId;
    document.body.appendChild(area);
  }

  // Inject style print nếu chưa có
  let style = document.getElementById('sk-print-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'sk-print-style';
    style.innerHTML = `
      @media print {
        body > *:not(#${printId}) { display: none !important; }
        #${printId} {
          display: block !important;
          position: fixed; inset: 0; z-index: 99999;
          background: white; padding: 15mm;
          font-family: 'Times New Roman', Times, serif;
          font-size: 13px; color: #000;
        }
        #${printId} h2, #${printId} h3 { text-align: center; margin: 6px 0; }
        #${printId} p  { margin: 3px 0; }
        #${printId} table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        #${printId} th, #${printId} td { border: 1px solid #333; padding: 5px 8px; }
        #${printId} th { background: #eee !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; }
        #${printId} tfoot td { font-weight: bold; background: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
        #${printId} .num    { text-align: right; }
        #${printId} .center { text-align: center; }
        #${printId} .sig-row { display: flex; justify-content: space-around; margin-top: 44px; text-align: center; }
        #${printId} .sig-row div { min-width: 120px; }
        #${printId} hr { border: none; border-top: 1px solid #ccc; margin: 8px 0; }
        #${printId} .no-print { display: none !important; }
        @page { margin: 15mm; }
      }
      @media screen {
        #${printId} { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  // Đặt title trang in
  const oldTitle = document.title;
  document.title = title;

  // Nội dung
  area.innerHTML = htmlContent;

  // In
  window.print();

  // Khôi phục
  document.title = oldTitle;
  area.innerHTML = '';
}

// ── XUẤT XLSX — dùng SheetJS CDN ────────────────────────────────────
export async function exportExcel(headers, rows, filename = 'export') {
  // Load SheetJS nếu chưa có
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;

  // Tạo worksheet
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Định dạng cột rộng tự động
  const colWidths = headers.map((h, ci) => ({
    wch: Math.max(
      h.length + 2,
      ...rows.map(r => String(r[ci] ?? '').length + 1)
    )
  }));
  ws['!cols'] = colWidths;

  // Style header row (bold + màu nền)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) {
      cell.s = {
        font:    { bold: true, color: { rgb: 'FFFFFF' } },
        fill:    { fgColor: { rgb: '1B3A2F' } },
        alignment: { horizontal: 'center' },
      };
    }
  }

  // Tạo workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Xuất file .xlsx
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
}

// ── FORMAT ──────────────────────────────────────────────────────────
export const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
export const fmtD = d => d ? d.slice(0, 10).split('-').reverse().join('/') : '';
