/**
 * Reusable form input component with inline validation
 */
import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'

/**
 * Form Input with inline error display
 */
export const FormInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg outline-none transition',
          'bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Form Select with inline error display
 */
export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select...',
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg outline-none transition',
          'bg-white dark:bg-slate-700 text-gray-900 dark:text-white',
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
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
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Form Textarea with inline error display
 */
export const FormTextarea = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg outline-none transition resize-none',
          'bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400',
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Form error summary display
 */
export const FormErrorSummary = ({ errors }) => {
  const errorList = Object.values(errors).filter(Boolean)
  
  if (errorList.length === 0) return null
  
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
        <div>
          <h4 className="font-medium text-red-900 dark:text-red-100">
            Please fix the following errors:
          </h4>
          <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
            {errorList.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default {
  FormInput,
  FormSelect,
  FormTextarea,
  FormErrorSummary,
}
