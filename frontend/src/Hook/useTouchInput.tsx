import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

export interface TouchState {
  // Movement: analog velocity from -1 to 1
  vx: number; // horizontal velocity (-1 = left, 1 = right)
  vy: number; // vertical velocity (-1 = up, 1 = down)
  // Digital controls to mimic keyboard WASD
  digitalRotate: 'left' | 'right' | 'none';
  digitalDirection: 'forward' | 'backward' | 'none';
  // Aim: degree/angle from center
  aimDegree: number;
  // Fire
  isFiring: boolean;
}

export interface TouchInputHandle {
  state: RefObject<TouchState>;
  setMovement: (vx: number, vy: number) => void;
  setDigitalRotate: (dir: TouchState['digitalRotate']) => void;
  setDigitalDirection: (dir: TouchState['digitalDirection']) => void;
  setFire: (isFiring: boolean) => void;
  setAimDegree: (degree: number) => void;
}

/**
 * Virtual joystick for mobile touch controls
 * Left side: movement (4-way)
 * Right side: aim + fire
 */
export const useTouchInput = (): TouchInputHandle => {
  const touchState = useRef<TouchState>({
    vx: 0,
    vy: 0,
    digitalRotate: 'none',
    digitalDirection: 'none',
    aimDegree: 0,
    isFiring: false,
  });

  const leftTouchId = useRef<number | null>(null);
  const rightTouchId = useRef<number | null>(null);

  const setMovement = useCallback((vx: number, vy: number) => {
    touchState.current.vx = vx;
    touchState.current.vy = vy;
  }, []);

  const setDigitalRotate = useCallback((dir: TouchState['digitalRotate']) => {
    touchState.current.digitalRotate = dir;
  }, []);

  const setDigitalDirection = useCallback((dir: TouchState['digitalDirection']) => {
    touchState.current.digitalDirection = dir;
  }, []);

  const setFire = useCallback((isFiring: boolean) => {
    touchState.current.isFiring = isFiring;
  }, []);

  const setAimDegree = useCallback((degree: number) => {
    touchState.current.aimDegree = degree;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    const screenMidX = window.innerWidth / 2;

    // Left side: movement joystick
    if (clientX < screenMidX) {
      leftTouchId.current = e.touches[0].identifier;
      updateMovement(clientX, clientY);
    }
    // Right side: aim + fire
    else {
      rightTouchId.current = e.touches[0].identifier;
      updateAim(clientX, clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const clientX = touch.clientX;
      const clientY = touch.clientY;
      const screenMidX = window.innerWidth / 2;

      // Update left (movement)
      if (touch.identifier === leftTouchId.current && clientX < screenMidX) {
        updateMovement(clientX, clientY);
      }
      // Update right (aim)
      if (touch.identifier === rightTouchId.current && clientX >= screenMidX) {
        updateAim(clientX, clientY);
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === leftTouchId.current) {
        leftTouchId.current = null;
        touchState.current.vx = 0;
        touchState.current.vy = 0;
        touchState.current.digitalRotate = 'none';
        touchState.current.digitalDirection = 'none';
      }

      if (touch.identifier === rightTouchId.current) {
        rightTouchId.current = null;
        touchState.current.isFiring = false;
      }
    }
  }, []);

  const updateMovement = (clientX: number, clientY: number) => {
    const screenMidX = window.innerWidth / 2;
    const screenMidY = window.innerHeight / 2;

    // Center of left joystick
    const centerX = screenMidX * 0.5;
    const centerY = screenMidY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Deadzone: 20px
    const deadzone = 20;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > deadzone) {
      // Max radius: 80px (joystick size / 2)
      const maxRadius = 80;
      const magnitude = Math.min(distance, maxRadius) / maxRadius; // 0 to 1

      // Normalize direction
      const dirX = dx / distance;
      const dirY = dy / distance;

      touchState.current.vx = dirX * magnitude;
      touchState.current.vy = dirY * magnitude;
    } else {
      touchState.current.vx = 0;
      touchState.current.vy = 0;
    }
  };

  const updateAim = (clientX: number, clientY: number) => {
    const screenMidX = window.innerWidth / 2;
    const screenMidY = window.innerHeight / 2;
    const centerX = (screenMidX + window.innerWidth) / 2;
    const centerY = screenMidY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Calculate angle in degrees (0 = up, 90 = right, 180 = down, 270 = left)
    let degree = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (degree < 0) degree += 360;

    touchState.current.aimDegree = degree;

    // Firing: if touch is far enough from center (radius > 30px)
    const distance = Math.sqrt(dx * dx + dy * dy);
    touchState.current.isFiring = distance > 30;
  };

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return useMemo(() => ({
    state: touchState,
    setMovement,
    setDigitalRotate,
    setDigitalDirection,
    setFire,
    setAimDegree,
  }), [setMovement, setDigitalRotate, setDigitalDirection, setFire, setAimDegree]);
};
