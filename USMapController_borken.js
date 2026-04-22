// USMapController.js - Controls US Map interactions and scheduling menu

class USMapController {
  constructor() {
    this.selectedTerritory = null;
    this.schedulingMenuVisible = false;
    this.initializeEventListeners();
  }

  // Initialize event listeners for map interactions
  initializeEventListeners() {
    // Add event listeners for map territory clicks
    // This will be called after the map is loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.setupMapClickHandlers();
    });
  }

  // Setup click handlers for each territory on the map
  setupMapClickHandlers() {
    const territories = document.querySelectorAll('.territory, [data-territory]');
    territories.forEach(territory => {
      territory.addEventListener('click', (e) => {
        const territoryName = territory.getAttribute('data-territory') || territory.id;
        this.handleTerritoryClick(territoryName);
      });
    });
  }

  // Handle territory click - show scheduling menu
  handleTerritoryClick(territoryName) {
    this.selectedTerritory = territoryName;

    // Get territory data
    const territory = territoryData[territoryName];

    if (!territory || !territory.repInfo) {
      console.error(`Territory data not found for: ${territoryName}`);
      return;
    }

    // Show scheduling menu with two options
    this.showSchedulingMenu(territory);
  }

  // Show the scheduling menu slider with two options
  showSchedulingMenu(territory) {
    // Create or get existing menu container
    let menuContainer = document.getElementById('scheduling-menu-slider');

    if (!menuContainer) {
      menuContainer = this.createSchedulingMenuSlider();
      document.body.appendChild(menuContainer);
    }

    // Update menu content
    this.updateMenuContent(menuContainer, territory);

    // Show the menu with slide-in animation
    setTimeout(() => {
      menuContainer.classList.add('active');
      this.schedulingMenuVisible = true;
    }, 10);
  }

  // Create the scheduling menu slider HTML structure
  createSchedulingMenuSlider() {
    const menuContainer = document.createElement('div');
    menuContainer.id = 'scheduling-menu-slider';
    menuContainer.className = 'scheduling-menu-slider';

    menuContainer.innerHTML = `
      <div class="scheduling-menu-content">
        <div class="scheduling-menu-header">
          <h3>Schedule a Meeting</h3>
          <button class="close-menu" onclick="usMapController.closeSchedulingMenu()">&times;</button>
        </div>
        <div class="scheduling-menu-body">
          <p class="menu-subtitle">Choose an option:</p>
          <div class="scheduling-options">
            <button class="scheduling-option" id="option-ae">
              <div class="option-icon">👋</div>
              <div class="option-text">
                <h4>Get to know your Account Executive</h4>
                <p>Meet your dedicated Account Executive and learn how they can help</p>
              </div>
            </button>
            <button class="scheduling-option" id="option-demo">
              <div class="option-icon">🎯</div>
              <div class="option-text">
                <h4>Schedule a Platform Demo</h4>
                <p>See the platform in action with a live demonstration</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      <div class="scheduling-menu-overlay" onclick="usMapController.closeSchedulingMenu()"></div>
    `;

    // Add styles
    this.injectStyles();

    return menuContainer;
  }

  // Update menu content with territory-specific data
  updateMenuContent(menuContainer, territory) {
    const optionAE = menuContainer.querySelector('#option-ae');
    const optionDemo = menuContainer.querySelector('#option-demo');

    // Set click handlers with territory-specific links from repInfo
    optionAE.onclick = () => this.openSchedulingLink(territory.repInfo.scheduling_link_1, 'Account Executive');
    optionDemo.onclick = () => this.openSchedulingLink(territory.repInfo.scheduling_link_2, 'Platform Demo');
  }

  // Open scheduling link in new window/tab
  openSchedulingLink(url, linkType) {
    console.log(`Opening ${linkType} scheduling link: ${url}`);
    window.open(url, '_blank');

    // Optionally close the menu after selection
    // this.closeSchedulingMenu();
  }

  // Close the scheduling menu
  closeSchedulingMenu() {
    const menuContainer = document.getElementById('scheduling-menu-slider');
    if (menuContainer) {
      menuContainer.classList.remove('active');
      this.schedulingMenuVisible = false;

      // Reset selected territory after animation completes
      setTimeout(() => {
        this.selectedTerritory = null;
      }, 300);
    }
  }

  // Inject CSS styles for the scheduling menu
  injectStyles() {
    // Check if styles already exist
    if (document.getElementById('scheduling-menu-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'scheduling-menu-styles';
    style.textContent = `
      .scheduling-menu-slider {
        position: fixed;
        top: 0;
        right: -100%;
        width: 100%;
        max-width: 500px;
        height: 100%;
        z-index: 9999;
        transition: right 0.3s ease-in-out;
      }

      .scheduling-menu-slider.active {
        right: 0;
      }

      .scheduling-menu-slider.active .scheduling-menu-overlay {
        opacity: 1;
        pointer-events: all;
      }

      .scheduling-menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease-in-out;
        z-index: -1;
      }

      .scheduling-menu-content {
        position: relative;
        width: 100%;
        height: 100%;
        background: white;
        box-shadow: -2px 0 20px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        z-index: 1;
      }

      .scheduling-menu-header {
        padding: 20px 30px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .scheduling-menu-header h3 {
        margin: 0;
        font-size: 24px;
        color: #520079;
      }

      .close-menu {
        background: none;
        border: none;
        font-size: 32px;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }

      .close-menu:hover {
        background-color: #f0f0f0;
      }

      .scheduling-menu-body {
        padding: 30px;
        flex: 1;
        overflow-y: auto;
      }

      .menu-subtitle {
        font-size: 16px;
        color: #666;
        margin-bottom: 20px;
      }

      .scheduling-options {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .scheduling-option {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 20px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .scheduling-option:hover {
        border-color: #520079;
        background: #f9f5fc;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(82, 0, 121, 0.1);
      }

      .option-icon {
        font-size: 32px;
        line-height: 1;
      }

      .option-text h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #520079;
      }

      .option-text p {
        margin: 0;
        font-size: 14px;
        color: #666;
        line-height: 1.4;
      }

      @media (max-width: 768px) {
        .scheduling-menu-slider {
          max-width: 100%;
        }

        .scheduling-menu-header {
          padding: 15px 20px;
        }

        .scheduling-menu-header h3 {
          font-size: 20px;
        }

        .scheduling-menu-body {
          padding: 20px;
        }

        .scheduling-option {
          padding: 15px;
        }

        .option-icon {
          font-size: 28px;
        }

        .option-text h4 {
          font-size: 16px;
        }

        .option-text p {
          font-size: 13px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Initialize the controller when the script loads
const usMapController = new USMapController();

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = USMapController;
}
