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


/* =========================================================
   PAY FOR PARKING — MODAL LOGIC & API INTEGRATION
   Same endpoints as the React smart-parking project:
     POST  parkingApp/getTicketInfo/
     GET   parkingScratchCard/verify/
     PUT   parkingScratchCard/paymentSuccess/
     GET   parkingApp/getBankCardGatewayUrl
   ========================================================= */

const PP_API_URL  = 'https://crms.ajcl.net:7119/api';
const PP_AUTH_TKN = 'gAAAAABnPR0fCqfHV9VKZ5db8pyiO_nsTL2LHTTvRaUKpZStm-AAaqSpA-dC9dtxSo9S4xIPH0OAISMGgq9Hmamgpca8FglHBh2ap-4tJJf9IBVvYlty2jI=';

// --- STATE ---
let ppState = {
  currentStep: 1,
  ticketInfo: null,
  paymentMethod: null,     // 'card' | 'scratch'
  appliedScratchCards: [], // list of used codes
  amountPayable: 0,
};

let ppQrScanner = null;

// ---- OPEN / CLOSE ----
function openPayParkingModal() {
  resetPPModal();
  document.getElementById('ppOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePayParkingModal() {
  stopQrScanner();
  document.getElementById('ppOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('ppOverlay')) {
    closePayParkingModal();
  }
}

// ---- RESET MODAL ----
function resetPPModal() {
  ppState = { currentStep: 1, ticketInfo: null, paymentMethod: null, appliedScratchCards: [], amountPayable: 0 };

  // inputs
  document.getElementById('ppTicketInput').value = '';
  document.getElementById('ppScratchInput').value = '';

  // errors
  hideEl('ppStep1Error');
  hideEl('ppStep2Error');
  hideEl('ppStep2Success');
  hideEl('ppScratchError');
  hideEl('ppScratchSuccess');
  hideEl('ppScratchApplied');
  hideEl('ppQrContainer');
  hideEl('ppScratchCardForm');

  // method cards
  document.getElementById('ppMethodCard').classList.remove('selected');
  document.getElementById('ppMethodScratch').classList.remove('selected');

  // steps visibility
  showEl('ppStep1');
  hideEl('ppStep2');
  hideEl('ppStep3');
  goToStep(1);
}

// ---- STEP NAVIGATION ----
function goToStep(n) {
  [1, 2, 3].forEach(i => {
    const content = document.getElementById(`ppStep${i}`);
    const indicator = document.getElementById(`ppStep${i}Indicator`);
    if (content) content.style.display = (i === n) ? 'block' : 'none';
    if (indicator) indicator.classList.toggle('active', i === n);
  });
  ppState.currentStep = n;

  // scroll modal to top
  const modal = document.getElementById('ppModal');
  if (modal) modal.scrollTop = 0;
}

// ---- QR SCANNER ----
function toggleQrScanner() {
  const container = document.getElementById('ppQrContainer');
  if (container.style.display === 'none' || !container.style.display) {
    showEl('ppQrContainer');
    startQrScanner();
  } else {
    stopQrScanner();
    hideEl('ppQrContainer');
  }
}

function startQrScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    console.warn('html5-qrcode library not loaded');
    return;
  }
  stopQrScanner(); // clean up any previous instance

  ppQrScanner = new Html5Qrcode('pp-qr-reader', { verbose: false });
  Html5Qrcode.getCameras()
    .then(cameras => {
      if (!cameras || cameras.length === 0) throw new Error('No camera found');
      return ppQrScanner.start(
        cameras[0].id,
        { fps: 30, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // On successful scan — populate ticket input and stop
          const input = document.getElementById('ppTicketInput');
          if (input) input.value = decodedText;
          stopQrScanner();
          hideEl('ppQrContainer');
          // Auto-fetch ticket info after scan
          fetchTicketInfo();
        },
        () => { /* ignore scan errors */ }
      );
    })
    .catch(err => {
      console.error('QR Scanner error:', err);
      setError('ppStep1Error', 'Camera access denied or unavailable. Please enter ticket number manually.');
    });
}

function stopQrScanner() {
  if (ppQrScanner) {
    ppQrScanner.stop().catch(() => {});
    ppQrScanner = null;
  }
}

// ---- STEP 1: FETCH TICKET INFO ----
async function fetchTicketInfo() {
  const ticketInput = document.getElementById('ppTicketInput').value.trim();
  hideEl('ppStep1Error');

  if (!ticketInput) {
    setError('ppStep1Error', 'Please enter your ticket number or scan the barcode.');
    return;
  }

  setBtnLoading('ppFetchTicketBtn', 'ppFetchTicketBtnText', 'ppFetchTicketBtnLoader', true);

  try {
    const formData = new FormData();
    formData.append('parkingTokenNumber', JSON.stringify(ticketInput));

    const resp = await fetch(`${PP_API_URL}/parkingApp/getTicketInfo/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PP_AUTH_TKN}` },
      body: formData,
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data?.message || `Server error ${resp.status}`);
    }

    if (data?.message === 'success' && data?.ticketInfo) {
      ppState.ticketInfo = data;
      ppState.amountPayable = parseInt(data.ticketInfo.amountPayable, 10) || 0;
      populateTicketCard(data.ticketInfo);
      goToStep(2);
    } else {
      throw new Error(data?.message || 'Ticket not found. Please check your ticket number.');
    }

  } catch (err) {
    setError('ppStep1Error', err.message || 'Failed to retrieve ticket. Please try again.');
  } finally {
    setBtnLoading('ppFetchTicketBtn', 'ppFetchTicketBtnText', 'ppFetchTicketBtnLoader', false);
  }
}

function populateTicketCard(info) {
  setText('ppTicketNumber', info.ticketNumber || '—');
  const days = info.days ? `${info.days}d ` : '';
  const hrs  = info.hours ? `${info.hours}h ` : '';
  const mins = info.minutes ? `${info.minutes}m` : '';
  setText('ppDuration', `${days}${hrs}${mins}`.trim() || '—');
  setText('ppAmount', `${ppState.amountPayable} Rs`);
}

// ---- STEP 2: PAYMENT METHOD ----
function selectPayMethod(method) {
  ppState.paymentMethod = method;

  document.getElementById('ppMethodCard').classList.toggle('selected', method === 'card');
  document.getElementById('ppMethodScratch').classList.toggle('selected', method === 'scratch');

  if (method === 'scratch') {
    showEl('ppScratchCardForm');
  } else {
    hideEl('ppScratchCardForm');
  }
  hideEl('ppStep2Error');
}

// ---- APPLY SCRATCH CARD ----
async function applyScratchCard() {
  const code = document.getElementById('ppScratchInput').value.trim();
  hideEl('ppScratchError');
  hideEl('ppScratchSuccess');

  if (!code) {
    setError('ppScratchError', 'Please enter a scratch card number.');
    return;
  }
  if (ppState.appliedScratchCards.includes(code)) {
    setError('ppScratchError', 'This scratch card has already been applied.');
    return;
  }

  setBtnLoading('ppApplyScratchBtn', 'ppApplyScratchText', 'ppApplyScratchLoader', true);

  try {
    const url = new URL(`${PP_API_URL}/parkingScratchCard/verify/`);
    url.searchParams.set('code', code);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PP_AUTH_TKN}`,
        'Accept': 'application/json',
      },
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data?.message || `Server error ${resp.status}`);
    }

    if (data?.response === 'success') {
      const deducted = parseInt(data.amount, 10) || 0;
      ppState.amountPayable = Math.max(0, ppState.amountPayable - deducted);
      ppState.appliedScratchCards.push(code);

      // Update displayed amount
      setText('ppAmount', `${ppState.amountPayable} Rs`);

      // Show applied badge
      setText('ppScratchAppliedText', `"${code}" applied — ${deducted} Rs deducted! Remaining: ${ppState.amountPayable} Rs`);
      showEl('ppScratchApplied');

      // Clear input
      document.getElementById('ppScratchInput').value = '';

      // If amount is fully paid, auto submit
      if (ppState.amountPayable === 0) {
        await submitScratchPayment();
      }
    } else {
      throw new Error(data?.message || 'Invalid scratch card.');
    }

  } catch (err) {
    setError('ppScratchError', err.message || 'Could not verify scratch card. Try again.');
  } finally {
    setBtnLoading('ppApplyScratchBtn', 'ppApplyScratchText', 'ppApplyScratchLoader', false);
  }
}

// ---- STEP 2: PAY NOW ----
async function processPayment() {
  hideEl('ppStep2Error');

  if (!ppState.paymentMethod) {
    setError('ppStep2Error', 'Please select a payment method.');
    return;
  }

  if (ppState.paymentMethod === 'scratch') {
    if (ppState.appliedScratchCards.length === 0) {
      setError('ppStep2Error', 'Please apply at least one scratch card before proceeding.');
      return;
    }
    await submitScratchPayment();
  } else {
    await payWithCard();
  }
}

// ---- SCRATCH CARD FINAL SUBMIT ----
async function submitScratchPayment() {
  setBtnLoading('ppPayNowBtn', 'ppPayNowBtnText', 'ppPayNowBtnLoader', true);

  try {
    const codesString = [...new Set(ppState.appliedScratchCards)].join(',');
    const ticketNumber = ppState.ticketInfo?.ticketInfo?.ticketNumber;

    const formData = new FormData();
    formData.append('codes', codesString);
    formData.append('ticketNumber', ticketNumber);

    const resp = await fetch(`${PP_API_URL}/parkingScratchCard/paymentSuccess/`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${PP_AUTH_TKN}` },
      body: formData,
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data?.message || `Server error ${resp.status}`);
    }

    if (data?.response === 'success') {
      showSuccessStep(data?.message || 'Payment completed successfully!', null);
    } else {
      throw new Error(data?.message || 'Payment could not be processed.');
    }

  } catch (err) {
    setError('ppStep2Error', err.message || 'Payment failed. Please try again.');
    setBtnLoading('ppPayNowBtn', 'ppPayNowBtnText', 'ppPayNowBtnLoader', false);
  }
}

// ---- CARD PAYMENT (BANK GATEWAY) ----
async function payWithCard() {
  setBtnLoading('ppPayNowBtn', 'ppPayNowBtnText', 'ppPayNowBtnLoader', true);

  try {
    const ticketNumber = ppState.ticketInfo?.ticketInfo?.ticketNumber;
    const url = new URL(`${PP_API_URL}/parkingApp/getBankCardGatewayUrl`);
    url.searchParams.set('parkingTokenNumber', ticketNumber);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PP_AUTH_TKN}`,
        'Accept': 'application/json',
      },
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data?.message || `Server error ${resp.status}`);
    }

    if (data?.response === 'success' && data?.url) {
      // Show step 3 with bank redirect notice, then open gateway
      showSuccessStep('Redirecting to payment gateway…', 'bank');
      setTimeout(() => {
        window.open(data.url, '_blank');
      }, 600);
    } else {
      throw new Error(data?.message || 'Could not retrieve payment gateway link.');
    }

  } catch (err) {
    setError('ppStep2Error', err.message || 'Card payment failed. Please try again.');
    setBtnLoading('ppPayNowBtn', 'ppPayNowBtnText', 'ppPayNowBtnLoader', false);
  }
}

// ---- SHOW STEP 3 ----
function showSuccessStep(message, type) {
  // type: null = scratch success w/ QR, 'bank' = redirect notice
  setText('ppSuccessMessage', message);

  if (type === 'bank') {
    hideEl('ppQrCodeContainer');
    showEl('ppBankRedirectMsg');
  } else {
    hideEl('ppBankRedirectMsg');
    // Optionally render QR code if data is available
    hideEl('ppQrCodeContainer');
  }

  goToStep(3);
}

// ---- UTILITY HELPERS ----
function showEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}
function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = ''; }
}
function setBtnLoading(btnId, textId, loaderId, isLoading) {
  const btn  = document.getElementById(btnId);
  const text = document.getElementById(textId);
  const loader = document.getElementById(loaderId);
  if (btn) btn.disabled = isLoading;
  if (text) text.style.display = isLoading ? 'none' : '';
  if (loader) loader.style.display = isLoading ? 'inline-block' : 'none';
}

