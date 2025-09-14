import React from 'react';
import Link from 'next/link';

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
}

interface NavigationMenuProps {
  items: NavigationItem[];
  currentPath: string;
  className?: string;
  itemClassName?: string;
  linkClassName?: string;
  activeClassName?: string;
  onItemClick?: (item: NavigationItem) => void;
  isMobile?: boolean;
}

/**
 * Reusable navigation menu component
 * Used by both desktop and mobile navigation variants
 */
export default function NavigationMenu({
  items,
  currentPath,
  className = '',
  itemClassName = '',
  linkClassName = '',
  activeClassName = '',
  onItemClick,
  isMobile = false,
}: NavigationMenuProps): React.JSX.Element {
  const handleItemClick = (item: NavigationItem): void => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const getItemClass = (isMobile: boolean): string => {
    const baseClass = isMobile
      ? 'mobile-menu__item'
      : 'responsive-navigation__item';
    return `${baseClass} ${itemClassName}`.trim();
  };

  const getLinkClass = (href: string, isMobile: boolean): string => {
    const isActive = currentPath === href;
    const baseClass = isMobile
      ? 'mobile-menu__link'
      : 'responsive-navigation__link';
    const activeClass = isMobile
      ? 'mobile-menu__link--active'
      : 'responsive-navigation__link--active';

    let classes = `${baseClass} touch-target ${linkClassName}`;

    if (isActive) {
      classes += ` ${activeClass} ${activeClassName}`;
    }

    return classes.trim();
  };

  const getIconClass = (isMobile: boolean): string => {
    return isMobile ? 'mobile-menu__icon' : 'responsive-navigation__icon';
  };

  const menuClass = isMobile
    ? `mobile-menu__list ${className}`
    : `responsive-navigation__menu ${className}`;

  // For mobile, use ul/li structure; for desktop, use div structure
  if (isMobile) {
    return (
      <ul className={menuClass.trim()}>
        {items.map(item => (
          <li key={item.href} className={getItemClass(true)}>
            <Link
              href={item.href}
              className={getLinkClass(item.href, true)}
              onClick={() => handleItemClick(item)}
              aria-current={currentPath === item.href ? 'page' : undefined}
            >
              {item.icon && (
                <span className={getIconClass(true)} aria-hidden='true'>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  // Desktop navigation
  return (
    <div className={menuClass.trim()}>
      {items.map(item => (
        <div key={item.href} className={getItemClass(false)}>
          <Link
            href={item.href}
            className={getLinkClass(item.href, false)}
            onClick={() => handleItemClick(item)}
            aria-current={currentPath === item.href ? 'page' : undefined}
          >
            {item.icon && (
              <span className={getIconClass(false)} aria-hidden='true'>
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </Link>
        </div>
      ))}
    </div>
  );
}
