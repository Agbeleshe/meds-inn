import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { PatientStatus, RiskLevel } from '@/types/clinical';
import { useMothers } from '@/hooks/use-mothers';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { RiskBadge, AdherenceBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, ArrowRight, UserPlus } from 'lucide-react';

type TabKey = 'all' | 'active-pregnancy' | 'high-risk' | 'postpartum' | 'new' | 'missed-followup';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active-pregnancy', label: 'Active Pregnancy' },
  { key: 'high-risk', label: 'High Risk' },
  { key: 'postpartum', label: 'Postpartum' },
  { key: 'new', label: 'New Enrolments' },
  { key: 'missed-followup', label: 'Missed Follow-up' },
];

export default function MothersPage() {
  const { mothers: allPatients, source, loading, error } = useMothers();
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('name');

  let patients = allPatients;
  if (tab !== 'all') {
    if (tab === 'high-risk') patients = patients.filter(p => p.riskLevel === 'high');
    else patients = patients.filter(p => p.status === tab);
  }
  if (riskFilter !== 'all') patients = patients.filter(p => p.riskLevel === riskFilter as RiskLevel);
  if (search) {
    const q = search.toLowerCase();
    patients = patients.filter(
      (p) =>
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.id ?? "").toLowerCase().includes(q),
    );
  }
  if (sortKey === "name") {
    patients = [...patients].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );
  }
  if (sortKey === "adherence") {
    patients = [...patients].sort(
      (a, b) => (a.adherence ?? 0) - (b.adherence ?? 0),
    );
  }
  if (sortKey === "risk") {
    patients = [...patients].sort((a, b) => {
      const order: Record<RiskLevel, number> = { high: 0, moderate: 1, low: 2 };
      return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
    });
  }

  const statusLabel: Record<PatientStatus, string> = {
    'active-pregnancy': 'Pregnant',
    'postpartum': 'Postpartum',
    'new': 'New',
    'missed-followup': 'Missed Follow-up',
  };
  const statusColor: Record<PatientStatus, string> = {
    'active-pregnancy': 'bg-secondary text-primary',
    'postpartum': 'bg-[hsl(207_85%_93%)] text-[hsl(207_85%_30%)]',
    'new': 'bg-[hsl(38_53%_93%)] text-[hsl(38_53%_30%)]',
    'missed-followup': 'bg-[hsl(0_72%_93%)] text-[hsl(0_72%_36%)]',
  };

  return (
    <div className="space-y-6">
      <div data-tour="mothers-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">Mothers</h1>
            <DataSourceBadge loading={loading} source={source} error={error} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Mothers who need attention, surfaced early.</p>
        </div>
        <Button size="sm" className="gap-2 self-start md:self-auto" onClick={() => toast.success('Opening enrolment form')}>
          <UserPlus className="w-4 h-4" /> Enrol Mother
        </Button>
      </div>

      {/* Filters */}
      <div data-tour="mothers-filters" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-36 h-9">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={setSortKey}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A–Z)</SelectItem>
            <SelectItem value="adherence">Adherence (low first)</SelectItem>
            <SelectItem value="risk">Risk (high first)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
        <TabsList className="h-9">
          {TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs px-3">{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div data-tour="mothers-table" className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Patient', 'Stage', 'Risk', 'Assigned Nurse', 'Doctor', 'Last Check-in', 'Next Appt', 'Adherence', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={8} columns={10} showAvatar />
              ) : patients.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-secondary text-primary font-semibold">{p.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm text-muted-foreground">
                    {p.gestationalWeek > 0 ? `Wk ${p.gestationalWeek}` : p.trimester}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap"><RiskBadge level={p.riskLevel} /></td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">{p.nurse}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">{p.doctor}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">{p.lastCheckIn}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">{p.nextAppointment}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap"><AdherenceBadge value={p.adherence} /></td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor[p.status] ?? "bg-muted text-muted-foreground"}`}>
                      {statusLabel[p.status] ?? p.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <Link to={`/dashboard/mothers/${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && patients.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">No patients match your current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {loading ? 'Loading patients…' : `Showing ${patients.length} of ${allPatients.length} patients`}
          </p>
        </div>
      </div>
    </div>
  );
}
