import React, { useState } from 'react';
import { TEAM_MEMBERS } from '@/lib/demo-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { StatusDot } from '@/components/common/Badges';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Search, Mail, Phone, MessageSquare, SlidersHorizontal, Users, Stethoscope, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <UserCheck className="w-4 h-4 text-primary" />,
  doctor: <Stethoscope className="w-4 h-4 text-[hsl(38_53%_47%)]" />,
  nurse: <Users className="w-4 h-4 text-[hsl(207_85%_45%)]" />,
};

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('nurse');

  const filtered = TEAM_MEMBERS.filter(m => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.specialty.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function sendInvite() {
    if (!inviteEmail) { toast.error('Please enter an email address'); return; }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail('');
  }

  return (
    <div className="space-y-6">
      <div data-tour="team-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Elara Women's Specialist Clinic · {TEAM_MEMBERS.length} members</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 text-xs self-start md:self-auto">
              <UserPlus className="w-3.5 h-3.5" /> Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-sm font-normal text-muted-foreground">Email address</Label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@elarahealth.com" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-normal text-muted-foreground">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Hospital Admin</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse / Midwife</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">The team member will receive an email with instructions to set up their account.</p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={sendInvite}>Send invitation</Button>
                <Button variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team…" className="pl-9 h-9 text-sm" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 h-9">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team cards */}
      <div data-tour="team-members" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(member => (
          <Card key={member.id} className="h-full hover:shadow-[var(--shadow-hover)] transition-shadow">
            <CardContent className="pt-5 pb-5 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="w-11 h-11 shrink-0">
                  <AvatarFallback className="text-sm font-bold bg-secondary text-primary">{member.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                    <StatusDot status={member.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.specialty}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {ROLE_ICONS[member.role]}
                    <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/40 rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground">Assigned mothers</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{member.assignedMothers}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground">Active follow-ups</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{member.activeFollowUps}</p>
                </div>
              </div>

              {/* Workload */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Workload capacity</span>
                  <span className="text-xs font-medium text-foreground">{member.workloadPct}%</span>
                </div>
                <Progress value={member.workloadPct} className={cn('h-1.5', member.workloadPct > 90 ? '[&>div]:bg-destructive' : '')} />
              </div>

              {/* Permission badge + last active */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <Badge variant="outline" className="text-xs capitalize">{member.permission}</Badge>
                <span>Last active {member.lastActive}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => toast.info(`Messaging ${member.name}…`)}>
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => toast.info(`Opening ${member.name}'s profile…`)}>
                  View profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="md:col-span-3 text-center py-12">
            <p className="text-sm text-muted-foreground">No team members match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
