export type StockIconName =
  | 'globe'
  | 'map'
  | 'chart'
  | 'clock'
  | 'shield'
  | 'users'
  | 'camera'
  | 'search'
  | 'filter'
  | 'upload'
  | 'cloud'
  | 'pin'
  | 'eye'
  | 'lab'
  | 'document'
  | 'refresh'
  | 'grid'
  | 'target'
  | 'close';

const ICONS: Record<StockIconName, string> = {
  globe: '/icons/globe-alt.svg',
  map: '/icons/map.svg',
  chart: '/icons/chart-bar.svg',
  clock: '/icons/clock.svg',
  shield: '/icons/shield-check.svg',
  users: '/icons/users.svg',
  camera: '/icons/camera.svg',
  search: '/icons/magnifying-glass.svg',
  filter: '/icons/funnel.svg',
  upload: '/icons/cloud-arrow-up.svg',
  cloud: '/icons/cloud.svg',
  pin: '/icons/map-pin.svg',
  eye: '/icons/eye.svg',
  lab: '/icons/beaker.svg',
  document: '/icons/document-text.svg',
  refresh: '/icons/arrow-path.svg',
  grid: '/icons/squares-2x2.svg',
  target: '/icons/cursor-arrow-rays.svg',
  close: '/icons/x-mark.svg',
};

interface StockIconProps {
  name: StockIconName;
  className?: string;
}

export function StockIcon({ name, className = 'w-5 h-5' }: StockIconProps) {
  return (
    <img
      src={ICONS[name]}
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
    />
  );
}
