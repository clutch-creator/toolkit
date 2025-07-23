import { cloneChildren } from '../../utils/helpers.js';

type SlotProps = {
  children: React.ReactNode;
  [key: string]: unknown; // Allow any additional props
};

export function Slot({ children, ...props }: SlotProps) {
  return cloneChildren(children, props);
}
