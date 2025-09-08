from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    university_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

class Ride(models.Model):
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rides_offered")
    source = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    departure_time = models.DateTimeField()
    fare = models.DecimalField(max_digits=6, decimal_places=2, default=0.00) # type: ignore
    available_seats = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

class RideBooking(models.Model):
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name="bookings")
    passenger = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    booked_at = models.DateTimeField(auto_now_add=True)
    liability_accepted = models.BooleanField(default=False)
    liability_accepted_at = models.DateTimeField(null=True, blank=True)

class Vehicle(models.Model):
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vehicles")
    name = models.CharField(max_length=100)  # e.g., "Honda City"
    registration_number = models.CharField(max_length=20, unique=True, default="UNKNOWN")
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2, default=0.00) # type: ignore
    available_from = models.DateTimeField()
    available_to = models.DateTimeField()

    def __str__(self):
        return f"{self.name} - {self.registration_number}"

class VehicleAvailability(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="availabilities")
    pickup_point = models.CharField(max_length=200)
    available_from = models.DateTimeField()
    available_to = models.DateTimeField()
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2)
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle.name} at {self.pickup_point} ({self.available_from} - {self.available_to})"

class VehicleBooking(models.Model):
    availability = models.OneToOneField(VehicleAvailability, on_delete=models.CASCADE, related_name="booking")
    renter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="vehicle_bookings")
    booked_at = models.DateTimeField(auto_now_add=True)
    liability_accepted = models.BooleanField(default=False)
    liability_accepted_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.renter.username} booked {self.availability.vehicle.name}"
    

class OBDRecord(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="obd_records")
    timestamp = models.DateTimeField(auto_now_add=True)
    speed = models.FloatField(null=True, blank=True)   # km/h
    rpm = models.IntegerField(null=True, blank=True)
    fuel_level = models.FloatField(null=True, blank=True)  # %
    error_code = models.CharField(max_length=50, null=True, blank=True)
    location_lat = models.FloatField(null=True, blank=True)
    location_lng = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"OBD @ {self.timestamp} for {self.vehicle.name}"