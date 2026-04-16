import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FPGACenter — Hard-to-Find & Obsolete Electronic Components';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#0B1426',
          padding: '60px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background circuit accent */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 60%, transparent 80%)',
          display: 'flex',
        }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FF6B00, #FF8533)',
            borderRadius: '16px',
          }}>
            <span style={{ color: 'white', fontSize: 44, fontWeight: 900, fontFamily: 'sans-serif', lineHeight: 1 }}>F</span>
          </div>
          <span style={{ color: '#E8EDF2', fontSize: 48, fontWeight: 900, fontFamily: 'sans-serif', letterSpacing: '-1px' }}>
            FPGA<span style={{ color: '#FF6B00' }}>Center</span>
          </span>
        </div>

        {/* Headline */}
        <div style={{
          color: '#FFFFFF',
          fontSize: 52,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          lineHeight: 1.15,
          maxWidth: '680px',
          marginBottom: '24px',
        }}>
          Hard-to-Find &amp; Obsolete{' '}
          <span style={{ color: '#3B82F6' }}>Electronic Components</span>
        </div>

        {/* Subtitle */}
        <div style={{
          color: '#94A3B8',
          fontSize: 24,
          fontFamily: 'sans-serif',
          maxWidth: '600px',
          marginBottom: '44px',
          lineHeight: 1.5,
        }}>
          Quality guaranteed · No minimum order · Fast global shipping
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '40px' }}>
          {[
            { value: '10K+', label: 'Part Numbers' },
            { value: '500+', label: 'Manufacturers' },
            { value: '60+', label: 'Countries' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#FF6B00', fontSize: 32, fontWeight: 800, fontFamily: 'sans-serif' }}>
                {stat.value}
              </span>
              <span style={{ color: '#64748B', fontSize: 16, fontFamily: 'sans-serif' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #FF6B00, #3B82F6, #FF6B00)',
          display: 'flex',
        }} />
      </div>
    ),
    { ...size }
  );
}
