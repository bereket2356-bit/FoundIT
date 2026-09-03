import React, { useState } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Calendar, MapPin, Phone, Tag, AlignLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import API from "../api";

const CATEGORIES = [
  "Keys",
  "Electronics",
  "Bag",
  "Phone",
  "Clothes",
  "Documents",
  "Other",
];

const ReportItemModal = ({ isOpen, onClose, defaultType = "found", onItemCreated }) => {
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', title: '', message: '' }

  // Sync defaultType whenever modal opens with a specific default
  React.useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      resetForm();
    }
  }, [isOpen, defaultType]);

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setLocation("");
    setDate("");
    setDescription("");
    setContactInfo("");
    setImage(null);
    setImageName("");
    setAlert(null);
  };

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlert({
        type: "error",
        title: "Image Too Large",
        message: "Please choose an image under 5MB.",
      });
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation matching app/(tabs)/post.tsx
    if (!title.trim() || !category || !location.trim() || !description.trim() || !contactInfo.trim() || !image) {
      setAlert({
        type: "error",
        title: "Missing Fields",
        message: "Please fill in all required fields including Contact Info and Item Image.",
      });
      return;
    }

    if (type === "found" && !date) {
      setAlert({
        type: "error",
        title: "Missing Fields",
        message: "Please provide a Date Found.",
      });
      return;
    }

    // Format date string YYYY-MM-DD
    let finalDate = date.trim();
    if (finalDate) {
      const parsed = Date.parse(finalDate);
      if (!isNaN(parsed)) {
        finalDate = new Date(parsed).toISOString().split("T")[0];
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        type,
        title: title.trim(),
        category,
        location: location.trim(),
        date: finalDate,
        description: description.trim(),
        contactInfo: contactInfo.trim(),
        image,
      };

      const res = await API.post("/items", payload);

      setAlert({
        type: "success",
        title: "Item Posted Successfully",
        message: `The ${type === "found" ? "found" : "lost"} item has been published to FoundIT.`,
      });

      if (onItemCreated && res.data) {
        onItemCreated(res.data);
      }
    } catch (err) {
      console.error("Error creating item:", err);
      setAlert({
        type: "error",
        title: "Failed to Post Item",
        message: err.response?.data?.message || "Could not save item to server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Report {type === "found" ? "Found" : "Lost"} Item
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit a new item entry directly to the FoundIT database
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Item Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Item Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType("found")}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === "found"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Found Item
              </button>
              <button
                type="button"
                onClick={() => setType("lost")}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === "lost"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lost Item
              </button>
            </div>
          </div>

          {/* Image Upload Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Item Image <span className="text-rose-500">*</span>
            </label>
            {image ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-48 flex items-center justify-center">
                <img
                  src={image}
                  alt="Item Preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="cursor-pointer bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImageName("");
                    }}
                    className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer group">
                <div className="p-3 bg-white group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-600 rounded-full mb-2 transition-colors shadow-sm">
                  <Upload size={22} />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600">
                  Click to upload item photo
                </span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Blue Herschel Backpack"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                >
                  <option value="">Select Category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Library 2nd Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {type === "found" ? (
                  <>
                    Date Found <span className="text-rose-500">*</span>
                  </>
                ) : (
                  <>
                    Date Lost <span className="text-slate-400 font-normal">(Optional)</span>
                  </>
                )}
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required={type === "found"}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Contact Info <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Phone number or Telegram handle (@username)"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe the item distinguishing marks, condition, color, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Posting Item...
                </>
              ) : (
                `Post ${type === "found" ? "Found" : "Lost"} Item`
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Semi-transparent Black Success / Error Alert Modal */}
      {alert && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                alert.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {alert.type === "success" ? (
                <CheckCircle2 size={32} />
              ) : (
                <AlertCircle size={32} />
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{alert.title}</h3>
            <p className="text-sm text-slate-400 mb-6">{alert.message}</p>
            <button
              onClick={() => {
                if (alert.type === "success") {
                  setAlert(null);
                  onClose();
                } else {
                  setAlert(null);
                }
              }}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                alert.type === "success"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {alert.type === "success" ? "Continue" : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportItemModal;
