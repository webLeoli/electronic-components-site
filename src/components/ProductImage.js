/**
 * ProductImage — Renders a product photo or a professional SVG illustration.
 * 
 * If the product has an imageUrl, renders an <img> tag with auto-generated
 * SEO alt text. Otherwise, generates a contextual component illustration
 * based on part number, category, and description.
 * 
 * Auto-Alt Examples:
 *   "STM32F103C8T6 STMicroelectronics ARM Cortex-M3 MCU 72MHz - In Stock"
 *   "IRF540N Infineon N-Channel Power MOSFET - Buy Online"
 * 
 * Usage:
 *   <ProductImage product={product} size={200} />
 *   <ProductImage product={product} size={64} variant="thumbnail" />
 *   <ProductImage product={product} size={200} alt="Custom alt override" />
 */

import {
  getProductVisualType,
  getComponentSvg,
  generateProductAlt,
} from '@/lib/component-images';

export default function ProductImage({
  product,
  size = 200,
  variant = 'default', // 'default' | 'thumbnail' | 'card'
  alt, // optional override; if omitted, auto-generated
  className = '',
  style = {},
}) {
  // Auto-generate alt text if not provided
  const altText = alt || generateProductAlt(product);

  // If product has a real image, use it
  if (product?.imageUrl) {
    return (
      <div
        className={`product-image-wrapper ${className}`}
        style={{
          width: size, height: size,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', borderRadius: variant === 'thumbnail' ? '6px' : '12px',
          background: 'var(--color-bg-secondary)',
          ...style,
        }}
      >
        <img
          src={product.imageUrl}
          alt={altText}
          width={size}
          height={size}
          style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
          loading="lazy"
        />
      </div>
    );
  }

  // Generate SVG illustration
  const visual = getProductVisualType(product);
  const svgData = getComponentSvg(visual.svg);
  const iconSize = variant === 'thumbnail' ? size * 0.55 : size * 0.45;

  return (
    <div
      className={`product-image-wrapper product-image-generated ${className}`}
      role="img"
      aria-label={altText}
      title={altText}
      style={{
        width: size, height: size,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        borderRadius: variant === 'thumbnail' ? '6px' : '12px',
        background: `linear-gradient(135deg, ${visual.color}08 0%, ${visual.color}15 100%)`,
        border: `1px solid ${visual.color}20`,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Circuit board pattern background */}
      {variant !== 'thumbnail' && (
        <svg
          width={size} height={size}
          viewBox="0 0 200 200"
          style={{ position: 'absolute', top: 0, left: 0, opacity: 0.04 }}
          aria-hidden="true"
        >
          <pattern id={`pcb-${product?.partNumber || 'def'}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill={visual.color} />
            <line x1="10" y1="0" x2="10" y2="20" stroke={visual.color} strokeWidth="0.3" />
            <line x1="0" y1="10" x2="20" y2="10" stroke={visual.color} strokeWidth="0.3" />
          </pattern>
          <rect width="200" height="200" fill={`url(#pcb-${product?.partNumber || 'def'})`} />
        </svg>
      )}

      {/* Component SVG */}
      <svg
        width={iconSize} height={iconSize}
        viewBox={svgData.viewBox}
        style={{ color: visual.color, position: 'relative', zIndex: 1 }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgData.paths }}
      />

      {/* Part number label (for larger sizes) */}
      {variant === 'default' && size >= 120 && (
        <div style={{
          position: 'relative', zIndex: 1,
          marginTop: '8px',
          fontSize: Math.max(10, Math.min(13, size * 0.065)),
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color: visual.color,
          opacity: 0.6,
          maxWidth: size * 0.85,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {product?.partNumber}
        </div>
      )}

      {/* Manufacturer label */}
      {variant === 'default' && size >= 150 && product?.manufacturer && (
        <div style={{
          position: 'relative', zIndex: 1,
          fontSize: Math.max(9, size * 0.05),
          color: visual.color,
          opacity: 0.35,
          marginTop: '2px',
          fontWeight: 600,
        }}>
          {product.manufacturer}
        </div>
      )}
    </div>
  );
}

/**
 * Compact product placeholder for tables, lists — just the icon
 */
export function ProductIcon({ product, size = 32, style = {} }) {
  const visual = getProductVisualType(product);
  const svgData = getComponentSvg(visual.svg);
  const altText = generateProductAlt(product);

  return (
    <div
      role="img"
      aria-label={altText}
      title={product?.partNumber || 'Component'}
      style={{
        width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '6px', background: `${visual.color}12`,
        flexShrink: 0, ...style,
      }}
    >
      <svg
        width={size * 0.6} height={size * 0.6}
        viewBox={svgData.viewBox}
        style={{ color: visual.color }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgData.paths }}
      />
    </div>
  );
}
