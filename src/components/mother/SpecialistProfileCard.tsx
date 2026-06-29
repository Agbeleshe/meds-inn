import React from 'react';
import { Link } from 'react-router-dom';
import type { SpecialistProfile } from '@/lib/specialist-profiles';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Award, Globe, Stethoscope } from 'lucide-react';

interface SpecialistProfileCardProps {
  profile: SpecialistProfile;
}

export function SpecialistProfileCard({ profile }: SpecialistProfileCardProps) {
  const roleLabel = profile.role === 'nurse' ? 'Your nurse / midwife' : 'Your doctor';
  const messagesHref = `/dashboard/messages?specialist=${encodeURIComponent(profile.userId)}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-44 shrink-0 bg-secondary/50 flex items-center justify-center p-6 sm:p-4">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-md">
              <AvatarImage src={profile.photoUrl} alt={profile.name} className="object-cover" />
              <AvatarFallback className="text-lg font-semibold">{profile.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 p-5 sm:p-6 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{roleLabel}</p>
              <h2 className="text-lg font-bold text-foreground mt-0.5">{profile.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">{profile.specialty}</Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Award className="w-3 h-3" /> {profile.credentials}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="font-medium">{profile.age} years</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="font-medium">{profile.yearsExperience} years</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Languages: {profile.languages.join(', ')}</span>
            </div>

            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
              <Link to={messagesHref}>
                <MessageSquare className="w-3.5 h-3.5" /> Send a message
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SpecialistTeamIntro() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-secondary/40 px-4 py-3">
      <Stethoscope className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground">
        Your dedicated care team knows your history and is here for questions between appointments.
        Profiles are verified hospital staff at your maternity centre.
      </p>
    </div>
  );
}
