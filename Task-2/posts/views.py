from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Exists, OuterRef, Count, Prefetch
from .models import Post, Comment, Like, Reel, ReelLike, ReelComment, Story, StoryView, Draft
from .forms import PostForm, CommentForm, ReelForm, StoryForm
from social.models import Follow
from django.utils import timezone
from datetime import timedelta
import json


@login_required
def feed(request):
    user = request.user
    now = timezone.now()

    post_likes = Like.objects.filter(user=user, post=OuterRef('pk'))
    reel_likes = ReelLike.objects.filter(user=user, reel=OuterRef('pk'))

    posts = Post.objects.select_related('user', 'user__profile').prefetch_related(
        Prefetch('comments', queryset=Comment.objects.select_related('user'))
    ).annotate(
        is_liked=Exists(post_likes),
        likes_count_agg=Count('likes', distinct=True),
        comments_count_agg=Count('comments', distinct=True),
    ).order_by('-created')[:30]

    reels = Reel.objects.select_related('user', 'user__profile').prefetch_related(
        Prefetch('reel_comments', queryset=ReelComment.objects.select_related('user'))
    ).annotate(
        is_liked=Exists(reel_likes),
        likes_count_agg=Count('reel_likes', distinct=True),
        comments_count_agg=Count('reel_comments', distinct=True),
    ).order_by('-created')[:10]

    active_stories = Story.objects.filter(
        expires_at__gt=now
    ).select_related('user', 'user__profile').order_by('-created')

    viewed_story_ids = set(
        StoryView.objects.filter(
            user=user, story__in=active_stories
        ).values_list('story_id', flat=True)
    )

    stories_by_user = {}
    for story in active_stories:
        u_id = story.user.id
        if u_id not in stories_by_user:
            stories_by_user[u_id] = {
                'user': story.user,
                'stories': [],
                'all_viewed': True
            }
        stories_by_user[u_id]['stories'].append(story)
        if story.id not in viewed_story_ids:
            stories_by_user[u_id]['all_viewed'] = False

    my_story_data = stories_by_user.pop(user.id, None)
    other_stories = list(stories_by_user.values())

    context = {
        'posts': posts,
        'reels': reels,
        'my_story': my_story_data,
        'other_stories': other_stories,
        'stories': ([my_story_data] if my_story_data else []) + other_stories,
    }
    return render(request, 'posts/feed.html', context)


@login_required
def create_post(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.user = request.user
            post.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'post_id': post.id,
                    'content': post.content,
                    'username': post.user.username,
                    'created': post.created.strftime('%b %d, %Y %H:%M'),
                })
            return redirect('feed')
    return redirect('feed')


@login_required
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)
    post.delete()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok'})
    return redirect('feed')


@login_required
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            form.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'content': post.content,
                    'image_url': post.image.url if post.image else None,
                })
            return redirect('feed')
    else:
        form = PostForm(instance=post)
    return render(request, 'posts/edit_post.html', {'form': form, 'post': post})


@login_required
def like_toggle(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    like, created = Like.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
        is_liked = False
    else:
        is_liked = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'is_liked': is_liked,
            'likes_count': post.likes.count(),
        })

    return redirect('feed')


@login_required
def add_comment(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.user = request.user
            comment.post = post
            comment.save()

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'comment_id': comment.id,
                    'content': comment.content,
                    'username': comment.user.username,
                    'created': comment.created.strftime('%b %d, %Y %H:%M'),
                })
            return redirect('feed')
    return redirect('feed')


@login_required
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id, user=request.user)
    comment.delete()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok'})
    return redirect('feed')


@login_required
def reels_page(request):
    reel_likes = ReelLike.objects.filter(user=request.user, reel=OuterRef('pk'))
    reels = Reel.objects.select_related('user', 'user__profile').prefetch_related(
        Prefetch('reel_comments', queryset=ReelComment.objects.select_related('user'))
    ).annotate(
        is_liked=Exists(reel_likes),
        likes_count_agg=Count('reel_likes', distinct=True),
        comments_count_agg=Count('reel_comments', distinct=True),
    ).order_by('-created')
    context = {'reels': reels}
    return render(request, 'posts/reels.html', context)


@login_required
@login_required
def create_reel(request):
    if request.method == 'POST':
        form = ReelForm(request.POST, request.FILES)
        if form.is_valid():
            reel = form.save(commit=False)
            reel.user = request.user
            reel.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'reel_id': reel.id,
                    'caption': reel.caption,
                })
            return redirect('reels')
    return redirect('reels')


@login_required
def reel_like_toggle(request, reel_id):
    reel = get_object_or_404(Reel, id=reel_id)
    like, created = ReelLike.objects.get_or_create(user=request.user, reel=reel)
    if not created:
        like.delete()
        is_liked = False
    else:
        is_liked = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'is_liked': is_liked,
            'likes_count': reel.reel_likes.count(),
        })

    return redirect('reels')


@login_required
def add_reel_comment(request, reel_id):
    reel = get_object_or_404(Reel, id=reel_id)
    if request.method == 'POST':
        content = request.POST.get('content', '')
        if content:
            comment = ReelComment.objects.create(user=request.user, reel=reel, content=content)
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'comment_id': comment.id,
                    'content': comment.content,
                    'username': comment.user.username,
                    'created': comment.created.strftime('%b %d, %Y %H:%M'),
                })
    return redirect('reels')


@login_required
def delete_reel(request, reel_id):
    reel = get_object_or_404(Reel, id=reel_id, user=request.user)
    reel.delete()
    return redirect('reels')


@login_required
def edit_reel(request, reel_id):
    reel = get_object_or_404(Reel, id=reel_id, user=request.user)
    if request.method == 'POST':
        form = ReelForm(request.POST, request.FILES, instance=reel)
        if form.is_valid():
            form.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'caption': reel.caption,
                    'video_url': reel.video.url if reel.video else None,
                    'cover_url': reel.cover.url if reel.cover else None,
                })
            return redirect('reels')
    else:
        form = ReelForm(instance=reel)
    return render(request, 'posts/edit_reel.html', {'form': form, 'reel': reel})


@login_required
def stories_page(request):
    stories = Story.objects.filter(expires_at__gt=timezone.now()).select_related('user', 'user__profile').order_by('-created')
    stories_by_user = {}
    for story in stories:
        if story.user.id not in stories_by_user:
            stories_by_user[story.user.id] = {
                'user': story.user,
                'stories': [],
                'viewed': StoryView.objects.filter(user=request.user, story__in=story.user.stories.filter(expires_at__gt=timezone.now())).exists()
            }
        stories_by_user[story.user.id]['stories'].append(story)
    context = {'stories': list(stories_by_user.values())}
    return render(request, 'posts/stories.html', context)


@login_required
def create_story(request):
    if request.method == 'POST':
        form = StoryForm(request.POST, request.FILES)
        if form.is_valid():
            story = form.save(commit=False)
            story.user = request.user
            story.expires_at = timezone.now() + timedelta(hours=24)
            story.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'story_id': story.id,
                    'caption': story.caption,
                })
            next_url = request.POST.get('next') or request.META.get('HTTP_REFERER') or 'feed'
            return redirect(next_url)
    return redirect('feed')


@login_required
def view_story(request, story_id):
    story = get_object_or_404(Story, id=story_id)
    StoryView.objects.get_or_create(user=request.user, story=story)
    user_stories = Story.objects.filter(user=story.user, expires_at__gt=timezone.now()).order_by('created')
    stories_data = []
    for s in user_stories:
        viewed = StoryView.objects.filter(user=request.user, story=s).exists()
        stories_data.append({'story': s, 'viewed': viewed})
    context = {
        'story_user': story.user,
        'current_story': story,
        'user_stories': stories_data,
    }
    return render(request, 'posts/view_story.html', context)


@login_required
def delete_story(request, story_id):
    story = get_object_or_404(Story, id=story_id, user=request.user)
    story.delete()
    return redirect('stories')


@login_required
def save_draft(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            draft_id = data.get('draft_id')
            
            if draft_id:
                draft = get_object_or_404(Draft, id=draft_id, user=request.user)
            else:
                draft = Draft(user=request.user, draft_type=data.get('draft_type', 'post'))
            
            draft.caption = data.get('caption', '')
            draft.content = data.get('content', '')
            draft.edits_data = data.get('edits_data', {})
            draft.music_url = data.get('music_url', '')
            draft.cover_time = data.get('cover_time', 0)
            draft.trim_start = data.get('trim_start', 0)
            draft.trim_end = data.get('trim_end', 0)
            draft.location = data.get('location', '')
            draft.hashtags = data.get('hashtags', '')
            draft.privacy = data.get('privacy', 'public')
            draft.save()
            
            return JsonResponse({
                'status': 'ok',
                'draft_id': draft.id,
                'message': 'Draft saved successfully'
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required
def get_drafts(request):
    drafts = Draft.objects.filter(user=request.user).order_by('-updated')
    drafts_data = [{
        'id': d.id,
        'draft_type': d.draft_type,
        'caption': d.caption,
        'content': d.content,
        'media_url': d.media.url if d.media else None,
        'edits_data': d.edits_data,
        'created': d.created.strftime('%b %d, %Y'),
        'updated': d.updated.strftime('%b %d, %Y'),
    } for d in drafts]
    return JsonResponse({'drafts': drafts_data})


@login_required
def delete_draft(request, draft_id):
    draft = get_object_or_404(Draft, id=draft_id, user=request.user)
    draft.delete()
    return JsonResponse({'status': 'ok'})


@login_required
def create_post_editor(request):
    drafts = Draft.objects.filter(user=request.user, draft_type='post').order_by('-updated')[:5]
    context = {'drafts': drafts, 'editor_type': 'post'}
    return render(request, 'posts/editor.html', context)


@login_required
def create_reel_editor(request):
    drafts = Draft.objects.filter(user=request.user, draft_type='reel').order_by('-updated')[:5]
    context = {'drafts': drafts, 'editor_type': 'reel'}
    return render(request, 'posts/editor.html', context)


@login_required
def create_story_editor(request):
    drafts = Draft.objects.filter(user=request.user, draft_type='story').order_by('-updated')[:5]
    context = {'drafts': drafts, 'editor_type': 'story'}
    return render(request, 'posts/editor.html', context)
