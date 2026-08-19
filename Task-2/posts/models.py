from django.db import models
from django.contrib.auth.models import User


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created']
        indexes = [
            models.Index(fields=['-created']),
            models.Index(fields=['user']),
        ]

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.count()


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        indexes = [
            models.Index(fields=['user', 'post']),
        ]

    def __str__(self):
        return f'{self.user.username} likes post {self.post.id}'


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(max_length=500)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created']

    def __str__(self):
        return f'Comment by {self.user.username} on post {self.post.id}'


class Reel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reels')
    video = models.FileField(upload_to='reels/')
    caption = models.TextField(max_length=500, blank=True)
    cover = models.ImageField(upload_to='reel_covers/', blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created']
        indexes = [
            models.Index(fields=['-created']),
            models.Index(fields=['user']),
        ]

    @property
    def likes_count(self):
        return self.reel_likes.count()

    @property
    def comments_count(self):
        return self.reel_comments.count()


class ReelLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reel_likes')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='reel_likes')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'reel')
        indexes = [
            models.Index(fields=['user', 'reel']),
        ]

    def __str__(self):
        return f'{self.user.username} likes reel {self.reel.id}'


class ReelComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reel_comments')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='reel_comments')
    content = models.TextField(max_length=500)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created']

    def __str__(self):
        return f'Comment by {self.user.username} on reel {self.reel.id}'


class Story(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    image = models.ImageField(upload_to='stories/')
    caption = models.CharField(max_length=200, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created']
        indexes = [
            models.Index(fields=['-created']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['user']),
        ]

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


class StoryView(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_views')
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='views')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'story')
        indexes = [
            models.Index(fields=['user', 'story']),
        ]

    def __str__(self):
        return f'{self.user.username} viewed story {self.story.id}'


class Draft(models.Model):
    DRAFT_TYPES = [
        ('post', 'Post'),
        ('reel', 'Reel'),
        ('story', 'Story'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='drafts')
    draft_type = models.CharField(max_length=10, choices=DRAFT_TYPES)
    caption = models.TextField(blank=True)
    content = models.TextField(blank=True)
    media = models.FileField(upload_to='drafts/', blank=True, null=True)
    edits_data = models.JSONField(default=dict, blank=True)
    music_url = models.URLField(blank=True)
    cover_time = models.FloatField(default=0)
    trim_start = models.FloatField(default=0)
    trim_end = models.FloatField(default=0)
    location = models.CharField(max_length=200, blank=True)
    hashtags = models.CharField(max_length=500, blank=True)
    privacy = models.CharField(max_length=20, default='public')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated']

    def __str__(self):
        return f'{self.draft_type} draft by {self.user.username}'
