"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY_AR = exports.CURRENCY = exports.SEGMENT_THRESHOLDS = exports.BUSINESS_LOCATION = exports.WEEKEND_DAYS = exports.PEAK_END = exports.PEAK_START = exports.SLOT_DURATION = exports.BUSINESS_HOURS = void 0;
// Business hours
exports.BUSINESS_HOURS = {
    open: 8, // 8:00 AM
    close: 24, // 12:00 AM (midnight)
};
// Booking slot duration in minutes
exports.SLOT_DURATION = 60;
// Peak hours (weekdays)
exports.PEAK_START = 17; // 5:00 PM
exports.PEAK_END = 24; // midnight
// Weekend days (Friday = 5, Saturday = 6)
exports.WEEKEND_DAYS = [5, 6];
// Location
exports.BUSINESS_LOCATION = {
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
exports.SEGMENT_THRESHOLDS = {
    new: { min: 0, max: 3 },
    occasional: { min: 4, max: 9 },
    regular: { min: 10, max: 29 },
    vip: { min: 30, max: Infinity },
};
// Currency
exports.CURRENCY = 'JOD';
exports.CURRENCY_AR = 'دينار';
