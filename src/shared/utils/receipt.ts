import type { Profile } from '../hooks/useProfile';

/**
 * Data shape expected by the receipt generator. This is intentionally a
 * superset of what ParkingSession carries so callers can pass raw rows
 * from Supabase without transformation.
 */
export interface ReceiptSession {
  id: string;
  entry_time: string;
  exit_time: string | null;
  vehicle_plate: string;
  zone_name: string | null;
  fee: number;
  status: string;
}

export interface ReceiptOptions {
  /** Organisation / brand name shown in the header. */
  brandName?: string;
  /** Subtitle shown below the brand name. */
  brandSubtitle?: string;
  /** Support email printed in the footer. */
  supportEmail?: string;
  /** Override the computed file name (without extension). */
  filename?: string;
}

const DEFAULTS: Required<Pick<ReceiptOptions, 'brandName' | 'brandSubtitle' | 'supportEmail'>> = {
  brandName: 'HCMUT Smart Parking',
  brandSubtitle: 'Official Parking Receipt',
  supportEmail: 'support@hcmut-parking.vn'
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const formatDuration = (startIso: string, endIso: string | null): string => {
  if (!endIso) return 'Ongoing';
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
};

const formatVND = (amount: number): string =>
  `${(amount || 0).toLocaleString('en-US')} VND`;

const shortId = (id: string): string =>
  (id || '').replace(/-/g, '').slice(0, 8).toUpperCase() || 'UNKNOWN';

/**
 * Generate a branded parking receipt PDF and trigger a browser download.
 *
 * Uses dynamic import so the ~150KB jspdf bundle is only fetched when a
 * user actually clicks "Download Receipt".
 */
export async function generateReceiptPDF(
  session: ReceiptSession,
  profile: Partial<Profile> | null,
  options: ReceiptOptions = {}
): Promise<void> {
  const { default: JsPDF } = await import('jspdf');
  const opts = { ...DEFAULTS, ...options };

  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = pageWidth - margin;

  // Palette (RGB) — matches the app's indigo primary theme.
  const primary: [number, number, number] = [79, 70, 229];
  const ink: [number, number, number] = [15, 23, 42];
  const muted: [number, number, number] = [100, 116, 139];
  const faint: [number, number, number] = [226, 232, 240];

  let y = margin;

  // ---- Header ----
  doc.setFillColor(...primary);
  doc.rect(margin, y, contentWidth, 72, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(opts.brandName.toUpperCase(), margin + 20, y + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(opts.brandSubtitle, margin + 20, y + 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RECEIPT', rightEdge - 20, y + 32, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`#${shortId(session.id)}`, rightEdge - 20, y + 52, { align: 'right' });

  y += 72 + 24;

  // ---- Meta row ----
  doc.setTextColor(...muted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ISSUE DATE', margin, y);
  doc.text('TRANSACTION ID', margin + contentWidth / 2, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.text(formatDate(new Date().toISOString()), margin, y + 16);
  doc.text(session.id, margin + contentWidth / 2, y + 16);

  y += 40;
  drawDivider(doc, margin, y, contentWidth, faint);
  y += 24;

  // ---- Customer section ----
  y = drawSectionHeader(doc, 'CUSTOMER', margin, y, primary);
  y = drawKeyValue(doc, 'Name', profile?.full_name || '—', margin, y, contentWidth, ink, muted);
  y = drawKeyValue(doc, 'Email', profile?.email || '—', margin, y, contentWidth, ink, muted);
  y = drawKeyValue(doc, 'Role', profile?.role || '—', margin, y, contentWidth, ink, muted);
  y = drawKeyValue(doc, 'Member ID', profile?.id || '—', margin, y, contentWidth, ink, muted);

  y += 12;
  drawDivider(doc, margin, y, contentWidth, faint);
  y += 24;

  // ---- Session details ----
  y = drawSectionHeader(doc, 'SESSION DETAILS', margin, y, primary);
  y = drawKeyValue(doc, 'Vehicle Plate', session.vehicle_plate || '—', margin, y, contentWidth, ink, muted);
  y = drawKeyValue(doc, 'Zone / Location', session.zone_name || 'Campus Parking', margin, y, contentWidth, ink, muted);
  y = drawKeyValue(doc, 'Entry Time', formatDateTime(session.entry_time), margin, y, contentWidth, ink, muted);
  y = drawKeyValue(
    doc,
    'Exit Time',
    session.exit_time ? formatDateTime(session.exit_time) : 'Ongoing',
    margin, y, contentWidth, ink, muted
  );
  y = drawKeyValue(doc, 'Duration', formatDuration(session.entry_time, session.exit_time), margin, y, contentWidth, ink, muted);
  y = drawKeyValue(doc, 'Status', session.status || '—', margin, y, contentWidth, ink, muted);

  y += 12;
  drawDivider(doc, margin, y, contentWidth, faint);
  y += 24;

  // ---- Payment summary ----
  y = drawSectionHeader(doc, 'PAYMENT SUMMARY', margin, y, primary);

  drawAmountRow(doc, 'Parking Fee', formatVND(session.fee), margin, y, contentWidth, ink, muted, false);
  y += 22;
  drawAmountRow(doc, 'Service Charge', formatVND(0), margin, y, contentWidth, ink, muted, false);
  y += 22;

  drawDivider(doc, margin, y, contentWidth, faint);
  y += 16;

  drawAmountRow(doc, 'TOTAL PAID', formatVND(session.fee), margin, y, contentWidth, ink, muted, true);
  y += 40;

  // ---- Footer ----
  drawDivider(doc, margin, y, contentWidth, faint);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text('Thank you for using ' + opts.brandName + '!', margin, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(
    `Questions about this receipt? Contact ${opts.supportEmail}`,
    margin,
    y
  );
  y += 12;
  doc.text(
    'This is a computer-generated receipt and does not require a signature.',
    margin,
    y
  );

  // ---- Save ----
  const filename = options.filename
    || `HCMUT-Parking-Receipt-${shortId(session.id)}-${formatDate(session.entry_time).replace(/ /g, '-')}.pdf`;

  doc.save(filename);
}

// ---------- Layout helpers ----------
// We type `doc` as `any` in these internal helpers to avoid pulling the
// jspdf type surface through our public API. The function is only called
// from inside generateReceiptPDF above, which does use the real jsPDF type.

function drawDivider(
  doc: any,
  x: number,
  y: number,
  width: number,
  color: [number, number, number]
): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + width, y);
}

function drawSectionHeader(
  doc: any,
  label: string,
  x: number,
  y: number,
  color: [number, number, number]
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(label, x, y);
  return y + 20;
}

function drawKeyValue(
  doc: any,
  key: string,
  value: string,
  x: number,
  y: number,
  width: number,
  ink: [number, number, number],
  muted: [number, number, number]
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(key, x, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  const valueLines = doc.splitTextToSize(String(value), width - 140);
  doc.text(valueLines, x + 140, y);

  return y + Math.max(20, 16 * valueLines.length);
}

function drawAmountRow(
  doc: any,
  label: string,
  amount: string,
  x: number,
  y: number,
  width: number,
  ink: [number, number, number],
  muted: [number, number, number],
  emphasize: boolean
): void {
  const rightEdge = x + width;

  if (emphasize) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...ink);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...muted);
  }
  doc.text(label, x, y);

  if (emphasize) {
    doc.setTextColor(...ink);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ink);
  }
  doc.text(amount, rightEdge, y, { align: 'right' });
}
