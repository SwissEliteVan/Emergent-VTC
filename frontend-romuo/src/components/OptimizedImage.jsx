import { useState, useRef, useEffect } from 'react';

/**
 * Composant Image optimise avec:
 * - Lazy loading natif + Intersection Observer
 * - Placeholder blur pendant le chargement
 * - Support srcset pour images responsives
 * - Gestion des erreurs avec fallback
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Generer un placeholder blur si non fourni
  const defaultBlurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMkQyRDJEIi8+PC9zdmc+';

  // Intersection Observer pour lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Precharger 200px avant d'entrer dans le viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Handler de chargement
  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  // Handler d'erreur
  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  // Generer srcset pour Unsplash (images responsives)
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc.includes('unsplash.com')) return undefined;

    const widths = [400, 800, 1200, 1600];
    return widths
      .map((w) => {
        const url = new URL(baseSrc);
        url.searchParams.set('w', w.toString());
        url.searchParams.set('auto', 'format');
        url.searchParams.set('fit', 'crop');
        return `${url.toString()} ${w}w`;
      })
      .join(', ');
  };

  // Image de fallback en cas d'erreur
  const fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMkQyRDJEIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';

  const srcSet = generateSrcSet(src);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder blur */}
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <img
          src={blurDataURL || defaultBlurDataURL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {/* Skeleton loader */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-dark-700 animate-pulse" />
      )}

      {/* Image principale */}
      {isInView && (
        <img
          src={hasError ? fallbackSrc : src}
          srcSet={hasError ? undefined : srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Composant pour les images de fond avec lazy loading
 */
export function BackgroundImage({
  src,
  className = '',
  children,
  overlay = true,
  overlayClassName = '',
  priority = false,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef(null);

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.src = src;
  }, [isInView, src]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Background image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: isInView ? `url(${src})` : undefined }}
      />

      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-dark-800 animate-pulse" />
      )}

      {/* Overlay optionnel */}
      {overlay && (
        <div
          className={`absolute inset-0 ${
            overlayClassName || 'bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent'
          }`}
        />
      )}

      {/* Contenu */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
