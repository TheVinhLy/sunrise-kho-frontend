// ── MỞ TRANG PREVIEW ĐỂ USER TỰ BẤM Ctrl+P ──────────────────────────
// Không tự gọi window.print() — tránh treo khi máy có nhiều máy in mạng
export function printHtml(content, title = 'In') {
  const old = document.getElementById('__print_frame__');
  if (old) old.remove();

  // Tạo div overlay che toàn màn hình — giống preview in
  const overlay = document.createElement('div');
  overlay.id = '__print_frame__';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'background:#525659',
    'display:flex', 'flex-direction:column',
    'align-items:center',
  ].join(';');

  // Toolbar trên cùng
  const toolbar = document.createElement('div');
  toolbar.style.cssText = [
    'width:100%', 'background:#404040',
    'padding:10px 20px',
    'display:flex', 'align-items:center', 'gap:16px',
    'box-shadow:0 2px 8px rgba(0,0,0,.4)',
    'flex-shrink:0',
  ].join(';');
  toolbar.innerHTML = `
    <span style="color:#fff;font-size:14px;font-weight:bold;font-family:Arial">
      🖨️ ${title}
    </span>
    <span style="color:#aaa;font-size:12px;font-family:Arial">
      Chọn đúng máy in (không chọn "Save as PDF")
    </span>
    <button id="__print_btn__" style="
      margin-left:auto;
      background:#1a73e8;color:#fff;
      border:none;border-radius:4px;
      padding:8px 20px;font-size:13px;
      cursor:pointer;font-family:Arial;font-weight:bold;
    ">🖨️ In</button>
    <button id="__close_btn__" style="
      background:#666;color:#fff;
      border:none;border-radius:4px;
      padding:8px 14px;font-size:13px;
      cursor:pointer;font-family:Arial;
    ">✕ Đóng</button>
  `;

  // Vùng paper A4
  const paper = document.createElement('div');
  paper.id = '__print_paper__';
  paper.style.cssText = [
    'background:#fff',
    'width:210mm',
    'min-height:297mm',
    'margin:20px auto',
    'padding:15mm 18mm',
    'box-shadow:0 4px 24px rgba(0,0,0,.5)',
    'font-family:Arial,sans-serif',
    'font-size:11pt',
    'color:#000',
    'overflow:visible',
  ].join(';');
  paper.innerHTML = `
    <style>
      #__print_frame__ table { width:100%; border-collapse:collapse; margin-top:8px; font-size:9.5pt; table-layout:fixed; word-break:break-word; }
      #__print_frame__ th, #__print_frame__ td { border:1px solid #444; padding:3px 5px; vertical-align:middle; }
      #__print_frame__ th { background:#d8d8d8; font-weight:bold; text-align:center; }
      #__print_frame__ tfoot td { font-weight:bold; background:#eee; }
      #__print_frame__ .num { text-align:right; white-space:nowrap; }
      #__print_frame__ .center { text-align:center; }
      #__print_frame__ h2, #__print_frame__ h3 { text-align:center; margin:5px 0; font-size:13pt; }
      #__print_frame__ p { margin:2px 0; line-height:1.4; }
      #__print_frame__ hr { border:none; border-top:1px solid #999; margin:6px 0; }
      #__print_frame__ .sig-row { display:flex; justify-content:space-around; margin-top:30px; text-align:center; }
      #__print_frame__ .sig-row div { min-width:100px; }
      @media print {
        body > *:not(#__print_frame__) { display:none !important; }
        #__print_frame__ {
          position:static !important;
          background:white !important;
          overflow:visible !important;
          display:block !important;
        }
        /* Ẩn toolbar và scroll wrapper, chỉ hiện paper */
        #__print_frame__ > div:nth-child(1),
        #__print_frame__ > div:nth-child(2) > div:not(#__print_paper__) {
          display:none !important;
        }
        #__print_frame__ > div:nth-child(2) {
          overflow:visible !important;
          display:block !important;
          height:auto !important;
          padding:0 !important;
        }
        #__print_paper__ {
          box-shadow:none !important;
          margin:0 !important;
          padding:12mm 15mm !important;
          width:100% !important;
        }
        @page { size:A4 portrait; margin:10mm 15mm; }
      }
    </style>
    ${content}
  `;

  // Scroll wrapper
  const scroll = document.createElement('div');
  scroll.style.cssText = 'overflow-y:auto;flex:1;width:100%;display:flex;justify-content:center;padding-bottom:30px;background:#525659;';
  scroll.appendChild(paper);

  overlay.appendChild(toolbar);
  overlay.appendChild(scroll);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Nút đóng
  document.getElementById('__close_btn__').onclick = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  // Nút in — gọi print ngay khi click
  document.getElementById('__print_btn__').onclick = () => {
    window.print();
  };

  // Phím P cũng in
  const onKey = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      window.print();
    }
  };
  document.addEventListener('keydown', onKey);
}

// ── XUẤT EXCEL (.xlsx thật — load thư viện qua CDN, không cần npm) ──
export function exportExcel(headers, rows, filename = 'export') {
  function doExport(XLSXStyle) {
    const headerStyle = {
      fill: { fgColor: { rgb: '1B3A2F' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    };

    const wsData = [
      headers.map(h => ({ v: h, t: 's', s: headerStyle })),
      ...rows.map((row, idx) => {
        const bg = idx % 2 === 0 ? 'FFFFFF' : 'F0F4F0';
        return row.map(cell => {
          const isNum = typeof cell === 'number';
          return {
            v: cell ?? '',
            t: isNum ? 'n' : 's',
            s: {
              fill: { fgColor: { rgb: bg } },
              font: { sz: 10 },
              alignment: { horizontal: isNum ? 'right' : 'left', vertical: 'center' },
              numFmt: isNum ? '#,##0' : undefined,
              border: {
                top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                right: { style: 'thin', color: { rgb: 'CCCCCC' } },
              },
            },
          };
        });
      }),
    ];

    const ws = XLSXStyle.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map((h, ci) => ({
      wch: Math.min(Math.max(h.length, ...rows.map(r => String(r[ci] ?? '').length)) + 2, 40),
    }));
    ws['!rows'] = [{ hpt: 22 }]; // header row cao hơn

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSXStyle.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // Nếu đã load rồi thì dùng luôn
  if (window.XLSXStyle) { doExport(window.XLSXStyle); return; }

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
  script.onload = () => {
    window.XLSXStyle = window.XLSXStyle || window.XLSX; // xlsx-js-style bundle export tên XLSX
    doExport(window.XLSXStyle);
  };
  script.onerror = () => alert('Không tải được thư viện Excel. Vui lòng kiểm tra kết nối mạng rồi thử lại.');
  document.head.appendChild(script);
}

export function loadXlsxStyle() {
  if (window.XLSXStyle) return Promise.resolve(window.XLSXStyle);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
    script.onload = () => {
      window.XLSXStyle = window.XLSXStyle || window.XLSX;
      resolve(window.XLSXStyle);
    };
    script.onerror = () => reject(new Error('Không tải được thư viện Excel.'));
    document.head.appendChild(script);
  });
}

export async function readExcelFile(file, sheetIndex = 0) {
  const XLSXStyle = await loadXlsxStyle();
  const data = await file.arrayBuffer();
  const workbook = XLSXStyle.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSXStyle.utils.sheet_to_json(worksheet, { defval: '', raw: false });
}

export async function readExcelTable(file, { sheetIndex = 0, headerRow = 1 } = {}) {
  const XLSXStyle = await loadXlsxStyle();
  const data = await file.arrayBuffer();
  const workbook = XLSXStyle.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSXStyle.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
  const headers = (rows[headerRow - 1] || []).map(value => String(value || '').trim());
  return rows
    .slice(headerRow)
    .filter(row => Array.isArray(row) && row.some(cell => String(cell || '').trim() !== ''))
    .map(row => headers.reduce((acc, header, index) => {
      if (header) acc[header] = row[index] ?? '';
      return acc;
    }, {}));
}

// ── FORMAT ──────────────────────────────────────────────────────────
export const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
export const fmtD = d => d ? d.slice(0,10).split('-').reverse().join('/') : '';