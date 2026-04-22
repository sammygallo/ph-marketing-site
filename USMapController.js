(function (window, document) {
  "use strict";

  /**
   * USMapController - Interactive US Map with States and Territories
   *
   * Territory images can be defined in territorydata.js like:
   * {
   *   "territory1": {
   *     "name": "Territory Name",
   *     "path": "...",
   *     "imageUrl": "https://example.com/image.jpg",  // Option 1: Direct image URL
   *     "repInfo": {
   *       "name": "Rep Name",
   *       "imageUrl": "https://example.com/rep.jpg",  // Option 2: In repInfo
   *       "scheduling_link_get_connected": "...",  // Connect with your Account Executive
   *       "scheduling_link_ssr_demo_web": "...",  // Schedule a Demo
   *       // ... other rep info
   *     }
   *   }
   * }
   */

  class USMapController {
    constructor(containerId = "map-container", options = {}) {
      this.containerId = containerId;
      this.container = document.getElementById(containerId);

      if (!this.container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
      }

      // Default options with ability to override
      this.options = {
        showTerritories: options.showTerritories !== false,
        enableTouch: options.enableTouch !== false,
        showControls: options.showControls !== false,
        showPlaceholderPanel: options.showPlaceholderPanel !== false,
        defaultFill: options.defaultFill || "#b167d3",
        hoverFill: options.hoverFill || "#d4aae7",
        selectedFill: options.selectedFill || "rgba(255, 255, 255, .25)",
        stateFill: options.stateFill || "#e0e0e0",
        stateStroke: options.stateStroke || "#d4aae7",
        territoryFill: options.territoryFill || "rgba(255, 255, 255, 0)",
        territoryOpacity: options.territoryOpacity || 0.6,
        territoryHiddenOpacity: options.territoryHiddenOpacity || 0,
        fontFamily:
          options.fontFamily ||
          'europa, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        // Script paths
        stateDataPath:
          options.stateDataPath ||
          "https://sammyatparachute.github.io/ph-marketing-site/statedata.js",
        territoryDataPath:
          options.territoryDataPath ||
          "https://sammyatparachute.github.io/ph-marketing-site/territorydata.js",
        // Territory images configuration
        territoryImages: {
          enabled: options.territoryImages?.enabled || false,
          defaultImage: options.territoryImages?.defaultImage || null,
          imageSize: options.territoryImages?.imageSize || 30,
          imageOpacity: options.territoryImages?.imageOpacity || 1,
          hideOnHover: options.territoryImages?.hideOnHover || false,
          customImages: options.territoryImages?.customImages || {},
          offsetX: options.territoryImages?.offsetX || 0,
          offsetY: options.territoryImages?.offsetY || 0,
          borderRadius: options.territoryImages?.borderRadius || "50%",
          border: options.territoryImages?.border || "2px solid white",
          shadow: options.territoryImages?.shadow || "0 2px 4px rgba(0,0,0,0.2)",
        },
        // Interactivity controls
        stateInteractivity: {
          hover: options.stateInteractivity?.hover !== false,
          click: options.stateInteractivity?.click !== false,
          showTooltip: options.stateInteractivity?.showTooltip !== false,
        },
        territoryInteractivity: {
          hover: options.territoryInteractivity?.hover !== false,
          click: options.territoryInteractivity?.click !== false,
          showTooltip: options.territoryInteractivity?.showTooltip !== false,
          showOnStateHover:
            options.territoryInteractivity?.showOnStateHover || false,
          hideInitially: options.territoryInteractivity?.hideInitially || false,
        },
        ...options,
      };

      this.currentMode = "both";
      this.selectedElement = null;
      this.touchDevice = "ontouchstart" in window;
      this.schedulingMenuVisible = false;

      // Load dependencies and initialize
      this.loadDependencies()
        .then(() => {
          this.init();
        })
        .catch((error) => {
          console.error("Failed to load map dependencies:", error);
          this.showError(
            "Failed to load map data. Please try refreshing the page."
          );
        });
    }

    loadScript(src) {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          const checkData = () => {
            if (
              (src.includes("statedata") &&
                typeof window.US_STATES_DATA !== "undefined") ||
              (src.includes("territorydata") &&
                typeof window.US_TERRITORIES_DATA !== "undefined")
            ) {
              resolve();
            } else {
              setTimeout(checkData, 100);
            }
          };
          checkData();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () =>
          reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    }

    async loadDependencies() {
      this.showLoading();

      try {
        await this.loadScript(this.options.stateDataPath);
        console.log("State data loaded successfully");

        await this.loadScript(this.options.territoryDataPath);
        console.log("Territory data loaded successfully");

        if (typeof window.US_STATES_DATA === "undefined") {
          throw new Error("US_STATES_DATA not found after loading script");
        }
        if (typeof window.US_TERRITORIES_DATA === "undefined") {
          console.warn(
            "US_TERRITORIES_DATA not found - territories will not be shown"
          );
        }
      } catch (error) {
        console.error("Error loading dependencies:", error);
        throw error;
      }
    }

    showLoading() {
      if (this.container) {
        this.container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #999;">
            <div style="font-size: 18px; margin-bottom: 10px;">Loading map data...</div>
            <div style="font-size: 14px;">Please wait</div>
          </div>
        `;
      }
    }

    showError(message) {
      if (this.container) {
        this.container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #cc0000;">
            <div style="font-size: 18px; margin-bottom: 10px;">Error</div>
            <div style="font-size: 14px;">${message}</div>
          </div>
        `;
      }
    }

    init() {
      this.injectStyles();
      this.createHTML();
      this.createStates();
      this.createTerritories();
      this.bindEvents();
      this.setupResponsive();
      this.setMode(this.currentMode);
    }

    injectStyles() {
      const styleId = "us-map-controller-styles";

      if (document.getElementById(styleId)) return;

      const styles = `
        .usmap-wrapper {
          display: flex;
          width: 100%;
          position: relative;
          font-family: ${this.options.fontFamily};
          justify-content: space-between;
        }

        .usmap-container {
          flex: 0 0 66%;
          position: relative;
        }

        .usmap-placeholder-panel {
          flex: 0 0 33%;
        }

        .usmap-controls {
          display: flex;
          gap: 10px;
          padding: 15px;
          border-radius: 8px 8px 0 0;
        }

        .usmap-control-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid ${this.options.defaultFill};
          color: #333;
          border-radius: 5px;
          cursor: pointer;
          font-family: ${this.options.fontFamily};
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .usmap-control-btn:hover {
          background: ${this.options.hoverFill};
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .usmap-control-btn.active {
          background: ${this.options.defaultFill};
          color: white;
        }

        .usmap-svg-container {
          position: relative;
          border-radius: 0 0 8px 8px;
        }

        .usmap-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .usmap-state {
          fill: ${this.options.stateFill};
          stroke: ${this.options.stateStroke};
          stroke-width: 0.5;
          cursor: ${
            this.options.stateInteractivity.click ? "pointer" : "default"
          };
          transition: fill 0.3s ease;
        }

        ${
          this.options.stateInteractivity.hover
            ? `
        .usmap-state:hover {
          fill: #d0d0d0;
        }`
            : ""
        }

        .usmap-state.no-interact {
          cursor: default;
        }

        .usmap-territory {
          fill: ${this.options.territoryFill};
          stroke: white;
          stroke-width: 0;
          cursor: ${
            this.options.territoryInteractivity.click ? "pointer" : "default"
          };
          transition: all 0.3s ease;
          opacity: ${
            this.options.territoryInteractivity.hideInitially
              ? this.options.territoryHiddenOpacity
              : this.options.territoryOpacity
          };
        }

        .usmap-territory.visible {
          opacity: ${this.options.territoryOpacity};
        }

        ${
          this.options.territoryInteractivity.hover
            ? `
        .usmap-territory:hover {
          opacity: 0.8;
          fill: ${this.options.hoverFill};
        }`
            : ""
        }

        .usmap-territory.selected {
          fill: ${this.options.selectedFill};
          stroke-width: 0;
          opacity: 1;
        }

        .usmap-territory-image {
          opacity: ${this.options.territoryImages.imageOpacity};
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        ${
          this.options.territoryImages.hideOnHover
            ? `
        .usmap-territory:hover ~ .usmap-territory-image,
        .usmap-territory-image.hide-on-hover {
          opacity: 0;
        }`
            : ""
        }

        .usmap-hover-modal {
          position: absolute;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 5px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-size: 13px;
          z-index: 1000;
          transform: translate(10px, -50%);
        }

        .usmap-hover-modal.active {
          opacity: 1;
        }

        .usmap-info-panel {
          flex: 0 0 33%;
          background: white;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
          position: fixed;
          right: 0;
          top: 15vh;
          bottom: 10vh;
          width: 40%;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          overflow-y: auto;
          z-index: 1001;
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          border: 1px solid #520079;
          border-right: 0px;
        }

        .usmap-info-panel.active {
          transform: translateX(0);
        }

        .usmap-info-header {
          background: linear-gradient(0deg, rgba(249, 245, 240, 1) 0%, rgba(202, 174, 235, 1) 100%);
          color: white;
          padding: 20px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .usmap-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #520079;
          font-size: 24px;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .usmap-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
        }

        .usmap-info-title {
          color: #520079;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          padding-right: 30px;
        }

        .usmap-info-title-description {
          color: #520079;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .usmap-info-body {
          padding: 20px;
        }

        .usmap-info-description {
          color: #666;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .usmap-info-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 15px;
        }

        .usmap-stat-item {
          text-align: center;
          padding: 15px 10px;
          background: #f8f8f8;
          border-radius: 5px;
        }

        .usmap-stat-value {
          font-size: 20px;
          font-weight: 600;
          color: ${this.options.defaultFill};
          margin-bottom: 5px;
        }

        .usmap-stat-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
        }

        /* Scheduling Menu Styles */
        .usmap-scheduling-menu {
          position: fixed;
          right: 0;
          top: 15vh;
          bottom: 10vh;
          width: 40%;
          background: white;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          overflow-y: auto;
          z-index: 1002;
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          border: 1px solid #520079;
          border-right: 0px;
        }

        .usmap-scheduling-menu.active {
          transform: translateX(0);
        }

        .usmap-scheduling-menu-header {
          background: linear-gradient(0deg, rgba(249, 245, 240, 1) 0%, rgba(202, 174, 235, 1) 100%);
          color: white;
          padding: 20px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .usmap-scheduling-menu-title {
          color: #520079;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          padding-right: 30px;
        }

        .usmap-scheduling-menu-subtitle {
          color: #520079;
          font-size: 14px;
          margin: 8px 0 0 0;
        }

        .usmap-scheduling-menu-body {
          padding: 30px;
        }

        .usmap-scheduling-options {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .usmap-scheduling-option {
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

        .usmap-scheduling-option:hover {
          border-color: #520079;
          background: #f9f5fc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(82, 0, 121, 0.1);
        }

        .usmap-option-icon {
          font-size: 32px;
          line-height: 1;
        }

        .usmap-option-text h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #520079;
        }

        .usmap-option-text p {
          margin: 0;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .usmap-wrapper {
            flex-direction: column;
          }

          .usmap-container {
            flex: 0 0 100%;
          }

          .usmap-placeholder-panel {
            display: none;
          }

          .usmap-info-panel,
          .usmap-scheduling-menu {
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            transform: translateX(100%);
            z-index: 1002;
          }

          .usmap-controls {
            flex-direction: column;
          }

          .usmap-control-btn {
            width: 100%;
          }

          .usmap-scheduling-option {
            padding: 15px;
          }

          .usmap-option-icon {
            font-size: 28px;
          }

          .usmap-option-text h4 {
            font-size: 16px;
          }

          .usmap-option-text p {
            font-size: 13px;
          }
        }
      `;

      const styleSheet = document.createElement("style");
      styleSheet.id = styleId;
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    createHTML() {
      const controlsHTML = this.options.showControls
        ? `
        <div class="usmap-controls">
          <button class="usmap-control-btn" id="${this.containerId}-statesBtn">States</button>
          <button class="usmap-control-btn" id="${this.containerId}-territoriesBtn">Territories</button>
          <button class="usmap-control-btn active" id="${this.containerId}-bothBtn">Both</button>
        </div>
      `
        : "";

      this.container.innerHTML = `
        <div class="usmap-wrapper">
          <div class="usmap-container" id="${this.containerId}-mapContainer"${this.options.showPlaceholderPanel ? "" : ' style="flex: 1"'}>
            ${controlsHTML}
            <div class="usmap-svg-container">
              <svg class="usmap-svg" viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg">
                <g id="${this.containerId}-states-layer"></g>
                <g id="${this.containerId}-territories-layer"></g>
                <g id="${this.containerId}-territory-images-layer"></g>
              </svg>
              <div class="usmap-hover-modal" id="${this.containerId}-hoverModal">
                <div id="${this.containerId}-hoverContent"></div>
              </div>
            </div>
          </div>
          ${this.options.showPlaceholderPanel ? `
          <div class="usmap-placeholder-panel">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
              <div>
                <div>
                  <img src="https://images.squarespace-cdn.com/content/5df13db27cfbe70b38ae20dd/7b4c1341-c5b4-4eee-9c64-ca35c2bc0bea/woman-at-desk.png?content-type=image%2Fpng"/>
                </div>
              </div>
            </div>
          </div>` : ""}
          <div class="usmap-scheduling-menu" id="${this.containerId}-schedulingMenu">
            <div class="usmap-scheduling-menu-header">
              <button class="usmap-close-btn" id="${this.containerId}-schedulingMenuCloseBtn">×</button>
              <h2 class="usmap-scheduling-menu-title">Schedule a Meeting</h2>
              <p class="usmap-scheduling-menu-subtitle">Choose an option:</p>
            </div>
            <div class="usmap-scheduling-menu-body">
              <div class="usmap-scheduling-options">
                <button class="usmap-scheduling-option" id="${this.containerId}-option-ae">
                  <div class="usmap-option-icon">👋</div>
                  <div class="usmap-option-text">
                    <h4>Connect with your Account Executive</h4>
                    <p>Meet your dedicated Account Executive and learn how they can help</p>
                  </div>
                </button>
                <button class="usmap-scheduling-option" id="${this.containerId}-option-demo">
                  <div class="usmap-option-icon">🎯</div>
                  <div class="usmap-option-text">
                    <h4>Schedule a Demo</h4>
                    <p>See the platform in action with a live demonstration</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div class="usmap-info-panel" id="${this.containerId}-infoPanel">
            <div class="usmap-info-header">
              <button class="usmap-close-btn" id="${this.containerId}-closeBtn">×</button>
              <h2 class="usmap-info-title" id="${this.containerId}-infoTitle"></h2>
              <p class="usmap-info-title-description" id="${this.containerId}-infoTitleDescription"></p>
            </div>
            <div class="usmap-info-body">
              <div class="usmap-info-stats" id="${this.containerId}-infoStats"></div>
            </div>
          </div>
        </div>
      `;
    }

    createStates() {
      const statesLayer = document.getElementById(
        `${this.containerId}-states-layer`
      );
      if (!statesLayer || typeof window.US_STATES_DATA === "undefined") return;

      const statesData = window.US_STATES_DATA;

      Object.keys(statesData).forEach((stateId) => {
        const stateData = statesData[stateId];
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );

        path.setAttribute("class", "usmap-state");
        path.setAttribute("id", `${this.containerId}-state-${stateId}`);
        path.setAttribute("d", stateData.path);
        path.dataset.name = stateData.name;
        path.dataset.abbreviation = stateData.abbreviation || "";
        path.dataset.type = "state";

        statesLayer.appendChild(path);
      });
    }

    createTerritories() {
      const territoriesLayer = document.getElementById(
        `${this.containerId}-territories-layer`
      );
      const imagesLayer = document.getElementById(
        `${this.containerId}-territory-images-layer`
      );

      if (!territoriesLayer) return;

      if (typeof window.US_TERRITORIES_DATA === "undefined") {
        console.info(
          "US_TERRITORIES_DATA not found. Territories layer will be empty."
        );
        return;
      }

      Object.keys(window.US_TERRITORIES_DATA).forEach((territoryId) => {
        const territoryData = window.US_TERRITORIES_DATA[territoryId];
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );

        path.setAttribute("class", "usmap-territory");
        path.setAttribute("id", `${this.containerId}-territory-${territoryId}`);
        path.setAttribute("d", territoryData.path);
        path.dataset.name = territoryData.name;
        path.dataset.state_list = territoryData.state_list || "";
        path.dataset.zip_list = territoryData.zip_list || "";
        path.dataset.county_list = territoryData.county_list || "";
        path.dataset.description = territoryData.description || "";
        path.dataset.type = "territory";

        if (territoryData.repInfo) {
          path.dataset.repName = territoryData.repInfo.name || "";
          path.dataset.repEmail = territoryData.repInfo.email || "";
          path.dataset.repHubId = territoryData.repInfo.hub_id || "";
          path.dataset.repPhone = territoryData.repInfo.phone || "";
          path.dataset.repSchedLinkGetConnected = territoryData.repInfo.scheduling_link_get_connected || "";
          path.dataset.repSchedLinkSsrDemoWeb = territoryData.repInfo.scheduling_link_ssr_demo_web || "";
        }

        territoriesLayer.appendChild(path);
      });

      // Create all territory images after paths are added to DOM
      if (this.options.territoryImages.enabled && imagesLayer) {
        console.log("Territory images enabled, waiting for paths to render...");
        requestAnimationFrame(() => {
          setTimeout(() => {
            let imageCount = 0;
            let errorCount = 0;
            Object.keys(window.US_TERRITORIES_DATA).forEach((territoryId) => {
              try {
                const territoryData = window.US_TERRITORIES_DATA[territoryId];
                const path = document.getElementById(`${this.containerId}-territory-${territoryId}`);
                if (path) {
                  this.createTerritoryImage(path, territoryId, territoryData, imagesLayer);
                  imageCount++;
                } else {
                  console.error(`Path not found for territory ${territoryId}`);
                  errorCount++;
                }
              } catch (err) {
                console.error(`Error processing territory ${territoryId}:`, err);
                errorCount++;
              }
            });
            console.log(`Initiated ${imageCount} territory images, ${errorCount} errors`);
          }, 100);
        });
      }
    }

    createTerritoryImage(path, territoryId, territoryData, imagesLayer, retryCount = 0) {
      let imageUrl = territoryData.imageUrl ||
                     territoryData.repInfo?.imageUrl ||
                     territoryData.repInfo?.image ||
                     this.options.territoryImages.customImages[territoryId] ||
                     this.options.territoryImages.defaultImage;

      if (!imageUrl) {
        console.log(`No image found for territory ${territoryId}`);
        return;
      }

      console.log(`Creating image for territory ${territoryId}: ${imageUrl} (attempt ${retryCount + 1})`);

      if (retryCount > 3) {
        console.error(`Max retries exceeded for territory ${territoryId}`);
        return;
      }

      requestAnimationFrame(() => {
        try {
          if (!path.getBBox) {
            console.error(`Path element for ${territoryId} doesn't have getBBox method`);
            return;
          }

          if (!document.body.contains(path)) {
            console.warn(`Path for ${territoryId} not in DOM, retrying...`);
            setTimeout(() => this.createTerritoryImage(path, territoryId, territoryData, imagesLayer, retryCount + 1), 500);
            return;
          }

          let bbox;
          try {
            bbox = path.getBBox();
          } catch (e) {
            console.error(`Failed to get bbox for ${territoryId}:`, e);
            return;
          }

          if (isNaN(bbox.x) || isNaN(bbox.y) || isNaN(bbox.width) || isNaN(bbox.height)) {
            console.error(`Invalid bbox values for ${territoryId}:`, bbox);
            const pathData = path.getAttribute('d');
            if (!pathData || pathData.trim() === '') {
              console.error(`No path data for territory ${territoryId}`);
              return;
            }
            setTimeout(() => this.createTerritoryImage(path, territoryId, territoryData, imagesLayer, retryCount + 1), 1000);
            return;
          }

          if (bbox.width === 0 || bbox.height === 0) {
            console.warn(`Territory ${territoryId} has zero dimensions, retrying...`);
            setTimeout(() => this.createTerritoryImage(path, territoryId, territoryData, imagesLayer, retryCount + 1), 500);
            return;
          }

          const centerX = bbox.x + bbox.width / 2 + this.options.territoryImages.offsetX;
          const centerY = bbox.y + bbox.height / 2 + this.options.territoryImages.offsetY;

          if (isNaN(centerX) || isNaN(centerY)) {
            console.error(`Invalid center coordinates for ${territoryId}: (${centerX}, ${centerY})`);
            return;
          }

          console.log(`Territory ${territoryId} center: ${centerX.toFixed(2)}, ${centerY.toFixed(2)}`);

          const existingImage = document.getElementById(`${this.containerId}-territory-image-${territoryId}`);
          if (existingImage) {
            console.log(`Image already exists for territory ${territoryId}, skipping`);
            return;
          }

          const imageGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
          imageGroup.setAttribute("class", "usmap-territory-image-group");
          imageGroup.setAttribute("id", `${this.containerId}-territory-image-${territoryId}`);

          const clipId = `${this.containerId}-clip-${territoryId}`;
          const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
          clipPath.setAttribute("id", clipId);

          const clipShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          clipShape.setAttribute("cx", centerX.toString());
          clipShape.setAttribute("cy", centerY.toString());
          clipShape.setAttribute("r", (this.options.territoryImages.imageSize / 2).toString());
          clipPath.appendChild(clipShape);

          let defs = imagesLayer.parentElement.querySelector("defs");
          if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            imagesLayer.parentElement.insertBefore(defs, imagesLayer.parentElement.firstChild);
          }
          defs.appendChild(clipPath);

          const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
          image.setAttribute("class", "usmap-territory-image");
          image.setAttributeNS("http://www.w3.org/1999/xlink", "href", imageUrl);
          image.setAttribute("x", (centerX - this.options.territoryImages.imageSize / 2).toString());
          image.setAttribute("y", (centerY - this.options.territoryImages.imageSize / 2).toString());
          image.setAttribute("width", this.options.territoryImages.imageSize.toString());
          image.setAttribute("height", this.options.territoryImages.imageSize.toString());
          image.setAttribute("clip-path", `url(#${clipId})`);
          image.setAttribute("preserveAspectRatio", "xMidYMid slice");

          image.addEventListener("error", () => {
            console.error(`Failed to load image for territory ${territoryId}: ${imageUrl}`);
          });

          image.addEventListener("load", () => {
            console.log(`Successfully loaded image for territory ${territoryId}`);
          });

          if (this.options.territoryImages.border) {
            const borderParts = this.options.territoryImages.border.split(" ");
            const borderCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            borderCircle.setAttribute("cx", centerX.toString());
            borderCircle.setAttribute("cy", centerY.toString());
            borderCircle.setAttribute("r", (this.options.territoryImages.imageSize / 2).toString());
            borderCircle.setAttribute("fill", "none");
            borderCircle.setAttribute("stroke", borderParts[2] || "white");
            borderCircle.setAttribute("stroke-width", (borderParts[0].replace("px", "") || "2"));
            imageGroup.appendChild(borderCircle);
          }

          if (this.options.territoryImages.shadow) {
            const filterId = `${this.containerId}-shadow-${territoryId}`;
            const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
            filter.setAttribute("id", filterId);

            const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
            feGaussianBlur.setAttribute("in", "SourceAlpha");
            feGaussianBlur.setAttribute("stdDeviation", "2");

            const feOffset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
            feOffset.setAttribute("dx", "0");
            feOffset.setAttribute("dy", "2");
            feOffset.setAttribute("result", "offsetblur");

            const feComponentTransfer = document.createElementNS("http://www.w3.org/2000/svg", "feComponentTransfer");
            const feFuncA = document.createElementNS("http://www.w3.org/2000/svg", "feFuncA");
            feFuncA.setAttribute("type", "linear");
            feFuncA.setAttribute("slope", "0.2");
            feComponentTransfer.appendChild(feFuncA);

            const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
            const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
            const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
            feMergeNode2.setAttribute("in", "SourceGraphic");
            feMerge.appendChild(feMergeNode1);
            feMerge.appendChild(feMergeNode2);

            filter.appendChild(feGaussianBlur);
            filter.appendChild(feOffset);
            filter.appendChild(feComponentTransfer);
            filter.appendChild(feMerge);

            defs.appendChild(filter);
            image.setAttribute("filter", `url(#${filterId})`);
          }

          imageGroup.appendChild(image);
          imagesLayer.appendChild(imageGroup);

          if (this.options.territoryImages.hideOnHover) {
            path.addEventListener("mouseenter", () => {
              image.classList.add("hide-on-hover");
            });
            path.addEventListener("mouseleave", () => {
              image.classList.remove("hide-on-hover");
            });
          }

        } catch (error) {
          console.error(`Error creating image for territory ${territoryId}:`, error);
        }
      });
    }

    bindEvents() {
      if (this.options.showControls) {
        const statesBtn = document.getElementById(
          `${this.containerId}-statesBtn`
        );
        const territoriesBtn = document.getElementById(
          `${this.containerId}-territoriesBtn`
        );
        const bothBtn = document.getElementById(`${this.containerId}-bothBtn`);

        if (statesBtn) {
          statesBtn.addEventListener("click", () => this.setMode("states"));
        }
        if (territoriesBtn) {
          territoriesBtn.addEventListener("click", () =>
            this.setMode("territories")
          );
        }
        if (bothBtn) {
          bothBtn.addEventListener("click", () => this.setMode("both"));
        }
      }

      const closeBtn = document.getElementById(`${this.containerId}-closeBtn`);
      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.closeInfoPanel());
      }

      const schedulingMenuCloseBtn = document.getElementById(`${this.containerId}-schedulingMenuCloseBtn`);
      if (schedulingMenuCloseBtn) {
        schedulingMenuCloseBtn.addEventListener("click", () => this.closeSchedulingMenu());
      }

      const optionAE = document.getElementById(`${this.containerId}-option-ae`);
      const optionDemo = document.getElementById(`${this.containerId}-option-demo`);

      if (optionAE) {
        optionAE.addEventListener("click", () => this.handleSchedulingOptionClick('ae'));
      }
      if (optionDemo) {
        optionDemo.addEventListener("click", () => this.handleSchedulingOptionClick('demo'));
      }

      this.bindMapEvents();

      window.addEventListener("resize", () => this.handleResize());
    }

    bindMapEvents() {
      const states = document.querySelectorAll(".usmap-state");
      const territories = document.querySelectorAll(".usmap-territory");

      states.forEach((element) => {
        if (
          !this.options.stateInteractivity.hover &&
          !this.options.stateInteractivity.click
        ) {
          element.classList.add("no-interact");
          return;
        }

        if (this.touchDevice) {
          if (this.options.stateInteractivity.click) {
            element.addEventListener("touchstart", (e) =>
              this.handleTouch(e, element)
            );
            element.addEventListener("touchend", (e) =>
              this.handleClick(e, element)
            );
          }
        } else {
          if (this.options.stateInteractivity.hover) {
            element.addEventListener("mouseenter", (e) =>
              this.handleStateHover(e, element)
            );
            element.addEventListener("mouseleave", (e) =>
              this.handleStateLeave(e, element)
            );
            element.addEventListener("mousemove", (e) =>
              this.updateHoverPosition(e)
            );
          }
          if (this.options.stateInteractivity.click) {
            element.addEventListener("click", (e) =>
              this.handleClick(e, element)
            );
          }
        }
      });

      territories.forEach((element) => {
        if (
          !this.options.territoryInteractivity.hover &&
          !this.options.territoryInteractivity.click
        ) {
          element.style.cursor = "default";
          return;
        }

        if (this.touchDevice) {
          if (this.options.territoryInteractivity.click) {
            element.addEventListener("touchstart", (e) =>
              this.handleTouch(e, element)
            );
            element.addEventListener("touchend", (e) =>
              this.handleClick(e, element)
            );
          }
        } else {
          if (this.options.territoryInteractivity.hover) {
            element.addEventListener("mouseenter", (e) =>
              this.handleHover(e, element)
            );
            element.addEventListener("mouseleave", () => this.hideHoverModal());
            element.addEventListener("mousemove", (e) =>
              this.updateHoverPosition(e)
            );
          }
          if (this.options.territoryInteractivity.click) {
            element.addEventListener("click", (e) =>
              this.handleClick(e, element)
            );
          }
        }
      });
    }

    handleStateHover(e, element) {
      if (this.options.stateInteractivity.showTooltip) {
        this.showHoverModal(e, element);
      }

      if (this.options.territoryInteractivity.showOnStateHover) {
        this.showTerritories();
      }
    }

    handleStateLeave(e, element) {
      this.hideHoverModal();

      if (
        this.options.territoryInteractivity.showOnStateHover &&
        this.options.territoryInteractivity.hideInitially
      ) {
        this.hideTerritories();
      }
    }

    showTerritories() {
      const territories = document.querySelectorAll(".usmap-territory");
      territories.forEach((territory) => {
        territory.classList.add("visible");
      });
    }

    hideTerritories() {
      const territories = document.querySelectorAll(".usmap-territory");
      territories.forEach((territory) => {
        territory.classList.remove("visible");
      });
    }

    handleTouch(e, element) {
      e.preventDefault();
      this.showHoverModal(e, element);
    }

    handleHover(e, element) {
      this.showHoverModal(e, element);
    }

    showHoverModal(e, element) {
      const modal = document.getElementById(`${this.containerId}-hoverModal`);
      const content = document.getElementById(
        `${this.containerId}-hoverContent`
      );

      let title, info;
      if (element.dataset.type === "state") {
        title = element.dataset.name;
        info = element.dataset.abbreviation
          ? `(${element.dataset.abbreviation})`
          : "";
      } else if (element.dataset.type === "territory") {
        title = element.dataset.name;
        info = element.dataset.repEmail ? element.dataset.repEmail : "";
      }

      content.innerHTML = info
        ? `<strong>${title}</strong><br>${info}`
        : `<strong>${title}</strong>`;
      modal.classList.add("active");

      this.updateHoverPosition(e);
    }

    updateHoverPosition(e) {
      const modal = document.getElementById(`${this.containerId}-hoverModal`);
      const rect = this.container
        .querySelector(".usmap-svg-container")
        .getBoundingClientRect();

      modal.style.left = e.clientX - rect.left + "px";
      modal.style.top = e.clientY - rect.top + "px";
    }

    hideHoverModal() {
      const modal = document.getElementById(`${this.containerId}-hoverModal`);
      if (modal) {
        modal.classList.remove("active");
      }
    }

    handleClick(e, element) {
      e.preventDefault();
      this.hideHoverModal();
      this.selectElement(element);

      // Show scheduling menu for territories if both links exist
      if (element.dataset.type === "territory" &&
          element.dataset.repSchedLinkGetConnected &&
          element.dataset.repSchedLinkSsrDemoWeb) {
        this.showSchedulingMenu(element);
      } else {
        this.showInfoPanel(element);
      }
    }

    selectElement(element) {
      if (this.selectedElement) {
        this.selectedElement.classList.remove("selected");
      }

      element.classList.add("selected");
      this.selectedElement = element;
    }

    showSchedulingMenu(element) {
      const menu = document.getElementById(`${this.containerId}-schedulingMenu`);
      if (menu) {
        menu.classList.add("active");
        this.schedulingMenuVisible = true;

        // Store the element for later use when an option is selected
        this.schedulingMenuElement = element;
      }
    }

    closeSchedulingMenu() {
      const menu = document.getElementById(`${this.containerId}-schedulingMenu`);
      if (menu) {
        menu.classList.remove("active");
        this.schedulingMenuVisible = false;
      }

      if (this.selectedElement) {
        this.selectedElement.classList.remove("selected");
        this.selectedElement = null;
      }

      this.schedulingMenuElement = null;
    }

    handleSchedulingOptionClick(option) {
      if (!this.schedulingMenuElement) return;

      const element = this.schedulingMenuElement;

      // Close the menu
      this.closeSchedulingMenu();

      // Re-select the element for the info panel
      this.selectElement(element);

      // Show the info panel with the selected scheduling link
      this.showInfoPanel(element, option);
    }

    showInfoPanel(element, schedulingOption = 'ae') {
      const panel = document.getElementById(`${this.containerId}-infoPanel`);
      const title = document.getElementById(`${this.containerId}-infoTitle`);
      const titleDescription = document.getElementById(
        `${this.containerId}-infoTitleDescription`
      );
      const description = document.getElementById(
        `${this.containerId}-infoDescription`
      );
      const stats = document.getElementById(`${this.containerId}-infoStats`);

      if (element.dataset.type === "state") {
        title.textContent = element.dataset.name;
        if (description) description.textContent = `${element.dataset.name} (${element.dataset.abbreviation})`;

        stats.innerHTML = `
      <div class="usmap-stat-item">
        <div class="usmap-stat-value">${element.dataset.abbreviation}</div>
        <div class="usmap-stat-label">State Code</div>
      </div>
    `;
      } else if (element.dataset.type === "territory") {
        title.textContent = element.dataset.name;
        titleDescription.innerHTML = `<a href="mailto:${element.dataset.repEmail}">${
          element.dataset.repEmail ? element.dataset.repEmail : ""
        }</a><br/><a href="tel:+1${element.dataset.repPhone}">${
          element.dataset.repPhone ? element.dataset.repPhone + "<br/>" : ""
        }`;

        // Choose which scheduling link to use based on the option
        const schedLink = schedulingOption === 'demo'
          ? element.dataset.repSchedLinkSsrDemoWeb
          : element.dataset.repSchedLinkGetConnected;

        const repSchedInfo = schedLink
          ? `
        <!-- Start of Meetings Embed Script -->
        <div class="meetings-iframe-container" data-src="${schedLink}?embed=true"></div>
        <!-- End of Meetings Embed Script -->
    `
          : "";

        stats.innerHTML = repSchedInfo;

        // Manually add and execute the HubSpot script AFTER setting innerHTML
        if (element.dataset.repEmail && schedLink) {
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.src =
            "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js";
          script.async = true;
          stats.appendChild(script);
        }
      }

      panel.classList.add("active");
    }

    closeInfoPanel() {
      const panel = document.getElementById(`${this.containerId}-infoPanel`);

      if (panel) {
        panel.classList.remove("active");
      }

      if (this.selectedElement) {
        this.selectedElement.classList.remove("selected");
        this.selectedElement = null;
      }
    }

    setMode(mode) {
      this.currentMode = mode;

      document
        .querySelectorAll(`#${this.containerId} .usmap-control-btn`)
        .forEach((btn) => btn.classList.remove("active"));

      const activeBtn = document.getElementById(
        `${this.containerId}-${mode}Btn`
      );
      if (activeBtn) activeBtn.classList.add("active");

      const statesLayer = document.getElementById(
        `${this.containerId}-states-layer`
      );
      const territoriesLayer = document.getElementById(
        `${this.containerId}-territories-layer`
      );
      const imagesLayer = document.getElementById(
        `${this.containerId}-territory-images-layer`
      );

      switch (mode) {
        case "states":
          if (statesLayer) statesLayer.style.display = "block";
          if (territoriesLayer) territoriesLayer.style.display = "none";
          if (imagesLayer) imagesLayer.style.display = "none";
          break;
        case "territories":
          if (statesLayer) statesLayer.style.display = "none";
          if (territoriesLayer) territoriesLayer.style.display = "block";
          if (imagesLayer) imagesLayer.style.display = "block";
          break;
        case "both":
          if (statesLayer) statesLayer.style.display = "block";
          if (territoriesLayer) territoriesLayer.style.display = "block";
          if (imagesLayer) imagesLayer.style.display = "block";
          break;
      }

      this.closeInfoPanel();
      this.closeSchedulingMenu();
    }

    setupResponsive() {
      const svg = this.container.querySelector(".usmap-svg");
      if (!svg) return;

      svg.setAttribute("viewBox", "0 0 960 600");
    }

    handleResize() {
      this.setupResponsive();
      this.hideHoverModal();

      if (window.innerWidth < 768) {
        this.closeInfoPanel();
        this.closeSchedulingMenu();
      }
    }

    destroy() {
      window.removeEventListener("resize", () => this.handleResize());

      if (this.container) {
        this.container.innerHTML = "";
      }

      this.selectedElement = null;
      this.currentMode = "both";
    }

    refresh() {
      this.destroy();
      this.loadDependencies().then(() => {
        this.init();
      });
    }

    static init(containerId, options) {
      return new USMapController(containerId, options);
    }
  }

  window.USMapController = USMapController;

  function autoInit() {
    const autoInitElements = document.querySelectorAll("[data-usmap]");
    autoInitElements.forEach((element) => {
      const options = {};

      if (element.dataset.stateDataPath)
        options.stateDataPath = element.dataset.stateDataPath;
      if (element.dataset.territoryDataPath)
        options.territoryDataPath = element.dataset.territoryDataPath;
      if (element.dataset.stateFill)
        options.stateFill = element.dataset.stateFill;
      if (element.dataset.territoryFill)
        options.territoryFill = element.dataset.territoryFill;

      new USMapController(element.id, options);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = USMapController;
  }
})(window, document);
