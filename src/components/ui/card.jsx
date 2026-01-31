
export function Card({ className='', ...props }) { return <div className={`rounded-xl border bg-white ${className}`} {...props}/> }
export function CardHeader({ className='', ...props }) { return <div className={`p-4 ${className}`} {...props}/> }
export function CardTitle({ className='', ...props }) { return <h3 className={`font-semibold text-lg ${className}`} {...props}/> }
export function CardContent({ className='', ...props }) { return <div className={`p-4 pt-0 ${className}`} {...props}/> }
