// Business hours
export const BUSINESS_HOURS = {
  open: 8,   // 8:00 AM
  close: 24, // 12:00 AM (midnight)
};

// Booking slot duration in minutes
export const SLOT_DURATION = 60;

// Peak hours (weekdays)
export const PEAK_START = 17; // 5:00 PM
export const PEAK_END = 24;   // midnight

// Weekend days (Friday = 5, Saturday = 6)
export const WEEKEND_DAYS = [5, 6];

// Location
export const BUSINESS_LOCATION = {
  name: 'Al Daoud Football Courts',
  name_ar: 'ملاعب الداعود لكرة القدم',
  address: 'Abdoun, Amman, Jordan',
  address_ar: 'عبدون، عمّان، الأردن',
  lat: 31.9539,
  lng: 35.8744,
  maps_link: 'https://maps.google.com/?q=31.9539,35.8744',
  phone: '+962790000000',
  whatsapp: '+962790000000',
};

// Customer segments thresholds
export const SEGMENT_THRESHOLDS = {
  new: { min: 0, max: 3 },
  occasional: { min: 4, max: 9 },
  regular: { min: 10, max: 29 },
  vip: { min: 30, max: Infinity },
};

// Currency
export const CURRENCY = 'JOD';
export const CURRENCY_AR = 'دينار';
