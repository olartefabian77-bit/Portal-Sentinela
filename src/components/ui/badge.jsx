
export function Badge({ className='', children, variant='default' }){
  const map = { default: 'bg-blue-600 text-white', secondary:'bg-slate-200 text-slate-800'}
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${map[variant]||map.default} ${className}`}>{children}</span>
}
