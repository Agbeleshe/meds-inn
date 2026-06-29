import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Bell, Shield, Building2, Save, Baby } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyMotherProfile } from '@/hooks/use-mother';
import { useAppointments } from '@/hooks/use-appointments';
import { MotherProfileHeader } from '@/components/mother/MotherProfileHeader';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, role } = useApp();
  const { user } = useAuth();
  const motherId = user?.motherId;
  const { data: motherProfile, loading: profileLoading, source, canEdit, updateProfile } = useMyMotherProfile(
    role === 'mother' ? motherId : undefined,
  );
  const { appointments } = useAppointments(role === 'mother' ? motherId : undefined);
  const [tab, setTab] = useState('profile');
  const [markingDelivered, setMarkingDelivered] = useState(false);

  const isPostpartum =
    motherProfile?.careStage === 'postpartum' ||
    motherProfile?.status === 'postpartum' ||
    motherProfile?.status === 'delivered';

  async function handleChildbirthToggle(checked: boolean) {
    if (!checked || !updateProfile || isPostpartum) return;
    setMarkingDelivered(true);
    try {
      await updateProfile({ careStage: 'postpartum', status: 'delivered', babyWeeks: 0 });
      toast.success('Congratulations! Please complete your baby\'s profile.');
      navigate('/dashboard/baby-care');
    } catch {
      toast.error('Could not update your status — please try again');
    } finally {
      setMarkingDelivered(false);
    }
  }

  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    medicationReminders: true,
    urgentAlerts: true,
    weeklyDigest: false,
    nurseMessages: true,
    aiCareBriefs: true,
  });

  function handleSave() {
    toast.success('Settings saved');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div data-tour="settings-header">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile, notifications, and account preferences.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="profile" className="text-xs px-3 gap-1.5"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs px-3 gap-1.5"><Bell className="w-3.5 h-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="security" className="text-xs px-3 gap-1.5"><Shield className="w-3.5 h-3.5" />Security</TabsTrigger>
          {role === 'admin' && (
            <TabsTrigger value="org" className="text-xs px-3 gap-1.5"><Building2 className="w-3.5 h-3.5" />Organisation</TabsTrigger>
          )}
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          {role === 'mother' && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">My care profile</CardTitle>
                <DataSourceBadge source={source} loading={profileLoading} />
              </CardHeader>
              <CardContent>
                {profileLoading && !motherProfile ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : motherProfile ? (
                  <MotherProfileHeader
                    patient={motherProfile}
                    appointments={appointments}
                    canEdit={canEdit}
                    onSave={updateProfile}
                    variant="settings"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Could not load your care profile.</p>
                )}
              </CardContent>
            </Card>
          )}

          {role === 'mother' && motherProfile && !isPostpartum && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Baby className="w-4 h-4 text-primary" /> Childbirth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">I have delivered my baby</p>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                      Turn this on when you have given birth. You will be redirected to Baby Care to enter your newborn&apos;s details and your education will switch to baby&apos;s first year (0–52 weeks).
                    </p>
                  </div>
                  <Switch
                    checked={isPostpartum}
                    disabled={markingDelivered || !canEdit}
                    onCheckedChange={handleChildbirthToggle}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {role === 'mother' && isPostpartum && (
            <Card className="border-[hsl(142_63%_55%)] bg-[hsl(142_63%_97%)]">
              <CardContent className="pt-5 pb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Postpartum care active</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your care program covers newborn education through baby&apos;s first year.</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={() => navigate('/dashboard/baby-care')}>
                  Baby Care
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="text-base font-bold bg-secondary text-primary">{currentUser.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                  <Badge variant="outline" className="text-xs capitalize mt-1">{currentUser.label}</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-normal text-muted-foreground">Full name</Label>
                  <Input defaultValue={currentUser.name} disabled className="mt-1.5 h-9 bg-muted" />
                  <p className="text-[11px] text-muted-foreground mt-1">Tied to your login — contact admin to change.</p>
                </div>
                <div>
                  <Label className="text-sm font-normal text-muted-foreground">Email address</Label>
                  <Input defaultValue={currentUser.email} disabled className="mt-1.5 h-9 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-normal text-muted-foreground">Role</Label>
                  <Input defaultValue={currentUser.label} disabled className="mt-1.5 h-9 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-normal text-muted-foreground">Language</Label>
                  <Input defaultValue="English" disabled className="mt-1.5 h-9 bg-muted" />
                </div>
              </div>
              <Button size="sm" className="h-9 gap-1.5" variant="outline" disabled>
                <Save className="w-3.5 h-3.5" /> Profile fields are read-only
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(notifications) as (keyof typeof notifications)[]).map(key => {
                const labels: Record<string, { label: string; desc: string }> = {
                  appointmentReminders: { label: 'Appointment reminders', desc: 'Receive reminders 24h and 1h before appointments.' },
                  medicationReminders: { label: 'Medication reminders', desc: 'Daily notifications for scheduled medications.' },
                  urgentAlerts: { label: 'Urgent clinical alerts', desc: 'Immediate notifications for high-priority patient events.' },
                  weeklyDigest: { label: 'Weekly care digest', desc: 'A weekly summary of care activity and adherence trends.' },
                  nurseMessages: { label: 'Nurse messages', desc: 'Notifications when a nurse sends you a message.' },
                  aiCareBriefs: { label: 'AI care briefs', desc: 'Alerts when a new care brief is generated and awaiting review.' },
                };
                const { label, desc } = labels[key];
                return (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{desc}</p>
                    </div>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={v => setNotifications(prev => ({ ...prev, [key]: v }))}
                    />
                  </div>
                );
              })}
              <Separator />
              <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
                <Save className="w-3.5 h-3.5" /> Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Password &amp; Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-normal text-muted-foreground">Current password</Label>
                <Input type="password" placeholder="••••••••" className="mt-1.5 h-9" />
              </div>
              <div>
                <Label className="text-sm font-normal text-muted-foreground">New password</Label>
                <Input type="password" placeholder="••••••••" className="mt-1.5 h-9" />
              </div>
              <div>
                <Label className="text-sm font-normal text-muted-foreground">Confirm new password</Label>
                <Input type="password" placeholder="••••••••" className="mt-1.5 h-9" />
              </div>
              <Button size="sm" className="h-9 gap-1.5" onClick={() => toast.success('Password updated')}>
                <Save className="w-3.5 h-3.5" /> Update password
              </Button>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
                </div>
                <Switch defaultChecked={false} onCheckedChange={v => toast.info(v ? '2FA enabled' : '2FA disabled')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organisation (admin only) */}
        {role === 'admin' && (
          <TabsContent value="org" className="mt-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Organisation Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Organisation name</Label>
                    <Input defaultValue="Elara Women's Specialist Clinic" className="mt-1.5 h-9" />
                  </div>
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Short name</Label>
                    <Input defaultValue="Elara WSC" className="mt-1.5 h-9" />
                  </div>
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Location</Label>
                    <Input defaultValue="Lagos, Nigeria" className="mt-1.5 h-9" />
                  </div>
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Contact email</Label>
                    <Input defaultValue="admin@elara-wsc.ng" className="mt-1.5 h-9" />
                  </div>
                </div>
                <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
                  <Save className="w-3.5 h-3.5" /> Save organisation settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
