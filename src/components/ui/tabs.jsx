
import React, { useState } from 'react';
export function Tabs({ defaultValue, children }){ const [v,setV]=useState(defaultValue); return <div data-value={v}>{React.Children.map(children,child=>React.cloneElement(child,{value:v,setValue:setV}))}</div> }
export function TabsList({ children }){ return <div className="flex gap-2 mt-2">{children}</div> }
export function TabsTrigger({ value,setValue, children }){ return <button onClick={()=>setValue(children.props?.value||value)} className="px-3 py-1.5 rounded border bg-white text-sm">{children||value}</button> }
export function TabsContent({ value, children, value:me }){ return value===me? <div className="mt-2">{children}</div>: null }
