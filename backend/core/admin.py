from django.contrib import admin
from .models import Claim, Feedback, Product, Registration, User

admin.site.register(User)
admin.site.register(Product)
admin.site.register(Registration)
admin.site.register(Claim)
admin.site.register(Feedback)
