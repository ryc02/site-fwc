// FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            // Close all
            document.querySelectorAll('.faq-item.open').forEach(i => {
                i.classList.remove('open');
                i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            // Open clicked (if was closed)
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Product Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            ['varoes','acessorios','eletrica'].forEach(t => {
                const panel = document.getElementById('panel-' + t);
                if (panel) panel.style.display = t === tab ? 'grid' : 'none';
            });
        });
    });

    // Fade-in on scroll
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Modal QR Code TikTok Desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
        const tiktokLinks = document.querySelectorAll('a[href*="vt.tiktok.com"]');
        const qrModal = document.getElementById('qr-modal');
        const closeQr = document.getElementById('close-qr');
        const qrImage = document.getElementById('qr-image');

        if (tiktokLinks.length > 0 && qrModal && closeQr && qrImage) {
            tiktokLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = link.href;
                    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
                    qrModal.removeAttribute('hidden');
                });
            });

            closeQr.addEventListener('click', () => qrModal.setAttribute('hidden', ''));
            qrModal.addEventListener('click', (e) => {
                if (e.target === qrModal) qrModal.setAttribute('hidden', '');
            });
        }
    }