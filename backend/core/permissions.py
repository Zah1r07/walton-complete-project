from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_admin(user):
    return bool(user and user.is_authenticated and user.role == "admin")


class AdminOnly(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class ProductPermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.method in SAFE_METHODS or is_admin(request.user)))


class OwnerOrAdminPermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if is_admin(request.user):
            return True
        if hasattr(obj, "user"):
            return obj.user_id == request.user.id
        if hasattr(obj, "registration"):
            return obj.registration.user_id == request.user.id
        if hasattr(obj, "claim"):
            return obj.claim.registration.user_id == request.user.id
        return False
