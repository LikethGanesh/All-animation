document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const statusMessage = document.getElementById('statusMessage');
  const husky = document.getElementById('husky');
  const leftPupil = document.getElementById('leftPupil');
  const rightPupil = document.getElementById('rightPupil');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const cursorLight = document.getElementById('cursorLight');

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let mouseX = -500;
  let mouseY = -500;
  let isCovering = false;

  // 1. FAST ZERO-LATENCY CURSOR SPOTLIGHT & EYE TRACKING
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    cursorLight.style.setProperty('--cursor-x', `${mouseX}px`);
    cursorLight.style.setProperty('--cursor-y', `${mouseY}px`);

    if (!isCovering) {
      const rect = husky.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      const deltaX = (mouseX - eyeCenterX) / (window.innerWidth / 2);
      const deltaY = (mouseY - eyeCenterY) / (window.innerHeight / 2);

      const moveX = Math.max(-4.5, Math.min(4.5, deltaX * 5.5));
      const moveY = Math.max(-3, Math.min(3, deltaY * 3.5));

      leftPupil.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      rightPupil.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
  }, { passive: true });

  // 2. USERNAME FOCUS
  usernameInput.addEventListener('focus', () => {
    isCovering = false;
    husky.classList.remove('covering-eyes', 'peeking');
    leftPupil.style.transform = `translate3d(0px, 3px, 0)`;
    rightPupil.style.transform = `translate3d(0px, 3px, 0)`;
  });

  // 3. PASSWORD FIELD FOCUS (PAWS COVER EYES)
  passwordInput.addEventListener('focus', () => {
    if (passwordInput.type === 'password') {
      isCovering = true;
      husky.classList.add('covering-eyes');
      husky.classList.remove('peeking');
    } else {
      isCovering = false;
      husky.classList.add('peeking');
      husky.classList.remove('covering-eyes');
    }
  });

  passwordInput.addEventListener('blur', () => {
    isCovering = false;
    husky.classList.remove('covering-eyes', 'peeking');
  });

  // 4. TOGGLE PEEK / COVER ON PASSWORD SHOW/HIDE
  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.style.color = isPassword ? '#60a5fa' : 'var(--text-muted)';

    if (document.activeElement === passwordInput || husky.classList.contains('covering-eyes') || husky.classList.contains('peeking')) {
      if (isPassword) {
        isCovering = false;
        husky.classList.remove('covering-eyes');
        husky.classList.add('peeking');
      } else {
        isCovering = true;
        husky.classList.remove('peeking');
        husky.classList.add('covering-eyes');
      }
    }
  });

  // 5. SIGN IN SEQUENCE (3D DOOR PORTAL & STICKMAN)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    isCovering = false;
    husky.classList.remove('covering-eyes', 'peeking');

    // Step 1: Open 3D glowing door
    submitBtn.classList.add('dooropen');
    statusMessage.textContent = 'Signing you in...';
    statusMessage.style.color = '#93c5fd';
    await sleep(350);

    // Step 2: Walker walks into portal
    submitBtn.classList.add('walking');
    await sleep(450);

    // Step 3: Walker disappears inside
    submitBtn.classList.add('out');
    await sleep(350);

    // Step 4: Mascot victory bounce
    husky.classList.add('is-happy');
    statusMessage.textContent = 'Welcome to Den!';
    statusMessage.style.color = '#34d399';

    await sleep(1400);

    // Reset back to idle state
    submitBtn.classList.remove('walking', 'dooropen', 'out');
    husky.classList.remove('is-happy');
    statusMessage.textContent = 'Welcome back!';
    statusMessage.style.color = 'var(--text-muted)';
  });
});