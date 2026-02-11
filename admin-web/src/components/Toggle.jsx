import clsx from 'clsx'

export default function Toggle({ checked, onChange, className }) {
  return (
    <label className={clsx("toggle", className)}>
      <input 
        type="checkbox" 
        checked={checked}
        onChange={onChange}
        className="toggle__input" 
      />
      <div 
        className={clsx("toggle__track", checked && "toggle__track--checked")}
      >
        {!checked && (
          <div className="toggle__track-base" />
        )}
        <span 
          className="toggle__thumb"
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
