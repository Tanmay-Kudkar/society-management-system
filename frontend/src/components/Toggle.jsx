import clsx from 'clsx'

export default function Toggle({ checked, onChange, className }) {
  return (
    <label className={clsx('relative inline-flex cursor-pointer items-center', className)}>
      <input 
        type="checkbox" 
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div 
        className={clsx(
          'relative h-6 w-11 rounded-full transition-colors duration-200',
          checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-600'
        )}
      >
        {!checked && (
          <div className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-600" />
        )}
        <span 
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.18)] transition-transform duration-200 border',
            checked
              ? 'translate-x-[22px] border-white'
              : 'translate-x-0.5 border-slate-300'
          )}
        />
      </div>
    </label>
  )
}
