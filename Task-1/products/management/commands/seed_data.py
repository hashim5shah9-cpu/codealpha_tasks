from django.core.management.base import BaseCommand
from products.models import Category, Product


class Command(BaseCommand):
    help = 'Seed database with sample products'

    def handle(self, *args, **kwargs):
        electronics = Category.objects.create(name='Electronics', slug='electronics', description='Electronic devices and gadgets')
        clothing = Category.objects.create(name='Clothing', slug='clothing', description='Fashion and apparel')
        books = Category.objects.create(name='Books', slug='books', description='Books and reading materials')
        home = Category.objects.create(name='Home & Garden', slug='home-garden', description='Home and garden products')

        products = [
            Product(category=electronics, name='Wireless Headphones', slug='wireless-headphones',
                    description='Premium wireless headphones with noise cancellation and 30-hour battery life.',
                    price=79.99, stock=50),
            Product(category=electronics, name='Smart Watch', slug='smart-watch',
                    description='Feature-rich smartwatch with health tracking, GPS, and smartphone notifications.',
                    price=199.99, stock=30),
            Product(category=electronics, name='Bluetooth Speaker', slug='bluetooth-speport',
                    description='Portable Bluetooth speaker with 360-degree sound and waterproof design.',
                    price=49.99, stock=100),
            Product(category=electronics, name='USB-C Hub', slug='usb-c-hub',
                    description='Multi-port USB-C hub with HDMI, USB 3.0, and SD card reader.',
                    price=34.99, stock=75),
            Product(category=clothing, name='Classic T-Shirt', slug='classic-t-shirt',
                    description='Comfortable cotton t-shirt available in multiple colors.',
                    price=19.99, stock=200),
            Product(category=clothing, name='Denim Jacket', slug='denim-jacket',
                    description='Stylish denim jacket perfect for casual occasions.',
                    price=89.99, stock=40),
            Product(category=clothing, name='Running Shoes', slug='running-shoes',
                    description='Lightweight running shoes with cushioned sole for maximum comfort.',
                    price=129.99, stock=60),
            Product(category=books, name='Python Programming', slug='python-programming',
                    description='Comprehensive guide to Python programming for beginners and intermediate developers.',
                    price=39.99, stock=150),
            Product(category=books, name='Web Development Guide', slug='web-development-guide',
                    description='Complete guide to modern web development with HTML, CSS, and JavaScript.',
                    price=44.99, stock=80),
            Product(category=books, name='Data Science Handbook', slug='data-science-handbook',
                    description='Essential reference for data science, machine learning, and AI.',
                    price=54.99, stock=65),
            Product(category=home, name='Indoor Plant Pot', slug='indoor-plant-pot',
                    description='Elegant ceramic plant pot with drainage hole, perfect for indoor plants.',
                    price=24.99, stock=120),
            Product(category=home, name='LED Desk Lamp', slug='led-desk-lamp',
                    description='Adjustable LED desk lamp with multiple brightness levels and color temperatures.',
                    price=45.99, stock=90),
        ]

        Product.objects.bulk_create(products)
        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(products)} products'))
