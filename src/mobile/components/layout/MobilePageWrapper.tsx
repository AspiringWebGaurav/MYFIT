import { ReactNode } from "react";

interface MobilePageWrapperProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function MobilePageWrapper({ 
  title, 
  subtitle, 
  headerRight, 
  children, 
  className = "",
  contentClassName = ""
}: MobilePageWrapperProps) {
  return (
    <div className={`flex flex-col h-full w-full relative z-20 ${className}`}>
      
      {/* Spacer for DateTimeBar + Menu Button gap */}
      <div className="shrink-0" style={{ height: 'var(--mobile-header-offset)' }} />

      {/* Fixed Page Header */}
      {(title || subtitle || headerRight) && (
        <header className="px-6 shrink-0 pb-6 z-30">
          <div className="flex items-start justify-between">
            <div>
              {title && <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>}
              {subtitle && <div className="text-zinc-500 text-sm mt-1">{subtitle}</div>}
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </header>
      )}

      {/* Scrollable Content */}
      <main className={`flex-1 overflow-y-auto mobile-scroll hide-scrollbar z-10 px-6 pb-24 ${contentClassName}`}>
        {children}
      </main>
    </div>
  );
}
