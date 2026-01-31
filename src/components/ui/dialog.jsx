
import React, {useEffect} from 'react';
export function Dialog({ open, onOpenChange, children }){
  useEffect(()=>{ function onEsc(e){ if(e.key==='Escape') onOpenChange?.(false)}; if(open) document.addEventListener('keydown',onEsc); return ()=>document.removeEventListener('keydown',onEsc)},[open]);
  if(!open) return null; return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={()=>onOpenChange?.(false)} />
      <div className="relative z-10 w-full max-w-3xl mx-4">{children}</div>
    </div>
  );
}
export function DialogTrigger({ asChild, children }){ return children }
export function DialogContent({ className='', children }){ return <div className={`rounded-xl bg-white p-4 shadow-xl ${className}`}>{children}</div> }
export function DialogHeader({ children }){ return <div className="mb-2">{children}</div> }
export function DialogTitle({ children }){ return <h3 className="text-lg font-semibold">{children}</h3> }
