from ninja import Router
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from ninja.errors import HttpError
from ninja.security import HttpBearer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .schemas import SignUpSchema, LoginSchema, RideOut, RideIn
from .models import OBDRecord, Ride, Vehicle, VehicleAvailability, VehicleBooking
from .models import Ride, RideBooking
from .schemas import RideOut, RideIn,OBDIn,OBDOut,VehicleIn,VehicleOut,VehicleAvailabilityIn,VehicleAvailabilityOut,VehicleBookingIn,VehicleBookingOut
from datetime import timedelta
from django.utils.timezone import now
import random
import requests # type: ignore

# ------------------
# Auth Middleware
# ------------------
class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        from django.contrib.auth.models import AnonymousUser
        
        # Set the Authorization header for JWT authentication
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        auth = JWTAuthentication()
        try:
            validated = auth.authenticate(request) # type: ignore
            if validated is None:
                raise HttpError(401, "Invalid JWT")
            user, jwt_token = validated
            request.user = user
            return user
        except InvalidToken:
            raise HttpError(401, "Invalid Token")
        except Exception as e:
            raise HttpError(401, f"Authentication failed: {str(e)}")

auth = AuthBearer()
router = Router()
User = get_user_model()

# ------------------
# Auth Routes
# ------------------
@router.post("/signup")
def signup(request, data: SignUpSchema):
    if User.objects.filter(username=data.username).exists():
        raise HttpError(400, "Username already exists")
    if User.objects.filter(university_id=data.university_id).exists(): # type: ignore
        raise HttpError(400, "University ID already registered")

    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password,
        university_id=data.university_id, # type: ignore
        phone_number=data.phone_number, # type: ignore
    )
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "username": user.username,
        "university_id": user.university_id, # type: ignore
        "phone_number": user.phone_number, # type: ignore
    }

# ✅ Login
@router.post("/login")
def login(request, data: LoginSchema):
    user = authenticate(username=data.username, password=data.password)
    if user is None:
        raise HttpError(400, "Invalid credentials")

    refresh = RefreshToken.for_user(user)  
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "username": user.username,
        "university_id": user.university_id, # type: ignore
        "phone_number": user.phone_number, # type: ignore
    }

@router.get("/me", auth=auth)
def get_me(request):
    return {"id": request.user.id, "username": request.user.username}

# ------------------
# Ride Routes
# ------------------
@router.get("/rides", response=list[RideOut], auth=auth)
def list_rides(request):
    rides = Ride.objects.all()
    return [
        {
            "id": ride.id, # type: ignore
            "driver": ride.driver.username,
            "source": ride.source,
            "destination": ride.destination,
            "departure_time": ride.departure_time,
            "available_seats": ride.available_seats,
            "fare": float(ride.fare),
        }
        for ride in rides
    ]

@router.post("/rides", response=RideOut, auth=auth)
def create_ride(request, data: RideIn):
    ride = Ride.objects.create(driver=request.user, **data.dict())
    return {
        "id": ride.id, # type: ignore
        "driver": ride.driver.username,
        "source": ride.source,
        "destination": ride.destination,
        "departure_time": ride.departure_time,
        "available_seats": ride.available_seats,
        "fare": float(ride.fare),
    }

@router.delete("/rides/{ride_id}", auth=auth)
def delete_ride(request, ride_id: int):
    try:
        ride = Ride.objects.get(id=ride_id, driver=request.user)
    except Ride.DoesNotExist:
        raise HttpError(404, "Ride not found or not owned by you")
    
    # Check if there are any bookings for this ride
    if RideBooking.objects.filter(ride=ride).exists():
        raise HttpError(400, "Cannot delete ride with existing bookings")
    
    ride.delete()
    return {"message": "Ride deleted successfully"}

# =====================
# BOOKING ROUTES
# =====================

# View rides created by the logged-in user
@router.get("/my-rides", response=list[RideOut], auth=auth)
def my_rides(request):
    rides = Ride.objects.filter(driver=request.user)
    return [
        {
            "id": ride.id, # type: ignore
            "driver": ride.driver.username,
            "source": ride.source,
            "destination": ride.destination,
            "departure_time": ride.departure_time,
            "available_seats": ride.available_seats,
            "fare": float(ride.fare),
        }
        for ride in rides
    ]


# View rides booked by the logged-in user
@router.get("/my-bookings", auth=auth)
def my_bookings(request):
    bookings = RideBooking.objects.filter(passenger=request.user).select_related("ride")
    return [
        {
            "booking_id": b.id, # type: ignore
            "ride_id": b.ride.id, # type: ignore
            "source": b.ride.source,
            "destination": b.ride.destination,
            "departure_time": b.ride.departure_time,
            "driver": b.ride.driver.username,
        }
        for b in bookings
    ]

from datetime import timedelta
from django.utils.timezone import now


# =====================
# CANCEL BOOKING ROUTE
# =====================
@router.delete("/bookings/{booking_id}/cancel", auth=auth)
def cancel_booking(request, booking_id: int):
    try:
        booking = RideBooking.objects.select_related("ride").get(
            id=booking_id, passenger=request.user
        )
    except RideBooking.DoesNotExist:
        raise HttpError(404, "Booking not found")

    ride = booking.ride
    time_left = ride.departure_time - now()

    # Restrict cancellation if departure is in less than 30 minutes
    if time_left < timedelta(minutes=30):
        raise HttpError(400, "Cannot cancel within 30 minutes of departure")

    booking.delete()

    return {
        "message": "Booking cancelled",
        "ride_id": ride.id, # type: ignore
    }

@router.post("/rides/{ride_id}/book", auth=auth)
def book_ride(request, ride_id: int):
    try:
        ride = Ride.objects.get(id=ride_id)
    except Ride.DoesNotExist:
        raise HttpError(404, "Ride not found")

    # Restrict booking if departure is in less than 30 minutes
    time_left = ride.departure_time - now()
    if time_left < timedelta(minutes=30):
        raise HttpError(400, "Cannot book a ride within 30 minutes of departure")

    # Prevent double booking by same passenger
    if RideBooking.objects.filter(ride=ride, passenger=request.user).exists():
        raise HttpError(400, "You already booked this ride")

    # Prevent others from booking if already taken
    if RideBooking.objects.filter(ride=ride).exists():
        raise HttpError(400, "This ride is already booked by another passenger")

    booking = RideBooking.objects.create(ride=ride, passenger=request.user)

    return {
        "message": "Ride booked successfully",
        "ride_id": ride.id, # type: ignore
        "booking_id": booking.id, # type: ignore
    }

# ------------------
# Vehicle Routes
# ------------------
@router.get("/vehicles", response=list[VehicleOut], auth=auth)
def list_vehicles(request):
    vehicles = Vehicle.objects.filter(driver=request.user)
    return [
        {
            "id": vehicle.id, # type: ignore
            "name": vehicle.name,
            "registration_number": vehicle.registration_number,
            "price_per_hour": float(vehicle.price_per_hour),
            "available_from": vehicle.available_from,
            "available_to": vehicle.available_to,
        }
        for vehicle in vehicles
    ]

@router.post("/vehicles", response=VehicleOut, auth=auth)
def create_vehicle(request, data: VehicleIn):
    vehicle = Vehicle.objects.create(driver=request.user, **data.dict())
    return {
        "id": vehicle.id, # type: ignore
        "name": vehicle.name,
        "registration_number": vehicle.registration_number,
        "price_per_hour": float(vehicle.price_per_hour),
        "available_from": vehicle.available_from,
        "available_to": vehicle.available_to,
    }

# ------------------
# OBD Routes
# ------------------
@router.get("/vehicles/{vehicle_id}/obd", response=list[OBDOut], auth=auth)
def get_obd_data(request, vehicle_id: int):
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id, driver=request.user)
    except Vehicle.DoesNotExist:
        raise HttpError(404, "Vehicle not found or not owned by you")

    records = OBDRecord.objects.filter(vehicle=vehicle).order_by("-timestamp")[:10]
    return [
        {
            "timestamp": record.timestamp.isoformat(),
            "speed": record.speed,
            "rpm": record.rpm,
            "fuel_level": record.fuel_level,
            "error_code": record.error_code,
            "location_lat": record.location_lat,
            "location_lng": record.location_lng,
        }
        for record in records
    ]

@router.post("/vehicles/{vehicle_id}/obd", auth=auth)
def push_obd_data(request, vehicle_id: int, data: OBDIn):
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id, driver=request.user)
    except Vehicle.DoesNotExist:
        raise HttpError(404, "Vehicle not found or not owned by you")

    record = OBDRecord.objects.create(vehicle=vehicle, **data.dict())
    return {"message": "OBD data stored", "record_id": record.id} # type: ignore


# @router.get("/vehicles/{vehicle_id}/obd", response=list[OBDOut], auth=auth)
# def get_obd_data(request, vehicle_id: int):
#     try:
#         vehicle = Vehicle.objects.get(id=vehicle_id, driver=request.user)
#     except Vehicle.DoesNotExist:
#         raise HttpError(404, "Vehicle not found or not owned by you")

#     return OBDRecord.objects.filter(vehicle=vehicle).order_by("-timestamp")[:10]

@router.post("/vehicles/create-test", auth=auth)
def create_test_vehicle(request):
    from django.utils.timezone import now
    from datetime import timedelta
    
    # Create a test vehicle for the user
    vehicle = Vehicle.objects.create(
        driver=request.user,
        name="Test Car",
        registration_number=f"TEST{request.user.id}{random.randint(100, 999)}",
        price_per_hour=50.00,
        available_from=now(),
        available_to=now() + timedelta(days=30),
    )
    return {
        "message": "Test vehicle created",
        "vehicle_id": vehicle.id, # type: ignore
        "name": vehicle.name,
        "registration_number": vehicle.registration_number,
    }

@router.post("/vehicles/{vehicle_id}/obd/mock", auth=auth)
def mock_obd_data(request, vehicle_id: int):
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id, driver=request.user)
    except Vehicle.DoesNotExist:
        raise HttpError(404, "Vehicle not found")

    record = OBDRecord.objects.create(
        vehicle=vehicle,
        speed=random.uniform(20, 120),
        rpm=random.randint(1000, 6000),
        fuel_level=random.uniform(10, 100),
        error_code=None,
        location_lat=28.7041 + random.uniform(-0.01, 0.01),
        location_lng=77.1025 + random.uniform(-0.01, 0.01),
    )
    return {"message": "Mock OBD data generated", "record_id": record.id} # type: ignore



import os
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-flash"  # fast model for chatbot

@router.post("/chatbot", auth=auth)
def chatbot(request, query: str):
    if not GEMINI_API_KEY:
        raise HttpError(500, "Gemini API key not configured")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"""You are UniPool's friendly AI assistant for a university ride-sharing platform. 

Your role:
- Help students with ride bookings, cancellations, and queries
- Provide information about vehicle sharing and OBD diagnostics
- Give clear, helpful responses in a conversational tone
- Keep responses concise but informative
- Use bullet points for lists when helpful

Context: UniPool connects university students for safe, affordable ride sharing.

Student Question: {query}

Please provide a helpful, well-structured response:"""
                    }
                ]
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise HttpError(response.status_code, f"Gemini error: {response.text}")

    data = response.json()
    try:
        answer = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        answer = "Sorry, I couldn’t generate a response."

    return {"query": query, "answer": answer}

# ------------------
# Vehicle Availability Routes
# ------------------
@router.post("/vehicle-availability", response=VehicleAvailabilityOut, auth=auth)
def create_vehicle_availability(request, data: VehicleAvailabilityIn):
    try:
        vehicle = Vehicle.objects.get(id=data.vehicle_id, driver=request.user)
    except Vehicle.DoesNotExist:
        raise HttpError(404, "Vehicle not found or not owned by you")
    
    availability = VehicleAvailability.objects.create(
        vehicle=vehicle,
        pickup_point=data.pickup_point,
        available_from=data.available_from,
        available_to=data.available_to,
        price_per_hour=data.price_per_hour
    )
    
    return {
        "id": availability.id, # type: ignore
        "vehicle_name": vehicle.name,
        "vehicle_registration": vehicle.registration_number,
        "pickup_point": availability.pickup_point,
        "available_from": availability.available_from,
        "available_to": availability.available_to,
        "price_per_hour": float(availability.price_per_hour),
        "is_booked": availability.is_booked,
    }

@router.get("/vehicle-availability", response=list[VehicleAvailabilityOut], auth=auth)
def list_vehicle_availability(request):
    availabilities = VehicleAvailability.objects.filter(is_booked=False).select_related("vehicle")
    return [
        {
            "id": avail.id, # type: ignore
            "vehicle_name": avail.vehicle.name,
            "vehicle_registration": avail.vehicle.registration_number,
            "pickup_point": avail.pickup_point,
            "available_from": avail.available_from,
            "available_to": avail.available_to,
            "price_per_hour": float(avail.price_per_hour),
            "is_booked": avail.is_booked,
        }
        for avail in availabilities
    ]

@router.get("/my-vehicle-availability", response=list[VehicleAvailabilityOut], auth=auth)
def my_vehicle_availability(request):
    availabilities = VehicleAvailability.objects.filter(vehicle__driver=request.user).select_related("vehicle")
    return [
        {
            "id": avail.id, # type: ignore
            "vehicle_name": avail.vehicle.name,
            "vehicle_registration": avail.vehicle.registration_number,
            "pickup_point": avail.pickup_point,
            "available_from": avail.available_from,
            "available_to": avail.available_to,
            "price_per_hour": float(avail.price_per_hour),
            "is_booked": avail.is_booked,
        }
        for avail in availabilities
    ]

# ------------------
# Vehicle Booking Routes
# ------------------
@router.post("/vehicle-booking", response=VehicleBookingOut, auth=auth)
def create_vehicle_booking(request, data: VehicleBookingIn):
    if not data.liability_accepted:
        raise HttpError(400, "You must accept the liability agreement to proceed")
    
    try:
        availability = VehicleAvailability.objects.select_related("vehicle").get(
            id=data.availability_id, is_booked=False
        )
    except VehicleAvailability.DoesNotExist:
        raise HttpError(404, "Vehicle availability not found or already booked")
    
    # Prevent self-booking
    if availability.vehicle.driver == request.user:
        raise HttpError(400, "You cannot book your own vehicle")
    
    # Check if already booked by this user
    if VehicleBooking.objects.filter(availability=availability, renter=request.user).exists():
        raise HttpError(400, "You have already booked this vehicle")
    
    from django.utils.timezone import now
    
    # Create booking
    booking = VehicleBooking.objects.create(
        availability=availability,
        renter=request.user,
        liability_accepted=True,
        liability_accepted_at=now()
    )
    
    # Mark availability as booked
    availability.is_booked = True
    availability.save()
    
    return {
        "id": booking.id, # type: ignore
        "availability_id": availability.id, # type: ignore
        "vehicle_name": availability.vehicle.name,
        "pickup_point": availability.pickup_point,
        "available_from": availability.available_from,
        "available_to": availability.available_to,
        "price_per_hour": float(availability.price_per_hour),
        "booked_at": booking.booked_at,
        "liability_accepted": booking.liability_accepted,
    }

@router.get("/my-vehicle-bookings", response=list[VehicleBookingOut], auth=auth)
def my_vehicle_bookings(request):
    bookings = VehicleBooking.objects.filter(renter=request.user).select_related("availability__vehicle")
    return [
        {
            "id": booking.id, # type: ignore
            "availability_id": booking.availability.id, # type: ignore
            "vehicle_name": booking.availability.vehicle.name,
            "pickup_point": booking.availability.pickup_point,
            "available_from": booking.availability.available_from,
            "available_to": booking.availability.available_to,
            "price_per_hour": float(booking.availability.price_per_hour),
            "booked_at": booking.booked_at,
            "liability_accepted": booking.liability_accepted,
        }
        for booking in bookings
    ]

@router.delete("/vehicle-booking/{booking_id}", auth=auth)
def cancel_vehicle_booking(request, booking_id: int):
    try:
        booking = VehicleBooking.objects.select_related("availability").get(
            id=booking_id, renter=request.user
        )
    except VehicleBooking.DoesNotExist:
        raise HttpError(404, "Booking not found")
    
    from django.utils.timezone import now
    from datetime import timedelta
    
    # Check if cancellation is allowed (at least 1 hour before start time)
    time_left = booking.availability.available_from - now()
    if time_left < timedelta(hours=1):
        raise HttpError(400, "Cannot cancel within 1 hour of start time")
    
    # Mark availability as available again
    availability = booking.availability
    availability.is_booked = False
    availability.save()
    
    # Delete booking
    booking.delete()
    
    return {"message": "Vehicle booking cancelled successfully"}
