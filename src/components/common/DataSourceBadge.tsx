import { Badge } from "@/components/ui/badge";
import type { DataSource } from "@/hooks/use-api-query";

interface DataSourceBadgeProps {
  loading: boolean;
  source: DataSource;
  error?: Error | null;
}

export function DataSourceBadge({ loading, source, error }: DataSourceBadgeProps) {
  let label = "Demo data";
  if (loading) label = "Loading…";
  else if (error) label = "API error";
  else if (source === "dynamodb") label = "Live · DynamoDB";

  return (
    <Badge
      variant="outline"
      className="text-xs font-normal"
      title={error?.message}
    >
      {label}
    </Badge>
  );
}
