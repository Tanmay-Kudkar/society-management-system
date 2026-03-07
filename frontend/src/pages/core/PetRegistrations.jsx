import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petRegistrationApi } from "../../../../api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PageShell from "../../components/PageShell";
import {
  PawPrint,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Check,
  XCircle,
  Syringe,
  Dog,
  Cat,
} from "lucide-react";

const petTypeOptions = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "BIRD", label: "Bird" },
  { value: "FISH", label: "Fish" },
  { value: "RABBIT", label: "Rabbit" },
  { value: "HAMSTER", label: "Hamster" },
  { value: "TURTLE", label: "Turtle" },
  { value: "OTHER", label: "Other" },
];

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

const statusBadge = (s) => {
  const map = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-900',
  };
  return map[s] || '';
};

const itemBorderMap = {
  pending: 'border-l-4 border-l-[var(--warning,#f59e0b)]',
  approved: 'border-l-4 border-l-[var(--success,#22c55e)]',
  rejected: 'border-l-4 border-l-[var(--error,#ef4444)]',
};

const petEmoji = (type) => {
  const map = {
    DOG: "🐕",
    CAT: "🐈",
    BIRD: "🐦",
    FISH: "🐟",
    RABBIT: "🐇",
    HAMSTER: "🐹",
    TURTLE: "🐢",
  };
  return map[type] || "🐾";
};

export default function PetRegistrations() {
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
  const [filterType, setFilterType] = useState("");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const empty = {
    societyId,
    ownerId: userId,
    flatNumber: "",
    wing: "",
    petName: "",
    petType: "DOG",
    breed: "",
    color: "",
    ageYears: "",
    gender: "",
    weightKg: "",
    vaccinated: false,
    vaccinationDate: "",
    vaccinationExpiry: "",
    registrationNumber: "",
    microchipId: "",
    photoUrl: "",
    specialNotes: "",
  };
  const [form, setForm] = useState(empty);

  const queryParams = {};
  if (filterStatus) queryParams.status = filterStatus;
  if (filterType) queryParams.petType = filterType;

  const { data, isLoading } = useQuery({
    queryKey: ["pet-registrations", societyId, filterStatus, filterType],
    queryFn: () =>
      petRegistrationApi
        .getBySociety(societyId, userId, queryParams)
        .then((r) => r.data),
    enabled: canLoadSocietyData,
  });

  const { data: counts } = useQuery({
    queryKey: ["pet-registrations-counts", societyId],
    queryFn: () =>
      petRegistrationApi.getCounts(societyId, userId).then((r) => r.data),
    enabled: canLoadSocietyData,
  });

  const pets = data?.content || [];
  const filtered = useMemo(() => {
    if (!search) return pets;
    const q = search.toLowerCase();
    return pets.filter(
      (p) =>
        p.petName?.toLowerCase().includes(q) ||
        p.ownerName?.toLowerCase().includes(q) ||
        p.breed?.toLowerCase().includes(q) ||
        p.flatNumber?.toLowerCase().includes(q),
    );
  }, [pets, search]);

  const mut = (fn, msg) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(msg);
        qc.invalidateQueries({ queryKey: ["pet-registrations"] });
        qc.invalidateQueries({ queryKey: ["pet-registrations-counts"] });
      },
      onError: () => toast.error("Operation failed"),
    });

  const createMut = mut(
    (d) => petRegistrationApi.create(userId, d),
    "Pet registered",
  );
  const updateMut = mut(
    ({ id, ...d }) => petRegistrationApi.update(id, userId, d),
    "Pet updated",
  );
  const deleteMut = mut(
    (id) => petRegistrationApi.delete(id, userId),
    "Registration deleted",
  );
  const approveMut = mut(
    (id) => petRegistrationApi.approve(id, userId),
    "Pet approved",
  );
  const rejectMut = mut(
    ({ id, reason }) => petRegistrationApi.reject(id, userId, reason),
    "Pet rejected",
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setShowModal(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      societyId,
      ownerId: p.ownerId,
      flatNumber: p.flatNumber || "",
      wing: p.wing || "",
      petName: p.petName,
      petType: p.petType,
      breed: p.breed || "",
      color: p.color || "",
      ageYears: p.ageYears || "",
      gender: p.gender || "",
      weightKg: p.weightKg || "",
      vaccinated: p.vaccinated || false,
      vaccinationDate: p.vaccinationDate || "",
      vaccinationExpiry: p.vaccinationExpiry || "",
      registrationNumber: p.registrationNumber || "",
      microchipId: p.microchipId || "",
      photoUrl: p.photoUrl || "",
      specialNotes: p.specialNotes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      ageYears: form.ageYears ? Number(form.ageYears) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
    };
    if (editing) updateMut.mutate({ id: editing.id, ...payload });
    else createMut.mutate(payload);
    setShowModal(false);
  };

  const handleReject = () => {
    rejectMut.mutate({ id: rejectId, reason: rejectReason });
    setRejectId(null);
    setRejectReason("");
  };

  const summaryCards = [
    { label: "Pending", value: counts?.pending || 0, cls: "border-l-4 border-l-[var(--warning,#f59e0b)]" },
    { label: "Approved", value: counts?.approved || 0, cls: "border-l-4 border-l-[var(--success,#22c55e)]" },
    { label: "Rejected", value: counts?.rejected || 0, cls: "border-l-4 border-l-[var(--error,#ef4444)]" },
    { label: "Vaccinated", value: counts?.vaccinated || 0, cls: "border-l-4 border-l-cyan-500" },
    { label: "Dogs", value: counts?.dogs || 0, cls: "border-l-4 border-l-violet-500" },
    { label: "Cats", value: counts?.cats || 0, cls: "border-l-4 border-l-pink-500" },
  ];

  return (
    <PageShell
      title="Pet Registrations"
      icon={PawPrint}
      subtitle="Register and manage pets in the society"
      loading={canLoadSocietyData && isLoading}
    >
      {/* Summary */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-4 mb-6 max-[600px]:grid-cols-2">
        {summaryCards.map((c) => (
          <div key={c.label} className={`flex flex-col items-center px-3 py-4 rounded-xl bg-[var(--card)] border border-[var(--border-default)] ${c.cls}`}>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">{c.value}</span>
            <span className="text-[0.8rem] text-[var(--text-secondary)] mt-0.5">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 flex-1 min-w-[180px]">
          <Search size={16} />
          <input
            className="border-none bg-transparent outline-none w-full text-[0.92rem] text-[var(--text-primary)] focus:outline-none"
            placeholder="Search pets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          className="px-3 py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {petTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" onClick={openCreate}>
          <Plus size={16} /> Register Pet
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3.5">
        {filtered.length === 0 && (
          <p className="text-center text-[var(--text-secondary)] p-10">No pet registrations found.</p>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`bg-[var(--card)] border border-[var(--border-default)] rounded-xl px-5 py-4 ${itemBorderMap[p.status?.toLowerCase()] || ''}`}
          >
            <div className="flex justify-between items-center mb-[0.45rem]">
              <div className="flex items-center gap-2 text-base">
                <span className="text-lg">{petEmoji(p.petType)}</span>
                <strong>{p.petName}</strong>
                <span className="text-[0.78rem] text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-0.5 rounded-full">
                  {petTypeOptions.find((o) => o.value === p.petType)?.label ||
                    p.petType}
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${statusBadge(p.status)}`}>
                {p.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-[0.84rem] text-[var(--text-secondary)] mb-1.5">
              <span>Owner: {p.ownerName}</span>
              {p.flatNumber && <span>Flat: {p.flatNumber}</span>}
              {p.wing && <span>Wing: {p.wing}</span>}
              {p.breed && <span>Breed: {p.breed}</span>}
              {p.color && <span>Color: {p.color}</span>}
              {p.gender && <span>{p.gender}</span>}
              {p.ageYears && <span>{p.ageYears} yrs</span>}
              {p.weightKg && <span>{p.weightKg} kg</span>}
            </div>
            {p.vaccinated && (
              <div className="text-[0.85rem] mb-1 text-[var(--success,#22c55e)]">
                ✅ Vaccinated{" "}
                {p.vaccinationExpiry ? `(expires ${p.vaccinationExpiry})` : ""}
              </div>
            )}
            {!p.vaccinated && (
              <div className="text-[0.85rem] mb-1 text-[var(--warning,#f59e0b)]">
                ⚠️ Not vaccinated
              </div>
            )}
            {p.specialNotes && (
              <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-0.5">{p.specialNotes}</div>
            )}
            {p.rejectedReason && (
              <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-0.5">Reason: {p.rejectedReason}</div>
            )}
            <div className="flex flex-wrap gap-[0.45rem] mt-2.5">
              {p.status === "PENDING" && (
                <>
                  <button
                    className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--success,#22c55e)] text-white"
                    onClick={() => approveMut.mutate(p.id)}
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--error,#ef4444)] text-white"
                    onClick={() => {
                      setRejectId(p.id);
                      setRejectReason("");
                    }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]"
                onClick={() => openEdit(p)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-transparent text-[var(--error,#ef4444)] border border-[var(--error,#ef4444)]"
                onClick={() => deleteMut.mutate(p.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={() => setRejectId(null)}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-lg">Reject Registration</h3>
              <button
                className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]"
                onClick={() => setRejectId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-1 col-span-full">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Reason</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-[var(--border-default)]">
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  onClick={() => setRejectId(null)}
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--error,#ef4444)] text-white"
                  onClick={handleReject}
                >
                  Reject
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
              <h3 className="m-0 text-lg">{editing ? "Edit Pet" : "Register Pet"}</h3>
              <button
                className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="p-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3.5 items-start max-[600px]:grid-cols-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Pet Name *</label>
                  <input required value={form.petName} onChange={(e) => setForm({ ...form, petName: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Pet Type *</label>
                  <select value={form.petType} onChange={(e) => setForm({ ...form, petType: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]">
                    {petTypeOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Breed</label>
                  <input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Color</label>
                  <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Age (years)</label>
                  <input type="number" min={0} value={form.ageYears} onChange={(e) => setForm({ ...form, ageYears: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]">
                    <option value="">Select</option>
                    {genderOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Weight (kg)</label>
                  <input type="number" step="0.1" min={0} value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Flat Number</label>
                  <input value={form.flatNumber} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Wing</label>
                  <input value={form.wing} onChange={(e) => setForm({ ...form, wing: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Registration #</label>
                  <input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Microchip ID</label>
                  <input value={form.microchipId} onChange={(e) => setForm({ ...form, microchipId: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">
                    <input type="checkbox" checked={form.vaccinated} onChange={(e) => setForm({ ...form, vaccinated: e.target.checked })} />
                    Vaccinated
                  </label>
                </div>
                {form.vaccinated && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Vaccination Date</label>
                      <input type="date" value={form.vaccinationDate} onChange={(e) => setForm({ ...form, vaccinationDate: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Vaccination Expiry</label>
                      <input type="date" value={form.vaccinationExpiry} onChange={(e) => setForm({ ...form, vaccinationExpiry: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-1 col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Special Notes</label>
                  <textarea rows={3} value={form.specialNotes} onChange={(e) => setForm({ ...form, specialNotes: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-[var(--border-default)]">
                <button type="button" className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white">
                  {editing ? "Update" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
