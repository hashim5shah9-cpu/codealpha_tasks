document.addEventListener('DOMContentLoaded', function() {
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    document.querySelectorAll('.comment-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var postCard = this.closest('.post-card');
            var commentsSection = postCard.querySelector('.comments-section');
            if (commentsSection) {
                commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    document.querySelectorAll('.reel-comment-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var reelCard = this.closest('.reel-card');
            var commentsSection = reelCard.querySelector('.reel-comments-section');
            if (commentsSection) {
                commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    document.querySelectorAll('.like-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var btn = this.querySelector('.action-btn');

            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.status === 'ok') {
                    var svg = btn.querySelector('svg');
                    var count = btn.querySelector('.likes-count');

                    if (data.is_liked) {
                        btn.classList.add('liked');
                        svg.setAttribute('fill', 'currentColor');
                    } else {
                        btn.classList.remove('liked');
                        svg.setAttribute('fill', 'none');
                    }
                    count.textContent = data.likes_count;
                }
            });
        });
    });

    document.querySelectorAll('.follow-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var btn = this.querySelector('.follow-btn');

            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.status === 'ok') {
                    if (data.is_following) {
                        btn.textContent = 'Following';
                        btn.classList.remove('btn-primary');
                        btn.classList.add('btn-secondary');
                    } else {
                        btn.textContent = 'Follow';
                        btn.classList.remove('btn-secondary');
                        btn.classList.add('btn-primary');
                    }
                    var followersCount = document.querySelector('.followers-count');
                    if (followersCount) {
                        followersCount.textContent = data.followers_count;
                    }
                }
            });
        });
    });

    var messages = document.querySelectorAll('.alert');
    messages.forEach(function(msg) {
        setTimeout(function() {
            msg.style.transition = 'opacity 0.3s';
            msg.style.opacity = '0';
            setTimeout(function() { msg.remove(); }, 300);
        }, 3000);
    });

    // Helper function to manage media upload previews (photos & videos)
    function bindMediaPreview(config) {
        var input = document.getElementById(config.inputId);
        var previewBox = document.getElementById(config.previewBoxId);
        var mediaEl = document.getElementById(config.mediaElId);
        var removeBtn = config.removeBtnId ? document.getElementById(config.removeBtnId) : null;
        var labelEl = config.labelId ? document.getElementById(config.labelId) : null;
        var currentObjectURL = null;

        if (!input || !previewBox || !mediaEl) return;

        input.addEventListener('change', function() {
            var file = this.files && this.files[0];
            if (file) {
                if (currentObjectURL) {
                    URL.revokeObjectURL(currentObjectURL);
                }
                currentObjectURL = URL.createObjectURL(file);
                mediaEl.src = currentObjectURL;
                previewBox.style.display = 'block';
                if (labelEl) {
                    labelEl.style.display = 'none';
                }
                if (config.isVideo && mediaEl.load) {
                    mediaEl.load();
                }
            }
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                input.value = '';
                if (currentObjectURL) {
                    URL.revokeObjectURL(currentObjectURL);
                    currentObjectURL = null;
                }
                mediaEl.src = '';
                previewBox.style.display = 'none';
                if (labelEl) {
                    labelEl.style.display = 'flex';
                }
            });
        }
    }

    // Bind previews for Feed Post creation
    bindMediaPreview({
        inputId: 'post-image',
        previewBoxId: 'postMediaPreview',
        mediaElId: 'postPreviewImg',
        removeBtnId: 'removePostMedia'
    });

    // Bind previews for Reel creation (video)
    bindMediaPreview({
        inputId: 'reel-video',
        previewBoxId: 'reelMediaPreview',
        mediaElId: 'reelPreviewVideo',
        removeBtnId: 'removeReelMedia',
        labelId: 'reelUploadLabel',
        isVideo: true
    });

    // Bind previews for Story creation
    bindMediaPreview({
        inputId: 'story-image',
        previewBoxId: 'storyMediaPreview',
        mediaElId: 'storyPreviewImg',
        removeBtnId: 'removeStoryMedia',
        labelId: 'storyUploadLabel'
    });

    // Bind previews for Edit Post page
    bindMediaPreview({
        inputId: 'image',
        previewBoxId: 'editPostMediaPreview',
        mediaElId: 'editPostPreviewImg',
        removeBtnId: 'removeEditPostMedia'
    });

    // Bind previews for Edit Reel page (video)
    bindMediaPreview({
        inputId: 'video',
        previewBoxId: 'editReelMediaPreview',
        mediaElId: 'editReelPreviewVideo',
        removeBtnId: 'removeEditReelMedia',
        isVideo: true
    });

    // Bind preview for Edit Profile photo
    var profilePicInput = document.getElementById('id_profile_pic');
    if (profilePicInput) {
        profilePicInput.addEventListener('change', function() {
            var file = this.files && this.files[0];
            if (file) {
                var url = URL.createObjectURL(file);
                var container = document.getElementById('profilePicContainer');
                if (container) {
                    container.innerHTML = '<img id="profilePicImg" src="' + url + '" alt="Profile">';
                }
            }
        });
    }

    // Quick Story Modal Handling on Home Feed
    var quickStoryModal = document.getElementById('quickStoryModal');
    var openStoryBtns = document.querySelectorAll('.open-story-modal-btn');
    var closeStoryModal = document.getElementById('closeStoryModal');
    var cancelStoryModal = document.getElementById('cancelStoryModal');

    if (quickStoryModal) {
        openStoryBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                quickStoryModal.style.display = 'flex';
            });
        });

        if (closeStoryModal) {
            closeStoryModal.addEventListener('click', function() {
                quickStoryModal.style.display = 'none';
            });
        }
        if (cancelStoryModal) {
            cancelStoryModal.addEventListener('click', function() {
                quickStoryModal.style.display = 'none';
            });
        }
    }

    // Bind previews for Quick Home Story Modal
    bindMediaPreview({
        inputId: 'home-story-image',
        previewBoxId: 'homeStoryMediaPreview',
        mediaElId: 'homeStoryPreviewImg',
        removeBtnId: 'removeHomeStoryMedia',
        labelId: 'homeStoryUploadLabel'
    });
});
