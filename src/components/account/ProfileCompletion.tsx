import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, UserCheck } from 'lucide-react';

interface ProfileCompletionProps {
  profile: any;
  avatarUrl: string | null;
  addressCount: number;
  orderCount: number;
}

export function ProfileCompletion({ profile, avatarUrl, addressCount, orderCount }: ProfileCompletionProps) {
  const { percentage, completedSteps, steps } = useMemo(() => {
    const steps = [
      { label: 'Add your name', done: !!profile?.full_name },
      { label: 'Upload a photo', done: !!avatarUrl },
      { label: 'Add phone number', done: !!profile?.phone },
      { label: 'Add date of birth', done: !!profile?.date_of_birth },
      { label: 'Save an address', done: addressCount > 0 },
      { label: 'Place first order', done: orderCount > 0 },
    ];
    const completedSteps = steps.filter(s => s.done).length;
    const percentage = Math.round((completedSteps / steps.length) * 100);
    return { percentage, completedSteps, steps };
  }, [profile, avatarUrl, addressCount, orderCount]);

  if (percentage === 100) return null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Profile Completion</span>
        </div>
        <span className="text-sm font-bold text-primary">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-1.5 text-xs">
            {step.done ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={step.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
