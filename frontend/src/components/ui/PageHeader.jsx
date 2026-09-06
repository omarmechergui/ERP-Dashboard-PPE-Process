import React from 'react';

export default function PageHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-bold text-foreground tracking-tight flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm text-primary">
              <Icon className="w-8 h-8" />
            </div>
          )}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-secondary-foreground mt-2 font-medium">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
