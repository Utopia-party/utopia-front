import type { LucideIcon } from 'lucide-react';

export type InstructionStep = {
  title: string;
  description: string;
  icon?: LucideIcon;
  details?: string[];
};

export type InstructionStepsProps = {
  steps: InstructionStep[];
};

export default function InstructionSteps({ steps }: InstructionStepsProps) {
  return (
    <ol className="grid gap-4">
      {steps.map((step, index) => {
        const Icon = step.icon;

        return (
          <li
            key={`${step.title}-${index}`}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4 text-blue-600" />}
                  <h3 className="font-black text-slate-950">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
                {step.details && step.details.length > 0 && (
                  <ul className="mt-3 grid gap-2">
                    {step.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex gap-2 text-sm leading-6 text-slate-500"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
