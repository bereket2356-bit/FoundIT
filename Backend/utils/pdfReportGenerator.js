const PDFDocument = require("pdfkit");

/**
 * Generates a clean, professional PDF report stream for FoundIT Admin
 * @param {Object} reportData
 * @param {Object} options { rangeLabel, startDate, endDate }
 * @param {stream.Writable} outputStream
 */
function generatePdfReport(reportData, options, outputStream) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });

  doc.pipe(outputStream);

  const {
    kpis = {},
    topCategoriesData = [],
    claimResolutionData = [],
    breakdownItems = [],
  } = reportData;

  const primaryColor = "#0f172a"; // Slate 900
  const accentColor = "#4f46e5"; // Indigo 600
  const lightBg = "#f8fafc"; // Slate 50
  const borderGray = "#e2e8f0"; // Slate 200
  const textMuted = "#64748b"; // Slate 500
  const greenText = "#15803d"; // Emerald 700
  const redText = "#b91c1c"; // Red 700

  // 1. BRANDED HEADER
  doc.rect(40, 40, 515, 60).fill(primaryColor);

  doc
    .fillColor("#ffffff")
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("FoundIT", 55, 52, { continued: true })
    .fontSize(12)
    .font("Helvetica")
    .text("  |  System Analytics & Executive Report");

  doc
    .fillColor("#cbd5e1")
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Date Range: ${options.rangeLabel || "All Time"}   •   Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      55,
      76
    );

  doc.moveDown(2);
  let currentY = 120;

  // 2. EXECUTIVE SUMMARY / KPI CARDS SECTION
  doc
    .fillColor(primaryColor)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("1. Executive Summary & KPIs", 40, currentY);

  currentY += 20;

  const cardWidth = 160;
  const cardHeight = 64;
  const gap = 17;

  const kpiCards = [
    {
      label: "TOTAL ITEMS POSTED",
      val: kpis.totalItems?.toString() || "0",
      sub: kpis.itemsTrend !== null && kpis.itemsTrend !== undefined
        ? `${kpis.itemsTrend >= 0 ? "+" : ""}${kpis.itemsTrend}% vs prev period`
        : "Current Period",
      isTrend: kpis.itemsTrend !== null && kpis.itemsTrend !== undefined,
      trendVal: kpis.itemsTrend,
    },
    {
      label: "TOTAL CLAIMS",
      val: kpis.totalClaims?.toString() || "0",
      sub: kpis.claimsTrend !== null && kpis.claimsTrend !== undefined
        ? `${kpis.claimsTrend >= 0 ? "+" : ""}${kpis.claimsTrend}% vs prev period`
        : "Current Period",
      isTrend: kpis.claimsTrend !== null && kpis.claimsTrend !== undefined,
      trendVal: kpis.claimsTrend,
    },
    {
      label: "CLAIM APPROVAL RATE",
      val: `${kpis.approvalRate || 0}%`,
      sub: `${kpis.resolvedClaims || 0} resolved claims`,
      isTrend: false,
    },
    {
      label: "AVG RESOLUTION TIME",
      val: kpis.avgResolutionTime || "N/A",
      sub: "From submission to resolution",
      isTrend: false,
    },
    {
      label: "TOP REPORTED CATEGORY",
      val: kpis.topCategory || "None",
      sub: `${kpis.topCategoryCount || 0} items logged`,
      isTrend: false,
    },
    {
      label: "MOST COMMON LOCATION",
      val: kpis.topLocation || "None",
      sub: "Hotspot area",
      isTrend: false,
    },
  ];

  // Render 2 rows of 3 cards
  for (let i = 0; i < kpiCards.length; i++) {
    const card = kpiCards[i];
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 40 + col * (cardWidth + gap);
    const y = currentY + row * (cardHeight + 10);

    // Card background & border
    doc.rect(x, y, cardWidth, cardHeight).fillAndStroke(lightBg, borderGray);

    // Label
    doc
      .fillColor(textMuted)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text(card.label, x + 10, y + 8, { width: cardWidth - 20, ellipsis: true });

    // Value
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(card.val, x + 10, y + 22, { width: cardWidth - 20, ellipsis: true });

    // Subtitle / Trend
    let subColor = textMuted;
    if (card.isTrend) {
      subColor = card.trendVal >= 0 ? greenText : redText;
    }
    doc
      .fillColor(subColor)
      .fontSize(7)
      .font("Helvetica")
      .text(card.sub, x + 10, y + 46, { width: cardWidth - 20, ellipsis: true });
  }

  currentY += 2 * (cardHeight + 10) + 20;

  // 3. CATEGORY & RESOLUTION ANALYTICS SECTION
  doc
    .fillColor(primaryColor)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("2. Category & Resolution Breakdown", 40, currentY);

  currentY += 20;

  // Left Column: Top Categories Progress Bars
  const leftX = 40;
  const colWidth = 250;
  doc
    .fillColor(textMuted)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("TOP REPORTED CATEGORIES", leftX, currentY);

  let barY = currentY + 16;
  const maxCatVal = topCategoriesData.length > 0 ? Math.max(...topCategoriesData.map((c) => c.value)) : 1;

  if (topCategoriesData.length === 0) {
    doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("No category data in selected period.", leftX, barY);
    barY += 20;
  } else {
    topCategoriesData.slice(0, 4).forEach((cat) => {
      doc
        .fillColor(primaryColor)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(cat.name, leftX, barY);

      doc
        .fillColor(textMuted)
        .fontSize(8)
        .font("Helvetica")
        .text(`${cat.value} items`, leftX + colWidth - 50, barY, { align: "right" });

      // Background bar
      doc.rect(leftX, barY + 10, colWidth, 5).fill("#e2e8f0");
      // Fill bar
      const fillW = Math.max((cat.value / maxCatVal) * colWidth, 6);
      doc.rect(leftX, barY + 10, fillW, 5).fill(accentColor);

      barY += 24;
    });
  }

  // Right Column: Claim Resolution Status Box
  const rightX = 305;
  doc
    .fillColor(textMuted)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("CLAIM RESOLUTION STATUS", rightX, currentY);

  let resY = currentY + 16;
  const totalClaimsCount = claimResolutionData.reduce((acc, c) => acc + (c.value || 0), 0);

  claimResolutionData.forEach((c) => {
    let statusColor = "#64748b";
    if (c.name.toLowerCase() === "approved") statusColor = "#15803d";
    if (c.name.toLowerCase() === "rejected") statusColor = "#b91c1c";
    if (c.name.toLowerCase() === "pending") statusColor = "#d97706";

    doc.circle(rightX + 5, resY + 4, 4).fill(statusColor);

    doc
      .fillColor(primaryColor)
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .text(c.name, rightX + 16, resY);

    const pct = totalClaimsCount > 0 ? Math.round((c.value / totalClaimsCount) * 100) : 0;
    doc
      .fillColor(textMuted)
      .fontSize(8.5)
      .font("Helvetica")
      .text(`${c.value} claims (${pct}%)`, rightX + 120, resY);

    resY += 20;
  });

  currentY = Math.max(barY, resY) + 20;

  // 4. DETAILED BREAKDOWN DATA TABLE
  doc
    .fillColor(primaryColor)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("3. Itemized Activity Log", 40, currentY);

  currentY += 18;

  // Table Columns Setup
  const tableCols = [
    { label: "DATE", width: 65 },
    { label: "ITEM TITLE", width: 140 },
    { label: "TYPE", width: 55 },
    { label: "CATEGORY", width: 75 },
    { label: "STATUS", width: 65 },
    { label: "REPORTED BY", width: 115 },
  ];

  // Table Header Row
  const tableWidth = 515;
  doc.rect(40, currentY, tableWidth, 20).fill("#f1f5f9");

  let colX = 45;
  tableCols.forEach((col) => {
    doc
      .fillColor("#334155")
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text(col.label, colX, currentY + 6, { width: col.width - 5, ellipsis: true });
    colX += col.width;
  });

  currentY += 20;

  // Render Table Rows
  const itemsToRender = breakdownItems.slice(0, 25); // Top 25 for clean formatting

  if (itemsToRender.length === 0) {
    doc
      .fillColor(textMuted)
      .fontSize(8)
      .font("Helvetica")
      .text("No items reported in this date range.", 45, currentY + 8);
    currentY += 25;
  } else {
    itemsToRender.forEach((item, idx) => {
      // If close to page bottom, create new page
      if (currentY > 740) {
        doc.addPage();
        currentY = 40;

        // Re-render table header on new page
        doc.rect(40, currentY, tableWidth, 20).fill("#f1f5f9");
        let thX = 45;
        tableCols.forEach((col) => {
          doc
            .fillColor("#334155")
            .fontSize(7.5)
            .font("Helvetica-Bold")
            .text(col.label, thX, currentY + 6, { width: col.width - 5, ellipsis: true });
          thX += col.width;
        });
        currentY += 20;
      }

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.rect(40, currentY, tableWidth, 18).fill("#f8fafc");
      }

      const dateStr = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
        : "-";

      const typeLabel = (item.type || "lost").toUpperCase();
      const statusLabel = (item.status || "open").toUpperCase();
      const reporterStr = item.user?.name || item.user?.email || "Anonymous";

      let rowX = 45;

      // Date
      doc.fillColor("#334155").fontSize(7.5).font("Helvetica").text(dateStr, rowX, currentY + 5, { width: 60, ellipsis: true });
      rowX += 65;

      // Title
      doc.fillColor(primaryColor).fontSize(7.5).font("Helvetica-Bold").text(item.title || "Untitled", rowX, currentY + 5, { width: 135, ellipsis: true });
      rowX += 140;

      // Type Badge
      const typeColor = typeLabel === "LOST" ? redText : greenText;
      doc.fillColor(typeColor).fontSize(7).font("Helvetica-Bold").text(typeLabel, rowX, currentY + 5, { width: 50, ellipsis: true });
      rowX += 55;

      // Category
      doc.fillColor("#475569").fontSize(7.5).font("Helvetica").text(item.category || "-", rowX, currentY + 5, { width: 70, ellipsis: true });
      rowX += 75;

      // Status
      doc.fillColor("#475569").fontSize(7).font("Helvetica").text(statusLabel, rowX, currentY + 5, { width: 60, ellipsis: true });
      rowX += 65;

      // Reporter
      doc.fillColor("#475569").fontSize(7.5).font("Helvetica").text(reporterStr, rowX, currentY + 5, { width: 110, ellipsis: true });

      currentY += 18;
    });
  }

  // 5. FOOTER ON ALL PAGES
  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);
    doc.rect(40, 800, 515, 0.5).stroke("#cbd5e1");
    doc
      .fillColor(textMuted)
      .fontSize(7.5)
      .font("Helvetica")
      .text("Generated by FoundIT Admin Dashboard", 40, 808, { continued: true })
      .text(`Page ${i + 1} of ${pageRange.count}`, { align: "right" });
  }

  doc.end();
}

module.exports = {
  generatePdfReport,
};
