from django.contrib import admin
from .models import Post, Comment, Like, Reel, ReelLike, ReelComment, Story, StoryView, Draft


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['user', 'content', 'created']
    list_filter = ['created', 'user']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'content', 'created']
    list_filter = ['created']


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created']


@admin.register(Reel)
class ReelAdmin(admin.ModelAdmin):
    list_display = ['user', 'caption', 'created']
    list_filter = ['created', 'user']


@admin.register(ReelLike)
class ReelLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'reel', 'created']


@admin.register(ReelComment)
class ReelCommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'reel', 'content', 'created']


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'caption', 'created', 'expires_at']
    list_filter = ['created', 'user']


@admin.register(StoryView)
class StoryViewAdmin(admin.ModelAdmin):
    list_display = ['user', 'story', 'viewed_at']


@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    list_display = ['user', 'draft_type', 'caption', 'updated']
    list_filter = ['draft_type', 'updated', 'user']
    search_fields = ['title', 'content']
