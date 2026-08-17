from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from .forms import RegistrationForm
from orders.models import Order
from cart.models import Cart


def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('product_list')
    else:
        form = RegistrationForm()
    return render(request, 'accounts/register.html', {'form': form})


@login_required
def profile(request):
    user = request.user
    orders = Order.objects.filter(user=user)
    total_spent = sum(order.total for order in orders)
    order_count = orders.count()
    cart, _ = Cart.objects.get_or_create(user=user)
    cart_items = cart.item_count

    context = {
        'profile_user': user,
        'orders': orders[:5],
        'total_spent': total_spent,
        'order_count': order_count,
        'cart_items': cart_items,
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def edit_profile(request):
    user = request.user
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        email = request.POST.get('email', '')
        username = request.POST.get('username', '')

        if username != user.username and User.objects.filter(username=username).exists():
            messages.error(request, 'Username already taken.')
            return redirect('edit_profile')

        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.username = username
        user.save()
        messages.success(request, 'Profile updated successfully.')
        return redirect('profile')

    return render(request, 'accounts/edit_profile.html', {'profile_user': user})
