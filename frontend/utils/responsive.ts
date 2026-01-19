import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

export const isWeb = Platform.OS === 'web';
export const isMobile = width < BREAKPOINTS.mobile;
export const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
export const isDesktop = width >= BREAKPOINTS.tablet;

export const responsive = {
  padding: isMobile ? 16 : isTablet ? 24 : 32,
  maxWidth: isMobile ? '100%' : isTablet ? 720 : 1200,
  cardWidth: isMobile ? '100%' : isTablet ? '48%' : '32%',
  columns: isMobile ? 1 : isTablet ? 2 : 3,
  fontSize: {
    small: isMobile ? 12 : 14,
    normal: isMobile ? 14 : 16,
    large: isMobile ? 18 : isTablet ? 20 : 24,
    xlarge: isMobile ? 24 : isTablet ? 28 : 36,
  },
};

export function getResponsiveStyle(mobileStyle: any, tabletStyle: any, desktopStyle: any) {
  if (isDesktop) return { ...mobileStyle, ...tabletStyle, ...desktopStyle };
  if (isTablet) return { ...mobileStyle, ...tabletStyle };
  return mobileStyle;
}