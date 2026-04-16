/**
 * CategoryIcon — Renders a professional SVG icon for product categories
 * with auto-generated SEO alt text.
 * 
 * Auto-Alt Examples:
 *   "Integrated Circuits - Electronic Components Catalog"
 *   "Capacitors - Electronic Components Catalog"
 * 
 * Usage:
 *   <CategoryIcon slug="integrated-circuits" size={48} />
 *   <CategoryIcon slug="capacitors" size={32} variant="badge" label="Capacitors" />
 */

import { getCategoryVisual, getComponentSvg, generateCategoryAlt } from '@/lib/component-images';

export default function CategoryIcon({
  slug,
  size = 48,
  variant = 'default', // 'default' | 'badge' | 'card'
  label = '',
  className = '',
  style = {},
}) {
  const visual = getCategoryVisual(slug);
  const svgData = getComponentSvg(visual.svg);
  const altText = label ? generateCategoryAlt(label) : generateCategoryAlt(slug);

  if (variant === 'badge') {
    return (
      <span
        className={className}
        role="img"
        aria-label={altText}
        title={label || slug}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: size, height: size, borderRadius: '8px',
          background: `${visual.color}12`, flexShrink: 0,
          ...style,
        }}
      >
        <svg
          width={size * 0.55} height={size * 0.55}
          viewBox={svgData.viewBox}
          style={{ color: visual.color }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: svgData.paths }}
        />
      </span>
    );
  }

  // Card variant — larger with background gradient
  if (variant === 'card') {
    return (
      <div
        className={`category-icon-card ${className}`}
        role="img"
        aria-label={altText}
        title={label || slug}
        style={{
          width: size, height: size,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${visual.color}10 0%, ${visual.color}20 100%)`,
          border: `1px solid ${visual.color}18`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          ...style,
        }}
      >
        <svg
          width={size * 0.5} height={size * 0.5}
          viewBox={svgData.viewBox}
          style={{ color: visual.color }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: svgData.paths }}
        />
      </div>
    );
  }

  // Default — simple icon
  return (
    <div
      className={className}
      role="img"
      aria-label={altText}
      title={label || slug}
      style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        width={size * 0.7} height={size * 0.7}
        viewBox={svgData.viewBox}
        style={{ color: visual.color }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgData.paths }}
      />
    </div>
  );
}
