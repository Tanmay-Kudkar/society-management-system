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
    if (!file || !societyId) return
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
    if (!file || !societyId) return
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const columnLetters = columns.map(c => c.letter)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <div
                className={clsx(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
                  isDragOver
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500'
                    : 'border-gray-300 dark:border-slate-600'
                )}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{file.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      <X size={18} className="text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
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
                  <label
                    htmlFor="bulk-import-excel-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition"
                  >
                    <Upload size={18} />
                    Select File
                  </label>
                )}
              </div>

              {/* Format Requirements */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Excel Format Requirements
                  </h4>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-lg shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                </div>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  {columns.map((col, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold rounded mt-0.5">
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
              <div className="mb-4 flex gap-4">
                <div className={`flex-1 p-4 rounded-xl text-center transition-all duration-300 ${
                  validationResults.successCount > 0
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600'
                }`}>
                  <div className={`text-3xl font-bold ${validationResults.successCount > 0 ? 'text-white' : 'text-gray-400'}`}>
                    {validationResults.successCount}
                  </div>
                  <div className={`text-sm font-medium ${validationResults.successCount > 0 ? 'text-emerald-100' : 'text-gray-500'}`}>
                    Valid
                  </div>
                </div>
                <div className={`flex-1 p-4 rounded-xl text-center transition-all duration-300 ${
                  validationResults.failureCount > 0
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-red-500/30'
                    : 'bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600'
                }`}>
                  <div className={`text-3xl font-bold ${validationResults.failureCount > 0 ? 'text-white' : 'text-gray-400'}`}>
                    {validationResults.failureCount}
                  </div>
                  <div className={`text-sm font-medium ${validationResults.failureCount > 0 ? 'text-rose-100' : 'text-gray-500'}`}>
                    {validationResults.failureCount > 0 ? 'Needs Fixing' : 'Invalid'}
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-600">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold dark:text-white">Row</th>
                      {tableColumns.map((col, idx) => (
                        <th key={idx} className="px-3 py-3 text-left font-semibold dark:text-white">{col.label}</th>
                      ))}
                      <th className="px-3 py-3 text-left font-semibold dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {validationResults.results?.map((result, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors duration-200 ${
                          result.success
                            ? 'hover:bg-green-50/50 dark:hover:bg-green-900/10'
                            : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-l-red-500'
                        }`}
                      >
                        <td className="px-3 py-3 dark:text-gray-300 font-mono text-xs">{result.rowNumber}</td>
                        {tableColumns.map((col, colIdx) => (
                          <td key={colIdx} className="px-3 py-3 dark:text-gray-300">
                            {col.render ? col.render(result) : (result[col.key] || '-')}
                          </td>
                        ))}
                        <td className="px-3 py-3">
                          {result.success ? (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Valid
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 text-xs font-medium">{result.errorMessage}</span>
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
            <div className="text-center py-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                importResults.successCount > 0
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {importResults.successCount > 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h4 className="text-lg font-semibold dark:text-white mb-2">{importResults.message}</h4>
              <div className="flex gap-4 justify-center">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {importResults.successCount}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Created</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {importResults.failureCount}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-4">
            {step === 'upload' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!file || isValidating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                    <div className="w-full space-y-3">
                      <div className="p-5 bg-gradient-to-br from-rose-500 to-red-600 dark:from-rose-600 dark:to-red-700 rounded-2xl shadow-xl shadow-red-500/30">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-lg mb-2">Invalid File Format</h4>
                            <p className="text-rose-100 text-sm leading-relaxed">
                              The uploaded Excel file does not match the required format. Please ensure you are using the correct template with the required columns.
                            </p>
                            <p className="text-rose-200 text-xs mt-2">
                              Download the template for reference and try again.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setFile(null); setValidationResults(null); setStep('upload') }}
                        className="w-full px-4 py-3.5 accent-btn rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                      >
                        <Upload size={18} />
                        Upload Correct File
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-2xl shadow-xl shadow-orange-500/30">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center animate-bounce-gentle">
                            <AlertCircle className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-lg mb-2">
                              Please Fix {validationResults.failureCount} Error{validationResults.failureCount > 1 ? 's' : ''} Before Import
                            </h4>
                            <p className="text-amber-100 text-sm leading-relaxed">
                              All rows must be valid to proceed. Please review the highlighted errors above, correct them in your Excel file, and re-upload.
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setFile(null); setValidationResults(null); setStep('upload') }}
                        className="w-full px-4 py-3.5 accent-btn rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                      >
                        <Upload size={18} />
                        Fix & Re-upload Excel
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setStep('upload')}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 accent-btn rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
