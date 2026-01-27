import clsx from 'clsx'

export default function Toggle({ checked, onChange, className }) {
  return (
    <label className={clsx("relative inline-flex items-center cursor-pointer", className)}>
      <input 
        type="checkbox" 
        checked={checked}
        onChange={onChange}
        className="sr-only" 
      />
      <div 
        className="w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out"
        style={{ backgroundColor: checked ? 'var(--accent-500)' : undefined }}
      >
        {!checked && (
          <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-slate-600" />
        )}
        <span 
          className="absolute top-[2px] bg-white rounded-full h-5 w-5 shadow-sm transition-all duration-200 ease-in-out"
          style={{
            left: checked ? 'calc(100% - 22px)' : '2px',
            borderColor: checked ? 'white' : '#d1d5db',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        />
      </div>
    </label>
  )
}
