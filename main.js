document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });

    // Carousel navigation
    document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
        const showcase = wrapper.querySelector('.product-showcase');
        const prevBtn = wrapper.querySelector('.prev-btn');
        const nextBtn = wrapper.querySelector('.next-btn');

        if (!showcase || !prevBtn || !nextBtn) return;

        // Scroll amount: scroll by the width of one card + gap
        const scrollAmount = 355; 

        nextBtn.addEventListener('click', () => {
            showcase.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        prevBtn.addEventListener('click', () => {
            showcase.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        // Hide/show buttons based on scroll position
        const toggleButtons = () => {
            const scrollLeft = showcase.scrollLeft;
            const maxScrollLeft = showcase.scrollWidth - showcase.clientWidth;
            
            // Show/hide prev button
            if (scrollLeft <= 5) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }

            // Show/hide next button
            if (scrollLeft >= maxScrollLeft - 5) {
                nextBtn.classList.add('hidden');
            } else {
                nextBtn.classList.remove('hidden');
            }
        };

        // Initial toggle and add scroll listener
        requestAnimationFrame(() => toggleButtons());
        showcase.addEventListener('scroll', toggleButtons);
        
        // Handle window resize (re-calculate max scroll)
        window.addEventListener('resize', toggleButtons);
    });

    // Interactive Canvas Background (Hero Section)
    const initHeroCanvas = () => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) return;

        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const heroSection = canvas.parentElement;

        let width = canvas.width = heroSection.offsetWidth;
        let height = canvas.height = heroSection.offsetHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = heroSection.offsetWidth;
            height = canvas.height = heroSection.offsetHeight;
        });

        const mouse = {
            x: -1000,
            y: -1000,
            targetX: -1000,
            targetY: -1000,
            radius: 200,
            active: false
        };

        const onMouseMove = (e) => {
            const rect = heroSection.getBoundingClientRect();
            mouse.targetX = e.clientX - rect.left;
            mouse.targetY = e.clientY - rect.top;
            mouse.active = true;
        };

        const onMouseLeave = () => {
            mouse.targetX = -1000;
            mouse.targetY = -1000;
            mouse.active = false;
        };

        heroSection.addEventListener('mousemove', onMouseMove);
        heroSection.addEventListener('mouseleave', onMouseLeave);

        const ribbons = [
            {
                yBase: 0.5,
                speed: 0.002,
                amplitude: 45,
                frequency: 0.0025,
                linesCount: 8,
                spacing: 12,
                color: (opacity) => `rgba(255, 102, 0, ${opacity * 0.18})`,
                phase: 0
            },
            {
                yBase: 0.45,
                speed: -0.0015,
                amplitude: 35,
                frequency: 0.003,
                linesCount: 6,
                spacing: 15,
                color: (opacity) => `rgba(255, 102, 0, ${opacity * 0.20})`,
                phase: Math.PI / 3
            },
            {
                yBase: 0.55,
                speed: 0.0025,
                amplitude: 55,
                frequency: 0.002,
                linesCount: 5,
                spacing: 18,
                color: (opacity) => `rgba(255, 102, 0, ${opacity * 0.22})`,
                phase: Math.PI / 1.5
            }
        ];

        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            if (mouse.active) {
                if (mouse.x === -1000) {
                    mouse.x = mouse.targetX;
                    mouse.y = mouse.targetY;
                } else {
                    mouse.x = lerp(mouse.x, mouse.targetX, 0.08);
                    mouse.y = lerp(mouse.y, mouse.targetY, 0.08);
                }
            } else {
                mouse.x = lerp(mouse.x, -1000, 0.08);
                mouse.y = lerp(mouse.y, -1000, 0.08);
            }

            ribbons.forEach(ribbon => {
                ribbon.phase += ribbon.speed;

                for (let i = 0; i < ribbon.linesCount; i++) {
                    ctx.beginPath();
                    
                    const offset = (i - ribbon.linesCount / 2) * ribbon.spacing;
                    const lineOpacity = 1 - Math.abs(i - ribbon.linesCount / 2) / (ribbon.linesCount / 2 + 1);

                    for (let x = 0; x < width; x += 10) {
                        let y = height * ribbon.yBase + Math.sin(x * ribbon.frequency + ribbon.phase) * ribbon.amplitude + offset;

                        if (mouse.x !== -1000) {
                            const dx = x - mouse.x;
                            const dy = y - mouse.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist < mouse.radius) {
                                const force = (mouse.radius - dist) / mouse.radius;
                                const smoothForce = force * force * (3 - 2 * force);
                                const angle = Math.atan2(dy, dx);
                                y += Math.sin(angle) * smoothForce * 60;
                            }
                        }

                        if (x === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }

                    ctx.strokeStyle = ribbon.color(lineOpacity);
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    };

    window.addEventListener('load', () => {
        setTimeout(initHeroCanvas, 100);
    });
});


// Resolve problema de links do TikTok no Desktop (about:blank)
document.addEventListener('DOMContentLoaded', () => {
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
                    qrModal.classList.add('active');
                });
            });

            closeQr.addEventListener('click', () => qrModal.classList.remove('active'));
            qrModal.addEventListener('click', (e) => {
                if (e.target === qrModal) qrModal.classList.remove('active');
            });
        }
    }
});
