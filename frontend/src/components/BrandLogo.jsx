// Logo of Kombo (files in public/, generated from the original logo with a transparent background)
export default function BrandLogo({ variant = 'horizontal', className = 'brand-logo' }) {
  const src = variant === 'icon' ? '/logo-icon.png' : '/logo-horizontal.png';
  return <img src={src} alt="Kombo" className={className} />;
}
