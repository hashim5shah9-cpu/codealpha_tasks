document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    document.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var form = this.closest('form');
            var formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.status === 'ok') {
                    var cartCountEl = document.getElementById('cart-count');
                    if (cartCountEl) {
                        cartCountEl.textContent = data.item_count;
                    }
                    btn.textContent = 'Added!';
                    btn.style.background = '#16a34a';
                    setTimeout(function() {
                        btn.textContent = 'Add to Cart';
                        btn.style.background = '';
                    }, 1500);
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
        }, 4000);
    });
});
