export function GridBackground() {
  return (
    <div className="absolute top-0 left-0 right-0 h-[800px] z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(39, 39, 42, 0.5) 1px, transparent 1px), linear-gradient(180deg, rgba(39, 39, 42, 0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'linear-gradient(to bottom, black 0%, black 400px, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 0%, black 400px, transparent 100%)',
        }}
      />
    </div>
  );
}
