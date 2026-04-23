import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
}

export default function KPICard({ title, value, icon: Icon, trend, iconColor = "text-primary" }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>{value}</div>
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}% vs semana anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
