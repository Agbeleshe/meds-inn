import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import type { Role } from "@/types/clinical";
import { useAuth } from "@/contexts/AuthContext";
import { defaultDashboardPath } from "@/lib/route-access";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { HospitalSelect } from "@/components/auth/HospitalSelect";
import { Logo } from "@/components/common/Logo";
import { BackToHomeLink } from "@/components/auth/BackToHomeLink";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Stethoscope,
  Baby,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Variants } from "framer-motion";

type Path = "professional" | "mother";
type Step = "path" | "pro-role" | "credentials";
type ProRole = "admin" | "nurse" | "doctor";

const PRO_ROLES: {
  id: ProRole;
  label: string;
  desc: string;
  icon: React.ReactNode;
  demoName: string;
}[] = [
  {
    id: "admin",
    label: "Hospital Admin",
    desc: "Manage programmes, enrolment, and team assignments.",
    icon: <ShieldCheck className="w-5 h-5" />,
    demoName: "Diana Harrington",
  },
  {
    id: "nurse",
    label: "Nurse / Midwife",
    desc: "Follow up between visits and track adherence.",
    icon: <Stethoscope className="w-5 h-5" />,
    demoName: "Elena Costa",
  },
  {
    id: "doctor",
    label: "Doctor",
    desc: "Review patients, video consults, and care plans.",
    icon: <UserRound className="w-5 h-5" />,
    demoName: "Priya Sharma",
  },
];

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

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("path");
  const [path, setPath] = useState<Path | null>(null);
  const [proRole, setProRole] = useState<ProRole>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("demo123");
  const [hospitalId, setHospitalId] = useState(ACTIVE_HOSPITAL_ID);
  const [submitting, setSubmitting] = useState(false);

  function selectProRole(r: ProRole) {
    setProRole(r);
    const match = PRO_ROLES.find((x) => x.id === r);
    if (match) setUsername(match.demoName);
  }

  async function handleSignIn() {
    if (!username.trim() || !password) {
      toast.error("Enter your name and password");
      return;
    }

    const role: Role = path === "mother" ? "mother" : proRole;
    setSubmitting(true);
    const { error, user: profile } = await signIn({
      username: username.trim(),
      password,
      role,
      hospitalId,
    });
    setSubmitting(false);

    if (error) {
      const msg = error.message || "Sign in failed";
      toast.error(
        msg.includes("Invalid credentials")
          ? `${msg} — use the pre-filled demo name, role, Elara hospital, password demo123`
          : msg,
      );
      return;
    }

    navigate(defaultDashboardPath(role, profile?.onboardingComplete));
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
                <h1 className="text-2xl font-bold mb-2">Sign in to Meds-inn</h1>
                <p className="text-sm text-muted-foreground">
                  Choose your role, then sign in with your name and password.
                </p>
              </div>
              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPath("professional");
                    selectProRole("admin");
                    setStep("pro-role");
                  }}
                  className="w-full text-left rounded-2xl border-2 border-border bg-card p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Stethoscope className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold">Medical professional</p>
                      <p className="text-sm text-muted-foreground">Admin, nurse, or doctor</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPath("mother");
                    setUsername("Sofia Marchetti");
                    setHospitalId(ACTIVE_HOSPITAL_ID);
                    setStep("credentials");
                  }}
                  className="w-full text-left rounded-2xl border-2 border-border bg-card p-6 hover:border-[hsl(142_63%_35%)]/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Baby className="w-6 h-6 text-[hsl(142_63%_35%)] shrink-0" />
                    <div>
                      <p className="font-semibold">Expecting or new mother</p>
                      <p className="text-sm text-muted-foreground">Patient / mother account</p>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-8">
                New here?{" "}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Create an account
                </Link>
              </p>
            </motion.div>
          )}

          {step === "pro-role" && (
            <motion.div key="pro-role" variants={slideIn} initial="hidden" animate="visible" exit="exit">
              <AuthHeader onBack={() => setStep("path")} />
              <h1 className="text-xl font-bold text-center mb-6">What is your role?</h1>
              <div className="space-y-3 mb-6">
                {PRO_ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectProRole(r.id)}
                    className={cn(
                      "w-full text-left rounded-xl border-2 p-4 transition-all",
                      proRole === r.id ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", proRole === r.id ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {r.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                      {proRole === r.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={() => setStep("credentials")}>
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === "credentials" && (
            <motion.div key="credentials" variants={slideIn} initial="hidden" animate="visible" exit="exit">
              <AuthHeader
                onBack={() => setStep(path === "mother" ? "path" : "pro-role")}
              />
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold">Sign in</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {path === "mother"
                    ? "Use your full name as username"
                    : `${PRO_ROLES.find((r) => r.id === proRole)?.label} at your hospital`}
                </p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Full name (username)</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Diana Harrington"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Password</Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                  />
                </div>
                <HospitalSelect
                  value={hospitalId}
                  onChange={setHospitalId}
                  label={path === "mother" ? "Your enrolled hospital" : "Your hospital"}
                />
              </div>
              <Button className="w-full gap-2 mb-3" onClick={handleSignIn} disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Demo: Diana Harrington / Elena Costa / Priya Sharma / Sofia Marchetti / Yuki Tanaka — password{" "}
                <code className="text-foreground">demo123</code>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
