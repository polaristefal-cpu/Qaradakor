interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon?: React.ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground/60 mb-2">{title}</p>
          <p className="text-3xl font-bold mb-2">{value}</p>
          {change && (
            <p
              className={`text-sm ${
                change.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {change.positive ? "+" : ""}{change.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-foreground/40">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
