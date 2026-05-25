from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Chỉ user có role='admin' mới được phép."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsOwnerOrAdmin(BasePermission):
    """Chỉ chính user đó hoặc admin mới được phép thao tác trên object."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj == request.user or getattr(obj, 'user', None) == request.user

class IsStaffRole(BasePermission):
    """Chỉ user có role='staff' mới được phép."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'staff')


class IsDoctorRole(BasePermission):
    """Chỉ user có role='doctor' mới được phép."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'doctor')


class IsPatientRole(BasePermission):
    """Chỉ user có role='patient' mới được phép."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'patient')


class IsPharmacyRole(BasePermission):
    """Chỉ user có role='pharmacy' mới được phép."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'pharmacy')
