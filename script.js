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
        toggleButtons();
        showcase.addEventListener('scroll', toggleButtons);
        
        // Handle window resize (re-calculate max scroll)
        window.addEventListener('resize', toggleButtons);
    });
});
