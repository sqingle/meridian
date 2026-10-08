export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M2 6.5 13 14 2 21.5V6.5Z" fill="#e8f7ff" />
      <path d="M26 6.5 15 14l11 7.5V6.5Z" fill="#2fd8e8" />
    </svg>
  );
}
