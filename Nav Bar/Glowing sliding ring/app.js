class ArcNavigation {
  constructor() {
    this.dock = document.getElementById('dock');
    this.tabs = Array.from(document.querySelectorAll('.tab-item'));
    this.ambientGlow = document.getElementById('ambientGlow');
    this.tabTitle = document.getElementById('tabTitle');
    this.tabSubtitle = document.getElementById('tabSubtitle');

    this.lDiffuse = document.getElementById('lDiffuse');
    this.lGlow = document.getElementById('lGlow');
    this.lCore = document.getElementById('lCore');
    this.lCenter = document.getElementById('lCenter');

    this.rimStop0 = document.getElementById('rimStop0');
    this.rimStop1 = document.getElementById('rimStop1');
    this.rimStop2 = document.getElementById('rimStop2');
    this.rimStop3 = document.getElementById('rimStop3');
    this.rimStop4 = document.getElementById('rimStop4');

    this.themeColors = [
      '94, 231, 255',    // Home: Cyan
      '147, 112, 219',   // Search: Purple
      '255, 105, 180',   // Broadcast/Radio: Pink
      '220, 220, 220',   // Library: Silver/White
      '255, 215, 0'      // You: Gold
    ];

    this.activeIndex = 2;
    document.documentElement.style.setProperty('--theme-rgb', this.themeColors[this.activeIndex]);

    this.tabCenters = [];
    this.iconCenterY = 27;
    this.isDragging = false;

    // Head Spring
    this.ax = 0;
    this.av = 0;
    this.ta = 0;

    // Tail Spring
    this.bx = 0;
    this.bv = 0;
    this.tb = 0;
    
    // Radius Spring (for the morphing/squish effect)
    this.r = 21;
    this.rv = 0;

    this.startTripX = 0;
    this.trip = 1;
    this.lastTime = null;
    this.wasMoving = false; // Tracks arrival state

    this.init();
  }

  init() {
    this.calculateTabPositions();

    const initialCenter = this.tabCenters[this.activeIndex] || 220;
    this.ax = initialCenter;
    this.bx = initialCenter;
    this.ta = initialCenter;
    this.tb = initialCenter;
    this.startTripX = initialCenter;
    this.trip = 1;
    
    // Apply initial arrived state
    this.tabs[this.activeIndex].classList.add('arrived');

    window.addEventListener('resize', () => this.handleResize());
    this.setupTabEvents();
    this.setupDragEvents();
    this.setupKeyboardEvents();

    requestAnimationFrame((t) => this.tick(t));
  }

  calculateTabPositions() {
    const dockRect = this.dock.getBoundingClientRect();
    this.tabCenters = this.tabs.map(tab => {
      const iconBox = tab.querySelector('.icon-box') || tab;
      const iconRect = iconBox.getBoundingClientRect();
      this.iconCenterY = (iconRect.top + iconRect.height / 2) - dockRect.top;
      return (iconRect.left + iconRect.width / 2) - dockRect.left;
    });
  }

  handleResize() {
    this.calculateTabPositions();
    const targetX = this.tabCenters[this.activeIndex] || 220;
    this.ta = targetX;
    this.tb = targetX;
  }

  setupTabEvents() {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('mousedown', () => {});
      
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerPressAnimation(tab);
        this.setActiveTab(index);
      });
    });
  }

  // Method to trigger the squish animation
  triggerPressAnimation(tab) {
    tab.classList.remove('pressed');
    void tab.offsetWidth; 
    tab.classList.add('pressed');
    setTimeout(() => {
      tab.classList.remove('pressed');
    }, 400);
  }

  setActiveTab(index) {
    if (index === this.activeIndex && Math.abs(this.ax - this.tabCenters[index]) < 1) return;

    this.activeIndex = index;
    const targetX = this.tabCenters[index];

    this.startTripX = this.ax;
    this.trip = Math.max(1, Math.abs(this.ax - targetX));

    this.ta = targetX;
    this.tb = targetX;

    document.documentElement.style.setProperty('--theme-rgb', this.themeColors[index]);

    this.tabs.forEach((tab, i) => {
      const isActive = (i === index);
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const activeTab = this.tabs[index];
    this.tabTitle.textContent = activeTab.dataset.title || 'Tab';
    this.tabSubtitle.textContent = activeTab.dataset.subtitle || '';
  }

  setupDragEvents() {
    const onPointerDown = (e) => {
      this.isDragging = true;
      this.dock.setPointerCapture(e.pointerId);
      this.handlePointerMove(e);
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      this.handlePointerMove(e);
    };

    const onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      try {
        this.dock.releasePointerCapture(e.pointerId);
      } catch (err) {}

      let nearestIndex = 0;
      let minDistance = Infinity;

      this.tabCenters.forEach((cx, idx) => {
        const d = Math.abs(this.ax - cx);
        if (d < minDistance) {
          minDistance = d;
          nearestIndex = idx;
        }
      });

      this.setActiveTab(nearestIndex);
    };

    this.dock.addEventListener('pointerdown', onPointerDown);
    this.dock.addEventListener('pointermove', onPointerMove);
    this.dock.addEventListener('pointerup', onPointerUp);
    this.dock.addEventListener('pointercancel', onPointerUp);
  }

  handlePointerMove(e) {
    const dockRect = this.dock.getBoundingClientRect();
    const pointerX = Math.max(25, Math.min(dockRect.width - 25, e.clientX - dockRect.left));

    this.ta = pointerX;
    this.tb = pointerX;
    this.trip = Math.max(1, Math.abs(this.ax - pointerX));
  }

  setupKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const next = (this.activeIndex + 1) % this.tabs.length;
        this.setActiveTab(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const prev = (this.activeIndex - 1 + this.tabs.length) % this.tabs.length;
        this.setActiveTab(prev);
      }
    });
  }

  tick(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt > 0.05) dt = 0.05;

    const steps = 4;
    const h = dt / steps;

    for (let s = 0; s < steps; s++) {
      // 1. Head Spring
      const headAccel = -800 * (this.ax - this.ta) - 45 * this.av;
      this.av += headAccel * h;
      this.ax += this.av * h;

      const d = Math.abs(this.ax - this.ta);
      const ratio = Math.min(1, Math.max(0, d / this.trip));
      const home = 1 - (ratio * ratio);
      
      // 2. Tail Spring
      const KB = 400 + 400 * home;
      const CB = 40 + 20 * home;
      const tailAccel = -KB * (this.bx - this.tb) - CB * this.bv;
      this.bv += tailAccel * h;
      this.bx += this.bv * h;
      
      // 3. Radius Spring
      const gap = Math.abs(this.ax - this.bx);
      const targetR = gap > 4 ? 16 : 21; 
      const rAccel = -600 * (this.r - targetR) - 35 * this.rv;
      this.rv += rAccel * h;
      this.r += this.rv * h;
    }

    // Arrival Detection for CSS Pop Animation
    const currentlyMoving = Math.abs(this.av) > 2 || Math.abs(this.bv) > 2 || Math.abs(this.ax - this.ta) > 2;
    
    if (!currentlyMoving && this.wasMoving) {
      this.tabs.forEach(t => t.classList.remove('arrived'));
      this.tabs[this.activeIndex].classList.add('arrived');
    } else if (currentlyMoving && !this.wasMoving) {
      this.tabs.forEach(t => t.classList.remove('arrived'));
    }
    
    this.wasMoving = currentlyMoving;

    this.render();
    requestAnimationFrame((t) => this.tick(t));
  }

  render() {
    const dockWidth = this.dock.offsetWidth || 440;
    const cy = this.iconCenterY || 27;
    const R = this.r;

    const xMin = Math.min(this.ax, this.bx);
    const xMax = Math.max(this.ax, this.bx);
    const gap = xMax - xMin;

    let pathD = '';
    if (gap < 0.2) {
      const cx = (this.ax + this.bx) / 2;
      pathD = `M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy} A ${R} ${R} 0 1 0 ${cx - R} ${cy} Z`;
    } else {
      pathD = `M ${xMin} ${cy - R} A ${R} ${R} 0 0 0 ${xMin} ${cy + R} L ${xMax} ${cy + R} A ${R} ${R} 0 0 0 ${xMax} ${cy - R} Z`;
    }

    this.lDiffuse.setAttribute('d', pathD);
    this.lGlow.setAttribute('d', pathD);
    this.lCore.setAttribute('d', pathD);
    this.lCenter.setAttribute('d', pathD);

    const speed = Math.min(4.5, (Math.abs(this.av) + Math.abs(this.bv)) / 220 + (gap / 110));
    this.dock.style.setProperty('--speed', speed.toFixed(2));

    const midX = (this.ax + this.bx) / 2;
    const span = Math.max(70, gap + 70);

    const p0 = Math.max(0, (midX - span * 0.7) / dockWidth * 100);
    const p1 = Math.max(0, (midX - span * 0.35) / dockWidth * 100);
    const p2 = (midX / dockWidth) * 100;
    const p3 = Math.min(100, (midX + span * 0.35) / dockWidth * 100);
    const p4 = Math.min(100, (midX + span * 0.7) / dockWidth * 100);

    if (this.rimStop0) this.rimStop0.setAttribute('offset', `${p0.toFixed(1)}%`);
    if (this.rimStop1) this.rimStop1.setAttribute('offset', `${p1.toFixed(1)}%`);
    if (this.rimStop2) this.rimStop2.setAttribute('offset', `${p2.toFixed(1)}%`);
    if (this.rimStop3) this.rimStop3.setAttribute('offset', `${p3.toFixed(1)}%`);
    if (this.rimStop4) this.rimStop4.setAttribute('offset', `${p4.toFixed(1)}%`);

    const dockRect = this.dock.getBoundingClientRect();
    const stageRect = this.dock.parentElement.getBoundingClientRect();
    if (this.ambientGlow) {
      const globalMidX = dockRect.left + midX - stageRect.left;
      this.ambientGlow.style.left = `${globalMidX}px`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ArcNavigation();
});