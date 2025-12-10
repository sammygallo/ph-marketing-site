// Territory data with scheduling links for Account Executive meetings and Platform Demos
const territoryData = {
  // Example territories - update with actual territory names and links
  "Northeast": {
    name: "Northeast Region",
    scheduling_link_1: "https://calendly.com/account-executive/northeast-intro",
    scheduling_link_2: "https://calendly.com/account-executive/northeast-demo"
  },
  "Southeast": {
    name: "Southeast Region",
    scheduling_link_1: "https://calendly.com/account-executive/southeast-intro",
    scheduling_link_2: "https://calendly.com/account-executive/southeast-demo"
  },
  "Midwest": {
    name: "Midwest Region",
    scheduling_link_1: "https://calendly.com/account-executive/midwest-intro",
    scheduling_link_2: "https://calendly.com/account-executive/midwest-demo"
  },
  "Southwest": {
    name: "Southwest Region",
    scheduling_link_1: "https://calendly.com/account-executive/southwest-intro",
    scheduling_link_2: "https://calendly.com/account-executive/southwest-demo"
  },
  "West": {
    name: "West Region",
    scheduling_link_1: "https://calendly.com/account-executive/west-intro",
    scheduling_link_2: "https://calendly.com/account-executive/west-demo"
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = territoryData;
}
