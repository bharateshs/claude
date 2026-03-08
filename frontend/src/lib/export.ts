import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import { PLATFORM_CONFIG, formatNumber, formatCurrency } from './constants';

interface ExportData {
  clientName: string;
  period: string;
  overview: Record<string, number>;
  platformData: Array<Record<string, unknown>>;
  spendsData: Array<Record<string, unknown>>;
  campaigns: Array<Record<string, unknown>>;
  insights: Array<{ type: string; platform: string; priority: string; title: string; description: string }>;
}

// ─── XLSX Export ───────────────────────────────────────────────────────────────
export function exportToXLSX(data: ExportData) {
  const wb = XLSX.utils.book_new();

  const overviewRows = [
    ['Metric', 'Value'],
    ['Client', data.clientName],
    ['Period', data.period],
    ['Total Impressions', formatNumber(data.overview.total_impressions)],
    ['Total Reach', formatNumber(data.overview.total_reach)],
    ['Total Engagement', formatNumber(data.overview.total_engagement)],
    ['Total Clicks', formatNumber(data.overview.total_clicks)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewRows), 'Overview');

  if (data.platformData?.length) {
    const headers = ['Platform', 'Followers', 'Impressions', 'Reach', 'Engagement', 'Likes', 'Comments', 'Shares', 'Clicks', 'Engagement Rate %'];
    const rows = data.platformData.map((r) => [
      PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || r.platform,
      r.followers, r.impressions, r.reach, r.engagement, r.likes, r.comments, r.shares, r.clicks, `${r.engagement_rate}%`,
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Platform Performance');
  }

  if (data.spendsData?.length) {
    const headers = ['Platform', 'Spend ($)', 'Impressions', 'Clicks', 'Conversions', 'CPM ($)', 'CPC ($)', 'CTR (%)', 'ROAS'];
    const rows = data.spendsData.map((r) => [
      PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || r.platform,
      r.spend, r.impressions, r.clicks, r.conversions, r.avg_cpm, r.avg_cpc, `${r.avg_ctr}%`, r.avg_roas,
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Media Spends');
  }

  if (data.campaigns?.length) {
    const headers = ['Platform', 'Campaign', 'Spend ($)', 'Impressions', 'Clicks', 'Conversions', 'CTR (%)', 'ROAS'];
    const rows = data.campaigns.map((r) => [
      PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || r.platform,
      r.campaign_name, r.spend, r.impressions, r.clicks, r.conversions, `${r.avg_ctr}%`, r.avg_roas,
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Campaigns');
  }

  if (data.insights?.length) {
    const headers = ['Type', 'Platform', 'Priority', 'Title', 'Description'];
    const rows = data.insights.map((r) => [r.type, r.platform, r.priority, r.title, r.description]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Insights');
  }

  XLSX.writeFile(wb, `social-analytics-${data.clientName.replace(/\s/g, '-')}-${Date.now()}.xlsx`);
}

// ─── PDF Export ────────────────────────────────────────────────────────────────
export function exportToPDF(data: ExportData) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(3, 7, 18);
  doc.rect(0, 0, pageWidth, 210, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Social Media Analytics Report', pageWidth / 2, 60, { align: 'center' });
  doc.setTextColor(229, 231, 235);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, pageWidth / 2, 80, { align: 'center' });
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(12);
  doc.text(`Period: ${data.period}`, pageWidth / 2, 95, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 105, { align: 'center' });

  if (data.platformData?.length) {
    doc.addPage();
    doc.setFillColor(3, 7, 18);
    doc.rect(0, 0, pageWidth, 210, 'F');
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Platform Performance', 15, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Platform', 'Followers', 'Impressions', 'Reach', 'Engagement', 'Clicks', 'Eng. Rate']],
      body: data.platformData.map((r) => [
        String(PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || r.platform),
        formatNumber(r.followers as number), formatNumber(r.impressions as number),
        formatNumber(r.reach as number), formatNumber(r.engagement as number),
        formatNumber(r.clicks as number), `${r.engagement_rate}%`,
      ]),
      styles: { fillColor: [17, 24, 39], textColor: [229, 231, 235], fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [31, 41, 55] },
    });
  }

  if (data.spendsData?.length) {
    doc.addPage();
    doc.setFillColor(3, 7, 18);
    doc.rect(0, 0, pageWidth, 210, 'F');
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Media Spends', 15, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Platform', 'Spend', 'Impressions', 'Clicks', 'Conversions', 'CPM', 'CPC', 'CTR', 'ROAS']],
      body: data.spendsData.map((r) => [
        String(PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || r.platform),
        formatCurrency(r.spend as number), formatNumber(r.impressions as number),
        formatNumber(r.clicks as number), formatNumber(r.conversions as number),
        `$${r.avg_cpm}`, `$${r.avg_cpc}`, `${r.avg_ctr}%`, `${r.avg_roas}x`,
      ]),
      styles: { fillColor: [17, 24, 39], textColor: [229, 231, 235], fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [31, 41, 55] },
    });
  }

  if (data.insights?.length) {
    doc.addPage();
    doc.setFillColor(3, 7, 18);
    doc.rect(0, 0, pageWidth, 210, 'F');
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Insights & Recommendations', 15, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Type', 'Platform', 'Priority', 'Title', 'Description']],
      body: data.insights.map((r) => [r.type, r.platform, r.priority, r.title, r.description]),
      styles: { fillColor: [17, 24, 39], textColor: [229, 231, 235], fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [31, 41, 55] },
      columnStyles: { 4: { cellWidth: 100 } },
    });
  }

  doc.save(`social-analytics-${data.clientName.replace(/\s/g, '-')}-${Date.now()}.pdf`);
}

// ─── PPT Export ─────────────────────────────────────────────────────────────
export function exportToPPT(data: ExportData) {
  const prs = new PptxGenJS();
  prs.layout = 'LAYOUT_WIDE';

  const DARK_BG = '030712';
  const BLUE = '2563EB';
  const TEXT_LIGHT = 'F9FAFB';
  const TEXT_MUTED = '9CA3AF';
  const CARD_BG = '111827';

  const addBg = (slide: ReturnType<typeof prs.addSlide>) => {
    slide.background = { color: DARK_BG };
  };

  // Title slide
  const slide1 = prs.addSlide();
  addBg(slide1);
  slide1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: BLUE } });
  slide1.addText('Social Media Analytics Report', { x: 0.5, y: 1.5, w: 12, h: 1, fontSize: 36, bold: true, color: TEXT_LIGHT, align: 'center' });
  slide1.addText(data.clientName, { x: 0.5, y: 2.8, w: 12, h: 0.6, fontSize: 22, color: BLUE, align: 'center' });
  slide1.addText(`Period: ${data.period}`, { x: 0.5, y: 3.5, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, align: 'center' });

  // Platform slide
  if (data.platformData?.length) {
    const slide2 = prs.addSlide();
    addBg(slide2);
    slide2.addText('Platform Performance', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: BLUE });

    const tableData = [
      [
        { text: 'Platform', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Followers', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Impressions', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Engagement', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Eng. Rate', options: { bold: true, color: TEXT_LIGHT } },
      ],
      ...data.platformData.map((r) => [
        { text: String(PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || r.platform), options: { color: TEXT_LIGHT } },
        { text: formatNumber(r.followers as number), options: { color: TEXT_LIGHT } },
        { text: formatNumber(r.impressions as number), options: { color: TEXT_LIGHT } },
        { text: formatNumber(r.engagement as number), options: { color: TEXT_LIGHT } },
        { text: `${r.engagement_rate}%`, options: { color: '34D399' } },
      ]),
    ];

    slide2.addTable(tableData, {
      x: 0.5, y: 1.1, w: 12.5, h: 4,
      border: { type: 'solid', color: '1F2937', pt: 1 },
      fill: { color: CARD_BG },
      color: TEXT_LIGHT,
      fontSize: 10,
      rowH: 0.5,
    });
  }

  // Spends slide
  if (data.spendsData?.length) {
    const slide3 = prs.addSlide();
    addBg(slide3);
    slide3.addText('Media Spends & ROI', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: BLUE });

    const spendsData = [
      [
        { text: 'Platform', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'Spend', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'ROAS', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'CTR', options: { bold: true, color: TEXT_LIGHT } },
        { text: 'CPC', options: { bold: true, color: TEXT_LIGHT } },
      ],
      ...data.spendsData.map((r) => [
        { text: String(PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || r.platform), options: { color: TEXT_LIGHT } },
        { text: formatCurrency(r.spend as number), options: { color: 'FBBF24' } },
        { text: `${r.avg_roas}x`, options: { color: '34D399' } },
        { text: `${r.avg_ctr}%`, options: { color: TEXT_LIGHT } },
        { text: `$${r.avg_cpc}`, options: { color: TEXT_LIGHT } },
      ]),
    ];

    slide3.addTable(spendsData, {
      x: 0.5, y: 1.1, w: 12.5, h: 4,
      border: { type: 'solid', color: '1F2937', pt: 1 },
      fill: { color: CARD_BG },
      color: TEXT_LIGHT,
      fontSize: 10,
      rowH: 0.5,
    });
  }

  // Insights slides
  if (data.insights?.length) {
    const types = ['insight', 'learning', 'recommendation'] as const;
    const typeColors = { insight: '3B82F6', learning: '8B5CF6', recommendation: '10B981' };
    const typeLabels = { insight: 'Key Insights', learning: 'Learnings', recommendation: 'Recommendations' };

    for (const type of types) {
      const filtered = data.insights.filter((i) => i.type === type);
      if (!filtered.length) continue;

      const slideI = prs.addSlide();
      addBg(slideI);
      slideI.addText(typeLabels[type], { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: typeColors[type] });

      filtered.slice(0, 4).forEach((insight, i) => {
        const y = 1.1 + i * 1.5;
        slideI.addShape(prs.ShapeType.roundRect, { x: 0.4, y, w: 12.6, h: 1.3, fill: { color: CARD_BG }, line: { color: typeColors[type], pt: 1 } });
        slideI.addText(`[${insight.priority.toUpperCase()}] ${insight.title}`, { x: 0.7, y: y + 0.1, w: 12, h: 0.4, fontSize: 11, bold: true, color: TEXT_LIGHT });
        slideI.addText(insight.description, { x: 0.7, y: y + 0.5, w: 12, h: 0.6, fontSize: 9, color: TEXT_MUTED });
      });
    }
  }

  prs.writeFile({ fileName: `social-analytics-${data.clientName.replace(/\s/g, '-')}-${Date.now()}.pptx` });
}
