/**
 * FloatingOrbs — ambient background decoration
 */

export default function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Sapphire orb — top right */}
      <div
        className="orb orb-sapphire animate-float"
        style={{ width: 500, height: 500, top: '-10%', right: '-8%' }}
      />
      {/* Emerald orb — bottom left */}
      <div
        className="orb orb-emerald animate-float"
        style={{ width: 400, height: 400, bottom: '-5%', left: '-5%', animationDelay: '2s' }}
      />
      {/* Purple orb — center */}
      <div
        className="orb orb-purple animate-float"
        style={{ width: 300, height: 300, top: '40%', left: '50%', animationDelay: '4s' }}
      />
    </div>
  );
}
