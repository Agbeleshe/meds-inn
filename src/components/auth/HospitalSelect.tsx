import { ACTIVE_HOSPITAL, ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HospitalSelectProps {
  value: string;
  onChange: (hospitalId: string) => void;
  label?: string;
  id?: string;
}

export function HospitalSelect({
  value,
  onChange,
  label = "Hospital / Clinic",
  id = "hospital",
}: HospitalSelectProps) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-normal mb-1.5 block">
        {label}
      </Label>
      <Select
        value={ACTIVE_HOSPITAL_ID}
        onValueChange={(next) => {
          if (next === ACTIVE_HOSPITAL_ID) onChange(next);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select your hospital" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ACTIVE_HOSPITAL_ID}>
            {ACTIVE_HOSPITAL.name} — {ACTIVE_HOSPITAL.location}
          </SelectItem>
          <SelectSeparator />
          <SelectItem value="more-soon" disabled className="text-muted-foreground">
            Sorry — we only have one hospital partner for now. More institutions can be added later.
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        Meds-inn is currently live with {ACTIVE_HOSPITAL.shortName}. Additional hospital partners will be onboarded soon.
      </p>
    </div>
  );
}
