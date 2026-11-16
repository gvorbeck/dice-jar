import { cn } from '@dice-jar/cn';
import { isValidElement } from 'react';
import { Text } from '../Text/Text';
import './List.css';

type ListVariant = 'bullet' | 'numbered' | 'ellipses';

interface ListProps {
  variant: ListVariant;
  items: React.ReactNode[];
  keyPrefix?: string;
  className?: string;
}

// Derive a stable text fingerprint from a ReactNode so list keys survive
// removal/reordering of a middle item. Strings return themselves; elements
// recurse into their children; anything text-free (e.g. a bare element with
// no string descendants) returns '' and the index alone disambiguates.
const itemFingerprint = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(itemFingerprint).join('|');
  if (isValidElement(node)) {
    const { children } = node.props as { children?: React.ReactNode };
    return itemFingerprint(children);
  }
  return '';
};

export const List = ({ variant, items, keyPrefix, className }: ListProps) => {
  const Tag = variant === 'numbered' ? 'ol' : 'ul';
  const cx = cn('list-list', `list-${variant}`, className);
  const prefix = keyPrefix ?? `list-item-${variant}`;

  return (
    <Tag className={cx}>
      {items.map((item, i) => {
        const isStringItem = typeof item === 'string';
        return (
          <li key={`${prefix}-${itemFingerprint(item)}-${i}`} className="list-item">
            {isStringItem ? (
              <Text as="span" font="serif" leading="tight">
                {item}
              </Text>
            ) : (
              item
            )}
          </li>
        );
      })}
    </Tag>
  );
};
