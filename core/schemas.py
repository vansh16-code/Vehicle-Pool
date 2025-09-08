from ninja import Schema
from datetime import datetime

class UserOut(Schema):
    id: int
    username: str
    university_id: str
    phone_number: str | None

class RideOut(Schema):
    id: int
    driver: str
    source: str
    destination: str
    departure_time: datetime
    available_seats: int
    fare: float

class RideIn(Schema):
    source: str
    destination: str
    departure_time: datetime
    available_seats: int
    fare: float

class SignUpSchema(Schema):
    username: str
    email: str
    password: str
    university_id: str
    phone_number: str | None = None

class LoginSchema(Schema):
    username: str
    password: str


class OBDIn(Schema):
    speed: float | None = None
    rpm: int | None = None
    fuel_level: float | None = None
    error_code: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None

class OBDOut(Schema):
    timestamp: str
    speed: float | None
    rpm: int | None
    fuel_level: float | None
    error_code: str | None
    location_lat: float | None
    location_lng: float | None

class VehicleIn(Schema):
    name: str
    registration_number: str
    price_per_hour: float
    available_from: datetime
    available_to: datetime

class VehicleOut(Schema):
    id: int
    name: str
    registration_number: str
    price_per_hour: float
    available_from: datetime
    available_to: datetime

class VehicleAvailabilityIn(Schema):
    vehicle_id: int
    pickup_point: str
    available_from: datetime
    available_to: datetime
    price_per_hour: float

class VehicleAvailabilityOut(Schema):
    id: int
    vehicle_name: str
    vehicle_registration: str
    pickup_point: str
    available_from: datetime
    available_to: datetime
    price_per_hour: float
    is_booked: bool

class VehicleBookingIn(Schema):
    availability_id: int
    liability_accepted: bool

class VehicleBookingOut(Schema):
    id: int
    availability_id: int
    vehicle_name: str
    pickup_point: str
    available_from: datetime
    available_to: datetime
    price_per_hour: float
    booked_at: datetime
    liability_accepted: bool