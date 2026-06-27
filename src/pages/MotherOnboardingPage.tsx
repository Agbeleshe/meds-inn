import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding } from "@/lib/api-client";
import { ACTIVE_HOSPITAL } from "@/lib/hospitals";
import { BackToHomeLink } from "@/components/auth/BackToHomeLink";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Baby, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "personal" | "clinical" | "journey";

export default function MotherOnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("personal");
  const [submitting, setSubmitting] = useState(false);

  const careStage = user?.careStage ?? "pregnant";

  const [age, setAge] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("None");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [edd, setEdd] = useState("");
  const [gestationalWeeks, setGestationalWeeks] = useState(
    String(user?.gestationalWeeks ?? 12),
  );
  const [babyWeeks, setBabyWeeks] = useState(String(user?.babyWeeks ?? 8));
  const [concerns, setConcerns] = useState(user?.notes ?? "");

  async function finish() {
    if (!age || !phone || !email || !bloodGroup || !allergies || !emergencyContact) {
      toast.error("Please complete all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        age: Number(age),
        phone: phone.trim(),
        email: email.trim(),
        bloodGroup: bloodGroup.trim(),
        allergies: allergies.trim(),
        emergencyContact: emergencyContact.trim(),
        edd: edd.trim() || undefined,
        gestationalWeeks: careStage === "pregnant" ? Number(gestationalWeeks) : undefined,
        babyWeeks: careStage === "postpartum" ? Number(babyWeeks) : undefined,
        concerns: concerns.trim() || undefined,
        careStage,
      });
      await refreshUser();
      toast.success("Your care profile is ready — welcome to Meds-inn!");
      navigate("/dashboard/mother", { replace: true });
    } catch (error) {
      toast.error((error as Error).message || "Could not save your profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <BackToHomeLink className="mb-6" />
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold mb-2">Complete your care profile</h1>
          <p className="text-sm text-muted-foreground">
            A few details help {ACTIVE_HOSPITAL.shortName} personalise your care. This replaces demo
            placeholders with your real information.
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          {(["personal", "clinical", "journey"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                step === s || (["personal", "clinical", "journey"].indexOf(step) > i)
                  ? "bg-primary"
                  : "bg-muted",
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "personal" && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 mb-2">
                <Baby className="w-5 h-5 text-[hsl(142_63%_35%)] shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Hi {user?.firstName ?? user?.name?.split(" ")[0] ?? "there"} — tell us a bit about
                  yourself so your care team can reach you.
                </p>
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Age</Label>
                <Input type="number" min={13} max={55} value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 29" />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Mobile phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 …" />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              <Button className="w-full gap-2" onClick={() => setStep("clinical")}>
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === "clinical" && (
            <motion.div
              key="clinical"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 mb-2">
                <HeartPulse className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Clinical basics your nurse and doctor need before your first visit.
                </p>
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Blood group</Label>
                <Input value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="e.g. O+" />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Allergies</Label>
                <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="None or list allergies" />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Emergency contact</Label>
                <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Name and phone" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setStep("personal")}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setStep("journey")}>
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "journey" && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {careStage === "pregnant" ? (
                <>
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">Weeks pregnant</Label>
                    <Input
                      type="number"
                      min={1}
                      max={42}
                      value={gestationalWeeks}
                      onChange={(e) => setGestationalWeeks(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">Expected due date (EDD)</Label>
                    <Input type="date" value={edd} onChange={(e) => setEdd(e.target.value)} />
                  </div>
                </>
              ) : (
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Baby&apos;s age (weeks)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={babyWeeks}
                    onChange={(e) => setBabyWeeks(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Anything we should know?</Label>
                <Textarea
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  rows={3}
                  placeholder="Symptoms, previous complications, preferences…"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setStep("clinical")}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  className="flex-1 gap-2 bg-[hsl(142_63%_35%)] hover:bg-[hsl(142_63%_30%)] text-white"
                  onClick={finish}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Finish setup"}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
