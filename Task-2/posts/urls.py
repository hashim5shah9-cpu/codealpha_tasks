from django.urls import path
from . import views

urlpatterns = [
    path('', views.feed, name='feed'),
    path('post/create/', views.create_post, name='create_post'),
    path('post/<int:post_id>/delete/', views.delete_post, name='delete_post'),
    path('post/<int:post_id>/edit/', views.edit_post, name='edit_post'),
    path('post/<int:post_id>/like/', views.like_toggle, name='like_toggle'),
    path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    path('reels/', views.reels_page, name='reels'),
    path('reel/create/', views.create_reel, name='create_reel'),
    path('reel/<int:reel_id>/like/', views.reel_like_toggle, name='reel_like_toggle'),
    path('reel/<int:reel_id>/comment/', views.add_reel_comment, name='add_reel_comment'),
    path('reel/<int:reel_id>/delete/', views.delete_reel, name='delete_reel'),
    path('reel/<int:reel_id>/edit/', views.edit_reel, name='edit_reel'),
    path('stories/', views.stories_page, name='stories'),
    path('story/create/', views.create_story, name='create_story'),
    path('story/<int:story_id>/', views.view_story, name='view_story'),
    path('story/<int:story_id>/delete/', views.delete_story, name='delete_story'),
    path('editor/post/', views.create_post_editor, name='create_post_editor'),
    path('editor/reel/', views.create_reel_editor, name='create_reel_editor'),
    path('editor/story/', views.create_story_editor, name='create_story_editor'),
    path('draft/save/', views.save_draft, name='save_draft'),
    path('draft/list/', views.get_drafts, name='get_drafts'),
    path('draft/<int:draft_id>/delete/', views.delete_draft, name='delete_draft'),
]
