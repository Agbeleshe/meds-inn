import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyMotherProfile } from '@/hooks/use-mother';
import { getMotherSpecialists } from '@/lib/specialist-profiles';
import { isMotherAssigned } from '@/lib/assignments';
import { SpecialistRequestActions } from '@/components/mother/SpecialistRequestActions';
import { SpecialistProfileCard, SpecialistTeamIntro } from '@/components/mother/SpecialistProfileCard';
import { MedCardListSkeleton } from '@/components/common/TableSkeleton';

export default function MySpecialistPage() {
  const { user } = useAuth();
  const motherId = user?.motherId;
  const { data: profile, loading, refetch } = useMyMotherProfile(motherId);

  if (loading && !profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <MedCardListSkeleton count={2} />
      </div>
    );
  }

  if (!profile || !motherId) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Sign in as a mother to view your care team.
      </div>
    );
  }

  const { nurse, doctor } = getMotherSpecialists(profile);
  const assigned = isMotherAssigned(profile);
  const hasTeam = assigned && Boolean(nurse || doctor);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Specialist</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Meet the nurse and doctor assigned to your pregnancy care
        </p>
      </div>

      <SpecialistTeamIntro />

      {hasTeam && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Your care team</p>
          {nurse && <SpecialistProfileCard profile={nurse} />}
          {doctor && <SpecialistProfileCard profile={doctor} />}
        </div>
      )}

      <SpecialistRequestActions
        motherId={motherId}
        profile={profile}
        onSubmitted={refetch}
        variant="full"
      />
    </div>
  );
}
