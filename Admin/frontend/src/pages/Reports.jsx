import { Download } from "lucide-react";

const Reports = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports</h1>
          <p className="text-slate-500">
            Insights and trends across the lost & found system.
          </p>
        </div>

        <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
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
              <div className="text-sm text-slate-500">Last 30 Days</div>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
              +12% vs last month
            </div>
          </div>

          <div className="flex-1 relative w-full h-full flex items-end">
            {/* Chart placeholder */}
            <div className="absolute inset-0 flex flex-col justify-between py-4">
              <div className="border-t-2 border-dashed border-slate-200 w-full"></div>
              <div className="border-t-2 border-dashed border-slate-200 w-full"></div>
              <div className="border-t-2 border-dashed border-slate-200 w-full"></div>
            </div>

            <svg
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className="w-full h-48 relative z-10 stroke-indigo-500 fill-indigo-50/50"
              strokeWidth="0.5"
            >
              <path d="M0 35 Q 10 25, 20 30 T 40 10 T 60 30 T 80 5 T 100 20 L 100 40 L 0 40 Z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Claim Resolution Rate
          </h2>
          <div className="text-sm text-slate-500 mb-8">All time</div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 mb-8">
              {/* Donut chart placeholder */}
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
                  strokeDasharray="75, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-slate-800">75%</div>
                <div className="text-xs font-medium text-slate-500">
                  Resolved
                </div>
              </div>
            </div>

            <div className="w-full flex justify-between px-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>{" "}
                Resolved
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>{" "}
                Pending
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
          <div>
            <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
              <span>Electronics</span>
              <span className="font-mono text-slate-500">450 items</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
              <span>Clothing</span>
              <span className="font-mono text-slate-500">320 items</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-indigo-400 h-2.5 rounded-full"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
              <span>Keys & IDs</span>
              <span className="font-mono text-slate-500">210 items</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-indigo-300 h-2.5 rounded-full"
                style={{ width: "40%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
