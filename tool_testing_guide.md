# 🧪 AI Tool Testing Guide

Use these example phrases in the [AI Test Room](http://localhost:3001/api/v1/ai/test) to verify each of the 13 tools.

---

### 1. Check Availability (`check_availability`)
*   **English**: "Are there any courts available next Friday at 6 PM?"
*   **Arabic**: "في ملعب فاضي الجمعة الجاي الساعة 6 المسا؟"

### 2. Get Courts (`get_courts`)
*   **English**: "What kind of football courts do you have?"
*   **Arabic**: "شو الملاعب اللي عندكم؟"

### 3. Get Pricing (`get_pricing`)
*   **English**: "How much is it to book Court 1 tonight at 8 PM?"
*   **Arabic**: "ملعب 1 اليوم الساعة 8 بالليل قديش سعره؟"

### 4. Create Booking (`create_booking`)
*   **English**: "I want to book Court 2 for tomorrow at 7 PM for one hour."
*   **Arabic**: "بدي أحجز ملعب 2 بكرا الساعة 7 بالليل لمدة ساعة."

### 5. Get Booking Details (`get_booking_details`)
*   **English**: "What are my upcoming bookings?"
*   **Arabic**: "شو الحجوزات اللي عندي؟"

### 6. Cancel Booking (`cancel_booking`)
*   **English**: "I need to cancel my booking with ID [ID] / I want to cancel my last booking."
*   **Arabic**: "بدي ألغي حجزي."

### 7. Modify Booking (`modify_booking`)
*   **English**: "Can I move my booking from 6 PM to 8 PM tomorrow?"
*   **Arabic**: "بقدر أغير موعد حجزي من الساعة 6 للساعة 8 بكرا؟"

### 8. Get Customer Info (`get_customer_info`)
*   **English**: "Tell me about my profile and how many bookings I've made."
*   **Arabic**: "أعطيني معلومات عني وقديش حجزت عندكم."

### 9. Update Customer Info (`update_customer_info`)
*   **English**: "My name is [Name] and I prefer to speak in English."
*   **Arabic**: "اسمي [الاسم] وبفضل تحكي معي بالعربي."

### 10. Get Event Packages (`get_event_packages`)
*   **English**: "Do you have any birthday packages for kids?"
*   **Arabic**: "عندكم عروض لأعياد الميلاد؟"

### 11. Create Event Booking (`create_event_booking`)
*   **English**: "I want to book a Birthday Party on Saturday from 2 PM to 5 PM."
*   **Arabic**: "بدي أحجز حفلة عيد ميلاد يوم السبت من الـ 2 للـ 5."

### 12. Get Directions (`get_directions`)
*   **English**: "Where are you located? Send me a map link."
*   **Arabic**: "وين موقعكم؟ ابعتلي اللوكيشن."

### 13. Get Business Hours (`get_business_hours`)
*   **English**: "What time do you open and close?"
*   **Arabic**: "متى بتفتحوا وبتسكروا؟"

---

### 💡 Tips for Testing:
1. **Context Memory**: The agent remembers your phone number (`+962791000001` by default).
2. **Double Tool Calls**: Sometimes the agent will call `check_availability` and `get_pricing` together to give you a full answer.
3. **Data Freshness**: These tools pull LIVE data from the legacy Docker database.
