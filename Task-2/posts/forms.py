from django import forms
from .models import Post, Comment, Reel, Story


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'image']
        widgets = {
            'content': forms.Textarea(attrs={
                'rows': 3,
                'placeholder': "What's on your mind?",
            }),
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.TextInput(attrs={
                'placeholder': 'Write a comment...',
            }),
        }


class ReelForm(forms.ModelForm):
    class Meta:
        model = Reel
        fields = ['video', 'caption']
        widgets = {
            'caption': forms.TextInput(attrs={
                'placeholder': 'Add a caption...',
            }),
        }


class StoryForm(forms.ModelForm):
    class Meta:
        model = Story
        fields = ['image', 'caption']
        widgets = {
            'caption': forms.TextInput(attrs={
                'placeholder': 'Add text...',
            }),
        }
