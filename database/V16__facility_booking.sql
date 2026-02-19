-- V16: Facility / Amenity Booking
CREATE TABLE facility_bookings (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    booked_by_id BIGINT NOT NULL REFERENCES users(id),
    facility_name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    booking_date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    purpose VARCHAR(500),
    attendees INTEGER DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'UNPAID',
    admin_notes TEXT,
    cancelled_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facility_booking_society ON facility_bookings(society_id);
CREATE INDEX idx_facility_booking_date ON facility_bookings(booking_date);
CREATE INDEX idx_facility_booking_status ON facility_bookings(status);
