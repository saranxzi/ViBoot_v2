class FacilityMacro {
  constructor() {
    this.isRefreshing = false;
    this.refreshLockTimeout = null;
    this.pollInterval = null;
    this.init();
  }

  init() {
    this.pollInterval = setInterval(() => {
      try {
        this.poll();
      } catch (err) {
        console.error("[ViBoot] Macro loop error:", err);
      }
    }, 1000);
  }

  findTable() {
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('th, td')).map(el => el.innerText.trim().toLowerCase());
      if (headers.includes('facility name') && headers.includes('action')) {
        return table;
      }
    }
    return null;
  }

  parseFacilities(table) {
    const facilities = new Set();
    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        const name = cells[0].innerText.trim();
        if (name && name.toLowerCase() !== 'facility name') {
          facilities.add(name);
        }
      }
    }
    return Array.from(facilities);
  }

  injectControlBar(table, facilities, state) {
    const existingBar = document.getElementById('viboot-macro-bar');
    if (existingBar) {
      this.updateControlBar(state);
      return;
    }

    const controlBar = document.createElement('div');
    controlBar.id = 'viboot-macro-bar';
    controlBar.style.cssText = `
      background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px;
      padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center;
      gap: 15px; font-family: system-ui, sans-serif; font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05); flex-wrap: wrap;
    `;

    const label = document.createElement('strong');
    label.innerText = 'ViBoot Auto-Register:';
    controlBar.appendChild(label);

    const select = document.createElement('select');
    select.id = 'viboot-macro-select';
    select.style.cssText = 'padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 13px; flex: 1; min-width: 200px;';
    facilities.forEach(fac => {
      const opt = document.createElement('option');
      opt.value = fac;
      opt.text = fac;
      if (fac === state.target) opt.selected = true;
      select.appendChild(opt);
    });
    controlBar.appendChild(select);

    const intervalWrapper = document.createElement('div');
    intervalWrapper.style.display = 'flex';
    intervalWrapper.style.alignItems = 'center';
    intervalWrapper.style.gap = '8px';

    const intervalLabel = document.createElement('span');
    intervalLabel.innerText = 'Interval (sec):';
    intervalWrapper.appendChild(intervalLabel);

    const intervalInput = document.createElement('input');
    intervalInput.id = 'viboot-macro-interval';
    intervalInput.type = 'number';
    intervalInput.min = '1';
    intervalInput.max = '60';
    intervalInput.value = state.interval || 5;
    intervalInput.style.cssText = 'width: 60px; padding: 6px; border-radius: 4px; border: 1px solid #ccc; font-size: 13px; text-align: center;';
    intervalWrapper.appendChild(intervalInput);

    controlBar.appendChild(intervalWrapper);

    const btn = document.createElement('button');
    btn.id = 'viboot-macro-btn';
    btn.type = 'button';
    btn.style.cssText = `
      padding: 8px 16px; border-radius: 4px; border: none; color: white;
      font-weight: 600; cursor: pointer; transition: 0.2s background; font-size: 13px;
      background: ${state.active ? '#dc3545' : '#198754'};
    `;
    btn.innerText = state.active ? 'Stop Macro' : 'Start Auto-Register';
    controlBar.appendChild(btn);

    const status = document.createElement('span');
    status.id = 'viboot-macro-status';
    status.style.cssText = `font-style: italic; font-size: 13px; font-weight: 500; color: ${state.active ? '#0d6efd' : '#6c757d'};`;
    status.innerText = state.active ? 'Status: Running...' : 'Status: Idle';
    controlBar.appendChild(status);

    table.parentNode.insertBefore(controlBar, table);

    btn.addEventListener('click', () => {
      const isStarting = btn.innerText.includes('Start');
      const selectedTarget = select.value;
      const selectedInterval = parseInt(intervalInput.value) || 5;

      chrome.storage.local.set({
        viboot_macro_active: isStarting,
        viboot_macro_target: selectedTarget,
        viboot_macro_interval: selectedInterval,
        viboot_macro_last_refresh: Date.now()
      }, () => {
        this.isRefreshing = false;
        if (this.refreshLockTimeout) clearTimeout(this.refreshLockTimeout);
        this.poll();
      });
    });
  }

  updateControlBar(state) {
    const btn = document.getElementById('viboot-macro-btn');
    const status = document.getElementById('viboot-macro-status');
    if (btn) {
      btn.style.background = state.active ? '#dc3545' : '#198754';
      btn.innerText = state.active ? 'Stop Macro' : 'Start Auto-Register';
    }
    if (status) {
      status.style.color = state.active ? '#0d6efd' : '#6c757d';
      status.innerText = state.active ? 'Status: Running...' : 'Status: Idle';
    }
  }

  poll() {
    chrome.storage.local.get([
      'viboot_macro_active',
      'viboot_macro_target',
      'viboot_macro_interval',
      'viboot_macro_last_refresh',
      'viboot_macro_last_full_reload'
    ], (data) => {
      const state = {
        active: !!data.viboot_macro_active,
        target: data.viboot_macro_target || '',
        interval: parseInt(data.viboot_macro_interval) || 5,
        lastRefresh: parseInt(data.viboot_macro_last_refresh) || 0,
        lastFullReload: parseInt(data.viboot_macro_last_full_reload) || 0
      };

      const table = this.findTable();
      if (!table) {
        if (state.active && !this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const navLinks = document.querySelectorAll('a, li, span, p');
            const facilityLink = Array.from(navLinks).find(el => el.innerText.trim().toLowerCase() === 'facility registration');
            if (facilityLink && typeof facilityLink.click === 'function') {
              console.log("[ViBoot] Navigating back to Facility Registration after reload.");
              facilityLink.click();
            }
          } catch(e) {}
          this.refreshLockTimeout = setTimeout(() => { this.isRefreshing = false; }, 3000);
        }
        return;
      }

      const facilities = this.parseFacilities(table);
      if (facilities.length > 0) {
        this.injectControlBar(table, facilities, state);
      }

      if (!state.active) {
        this.isRefreshing = false;
        return;
      }

      const rows = table.querySelectorAll('tr');
      let targetRow = null;
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4 && cells[0].innerText.trim() === state.target) {
          targetRow = row;
          break;
        }
      }

      if (targetRow) {
        const actionCell = targetRow.cells[targetRow.cells.length - 1];
        const regBtn = actionCell.querySelector('button, a, input[type="button"]');
        const btnText = (regBtn?.innerText || regBtn?.value || '').toLowerCase();
        
        if (regBtn && (btnText.includes('register') || regBtn.className.toLowerCase().includes('btn'))) {
          this.executeRegistration(regBtn, state.target);
          return;
        }
      }

      const timeElapsed = Date.now() - state.lastRefresh;
      if (timeElapsed >= state.interval * 1000 && !this.isRefreshing) {
        const needsFullReload = (Date.now() - state.lastFullReload) >= 300000; // 5 minutes
        this.triggerReload(needsFullReload);
      }
    });
  }

  executeRegistration(btn, target) {
    chrome.storage.local.set({ viboot_macro_active: false }, () => {
      const status = document.getElementById('viboot-macro-status');
      if (status) {
        status.innerText = 'Status: REGISTERED!';
        status.style.color = '#198754';
      }
      
      chrome.runtime.sendMessage({
        message: 'send-notification',
        data: { slot: target }
      });
      
      try {
        btn.click();
      } catch (err) {
        console.error("[ViBoot] Click error:", err);
      }
    });
  }

  triggerReload(forceFullReload = false) {
    this.isRefreshing = true;
    
    const now = Date.now();
    const storageUpdates = { viboot_macro_last_refresh: now };
    if (forceFullReload) {
      storageUpdates.viboot_macro_last_full_reload = now;
    }

    chrome.storage.local.set(storageUpdates, () => {
      if (forceFullReload) {
        console.log("[ViBoot] Performing full page reload to keep session alive.");
        window.location.reload();
        return;
      }

      try {
        const navLinks = document.querySelectorAll('a, li, span, p');
        const facilityLink = Array.from(navLinks).find(el => el.innerText.trim().toLowerCase() === 'facility registration');
        
        if (facilityLink && typeof facilityLink.click === 'function') {
          facilityLink.click();
        } else {
          window.location.reload();
        }
      } catch (err) {
        window.location.reload();
      }
      
      this.refreshLockTimeout = setTimeout(() => { this.isRefreshing = false; }, 3000);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FacilityMacro());
} else {
  new FacilityMacro();
}
