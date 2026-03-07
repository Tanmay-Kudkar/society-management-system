import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classifiedApi } from "../../../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PageShell from "../../components/PageShell";
import {
  Store,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Tag,
  Flag,
  FlagOff,
  Check,
  ShoppingCart,
  XCircle,
} from "lucide-react";

const categoryOptions = [
  { value: "FURNITURE", label: "Furniture" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "APPLIANCES", label: "Appliances" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "BOOKS", label: "Books" },
  { value: "SPORTS", label: "Sports & Fitness" },
  { value: "TOYS", label: "Toys & Games" },
  { value: "VEHICLES", label: "Vehicles" },
  { value: "HOME_DECOR", label: "Home Decor" },
  { value: "SERVICES", label: "Services" },
  { value: "GENERAL", label: "General" },
];

const listingTypeOptions = [
  { value: "SELL", label: "For Sale" },
  { value: "RENT", label: "For Rent" },
  { value: "FREE", label: "Free / Giveaway" },
  { value: "WANTED", label: "Wanted" },
];

const conditionOptions = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

const statusBadge = (s) => {
  const map = {
    ACTIVE: "bg-[#dcfce7] text-[#166534]",
    SOLD: "bg-[#e0e7ff] text-[#3730a3]",
    CLOSED: "bg-[#f3f4f6] text-[#6b7280]",
  };
  return map[s] || "";
};

const itemBorderMap = {
  active: 'border-l-4 border-l-[var(--success,#22c55e)]',
  sold: 'border-l-4 border-l-[var(--primary,#6366f1)]',
  closed: 'border-l-4 border-l-[var(--text-secondary)]',
  flagged: 'border-l-4 border-l-[var(--error,#ef4444)]',
};

const listingEmoji = (type) => {
  const map = { SELL: "🏷️", RENT: "🔑", FREE: "🎁", WANTED: "🔍" };
  return map[type] || "📦";
};

export default function Classifieds() {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const societyId = user?.societyId;
  const userId = user?.id;
  const canLoadSocietyData = Boolean(societyId && userId);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [flagId, setFlagId] = useState(null);
  const [flagReason, setFlagReason] = useState("");

  const empty = {
    societyId,
    postedById: userId,
    flatNumber: "",
    wing: "",
    title: "",
    description: "",
    category: "GENERAL",
    listingType: "SELL",
    price: "",
    negotiable: false,
    itemCondition: "",
    imageUrls: "",
    contactPhone: "",
    contactEmail: "",
    expiresAt: "",
  };
  const [form, setForm] = useState(empty);

  const queryParams = {};
  if (filterStatus) queryParams.status = filterStatus;
  if (filterCategory) queryParams.category = filterCategory;
  if (filterType) queryParams.listingType = filterType;

  const { data, isLoading } = useQuery({
    queryKey: [
      "classifieds",
      societyId,
      filterStatus,
      filterCategory,
      filterType,
    ],
    queryFn: () =>
      classifiedApi
        .getBySociety(societyId, userId, queryParams)
        .then((r) => r.data),
    enabled: canLoadSocietyData,
  });

  const { data: counts } = useQuery({
    queryKey: ["classifieds-counts", societyId],
    queryFn: () =>
      classifiedApi.getCounts(societyId, userId).then((r) => r.data),
    enabled: canLoadSocietyData,
  });

  const items = data?.content || [];
  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.postedByName?.toLowerCase().includes(q) ||
        c.flatNumber?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const mut = (fn, msg) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(msg);
        qc.invalidateQueries({ queryKey: ["classifieds"] });
        qc.invalidateQueries({ queryKey: ["classifieds-counts"] });
      },
      onError: () => toast.error("Operation failed"),
    });

  const createMut = mut(
    (d) => classifiedApi.create(userId, d),
    "Listing created",
  );
  const updateMut = mut(
    ({ id, ...d }) => classifiedApi.update(id, userId, d),
    "Listing updated",
  );
  const deleteMut = mut(
    (id) => classifiedApi.delete(id, userId),
    "Listing deleted",
  );
  const soldMut = mut(
    (id) => classifiedApi.markSold(id, userId),
    "Marked as sold",
  );
  const closeMut = mut(
    (id) => classifiedApi.markClosed(id, userId),
    "Listing closed",
  );
  const flagMut = mut(
    ({ id, reason }) => classifiedApi.flag(id, userId, reason),
    "Listing flagged",
  );
  const unflagMut = mut(
    (id) => classifiedApi.unflag(id, userId),
    "Flag removed",
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      societyId,
      postedById: c.postedById,
      flatNumber: c.flatNumber || "",
      wing: c.wing || "",
      title: c.title,
      description: c.description || "",
      category: c.category,
      listingType: c.listingType,
      price: c.price || "",
      negotiable: c.negotiable || false,
      itemCondition: c.itemCondition || "",
      imageUrls: c.imageUrls || "",
      contactPhone: c.contactPhone || "",
      contactEmail: c.contactEmail || "",
      expiresAt: c.expiresAt ? c.expiresAt.substring(0, 16) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: form.price ? Number(form.price) : null,
      expiresAt: form.expiresAt || null,
    };
    if (editing) updateMut.mutate({ id: editing.id, ...payload });
    else createMut.mutate(payload);
    setShowModal(false);
  };

  const handleFlag = () => {
    flagMut.mutate({ id: flagId, reason: flagReason });
    setFlagId(null);
    setFlagReason("");
  };

  const summaryCards = [
    { label: "Active", value: counts?.active || 0, cls: "border-l-4 border-l-[var(--success,#22c55e)]" },
    { label: "Sold", value: counts?.sold || 0, cls: "border-l-4 border-l-[var(--primary,#6366f1)]" },
    { label: "Closed", value: counts?.closed || 0, cls: "border-l-4 border-l-[var(--text-secondary)]" },
    { label: "Flagged", value: counts?.flagged || 0, cls: "border-l-4 border-l-[var(--error,#ef4444)]" },
  ];

  return (
    <PageShell
      title="Classifieds"
      icon={Store}
      subtitle="Internal marketplace for buying, selling & sharing"
      loading={canLoadSocietyData && isLoading}
    >
      {/* Summary */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 mb-6">
        {summaryCards.map((c) => (
          <div key={c.label} className={`flex flex-col items-center px-3 py-4 rounded-xl bg-[var(--card)] border border-[var(--border-default)] ${c.cls}`}>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">{c.value}</span>
            <span className="text-[0.8rem] text-[var(--text-secondary)] mt-[0.15rem]">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-[0.4rem] bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-[0.4rem] flex-1 min-w-[180px]">
          <Search size={16} />
          <input
            className="border-none bg-transparent outline-none w-full text-[0.92rem] text-[var(--text-primary)]"
            placeholder="Search listings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SOLD">Sold</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {listingTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" onClick={openCreate}>
          <Plus size={16} /> Post Listing
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-[0.85rem]">
        {filtered.length === 0 && (
          <p className="text-center text-[var(--text-secondary)] p-10">No listings found.</p>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`bg-[var(--card)] border border-[var(--border-default)] rounded-xl px-[1.2rem] py-4 ${itemBorderMap[c.flagged ? 'flagged' : c.status?.toLowerCase()] || ''}`}
          >
            <div className="flex justify-between items-center mb-[0.45rem]">
              <div className="flex items-center gap-2 text-base">
                <span className="text-[1.15rem]">
                  {listingEmoji(c.listingType)}
                </span>
                <strong>{c.title}</strong>
                <span className="text-[0.78rem] text-[var(--text-secondary)] bg-[var(--bg-card)] py-[0.15rem] px-[0.55rem] rounded-full">
                  {categoryOptions.find((o) => o.value === c.category)?.label ||
                    c.category}
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}
              >
                {c.flagged && (
                  <span className="text-xs font-bold py-[0.2rem] px-[0.65rem] rounded-full uppercase bg-[#fee2e2] text-[#991b1b]">⚠ Flagged</span>
                )}
                <span className={`text-xs font-bold py-[0.2rem] px-[0.65rem] rounded-full uppercase ${statusBadge(c.status)}`}>
                  {c.status}
                </span>
              </div>
            </div>
            {c.description && (
              <div className="text-[0.88rem] text-[var(--text-primary)] mb-[0.3rem]">{c.description}</div>
            )}
            <div className="flex flex-wrap gap-3 text-[0.84rem] text-[var(--text-secondary)] mb-[0.35rem]">
              <span>By: {c.postedByName}</span>
              {c.flatNumber && <span>Flat: {c.flatNumber}</span>}
              {c.wing && <span>Wing: {c.wing}</span>}
              <span>
                {listingTypeOptions.find((o) => o.value === c.listingType)
                  ?.label || c.listingType}
              </span>
              {c.price != null && (
                <span>
                  ₹{Number(c.price).toLocaleString("en-IN")}
                  {c.negotiable ? " (Negotiable)" : ""}
                </span>
              )}
              {c.itemCondition && (
                <span>
                  Condition:{" "}
                  {conditionOptions.find((o) => o.value === c.itemCondition)
                    ?.label || c.itemCondition}
                </span>
              )}
              {c.views > 0 && <span>{c.views} views</span>}
            </div>
            {c.contactPhone && (
              <div className="text-[0.84rem] text-[var(--text-secondary)] mb-[0.2rem]">📞 {c.contactPhone}</div>
            )}
            {c.flagReason && (
              <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Flag reason: {c.flagReason}</div>
            )}
            <div className="flex flex-wrap gap-[0.45rem] mt-[0.6rem]">
              {c.status === "ACTIVE" && (
                <>
                  <button
                    className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white"
                    onClick={() => soldMut.mutate(c.id)}
                  >
                    <ShoppingCart size={14} /> Mark Sold
                  </button>
                  <button
                    className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--text-secondary)] text-white"
                    onClick={() => closeMut.mutate(c.id)}
                  >
                    <XCircle size={14} /> Close
                  </button>
                </>
              )}
              {!c.flagged && (
                <button
                  className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--error,#ef4444)] text-white"
                  onClick={() => {
                    setFlagId(c.id);
                    setFlagReason("");
                  }}
                >
                  <Flag size={14} /> Flag
                </button>
              )}
              {c.flagged && (
                <button
                  className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[#06b6d4] text-white"
                  onClick={() => unflagMut.mutate(c.id)}
                >
                  <FlagOff size={14} /> Unflag
                </button>
              )}
              <button
                className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]"
                onClick={() => openEdit(c)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-transparent text-[var(--error,#ef4444)] border border-[var(--error,#ef4444)]"
                onClick={() => deleteMut.mutate(c.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Flag Modal */}
      {flagId && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={() => setFlagId(null)}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-[1.1rem]">Flag Listing</h3>
              <button
                className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]"
                onClick={() => setFlagId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-[0.3rem] col-span-full">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Reason</label>
                <textarea
                  className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                  rows={3}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-[0.65rem] mt-5">
                <button
                  className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  onClick={() => setFlagId(null)}
                >
                  Cancel
                </button>
                <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--error,#ef4444)] text-white" onClick={handleFlag}>
                  Flag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={() => setShowModal(false)}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-[1.1rem]">{editing ? "Edit Listing" : "Post Listing"}</h3>
              <button
                className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="p-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-[0.9rem] items-start">
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Title *</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Category *</label>
                  <select
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categoryOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Listing Type *</label>
                  <select
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    value={form.listingType}
                    onChange={(e) =>
                      setForm({ ...form, listingType: e.target.value })
                    }
                  >
                    {listingTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Price (₹)</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Condition</label>
                  <select
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    value={form.itemCondition}
                    onChange={(e) =>
                      setForm({ ...form, itemCondition: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    {conditionOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label
                    className="text-[0.82rem] font-semibold text-[var(--text-secondary)] flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={form.negotiable}
                      onChange={(e) =>
                        setForm({ ...form, negotiable: e.target.checked })
                      }
                    />
                    Negotiable
                  </label>
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Flat Number</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    value={form.flatNumber}
                    onChange={(e) =>
                      setForm({ ...form, flatNumber: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Wing</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    value={form.wing}
                    onChange={(e) => setForm({ ...form, wing: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Contact Phone</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm({ ...form, contactPhone: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Contact Email</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Description</label>
                  <textarea
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-[0.65rem] mt-5">
                <button
                  type="button"
                  className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white">
                  {editing ? "Update" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
