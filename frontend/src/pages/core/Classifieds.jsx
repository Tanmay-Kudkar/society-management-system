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
    ACTIVE: "cl-badge--active",
    SOLD: "cl-badge--sold",
    CLOSED: "cl-badge--closed",
  };
  return map[s] || "";
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
    { label: "Active", value: counts?.active || 0, cls: "cl-card--active" },
    { label: "Sold", value: counts?.sold || 0, cls: "cl-card--sold" },
    { label: "Closed", value: counts?.closed || 0, cls: "cl-card--closed" },
    { label: "Flagged", value: counts?.flagged || 0, cls: "cl-card--flagged" },
  ];

  return (
    <PageShell
      title="Classifieds"
      icon={Store}
      subtitle="Internal marketplace for buying, selling & sharing"
      loading={canLoadSocietyData && isLoading}
    >
      {/* Summary */}
      <div className="cl-summary">
        {summaryCards.map((c) => (
          <div key={c.label} className={`cl-summary-card ${c.cls}`}>
            <span className="cl-summary-value">{c.value}</span>
            <span className="cl-summary-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="cl-toolbar">
        <div className="cl-search-wrap">
          <Search size={16} />
          <input
            className="cl-search"
            placeholder="Search listings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="cl-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SOLD">Sold</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          className="cl-filter"
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
          className="cl-filter"
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
        <button className="cl-btn cl-btn--primary" onClick={openCreate}>
          <Plus size={16} /> Post Listing
        </button>
      </div>

      {/* List */}
      <div className="cl-list">
        {filtered.length === 0 && (
          <p className="cl-empty">No listings found.</p>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`cl-item cl-item--${c.status?.toLowerCase()} ${c.flagged ? "cl-item--flagged" : ""}`}
          >
            <div className="cl-item-header">
              <div className="cl-item-title">
                <span className="cl-item-emoji">
                  {listingEmoji(c.listingType)}
                </span>
                <strong>{c.title}</strong>
                <span className="cl-item-cat">
                  {categoryOptions.find((o) => o.value === c.category)?.label ||
                    c.category}
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}
              >
                {c.flagged && (
                  <span className="cl-badge cl-badge--flagged">⚠ Flagged</span>
                )}
                <span className={`cl-badge ${statusBadge(c.status)}`}>
                  {c.status}
                </span>
              </div>
            </div>
            {c.description && (
              <div className="cl-item-desc">{c.description}</div>
            )}
            <div className="cl-item-meta">
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
              <div className="cl-item-contact">📞 {c.contactPhone}</div>
            )}
            {c.flagReason && (
              <div className="cl-item-notes">Flag reason: {c.flagReason}</div>
            )}
            <div className="cl-item-actions">
              {c.status === "ACTIVE" && (
                <>
                  <button
                    className="cl-btn cl-btn--sold"
                    onClick={() => soldMut.mutate(c.id)}
                  >
                    <ShoppingCart size={14} /> Mark Sold
                  </button>
                  <button
                    className="cl-btn cl-btn--close"
                    onClick={() => closeMut.mutate(c.id)}
                  >
                    <XCircle size={14} /> Close
                  </button>
                </>
              )}
              {!c.flagged && (
                <button
                  className="cl-btn cl-btn--flag"
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
                  className="cl-btn cl-btn--unflag"
                  onClick={() => unflagMut.mutate(c.id)}
                >
                  <FlagOff size={14} /> Unflag
                </button>
              )}
              <button
                className="cl-btn cl-btn--edit"
                onClick={() => openEdit(c)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="cl-btn cl-btn--delete"
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
        <div className="cl-overlay" onClick={() => setFlagId(null)}>
          <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>Flag Listing</h3>
              <button
                className="cl-modal-close"
                onClick={() => setFlagId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="cl-form">
              <div className="cl-field cl-field--full">
                <label>Reason</label>
                <textarea
                  rows={3}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                />
              </div>
              <div className="cl-form-actions">
                <button
                  className="cl-btn cl-btn--secondary"
                  onClick={() => setFlagId(null)}
                >
                  Cancel
                </button>
                <button className="cl-btn cl-btn--flag" onClick={handleFlag}>
                  Flag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="cl-overlay" onClick={() => setShowModal(false)}>
          <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>{editing ? "Edit Listing" : "Post Listing"}</h3>
              <button
                className="cl-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="cl-form" onSubmit={handleSubmit}>
              <div className="cl-form-grid">
                <div className="cl-field cl-field--full">
                  <label>Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="cl-field">
                  <label>Category *</label>
                  <select
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
                <div className="cl-field">
                  <label>Listing Type *</label>
                  <select
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
                <div className="cl-field">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>
                <div className="cl-field">
                  <label>Condition</label>
                  <select
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
                <div className="cl-field">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
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
                <div className="cl-field">
                  <label>Flat Number</label>
                  <input
                    value={form.flatNumber}
                    onChange={(e) =>
                      setForm({ ...form, flatNumber: e.target.value })
                    }
                  />
                </div>
                <div className="cl-field">
                  <label>Wing</label>
                  <input
                    value={form.wing}
                    onChange={(e) => setForm({ ...form, wing: e.target.value })}
                  />
                </div>
                <div className="cl-field">
                  <label>Contact Phone</label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm({ ...form, contactPhone: e.target.value })
                    }
                  />
                </div>
                <div className="cl-field">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                  />
                </div>
                <div className="cl-field cl-field--full">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="cl-form-actions">
                <button
                  type="button"
                  className="cl-btn cl-btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cl-btn cl-btn--primary">
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
