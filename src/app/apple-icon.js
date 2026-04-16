import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FF6B00, #FF8533)',
          // Apple icons typically ignore border-radius (it applies its own mask)
          // but we can add a slight padding or background to ensure safe area.
        }}
      >
        <div style={{ color: 'white', fontSize: 360, fontWeight: 900, fontFamily: 'sans-serif' }}>
          F
        </div>
      </div>
    ),
    { ...size }
  );
}
