import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { societyRuleApi } from "../../../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PageShell from "../../components/PageShell";
import {
  BookOpen,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Check,
  Archive,
  Send,
  Eye,
  AlertTriangle,
} from "lucide-react";

const categoryOptions = [
  { value: "GENERAL", label: "General" },
  { value: "PARKING", label: "Parking" },
  { value: "NOISE", label: "Noise & Nuisance" },
  { value: "PETS", label: "Pets" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "SAFETY", label: "Safety & Security" },
  { value: "COMMON_AREAS", label: "Common Areas" },
  { value: "RENOVATION", label: "Renovation" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "GOVERNANCE", label: "Governance" },
];

const statusBadge = (s) => {
  const map = {
    DRAFT: "sr-badge--draft",
    PUBLISHED: "sr-badge--published",
    APPROVED: "sr-badge--approved",
    ARCHIVED: "sr-badge--archived",
  };
  return map[s] || "";
};

export default function SocietyRules() {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const societyId = user?.societyId;
  const userId = user?.id;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [viewRule, setViewRule] = useState(null);

  const empty = {
    societyId,
    title: "",
    category: "GENERAL",
    description: "",
    content: "",
    effectiveDate: "",
    expiryDate: "",
    version: "1.0",
    isActive: true,
    isMandatory: false,
    attachmentUrl: "",
    sortOrder: 0,
  };
  const [form, setForm] = useState(empty);

  const queryParams = {};
  if (filterStatus) queryParams.status = filterStatus;
  if (filterCategory) queryParams.category = filterCategory;

  const { data, isLoading } = useQuery({
    queryKey: ["society-rules", societyId, filterStatus, filterCategory],
    queryFn: () =>
      societyRuleApi
        .getBySociety(societyId, userId, queryParams)
        .then((r) => r.data),
    enabled: !!societyId,
  });

  const { data: counts } = useQuery({
    queryKey: ["society-rules-counts", societyId],
    queryFn: () =>
      societyRuleApi.getCounts(societyId, userId).then((r) => r.data),
    enabled: !!societyId,
  });

  const rules = data?.content || [];
  const filtered = useMemo(() => {
    if (!search) return rules;
    const q = search.toLowerCase();
    return rules.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q),
    );
  }, [rules, search]);

  const mut = (fn, msg) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(msg);
        qc.invalidateQueries({ queryKey: ["society-rules"] });
        qc.invalidateQueries({ queryKey: ["society-rules-counts"] });
      },
      onError: () => toast.error("Operation failed"),
    });

  const createMut = mut(
    (d) => societyRuleApi.create(userId, d),
    "Rule created",
  );
  const updateMut = mut(
    ({ id, ...d }) => societyRuleApi.update(id, userId, d),
    "Rule updated",
  );
  const deleteMut = mut(
    (id) => societyRuleApi.delete(id, userId),
    "Rule deleted",
  );
  const publishMut = mut(
    (id) => societyRuleApi.publish(id, userId),
    "Rule published",
  );
  const archiveMut = mut(
    (id) => societyRuleApi.archive(id, userId),
    "Rule archived",
  );
  const approveMut = mut(
    (id) => societyRuleApi.approve(id, userId),
    "Rule approved",
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setShowModal(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      societyId,
      title: r.title,
      category: r.category,
      description: r.description || "",
      content: r.content,
      effectiveDate: r.effectiveDate || "",
      expiryDate: r.expiryDate || "",
      version: r.version || "1.0",
      isActive: r.isActive ?? true,
      isMandatory: r.isMandatory ?? false,
      attachmentUrl: r.attachmentUrl || "",
      sortOrder: r.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
      effectiveDate: form.effectiveDate || null,
      expiryDate: form.expiryDate || null,
    };
    if (editing) updateMut.mutate({ id: editing.id, ...payload });
    else createMut.mutate(payload);
    setShowModal(false);
  };

  const summaryCards = [
    { label: "Draft", value: counts?.draft || 0, cls: "sr-card--draft" },
    {
      label: "Published",
      value: counts?.published || 0,
      cls: "sr-card--published",
    },
    {
      label: "Approved",
      value: counts?.approved || 0,
      cls: "sr-card--approved",
    },
    {
      label: "Archived",
      value: counts?.archived || 0,
      cls: "sr-card--archived",
    },
    {
      label: "Mandatory",
      value: counts?.mandatory || 0,
      cls: "sr-card--mandatory",
    },
  ];

  return (
    <PageShell
      title="Society Rules & Bylaws"
      icon={BookOpen}
      subtitle="Manage rules, policies and bylaws"
      loading={isLoading}
    >
      {/* Summary */}
      <div className="sr-summary">
        {summaryCards.map((c) => (
          <div key={c.label} className={`sr-summary-card ${c.cls}`}>
            <span className="sr-summary-value">{c.value}</span>
            <span className="sr-summary-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sr-toolbar">
        <div className="sr-search-wrap">
          <Search size={16} />
          <input
            className="sr-search"
            placeholder="Search rules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="sr-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="APPROVED">Approved</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          className="sr-filter"
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
        <button className="sr-btn sr-btn--primary" onClick={openCreate}>
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {/* List */}
      <div className="sr-list">
        {filtered.length === 0 && <p className="sr-empty">No rules found.</p>}
        {filtered.map((r) => (
          <div
            key={r.id}
            className={`sr-item sr-item--${r.status?.toLowerCase()}`}
          >
            <div className="sr-item-header">
              <div className="sr-item-title">
                <span className="sr-item-emoji">📜</span>
                <strong>{r.title}</strong>
                <span className="sr-item-cat">
                  {categoryOptions.find((o) => o.value === r.category)?.label ||
                    r.category}
                </span>
                {r.isMandatory && (
                  <span className="sr-badge sr-badge--mandatory">
                    Mandatory
                  </span>
                )}
              </div>
              <span className={`sr-badge ${statusBadge(r.status)}`}>
                {r.status}
              </span>
            </div>
            {r.description && (
              <div className="sr-item-desc">{r.description}</div>
            )}
            <div className="sr-item-meta">
              <span>By: {r.createdByName}</span>
              <span>v{r.version}</span>
              {r.effectiveDate && <span>Effective: {r.effectiveDate}</span>}
              {r.expiryDate && <span>Expires: {r.expiryDate}</span>}
              {r.approvedByName && <span>Approved by: {r.approvedByName}</span>}
              {!r.isActive && (
                <span style={{ color: "var(--error)" }}>Inactive</span>
              )}
            </div>
            <div className="sr-item-actions">
              <button
                className="sr-btn sr-btn--view"
                onClick={() => setViewRule(r)}
              >
                <Eye size={14} /> View
              </button>
              {r.status === "DRAFT" && (
                <>
                  <button
                    className="sr-btn sr-btn--publish"
                    onClick={() => publishMut.mutate(r.id)}
                  >
                    <Send size={14} /> Publish
                  </button>
                  <button
                    className="sr-btn sr-btn--approve"
                    onClick={() => approveMut.mutate(r.id)}
                  >
                    <Check size={14} /> Approve
                  </button>
                </>
              )}
              {(r.status === "PUBLISHED" || r.status === "APPROVED") && (
                <button
                  className="sr-btn sr-btn--archive"
                  onClick={() => archiveMut.mutate(r.id)}
                >
                  <Archive size={14} /> Archive
                </button>
              )}
              <button
                className="sr-btn sr-btn--edit"
                onClick={() => openEdit(r)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="sr-btn sr-btn--delete"
                onClick={() => deleteMut.mutate(r.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {viewRule && (
        <div className="sr-overlay" onClick={() => setViewRule(null)}>
          <div
            className="sr-modal sr-modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sr-modal-header">
              <h3>{viewRule.title}</h3>
              <button
                className="sr-modal-close"
                onClick={() => setViewRule(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="sr-view-content">
              {viewRule.description && (
                <p className="sr-view-desc">{viewRule.description}</p>
              )}
              <div
                className="sr-view-body"
                dangerouslySetInnerHTML={{
                  __html: viewRule.content?.replace(/\n/g, "<br/>"),
                }}
              />
              <div className="sr-view-meta">
                <span>
                  Category:{" "}
                  {
                    categoryOptions.find((o) => o.value === viewRule.category)
                      ?.label
                  }
                </span>
                <span>Version: {viewRule.version}</span>
                {viewRule.effectiveDate && (
                  <span>Effective: {viewRule.effectiveDate}</span>
                )}
                {viewRule.isMandatory && <span>⚠️ Mandatory</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="sr-overlay" onClick={() => setShowModal(false)}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3>{editing ? "Edit Rule" : "Add Rule"}</h3>
              <button
                className="sr-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="sr-form" onSubmit={handleSubmit}>
              <div className="sr-form-grid">
                <div className="sr-field sr-field--full">
                  <label>Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="sr-field">
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
                <div className="sr-field">
                  <label>Version</label>
                  <input
                    value={form.version}
                    onChange={(e) =>
                      setForm({ ...form, version: e.target.value })
                    }
                  />
                </div>
                <div className="sr-field">
                  <label>Effective Date</label>
                  <input
                    type="date"
                    value={form.effectiveDate}
                    onChange={(e) =>
                      setForm({ ...form, effectiveDate: e.target.value })
                    }
                  />
                </div>
                <div className="sr-field">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm({ ...form, expiryDate: e.target.value })
                    }
                  />
                </div>
                <div className="sr-field">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                  />
                </div>
                <div className="sr-field">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isMandatory}
                      onChange={(e) =>
                        setForm({ ...form, isMandatory: e.target.checked })
                      }
                    />
                    Mandatory
                  </label>
                </div>
                <div className="sr-field sr-field--full">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="sr-field sr-field--full">
                  <label>Content *</label>
                  <textarea
                    rows={8}
                    required
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="sr-form-actions">
                <button
                  type="button"
                  className="sr-btn sr-btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sr-btn sr-btn--primary">
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
