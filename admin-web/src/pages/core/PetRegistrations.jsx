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
    PENDING: "pr-badge--pending",
    APPROVED: "pr-badge--approved",
    REJECTED: "pr-badge--rejected",
  };
  return map[s] || "";
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
    enabled: !!societyId,
  });

  const { data: counts } = useQuery({
    queryKey: ["pet-registrations-counts", societyId],
    queryFn: () =>
      petRegistrationApi.getCounts(societyId, userId).then((r) => r.data),
    enabled: !!societyId,
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
    { label: "Pending", value: counts?.pending || 0, cls: "pr-card--pending" },
    {
      label: "Approved",
      value: counts?.approved || 0,
      cls: "pr-card--approved",
    },
    {
      label: "Rejected",
      value: counts?.rejected || 0,
      cls: "pr-card--rejected",
    },
    {
      label: "Vaccinated",
      value: counts?.vaccinated || 0,
      cls: "pr-card--vaccinated",
    },
    { label: "Dogs", value: counts?.dogs || 0, cls: "pr-card--dogs" },
    { label: "Cats", value: counts?.cats || 0, cls: "pr-card--cats" },
  ];

  return (
    <PageShell
      title="Pet Registrations"
      icon={PawPrint}
      subtitle="Register and manage pets in the society"
      loading={isLoading}
    >
      {/* Summary */}
      <div className="pr-summary">
        {summaryCards.map((c) => (
          <div key={c.label} className={`pr-summary-card ${c.cls}`}>
            <span className="pr-summary-value">{c.value}</span>
            <span className="pr-summary-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="pr-toolbar">
        <div className="pr-search-wrap">
          <Search size={16} />
          <input
            className="pr-search"
            placeholder="Search pets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="pr-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          className="pr-filter"
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
        <button className="pr-btn pr-btn--primary" onClick={openCreate}>
          <Plus size={16} /> Register Pet
        </button>
      </div>

      {/* List */}
      <div className="pr-list">
        {filtered.length === 0 && (
          <p className="pr-empty">No pet registrations found.</p>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`pr-item pr-item--${p.status?.toLowerCase()}`}
          >
            <div className="pr-item-header">
              <div className="pr-item-title">
                <span className="pr-item-emoji">{petEmoji(p.petType)}</span>
                <strong>{p.petName}</strong>
                <span className="pr-item-type">
                  {petTypeOptions.find((o) => o.value === p.petType)?.label ||
                    p.petType}
                </span>
              </div>
              <span className={`pr-badge ${statusBadge(p.status)}`}>
                {p.status}
              </span>
            </div>
            <div className="pr-item-meta">
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
              <div className="pr-item-vacc">
                ✅ Vaccinated{" "}
                {p.vaccinationExpiry ? `(expires ${p.vaccinationExpiry})` : ""}
              </div>
            )}
            {!p.vaccinated && (
              <div className="pr-item-vacc pr-item-vacc--no">
                ⚠️ Not vaccinated
              </div>
            )}
            {p.specialNotes && (
              <div className="pr-item-notes">{p.specialNotes}</div>
            )}
            {p.rejectedReason && (
              <div className="pr-item-notes">Reason: {p.rejectedReason}</div>
            )}
            <div className="pr-item-actions">
              {p.status === "PENDING" && (
                <>
                  <button
                    className="pr-btn pr-btn--approve"
                    onClick={() => approveMut.mutate(p.id)}
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    className="pr-btn pr-btn--reject"
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
                className="pr-btn pr-btn--edit"
                onClick={() => openEdit(p)}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className="pr-btn pr-btn--delete"
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
        <div className="pr-overlay" onClick={() => setRejectId(null)}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal-header">
              <h3>Reject Registration</h3>
              <button
                className="pr-modal-close"
                onClick={() => setRejectId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="pr-form">
              <div className="pr-field pr-field--full">
                <label>Reason</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="pr-form-actions">
                <button
                  className="pr-btn pr-btn--secondary"
                  onClick={() => setRejectId(null)}
                >
                  Cancel
                </button>
                <button
                  className="pr-btn pr-btn--reject"
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
        <div className="pr-overlay" onClick={() => setShowModal(false)}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal-header">
              <h3>{editing ? "Edit Pet" : "Register Pet"}</h3>
              <button
                className="pr-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="pr-form" onSubmit={handleSubmit}>
              <div className="pr-form-grid">
                <div className="pr-field">
                  <label>Pet Name *</label>
                  <input
                    required
                    value={form.petName}
                    onChange={(e) =>
                      setForm({ ...form, petName: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label>Pet Type *</label>
                  <select
                    value={form.petType}
                    onChange={(e) =>
                      setForm({ ...form, petType: e.target.value })
                    }
                  >
                    {petTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pr-field">
                  <label>Breed</label>
                  <input
                    value={form.breed}
                    onChange={(e) =>
                      setForm({ ...form, breed: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label>Color</label>
                  <input
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label>Age (years)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.ageYears}
                    onChange={(e) =>
                      setForm({ ...form, ageYears: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label>Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    {genderOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pr-field">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={form.weightKg}
                    onChange={(e) =>
                      setForm({ ...form, weightKg: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label>Flat Number</label>
                  <input
                    value={form.flatNumber}
                    onChange={(e) =>
                      setForm({ ...form, flatNumber: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label>Wing</label>
                  <input
                    value={form.wing}
                    onChange={(e) => setForm({ ...form, wing: e.target.value })}
                  />
                </div>
                <div className="pr-field">
                  <label>Registration #</label>
                  <input
                    value={form.registrationNumber}
                    onChange={(e) =>
                      setForm({ ...form, registrationNumber: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label>Microchip ID</label>
                  <input
                    value={form.microchipId}
                    onChange={(e) =>
                      setForm({ ...form, microchipId: e.target.value })
                    }
                  />
                </div>
                <div className="pr-field">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.vaccinated}
                      onChange={(e) =>
                        setForm({ ...form, vaccinated: e.target.checked })
                      }
                    />
                    Vaccinated
                  </label>
                </div>
                {form.vaccinated && (
                  <>
                    <div className="pr-field">
                      <label>Vaccination Date</label>
                      <input
                        type="date"
                        value={form.vaccinationDate}
                        onChange={(e) =>
                          setForm({ ...form, vaccinationDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="pr-field">
                      <label>Vaccination Expiry</label>
                      <input
                        type="date"
                        value={form.vaccinationExpiry}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            vaccinationExpiry: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}
                <div className="pr-field pr-field--full">
                  <label>Special Notes</label>
                  <textarea
                    rows={3}
                    value={form.specialNotes}
                    onChange={(e) =>
                      setForm({ ...form, specialNotes: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="pr-form-actions">
                <button
                  type="button"
                  className="pr-btn pr-btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="pr-btn pr-btn--primary">
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
