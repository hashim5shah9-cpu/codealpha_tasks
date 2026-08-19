from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Count
from .forms import RegistrationForm, ProfileForm
from posts.models import Post
from social.models import Follow


def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('feed')
    else:
        form = RegistrationForm()
    return render(request, 'accounts/register.html', {'form': form})


@login_required
def profile(request, username):
    user = get_object_or_404(
        User.objects.select_related('profile'),
        username=username
    )
    posts = Post.objects.filter(user=user).select_related('user', 'user__profile').prefetch_related('likes', 'comments')
    is_following = Follow.objects.filter(follower=request.user, following=user).exists()
    is_own_profile = request.user == user

    context = {
        'profile_user': user,
        'posts': posts,
        'is_following': is_following,
        'is_own_profile': is_own_profile,
        'followers_count': user.followers.count(),
        'following_count': user.following.count(),
        'posts_count': posts.count(),
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def edit_profile(request):
    if request.method == 'POST':
        form = ProfileForm(request.POST, request.FILES, instance=request.user.profile)
        user_form_data = request.POST

        if form.is_valid():
            form.save()
            request.user.first_name = user_form_data.get('first_name', request.user.first_name)
            request.user.last_name = user_form_data.get('last_name', request.user.last_name)
            request.user.save()
            messages.success(request, 'Profile updated successfully.')
            return redirect('profile', username=request.user.username)
    else:
        form = ProfileForm(instance=request.user.profile)

    return render(request, 'accounts/edit_profile.html', {'form': form})


@login_required
def follow_toggle(request, username):
    user_to_follow = get_object_or_404(User, username=username)
    if request.user == user_to_follow:
        messages.error(request, 'You cannot follow yourself.')
        return redirect('profile', username=username)

    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=user_to_follow
    )
    if not created:
        follow.delete()
        is_following = False
    else:
        is_following = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'is_following': is_following,
            'followers_count': user_to_follow.followers.count(),
        })

    return redirect('profile', username=username)


@login_required
def search_users(request):
    query = request.GET.get('q', '')
    users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)[:10]
    results = [{'username': u.username, 'name': u.get_full_name() or u.username} for u in users]

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'users': results})

    return render(request, 'accounts/search.html', {'query': query, 'users': users})
