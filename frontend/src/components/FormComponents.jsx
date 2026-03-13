/**
 * Reusable form components with:
 * - Smart single-option select (shows static badge instead of dropdown)
 * - Attractive inline validation with animations (no harsh red errors)
 * - Phone number live formatting & digit restriction
 */
import { useState, useEffect } from "react";
import { AlertCircle, Check, ChevronDown, Lock, Info } from "lucide-react";
import clsx from "clsx";

/* ─── Helper: animated field hint ─── */
const FieldHint = ({ message, type = "error" }) => {
  if (!message) return null;

  const icons = {
    error: AlertCircle,
    success: Check,
    info: Info,
  };
  const Icon = icons[type] || AlertCircle;

  const hintStyles = {
    error: "bg-amber-500/10 border-amber-500/30 text-amber-700",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-700",
  };
  return (
    <div
      className={clsx(
        "inline-flex items-start gap-1.5 rounded-md border py-1.5 px-2.5 text-xs",
        hintStyles[type],
      )}
    >
      <Icon size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

/* ─── Form Input ─── */
export const FormInput = ({
  label,
  name,
  type = "text",
  value,
  defaultValue,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  className = "",
  icon: Icon,
  maxLength,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const inputBase =
    "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--placeholder-color)]";
  const inputFocus = "border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.12)]";
  const inputWarn = "border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.12)]";
  const inputDisabled = "opacity-60 cursor-not-allowed";

  return (
    <div className={clsx("flex flex-col gap-1.5 min-w-0", className)}>
      {label && (
        <label
          htmlFor={name}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {Icon && <Icon size={14} className="text-[var(--text-tertiary)]" />}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative min-w-0">
        <input
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={clsx(
            inputBase,
            error && !focused && inputWarn,
            focused && !error && inputFocus,
            disabled && inputDisabled,
          )}
          {...props}
        />
      </div>
      <FieldHint message={error} type="error" />
      {hint && !error && <FieldHint message={hint} type="info" />}
    </div>
  );
};

/* ─── Phone Input with live digit restriction ─── */
export const PhoneInput = ({
  label = "Phone",
  name = "phone",
  value,
  defaultValue,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  ...props
}) => {
  // Strip +91 prefix if present in initial value
  const stripPrefix = (v) => {
    if (!v) return "";
    const s = String(v).replace(/[^0-9]/g, "");
    return s.startsWith("91") && s.length > 10 ? s.slice(2) : s.slice(0, 10);
  };

  const [localValue, setLocalValue] = useState(() =>
    stripPrefix(value || defaultValue),
  );
  const [localError, setLocalError] = useState("");
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value !== undefined) setLocalValue(stripPrefix(value));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, ""); // only digits
    if (raw.length > 10) return; // max 10 digits

    setLocalValue(raw);
    setTouched(true);
    setLocalError("");

    // Live validation hints
    if (raw.length >= 1 && !/^[6-9]/.test(raw)) {
      setLocalError("First digit must be 6, 7, 8, or 9");
    } else if (raw.length === 10) {
      setLocalError(""); // valid
    }

    // Propagate
    if (onChange) {
      const syntheticEvent = { target: { name, value: raw } };
      onChange(syntheticEvent);
    }
  };

  // Prefer specific local validation over generic parent error
  const displayError =
    localError || (touched || localValue.length > 0 ? error : error);
  const isValid =
    localValue.length === 10 && /^[6-9]/.test(localValue) && !localError;

  const inputBase =
    "w-full rounded-lg border py-2.5 px-3 bg-[var(--bg-card)] text-[var(--text-primary)] text-sm outline-none transition border-[var(--border-default)] pr-14";
  const inputFocus = "border-blue-500 ring-2 ring-blue-500/20";
  const inputWarn = "border-amber-500 ring-2 ring-amber-500/20";
  const inputValid = "border-emerald-500 ring-2 ring-emerald-500/20";
  const inputDisabled = "opacity-60 cursor-not-allowed";
  return (
    <div className={clsx("flex flex-col gap-1.5 min-w-0", className)}>
      {label && (
        <label
          htmlFor={name}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2 min-w-0 w-full">
        <div className="inline-flex items-center py-2.5 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-[13px] font-semibold shrink-0">
          +91
        </div>
        <div className="relative flex-1 min-w-0">
          <input
            type="tel"
            id={name}
            name={name}
            value={localValue}
            onChange={handleChange}
            disabled={disabled}
            placeholder=""
            maxLength={10}
            inputMode="numeric"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={clsx(
              inputBase,
              displayError && !focused && inputWarn,
              isValid && inputValid,
              focused && !displayError && !isValid && inputFocus,
              disabled && inputDisabled,
            )}
            {...props}
          />
          {(focused || localValue.length > 0) && (
            <span
              className={clsx(
                "absolute right-3 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none",
                isValid
                  ? "text-emerald-500"
                  : localValue.length > 0
                    ? "text-blue-400"
                    : "text-[var(--text-tertiary)]",
              )}
            >
              {localValue.length}/10
            </span>
          )}
        </div>
      </div>
      <FieldHint message={displayError} type="error" />
      {isValid && !displayError && (
        <FieldHint message="Valid phone number" type="success" />
      )}
    </div>
  );
};

/* ─── Smart Select: single option → static badge, multiple → dropdown ─── */
export const SmartSelect = ({
  label,
  name,
  value,
  defaultValue,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder = "Select an option",
  className = "",
  icon: Icon,
  emptyMessage = "No options available",
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  // If only 1 option → show as a locked badge
  const inputBase =
    "w-full appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none transition pr-9 cursor-pointer";
  const inputFocus = "border-blue-500 ring-2 ring-blue-500/20";
  const inputWarn = "border-amber-500 ring-2 ring-amber-500/20";
  const inputDisabled = "opacity-60 cursor-not-allowed";

  if (options.length === 1) {
    const only = options[0];
    return (
      <div className={clsx("flex flex-col gap-1.5 min-w-0", className)}>
        {label && (
          <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]">
            {Icon && <Icon size={14} className="text-[var(--text-tertiary)]" />}
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="inline-flex items-center gap-2 py-2.5 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)]">
          <Lock size={14} className="text-blue-600 shrink-0" />
          <span className="font-semibold text-[var(--text-primary)]">
            {only.label}
          </span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Auto-selected
          </span>
        </div>
        <input type="hidden" name={name} value={only.value} />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={clsx("flex flex-col gap-1.5 min-w-0", className)}>
        {label && (
          <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]">
            {Icon && <Icon size={14} className="text-[var(--text-tertiary)]" />}
            {label}
          </label>
        )}
        <div className="inline-flex items-center gap-2 py-2.5 px-3 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs">
          <Info size={14} />
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col gap-1.5 min-w-0", className)}>
      {label && (
        <label
          htmlFor={name}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {Icon && <Icon size={14} className="text-[var(--text-tertiary)]" />}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative min-w-0">
        <select
          id={name}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={clsx(
            inputBase,
            error && !focused && inputWarn,
            focused && !error && inputFocus,
            disabled && inputDisabled,
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
      </div>
      <FieldHint message={error} type="error" />
    </div>
  );
};

/* ─── Regular FormSelect (for backward compat) ─── */
export const FormSelect = ({
  label,
  name,
  value,
  defaultValue,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder = "Select...",
  className = "",
  ...props
}) => {
  return (
    <SmartSelect
      label={label}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      options={options}
      error={error}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};

/* ─── Form Textarea ─── */
export const FormTextarea = ({
  label,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,
  error,
  required = false,
  disabled = false,
  rows = 3,
  className = "",
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const inputBase =
    "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--placeholder-color)] resize-y min-h-[96px]";
  const inputFocus = "border-blue-500 ring-2 ring-blue-500/20";
  const inputWarn = "border-amber-500 ring-2 ring-amber-500/20";
  const inputDisabled = "opacity-60 cursor-not-allowed";
  return (
    <div className={clsx("flex flex-col gap-1.5 min-w-0", className)}>
      {label && (
        <label
          htmlFor={name}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          inputBase,
          error && !focused && inputWarn,
          focused && !error && inputFocus,
          disabled && inputDisabled,
        )}
        {...props}
      />
      <FieldHint message={error} type="error" />
    </div>
  );
};

/* ─── Number Input with restrictions ─── */
export const NumberInput = ({
  label,
  name,
  value,
  defaultValue,
  onChange,
  error,
  required = false,
  disabled = false,
  min,
  max,
  step,
  className = "",
  placeholder = "0",
  icon: Icon,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const inputBase =
    "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--placeholder-color)]";
  const inputFocus = "border-blue-500 ring-2 ring-blue-500/20";
  const inputWarn = "border-amber-500 ring-2 ring-amber-500/20";
  const inputDisabled = "opacity-60 cursor-not-allowed";
  return (
    <div className={clsx("flex flex-col gap-1.5 min-w-0", className)}>
      {label && (
        <label
          htmlFor={name}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {Icon && <Icon size={14} className="text-[var(--text-tertiary)]" />}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type="number"
        id={name}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          inputBase,
          error && !focused && inputWarn,
          focused && !error && inputFocus,
          disabled && inputDisabled,
        )}
        {...props}
      />
      <FieldHint message={error} type="error" />
    </div>
  );
};

/* ─── Pincode Input (6 digits) ─── */
export const PincodeInput = ({
  label = "Pincode",
  name = "pincode",
  value,
  defaultValue,
  onChange,
  error,
  required = false,
  className = "",
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || defaultValue || "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (value !== undefined) setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw.length > 6) return;
    setLocalValue(raw);
    if (raw.length > 0 && raw.length < 6) {
      setLocalError(`${raw.length}/6 digits`);
    } else {
      setLocalError("");
    }
    if (onChange) onChange({ target: { name, value: raw } });
  };

  return (
    <FormInput
      label={label}
      name={name}
      value={localValue}
      onChange={handleChange}
      error={error || localError}
      required={required}
      placeholder="e.g. 400001"
      maxLength={6}
      inputMode="numeric"
      className={className}
      {...props}
    />
  );
};

/* ─── State-City Selector (Dependent Dropdowns with Other option) ─── */
const INDIAN_STATES_CITIES = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Tirupati",
    "Kakinada",
    "Rajahmundry",
    "Kadapa",
    "Anantapur",
    "Eluru",
    "Ongole",
    "Vizianagaram",
    "Chittoor",
  ],
  "Arunachal Pradesh": [
    "Itanagar",
    "Naharlagun",
    "Pasighat",
    "Tawang",
    "Ziro",
    "Bomdila",
    "Tezu",
    "Along",
    "Roing",
  ],
  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Nagaon",
    "Tezpur",
    "Tinsukia",
    "Bongaigaon",
    "Karimganj",
    "Dhubri",
    "Goalpara",
    "Barpeta",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Darbhanga",
    "Purnia",
    "Munger",
    "Arrah",
    "Begusarai",
    "Katihar",
    "Chapra",
    "Saharsa",
    "Sasaram",
    "Hajipur",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Bilaspur",
    "Korba",
    "Durg",
    "Rajnandgaon",
    "Jagdalpur",
    "Raigarh",
    "Ambikapur",
    "Dhamtari",
    "Mahasamund",
  ],
  Goa: [
    "Panaji",
    "Margao",
    "Vasco da Gama",
    "Mapusa",
    "Ponda",
    "Bicholim",
    "Curchorem",
    "Sanquelim",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Gandhinagar",
    "Anand",
    "Nadiad",
    "Morbi",
    "Surendranagar",
    "Mehsana",
    "Bharuch",
    "Vapi",
    "Navsari",
    "Veraval",
    "Porbandar",
  ],
  Haryana: [
    "Gurugram",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Karnal",
    "Hisar",
    "Rohtak",
    "Sonipat",
    "Panchkula",
    "Yamunanagar",
    "Bhiwani",
    "Sirsa",
    "Bahadurgarh",
    "Jind",
    "Thanesar",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Dharamshala",
    "Solan",
    "Mandi",
    "Kullu",
    "Manali",
    "Hamirpur",
    "Bilaspur",
    "Kangra",
    "Una",
    "Chamba",
    "Palampur",
    "Nahan",
  ],
  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Giridih",
    "Hazaribagh",
    "Ramgarh",
    "Medininagar",
    "Phusro",
    "Chaibasa",
    "Dumka",
  ],
  Karnataka: [
    "Bangalore",
    "Mysore",
    "Hubli",
    "Mangalore",
    "Belgaum",
    "Gulbarga",
    "Davangere",
    "Bellary",
    "Bijapur",
    "Shimoga",
    "Tumkur",
    "Raichur",
    "Bidar",
    "Hospet",
    "Gadag",
    "Hassan",
    "Udupi",
    "Chitradurga",
  ],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Alappuzha",
    "Kannur",
    "Malappuram",
    "Kottayam",
    "Kasaragod",
    "Pathanamthitta",
    "Idukki",
    "Wayanad",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Gwalior",
    "Jabalpur",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Rewa",
    "Murwara",
    "Singrauli",
    "Burhanpur",
    "Khandwa",
    "Morena",
    "Bhind",
    "Chhindwara",
    "Guna",
    "Shivpuri",
  ],
  Maharashtra: [
    "Mumbai",
    "Palghar",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Aurangabad",
    "Solapur",
    "Kolhapur",
    "Amravati",
    "Nanded",
    "Akola",
    "Latur",
    "Dhule",
    "Ahmednagar",
    "Jalgaon",
    "Chandrapur",
    "Parbhani",
    "Ichalkaranji",
    "Jalna",
    "Bhiwandi",
    "Panvel",
    "Navi Mumbai",
  ],
  Manipur: [
    "Imphal",
    "Thoubal",
    "Bishnupur",
    "Churachandpur",
    "Kakching",
    "Ukhrul",
    "Senapati",
  ],
  Meghalaya: [
    "Shillong",
    "Tura",
    "Jowai",
    "Nongstoin",
    "Baghmara",
    "Williamnagar",
  ],
  Mizoram: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip"],
  Nagaland: [
    "Kohima",
    "Dimapur",
    "Mokokchung",
    "Tuensang",
    "Wokha",
    "Zunheboto",
    "Phek",
  ],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Berhampur",
    "Sambalpur",
    "Puri",
    "Balasore",
    "Bhadrak",
    "Baripada",
    "Jharsuguda",
    "Jeypore",
    "Bargarh",
    "Balangir",
    "Rayagada",
  ],
  Punjab: [
    "Chandigarh",
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Pathankot",
    "Hoshiarpur",
    "Batala",
    "Moga",
    "Malerkotla",
    "Khanna",
    "Phagwara",
    "Muktsar",
    "Barnala",
    "Firozpur",
    "Faridkot",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Ajmer",
    "Bikaner",
    "Alwar",
    "Bharatpur",
    "Sikar",
    "Bhilwara",
    "Pali",
    "Sri Ganganagar",
    "Kishangarh",
    "Tonk",
    "Beawar",
    "Hanumangarh",
    "Churu",
    "Jhunjhunu",
  ],
  Sikkim: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Jorethang"],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Tiruppur",
    "Vellore",
    "Erode",
    "Thoothukkudi",
    "Dindigul",
    "Thanjavur",
    "Ranipet",
    "Sivakasi",
    "Karur",
    "Udhagamandalam",
    "Hosur",
    "Nagercoil",
    "Kanchipuram",
    "Kumbakonam",
    "Avadi",
    "Tirupathur",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Khammam",
    "Karimnagar",
    "Mahbubnagar",
    "Nalgonda",
    "Adilabad",
    "Suryapet",
    "Siddipet",
    "Miryalaguda",
    "Jagtial",
    "Mancherial",
    "Nirmal",
    "Sangareddy",
  ],
  Tripura: [
    "Agartala",
    "Udaipur",
    "Dharmanagar",
    "Kailashahar",
    "Belonia",
    "Khowai",
    "Ambassa",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Ghaziabad",
    "Agra",
    "Varanasi",
    "Meerut",
    "Prayagraj",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Noida",
    "Firozabad",
    "Jhansi",
    "Muzaffarnagar",
    "Mathura",
    "Budaun",
    "Rampur",
    "Shahjahanpur",
    "Farrukhabad",
    "Ayodhya",
    "Maunath Bhanjan",
    "Hapur",
    "Etawah",
    "Mirzapur",
    "Bulandshahr",
    "Sambhal",
    "Greater Noida",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rudrapur",
    "Kashipur",
    "Rishikesh",
    "Pithoragarh",
    "Nainital",
    "Almora",
    "Tehri",
    "Kotdwar",
  ],
  "West Bengal": [
    "Kolkata",
    "Asansol",
    "Siliguri",
    "Durgapur",
    "Bardhaman",
    "Malda",
    "Baharampur",
    "Habra",
    "Kharagpur",
    "Shantipur",
    "Dankuni",
    "Dhulian",
    "Ranaghat",
    "Haldia",
    "Raiganj",
    "Krishnanagar",
    "Nabadwip",
    "Medinipur",
    "Jalpaiguri",
    "Balurghat",
    "Basirhat",
    "Bankura",
    "Darjeeling",
  ],
  // Union Territories
  "Andaman and Nicobar Islands": [
    "Port Blair",
    "Diglipur",
    "Rangat",
    "Mayabunder",
    "Car Nicobar",
  ],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  Delhi: [
    "New Delhi",
    "Central Delhi",
    "North Delhi",
    "South Delhi",
    "East Delhi",
    "West Delhi",
    "North East Delhi",
    "North West Delhi",
    "South East Delhi",
    "South West Delhi",
    "Shahdara",
  ],
  "Jammu and Kashmir": [
    "Srinagar",
    "Jammu",
    "Anantnag",
    "Baramulla",
    "Udhampur",
    "Kathua",
    "Sopore",
    "Rajouri",
    "Poonch",
  ],
  Ladakh: ["Leh", "Kargil", "Nubra", "Zanskar"],
  Lakshadweep: ["Kavaratti", "Agatti", "Minicoy", "Amini"],
  Puducherry: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
};

const STATE_OPTIONS = Object.keys(INDIAN_STATES_CITIES).sort();

export const StateCitySelector = ({
  stateValue,
  cityValue,
  stateDefaultValue,
  cityDefaultValue,
  onStateChange,
  onCityChange,
  stateError,
  cityError,
  stateRequired = false,
  cityRequired = false,
  className = "",
}) => {
  const [selectedState, setSelectedState] = useState(
    stateValue || stateDefaultValue || "",
  );
  const [selectedCity, setSelectedCity] = useState(
    cityValue || cityDefaultValue || "",
  );
  const [isStateOther, setIsStateOther] = useState(false);
  const [isCityOther, setIsCityOther] = useState(false);
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");

  // Check if initial values are custom (not in predefined list)
  useEffect(() => {
    const initialState = stateValue || stateDefaultValue;
    if (initialState && !STATE_OPTIONS.includes(initialState)) {
      setIsStateOther(true);
      setCustomState(initialState);
      setSelectedState("OTHER");
    }
  }, [stateValue, stateDefaultValue]);

  useEffect(() => {
    const initialCity = cityValue || cityDefaultValue;
    const currentState = customState || selectedState;
    if (initialCity && currentState && currentState !== "OTHER") {
      const cities = INDIAN_STATES_CITIES[currentState] || [];
      if (!cities.includes(initialCity)) {
        setIsCityOther(true);
        setCustomCity(initialCity);
        setSelectedCity("OTHER");
      }
    }
  }, [cityValue, cityDefaultValue, selectedState, customState]);

  useEffect(() => {
    if (stateValue !== undefined) {
      if (!STATE_OPTIONS.includes(stateValue) && stateValue) {
        setIsStateOther(true);
        setCustomState(stateValue);
        setSelectedState("OTHER");
      } else {
        setSelectedState(stateValue);
      }
    }
  }, [stateValue]);

  useEffect(() => {
    if (cityValue !== undefined) {
      const currentState = customState || selectedState;
      if (currentState && currentState !== "OTHER") {
        const cities = INDIAN_STATES_CITIES[currentState] || [];
        if (!cities.includes(cityValue) && cityValue) {
          setIsCityOther(true);
          setCustomCity(cityValue);
          setSelectedCity("OTHER");
        } else {
          setSelectedCity(cityValue);
        }
      }
    }
  }, [cityValue]);

  const handleStateChange = (e) => {
    const value = e.target.value;
    setSelectedState(value);

    if (value === "OTHER") {
      setIsStateOther(true);
      setCustomState("");
    } else {
      setIsStateOther(false);
      setCustomState("");
    }

    // Reset city when state changes
    setSelectedCity("");
    setIsCityOther(false);
    setCustomCity("");

    if (onStateChange) {
      onStateChange({
        target: { name: "state", value: value === "OTHER" ? "" : value },
      });
    }
    if (onCityChange) {
      onCityChange({ target: { name: "city", value: "" } });
    }
  };

  const handleCustomStateChange = (e) => {
    const value = e.target.value;
    setCustomState(value);
    if (onStateChange) {
      onStateChange({ target: { name: "state", value } });
    }
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setSelectedCity(value);

    if (value === "OTHER") {
      setIsCityOther(true);
      setCustomCity("");
    } else {
      setIsCityOther(false);
      setCustomCity("");
    }

    if (onCityChange) {
      onCityChange({
        target: { name: "city", value: value === "OTHER" ? "" : value },
      });
    }
  };

  const handleCustomCityChange = (e) => {
    const value = e.target.value;
    setCustomCity(value);
    if (onCityChange) {
      onCityChange({ target: { name: "city", value } });
    }
  };

  const availableCities =
    selectedState && selectedState !== "OTHER"
      ? INDIAN_STATES_CITIES[selectedState] || []
      : [];

  const selectBase =
    "w-full appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 px-3 pr-9 text-sm text-[var(--text-primary)] outline-none transition cursor-pointer";
  const selectWarn = "border-amber-500 ring-2 ring-amber-500/20";
  const selectDisabled = "opacity-60 cursor-not-allowed";
  return (
    <div
      className={clsx(
        "grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
        className,
      )}
    >
      {/* State Selection */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base leading-none">🗺️</span>
            <span>State</span>
          </span>
          {stateRequired && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative min-w-0">
          <select
            value={selectedState}
            onChange={handleStateChange}
            required={stateRequired && !isStateOther}
            className={clsx(selectBase, stateError && selectWarn)}
          >
            <option value="">Select State</option>
            {STATE_OPTIONS.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
            <option value="OTHER">Other (Custom)</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
        </div>
        <FieldHint message={stateError} type="error" />
      </div>

      {/* Custom State Input */}
      {isStateOther && (
        <div className="col-span-full">
          <FormInput
            label="Custom State Name"
            name="stateCustom"
            value={customState}
            onChange={handleCustomStateChange}
            placeholder="Enter state name"
            required={stateRequired}
          />
        </div>
      )}

      {/* Canonical state value for form submission */}
      <input
        type="hidden"
        name="state"
        value={
          isStateOther
            ? customState
            : selectedState && selectedState !== "OTHER"
              ? selectedState
              : ""
        }
      />

      {/* City Selection */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base leading-none">🏙️</span>
            <span>City</span>
          </span>
          {cityRequired && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative min-w-0">
          <select
            value={selectedCity}
            onChange={handleCityChange}
            disabled={
              !selectedState || (selectedState === "OTHER" && !customState)
            }
            required={
              cityRequired &&
              !isCityOther &&
              selectedState &&
              selectedState !== "OTHER"
            }
            className={clsx(
              selectBase,
              cityError && selectWarn,
              (!selectedState || (selectedState === "OTHER" && !customState)) &&
                selectDisabled,
            )}
          >
            <option value="">
              {!selectedState
                ? "Select state first"
                : selectedState === "OTHER" && !customState
                  ? "Enter custom state first"
                  : "Select City"}
            </option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
            {selectedState && selectedState !== "OTHER" && (
              <option value="OTHER">Other (Custom)</option>
            )}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
        </div>
        <FieldHint message={cityError} type="error" />
      </div>

      {/* Custom City Input */}
      {isCityOther && (
        <div className="col-span-full">
          <FormInput
            label="Custom City Name"
            name="cityCustom"
            value={customCity}
            onChange={handleCustomCityChange}
            placeholder="Enter city name"
            required={cityRequired}
          />
        </div>
      )}

      {/* Canonical city value for form submission */}
      <input
        type="hidden"
        name="city"
        value={
          isCityOther
            ? customCity
            : selectedCity && selectedCity !== "OTHER"
              ? selectedCity
              : ""
        }
      />
    </div>
  );
};

/* ─── Form Error Summary (gentle toast-style) ─── */
export const FormErrorSummary = ({ errors, message }) => {
  const errorList = errors
    ? Object.values(errors).filter(Boolean)
    : message
      ? [message]
      : [];

  if (errorList.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 py-2.5 px-3 text-amber-800 text-xs">
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
          <AlertCircle size={14} />
        </div>
        <div>
          <p className="m-0 text-[13px] font-semibold">
            Please fix the following:
          </p>
          <ul className="mt-1.5 grid list-inside list-none gap-1 pl-0">
            {errorList.map((err, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5 text-amber-500">›</span>
                {err}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default {
  FormInput,
  FormSelect,
  SmartSelect,
  FormTextarea,
  FormErrorSummary,
  PhoneInput,
  NumberInput,
  PincodeInput,
  StateCitySelector,
};
