import { useState, useRef } from 'react'
import { Upload, Download, X, AlertCircle, Eye, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

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
  const [file, setFile] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('upload') // 'upload', 'preview', 'results'
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

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
      setError('Please drop a valid Excel file (.xlsx or .xls)')
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
      setError(err.response?.data?.message || 'Failed to validate file')
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
      setError(err.response?.data?.message || `Failed to import ${entityName.toLowerCase()}`)
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
      setError('Failed to download template')
    }
  }

  const downloadErrorReport = async () => {
    if (!onDownloadErrorReport) return
    try {
      const response = await onDownloadErrorReport(importResults)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', errorReportFilename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download error report')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="bulk-import">
      <div className="bulk-import__dialog">
        {/* Header */}
        <div className="bulk-import__header">
          <h3 className="bulk-import__title">{title}</h3>
          <button onClick={onClose} className="bulk-import__close">
            <X size={20} className="bulk-import__close-icon" />
          </button>
        </div>

        {/* Body */}
        <div className="bulk-import__body">
          {/* Error Banner */}
          {error && (
            <div className="bulk-import__error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <div
                className={clsx(
                  'bulk-import__dropzone',
                  isDragOver && 'bulk-import__dropzone--active'
                )}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
              >
                {file ? (
                  <div className="bulk-import__file-row">
                    <div className="bulk-import__file-icon">
                      <Upload className="bulk-import__file-icon-svg" />
                    </div>
                    <div className="bulk-import__file-meta">
                      <span className="bulk-import__file-name">{file.name}</span>
                      <span className="bulk-import__file-size">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="bulk-import__file-remove"
                    >
                      <X size={18} className="bulk-import__file-remove-icon" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="bulk-import__drop-icon" />
                    <p className="bulk-import__drop-title">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <p className="bulk-import__drop-subtitle">
                      Supported format: .xlsx, .xls
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="bulk-import__file-input"
                  id="bulk-import-excel-upload"
                />
                {!file && (
                  <label
                    htmlFor="bulk-import-excel-upload"
                    className="bulk-import__file-button"
                  >
                    <Upload size={18} />
                    Select File
                  </label>
                )}
              </div>

              {/* Format Requirements */}
              <div className="bulk-import__requirements">
                <div className="bulk-import__requirements-header">
                  <h4 className="bulk-import__requirements-title">
                    <span className="bulk-import__requirements-dot" />
                    Excel Format Requirements
                  </h4>
                  <button
                    onClick={downloadTemplate}
                    className="bulk-import__template-btn"
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                </div>
                <ul className="bulk-import__requirements-list">
                  {columns.map((col, idx) => (
                    <li key={idx} className="bulk-import__requirements-item">
                      <span className="bulk-import__requirements-badge">
                        {col.letter}
                      </span>
                      <span className="bulk-import__requirements-text">
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
              <div className="bulk-import__summary">
                <div
                  className={clsx(
                    "bulk-import__summary-card",
                    validationResults.successCount > 0
                      ? "bulk-import__summary-card--success"
                      : "bulk-import__summary-card--muted"
                  )}
                >
                  <div
                    className={clsx(
                      "bulk-import__summary-value",
                      validationResults.successCount > 0
                        ? "bulk-import__summary-value--light"
                        : "bulk-import__summary-value--muted"
                    )}
                  >
                    {validationResults.successCount}
                  </div>
                  <div
                    className={clsx(
                      "bulk-import__summary-label",
                      validationResults.successCount > 0
                        ? "bulk-import__summary-label--light"
                        : "bulk-import__summary-label--muted"
                    )}
                  >
                    Valid
                  </div>
                </div>
                <div
                  className={clsx(
                    "bulk-import__summary-card",
                    validationResults.failureCount > 0
                      ? "bulk-import__summary-card--error"
                      : "bulk-import__summary-card--muted"
                  )}
                >
                  <div
                    className={clsx(
                      "bulk-import__summary-value",
                      validationResults.failureCount > 0
                        ? "bulk-import__summary-value--light"
                        : "bulk-import__summary-value--muted"
                    )}
                  >
                    {validationResults.failureCount}
                  </div>
                  <div
                    className={clsx(
                      "bulk-import__summary-label",
                      validationResults.failureCount > 0
                        ? "bulk-import__summary-label--light"
                        : "bulk-import__summary-label--muted"
                    )}
                  >
                    {validationResults.failureCount > 0 ? 'Needs Fixing' : 'Invalid'}
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="bulk-import__table-wrap">
                <table className="bulk-import__table">
                  <thead className="bulk-import__thead">
                    <tr>
                      <th className="bulk-import__th">Row</th>
                      {tableColumns.map((col, idx) => (
                        <th key={idx} className="bulk-import__th">{col.label}</th>
                      ))}
                      <th className="bulk-import__th">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bulk-import__tbody">
                    {validationResults.results?.map((result, idx) => (
                      <tr
                        key={idx}
                        className={clsx(
                          "bulk-import__row",
                          result.success
                            ? "bulk-import__row--success"
                            : "bulk-import__row--error"
                        )}
                      >
                        <td className="bulk-import__cell bulk-import__cell--mono">{result.rowNumber}</td>
                        {tableColumns.map((col, colIdx) => (
                          <td key={colIdx} className="bulk-import__cell">
                            {col.render ? col.render(result) : (result[col.key] || '-')}
                          </td>
                        ))}
                        <td className="bulk-import__cell">
                          {result.success ? (
                            <span className="bulk-import__status bulk-import__status--valid">
                              <span className="bulk-import__status-dot" />
                              Valid
                            </span>
                          ) : (
                            <span className="bulk-import__status bulk-import__status--error">{result.errorMessage}</span>
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
            <div className="bulk-import__results">
              <div
                className={clsx(
                  "bulk-import__results-icon",
                  importResults.successCount > 0
                    ? "bulk-import__results-icon--success"
                    : "bulk-import__results-icon--error"
                )}
              >
                {importResults.successCount > 0 ? (
                  <CheckCircle2 className="bulk-import__results-icon-svg" />
                ) : (
                  <AlertCircle className="bulk-import__results-icon-svg bulk-import__results-icon-svg--error" />
                )}
              </div>
              <h4 className="bulk-import__results-title">{importResults.message}</h4>
              <div className="bulk-import__results-cards">
                <div className="bulk-import__results-card bulk-import__results-card--success">
                  <div className="bulk-import__results-value bulk-import__results-value--success">
                    {importResults.successCount}
                  </div>
                  <div className="bulk-import__results-label bulk-import__results-label--success">Created</div>
                </div>
                <div className="bulk-import__results-card bulk-import__results-card--error">
                  <div className="bulk-import__results-value bulk-import__results-value--error">
                    {importResults.failureCount}
                  </div>
                  <div className="bulk-import__results-label bulk-import__results-label--error">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="bulk-import__footer">
            {step === 'upload' && (
              <>
                <button
                  onClick={onClose}
                  className="bulk-import__btn bulk-import__btn--secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!file || isValidating}
                  className="bulk-import__btn bulk-import__btn--primary"
                >
                  {isValidating ? (
                    <>
                      <div className="bulk-import__spinner" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Preview & Validate
                    </>
                  )}
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                {validationResults?.failureCount > 0 ? (
                  validationResults.failureCount === validationResults.totalRows ? (
                    <div className="bulk-import__panel-stack">
                      <div className="bulk-import__panel bulk-import__panel--error">
                        <div className="bulk-import__panel-row">
                          <div className="bulk-import__panel-icon">
                            <AlertCircle className="bulk-import__panel-icon-svg" />
                          </div>
                          <div className="bulk-import__panel-content">
                            <h4 className="bulk-import__panel-title">Invalid File Format</h4>
                            <p className="bulk-import__panel-text">
                              The uploaded Excel file does not match the required format. Please ensure you are using the correct template with the required columns.
                            </p>
                            <p className="bulk-import__panel-hint">
                              Download the template for reference and try again.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setFile(null); setValidationResults(null); setStep('upload') }}
                        className="bulk-import__btn bulk-import__btn--accent bulk-import__btn--block"
                      >
                        <Upload size={18} />
                        Upload Correct File
                      </button>
                    </div>
                  ) : (
                    <div className="bulk-import__panel-stack">
                      <div className="bulk-import__panel bulk-import__panel--warning">
                        <div className="bulk-import__panel-row">
                          <div className="bulk-import__panel-icon bulk-import__panel-icon--bounce">
                            <AlertCircle className="bulk-import__panel-icon-svg" />
                          </div>
                          <div className="bulk-import__panel-content">
                            <h4 className="bulk-import__panel-title">
                              Please Fix {validationResults.failureCount} Error{validationResults.failureCount > 1 ? 's' : ''} Before Import
                            </h4>
                            <p className="bulk-import__panel-text">
                              All rows must be valid to proceed. Please review the highlighted errors above, correct them in your Excel file, and re-upload.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setFile(null); setValidationResults(null); setStep('upload') }}
                        className="bulk-import__btn bulk-import__btn--accent bulk-import__btn--block"
                      >
                        <Upload size={18} />
                        Fix & Re-upload Excel
                      </button>
                    </div>
                  )
                ) : (
                  <div className="bulk-import__footer-row">
                    <button
                      onClick={() => setStep('upload')}
                      className="bulk-import__btn bulk-import__btn--secondary"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="bulk-import__btn bulk-import__btn--confirm"
                    >
                      {isImporting ? (
                        <>
                          <div className="bulk-import__spinner" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Import {validationResults?.successCount} {entityName}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 'results' && (
              <div className="bulk-import__footer-row">
                {onDownloadErrorReport && importResults?.failureCount > 0 && (
                  <button
                    onClick={downloadErrorReport}
                    className="bulk-import__btn bulk-import__btn--secondary"
                  >
                    <Download size={18} />
                    Download Error Report
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bulk-import__btn bulk-import__btn--accent"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
