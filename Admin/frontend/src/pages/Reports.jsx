import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import API from "../api";

const Reports = () => {
  const [data, setData] = useState({
    itemsReportedData: [],
    topCategoriesData: [],
    claimResolutionData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await API.get("/admin/reports");
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const totalClaims = data.claimResolutionData.reduce((acc, curr) => acc + curr.value, 0);
  const resolvedClaims = data.claimResolutionData.filter(c => c.name === "Approved" || c.name === "Rejected").reduce((acc, curr) => acc + curr.value, 0);
  const resolutionRate = totalClaims > 0 ? Math.round((resolvedClaims / totalClaims) * 100) : 0;
  
  const maxCategoryVolume = data.topCategoriesData.length > 0 ? Math.max(...data.topCategoriesData.map(c => c.value)) : 1;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading reports...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports</h1>
          <p className="text-slate-500">
            Insights and trends across the lost & found system.
          </p>
        </div>

        <button 
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          onClick={() => {
            const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = "reports.json";
            link.click();
          }}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Items Reported Over Time
              </h2>
              <div className="text-sm text-slate-500">History</div>
            </div>
          </div>

          <div className="flex-1 relative w-full h-full flex flex-col justify-end mt-4">
             {/* Simple bar chart approximation for dates */}
             <div className="flex items-end h-48 gap-1">
                {data.itemsReportedData.map((day, idx) => {
                  const maxVal = Math.max(...data.itemsReportedData.map(d => d.lost + d.found)) || 1;
                  const heightPct = Math.max(((day.lost + day.found) / maxVal) * 100, 2);
                  return (
                    <div key={idx} className="flex-1 bg-indigo-500 rounded-t-sm" style={{ height: `${heightPct}%` }} title={`${day.name}: ${day.lost} lost, ${day.found} found`}></div>
                  );
                })}
             </div>
             {data.itemsReportedData.length === 0 && (
               <div className="text-slate-400 text-center w-full">No data available</div>
             )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Claim Resolution Rate
          </h2>
          <div className="text-sm text-slate-500 mb-8">All time</div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 mb-8">
              <svg viewBox="0 0 36 36" className="w-full h-full circular-chart">
                <path
                  className="stroke-slate-200"
                  fill="none"
                  strokeWidth="4"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="stroke-indigo-600"
                  fill="none"
                  strokeWidth="4"
                  strokeDasharray={`${resolutionRate}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-slate-800">{resolutionRate}%</div>
                <div className="text-xs font-medium text-slate-500">
                  Resolved
                </div>
              </div>
            </div>

            <div className="w-full flex justify-between px-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>{" "}
                Resolved ({resolvedClaims})
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>{" "}
                Pending ({data.claimResolutionData.find(c => c.name === "Pending")?.value || 0})
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">
          Top Lost Categories
        </h2>
        <div className="text-sm text-slate-500 mb-8">Breakdown by volume</div>

        <div className="space-y-6">
          {data.topCategoriesData.length > 0 ? (
            data.topCategoriesData.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>{cat.name}</span>
                  <span className="font-mono text-slate-500">{cat.value} items</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${(cat.value / maxCategoryVolume) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-400">No category data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
