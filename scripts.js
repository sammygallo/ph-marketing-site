// === GLOBAL CONSTANTS ===
const blackOutDates = [
  "May 13 2025",
  "May 14 2025", 
  "May 15 2025",
  "May 16 2025",
  "May 26 2025",
  "Nov 27 2025",
  "Nov 28 2025",
  "Dec 24 2025",
  "Dec 25 2025",
  "Dec 31 2025",
  "Jan 1 2026"
];

const timeSlots = {
  default: ["11:00am", "11:30am", "2:00pm", "2:30pm"],
  alt: ["12:00pm", "12:30pm", "3:00pm", "3:30pm"],
};

const typeformURL = "https://parachutehealthdme.typeform.com/to/hUhvu4QC";

// Global variables for supplier data - Initialize with defaults (prevent redeclaration)
if (typeof supplier_name === 'undefined') {
  var supplier_name = "Default Supplier";
  var supplier_id = "default";
  var selectedSupplier = null;
  var supplierLogo = null;
  var supplierHeadlineText = "A better way to order medical equipment";
  var supplierDescriptionText = "This supplier has partnered with Parachute Health to provide easy online ordering";
  var is_supplier_org = false;
  var defaultDescription = "This supplier has partnered with Parachute Health to provide you easy online ordering, at no cost, that gets your patients the products they need at a click's notice";
  var mobile_app = null;
}

// Ensure defaultHeadline is always defined
if (typeof defaultHeadline === 'undefined') {
  var defaultHeadline = "A better way to order medical equipment";
}

// === MAIN INITIALIZATION ===
async function initializeParachuteSupplierPage() {
  try {
    console.log('Starting Parachute supplier page initialization...');
    
    // Step 1: Load suppliers data
    await loadSuppliersData();
    
    // Step 2: Process supplier from URL
    await processSupplierData();
    
    // Step 3: Update basic supplier DOM elements (with retry)
    await updateSupplierDOMElementsWithRetry();
    
    // Step 4: Load info center tabs if elements exist
    await loadInfoCenterTabs();
    
    // Step 5: Activate training tab if URL contains ?training
    activateTrainingTabIfNeeded();
    
    console.log('Parachute supplier page initialization complete');
  } catch (error) {
    console.error('Parachute initialization failed:', error);
  }
}

// === SUPPLIER DATA LOADING ===
function loadSuppliersData() {
  return new Promise((resolve, reject) => {
    // Check if suppliers is already loaded
    if (typeof suppliers !== 'undefined') {
      resolve();
      return;
    }
    
    // Load suppliers.js dynamically
    const script = document.createElement('script');
    script.src = 'https://sammyatparachute.github.io/ph-marketing-site/suppliers.js';
    script.onload = () => {
      if (typeof suppliers !== 'undefined') {
        resolve();
      } else {
        reject(new Error('suppliers variable not available after loading'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load suppliers.js'));
    document.head.appendChild(script);
  });
}

async function processSupplierData() {
  try {
    console.log('Processing supplier data...');
    console.log('Full URL:', window.location.href);
    
    // Check if URL contains suppliers query parameter
    if (window.location.href.indexOf("suppliers?") === -1) {
      console.warn('No suppliers query parameter found in URL');
      return; // Keep default values
    }
    
    const supplierUrl = window.location.href.substring(window.location.href.indexOf("suppliers?") + 10);
    console.log('Extracted supplier URL:', supplierUrl);
    
    if (!suppliers || suppliers.length === 0) {
      console.error('Suppliers data not loaded or empty');
      return; // Keep default values
    }
    
    console.log('Available suppliers:', suppliers.map(s => ({ name: s.name, url: s.url })));
    
    selectedSupplier = suppliers.find(e => e.url === supplierUrl);
    console.log('Selected supplier:', selectedSupplier);
    
    if (!selectedSupplier) {
      console.warn('No supplier found for URL:', supplierUrl);
      
      // Only redirect if not on Squarespace
      if (window.location.toString().indexOf("squarespace") === -1) {
        console.log('Redirecting because not on Squarespace');
        window.location = 'https://www.parachutehealth.com/supplier-info-centers';
        return;
      } else {
        console.log('On Squarespace but supplier not found, using defaults');
        return; // Keep default values
      }
    }
    
    // Update global variables with found supplier data
    supplier_name = selectedSupplier.name || "Unknown Supplier";
    supplier_id = selectedSupplier.external_id || "unknown";
    supplierLogo = selectedSupplier.logo || null;
    supplierHeadlineText = (selectedSupplier.headline && selectedSupplier.headline.trim()) || defaultHeadline;
    supplierDescriptionText = selectedSupplier.description || null;
    is_supplier_org = selectedSupplier.is_supplier_org || false;
    
    // Update default description with supplier name
    defaultDescription = `${supplier_name} has partnered with Parachute Health to provide you easy online ordering, at no cost, that gets your patients the products they need at a click's notice`;
    
    console.log('Supplier data processed successfully:', {
      name: supplier_name,
      id: supplier_id,
      logo: supplierLogo,
      headline: supplierHeadlineText,
      description: supplierDescriptionText
    });
    
  } catch (error) {
    console.error('Error processing supplier data:', error);
    // Keep default values on error
  }
}

async function updateSupplierDOMElementsWithRetry() {
  // Try multiple times in case DOM elements aren't ready yet
  for (let attempt = 0; attempt < 5; attempt++) {
    console.log(`DOM update attempt ${attempt + 1}`);
    
    const supplierDescription = document.getElementById("supplier-description");
    const supplierHeadline = document.getElementById("supplier-headline");
    const supplierHero = document.getElementById("supplier-hero");
    
    // If we found at least one element, proceed
    if (supplierDescription || supplierHeadline || supplierHero) {
      await updateSupplierDOMElements();
      return;
    }
    
    // Wait before retrying
    console.log('DOM elements not found, retrying in 200ms...');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.warn('Could not find supplier DOM elements after 5 attempts');
}

async function updateSupplierDOMElements() {
  console.log('Updating supplier DOM elements...');
  console.log('Supplier data:', { 
    supplier_name, 
    supplierDescriptionText, 
    supplierHeadlineText, 
    supplierLogo,
    defaultDescription,
    defaultHeadline 
  });
  
  // Wait a bit for DOM to be fully ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const supplierDescription = document.getElementById("supplier-description");
  const supplierHeadline = document.getElementById("supplier-headline");
  const supplierHero = document.getElementById("supplier-hero");

  console.log('Found elements:', { 
    supplierDescription: !!supplierDescription, 
    supplierHeadline: !!supplierHeadline, 
    supplierHero: !!supplierHero 
  });

  if (supplierDescription) {
    const textToUse = supplierDescriptionText || defaultDescription;
    supplierDescription.textContent = textToUse;
    console.log('Updated supplier description with:', textToUse);
  } else {
    console.warn('supplier-description element not found');
  }
  
  if (supplierHeadline) {
    const headlineToUse = (supplierHeadlineText && supplierHeadlineText.trim()) || defaultHeadline;
    supplierHeadline.textContent = headlineToUse;
    console.log('Updated supplier headline with:', headlineToUse);
  } else {
    console.warn('supplier-headline element not found');
  }
  
  if (supplierHero) {
    if (supplierLogo) {
      supplierHero.innerHTML = `<img src="${supplierLogo}" style="filter: grayscale(1) invert(1) brightness(100); width: 100%;">`;
      console.log('Updated supplier hero with logo:', supplierLogo);
    } else {
      supplierHero.innerHTML = `<h1>${supplier_name}</h1>`;
      console.log('Updated supplier hero with name:', supplier_name);
    }
  } else {
    console.warn('supplier-hero element not found');
  }
}

// === INFO CENTER TABS ===
async function loadInfoCenterTabs() {
  const infoCenterTabs = document.getElementById("info-center-tabs");
  const demoSchedule = document.getElementById("demo-schedule");

  // Guard Clause: If neither target element exists, skip
  if (!infoCenterTabs && !demoSchedule) {
    console.log("Info center elements not found, skipping info center tabs.");
    return;
  }

  try {
    const res = await fetch(
      "https://sammyatparachute.github.io/ph-marketing-site/info-center-tabs.html"
    );
    const htmlText = await res.text();

    if (infoCenterTabs) {
      infoCenterTabs.innerHTML = htmlText;
    }

    // Parse the HTML string to extract specific parts
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // Select the specific div you want to load
    const webinarSchduleDiv = doc.querySelector("#webinar-div-container");

    // Inject webinar schedule on demo page if the element exists
    if (demoSchedule && webinarSchduleDiv) {
      demoSchedule.innerHTML = webinarSchduleDiv.innerHTML;
    }

    // Wait for the dynamically injected content to be ready
    await waitForElement("firstDate");

    updateSupplierText();
    updateSignupLinks();
    await trainingTabInfo();
    bindTypeformSpans();
    hideBlackoutDates();
  } catch (err) {
    console.log("Info center tabs failed to load:", err);
  }
}

// === TAB ACTIVATION ===
function activateTrainingTabIfNeeded() {
  // Check if URL contains ?training
  if (window.location.href.indexOf("?training") === -1) {
    console.log('Training parameter not in URL, skipping tab activation');
    return;
  }
  
  console.log('Training parameter found in URL, activating training tab');
  
  // Wait for tab elements to be available
  const checkInterval = setInterval(() => {
    // Look for training tab link and content
    const trainingTabLink = document.querySelector('a[data-w-tab="Training"]') || 
                           document.querySelector('a[href="#training"]') ||
                           document.querySelector('.w-tab-link:nth-child(2)'); // Assuming training is 2nd tab
    
    const trainingTabContent = document.querySelector('[data-w-tab="Training"]') ||
                              document.getElementById('training-tab');
    
    if (trainingTabLink) {
      clearInterval(checkInterval);
      
      // Remove active class from all tabs
      document.querySelectorAll('.w-tab-link').forEach(tab => {
        tab.classList.remove('w--current');
      });
      
      document.querySelectorAll('.w-tab-pane').forEach(pane => {
        pane.classList.remove('w--tab-active');
      });
      
      // Add active class to training tab
      trainingTabLink.classList.add('w--current');
      
      if (trainingTabContent) {
        trainingTabContent.classList.add('w--tab-active');
      }
      
      // Trigger click event in case there are listeners
      trainingTabLink.click();
      
      console.log('Training tab activated successfully');
    }
  }, 100);
  
  // Stop checking after 5 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('Stopped looking for training tab after timeout');
  }, 5000);
}

// === SUPPORTING FUNCTIONS ===
function updateSupplierText() {
  document.getElementsByName("supplier-name").forEach((e) => {
    e.textContent = supplier_name;
  });
}

function updateSignupLinks() {
  document.getElementsByName("sign-up-link").forEach((e) => {
    e.outerHTML = `<a href="https://dme.parachutehealth.com/organic_sign_up?supplier_id=${supplier_id}#/create-account" style="color:#520079;font-weight:400;">signing up here</a>!`;
  });
}

function hideBlackoutDates() {
  document.querySelectorAll(".webinar-div-2 > div").forEach((div) => {
    const dateText = div.querySelector("h4")?.textContent.trim();
    if (dateText && blackOutDates.some((date) => dateText.includes(date))) {
      div.style.display = "none";
    }
  });
}

function waitForElement(elementId, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = document.getElementById(elementId);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Element with id #${elementId} not found after ${timeout}ms.`));
      }
    }, 100);
  });
}

async function trainingTabInfo() {
  let currentDate = getNextWeekday(new Date(), 1);

  for (let i = 0; i < 10; i++) {
    currentDate = getNextWeekday(currentDate, i === 0 ? 0 : 1);

    const formattedDate = formatDate(currentDate);
    const slotType = isAltDay(currentDate) ? "alt" : "default";
    const slots = timeSlots[slotType];

    const ordinalName = ordinal(i + 1);
    const dateId = `${ordinalName}Date`;
    const slotPrefix = `${ordinalName}DateTimeSlot`;

    const dateElement = document.getElementById(dateId);
    if (dateElement) {
      dateElement.textContent = formattedDate;
    }

    slots.forEach((slot, j) => {
      const slotId = `${slotPrefix}${j + 1}`;
      const slotElement = document.getElementById(slotId);
      if (slotElement) {
        slotElement.textContent = slot;
      }
      window[`${slotPrefix}String${j + 1}`] = `${formattedDate} ${slot}`;
    });
  }

  loadTypeformScript();
}

function bindTypeformSpans() {
  for (let i = 0; i < 10; i++) {
    const ordinalName = ordinal(i + 1);
    const slotPrefix = `${ordinalName}DateTimeSlotString`;

    for (let j = 0; j < 4; j++) {
      const spanId = `${ordinalName}DateTimeSlot${j + 1}`;
      const slotVar = `${slotPrefix}${j + 1}`;

      const span = document.getElementById(spanId);
      if (span && window[slotVar]) {
        span.addEventListener("click", () => openTypeForm(window[slotVar]));
      }
    }
  }
}

function openTypeForm(slotString) {
  if (typeof typeformEmbed !== 'undefined') {
    typeformPopup(
      typeformURL,
      slotString,
      "webinar",
      supplier_id,
      supplier_name,
      mobile_app
    );
  } else {
    console.warn('Typeform embed not loaded yet');
  }
}

function typeformPopup(
  typeformURL,
  webinarSlot,
  request_type,
  supplier_id,
  supplier_name,
  mobile_app
) {
  const reference = typeformEmbed.makePopup(
    `${typeformURL}?webinarslot=${webinarSlot}&request_type=${request_type}&supplier_id=${supplier_id}&supplier_name=${supplier_name}&mobile_app=${mobile_app}`,
    { mode: "popup", autoClose: 5, hideHeaders: true, hideFooters: true }
  );
  reference.open();
}

function loadTypeformScript() {
  const id = "typef_orm_share";
  if (!document.getElementById(id)) {
    const js = document.createElement("script");
    js.id = id;
    js.src = "https://embed.typeform.com/embed.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(js, firstScript);
  }
}

function getNextWeekday(date, daysToAdd) {
  const d = new Date(date);
  d.setDate(d.getDate() + daysToAdd);
  while (["Sat", "Sun"].includes(d.toString().substring(0, 3))) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function isAltDay(date) {
  return ["Tue", "Thu"].includes(date.toString().substring(0, 3));
}

function formatDate(date) {
  return date.toString().substring(0, 15);
}

function ordinal(n) {
  const map = [
    "first", "second", "third", "fourth", "fifth",
    "sixth", "seventh", "eighth", "ninth", "tenth",
  ];
  return map[n - 1];
}

// === AUTO-START ===
// Prevent multiple initializations
if (typeof parachuteInitialized === 'undefined') {
  window.parachuteInitialized = true;
  
  // Start everything when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeParachuteSupplierPage);
  } else {
    // DOM already ready
    initializeParachuteSupplierPage();
  }
}