import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { societyRuleApi } from "../../../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PageShell from "../../components/PageShell";
import NeonSweepButton from "../../components/NeonSweepButton";
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
    DRAFT: 'bg-[#fef3c7] text-[#92400e]',
    PUBLISHED: 'bg-[#dcfce7] text-[#166534]',
    APPROVED: 'bg-[#e0e7ff] text-[#3730a3]',
    ARCHIVED: 'bg-[#f3f4f6] text-[#6b7280]',
  };
  return map[s] || '';
};

const itemBorderMap = { draft: 'border-l-4 border-l-[var(--warning,#f59e0b)]', published: 'border-l-4 border-l-[var(--success,#22c55e)]', approved: 'border-l-4 border-l-[var(--primary,#6366f1)]', archived: 'border-l-4 border-l-[var(--text-secondary)]' };

export default function SocietyRules() {
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
    enabled: canLoadSocietyData,
  });

  const { data: counts } = useQuery({
    queryKey: ["society-rules-counts", societyId],
    queryFn: () =>
      societyRuleApi.getCounts(societyId, userId).then((r) => r.data),
    enabled: canLoadSocietyData,
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

  const closeModal = (force = false) => {
    if (!force && (createMut.isPending || updateMut.isPending)) return;
    setShowModal(false);
  };

  const createMut = useMutation({
    mutationFn: (d) => societyRuleApi.create(userId, d),
    onSuccess: () => {
      toast.success("Rule created");
      qc.invalidateQueries({ queryKey: ["society-rules"] });
      qc.invalidateQueries({ queryKey: ["society-rules-counts"] });
      closeModal(true);
    },
    onError: () => toast.error("Operation failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => societyRuleApi.update(id, userId, d),
    onSuccess: () => {
      toast.success("Rule updated");
      qc.invalidateQueries({ queryKey: ["society-rules"] });
      qc.invalidateQueries({ queryKey: ["society-rules-counts"] });
      closeModal(true);
    },
    onError: () => toast.error("Operation failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => societyRuleApi.delete(id, userId),
    onSuccess: () => {
      toast.success("Rule deleted");
      qc.invalidateQueries({ queryKey: ["society-rules"] });
      qc.invalidateQueries({ queryKey: ["society-rules-counts"] });
    },
    onError: () => toast.error("Operation failed"),
  });

  const publishMut = useMutation({
    mutationFn: (id) => societyRuleApi.publish(id, userId),
    onSuccess: () => {
      toast.success("Rule published");
      qc.invalidateQueries({ queryKey: ["society-rules"] });
      qc.invalidateQueries({ queryKey: ["society-rules-counts"] });
    },
    onError: () => toast.error("Operation failed"),
  });

  const archiveMut = useMutation({
    mutationFn: (id) => societyRuleApi.archive(id, userId),
    onSuccess: () => {
      toast.success("Rule archived");
      qc.invalidateQueries({ queryKey: ["society-rules"] });
      qc.invalidateQueries({ queryKey: ["society-rules-counts"] });
    },
    onError: () => toast.error("Operation failed"),
  });

  const approveMut = useMutation({
    mutationFn: (id) => societyRuleApi.approve(id, userId),
    onSuccess: () => {
      toast.success("Rule approved");
      qc.invalidateQueries({ queryKey: ["society-rules"] });
      qc.invalidateQueries({ queryKey: ["society-rules-counts"] });
    },
    onError: () => toast.error("Operation failed"),
  });

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
  };

  const summaryCards = [
    { label: 'Draft', value: counts?.draft || 0, cls: 'border-l-4 border-l-[var(--warning,#f59e0b)]' },
    { label: 'Published', value: counts?.published || 0, cls: 'border-l-4 border-l-[var(--success,#22c55e)]' },
    { label: 'Approved', value: counts?.approved || 0, cls: 'border-l-4 border-l-[var(--primary,#6366f1)]' },
    { label: 'Archived', value: counts?.archived || 0, cls: 'border-l-4 border-l-[var(--text-secondary)]' },
    { label: 'Mandatory', value: counts?.mandatory || 0, cls: 'border-l-4 border-l-[var(--error,#ef4444)]' },
  ];

  return (
    <PageShell
      title="Society Rules & Bylaws"
      icon={BookOpen}
      subtitle="Manage rules, policies and bylaws"
      loading={canLoadSocietyData && isLoading}
    >
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 mb-6">
        {summaryCards.map((c) => (
          <div key={c.label} className={`flex flex-col items-center py-4 px-3 rounded-xl bg-[var(--card)] border border-[var(--border-default)] ${c.cls}`}>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">{c.value}</span>
            <span className="text-[0.8rem] text-[var(--text-secondary)] mt-[0.15rem]">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-[0.4rem] bg-[var(--card)] border border-[var(--border-default)] rounded-lg py-[0.4rem] px-3 flex-1 min-w-[180px]">
          <Search size={16} />
          <input
            className="border-none bg-transparent outline-none w-full text-[0.92rem] text-[var(--text-primary)]"
            placeholder="Search rules…"
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
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="APPROVED">Approved</option>
          <option value="ARCHIVED">Archived</option>
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
        <NeonSweepButton tone="violet" size="md" onClick={openCreate}>
          <Plus size={16} /> Add Rule
        </NeonSweepButton>
      </div>

      {/* List */}
      <div className="flex flex-col gap-[0.85rem]">
        {filtered.length === 0 && <p className="text-center text-[var(--text-secondary)] py-10">No rules found.</p>}
        {filtered.map((r) => (
          <div
            key={r.id}
            className={`bg-[var(--card)] border border-[var(--border-default)] rounded-xl py-4 px-5 ${itemBorderMap[r.status?.toLowerCase()] || ''}`}
          >
            <div className="flex justify-between items-center mb-[0.45rem]">
              <div className="flex items-center gap-2 text-base flex-wrap">
                <span className="text-[1.15rem]">📜</span>
                <strong>{r.title}</strong>
                <span className="text-[0.78rem] text-[var(--text-secondary)] bg-[var(--bg-card)] py-[0.15rem] px-[0.55rem] rounded-full">
                  {categoryOptions.find((o) => o.value === r.category)?.label ||
                    r.category}
                </span>
                {r.isMandatory && (
                  <span className="text-[0.7rem] font-bold py-[0.2rem] px-[0.65rem] rounded-full uppercase bg-[#fee2e2] text-[#991b1b]">
                    Mandatory
                  </span>
                )}
              </div>
              <span className={`text-xs font-bold py-[0.2rem] px-[0.65rem] rounded-full uppercase ${statusBadge(r.status)}`}>
                {r.status}
              </span>
            </div>
            {r.description && (
              <div className="text-[0.88rem] text-[var(--text-primary)] mb-[0.3rem]">{r.description}</div>
            )}
            <div className="flex flex-wrap gap-3 text-[0.84rem] text-[var(--text-secondary)] mb-[0.35rem]">
              <span>By: {r.createdByName}</span>
              <span>v{r.version}</span>
              {r.effectiveDate && <span>Effective: {r.effectiveDate}</span>}
              {r.expiryDate && <span>Expires: {r.expiryDate}</span>}
              {r.approvedByName && <span>Approved by: {r.approvedByName}</span>}
              {!r.isActive && (
                <span style={{ color: "var(--error)" }}>Inactive</span>
              )}
            </div>
            <div className="flex flex-wrap gap-[0.45rem] mt-[0.6rem]">
              <NeonSweepButton tone="slate" size="sm" onClick={() => setViewRule(r)}>
                <Eye size={14} /> View
              </NeonSweepButton>
              {r.status === "DRAFT" && (
                <>
                  <NeonSweepButton tone="cyan" size="sm" onClick={() => publishMut.mutate(r.id)}>
                    <Send size={14} /> Publish
                  </NeonSweepButton>
                  <NeonSweepButton tone="cyan" size="sm" onClick={() => approveMut.mutate(r.id)}>
                    <Check size={14} /> Approve
                  </NeonSweepButton>
                </>
              )}
              {(r.status === "PUBLISHED" || r.status === "APPROVED") && (
                <NeonSweepButton tone="slate" size="sm" onClick={() => archiveMut.mutate(r.id)}>
                  <Archive size={14} /> Archive
                </NeonSweepButton>
              )}
              <NeonSweepButton tone="slate" size="sm" onClick={() => openEdit(r)}>
                <Edit2 size={14} /> Edit
              </NeonSweepButton>
              <NeonSweepButton tone="danger" size="sm" onClick={() => deleteMut.mutate(r.id)}>
                <Trash2 size={14} />
              </NeonSweepButton>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {viewRule && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={() => setViewRule(null)}>
          <div
            className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[800px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-[1.1rem]">{viewRule.title}</h3>
              <button
                className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]"
                onClick={() => setViewRule(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {viewRule.description && (
                <p className="text-[0.92rem] text-[var(--text-secondary)] mb-4 italic">{viewRule.description}</p>
              )}
              <div
                className="text-[0.92rem] text-[var(--text-primary)] leading-[1.7] mb-4"
                dangerouslySetInnerHTML={{
                  __html: viewRule.content?.replace(/\n/g, "<br/>"),
                }}
              />
              <div className="flex flex-wrap gap-4 text-[0.82rem] text-[var(--text-secondary)] pt-3 border-t border-[var(--border-default)]">
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
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={() => closeModal()}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-[1.1rem]">{editing ? "Edit Rule" : "Add Rule"}</h3>
              <button
                className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]"
                onClick={() => closeModal()}
              >
                <X size={18} />
              </button>
            </div>
            <form className="p-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-[0.9rem]">
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
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Version</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    value={form.version}
                    onChange={(e) =>
                      setForm({ ...form, version: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Effective Date</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    type="date"
                    value={form.effectiveDate}
                    onChange={(e) =>
                      setForm({ ...form, effectiveDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Expiry Date</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm({ ...form, expiryDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Sort Order</label>
                  <input
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="flex items-center gap-2 text-[0.82rem] font-semibold text-[var(--text-secondary)]">
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
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Description</label>
                  <textarea
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    rows={2}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Content *</label>
                  <textarea
                    className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                    rows={8}
                    required
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-[0.65rem] mt-5 pt-4 border-t border-[var(--border-default)]">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={() => closeModal()}>
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md">
                  {editing ? "Update" : "Create"}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
