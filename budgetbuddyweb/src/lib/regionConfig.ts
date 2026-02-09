export type Region = 'GB' | 'IN';

export interface RegionConfig {
  code: Region;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  dateFormat: string;
  timezone: string;
}

export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Europe/London'
  },
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata'
  }
};

export const getRegionConfig = (region: Region): RegionConfig => {
  return REGION_CONFIGS[region] || REGION_CONFIGS.GB;
};

export const formatCurrency = (amount: number, region: Region): string => {
  const config = getRegionConfig(region);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (amount: number, region: Region): string => {
  const config = getRegionConfig(region);
  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date: Date, region: Region): string => {
  const config = getRegionConfig(region);
  return new Intl.DateTimeFormat(config.locale).format(date);
};
