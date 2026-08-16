import type { DisplayStage } from '@/components/ui/OrderStepper';

export const STATUS_LABELS: Record<DisplayStage, string> = {
  placed: 'Placed',
  pending: 'Pending',
  in_progress: 'In Production',
  completed: 'Completed',
};

export const STATUS_COLORS: Record<DisplayStage, string> = {
  placed: '#6B6F8C',
  pending: '#A87A2A',
  in_progress: '#2D5FA8',
  completed: '#2F6B2C',
};
