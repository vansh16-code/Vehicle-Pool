from django.contrib import admin
from .models import User, Vehicle, Ride, RideBooking, OBDRecord

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'university_id', 'phone_number', 'is_verified', 'is_staff']
    list_filter = ['is_verified', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'university_id']

@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ['id', 'driver', 'source', 'destination', 'departure_time', 'fare', 'available_seats']
    list_filter = ['departure_time', 'created_at']
    search_fields = ['source', 'destination', 'driver__username']

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['name', 'registration_number', 'driver', 'price_per_hour']
    search_fields = ['name', 'registration_number', 'driver__username']

@admin.register(RideBooking)
class RideBookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'ride', 'passenger', 'booked_at']
    list_filter = ['booked_at']
    search_fields = ['passenger__username', 'ride__source', 'ride__destination']

@admin.register(OBDRecord)
class OBDRecordAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'timestamp', 'speed', 'rpm', 'fuel_level', 'error_code']
    list_filter = ['timestamp', 'error_code']
    search_fields = ['vehicle__name', 'vehicle__registration_number']
