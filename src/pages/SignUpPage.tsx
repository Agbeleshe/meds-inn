import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { HospitalSelect } from "@/components/auth/HospitalSelect";
import { Logo } from "@/components/common/Logo";
import { BackToHomeLink } from "@/components/auth/BackToHomeLink";
import { joinHospitalWaitlist } from "@/lib/api-client";
import {
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  Baby,
  Building2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";

type Path = "professional" | "mother";
type Step = "path" | "hospital-waitlist" | "mother-form";

const slideIn: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

function AuthHeader({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-8 relative">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <div className="mx-auto">
        <Logo size="lg" className="justify-center" />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const { signUpMother } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("path");
  const [submitting, setSubmitting] = useState(false);

  // Hospital waitlist
  const [waitlistEmail, setWaitlistEmail] = useState("");

  // Mother signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [careStage, setCareStage] = useState<"pregnant" | "postpartum">("pregnant");
  const [gestationalWeeks, setGestationalWeeks] = useState("12");
  const [babyWeeks, setBabyWeeks] = useState("8");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [hospitalId, setHospitalId] = useState(ACTIVE_HOSPITAL_ID);

  async function handleWaitlist() {
    if (!waitlistEmail.trim()) {
      toast.error("Enter your email address");
      return;
    }
    setSubmitting(true);
    try {
      const result = await joinHospitalWaitlist(waitlistEmail.trim());
      toast.success(result.message);
      setWaitlistEmail("");
      setStep("path");
    } catch (error) {
      toast.error((error as Error).message || "Could not join waitlist");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMotherSignup() {
    if (!firstName.trim() || !lastName.trim() || !password) {
      toast.error("First name, last name, and password are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    const { error } = await signUpMother({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
      hospitalId,
      careStage,
      gestationalWeeks: careStage === "pregnant" ? Number(gestationalWeeks) : undefined,
      babyWeeks: careStage === "postpartum" ? Number(babyWeeks) : undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account created — let's finish your care profile.");
    navigate("/dashboard/onboarding", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BackToHomeLink className="mb-6" />
        <AnimatePresence mode="wait">
          {step === "path" && (
            <motion.div key="path" variants={slideIn} initial="hidden" animate="visible" exit="exit">
              <AuthHeader />
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Create an account</h1>
                <p className="text-sm text-muted-foreground">
                  Join as a mother, or register interest for your hospital.
                </p>
              </div>
              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => setStep("hospital-waitlist")}
                  className="w-full text-left rounded-2xl border-2 border-border bg-card p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold">Medical institution</p>
                      <p className="text-sm text-muted-foreground">Hospital or clinic partnership</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStep("mother-form")}
                  className="w-full text-left rounded-2xl border-2 border-border bg-card p-6 hover:border-[hsl(142_63%_35%)]/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Baby className="w-6 h-6 text-[hsl(142_63%_35%)] shrink-0" />
                    <div>
                      <p className="font-semibold">Expecting or new mother</p>
                      <p className="text-sm text-muted-foreground">Create your patient account</p>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-8">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {step === "hospital-waitlist" && (
            <motion.div key="waitlist" variants={slideIn} initial="hidden" animate="visible" exit="exit">
              <AuthHeader onBack={() => setStep("path")} />
              <div className="rounded-xl border border-border bg-muted/40 p-5 mb-6">
                <Stethoscope className="w-8 h-8 text-primary mb-3" />
                <h1 className="text-lg font-bold mb-2">Hospital onboarding paused</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sorry — we are not signing up new hospitals at the moment. Leave your email and we will notify you when Meds-inn begins onboarding medical institutions.
                </p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Work email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="pl-9"
                      placeholder="you@hospital.org"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>
              <Button className="w-full gap-2" onClick={handleWaitlist} disabled={submitting}>
                {submitting ? "Saving…" : "Notify me"}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </Button>
            </motion.div>
          )}

          {step === "mother-form" && (
            <motion.div key="mother" variants={slideIn} initial="hidden" animate="visible" exit="exit">
              <AuthHeader onBack={() => setStep("path")} />
              <h1 className="text-xl font-bold text-center mb-6">Your care account</h1>
              <div className="space-y-4 mb-6 max-h-[55vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <HospitalSelect value={hospitalId} onChange={setHospitalId} />
                <div>
                  <Label className="text-sm font-normal mb-2 block">Where are you in your journey?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["pregnant", "postpartum"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCareStage(s)}
                        className={cn(
                          "rounded-xl border-2 py-3 px-3 text-sm font-medium transition-all",
                          careStage === s
                            ? "border-[hsl(142_63%_35%)] bg-[hsl(142_63%_35%)]/10"
                            : "border-border",
                        )}
                      >
                        {s === "pregnant" ? "Pregnant" : "Postpartum"}
                      </button>
                    ))}
                  </div>
                </div>
                {careStage === "pregnant" ? (
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
                  <Label className="text-sm font-normal mb-1.5 block">Phone (optional)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 …" />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Email (optional)</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="For appointment reminders"
                  />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Anything we should know? (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergies, concerns, previous complications…"
                  />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Password</Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your full name will be your username when signing in.
                  </p>
                </div>
              </div>
              <Button
                className="w-full gap-2 bg-[hsl(142_63%_35%)] hover:bg-[hsl(142_63%_30%)] text-white"
                onClick={handleMotherSignup}
                disabled={submitting}
              >
                {submitting ? "Creating account…" : "Create account"}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
