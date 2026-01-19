import { Dimensions, Platform, PixelRatio } from 'react-native';
import { useState, useEffect } from 'react';

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// Platform detection
export const isWeb = Platform.OS === 'web';

// Initial device type detection
export const getDeviceType = (width: number) => {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
};

// Create responsive values based on screen size
export const createResponsiveValue = <T,>(mobile: T, tablet: T, desktop: T): T => {
  const width = Dimensions.get('window').width;
  if (width >= BREAKPOINTS.desktop) return desktop;
  if (width >= BREAKPOINTS.tablet) return tablet;
  return mobile;
};

// Hook for responsive dimensions (updates on resize)
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  const deviceType = getDeviceType(dimensions.width);
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType,
  };
};

// Responsive helper object (static, for initial render)
const currentWidth = Dimensions.get('window').width;
export const isMobile = currentWidth < BREAKPOINTS.tablet;
export const isTablet = currentWidth >= BREAKPOINTS.tablet && currentWidth < BREAKPOINTS.desktop;
export const isDesktop = currentWidth >= BREAKPOINTS.desktop;

// Responsive spacing and sizing
export const responsive = {
  // Padding values
  padding: createResponsiveValue(16, 24, 32),
  paddingHorizontal: createResponsiveValue(16, 32, 48),
  paddingVertical: createResponsiveValue(16, 24, 32),
  
  // Font sizes
  fontSize: {
    xs: createResponsiveValue(10, 11, 12),
    small: createResponsiveValue(12, 13, 14),
    normal: createResponsiveValue(14, 15, 16),
    medium: createResponsiveValue(16, 17, 18),
    large: createResponsiveValue(18, 20, 24),
    xlarge: createResponsiveValue(24, 28, 32),
    xxlarge: createResponsiveValue(32, 40, 48),
  },
  
  // Container widths
  maxWidth: createResponsiveValue('100%', '100%', 1200),
  contentMaxWidth: createResponsiveValue('100%', 720, 960),
  sidebarWidth: createResponsiveValue(0, 0, 320),
  
  // Border radius
  borderRadius: {
    small: createResponsiveValue(8, 10, 12),
    medium: createResponsiveValue(12, 14, 16),
    large: createResponsiveValue(16, 20, 24),
  },
  
  // Button sizes
  buttonHeight: createResponsiveValue(48, 52, 56),
  iconButtonSize: createResponsiveValue(44, 48, 52),
  
  // Header height
  headerHeight: createResponsiveValue(100, 80, 80),
  
  // Touch target minimum
  touchTarget: 44,
  
  // Card dimensions
  cardWidth: createResponsiveValue('100%', '48%', '32%'),
  vehicleCardWidth: createResponsiveValue(160, 180, 200),
  
  // Grid columns
  columns: createResponsiveValue(1, 2, 3),
  
  // Gap spacing
  gap: {
    small: createResponsiveValue(8, 10, 12),
    medium: createResponsiveValue(12, 16, 20),
    large: createResponsiveValue(16, 24, 32),
  },
};

// Responsive style helper
export const getResponsiveStyle = <T extends object>(
  mobileStyle: T,
  tabletStyle?: Partial<T>,
  desktopStyle?: Partial<T>
): T => {
  const width = Dimensions.get('window').width;
  
  if (width >= BREAKPOINTS.desktop && desktopStyle) {
    return { ...mobileStyle, ...tabletStyle, ...desktopStyle };
  }
  if (width >= BREAKPOINTS.tablet && tabletStyle) {
    return { ...mobileStyle, ...tabletStyle };
  }
  return mobileStyle;
};

// Layout helpers for desktop
export const desktopLayout = {
  // Center content on wide screens
  containerStyle: {
    maxWidth: isDesktop ? 1400 : '100%',
    marginHorizontal: isDesktop ? 'auto' : 0,
    width: '100%',
  } as any,
  
  // Two-column layout for desktop
  twoColumnStyle: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: isDesktop ? 32 : 0,
  } as any,
  
  // Sidebar style
  sidebarStyle: {
    width: isDesktop ? 400 : '100%',
    minHeight: isDesktop ? '100vh' : 'auto',
    borderLeftWidth: isDesktop ? 1 : 0,
    borderLeftColor: '#2C2C2C',
  } as any,
  
  // Main content when sidebar exists
  mainContentStyle: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? 'auto' : '100%',
  } as any,
};

// Scale font based on screen width (useful for web)
export const scaleFontSize = (size: number): number => {
  const scale = Dimensions.get('window').width / 375; // Base width iPhone
  const newSize = size * Math.min(scale, 1.5); // Cap at 1.5x
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Safe area padding for web (desktop browsers don't need it)
export const safeAreaPadding = {
  top: isWeb && isDesktop ? 20 : 60,
  bottom: isWeb && isDesktop ? 20 : 40,
};

export default responsive;
