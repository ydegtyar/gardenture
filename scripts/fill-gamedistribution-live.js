(async function fillGDFormLive() {
  console.log("=== STARTING LIVE FORM FILL ===");

  function setNative(el, val) {
    if (!el) return;
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, val);
    else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function setCheckboxByLabel(labelText, targetChecked) {
    const labels = Array.from(document.querySelectorAll('label'));
    const match = labels.find(l => l.textContent.trim().toLowerCase().includes(labelText.toLowerCase()));
    if (match) {
      const cb = match.querySelector('input[type="checkbox"]');
      if (cb && cb.checked !== targetChecked) {
        cb.click();
      }
    }
  }

  async function selectDropdown(boxId, targetValue) {
    const box = document.getElementById(boxId);
    if (!box) { console.warn("Dropdown not found:", boxId); return; }
    box.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const option = document.querySelector(`li[role="option"][data-value="${targetValue}"]`);
    if (option) {
      option.click();
    } else {
      console.warn("Option not found for value:", targetValue);
    }
    await new Promise(r => setTimeout(r, 250));
  }

  async function selectAutocomplete(inputId, targets) {
    const input = document.getElementById(inputId);
    if (!input) { console.warn("Autocomplete input not found:", inputId); return; }
    for (const target of targets) {
      input.focus();
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, target);
      else input.value = target;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));

      const options = Array.from(document.querySelectorAll('.MuiAutocomplete-option, li[role="option"]'));
      const match = options.find(o => o.textContent.trim().toLowerCase() === target.toLowerCase())
                 || options.find(o => o.textContent.trim().toLowerCase().includes(target.toLowerCase()));
      if (match) {
        match.click();
      } else {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, code: 'Enter', bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // 1. Title
  const titleEl = document.getElementById(':r39:') || document.querySelector('input[name="title"]');
  setNative(titleEl, "Gardenture");

  // 2. Sub Type -> PixiJS (value 14)
  await selectDropdown(':r3b:', '14');

  // 3. Width -> 800
  const widthEl = document.getElementById(':r3d:') || document.querySelector('input[name="width"]');
  setNative(widthEl, '800');

  // 4. Height -> 1200 (Portrait Mobile Priority)
  const heightEl = document.getElementById(':r3e:') || document.querySelector('input[name="height"]');
  setNative(heightEl, '1200');

  // 5. Genre -> Casual, Adventure
  await selectAutocomplete(':r3f:', ['Casual', 'Adventure']);

  // 6. Tags -> Roguelite, Survival, Casual, Arcade, Singleplayer
  await selectAutocomplete(':r3h:', ['Roguelite', 'Survival', 'Casual', 'Arcade', 'Singleplayer']);

  // 7. Intended Target Audience -> Male, Female
  await selectAutocomplete(':r3j:', ['Male', 'Female']);

  // 8. Age Group -> Kids (0-12), Teens (13-17), Young Adults (18-25), Adults (26-54)
  await selectAutocomplete(':r3l:', ['Kids (0-12)', 'Teens (13-17)', 'Young Adults (18-25)', 'Adults (26-54)']);

  // 9. Languages -> English
  await selectAutocomplete(':r3n:', ['English']);

  // 10. Description
  const descEl = document.getElementById(':r3p:') || document.querySelector('textarea[name="description"]');
  setNative(descEl, `Step into Gardenture, a fast-paced 2D pastel botanical survival roguelite crafted for quick, rewarding mobile and browser play sessions. In this enchanting garden world, your crystal-bladed hero battles blossoming waves of mystical thorn creatures, corrupt sporelings, and colossal floral bosses.

With intuitive one-thumb drag-to-move controls, your blade automatically slashes and parries nearby foes, allowing you to focus on tactical dodging and fluid movement. Dash through danger with precision invulnerability frames, collect glowing golden petals and exp orbs, and craft your ultimate build on each level-up.

Discover over 30 synergy cards and devastating weapon evolutions: spin razor-sharp petal orbits, unleash sky-falling bloom hammers, call down chain lightning with storm marks, and reflect incoming damage with iron bark. Build dynamic momentum to push your style rank meter from D all the way up to Triple S (SSS) for amplified speed and explosive floral bursts.

Runs last between 2 and 5 minutes—ideal for quick coffee breaks or extended high-score streaks. Unlock rare arcana personas, master the daily challenge run, and cleanse the sacred garden of corruption!`);

  // 11. Instructions
  const instrEl = document.getElementById(':r3q:') || document.querySelector('textarea[name="instructions"]');
  setNative(instrEl, `Desktop Controls:
• Drag with Mouse or use WASD / Arrow Keys to move.
• Spacebar or Flick Mouse to Dash.
• P or Escape to Pause.

Mobile / Touch Controls:
• Drag anywhere with one thumb or finger to steer your hero.
• Swipe or quick-flick to Dash through attacks.
• Tap in-game buttons to pause or select upgrade cards.`);

  // 12. Key game features
  const featEl = document.getElementById(':r3r:') || document.querySelector('textarea[name="keyFeatures"]');
  setNative(featEl, 'Fast-paced 2-5 min roguelite runs; 30 synergy cards & weapon evolutions; One-thumb intuitive mobile controls; DMC-style SSS rank meter; 4 unique hero personas; Dynamic daily streak challenges.');

  // 13. Checkboxes
  setCheckboxByLabel('No Blood', true);
  setCheckboxByLabel('Child Friendly', true);
  setCheckboxByLabel('HTTPS Ready', true);

  // 14. Compatibility -> Both (Android & iOS = value 3)
  await selectDropdown(':r3s:', '3');

  // 15. Preferred mode of play -> Portrait (value 0)
  await selectDropdown(':r40:', '0');

  console.log("=== FORM FILL COMPLETED SUCCESSFULLY ===");
  window.__fillStatus = "COMPLETED";
})();
