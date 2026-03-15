import { Router, Request, Response } from 'express';
import { BUSINESS_HOURS, BUSINESS_LOCATION } from '../../../../packages/shared/src/constants';

const router = Router();

/**
 * GET /api/v1/info/hours
 * Return business hours with daily breakdown.
 */
router.get('/hours', (req: Request, res: Response) => {
  try {
    const formatHour = (h: number): string => {
      const hours = h % 24;
      return `${String(hours).padStart(2, '0')}:00`;
    };

    const openTime = formatHour(BUSINESS_HOURS.open);
    const closeTime = formatHour(BUSINESS_HOURS.close);

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

    const days: Record<string, { open: string; close: string }> = {};
    for (const day of dayNames) {
      days[day] = { open: openTime, close: closeTime };
    }

    res.json({
      data: {
        open: openTime,
        close: closeTime,
        timezone: 'Asia/Amman',
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching business hours:', error);
    res.status(500).json({ error: 'Failed to fetch business hours' });
  }
});

/**
 * GET /api/v1/info/location
 * Return business location info.
 */
router.get('/location', (req: Request, res: Response) => {
  try {
    res.json({
      data: {
        name: BUSINESS_LOCATION.name,
        name_ar: BUSINESS_LOCATION.name_ar,
        address: BUSINESS_LOCATION.address,
        address_ar: BUSINESS_LOCATION.address_ar,
        lat: BUSINESS_LOCATION.lat,
        lng: BUSINESS_LOCATION.lng,
        maps_link: BUSINESS_LOCATION.maps_link,
        phone: BUSINESS_LOCATION.phone,
        whatsapp: BUSINESS_LOCATION.whatsapp,
      },
    });
  } catch (error) {
    console.error('Error fetching location info:', error);
    res.status(500).json({ error: 'Failed to fetch location info' });
  }
});

export default router;
