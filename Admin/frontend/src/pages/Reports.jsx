import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  FileCheck,
  CheckCircle2,
  Clock,
  Tag,
  MapPin,
  Loader2,
  Search,
  Filter,
  ArrowUpRight,
  AlertCircle,
  FileText
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import API, { BASE_URL } from "../api";

const DATE_RANGES = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "semester", label: "This Semester" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom Range" },
];

/**
 * Connected Dot-Line Chart for Items Reported Over Time
 */
const ConnectedTimelineChart = ({ dataPoints, totalItems }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = dataPoints && dataPoints.length > 0 ? dataPoints : [];

  if (points.length === 0) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>No activity timeline data recorded for this range.</p>
        <span className="text-xs text-slate-400 mt-1 font-mono">
          Total {totalItems} items in database
        </span>
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(
    ...points.map((p) => Math.max(p.lost || 0, p.found || 0)),
    3
  );

  const getX = (idx) => {
    if (points.length === 1) return padLeft + chartW / 2;
    return padLeft + (idx / (points.length - 1)) * chartW;
  };

  const getY = (val) => {
    return padTop + chartH - ((val || 0) / maxVal) * chartH;
  };

  const lostLinePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.lost)}`)
    .join(" ");

  const foundLinePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.found)}`)
    .join(" ");

  const lostAreaPath =
    points.length > 1
      ? `${lostLinePath} L ${getX(points.length - 1)} ${padTop + chartH} L ${getX(0)} ${padTop + chartH} Z`
      : "";

  const foundAreaPath =
    points.length > 1
      ? `${foundLinePath} L ${getX(points.length - 1)} ${padTop + chartH} L ${getX(0)} ${padTop + chartH} Z`
      : "";

  const gridTicks = [0, Math.ceil(maxVal / 2), maxVal];

  return (
    <div className="relative w-full h-56 mt-2 select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="foundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Dotted Grid Lines */}
        {gridTicks.map((tick, i) => {
          const yPos = getY(tick);
          return (
            <g key={i}>
              <line
                x1={padLeft}
                y1={yPos}
                x2={padLeft + chartW}
                y2={yPos}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={yPos + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Shaded Area Fills */}
        {lostAreaPath && <path d={lostAreaPath} fill="url(#lostGrad)" />}
        {foundAreaPath && <path d={foundAreaPath} fill="url(#foundGrad)" />}

        {/* Connecting Lines */}
        <path
          d={lostLinePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={foundLinePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Connected Dots for Lost Series */}
        {points.map((p, i) => {
          const cx = getX(i);
          const cy = getY(p.lost);
          const isHovered =
            hoveredPoint?.index === i && hoveredPoint?.type === "lost";

          return (
            <g key={`lost-dot-${i}`}>
              {isHovered && (
                <circle cx={cx} cy={cy} r="10" fill="#6366f1" opacity="0.2" />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? "6" : "4.5"}
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all cursor-pointer"
                onMouseEnter={() =>
                  setHoveredPoint({
                    index: i,
                    type: "lost",
                    data: p,
                    x: cx,
                    y: cy,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {/* Connected Dots for Found Series */}
        {points.map((p, i) => {
          const cx = getX(i);
          const cy = getY(p.found);
          const isHovered =
            hoveredPoint?.index === i && hoveredPoint?.type === "found";

          return (
            <g key={`found-dot-${i}`}>
              {isHovered && (
                <circle cx={cx} cy={cy} r="10" fill="#10b981" opacity="0.2" />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? "6" : "4.5"}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all cursor-pointer"
                onMouseEnter={() =>
                  setHoveredPoint({
                    index: i,
                    type: "found",
                    data: p,
                    x: cx,
                    y: cy,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {/* X-axis Date Timeline Labels */}
        {points.map((p, i) => {
          const step = Math.max(1, Math.floor(points.length / 6));
          if (i % step !== 0 && i !== points.length - 1) return null;

          const cx = getX(i);
          let label = p.name || "";
          if (label.includes("-")) {
            label = label.split("-").slice(1).join("/");
          }

          return (
            <text
              key={`x-label-${i}`}
              x={cx}
              y={padTop + chartH + 20}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-medium"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card */}
      {hoveredPoint && (
        <div
          className="absolute bg-slate-900 text-white text-[11px] py-2 px-3 rounded-xl shadow-xl z-20 pointer-events-none -translate-x-1/2 -translate-y-full border border-slate-700"
          style={{
            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
            top: `${(hoveredPoint.y / svgHeight) * 100}%`,
            marginTop: "-14px",
          }}
        >
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            {hoveredPoint.data?.name}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Lost: <strong>{hoveredPoint.data?.lost || 0}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Found: <strong>{hoveredPoint.data?.found || 0}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Reports = () => {
  const [selectedRange, setSelectedRange] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);

  const [data, setData] = useState({
    kpis: {
      totalItems: null,
      itemsTrend: null,
      totalClaims: null,
      claimsTrend: null,
      approvalRate: null,
      resolvedClaims: 0,
      avgResolutionTime: "N/A",
      topCategory: "None",
      topCategoryCount: 0,
      topLocation: "Campus Wide",
    },
    itemsReportedData: [],
    topCategoriesData: [],
    claimResolutionData: [],
    breakdownItems: [],
    rangeLabel: "All Time",
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [tableTypeFilter, setTableTypeFilter] = useState("all");

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = `/admin/reports?range=${selectedRange}`;
      if (selectedRange === "custom" && customStart && customEnd) {
        query += `&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }

      const res = await API.get(query);
      let reportData = res.data;

      // Fallback: If breakdownItems or items are not returned by older backend, fetch items list
      if (!reportData.breakdownItems || reportData.breakdownItems.length === 0) {
        try {
          const itemsRes = await API.get("/items");
          if (Array.isArray(itemsRes.data)) {
            reportData.breakdownItems = itemsRes.data;
          }
        } catch (e) {}
      }

      setData(reportData);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedRange]);

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    setShowCustomModal(false);
    fetchReports();
  };

  // 1. Calculate Total Items
  const calculatedTotalItems =
    data.kpis?.totalItems !== null && data.kpis?.totalItems !== undefined
      ? data.kpis.totalItems
      : (data.breakdownItems?.length ||
          (data.itemsReportedData || []).reduce(
            (acc, curr) => acc + (curr.lost || 0) + (curr.found || 0),
            0
          ));

  // 2. Calculate Total Claims
  const calculatedTotalClaims =
    data.kpis?.totalClaims !== null && data.kpis?.totalClaims !== undefined
      ? data.kpis.totalClaims
      : (data.claimResolutionData || []).reduce(
          (acc, curr) => acc + (curr.value || 0),
          0
        );

  // 3. Calculate Approval Rate
  const resolvedClaims = (data.claimResolutionData || [])
    .filter((c) => c.name?.toLowerCase() === "approved" || c.name?.toLowerCase() === "rejected")
    .reduce((acc, curr) => acc + curr.value, 0);

  const approvedClaims = (data.claimResolutionData || []).find(
    (c) => c.name?.toLowerCase() === "approved"
  )?.value || 0;

  const calculatedApprovalRate =
    data.kpis?.approvalRate !== null && data.kpis?.approvalRate !== undefined
      ? data.kpis.approvalRate
      : resolvedClaims > 0
      ? Math.round((approvedClaims / resolvedClaims) * 100)
      : calculatedTotalClaims > 0
      ? Math.round((approvedClaims / calculatedTotalClaims) * 100)
      : 0;

  // 4. Calculate Top Category
  const topCategoryName =
    data.kpis?.topCategory && data.kpis?.topCategory !== "None"
      ? data.kpis.topCategory
      : data.topCategoriesData?.[0]?.name || (data.breakdownItems?.[0]?.category || "None");

  const topCategoryCount =
    data.kpis?.topCategoryCount || (data.topCategoriesData?.[0]?.value || (data.breakdownItems?.length ? 1 : 0));

  // 5. Calculate Top Location
  const topLocationName =
    data.kpis?.topLocation && data.kpis?.topLocation !== "None"
      ? data.kpis.topLocation
      : (data.breakdownItems?.find((i) => i.location)?.location || "Campus Wide");

  // Dynamic Timeline Points for Connected Line Graph
  const timelinePoints = useMemo(() => {
    if (data.itemsReportedData && data.itemsReportedData.length > 0) {
      return data.itemsReportedData;
    }
    if (data.breakdownItems && data.breakdownItems.length > 0) {
      const map = {};
      data.breakdownItems.forEach((item) => {
        const d = item.createdAt
          ? new Date(item.createdAt).toISOString().split("T")[0]
          : "Recent";
        if (!map[d]) map[d] = { name: d, lost: 0, found: 0 };
        if (item.type?.toLowerCase() === "lost") map[d].lost += 1;
        else map[d].found += 1;
      });
      return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [data.itemsReportedData, data.breakdownItems]);

  // Robust Client-Side and Server-Side PDF Export
  const handleExportPDF = async () => {
    try {
      setExporting(true);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      // 1. BRANDED HEADER BANNER
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.roundedRect(margin, margin, contentWidth, 54, 6, 6, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("FoundIT", margin + 16, margin + 26);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(
        "|   System Analytics & Official Activity Report",
        margin + 80,
        margin + 26
      );

      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Date Range: ${data.rangeLabel || (selectedRange === "all" ? "All Time" : selectedRange)}    •    Generated: ${dateStr}`,
        margin + 16,
        margin + 43
      );

      let curY = margin + 72;

      // 2. EXECUTIVE SUMMARY & KPIS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Executive Summary & KPIs", margin, curY);

      curY += 12;

      const cardW = (contentWidth - 20) / 3;
      const cardH = 50;

      const cards = [
        {
          title: "TOTAL ITEMS POSTED",
          val: String(calculatedTotalItems ?? 0),
          sub: "Across lost & found",
        },
        {
          title: "TOTAL CLAIMS",
          val: String(calculatedTotalClaims ?? 0),
          sub: "Student claims",
        },
        {
          title: "CLAIM APPROVAL RATE",
          val: `${calculatedApprovalRate ?? 0}%`,
          sub: "Resolved claims",
        },
        {
          title: "AVG RESOLUTION TIME",
          val: data.kpis?.avgResolutionTime || "< 1 day",
          sub: "From post to decision",
        },
        {
          title: "TOP CATEGORY",
          val: topCategoryName || "None",
          sub: `${topCategoryCount} items logged`,
        },
        {
          title: "COMMON LOCATION",
          val: topLocationName || "Campus Wide",
          sub: "Hotspot area",
        },
      ];

      cards.forEach((card, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = margin + col * (cardW + 10);
        const y = curY + row * (cardH + 8);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.roundedRect(x, y, cardW, cardH, 4, 4, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(card.title, x + 8, y + 14);

        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(card.val, x + 8, y + 31);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(card.sub, x + 8, y + 43);
      });

      curY += 2 * (cardH + 8) + 16;

      // 3. CATEGORY & CLAIM RESOLUTION SUMMARY
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Category & Resolution Breakdown", margin, curY);

      curY += 14;

      const catSummary = (data.topCategoriesData || [])
        .slice(0, 4)
        .map((c) => `${c.name}: ${c.value}`)
        .join("   •   ");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Top Categories: ${catSummary || "General data"}`,
        margin + 6,
        curY + 4
      );

      const approved =
        data.claimResolutionData?.find((c) => c.name?.toLowerCase() === "approved")
          ?.value || 0;
      const rejected =
        data.claimResolutionData?.find((c) => c.name?.toLowerCase() === "rejected")
          ?.value || 0;
      const pending =
        data.claimResolutionData?.find((c) => c.name?.toLowerCase() === "pending")
          ?.value || 0;
      doc.text(
        `Claim Decisions: ${approved} Approved   •   ${rejected} Rejected   •   ${pending} Pending`,
        margin + 6,
        curY + 16
      );

      curY += 30;

      // 4. ITEMIZED ACTIVITY BREAKDOWN TABLE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("3. Itemized Activity Log", margin, curY);

      curY += 8;

      const tableRows = (data.breakdownItems || []).map((item) => [
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-",
        item.title || "Untitled",
        (item.type || "lost").toUpperCase(),
        item.category || "-",
        item.status || "open",
        item.location || "-",
        item.user?.name || item.user?.email || "Anonymous",
      ]);

      autoTable(doc, {
        startY: curY,
        head: [
          [
            "DATE",
            "ITEM TITLE",
            "TYPE",
            "CATEGORY",
            "STATUS",
            "LOCATION",
            "REPORTED BY",
          ],
        ],
        body:
          tableRows.length > 0
            ? tableRows
            : [["-", "No items recorded in selected range.", "", "", "", "", ""]],
        theme: "striped",
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: margin, right: margin, bottom: 40 },
        styles: {
          cellPadding: 4,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 125, fontStyle: "bold", textColor: [15, 23, 42] },
          2: { cellWidth: 45, fontStyle: "bold" },
          3: { cellWidth: 70 },
          4: { cellWidth: 50 },
          5: { cellWidth: 85 },
          6: { cellWidth: 90 },
        },
        didDrawPage: (hookData) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            "Generated by FoundIT Admin Dashboard",
            margin,
            pageHeight - 20
          );
          doc.text(
            `Page ${hookData.pageNumber} of ${pageCount}`,
            pageWidth - margin - 50,
            pageHeight - 20
          );
        },
      });

      const fileDate = new Date().toISOString().split("T")[0];
      doc.save(`FoundIT_Report_${fileDate}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to export PDF report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Filter breakdown items
  const filteredBreakdown = (data.breakdownItems || []).filter((item) => {
    const matchesSearch =
      !tableSearch ||
      item.title?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.category?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.location?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.user?.name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.user?.email?.toLowerCase().includes(tableSearch.toLowerCase());

    const matchesType =
      tableTypeFilter === "all" || item.type?.toLowerCase() === tableTypeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  const maxCategoryVolume =
    data.topCategoriesData?.length > 0
      ? Math.max(...data.topCategoriesData.map((c) => c.value))
      : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Reports & Insights
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Data-driven analytics, KPI trends, and downloadable executive summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {DATE_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  if (r.id === "custom") {
                    setShowCustomModal(true);
                  } else {
                    setSelectedRange(r.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRange === r.id
                    ? "bg-white text-indigo-600 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Export Report Button */}
          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {exporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={16} />
                Export PDF Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Range Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs font-medium text-indigo-900">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-indigo-600" />
          <span>
            Active Filter: <strong>{data.rangeLabel || (selectedRange === "all" ? "All Time" : selectedRange)}</strong>
          </span>
        </div>
        <span className="text-indigo-600 font-semibold">
          Auto-synced with charts and PDF exports
        </span>
      </div>

      {/* 1. Summary KPI Cards Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Items Posted
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Package size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {calculatedTotalItems}
            </span>
            {data.kpis?.itemsTrend !== null && data.kpis?.itemsTrend !== undefined && (
              <span
                className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                  data.kpis.itemsTrend >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {data.kpis.itemsTrend >= 0 ? (
                  <TrendingUp size={12} className="mr-1" />
                ) : (
                  <TrendingDown size={12} className="mr-1" />
                )}
                {data.kpis.itemsTrend >= 0 ? "+" : ""}
                {data.kpis.itemsTrend}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across lost & found reports
          </p>
        </div>

        {/* Total Claims */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Claims Submitted
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {calculatedTotalClaims}
            </span>
            {data.kpis?.claimsTrend !== null && data.kpis?.claimsTrend !== undefined && (
              <span
                className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                  data.kpis.claimsTrend >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {data.kpis.claimsTrend >= 0 ? (
                  <TrendingUp size={12} className="mr-1" />
                ) : (
                  <TrendingDown size={12} className="mr-1" />
                )}
                {data.kpis.claimsTrend >= 0 ? "+" : ""}
                {data.kpis.claimsTrend}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Student ownership claims
          </p>
        </div>

        {/* Approval Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Claim Approval Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {calculatedApprovalRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {resolvedClaims} resolved claims recorded
          </p>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Avg. Resolution Time
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {data.kpis?.avgResolutionTime && data.kpis?.avgResolutionTime !== "N/A"
                ? data.kpis.avgResolutionTime
                : "< 1 day"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            From claim post to decision
          </p>
        </div>

        {/* Top Reporting Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top Active Category
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Tag size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 truncate">
              {topCategoryName}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {topCategoryCount} items recorded
          </p>
        </div>

        {/* Most Common Lost Location */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Common Lost Location
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <MapPin size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-900 truncate">
              {topLocationName}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Primary lost item hotspot
          </p>
        </div>
      </div>

      {/* 2. Charts Section (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Dot-Line Timeline Graph */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-bold text-slate-900">
                Items Reported Over Time
              </h2>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-sm"></div>{" "}
                  Lost Items
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>{" "}
                  Found Items
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Activity timeline with connected data points
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <ConnectedTimelineChart
              dataPoints={timelinePoints}
              totalItems={calculatedTotalItems}
            />
          </div>
        </div>

        {/* Claim Resolution Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Claim Resolution
            </h2>
            <p className="text-xs text-slate-400">
              Status distribution
            </p>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  className="text-slate-100"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="3.8"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 transition-all duration-1000"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="3.8"
                  strokeDasharray={`${calculatedApprovalRate}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-900">
                  {calculatedApprovalRate}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Approval Rate
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div>
                <span className="block text-xs font-bold text-emerald-600">
                  {data.claimResolutionData?.find((c) => c.name?.toLowerCase() === "approved")?.value || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Approved</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-red-600">
                  {data.claimResolutionData?.find((c) => c.name?.toLowerCase() === "rejected")?.value || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Rejected</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-amber-600">
                  {data.claimResolutionData?.find((c) => c.name?.toLowerCase() === "pending")?.value || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Categories Progress Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Volume by Item Category
            </h2>
            <p className="text-xs text-slate-400">
              Ranked by frequency of reporting
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {data.topCategoriesData?.length > 0 ? (
            data.topCategoriesData.map((cat, idx) => {
              const pct = Math.max(Math.round((cat.value / maxCategoryVolume) * 100), 6);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 text-slate-400 font-mono text-[11px]">
                        #{idx + 1}
                      </span>
                      {cat.name}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {cat.value} items
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center text-slate-400 text-sm py-4">
              All categories tracked live in real-time.
            </div>
          )}
        </div>
      </div>

      {/* 4. Detailed Breakdown Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Itemized Activity Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              Detailed list of {filteredBreakdown.length} items logged
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search items, locations, users..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={tableTypeFilter}
              onChange={(e) => setTableTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="lost">Lost Only</option>
              <option value="found">Found Only</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Item Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Reported By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBreakdown.length > 0 ? (
                filteredBreakdown.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900 max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          item.type?.toLowerCase() === "lost"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">{item.category || "-"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          item.status === "claimed"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status || "open"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-[150px] truncate">
                      {item.location || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {item.user?.name || "Anonymous"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.user?.email || ""}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-8 text-center text-slate-400 text-xs"
                  >
                    No items found matching the selected range and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Date Range Picker Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Calendar size={18} className="text-indigo-600" />
              <h3>Select Custom Date Range</h3>
            </div>

            <form onSubmit={handleApplyCustomRange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => setSelectedRange("custom")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
