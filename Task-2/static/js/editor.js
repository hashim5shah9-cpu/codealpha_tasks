document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const mediaInput = document.getElementById('mediaInput');
    const selectMediaBtn = document.getElementById('selectMediaBtn');
    const changeMediaBtn = document.getElementById('changeMediaBtn');
    const editCanvas = document.getElementById('editCanvas');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const ctx = editCanvas.getContext('2d');

    let currentMedia = null;
    let mediaType = 'image';
    const editorType = typeof editor_type !== 'undefined' ? editor_type : 'post';
    let edits = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        warmth: 0,
        blur: 0,
        rotation: 0,
        flipH: false,
        flipV: false,
        filter: 'none',
        texts: [],
        stickers: []
    };
    let undoStack = [];
    let redoStack = [];

    // Tab switching
    document.querySelectorAll('.tool-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab + 'Panel').classList.add('active');
        });
    });

    // Step navigation
    function goToStep(step) {
        document.querySelectorAll('.editor-step').forEach(s => s.classList.remove('active'));
        document.getElementById('step' + step).classList.add('active');
    }

    selectMediaBtn.addEventListener('click', () => mediaInput.click());
    changeMediaBtn.addEventListener('click', () => mediaInput.click());

    mediaInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        currentMedia = file;
        mediaType = file.type.startsWith('video/') ? 'video' : 'image';

        if (mediaType === 'image') {
            const reader = new FileReader();
            reader.onload = function(ev) {
                imagePreview.src = ev.target.result;
                imagePreview.style.display = 'block';
                videoPreview.style.display = 'none';
                editCanvas.style.display = 'none';

                imagePreview.onload = function() {
                    editCanvas.width = imagePreview.naturalWidth;
                    editCanvas.height = imagePreview.naturalHeight;
                    applyEdits();
                };
            };
            reader.readAsDataURL(file);
        } else {
            const url = URL.createObjectURL(file);
            videoPreview.src = url;
            videoPreview.style.display = 'block';
            imagePreview.style.display = 'none';
            editCanvas.style.display = 'none';
        }

        goToStep(2);
    });

    // Save state for undo
    function saveState() {
        undoStack.push(JSON.parse(JSON.stringify(edits)));
        redoStack = [];
        if (undoStack.length > 30) undoStack.shift();
    }

    // Apply edits to canvas
    function applyEdits() {
        if (mediaType !== 'image' || !imagePreview.src) return;

        const img = new Image();
        img.onload = function() {
            editCanvas.width = img.naturalWidth;
            editCanvas.height = img.naturalHeight;
            editCanvas.style.display = 'block';
            imagePreview.style.display = 'none';

            ctx.clearRect(0, 0, editCanvas.width, editCanvas.height);
            ctx.save();

            // Apply rotation and flip
            ctx.translate(editCanvas.width / 2, editCanvas.height / 2);
            ctx.rotate((edits.rotation * Math.PI) / 180);
            ctx.scale(edits.flipH ? -1 : 1, edits.flipV ? -1 : 1);
            ctx.translate(-editCanvas.width / 2, -editCanvas.height / 2);

            // Apply filters
            let filterStr = '';
            if (edits.blur > 0) filterStr += `blur(${edits.blur}px) `;
            if (edits.brightness !== 0) filterStr += `brightness(${1 + edits.brightness / 100}) `;
            if (edits.contrast !== 0) filterStr += `contrast(${1 + edits.contrast / 100}) `;
            if (edits.saturation !== 0) filterStr += `saturate(${1 + edits.saturation / 100}) `;
            if (edits.filter === 'grayscale') filterStr += 'grayscale(100%) ';
            if (edits.filter === 'sepia') filterStr += 'sepia(100%) ';
            if (edits.filter === 'vintage') filterStr += 'sepia(50%) contrast(90%) ';
            if (edits.filter === 'warm') filterStr += 'sepia(30%) saturate(150%) ';
            if (edits.filter === 'cool') filterStr += 'hue-rotate(30deg) saturate(120%) ';
            if (edits.filter === 'dramatic') filterStr += 'contrast(150%) brightness(90%) ';
            if (edits.filter === 'fade') filterStr += 'contrast(80%) brightness(110%) saturate(80%) ';
            if (edits.filter === 'vivid') filterStr += 'saturate(200%) contrast(110%) ';
            if (edits.filter === 'retro') filterStr += 'sepia(40%) contrast(110%) hue-rotate(-20deg) ';

            if (filterStr) ctx.filter = filterStr.trim();

            ctx.drawImage(img, 0, 0);
            ctx.restore();

            // Draw texts
            edits.texts.forEach(text => {
                ctx.font = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic ' : ''}${text.size}px ${text.font}`;
                ctx.fillStyle = text.color;
                ctx.textAlign = 'center';
                ctx.fillText(text.content, text.x, text.y);
            });

            // Draw stickers
            edits.stickers.forEach(sticker => {
                ctx.font = `${sticker.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(sticker.emoji, sticker.x, sticker.y);
            });
        };
        img.src = imagePreview.src;
    }

    // Slider controls
    const sliders = ['brightness', 'contrast', 'saturation', 'warmth', 'blur'];
    sliders.forEach(name => {
        const slider = document.getElementById(name + 'Slider');
        const value = document.getElementById(name + 'Value');
        if (slider) {
            slider.addEventListener('input', function() {
                saveState();
                edits[name] = parseInt(this.value);
                value.textContent = this.value;
                applyEdits();
            });
        }
    });

    // Rotation and flip
    document.getElementById('rotateLeftBtn').addEventListener('click', function() {
        saveState();
        edits.rotation = (edits.rotation - 90) % 360;
        applyEdits();
    });

    document.getElementById('rotateRightBtn').addEventListener('click', function() {
        saveState();
        edits.rotation = (edits.rotation + 90) % 360;
        applyEdits();
    });

    document.getElementById('flipHorizontalBtn').addEventListener('click', function() {
        saveState();
        edits.flipH = !edits.flipH;
        applyEdits();
    });

    document.getElementById('flipVerticalBtn').addEventListener('click', function() {
        saveState();
        edits.flipV = !edits.flipV;
        applyEdits();
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            saveState();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            edits.filter = this.dataset.filter;
            applyEdits();
        });
    });

    // Crop
    document.querySelectorAll('.crop-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.crop-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    document.getElementById('applyCropBtn').addEventListener('click', function() {
        // Crop functionality would go here
        alert('Crop applied!');
    });

    // Text
    document.getElementById('addTextBtn').addEventListener('click', function() {
        const text = document.getElementById('textInput').value;
        if (!text) return;

        saveState();
        edits.texts.push({
            content: text,
            color: document.getElementById('textColor').value,
            size: document.getElementById('fontSizeSlider').value,
            font: document.getElementById('fontFamily').value,
            bold: document.getElementById('boldBtn').classList.contains('active'),
            italic: document.getElementById('italicBtn').classList.contains('active'),
            x: editCanvas.width / 2,
            y: editCanvas.height / 2
        });
        document.getElementById('textInput').value = '';
        applyEdits();
    });

    // Text style buttons
    ['boldBtn', 'italicBtn', 'underlineBtn'].forEach(id => {
        document.getElementById(id).addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Stickers
    document.querySelectorAll('.sticker-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            saveState();
            edits.stickers.push({
                emoji: this.dataset.emoji,
                x: editCanvas.width / 2,
                y: editCanvas.height / 2,
                size: 48
            });
            applyEdits();
        });
    });

    // Music selection
    document.querySelectorAll('.music-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.music-item').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Undo/Redo
    document.getElementById('undoBtn').addEventListener('click', function() {
        if (undoStack.length === 0) return;
        redoStack.push(JSON.parse(JSON.stringify(edits)));
        edits = undoStack.pop();
        updateSliders();
        applyEdits();
    });

    document.getElementById('redoBtn').addEventListener('click', function() {
        if (redoStack.length === 0) return;
        undoStack.push(JSON.parse(JSON.stringify(edits)));
        edits = redoStack.pop();
        updateSliders();
        applyEdits();
    });

    document.getElementById('resetBtn').addEventListener('click', function() {
        saveState();
        edits = {
            brightness: 0, contrast: 0, saturation: 0, warmth: 0, blur: 0,
            rotation: 0, flipH: false, flipV: false, filter: 'none',
            texts: [], stickers: []
        };
        updateSliders();
        applyEdits();
    });

    function updateSliders() {
        sliders.forEach(name => {
            const slider = document.getElementById(name + 'Slider');
            const value = document.getElementById(name + 'Value');
            if (slider) {
                slider.value = edits[name];
                value.textContent = edits[name];
            }
        });
    }

    // Navigation
    document.getElementById('backToStep1').addEventListener('click', () => goToStep(1));
    document.getElementById('nextToStep3').addEventListener('click', function() {
        // Update final preview
        const finalCanvas = document.getElementById('finalCanvas');
        if (mediaType === 'image') {
            finalCanvas.width = editCanvas.width;
            finalCanvas.height = editCanvas.height;
            finalCanvas.getContext('2d').drawImage(editCanvas, 0, 0);
            finalCanvas.style.display = 'block';
            document.getElementById('finalVideo').style.display = 'none';
        } else {
            finalCanvas.style.display = 'none';
            document.getElementById('finalVideo').style.display = 'block';
        }
        goToStep(3);
    });

    document.getElementById('backToStep2').addEventListener('click', () => goToStep(2));

    // Preview modal
    document.getElementById('publishBtn').addEventListener('click', function() {
        document.getElementById('previewCaption').textContent = document.getElementById('captionInput').value;
        document.getElementById('previewHashtags').textContent = document.getElementById('hashtagsInput').value;
        document.getElementById('previewLocation').textContent = document.getElementById('locationInput').value ? '📍 ' + document.getElementById('locationInput').value : '';
        
        const previewMedia = document.getElementById('previewMedia');
        if (previewMedia) {
            previewMedia.innerHTML = '';
            if (mediaType === 'image' && editCanvas) {
                const img = document.createElement('img');
                img.src = editCanvas.toDataURL();
                img.style.maxWidth = '100%';
                img.style.borderRadius = 'var(--radius-sm)';
                previewMedia.appendChild(img);
            } else if (videoPreview && videoPreview.src) {
                const vid = document.createElement('video');
                vid.src = videoPreview.src;
                vid.controls = true;
                vid.style.maxWidth = '100%';
                vid.style.borderRadius = 'var(--radius-sm)';
                previewMedia.appendChild(vid);
            }
        }

        document.getElementById('previewModal').style.display = 'flex';
    });

    document.getElementById('closePreviewModal').addEventListener('click', function() {
        document.getElementById('previewModal').style.display = 'none';
    });

    const confirmPublishBtn = document.getElementById('confirmPublishBtn');
    if (confirmPublishBtn) {
        confirmPublishBtn.addEventListener('click', function() {
            const formData = new FormData();
            const caption = document.getElementById('captionInput').value;
            const hashtags = document.getElementById('hashtagsInput').value;
            const fullContent = hashtags ? (caption + '\n' + hashtags) : caption;

            const targetEditorType = typeof editorType !== 'undefined' ? editorType : 'post';

            if (targetEditorType === 'reel') {
                formData.append('caption', fullContent);
                if (currentMedia) formData.append('video', currentMedia);
                fetch('/reel/create/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    body: formData
                }).then(() => { window.location.href = '/reels/'; });
            } else if (targetEditorType === 'story') {
                formData.append('caption', fullContent);
                if (currentMedia) formData.append('image', currentMedia);
                fetch('/story/create/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    body: formData
                }).then(() => { window.location.href = '/stories/'; });
            } else {
                formData.append('content', fullContent || 'New Post');
                if (mediaType === 'image' && editCanvas) {
                    editCanvas.toBlob(function(blob) {
                        if (blob) formData.append('image', blob, 'post.png');
                        fetch('/post/create/', {
                            method: 'POST',
                            headers: { 'X-CSRFToken': getCookie('csrftoken') },
                            body: formData
                        }).then(() => { window.location.href = '/'; });
                    });
                    return;
                } else if (currentMedia) {
                    formData.append('image', currentMedia);
                }
                fetch('/post/create/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    body: formData
                }).then(() => { window.location.href = '/'; });
            }
        });
    }

    // Save draft
    document.getElementById('saveDraftBtn').addEventListener('click', function() {
        const data = {
            draft_type: editorType,
            caption: document.getElementById('captionInput')?.value || '',
            content: document.getElementById('textInput')?.value || '',
            edits_data: edits,
            location: document.getElementById('locationInput')?.value || '',
            hashtags: document.getElementById('hashtagsInput')?.value || '',
            privacy: document.getElementById('privacySelect')?.value || 'public'
        };

        fetch('/draft/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                alert('Draft saved!');
            }
        });
    });

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Back button
    document.getElementById('backBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
            window.location.href = '/';
        }
    });
});
