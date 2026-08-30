document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const mainCard = document.getElementById('mainCard'); 
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const summaryBar = document.getElementById('summaryBar');
  const summaryCount = document.getElementById('summaryCount');
  const summaryRingFill = document.getElementById('summaryRingFill');
  const summaryRingSvg = document.getElementById('summaryRingSvg');
  const summaryCheckSvg = document.getElementById('summaryCheckSvg');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  const cursorLight = document.getElementById('cursorLight');

  let filesState = [];
  const MAX_FILES = 6;
  const CIRCUMFERENCE = 2 * Math.PI * 10; 

  // MOUSEMOVE & DRAG TRACKING FOR SPOTLIGHT
  window.addEventListener('mousemove', (e) => {
    cursorLight.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    cursorLight.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });

  // Handle Dropzone styling
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
  });

  dropzone.addEventListener('dragover', () => dropzone.classList.add('drag-over'));
  
  dropzone.addEventListener('dragleave', (e) => {
    if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', e => {
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      const dropCoords = { x: e.clientX, y: e.clientY };
      handleFiles(Array.from(e.dataTransfer.files), dropCoords);
    }
  });
  
  document.getElementById('browseBtn').addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const rect = dropzone.getBoundingClientRect();
    const centerCoords = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    handleFiles(Array.from(e.target.files), centerCoords);
    fileInput.value = '';
  });

  function handleFiles(newFiles, originCoords) {
    newFiles = newFiles.slice(0, MAX_FILES - filesState.length);
    if (!newFiles.length) return;

    newFiles.forEach((file, idx) => {
      const isThirdFile = (filesState.length === 2);
      
      const fileObj = {
        id: 'f_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: file.name,
        size: formatBytes(file.size),
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        status: 'waiting',
        progress: 0,
        willFail: isThirdFile,
        element: null
      };
      
      filesState.push(fileObj);
      renderFile(fileObj, originCoords, idx * 150);
    });
    updateSummary();
  }

  function renderFile(fileObj, originCoords, delay) {
    const el = document.createElement('div');
    el.className = 'file-item';
    el.id = fileObj.id;
    el.style.setProperty('--p', '0');
    el.innerHTML = `
      <div class="file-preview-box">
        <img src="${fileObj.url || ''}" class="file__img--ghost">
        <img src="${fileObj.url || ''}" class="file__img--live">
        <div class="file-success-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
      <div class="file-info">
        <span class="file-name" title="${fileObj.name}">${fileObj.name}</span>
        <span class="file-status-text" id="status_${fileObj.id}">${fileObj.size} · waiting</span>
      </div>
      <div class="file-actions" id="action_${fileObj.id}">
        <button class="btn-icon remove-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    
    fileList.appendChild(el);
    fileObj.element = el;
    el.querySelector('.remove-btn').addEventListener('click', () => removeFile(fileObj.id));

    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const dx = originCoords.x - (rect.left + rect.width / 2);
      const dy = originCoords.y - (rect.top + rect.height / 2);
      
      el.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 }
      ], { duration: 600, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', delay });
      
      setTimeout(() => simulateUpload(fileObj), delay + 400);
    });
  }

  function simulateUpload(fileObj) {
    fileObj.status = 'uploading';
    fileObj.element.classList.remove('is-error');
    const duration = 1800 + Math.random() * 800;
    const start = performance.now();

    function step(timestamp) {
      if (fileObj.status === 'removed') return;
      const elapsed = timestamp - start;
      const fraction = Math.min(elapsed / duration, 1);
      const eased = fraction * (2 - fraction);
      
      const targetProgress = fileObj.willFail ? 0.65 : 1;
      const currentProgress = Math.min(eased, targetProgress);
      
      fileObj.progress = currentProgress;
      fileObj.element.style.setProperty('--p', currentProgress);
      
      const statusText = document.getElementById(`status_${fileObj.id}`);
      
      if (currentProgress < 1 && !(fileObj.willFail && fraction >= 0.65)) {
        statusText.textContent = `${fileObj.size} · ${Math.round(currentProgress * 100)}%`;
        requestAnimationFrame(step);
      } else if (fileObj.willFail) {
        fileObj.status = 'error';
        fileObj.willFail = false; 
        fileObj.element.classList.add('is-error');
        statusText.textContent = `${fileObj.size} · failed`;
        
        const actionBox = document.getElementById(`action_${fileObj.id}`);
        actionBox.innerHTML = `
          <button class="btn-icon retry-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>
            </svg>
          </button>
        `;
        actionBox.querySelector('.retry-btn').addEventListener('click', () => {
          actionBox.innerHTML = `
            <button class="btn-icon remove-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          `;
          actionBox.querySelector('.remove-btn').addEventListener('click', () => removeFile(fileObj.id));
          simulateUpload(fileObj);
        });
        updateSummary();
      } else {
        fileObj.status = 'uploaded';
        fileObj.element.classList.add('is-uploaded');
        statusText.textContent = `${fileObj.size} · uploaded`;
        statusText.classList.add('success');
        updateSummary();
      }
    }
    requestAnimationFrame(step);
  }

  function removeFile(id) {
    const idx = filesState.findIndex(f => f.id === id);
    if (idx < 0) return;
    filesState[idx].status = 'removed';
    filesState[idx].element.remove();
    filesState.splice(idx, 1);
    updateSummary();
  }

  function updateSummary() {
    if (!filesState.length) {
      summaryBar.style.display = 'none';
      mainCard.classList.remove('is-all-completed');
      return;
    }
    summaryBar.style.display = 'flex';
    
    const total = filesState.length;
    const uploaded = filesState.filter(f => f.status === 'uploaded').length;
    const failed = filesState.filter(f => f.status === 'error').length;
    
    let sumText = `${uploaded} of ${total} uploaded`;
    if (failed > 0) sumText += ` · <span style="color: var(--danger)">${failed} failed</span>`;
    summaryCount.innerHTML = sumText;

    if (uploaded === total && total > 0) {
      summaryRingSvg.style.display = 'none';
      summaryCheckSvg.style.display = 'block';
      mainCard.classList.add('is-all-completed');
    } else {
      summaryRingSvg.style.display = 'block';
      summaryCheckSvg.style.display = 'none';
      const offset = CIRCUMFERENCE - (uploaded / total) * CIRCUMFERENCE;
      summaryRingFill.style.strokeDashoffset = offset;
      
      mainCard.classList.remove('is-all-completed');
    }
  }

  clearAllBtn.addEventListener('click', () => {
    filesState.forEach(f => f.element.remove());
    filesState = [];
    updateSummary();
  });

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  }
});