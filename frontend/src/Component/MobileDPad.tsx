import { useEffect, useRef } from 'react';
import { TouchInputHandle } from '../Hook/useTouchInput';

interface MobileDPadProps {
  touchInput: TouchInputHandle;
}

type Dir = 'up' | 'down' | 'left' | 'right';

export default function MobileDPad({ touchInput }: MobileDPadProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const pressed = useRef<Record<Dir, boolean>>({ up: false, down: false, left: false, right: false });

  useEffect(() => {
    if (!isMobile) return;
    const stopAll = () => {
      pressed.current = { up: false, down: false, left: false, right: false };
      touchInput.setMovement(0, 0);
      touchInput.setFire(false);
    };
    window.addEventListener('blur', stopAll);
    return () => window.removeEventListener('blur', stopAll);
  }, [isMobile, touchInput]);

  if (!isMobile) return null;

  const recompute = () => {
    const { up, down, left, right } = pressed.current;
    // Map giống desktop: W/S = forward/backward; A/D = rotate left/right
    if (left) touchInput.setDigitalRotate('left');
    else if (right) touchInput.setDigitalRotate('right');
    else touchInput.setDigitalRotate('none');

    if (up) touchInput.setDigitalDirection('forward');
    else if (down) touchInput.setDigitalDirection('backward');
    else touchInput.setDigitalDirection('none');

    // Keep analog zero to avoid interference
    touchInput.setMovement(0, 0);
  };

  const handleDir = (dir: Dir, active: boolean) => {
    pressed.current[dir] = active;
    recompute();
  };

  const handleFire = (active: boolean) => {
    touchInput.setFire(active);
  };

  const btnBase = 'w-16 h-16 rounded-full bg-white/25 text-white text-sm font-semibold backdrop-blur pointer-events-auto select-none active:scale-95 flex items-center justify-center border border-white/30 shadow-md';

  return (
    <div className="fixed inset-0 pointer-events-none lg:hidden">
      <div className="absolute bottom-10 left-6 flex items-center gap-3 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <button className={`${btnBase} self-center`} onPointerDown={() => handleDir('up', true)} onPointerUp={() => handleDir('up', false)} onPointerCancel={() => handleDir('up', false)} onPointerLeave={() => handleDir('up', false)}>W</button>
          <div className="flex gap-3">
            <button className={btnBase} onPointerDown={() => handleDir('left', true)} onPointerUp={() => handleDir('left', false)} onPointerCancel={() => handleDir('left', false)} onPointerLeave={() => handleDir('left', false)}>A</button>
            <button className={btnBase} onPointerDown={() => handleDir('down', true)} onPointerUp={() => handleDir('down', false)} onPointerCancel={() => handleDir('down', false)} onPointerLeave={() => handleDir('down', false)}>S</button>
            <button className={btnBase} onPointerDown={() => handleDir('right', true)} onPointerUp={() => handleDir('right', false)} onPointerCancel={() => handleDir('right', false)} onPointerLeave={() => handleDir('right', false)}>D</button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-6 pointer-events-auto">
        <button
          className={`${btnBase} w-20 h-20 bg-red-500/80 border-red-300/70 text-base`}
          onPointerDown={() => handleFire(true)}
          onPointerUp={() => handleFire(false)}
          onPointerCancel={() => handleFire(false)}
          onPointerLeave={() => handleFire(false)}
        >
          Fire
        </button>
      </div>
    </div>
  );
}
