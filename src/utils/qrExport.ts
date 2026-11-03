/**
 * Saves QR cards (the exact cards shown in Tables & QR) as PNG or PDF.
 * The libraries are loaded only when someone presses a download button.
 */

const PNG_SCALE = 3;

async function waitForFonts(): Promise<void> {
  try {
    await document.fonts?.ready;
  } catch {

    // fonts API unavailable: carry on
  }}

export async function cardToPng(node: HTMLElement): Promise<string> {
  const { toPng } = await import('html-to-image');
  await waitForFonts();
  const opts = { pixelRatio: PNG_SCALE, backgroundColor: '#FFFFFF', cacheBust: true, style: { margin: '0' } };
  // The first pass warms up fonts/images; the second one is the clean render
  await toPng(node, opts).catch(() => undefined);
  return toPng(node, opts);
}

function save(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadCardPng(node: HTMLElement, filename: string): Promise<void> {
  save(await cardToPng(node), filename);
}

interface PdfOptions {
  /** 'single' = one card centred on an A5 page. 'grid' = four cards per A4 page, ready to cut out. */
  layout: 'single' | 'grid';
}

function imageSize(dataUrl: string): Promise<{w: number;h: number;}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read the QR image.'));
    img.src = dataUrl;
  });
}

export async function downloadCardsPdf(nodes: HTMLElement[], filename: string, { layout }: PdfOptions): Promise<void> {
  if (nodes.length === 0) return;
  const { jsPDF } = await import('jspdf');
  const images: string[] = [];
  for (const node of nodes) images.push(await cardToPng(node));
  const sizes = await Promise.all(images.map(imageSize));

  const doc = new jsPDF({ unit: 'mm', format: layout === 'single' ? 'a5' : 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  if (layout === 'single') {
    const { w, h } = sizes[0];
    const width = 100;
    const height = width * h / w;
    doc.addImage(images[0], 'PNG', (pageW - width) / 2, (pageH - height) / 2, width, height, undefined, 'FAST');
  } else {
    const cols = 2;
    const rows = 2;
    const perPage = cols * rows;
    const cellW = pageW / cols;
    const cellH = pageH / rows;
    // One scale for every card (sized by the largest) so all cards print at the same size
    const scale = Math.min(...sizes.map(({ w, h }) => Math.min((cellW - 16) / w, (cellH - 16) / h)));
    images.forEach((img, i) => {
      if (i > 0 && i % perPage === 0) doc.addPage();
      const slot = i % perPage;
      const { w, h } = sizes[i];
      const width = w * scale;
      const height = h * scale;
      const x = slot % cols * cellW + (cellW - width) / 2;
      const y = Math.floor(slot / cols) * cellH + 8; // top-aligned so each row lines up
      doc.addImage(img, 'PNG', x, y, width, height, undefined, 'FAST');
    });
  }
  doc.save(filename);
}
