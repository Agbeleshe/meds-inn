import { useState, useRef, useEffect, useCallback } from "react";
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

/** Map of field name → which step it belongs to */
const FIELD_STEP: Record<string, Step> = {
  age: "personal",
  phone: "personal",
  email: "personal",
  bloodGroup: "clinical",
  allergies: "clinical",
  emergencyContact: "clinical",
};

/** Human-readable labels for each field */
const FIELD_LABELS: Record<string, string> = {
  age: "Age",
  phone: "Mobile phone",
  email: "Email",
  bloodGroup: "Blood group",
  allergies: "Allergies",
  emergencyContact: "Emergency contact",
};

/** Standalone field wrapper — defined OUTSIDE the component to prevent
 *  re-mounting inputs (and losing focus) on every keystroke. */
function FieldWrapper({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-normal mb-1.5 block">{label}</Label>
      <div className={cn(error && "[&>input]:border-destructive [&>input]:ring-destructive/20 [&>input]:ring-2")}>
        {children}
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}

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

  // ── Per-field error state ──
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Refs for focusing invalid fields after step transition
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /** Clear a specific field error when the user starts typing */
  const clearError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /** Focus the first errored field on the current step whenever step changes */
  useEffect(() => {
    const firstError = Object.keys(fieldErrors).find(
      (f) => FIELD_STEP[f] === step,
    );
    if (firstError && fieldRefs.current[firstError]) {
      // Small delay to wait for AnimatePresence exit/enter
      const timer = setTimeout(() => {
        fieldRefs.current[firstError]?.focus();
        fieldRefs.current[firstError]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [step, fieldErrors]);

  /** Validate all required fields. Returns true if valid. */
  function validateAll(): boolean {
    const values: Record<string, string> = {
      age,
      phone,
      email,
      bloodGroup,
      allergies,
      emergencyContact,
    };

    const errors: Record<string, string> = {};
    for (const [field, value] of Object.entries(values)) {
      if (!value.trim()) {
        errors[field] = `Please fill the required ${FIELD_LABELS[field]} field`;
      }
    }

    // Age-specific validation: must be 18+
    if (age.trim() && Number(age) < 18) {
      errors.age = "You must be at least 18 years old to use Meds-inn";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Find the first error's step and navigate there
      const firstErrorField = Object.keys(errors)[0];
      const targetStep = FIELD_STEP[firstErrorField];

      if (targetStep !== step) {
        setStep(targetStep);
      }

      toast.error(
        `Missing required field: ${FIELD_LABELS[firstErrorField]}`,
      );
      return false;
    }

    return true;
  }

  /** Validate fields for the current step before proceeding */
  function validateStep(currentStep: Step): boolean {
    const stepFields = Object.entries(FIELD_STEP)
      .filter(([, s]) => s === currentStep)
      .map(([f]) => f);

    const values: Record<string, string> = {
      age,
      phone,
      email,
      bloodGroup,
      allergies,
      emergencyContact,
    };

    const errors: Record<string, string> = {};
    for (const field of stepFields) {
      if (!values[field]?.trim()) {
        errors[field] = `Please fill the required ${FIELD_LABELS[field]} field`;
      }
    }

    // Age-specific validation: must be 18+
    if (currentStep === "personal" && age.trim() && Number(age) < 18) {
      errors.age = "You must be at least 18 years old to use Meds-inn";
    }

    // Merge with existing errors (clear old errors from this step, add new ones)
    setFieldErrors((prev) => {
      const cleaned = { ...prev };
      for (const field of stepFields) {
        delete cleaned[field];
      }
      return { ...cleaned, ...errors };
    });

    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      toast.error(
        `Missing required field: ${FIELD_LABELS[firstErrorField]}`,
      );

      // Focus the first error field
      setTimeout(() => {
        fieldRefs.current[firstErrorField]?.focus();
        fieldRefs.current[firstErrorField]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return false;
    }

    return true;
  }

  function goToStep(target: Step) {
    // Validate current step before advancing (but allow going back freely)
    const stepOrder: Step[] = ["personal", "clinical", "journey"];
    const currentIdx = stepOrder.indexOf(step);
    const targetIdx = stepOrder.indexOf(target);

    if (targetIdx > currentIdx) {
      if (!validateStep(step)) return;
    }
    setStep(target);
  }

  async function finish() {
    if (!validateAll()) return;

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
              <FieldWrapper name="age" label="Age" error={fieldErrors.age}>
                <Input
                  ref={(el) => { fieldRefs.current.age = el; }}
                  type="number"
                  min={18}
                  max={55}
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    clearError("age");
                  }}
                  placeholder="e.g. 29"
                />
              </FieldWrapper>
              <FieldWrapper name="phone" label="Mobile phone" error={fieldErrors.phone}>
                <Input
                  ref={(el) => { fieldRefs.current.phone = el; }}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError("phone");
                  }}
                  placeholder="+44 …"
                />
              </FieldWrapper>
              <FieldWrapper name="email" label="Email" error={fieldErrors.email}>
                <Input
                  ref={(el) => { fieldRefs.current.email = el; }}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  placeholder="you@email.com"
                />
              </FieldWrapper>
              <Button className="w-full gap-2" onClick={() => goToStep("clinical")}>
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
              <FieldWrapper name="bloodGroup" label="Blood group" error={fieldErrors.bloodGroup}>
                <Input
                  ref={(el) => { fieldRefs.current.bloodGroup = el; }}
                  value={bloodGroup}
                  onChange={(e) => {
                    setBloodGroup(e.target.value);
                    clearError("bloodGroup");
                  }}
                  placeholder="e.g. O+"
                />
              </FieldWrapper>
              <FieldWrapper name="allergies" label="Allergies" error={fieldErrors.allergies}>
                <Input
                  ref={(el) => { fieldRefs.current.allergies = el; }}
                  value={allergies}
                  onChange={(e) => {
                    setAllergies(e.target.value);
                    clearError("allergies");
                  }}
                  placeholder="None or list allergies"
                />
              </FieldWrapper>
              <FieldWrapper name="emergencyContact" label="Emergency contact" error={fieldErrors.emergencyContact}>
                <Input
                  ref={(el) => { fieldRefs.current.emergencyContact = el; }}
                  value={emergencyContact}
                  onChange={(e) => {
                    setEmergencyContact(e.target.value);
                    clearError("emergencyContact");
                  }}
                  placeholder="Name and phone"
                />
              </FieldWrapper>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setStep("personal")}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={() => goToStep("journey")}>
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

