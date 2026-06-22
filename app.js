// --- PORTAL NAVIGATION & SECURE HANDSHAKE SIMULATION ---
function simulateRedirect(portalName, url) {
  const modal = document.getElementById('redirectModal');
  const urlLabel = document.getElementById('modalRedirectUrl');
  
  if (!modal || !urlLabel) return;
  
  urlLabel.textContent = url;
  modal.classList.add('active');
  
  // Simulate secure redirect progress
  setTimeout(() => {
    modal.classList.remove('active');
    setTimeout(() => {
      window.location.href = url;
    }, 300); // allow close animation to finish
  }, 2000);
}

// --- SMOOTH SCROLL UTILITY ---
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    // Close mobile menu if open
    const navMenu = document.getElementById('navMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (navMenu && navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      mobileMenuBtn.classList.remove('active');
    }
    
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  
  // --- HEADER SCROLL ACTION ---
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- MOBILE MENU TOGGLE ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }


  // --- ABOUT SECTION GRAPH ANIMATOR ---
  const mockGraphRow = document.getElementById('mockGraphRow');
  const graphHeights = [45, 68, 52, 88, 72, 94, 61, 79];
  const graphDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Avg'];
  
  if (mockGraphRow) {
    graphHeights.forEach((h, index) => {
      const barContainer = document.createElement('div');
      barContainer.className = 'mock-bar-container';
      
      const bar = document.createElement('div');
      bar.className = 'mock-bar';
      bar.style.height = '0%'; // Start at 0 for entrance animation
      
      const label = document.createElement('div');
      label.className = 'mock-bar-label';
      label.textContent = graphDays[index];
      
      barContainer.appendChild(bar);
      barContainer.appendChild(label);
      mockGraphRow.appendChild(barContainer);
    });
  }

  // --- INTERSECTION OBSERVER FOR SCROLL REVEALS ---
  const revealElements = document.querySelectorAll('.reveal-element');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        
        // Trigger graph bar heights animation specifically when About section is seen
        if (entry.target.id === 'about') {
          const bars = mockGraphRow.querySelectorAll('.mock-bar');
          bars.forEach((bar, idx) => {
            setTimeout(() => {
              bar.style.height = `${graphHeights[idx]}%`;
            }, idx * 100); // Stagger the animation
          });
        }
      }
    });
  }, observerOptions);
  
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // --- SCROLL SPY FOR NAVIGATION HIGHLIGHTS ---
  const sections = document.querySelectorAll('section[id]');
  const navItems = {
    'home': document.getElementById('nav-home'),
    'features': document.getElementById('nav-features'),
    'workflow': document.getElementById('nav-workflow'),
    'portals': document.getElementById('nav-portals'),
    'about': document.getElementById('nav-about'),
    'download': document.getElementById('nav-download')
  };

  window.addEventListener('scroll', () => {
    let currentSection = 'home';
    const scrollPosition = window.scrollY + 250; // Offset for headers
    
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentSection = section.getAttribute('id');
      }
    });

    Object.keys(navItems).forEach(key => {
      if (navItems[key]) {
        if (key === currentSection) {
          navItems[key].classList.add('active');
        } else {
          navItems[key].classList.remove('active');
        }
      }
    });
  });

});
