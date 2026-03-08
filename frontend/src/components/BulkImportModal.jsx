import { useState, useRef } from 'react'
import { Upload, Download, X, AlertCircle, Eye, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import * as XLSX from 'xlsx'
import { useToast } from '../context'
import NeonSweepButton from './NeonSweepButton'

/**
 * Reusable Bulk Import Modal component.
 * 
 * Props:
 * - title: string (e.g., "Bulk Import Wings")
 * - entityName: string (e.g., "Wings", "Vehicles")
 * - templateFilename: string (e.g., "wing_import_template.xlsx")
 * - columns: Array<{ letter: string, label: string, required: boolean, description: string }>
 * - tableColumns: Array<{ key: string, label: string, render?: (result) => JSX }>
 * - apiValidate: (file, societyId) => Promise  - validation API call
 * - apiProcess: (file, societyId) => Promise    - process/import API call
 * - apiTemplate: () => Promise                  - download template API call
 * - societyId: number
 * - userId: number (optional, passed to apiProcess if needed)
 * - onClose: () => void
 * - onSuccess: () => void
 */
export default function BulkImportModal({
  title = 'Bulk Import',
  entityName = 'Records',
  templateFilename = 'import_template.xlsx',
  columns = [],
  tableColumns = [],
  apiValidate,
  apiProcess,
  apiTemplate,
  societyId,
  userId,
  requireScopeId = true,
  onDownloadErrorReport,
  errorReportFilename = 'bulk_import_errors.xlsx',
  onClose,
  onSuccess,
}) {
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('upload') // 'upload', 'preview', 'results'
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const toToastMessage = (message) => {
    const msg = String(message || '')
    if (msg.toLowerCase().startsWith('missing required column')) {
      return 'Wrong template selected. Please download and use the provided template.'
    }
    return msg || 'Something went wrong'
  }

  const showError = (message) => {
    const msg = String(message || '')
    setError(msg)
    toast.error(toToastMessage(msg))
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValidationResults(null)
      setImportResults(null)
      setError('')
      setStep('upload')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      setValidationResults(null)
      setImportResults(null)
      setError('')
      setStep('upload')
    } else {
      showError('Please drop a valid Excel file (.xlsx or .xls)')
    }
  }

  const handleValidate = async () => {
    if (!file || (requireScopeId && !societyId)) return
    setIsValidating(true)
    setError('')
    try {
      const response = await apiValidate(file, societyId)
      setValidationResults(response.data)
      setStep('preview')
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to validate file')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file || (requireScopeId && !societyId)) return
    setIsImporting(true)
    setError('')
    try {
      const response = await apiProcess(file, societyId, userId)
      setImportResults(response.data)
      setStep('results')
      if (response.data.successCount > 0) {
        onSuccess?.()
      }
    } catch (err) {
      showError(err.response?.data?.message || `Failed to import ${entityName.toLowerCase()}`)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await apiTemplate()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', templateFilename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showError('Failed to download template')
    }
  }

  const downloadErrorReport = async () => {
    try {
      let reportBlob

      if (onDownloadErrorReport) {
        const response = await onDownloadErrorReport(importResults)
        reportBlob = new Blob([response.data])
      } else {
        const failedRows = (importResults?.results || []).filter((row) => !row.success)
        if (!failedRows.length) {
          throw new Error('No failed rows found to export')
        }

        const reportColumns = tableColumns.length > 0
          ? tableColumns.map((column) => ({ key: column.key, label: column.label }))
          : Object.keys(failedRows[0] || {})
              .filter((key) => !['success', 'normalizedRow'].includes(key))
              .map((key) => ({ key, label: key }))

        const rows = failedRows.map((row) => {
          const reportRow = { Row: row.rowNumber ?? '-' }
          reportColumns.forEach((column) => {
            reportRow[column.label] = row[column.key] ?? '-'
          })
          reportRow['Error Message'] = row.errorMessage || 'Unknown error'
          return reportRow
        })

        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ImportErrors')
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        reportBlob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      }

      const url = window.URL.createObjectURL(reportBlob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', errorReportFilename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to download error report')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-[720px] overflow-hidden rounded-2xl border border-slate-400/25 bg-[#05080d] text-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-400/20 p-4">
          <h3 className="text-lg font-bold text-slate-50">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-[10px] bg-slate-400/15 p-1.5 text-slate-400 transition hover:bg-slate-400/30 hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-4">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-center gap-2 break-words rounded-xl border border-red-400/45 bg-red-800/25 p-3 font-bold leading-6 text-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <div
                className={clsx(
                  'rounded-2xl border border-dashed border-slate-400/70 bg-black/40 p-8 text-center transition',
                  isDragOver && 'border-slate-300 bg-black/55'
                )}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="rounded-[10px] bg-emerald-500/15 p-2">
                      <Upload className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <span className="block font-semibold text-slate-200">{file.name}</span>
                      <span className="ml-1.5 text-xs text-slate-400">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="rounded-[10px] bg-transparent p-1.5 text-slate-500 transition hover:bg-slate-400/20"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                    <p className="mb-2 text-base font-medium text-slate-200">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <p className="mb-4 text-xs text-slate-400">
                      Supported format: .xlsx, .xls
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bulk-import-excel-upload"
                />
                {!file && (
                  <NeonSweepButton
                    tone="slate"
                    size="md"
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={18} />
                    Select File
                  </NeonSweepButton>
                )}
              </div>

              {/* Format Requirements */}
              <div className="mt-4 rounded-2xl border border-slate-400/25 bg-black/35 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="inline-flex items-center gap-2 font-bold text-slate-100">
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                    Excel Format Requirements
                  </h4>
                  <NeonSweepButton tone="cyan" size="md" onClick={downloadTemplate}>
                    <Download size={16} />
                    Download Template
                  </NeonSweepButton>
                </div>
                <ul className="grid list-none gap-2 p-0 text-[13px] text-slate-200">
                  {columns.map((col, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-slate-400/25 text-[11px] font-bold text-slate-50">
                        {col.letter}
                      </span>
                      <span>
                        <strong>{col.label}</strong>{col.required ? '' : ' (optional)'} - {col.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && validationResults && (
            <>
              {/* Summary Cards */}
              <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                <div
                  className={clsx(
                    'flex-1 rounded-2xl p-4 text-center transition',
                    validationResults.successCount > 0
                      ? 'bg-[linear-gradient(135deg,#10b981,#16a34a)] shadow-[0_18px_30px_rgba(16,185,129,0.25)]'
                      : 'border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700/60'
                  )}
                >
                  <div
                    className={clsx(
                      'text-[28px] font-extrabold',
                      validationResults.successCount > 0
                        ? 'text-white'
                        : 'text-slate-400'
                    )}
                  >
                    {validationResults.successCount}
                  </div>
                  <div
                    className={clsx(
                      'text-xs font-semibold',
                      validationResults.successCount > 0
                        ? 'text-white/85'
                        : 'text-slate-500'
                    )}
                  >
                    Valid
                  </div>
                </div>
                <div
                  className={clsx(
                    'flex-1 rounded-2xl p-4 text-center transition',
                    validationResults.failureCount > 0
                      ? 'bg-[linear-gradient(135deg,#f43f5e,#dc2626)] shadow-[0_18px_30px_rgba(244,63,94,0.25)]'
                      : 'border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700/60'
                  )}
                >
                  <div
                    className={clsx(
                      'text-[28px] font-extrabold',
                      validationResults.failureCount > 0
                        ? 'text-white'
                        : 'text-slate-400'
                    )}
                  >
                    {validationResults.failureCount}
                  </div>
                  <div
                    className={clsx(
                      'text-xs font-semibold',
                      validationResults.failureCount > 0
                        ? 'text-white/85'
                        : 'text-slate-500'
                    )}
                  >
                    {validationResults.failureCount > 0 ? 'Needs Fixing' : 'Invalid'}
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-400/25 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                <table className="w-full border-collapse text-[13px]">
                  <thead className="bg-slate-400/10">
                    <tr>
                      <th className="p-3 text-left font-bold text-slate-50">Row</th>
                      {tableColumns.map((col, idx) => (
                        <th key={idx} className="p-3 text-left font-bold text-slate-50">{col.label}</th>
                      ))}
                      <th className="p-3 text-left font-bold text-slate-50">Status</th>
                    </tr>
                  </thead>
                  <tbody className="border-t border-slate-400/20">
                    {validationResults.results?.map((result, idx) => (
                      <tr
                        key={idx}
                        className={clsx(
                          'transition',
                          result.success
                            ? 'hover:bg-emerald-500/10'
                            : 'border-l-4 border-red-500 bg-red-400/10'
                        )}
                      >
                        <td className="p-3 font-mono text-xs text-slate-200">{result.rowNumber}</td>
                        {tableColumns.map((col, colIdx) => (
                          <td key={colIdx} className="p-3 text-slate-200">
                            {col.render ? col.render(result) : (result[col.key] || '-')}
                          </td>
                        ))}
                        <td className="p-3 text-slate-200">
                          {result.success ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Valid
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-100">
                              {result.errors && result.errors.length > 0 ? (
                                <ul className="flex list-disc flex-col gap-1 pl-3.5">
                                  {result.errors.map((err, errIdx) => (
                                    <li key={errIdx} className="text-xs font-semibold leading-5 text-red-100">
                                      {err}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span>{result.errorMessage}</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Step 3: Results */}
          {step === 'results' && importResults && (
            <div className="py-8 text-center">
              <div
                className={clsx(
                  'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
                  importResults.successCount > 0
                    ? 'bg-emerald-500/15'
                    : 'bg-red-400/15'
                )}
              >
                {importResults.successCount > 0 ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <h4 className="mb-3 text-lg font-bold text-slate-50">{importResults.message}</h4>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <div className="min-w-[110px] rounded-xl bg-emerald-500/15 p-3">
                  <div className="text-xl font-extrabold text-emerald-400">
                    {importResults.successCount}
                  </div>
                  <div className="text-xs font-semibold text-emerald-300">Created</div>
                </div>
                <div className="min-w-[110px] rounded-xl bg-red-400/15 p-3">
                  <div className="text-xl font-extrabold text-red-300">
                    {importResults.failureCount}
                  </div>
                  <div className="text-xs font-semibold text-red-200">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="mt-4 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {step === 'upload' && (
              <>
                <NeonSweepButton
                  tone="slate"
                  size="md"
                  className="min-w-[150px]"
                  onClick={onClose}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  tone="cyan"
                  size="md"
                  className="min-w-[150px]"
                  onClick={handleValidate}
                  disabled={!file || isValidating}
                >
                  {isValidating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/50 border-t-transparent" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Preview & Validate
                    </>
                  )}
                </NeonSweepButton>
              </>
            )}

            {step === 'preview' && (
              <>
                {validationResults?.failureCount > 0 ? (
                  validationResults.failureCount === validationResults.totalRows ? (
                    <div className="grid w-full gap-3">
                      <div className="rounded-[18px] bg-[linear-gradient(135deg,#f43f5e,#dc2626)] p-5 text-white shadow-[0_18px_30px_rgba(244,63,94,0.35)]">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                            <AlertCircle className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="mb-2 text-lg font-bold">Invalid File Format</h4>
                            <p className="text-[13px] leading-6 text-white/90">
                              The uploaded Excel file does not match the required format. Please ensure you are using the correct template with the required columns.
                            </p>
                            <p className="mt-2 text-[11px] text-white/75">
                              Download the template for reference and try again.
                            </p>
                          </div>
                        </div>
                      </div>
                      <NeonSweepButton
                        tone="violet"
                        size="md"
                        onClick={() => { setFile(null); setValidationResults(null); setStep('upload') }}
                        className="w-full min-w-0"
                      >
                        <Upload size={18} />
                        Upload Correct File
                      </NeonSweepButton>
                    </div>
                  ) : (
                    <div className="grid w-full gap-3">
                      <div className="rounded-[18px] bg-[linear-gradient(135deg,#f59e0b,#f97316)] p-5 text-white shadow-[0_18px_30px_rgba(245,158,11,0.3)]">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-white/20">
                            <AlertCircle className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="mb-2 text-lg font-bold">
                              Please Fix {validationResults.failureCount} Error{validationResults.failureCount > 1 ? 's' : ''} Before Import
                            </h4>
                            <p className="text-[13px] leading-6 text-white/90">
                              All rows must be valid to proceed. Please review the highlighted errors above, correct them in your Excel file, and re-upload.
                            </p>
                          </div>
                        </div>
                      </div>
                      <NeonSweepButton
                        tone="violet"
                        size="md"
                        onClick={() => { setFile(null); setValidationResults(null); setStep('upload') }}
                        className="w-full min-w-0"
                      >
                        <Upload size={18} />
                        Fix & Re-upload Excel
                      </NeonSweepButton>
                    </div>
                  )
                ) : (
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <NeonSweepButton
                      tone="slate"
                      size="md"
                      className="min-w-[150px]"
                      onClick={() => setStep('upload')}
                    >
                      Back
                    </NeonSweepButton>
                    <NeonSweepButton
                      tone="cyan"
                      size="md"
                      className="min-w-[150px]"
                      onClick={handleImport}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/50 border-t-transparent" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Import {validationResults?.successCount} {entityName}
                        </>
                      )}
                    </NeonSweepButton>
                  </div>
                )}
              </>
            )}

            {step === 'results' && (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {importResults?.failureCount > 0 && (
                  <NeonSweepButton
                    tone="slate"
                    size="md"
                    className="min-w-[150px]"
                    onClick={downloadErrorReport}
                  >
                    <Download size={18} />
                    Download Error Report
                  </NeonSweepButton>
                )}
                <NeonSweepButton
                  tone="violet"
                  size="md"
                  className="min-w-[150px]"
                  onClick={onClose}
                >
                  Done
                </NeonSweepButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
