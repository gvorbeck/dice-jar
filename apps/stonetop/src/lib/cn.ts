// Joins the class names that are set, dropping false/undefined; replaces the clsx dependency (strings only, no objects/arrays).
export const cn = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ');
