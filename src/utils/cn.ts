import classNames, { type ArgumentArray } from "classnames";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using `classnames` and resolves Tailwind CSS class conflicts with `tailwind-merge`.
 *
 * @example
 * cn("px-2 py-1", isPrimary && "bg-blue-500", { "text-white": true })
 */
export function cn(...inputs: ArgumentArray): string {
  return twMerge(classNames(...inputs));
}

export { classNames };
export default cn;
