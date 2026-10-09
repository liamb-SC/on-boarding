// Added by `npx shadcn init`. cn() joins class names and lets later Tailwind
// classes win over earlier ones: cn('px-2 bg-red-500', 'bg-blue-500')
// gives 'px-2 bg-blue-500'.
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
