import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchEscalations } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  serious: "bg-[hsl(38_92%_93%)] text-[hsl(38_70%_30%)] border-[hsl(38_92%_70%)]",
  mild: "bg-secondary text-primary border-primary/20",
};

interface EscalationRow {
  motherId: string;
  motherName: string;
  severity: string;
  note: string;
  escalatedAt: string;
  escalatedBy: string;
}

export default function EscalatedCasesPage() {
  const [items, setItems] = useState<EscalationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEscalations()
      .then((res) => setItems(res.items as EscalationRow[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Escalated Cases</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Open case escalations from your clinical team, tagged by severity.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading escalations…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No open escalations right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={`${item.motherId}-${item.escalatedAt}`} className="border-border">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{item.motherName}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs capitalize", SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.serious)}
                    >
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.note}</p>
                  <p className="text-xs text-muted-foreground">
                    Escalated by {item.escalatedBy || "Clinical staff"}
                    {item.escalatedAt ? ` · ${new Date(item.escalatedAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <Link to={`/dashboard/mothers/${item.motherId}`}>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1 shrink-0">
                    View profile <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
