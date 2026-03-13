import { ToolDefinition } from '../integrations/huggingface';
import { query } from '../config/database';
import { getAvailableSlots, isSlotAvailable } from '../services/calendar.service';
import { getPrice } from '../services/pricing.service';
import * as bookingQueries from '../db/queries/bookings';
import * as courtQueries from '../db/queries/courts';
import * as eventQueries from '../db/queries/events';
import { BUSINESS_LOCATION, BUSINESS_HOURS } from '../../../../packages/shared/src/constants';

// ============================================
// TOOL DEFINITIONS (sent to the AI model)
// ============================================

export const toolDefinitions: ToolDefinition[] = [
  // 1. Check availability
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Check available time slots for a specific date across ALL courts. Only call this ONCE per date — it returns all courts and slots in one response. Optionally filter by a single court.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          court_id: { type: 'string', description: 'Specific court ID (optional)' },
          duration: { type: 'number', description: 'Duration in minutes (default 60)' },
        },
        required: ['date'],
      },
    },
  },

  // 2. Create booking
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Create a new court booking for a customer.',
      parameters: {
        type: 'object',
        properties: {
          customer_phone: { type: 'string', description: 'Customer phone number' },
          court_id: { type: 'string', description: 'Court ID to book' },
          start_time: { type: 'string', description: 'Booking start time in ISO format (e.g. 2026-03-15T18:00:00+03:00)' },
          end_time: { type: 'string', description: 'Booking end time in ISO format' },
          booking_type: { type: 'string', enum: ['regular', 'birthday', 'private_event'], description: 'Type of booking' },
        },
        required: ['customer_phone', 'court_id', 'start_time', 'end_time'],
      },
    },
  },

  // 3. Cancel booking
  {
    type: 'function',
    function: {
      name: 'cancel_booking',
      description: 'Cancel an existing booking by booking ID or cancel token.',
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string', description: 'Booking ID' },
          cancel_token: { type: 'string', description: 'Cancel token from confirmation message' },
        },
      },
    },
  },

  // 4. Modify booking
  {
    type: 'function',
    function: {
      name: 'modify_booking',
      description: 'Modify an existing booking (change time, date, or court).',
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string', description: 'Booking ID to modify' },
          new_start_time: { type: 'string', description: 'New start time in ISO format' },
          new_end_time: { type: 'string', description: 'New end time in ISO format' },
          new_court_id: { type: 'string', description: 'New court ID (optional)' },
        },
        required: ['booking_id'],
      },
    },
  },

  // 5. Get booking details
  {
    type: 'function',
    function: {
      name: 'get_booking_details',
      description: 'Get details of a customer\'s upcoming bookings by their phone number.',
      parameters: {
        type: 'object',
        properties: {
          customer_phone: { type: 'string', description: 'Customer phone number' },
        },
        required: ['customer_phone'],
      },
    },
  },

  // 6. Get courts
  {
    type: 'function',
    function: {
      name: 'get_courts',
      description: 'List all available football courts with details and pricing.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // 7. Get pricing
  {
    type: 'function',
    function: {
      name: 'get_pricing',
      description: 'Get the price for a specific court at a specific time.',
      parameters: {
        type: 'object',
        properties: {
          court_id: { type: 'string', description: 'Court ID' },
          start_time: { type: 'string', description: 'Start time in ISO format' },
        },
        required: ['court_id', 'start_time'],
      },
    },
  },

  // 8. Get customer info
  {
    type: 'function',
    function: {
      name: 'get_customer_info',
      description: 'Look up a customer by their phone number. Returns their profile, preferences, and booking history.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Customer phone number' },
        },
        required: ['phone'],
      },
    },
  },

  // 9. Update customer info
  {
    type: 'function',
    function: {
      name: 'update_customer_info',
      description: 'Update customer name or preferences.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Customer phone number' },
          name: { type: 'string', description: 'Customer name' },
          preferred_lang: { type: 'string', enum: ['ar', 'en'], description: 'Preferred language' },
        },
        required: ['phone'],
      },
    },
  },

  // 10. Get event packages
  {
    type: 'function',
    function: {
      name: 'get_event_packages',
      description: 'List available birthday and event packages with pricing.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // 11. Create event booking
  {
    type: 'function',
    function: {
      name: 'create_event_booking',
      description: 'Book a court for a birthday party or private event with extras.',
      parameters: {
        type: 'object',
        properties: {
          customer_phone: { type: 'string', description: 'Customer phone number' },
          court_id: { type: 'string', description: 'Court ID' },
          start_time: { type: 'string', description: 'Start time in ISO format' },
          end_time: { type: 'string', description: 'End time in ISO format' },
          event_type: { type: 'string', enum: ['birthday', 'corporate', 'tournament'] },
          guest_count: { type: 'number', description: 'Number of guests' },
          package_name: { type: 'string', description: 'Package name to use' },
          decorations: { type: 'boolean' },
          catering: { type: 'boolean' },
          special_requests: { type: 'string' },
        },
        required: ['customer_phone', 'court_id', 'start_time', 'end_time', 'event_type'],
      },
    },
  },

  // 12. Get directions
  {
    type: 'function',
    function: {
      name: 'get_directions',
      description: 'Get the location and Google Maps link for Al Daoud Football Courts.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // 13. Get business hours
  {
    type: 'function',
    function: {
      name: 'get_business_hours',
      description: 'Get the operating hours of Al Daoud Football Courts.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// ============================================
// TOOL EXECUTORS (actually run the tool)
// ============================================

export async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  try {
    const result = await toolHandlers[name](args);
    console.log(`[Tool Result] ${name}:`, JSON.stringify(result).slice(0, 500));
    return JSON.stringify(result);
  } catch (error: any) {
    console.error(`[Tool Error] ${name}:`, error.message);
    return JSON.stringify({ error: error.message || 'Tool execution failed' });
  }
}

const toolHandlers: Record<string, (args: any) => Promise<any>> = {

  // 1. Check availability
  async check_availability(args) {
    const { date, court_id, duration } = args;
    const slots = await getAvailableSlots(date, court_id, duration || 60);
    const available = slots.filter((s: any) => s.available);
    return {
      date,
      total_slots: slots.length,
      available_count: available.length,
      available_slots: available.map((s: any) => ({
        court_name: s.court_name,
        court_id: s.court_id,
        start: s.start_time,
        end: s.end_time,
        price: s.price,
        is_peak: s.is_peak,
      })),
    };
  },

  // 2. Create booking
  async create_booking(args) {
    const { customer_phone, court_id, start_time, end_time, booking_type } = args;

    // Find or create customer
    const customer = await findOrCreateCustomer(customer_phone);

    // Check availability
    const available = await isSlotAvailable(court_id, start_time, end_time);
    if (!available) {
      return { error: 'This time slot is no longer available. Please choose another time.' };
    }

    // Get price
    const pricing = await getPrice(court_id, start_time);

    // Create booking
    const booking = await bookingQueries.create({
      customer_id: customer.id,
      court_id,
      start_time,
      end_time,
      booking_type: booking_type || 'regular',
      source: 'whatsapp',
      price: pricing.price,
    });

    // Update customer stats
    await query(
      'UPDATE customers SET total_bookings = total_bookings + 1, total_spent = total_spent + $1, last_contact = NOW() WHERE id = $2',
      [pricing.price, customer.id]
    );

    // Get court name
    const court = await courtQueries.findById(court_id);

    return {
      success: true,
      booking_id: booking.id,
      cancel_token: booking.cancel_token,
      court_name: court?.name_ar || court?.name,
      date: start_time,
      start_time,
      end_time,
      price: pricing.price,
      currency: 'JOD',
    };
  },

  // 3. Cancel booking
  async cancel_booking(args) {
    const { booking_id, cancel_token } = args;

    let booking;
    if (cancel_token) {
      booking = await bookingQueries.findByToken(cancel_token);
    } else if (booking_id) {
      booking = await bookingQueries.findById(booking_id);
    }

    if (!booking) {
      return { error: 'Booking not found.' };
    }

    if (booking.status === 'cancelled') {
      return { error: 'This booking is already cancelled.' };
    }

    await bookingQueries.update(booking.id, { status: 'cancelled' });

    // Update customer stats
    await query(
      'UPDATE customers SET total_bookings = GREATEST(total_bookings - 1, 0), total_spent = GREATEST(total_spent - $1, 0) WHERE id = $2',
      [booking.price, booking.customer_id]
    );

    return { success: true, message: 'Booking cancelled successfully.' };
  },

  // 4. Modify booking
  async modify_booking(args) {
    const { booking_id, new_start_time, new_end_time, new_court_id } = args;

    const booking = await bookingQueries.findById(booking_id);
    if (!booking) {
      return { error: 'Booking not found.' };
    }

    const courtId = new_court_id || booking.court_id;
    const startTime = new_start_time || booking.start_time;
    const endTime = new_end_time || booking.end_time;

    // Check availability (excluding current booking)
    const conflictCheck = await query(
      `SELECT id FROM bookings
       WHERE court_id = $1 AND id != $2 AND status != 'cancelled'
       AND tstzrange(start_time, end_time) && tstzrange($3::timestamptz, $4::timestamptz)`,
      [courtId, booking_id, startTime, endTime]
    );

    if (conflictCheck.rows.length > 0) {
      return { error: 'The new time slot is not available. Please choose another time.' };
    }

    const pricing = await getPrice(courtId, startTime);

    await bookingQueries.update(booking_id, {
      court_id: courtId,
      start_time: startTime,
      end_time: endTime,
      price: pricing.price,
    });

    const court = await courtQueries.findById(courtId);

    return {
      success: true,
      booking_id,
      court_name: court?.name_ar || court?.name,
      start_time: startTime,
      end_time: endTime,
      price: pricing.price,
      currency: 'JOD',
    };
  },

  // 5. Get booking details
  async get_booking_details(args) {
    const { customer_phone } = args;

    const customerResult = await query('SELECT id FROM customers WHERE phone = $1', [customer_phone]);
    if (customerResult.rows.length === 0) {
      return { bookings: [], message: 'No bookings found for this number.' };
    }

    const customerId = customerResult.rows[0].id;
    const result = await query(
      `SELECT b.*, c.name_ar as court_name
       FROM bookings b JOIN courts c ON b.court_id = c.id
       WHERE b.customer_id = $1 AND b.status = 'confirmed' AND b.start_time > NOW()
       ORDER BY b.start_time ASC`,
      [customerId]
    );

    return {
      upcoming_bookings: result.rows.map((b: any) => ({
        booking_id: b.id,
        court_name: b.court_name,
        date: b.start_time,
        start_time: b.start_time,
        end_time: b.end_time,
        price: b.price,
        status: b.status,
        cancel_token: b.cancel_token,
      })),
    };
  },

  // 6. Get courts
  async get_courts() {
    const courts = await courtQueries.findAll({ is_active: true });
    return {
      courts: courts.map((c: any) => ({
        id: c.id,
        name: c.name,
        name_ar: c.name_ar,
        type: c.type,
        surface: c.surface,
        capacity: c.capacity,
        hourly_rate: c.hourly_rate,
        peak_rate: c.peak_rate,
      })),
    };
  },

  // 7. Get pricing
  async get_pricing(args) {
    const { court_id, start_time } = args;
    const pricing = await getPrice(court_id, start_time);
    const court = await courtQueries.findById(court_id);
    return {
      court_name: court?.name_ar || court?.name,
      price: pricing.price,
      is_peak: pricing.is_peak,
      currency: 'JOD',
    };
  },

  // 8. Get customer info
  async get_customer_info(args) {
    const { phone } = args;
    const result = await query(
      'SELECT id, phone, name, preferred_lang, segment, total_bookings, total_spent, preferences FROM customers WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return { found: false, message: 'New customer' };
    }

    const customer = result.rows[0];
    return {
      found: true,
      name: customer.name,
      segment: customer.segment,
      total_bookings: customer.total_bookings,
      preferred_lang: customer.preferred_lang,
      preferences: customer.preferences,
    };
  },

  // 9. Update customer info
  async update_customer_info(args) {
    const { phone, name, preferred_lang } = args;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (preferred_lang) {
      updates.push(`preferred_lang = $${paramIndex++}`);
      values.push(preferred_lang);
    }

    updates.push(`updated_at = NOW()`);
    values.push(phone);

    await query(
      `UPDATE customers SET ${updates.join(', ')} WHERE phone = $${paramIndex}`,
      values
    );

    return { success: true };
  },

  // 10. Get event packages
  async get_event_packages() {
    const packages = await eventQueries.findAllPackages();
    return {
      packages: packages.map((p: any) => ({
        name: p.name,
        name_ar: p.name_ar,
        type: p.type,
        description_ar: p.description_ar,
        base_price: p.base_price,
        max_guests: p.max_guests,
        includes_decorations: p.includes_decorations,
        includes_catering: p.includes_catering,
        duration_mins: p.duration_mins,
        currency: 'JOD',
      })),
    };
  },

  // 11. Create event booking
  async create_event_booking(args) {
    const {
      customer_phone, court_id, start_time, end_time,
      event_type, guest_count, package_name, decorations, catering, special_requests,
    } = args;

    const customer = await findOrCreateCustomer(customer_phone);

    const available = await isSlotAvailable(court_id, start_time, end_time);
    if (!available) {
      return { error: 'This time slot is not available.' };
    }

    const pricing = await getPrice(court_id, start_time);
    const bookingType = event_type === 'birthday' ? 'birthday' : 'private_event';

    const booking = await bookingQueries.create({
      customer_id: customer.id,
      court_id,
      start_time,
      end_time,
      booking_type: bookingType,
      source: 'whatsapp',
      price: pricing.price,
    });

    // Add event extras
    await query(
      `INSERT INTO event_extras (booking_id, event_type, guest_count, decorations, catering, special_requests, package_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [booking.id, event_type, guest_count || null, decorations || false, catering || false, special_requests || null, package_name || null]
    );

    const court = await courtQueries.findById(court_id);

    return {
      success: true,
      booking_id: booking.id,
      cancel_token: booking.cancel_token,
      court_name: court?.name_ar || court?.name,
      event_type,
      start_time,
      end_time,
      price: pricing.price,
      currency: 'JOD',
    };
  },

  // 12. Get directions
  async get_directions() {
    return {
      name: BUSINESS_LOCATION.name_ar,
      address: BUSINESS_LOCATION.address_ar,
      maps_link: BUSINESS_LOCATION.maps_link,
      lat: BUSINESS_LOCATION.lat,
      lng: BUSINESS_LOCATION.lng,
    };
  },

  // 13. Get business hours
  async get_business_hours() {
    return {
      open: `${BUSINESS_HOURS.open}:00`,
      close: '00:00',
      timezone: 'Asia/Amman',
      note_ar: 'من 8 صباحاً حتى 12 منتصف الليل، كل يوم',
      note_en: 'From 8 AM to 12 AM (midnight), every day',
    };
  },
};

// ============================================
// HELPER: Find or create customer by phone
// ============================================

async function findOrCreateCustomer(phone: string) {
  const result = await query('SELECT * FROM customers WHERE phone = $1', [phone]);

  if (result.rows.length > 0) {
    await query('UPDATE customers SET last_contact = NOW() WHERE id = $1', [result.rows[0].id]);
    return result.rows[0];
  }

  const insert = await query(
    'INSERT INTO customers (phone, preferred_lang) VALUES ($1, $2) RETURNING *',
    [phone, 'ar']
  );
  return insert.rows[0];
}
