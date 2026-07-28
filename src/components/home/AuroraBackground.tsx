export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="animate-aurora-1 bg-brand-pink/25 absolute -top-1/4 -left-1/4 h-[60%] w-[60%] rounded-full blur-[100px]" />
      <div className="animate-aurora-2 bg-brand-pink/20 absolute -right-1/4 top-1/3 h-[55%] w-[55%] rounded-full blur-[100px]" />
      <div className="animate-aurora-3 bg-brand-pink/15 absolute -bottom-1/4 left-1/3 h-[50%] w-[50%] rounded-full blur-[100px]" />
      {/* Brillo de marca muy sutil — no forma parte de los 3 blobs originales. */}
      <div className="animate-aurora-2 bg-brand-pink-glow/8 absolute top-1/4 right-1/4 h-[35%] w-[35%] rounded-full blur-[100px]" />
    </div>
  );
}
