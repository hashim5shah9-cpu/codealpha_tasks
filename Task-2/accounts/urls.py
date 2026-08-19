from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('profile/<str:username>/', views.profile, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('follow/<str:username>/', views.follow_toggle, name='follow_toggle'),
    path('search/', views.search_users, name='search_users'),
]
