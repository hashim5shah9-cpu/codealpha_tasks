from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from posts.models import Post, Comment, Like, Story, StoryView, Reel, ReelLike, ReelComment
from social.models import Follow
import random
import subprocess
import os
from PIL import Image, ImageDraw, ImageFont


def generate_gradient_image(path, colors, size=(600, 600)):
    if os.path.exists(path):
        return
    img = Image.new('RGB', size)
    draw = ImageDraw.Draw(img)
    for y in range(size[1]):
        r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * y / size[1])
        g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * y / size[1])
        b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * y / size[1])
        draw.line([(0, y), (size[0], y)], fill=(r, g, b))
    img.save(path, quality=85)


def generate_profile_pic(path, letter, colors, size=(200, 200)):
    if os.path.exists(path):
        return
    img = Image.new('RGB', size, colors[0])
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 100)
    except (OSError, IOError):
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), letter, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size[0] - w) / 2, (size[1] - h) / 2 - 10), letter, fill='white', font=font)
    img.save(path, quality=85)


class Command(BaseCommand):
    help = 'Seed database with realistic sample data'

    def handle(self, *args, **kwargs):
        StoryView.objects.all().delete()
        Story.objects.all().delete()
        Like.objects.all().delete()
        ReelLike.objects.all().delete()
        ReelComment.objects.all().delete()
        Reel.objects.all().delete()
        Comment.objects.all().delete()
        Post.objects.all().delete()
        Follow.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        os.makedirs('media/posts', exist_ok=True)
        os.makedirs('media/profile_pics', exist_ok=True)

        gradient_colors = [
            ((102, 126, 234), (118, 75, 162)),
            ((236, 72, 153), (168, 85, 247)),
            ((16, 185, 129), (5, 150, 105)),
            ((245, 158, 11), (217, 119, 6)),
            ((239, 68, 68), (220, 38, 38)),
            ((139, 92, 246), (109, 40, 217)),
            ((6, 182, 212), (8, 145, 178)),
            ((249, 115, 22), (234, 88, 12)),
            ((20, 184, 166), (13, 148, 136)),
            ((225, 29, 72), (190, 18, 60)),
            ((124, 58, 237), (109, 40, 217)),
            ((14, 165, 233), (3, 105, 161)),
            ((244, 63, 94), (225, 29, 72)),
            ((99, 102, 241), (79, 70, 229)),
            ((234, 179, 8), (202, 138, 4)),
            ((16, 185, 129), (5, 150, 105)),
            ((168, 85, 247), (139, 92, 246)),
            ((249, 115, 22), (220, 38, 38)),
            ((6, 182, 212), (59, 130, 246)),
            ((236, 72, 153), (244, 63, 94)),
        ]
        for i in range(1, 21):
            generate_gradient_image(f'media/posts/gradient_{i}.jpg', gradient_colors[i - 1])

        profile_colors = [
            ((236, 72, 153), (168, 85, 247)),
            ((99, 102, 241), (79, 70, 229)),
            ((16, 185, 129), (5, 150, 105)),
            ((249, 115, 22), (234, 88, 12)),
            ((139, 92, 246), (109, 40, 217)),
            ((239, 68, 68), (220, 38, 38)),
            ((6, 182, 212), (8, 145, 178)),
            ((244, 63, 94), (225, 29, 72)),
            ((20, 184, 166), (13, 148, 136)),
            ((234, 179, 8), (202, 138, 4)),
            ((124, 58, 237), (109, 40, 217)),
            ((14, 165, 233), (3, 105, 161)),
        ]
        profile_letters = ['S', 'A', 'J', 'M', 'L', 'D', 'E', 'C', 'N', 'Y', 'F', 'P']
        for i in range(1, 13):
            generate_profile_pic(f'media/profile_pics/profile_{i}.jpg', profile_letters[i-1], profile_colors[i - 1])

        users_data = [
            {'username': 'sarah_travels', 'email': 'sarah@example.com', 'first_name': 'Sarah', 'last_name': 'Miller',
             'bio': '✈️ Travel enthusiast | 📸 Photographer | 🌍 30+ countries visited', 'location': 'Los Angeles, CA', 'pic': 'profile_pics/profile_1.jpg'},
            {'username': 'alex_fitness', 'email': 'alex@example.com', 'first_name': 'Alex', 'last_name': 'Thompson',
             'bio': '💪 Fitness Coach | 🏋️ Transform your body | DM for coaching', 'location': 'Miami, FL', 'pic': 'profile_pics/profile_2.jpg'},
            {'username': 'foodie_jenny', 'email': 'jenny@example.com', 'first_name': 'Jenny', 'last_name': 'Chen',
             'bio': '🍕 Food blogger | 👩‍🍳 Home chef | Sharing daily recipes', 'location': 'New York, NY', 'pic': 'profile_pics/profile_3.jpg'},
            {'username': 'tech_mike', 'email': 'mike@example.com', 'first_name': 'Mike', 'last_name': 'Williams',
             'bio': '💻 Software Engineer | 🤖 AI enthusiast | Tech tips daily', 'location': 'San Francisco, CA', 'pic': 'profile_pics/profile_4.jpg'},
            {'username': 'fashionista_luna', 'email': 'luna@example.com', 'first_name': 'Luna', 'last_name': 'Garcia',
             'bio': '👗 Fashion designer | 💄 Beauty tips | Collabs: DM me', 'location': 'Paris, France', 'pic': 'profile_pics/profile_5.jpg'},
            {'username': 'nature_lisa', 'email': 'lisa@example.com', 'first_name': 'Lisa', 'last_name': 'Anderson',
             'bio': '🌿 Nature lover | 🏕️ Outdoor adventures | Environmental activist', 'location': 'Denver, CO', 'pic': 'profile_pics/profile_6.jpg'},
            {'username': 'music_david', 'email': 'david@example.com', 'first_name': 'David', 'last_name': 'Brown',
             'bio': '🎸 Musician | 🎵 Producer | New album out now!', 'location': 'Nashville, TN', 'pic': 'profile_pics/profile_7.jpg'},
            {'username': 'art_emma', 'email': 'emma@example.com', 'first_name': 'Emma', 'last_name': 'Wilson',
             'bio': '🎨 Digital artist | ✨ Creating magic | Commissions open', 'location': 'London, UK', 'pic': 'profile_pics/profile_8.jpg'},
            {'username': 'gaming_chris', 'email': 'chris@example.com', 'first_name': 'Chris', 'last_name': 'Lee',
             'bio': '🎮 Pro gamer | 📺 Streamer | Let\'s play together!', 'location': 'Tokyo, Japan', 'pic': 'profile_pics/profile_9.jpg'},
            {'username': 'yoga_maya', 'email': 'maya@example.com', 'first_name': 'Maya', 'last_name': 'Patel',
             'bio': '🧘 Yoga instructor | 🧘‍♀️ Mindfulness | Online classes available', 'location': 'Bali, Indonesia', 'pic': 'profile_pics/profile_10.jpg'},
            {'username': 'chef_marco', 'email': 'marco@example.com', 'first_name': 'Marco', 'last_name': 'Rossi',
             'bio': '👨‍🍳 Professional Chef | 🍝 Italian cuisine | Cookbook author', 'location': 'Rome, Italy', 'pic': 'profile_pics/profile_11.jpg'},
            {'username': 'photo_nina', 'email': 'nina@example.com', 'first_name': 'Nina', 'last_name': 'Kozlov',
             'bio': '📸 Portrait photographer | 🌆 Urban exploration | Book me!', 'location': 'Berlin, Germany', 'pic': 'profile_pics/profile_12.jpg'},
        ]

        users = []
        for data in users_data:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password='pass1234',
                first_name=data['first_name'],
                last_name=data['last_name']
            )
            user.profile.bio = data['bio']
            user.profile.location = data['location']
            user.profile.profile_pic = data['pic']
            user.profile.save()
            users.append(user)

        posts_data = [
            # Travel posts with images
            {'user': 0, 'content': 'Just arrived in Bali! The sunsets here are absolutely breathtaking 🌅✨', 'image': 'posts/gradient_1.jpg'},
            {'user': 1, 'content': 'Leg day done! 💪 New PR on squats - 315lbs! Consistency is key! 🏋️‍♂️', 'image': 'posts/gradient_2.jpg'},
            {'user': 2, 'content': 'Made homemade pasta from scratch! Nothing beats fresh pasta 🍝👨‍🍳', 'image': 'posts/gradient_3.jpg'},
            {'user': 3, 'content': 'Just built my new gaming PC! RTX 4090 + i9-14900K 🔥', 'image': 'posts/gradient_4.jpg'},
            {'user': 4, 'content': 'OOTD: Vintage vibes today 👗✨ Thrift store finds are the best!', 'image': 'posts/gradient_5.jpg'},
            {'user': 5, 'content': 'National Park adventures! 🏕️ This waterfall was worth the hike!', 'image': 'posts/gradient_6.jpg'},
            {'user': 6, 'content': 'Studio session went late last night 🎵 New track coming Friday!', 'image': 'posts/gradient_7.jpg'},
            {'user': 7, 'content': 'New digital art piece finished! ✨ 20 hours but worth it 🎨', 'image': 'posts/gradient_8.jpg'},
            {'user': 8, 'content': 'Finally hit Diamond rank! 💎 Months of grinding paid off!', 'image': 'posts/gradient_9.jpg'},
            {'user': 9, 'content': 'Morning meditation complete 🧘‍♀️ Starting the day with peace 🙏', 'image': 'posts/gradient_10.jpg'},
            {'user': 10, 'content': 'New recipe: Truffle Risotto 🍚✨ The secret is patience!', 'image': 'posts/gradient_11.jpg'},
            {'user': 11, 'content': 'Golden hour never disappoints 📸🌅 This light is everything!', 'image': 'posts/gradient_12.jpg'},
            {'user': 0, 'content': 'Paris never disappoints! Eiffel Tower at night is pure magic 🗼💕', 'image': 'posts/gradient_13.jpg'},
            {'user': 1, 'content': 'Morning workout complete! 5AM club hits different 💪', 'image': 'posts/gradient_14.jpg'},
            {'user': 2, 'content': 'This smoothie bowl is everything! 🥣 Blueberries and granola!', 'image': 'posts/gradient_15.jpg'},
            {'user': 3, 'content': 'Hot take: AI will change everything in 5 years 🤖', 'image': 'posts/gradient_16.jpg'},
            {'user': 4, 'content': 'New collection drop! 🛍️ Inspired by 90s fashion!', 'image': 'posts/gradient_17.jpg'},
            {'user': 5, 'content': 'Camping under the stars tonight ⭐ No WiFi, no problem!', 'image': 'posts/gradient_18.jpg'},
            {'user': 6, 'content': 'Concert was INSANE! 🎸 Best show ever!', 'image': 'posts/gradient_19.jpg'},
            {'user': 7, 'content': 'Commissions are OPEN! 🖼️ DM for custom portraits!', 'image': 'posts/gradient_20.jpg'},
            {'user': 8, 'content': 'New stream schedule: Every day 7PM EST! 📺', 'image': 'posts/gradient_1.jpg'},
            {'user': 9, 'content': 'New yoga flow tutorial dropping today! 🧘 Perfect for beginners!', 'image': 'posts/gradient_2.jpg'},
            {'user': 10, 'content': 'Farm to table dinner tonight 🌽🥬 Fresh ingredients!', 'image': 'posts/gradient_3.jpg'},
            {'user': 11, 'content': 'Behind the lens today 📷 Fashion editorial in the city!', 'image': 'posts/gradient_4.jpg'},
            {'user': 0, 'content': 'Tokyo street food tour! 🍜 Best ramen ever!', 'image': 'posts/gradient_5.jpg'},
            {'user': 1, 'content': 'Transformed my body in 6 months! 💪 Check bio for coaching!', 'image': 'posts/gradient_6.jpg'},
            {'user': 2, 'content': 'Sushi night! 🍣 Learning to make perfect rolls!', 'image': 'posts/gradient_7.jpg'},
            {'user': 3, 'content': 'Remote work life is the best! ☕ Working from this cafe!', 'image': 'posts/gradient_8.jpg'},
            {'user': 4, 'content': 'Sustainable fashion is the future! 🌿 All thrifted!', 'image': 'posts/gradient_9.jpg'},
            {'user': 5, 'content': 'Wildlife sighting today! 🦌 Family of deer on my hike!', 'image': 'posts/gradient_10.jpg'},
            {'user': 6, 'content': 'Learning piano at 30! 🎹 Never too late to start!', 'image': 'posts/gradient_11.jpg'},
            {'user': 7, 'content': 'Art exhibition opening tonight! 🖼️ So excited!', 'image': 'posts/gradient_12.jpg'},
            {'user': 8, 'content': 'This game is absolutely beautiful! 🎮 Graphics on another level!', 'image': 'posts/gradient_13.jpg'},
            {'user': 9, 'content': '100 day streak! 💪 Consistency is everything!', 'image': 'posts/gradient_14.jpg'},
            {'user': 10, 'content': 'Cooking class: Perfect Italian pasta from scratch! 🇮🇹🍝', 'image': 'posts/gradient_15.jpg'},
            {'user': 11, 'content': 'Black and white photography hits different 🖤🤍', 'image': 'posts/gradient_16.jpg'},
            {'user': 0, 'content': 'Exploring the Swiss Alps today 🏔️ Views are insane!', 'image': 'posts/gradient_17.jpg'},
            {'user': 1, 'content': 'Pre-workout meal: Chicken, rice, veggies! 🍗🍚', 'image': 'posts/gradient_18.jpg'},
            {'user': 2, 'content': 'My secret burger recipe 🍔 Drop a 🔥 for the recipe!', 'image': 'posts/gradient_19.jpg'},
            {'user': 3, 'content': 'Just shipped a new feature! Users love it 💻✨', 'image': 'posts/gradient_20.jpg'},
            {'user': 4, 'content': 'Matching outfits with my bestie! 👯‍♀️ Twinning!', 'image': 'posts/gradient_1.jpg'},
            {'user': 5, 'content': 'Beach cleanup day! 🏖️ Protect our oceans! 🌊', 'image': 'posts/gradient_2.jpg'},
            {'user': 6, 'content': 'Just dropped my new single! 🎶 Link in bio!', 'image': 'posts/gradient_3.jpg'},
            {'user': 7, 'content': 'Behind the scenes of my latest painting 🎨', 'image': 'posts/gradient_4.jpg'},
            {'user': 8, 'content': 'Setting up the new gaming room! 🎮 RGB everything!', 'image': 'posts/gradient_5.jpg'},
            {'user': 9, 'content': 'Yoga by the beach this morning 🏖️🧘 Ocean sounds!', 'image': 'posts/gradient_6.jpg'},
            {'user': 10, 'content': 'Sunday sauce simmering all day 🍝 Family recipe!', 'image': 'posts/gradient_7.jpg'},
            {'user': 11, 'content': 'Drone shots are a game changer! 🚁 World from above!', 'image': 'posts/gradient_8.jpg'},
            {'user': 0, 'content': 'Beach vibes in Maldives 🏝️ Crystal clear water!', 'image': 'posts/gradient_9.jpg'},
            {'user': 1, 'content': 'Rest day but still getting steps in! 🚶‍♂️ 10K daily!', 'image': 'posts/gradient_10.jpg'},
            {'user': 2, 'content': 'Sunday brunch vibes 🥞 Fluffy pancakes recipe below!', 'image': 'posts/gradient_11.jpg'},
            {'user': 3, 'content': 'Coding tutorial tomorrow! Full-stack React & Django 🚀', 'image': 'posts/gradient_12.jpg'},
            {'user': 4, 'content': 'Get ready with me! 💄 Full glam for tonight!', 'image': 'posts/gradient_13.jpg'},
            {'user': 5, 'content': 'Plant parent goals! 🪴 5 new plants added!', 'image': 'posts/gradient_14.jpg'},
            {'user': 6, 'content': 'Jam session with the band 🎤 Practicing for weeks!', 'image': 'posts/gradient_15.jpg'},
            {'user': 7, 'content': 'Procreate tips tomorrow! 📱 Stay tuned!', 'image': 'posts/gradient_16.jpg'},
            {'user': 8, 'content': 'Team won the tournament! 🏆 Prize pool was insane!', 'image': 'posts/gradient_17.jpg'},
            {'user': 9, 'content': 'Balance is not found, it\'s created 🧘‍♀️✨', 'image': 'posts/gradient_18.jpg'},
            {'user': 10, 'content': 'My cookbook is available! 📖 100 recipes!', 'image': 'posts/gradient_19.jpg'},
            {'user': 11, 'content': 'New portrait series: Urban Stories 📸', 'image': 'posts/gradient_20.jpg'},
        ]

        created_posts = []
        for data in posts_data:
            post = Post.objects.create(
                user=users[data['user']],
                content=data['content'],
                image=data.get('image', '')
            )
            created_posts.append(post)

        for post in created_posts:
            num_likes = random.randint(15, 100)
            likers = random.sample(users, min(num_likes, len(users)))
            for user in likers:
                Like.objects.get_or_create(user=user, post=post)

        comment_texts = [
            "This is amazing! 😍", "Love this so much! ❤️", "Goals! 🔥",
            "Need to try this!", "So beautiful!", "Incredible! 🙌",
            "Wow, just wow!", "This made my day! 💕", "Absolutely stunning!",
            "Can't stop looking at this!", "Yes! So true! 👏", "Living your best life!",
            "Inspo! 🌟", "This is everything!", "Obsessed with this!",
            "You're killing it! 💪", "So proud of you!", "Keep inspiring us! ✨",
            "Best thing I've seen today!", "Tutorial please! 🙏",
        ]

        for post in created_posts:
            num_comments = random.randint(3, 12)
            commenters = random.sample(users, min(num_comments, len(users)))
            for user in commenters:
                if user != post.user:
                    Comment.objects.create(
                        user=user, post=post,
                        content=random.choice(comment_texts)
                    )

        follow_pairs = [
            (0, 1), (0, 2), (0, 3), (0, 4), (0, 5),
            (1, 0), (1, 2), (1, 3), (1, 6), (1, 7),
            (2, 0), (2, 1), (2, 4), (2, 7), (2, 8),
            (3, 0), (3, 1), (3, 5), (3, 8), (3, 9),
            (4, 0), (4, 2), (4, 6), (4, 9), (4, 10),
            (5, 1), (5, 3), (5, 7), (5, 10), (5, 11),
            (6, 0), (6, 4), (6, 8), (6, 11),
            (7, 2), (7, 5), (7, 9), (7, 0),
            (8, 3), (8, 6), (8, 10), (8, 1),
            (9, 4), (9, 7), (9, 11), (9, 2),
            (10, 5), (10, 8), (10, 0), (10, 3),
            (11, 6), (11, 9), (11, 1), (11, 4),
        ]

        for follower_idx, following_idx in follow_pairs:
            if follower_idx < len(users) and following_idx < len(users):
                Follow.objects.get_or_create(
                    follower=users[follower_idx],
                    following=users[following_idx]
                )

        story_captions = [
            "Good morning! ☀️", "Coffee time ☕", "Workout done! 💪",
            "Vibes ✨", "Let's go! 🚀", "Beautiful day! 🌸",
            "Can't wait! 🎉", "So happy! 😊", "Adventure time! 🏔️",
            "Dinner ready! 🍽️", "Night out! 🌙", "New beginnings! 🌅",
            "Grateful 🙏", "Living life! 💫", "Weekend mood! 🎊",
            "Sunset vibes 🌅", "Beach day! 🏖️", "Food time! 🍕",
            "Gym session 💪", "Movie night 🎬",
        ]

        for user in users:
            num_stories = random.randint(2, 5)
            for j in range(num_stories):
                Story.objects.create(
                    user=user,
                    image=f'posts/gradient_{random.randint(1, 20)}.jpg',
                    caption=random.choice(story_captions),
                    expires_at=timezone.now() + timedelta(hours=random.randint(1, 23))
                )

        media_reels_dir = os.path.join('media', 'reels')
        os.makedirs(media_reels_dir, exist_ok=True)
        reel_colors = [
            ('fitness_1.mp4', '0x6366F1'), ('travel_2.mp4', '0xEC4899'),
            ('cooking_3.mp4', '0x10B981'), ('dance_4.mp4', '0xF59E0B'),
            ('nature_5.mp4', '0xEF4444'), ('music_6.mp4', '0x8B5CF6'),
            ('art_7.mp4', '0x06B6D4'), ('gaming_8.mp4', '0xF97316'),
            ('yoga_9.mp4', '0x14B8A6'), ('fashion_10.mp4', '0xE11D48'),
            ('tech_11.mp4', '0x7C3AED'), ('food_12.mp4', '0x0EA5E9'),
        ]
        for fname, color in reel_colors:
            fpath = os.path.join(media_reels_dir, fname)
            if not os.path.exists(fpath):
                subprocess.run([
                    'ffmpeg', '-y', '-f', 'lavfi', '-i', f'color=c={color}:s=360x640:d=3',
                    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
                    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', fpath
                ], capture_output=True)

        reels_data = [
            {'user': 1, 'video': 'reels/fitness_1.mp4', 'caption': 'Full body workout! Try this 5-move routine 💪🔥'},
            {'user': 0, 'video': 'reels/travel_2.mp4', 'caption': 'Sunset in Santorini is unreal 🌅✈️'},
            {'user': 2, 'video': 'reels/cooking_3.mp4', 'caption': 'Making fresh pasta step by step 🍝👨‍🍳'},
            {'user': 4, 'video': 'reels/dance_4.mp4', 'caption': 'New choreography! Who wants a tutorial? 💃✨'},
            {'user': 5, 'video': 'reels/nature_5.mp4', 'caption': 'Found this hidden waterfall on my hike 🌿💧'},
            {'user': 6, 'video': 'reels/music_6.mp4', 'caption': 'Jam session vibes 🎸🎵 New song preview!'},
            {'user': 7, 'video': 'reels/art_7.mp4', 'caption': 'Speed painting process 🎨 10 hours in 60 seconds'},
            {'user': 8, 'video': 'reels/gaming_8.mp4', 'caption': 'Insane clutch! 1v5 ace 🎮🔥'},
            {'user': 9, 'video': 'reels/yoga_9.mp4', 'caption': 'Morning flow to start your day right 🧘‍♀️✨'},
            {'user': 5, 'video': 'reels/fashion_10.mp4', 'caption': 'Outfit transition! Thrift flip magic 👗💫'},
            {'user': 3, 'video': 'reels/tech_11.mp4', 'caption': 'Coding a full app in 10 minutes 💻🚀'},
            {'user': 10, 'video': 'reels/food_12.mp4', 'caption': 'Making the perfect tiramisu 🍰🇮🇹'},
            {'user': 1, 'video': 'reels/fitness_1.mp4', 'caption': 'Leg day essentials! Don\'t skip these exercises 🦵💪'},
            {'user': 0, 'video': 'reels/travel_2.mp4', 'caption': 'Tokyo at night is another world 🌃🇯🇵'},
            {'user': 11, 'video': 'reels/art_7.mp4', 'caption': 'Portrait photography tips 📸 Lighting is everything'},
            {'user': 2, 'video': 'reels/cooking_3.mp4', 'caption': '5 minute breakfast ideas 🥞🍳 Quick and healthy!'},
            {'user': 6, 'video': 'reels/music_6.mp4', 'caption': 'Piano cover of my favorite song 🎹✨'},
            {'user': 4, 'video': 'reels/dance_4.mp4', 'caption': 'GRWM for date night 💄👗 Full tutorial'},
            {'user': 9, 'video': 'reels/yoga_9.mp4', 'caption': 'Bedtime yoga for better sleep 🌙🧘‍♀️'},
            {'user': 8, 'video': 'reels/gaming_8.mp4', 'caption': 'This game has the best graphics ever! 🎮😍'},
        ]

        created_reels = []
        for data in reels_data:
            reel = Reel.objects.create(
                user=users[data['user']],
                video=data['video'],
                caption=data['caption'],
            )
            created_reels.append(reel)

        for reel in created_reels:
            num_likes = random.randint(10, 80)
            likers = random.sample(users, min(num_likes, len(users)))
            for user in likers:
                ReelLike.objects.get_or_create(user=user, reel=reel)

        reel_comment_texts = [
            "This is fire! 🔥", "Need this in my life!", "So satisfying to watch!",
            "Tutorial please! 🙏", "Absolutely amazing!", "You're so talented!",
            "Goals honestly 💯", "Can't stop watching!", "This made my day!",
            "Bookmarking this! 🔖", "Yes! More content like this!",
            "Incredible work!", "You killed it! 💪", "Obsessed!",
        ]

        for reel in created_reels:
            num_comments = random.randint(2, 8)
            commenters = random.sample(users, min(num_comments, len(users)))
            for user in commenters:
                if user != reel.user:
                    ReelComment.objects.create(
                        user=user, reel=reel,
                        content=random.choice(reel_comment_texts)
                    )

        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(users)} users, {len(created_posts)} posts, {len(created_reels)} reels, stories, and connections!'))
