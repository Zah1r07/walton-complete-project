from datetime import date, timedelta

from django.core.management.base import BaseCommand

from core.models import Claim, Product, Registration, User


class Command(BaseCommand):
    help = "Create demo accounts and warranty records for local and Docker runs."

    def handle(self, *args, **options):
        admin, _ = User.objects.update_or_create(
            username="admin",
            defaults={
                "email": "admin@walton.local",
                "first_name": "Walton",
                "last_name": "Admin",
                "role": "admin",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password("admin123")
        admin.save()

        customer, _ = User.objects.update_or_create(
            username="amina.rahman",
            defaults={
                "email": "amina.rahman@example.com",
                "first_name": "Amina",
                "last_name": "Rahman",
                "role": "customer",
                "is_active": True,
                "is_staff": False,
                "is_superuser": False,
            },
        )
        customer.set_password("testpass123")
        customer.save()

        products = [
            ("WT-TV-7788", "Walton Vision 43 Smart TV", "Television"),
            ("WT-FR-4410", "Walton Frost Guard Refrigerator", "Kitchen"),
            ("WT-AC-2280", "Walton Arctic Cool AC", "Cooling"),
        ]

        product_objects = []
        for serial, name, category in products:
            product, _ = Product.objects.update_or_create(
                serial=serial,
                defaults={"name": name, "category": category},
            )
            product_objects.append(product)

        for index, product in enumerate(product_objects):
            registration, _ = Registration.objects.get_or_create(
                user=customer,
                product=product,
                defaults={"purchase_date": date.today() - timedelta(days=45 + index * 20)},
            )
            Claim.objects.get_or_create(
                registration=registration,
                defaults={
                    "description": f"{product.name} needs warranty service verification.",
                    "status": "pending" if index == 0 else "approved",
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
