/**
 * GameDistribution Auto-Fill & Publish Helper
 * Run this snippet directly in the Chrome DevTools Console on:
 * https://developer.gamedistribution.com/games/new/edit
 *
 * It fills all form fields with priority to mobile portrait gaming,
 * selects categories/tags/languages/age groups, sets descriptions,
 * checks child-friendly and no-blood options, and clicks Submit.
 */

(async function autoFillGameDistributionForm() {
  console.log('🚀 Starting GameDistribution form auto-fill for Gardenture...');

  const gameData = {
    title: 'Gardenture',
    type: 'HTML5',
    subType: 'PixiJS',
    width: 800,
    height: 1200,
    categories: ['Casual', 'Adventure'],
    tags: ['Roguelite', 'Survival', 'Casual', 'Arcade', 'Singleplayer'],
    gender: ['Male', 'Female'],
    ageGroup: ['Kids (0-12)', 'Teens (13-17)', 'Young Adults (18-25)', 'Adults (26-54)'],
    languages: ['English'],
    description: `Step into Gardenture, a fast-paced 2D pastel botanical survival roguelite crafted for quick, rewarding mobile and browser play sessions. In this enchanting garden world, your crystal-bladed hero battles blossoming waves of mystical thorn creatures, corrupt sporelings, and colossal floral bosses.

With intuitive one-thumb drag-to-move controls, your blade automatically slashes and parries nearby foes, allowing you to focus on tactical dodging and fluid movement. Dash through danger with precision invulnerability frames, collect glowing golden petals and exp orbs, and craft your ultimate build on each level-up.

Discover over 30 synergy cards and devastating weapon evolutions: spin razor-sharp petal orbits, unleash sky-falling bloom hammers, call down chain lightning with storm marks, and reflect incoming damage with iron bark. Build dynamic momentum to push your style rank meter from D all the way up to Triple S (SSS) for amplified speed and explosive floral bursts.

Runs last between 2 and 5 minutes—ideal for quick coffee breaks or extended high-score streaks. Unlock rare arcana personas, master the daily challenge run, and cleanse the sacred garden of corruption!`,
    instructions: `Desktop Controls:
• Drag with Mouse or use WASD / Arrow Keys to move.
• Spacebar or Flick Mouse to Dash.
• P or Escape to Pause.

Mobile / Touch Controls:
• Drag anywhere with one thumb or finger to steer your hero.
• Swipe or quick-flick to Dash through attacks.
• Tap in-game buttons to pause or select upgrade cards.`,
    keyFeatures: 'Fast-paced 2-5 min roguelite runs; 30 synergy cards & weapon evolutions; One-thumb intuitive mobile controls; DMC-style SSS rank meter; 4 unique hero personas; Dynamic daily streak challenges.',
    noBlood: true,
    kidsFriendly: true,
    compatibility: 'Both',
    preferredMode: 'Portrait',
    https: true,
  };

  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    const setter = valueSetter || prototypeValueSetter;
    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setCheckbox(element, checked) {
    if (element.checked !== checked) {
      element.click();
    }
  }

  // 1. Text Inputs
  const titleInput = document.querySelector('input[name="title"]');
  if (titleInput) setNativeValue(titleInput, gameData.title);

  const widthInput = document.querySelector('input[name="width"]');
  if (widthInput) setNativeValue(widthInput, gameData.width);

  const heightInput = document.querySelector('input[name="height"]');
  if (heightInput) setNativeValue(heightInput, gameData.height);

  // 2. Textareas
  const descArea = document.querySelector('textarea[name="description"]');
  if (descArea) setNativeValue(descArea, gameData.description);

  const instrArea = document.querySelector('textarea[name="instructions"]');
  if (instrArea) setNativeValue(instrArea, gameData.instructions);

  const featArea = document.querySelector('textarea[name="keyFeatures"]');
  if (featArea) setNativeValue(featArea, gameData.keyFeatures);

  // 3. Checkboxes
  const noBloodCheck = document.querySelector('input[name="noBlood"]');
  if (noBloodCheck) setCheckbox(noBloodCheck, true);

  const kidsFriendlyCheck = document.querySelector('input[name="kidsFriendly"]');
  if (kidsFriendlyCheck) setCheckbox(kidsFriendlyCheck, true);

  const httpsCheck = document.querySelector('input[name="https"]');
  if (httpsCheck) setCheckbox(httpsCheck, true);

  // 4. Autocompletes & Selects helper
  async function fillAutocomplete(inputSelector, values) {
    const input = document.querySelector(inputSelector);
    if (!input) return;
    for (const val of values) {
      input.focus();
      setNativeValue(input, val);
      await new Promise(r => setTimeout(r, 200));
      // Try to find open popup option
      const options = Array.from(document.querySelectorAll('.MuiAutocomplete-option, [role="option"]'));
      const match = options.find(o => o.textContent.trim().toLowerCase() === val.toLowerCase());
      if (match) {
        match.click();
      } else {
        // Press Enter for freeSolo tag
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  // 5. Select dropdown helper
  function selectDropdownOption(selectName, targetLabel) {
    const select = document.querySelector(`select[name="${selectName}"]`);
    if (select) {
      const option = Array.from(select.options).find(o => o.text.trim().toLowerCase() === targetLabel.toLowerCase());
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
    // MUI select container
    const muiSelect = document.querySelector(`[data-testid="${selectName}"]`) || document.querySelector(`[name="${selectName}"]`)?.parentElement;
    if (muiSelect) {
      muiSelect.click();
      setTimeout(() => {
        const item = Array.from(document.querySelectorAll('li[role="option"]')).find(li => li.textContent.trim().toLowerCase() === targetLabel.toLowerCase());
        if (item) item.click();
      }, 150);
    }
  }

  // Set SubType
  selectDropdownOption('subType', 'PixiJS');

  // Set Mobile Compatibility: Both (Android & iOS)
  selectDropdownOption('mobile', 'Both');

  // Set Mobile Preferred Mode: Portrait
  selectDropdownOption('mobileMode', 'Portrait');

  // Fill Autocompletes
  await fillAutocomplete('input[name="categories"]', gameData.categories);
  await fillAutocomplete('input[name="tags"]', gameData.tags);
  await fillAutocomplete('input[name="gender"]', gameData.gender);
  await fillAutocomplete('input[name="ageGroup"]', gameData.ageGroup);
  await fillAutocomplete('input[name="languages"]', gameData.languages);

  console.log('✅ Form fields populated with mobile portrait priority!');
  console.log('👉 Click the "Save" or "Submit" button to create the game draft.');
})();
