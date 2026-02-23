import { useEffect, useRef, useState } from 'react';

// Vanta.js type declarations
declare global {
  interface Window {
    VANTA?: {
      NET: (config: VantaConfig) => VantaEffect;
    };
    THREE?: unknown;
  }
}

interface VantaConfig {
  el: HTMLElement;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  color: number;
  backgroundColor: number;
  points: number;
  maxDistance: number;
  spacing: number;
  showDots: boolean;
}

interface VantaEffect {
  destroy: () => void;
}

interface VantaBackgroundProps {
  className?: string;
  color?: number;
  backgroundColor?: number;
}

const VantaBackground = ({
  className = '',
  color = 0x3b82f6,
  backgroundColor = 0xf0f4f8,
}: VantaBackgroundProps) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<VantaEffect | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Three.js
    const loadThree = () => {
      return new Promise<void>((resolve) => {
        if (window.THREE) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    // Load Vanta.js
    const loadVanta = () => {
      return new Promise<void>((resolve) => {
        if (window.VANTA) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js';
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    // Initialize Vanta effect
    const initVanta = async () => {
      try {
        await loadThree();
        await loadVanta();

        if (!vantaRef.current || !window.VANTA) return;

        const effect = window.VANTA.NET({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          color,
          backgroundColor,
          points: 12.0,
          maxDistance: 24.0,
          spacing: 18.0,
          showDots: false,
        });

        setVantaEffect(effect);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Vanta.js:', error);
      }
    };

    initVanta();

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [color, backgroundColor]);

  return (
    <div
      ref={vantaRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{
        backgroundColor: isLoaded ? 'transparent' : `#${backgroundColor.toString(16).padStart(6, '0')}`,
      }}
    />
  );
};

export default VantaBackground;
