  /****************************************
     * CONFIG & GLOBALS
     ****************************************/
    const textEndpoint = "https://text.pollinations.ai/openai";
    const HEADERS = { "Content-Type": "application/json" };
    const TOKEN = "gacha11211";
    const REFERER = "gacha11211";
    
    // DOM Elements
    const storyContainer = document.getElementById("storyContainer");
    const statusElem = document.getElementById("status");
    const generateBtn = document.getElementById("generateBtn");
    const promptInput = document.getElementById("promptInput");
    const progressBar = document.getElementById("progressBar");
    const storyEnd = document.getElementById("storyEnd");
    const newStoryBtn = document.getElementById("newStoryBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsPanel = document.getElementById("settingsPanel");
    const voiceSelect = document.getElementById("voiceSelect");
    const imageModelSelect = document.getElementById("imageModelSelect");
    const webSearchToggle = document.getElementById("webSearchToggle");
    const searchOverlay = document.getElementById("searchOverlay");
    const searchStatus = document.getElementById("searchStatus");
    
    // Audio context for streaming
let audioContext;
let playbackTimeOffset = 0;
const sampleRate = 24000;

// Story generation state
let isGenerating = false;
let currentChunkIndex = 0;
let totalChunks = 0;
let storyChunks = [];
let audioQueue = []; // Queue to store audio chunks for better sync
let preloadedChunks = []; // Store preloaded chunk assets
let preloadingStarted = false;

// Settings state
let selectedVoice = "sage";
let selectedImageModel = "flux";
let selectedTextModel = "openai-large";
let useWebSearch = false;
let selectedTheme = "kids";
// Website appearance theme (original customTheme)
let websiteTheme = {
  primary: "#FFA726", // 主要颜色 - 一个鲜艳的橘色
  secondary: "#FFB74D", // 次要颜色 - 一个较浅的橘色
  accent: "#FFC97F", // 强调颜色 - 一个更柔和的橘色
  textColor: "#4E342E", // 文本颜色 - 深棕色，与橘色搭配良好
  bgColor1: "#FFF3E0", // 背景色1 - 非常浅的橘色/桃色
  bgColor2: "#FFE0B2", // 背景色2 - 略深的柔和橘色
  backgroundGradient: "linear-gradient(135deg, #FFF3E0, #FFE0B2)", // 背景渐变
  backgroundPattern: "none",
  backgroundAnimation: "none",
  cardBackground: "white",
  headerBackground: "rgba(255,243,224,0.9)", // 头部背景 - 半透明的浅橘色
  headerBorder: "4px solid var(--primary)",
  headingFont: "'Fredoka One', cursive",
  bodyFont: "'Nunito', sans-serif",
  textShadow: "3px 3px 0px rgba(0,0,0,0.1)",
  cardBorderRadius: "20px",
  buttonStyle: "linear-gradient(45deg, var(--primary), #FFB74D)" // 按钮样式 - 从主色到次色的渐变
};

// Story theme customization (new structure for story content)
let customTheme = {
  // Story genre
  mainGenre: "fantasy",
  subGenre: "none",
  
  // Characters
  mainCharacterType: "child",
  characterTraits: ["brave", "curious", "kind"],
  includeSidekick: true,
  
  // Setting
  setting: "magical",
  timePeriod: "present",
  weather: "sunny",
  
  // Plot
  plotFocus: "adventure",
  includeSpecialPowers: true,
  includeLesson: true,
  lessonType: "friendship",
  
  // Narrative
  narrativeStyle: "standard",
  narratorPerspective: "third",
  includeInteractivity: false,
  
  // Visual style
  artStyle: "storybook",
  colorScheme: "vibrant",
  customImageStyle: "",
  
  // Legacy property for backward compatibility
  storyStyle: "standard",
  imageStyle: ""
};

// Initialize event listeners
generateBtn.addEventListener("click", startStoryGeneration);
newStoryBtn.addEventListener("click", resetStory);
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startStoryGeneration();
});

// Settings panel toggle
settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("active");
  settingsBtn.classList.toggle("active");
  // Add a fun spin animation when clicked
  settingsBtn.style.transform = settingsBtn.classList.contains("active") 
    ? "rotate(180deg)" 
    : "rotate(0deg)";
  settingsBtn.style.transition = "transform 0.5s";
});

// Settings change handlers
voiceSelect.addEventListener("change", (e) => {
  selectedVoice = e.target.value;
  // Play a small sound effect when voice changes
  playSelectSound(300 + Math.random() * 200);
});

imageModelSelect.addEventListener("change", (e) => {
  selectedImageModel = e.target.value;
  // Play a small sound effect when model changes
  playSelectSound(500 + Math.random() * 200);
});

webSearchToggle.addEventListener("change", (e) => {
  useWebSearch = e.target.checked;
  // Update UI to show search status
  const searchStatus = document.getElementById('searchStatus');
  if (useWebSearch) {
    searchStatus.style.display = 'inline';
    // Add a brief highlight animation
    searchStatus.style.animation = 'pulse 1s';
    setTimeout(() => {
      searchStatus.style.animation = 'none';
    }, 1000);
  } else {
    searchStatus.style.display = 'none';
  }
  // Play a toggle sound effect
  playSelectSound(useWebSearch ? 600 : 400);
});

// Theme selection handler
const themeSelect = document.getElementById("themeSelect");
const customThemePanel = document.getElementById("customThemePanel");

themeSelect.addEventListener("change", (e) => {
  selectedTheme = e.target.value;
  
  // Show/hide custom theme panel
  if (selectedTheme === "custom") {
    customThemePanel.classList.add("active");
    // Apply the custom theme immediately if it exists
    applyTheme(selectedTheme);
  } else {
    customThemePanel.classList.remove("active");
    // Apply the selected theme
    applyTheme(selectedTheme);
  }
  
  // Play a selection sound effect
  playSelectSound(450 + Math.random() * 200);
});

// Custom theme input elements
const primaryColorPicker = document.getElementById("primaryColor");
const secondaryColorPicker = document.getElementById("secondaryColor");
const accentColorPicker = document.getElementById("accentColor");
const textColorPicker = document.getElementById("textColor");
const bgColor1Picker = document.getElementById("bgColor1");
const bgColor2Picker = document.getElementById("bgColor2");
const headingFontSelect = document.getElementById("headingFontSelect");
const bodyFontSelect = document.getElementById("bodyFontSelect");
const backgroundPatternSelect = document.getElementById("backgroundPatternSelect");
const backgroundAnimationSelect = document.getElementById("backgroundAnimationSelect");
const textShadowSelect = document.getElementById("textShadowSelect");
const buttonStyleSelect = document.getElementById("buttonStyleSelect");
const cardRadiusRange = document.getElementById("cardRadiusRange");
const cardRadiusValue = document.getElementById("cardRadiusValue");
const storyStyleSelect = document.getElementById("storyStyleSelect");
const customImageStyleInput = document.getElementById("customImageStyle");
const textModelSelect = document.getElementById("textModelSelect");

// Initialize website theme form (these elements have been removed from UI but keeping code for reference)
// Then initialize the custom story theme elements with values

// Initialize custom story theme form with values
storyStyleSelect.value = customTheme.narrativeStyle || customTheme.storyStyle;
document.getElementById('storyGenreSelect').value = customTheme.mainGenre || "fantasy";
document.getElementById('storySubgenreSelect').value = customTheme.subGenre || "none";
document.getElementById('mainCharacterType').value = customTheme.mainCharacterType || "child";
document.getElementById('characterTraitsInput').value = Array.isArray(customTheme.characterTraits) ? 
  customTheme.characterTraits.join(', ') : "brave, curious, kind";
document.getElementById('sidekickToggle').checked = customTheme.includeSidekick !== false;
document.getElementById('settingSelect').value = customTheme.setting || "magical";
document.getElementById('timePeriodSelect').value = customTheme.timePeriod || "present";
document.getElementById('weatherSelect').value = customTheme.weather || "sunny";
document.getElementById('plotFocusSelect').value = customTheme.plotFocus || "adventure";
document.getElementById('specialElementToggle').checked = customTheme.includeSpecialPowers !== false;
document.getElementById('lessonToggle').checked = customTheme.includeLesson !== false;
document.getElementById('lessonTypeSelect').value = customTheme.lessonType || "friendship";
document.getElementById('narratorSelect').value = customTheme.narratorPerspective || "third";
document.getElementById('interactivityToggle').checked = customTheme.includeInteractivity === true;
document.getElementById('artStyleSelect').value = customTheme.artStyle || "storybook";
document.getElementById('colorSchemeSelect').value = customTheme.colorScheme || "vibrant";
customImageStyleInput.value = customTheme.customImageStyle || customTheme.imageStyle || "";
textModelSelect.value = selectedTextModel;
document.getElementById('imagePromptModelSelect').value = 
  document.getElementById('imagePromptModelSelect').getAttribute('value') || "openai-large";

// Event handlers for custom story theme elements
// Genre options
document.getElementById('storyGenreSelect').addEventListener("change", (e) => {
  customTheme.mainGenre = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customStoryGenre');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom genre input
document.getElementById('customStoryGenreInput').addEventListener("input", (e) => {
  if (document.getElementById('storyGenreSelect').value === 'other') {
    customTheme.mainGenre = 'custom:' + e.target.value;
  }
});

document.getElementById('storySubgenreSelect').addEventListener("change", (e) => {
  customTheme.subGenre = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customStorySubgenre');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom subgenre input
document.getElementById('customStorySubgenreInput').addEventListener("input", (e) => {
  if (document.getElementById('storySubgenreSelect').value === 'other') {
    customTheme.subGenre = 'custom:' + e.target.value;
  }
});

// Character options
document.getElementById('mainCharacterType').addEventListener("change", (e) => {
  customTheme.mainCharacterType = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customMainCharacter');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom character type input
document.getElementById('customMainCharacterInput').addEventListener("input", (e) => {
  if (document.getElementById('mainCharacterType').value === 'other') {
    customTheme.mainCharacterType = 'custom:' + e.target.value;
  }
});

document.getElementById('characterTraitsInput').addEventListener("input", (e) => {
  customTheme.characterTraits = e.target.value.split(',').map(trait => trait.trim()).filter(Boolean);
});

document.getElementById('sidekickToggle').addEventListener("change", (e) => {
  customTheme.includeSidekick = e.target.checked;
  playSelectSound(e.target.checked ? 600 : 400);
});

// Setting options
document.getElementById('settingSelect').addEventListener("change", (e) => {
  customTheme.setting = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customSetting');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom setting input
document.getElementById('customSettingInput').addEventListener("input", (e) => {
  if (document.getElementById('settingSelect').value === 'other') {
    customTheme.setting = 'custom:' + e.target.value;
  }
});

document.getElementById('timePeriodSelect').addEventListener("change", (e) => {
  customTheme.timePeriod = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customTimePeriod');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom time period input
document.getElementById('customTimePeriodInput').addEventListener("input", (e) => {
  if (document.getElementById('timePeriodSelect').value === 'other') {
    customTheme.timePeriod = 'custom:' + e.target.value;
  }
});

document.getElementById('weatherSelect').addEventListener("change", (e) => {
  customTheme.weather = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customWeather');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom weather input
document.getElementById('customWeatherInput').addEventListener("input", (e) => {
  if (document.getElementById('weatherSelect').value === 'other') {
    customTheme.weather = 'custom:' + e.target.value;
  }
});

// Plot elements
document.getElementById('plotFocusSelect').addEventListener("change", (e) => {
  customTheme.plotFocus = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customPlotFocus');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom plot focus input
document.getElementById('customPlotFocusInput').addEventListener("input", (e) => {
  if (document.getElementById('plotFocusSelect').value === 'other') {
    customTheme.plotFocus = 'custom:' + e.target.value;
  }
});

document.getElementById('specialElementToggle').addEventListener("change", (e) => {
  customTheme.includeSpecialPowers = e.target.checked;
  playSelectSound(e.target.checked ? 600 : 400);
});

document.getElementById('lessonToggle').addEventListener("change", (e) => {
  customTheme.includeLesson = e.target.checked;
  // Show/hide lesson type selector based on toggle
  document.getElementById('lessonTypeContainer').style.display = 
    e.target.checked ? 'block' : 'none';
  playSelectSound(e.target.checked ? 600 : 400);
});

document.getElementById('lessonTypeSelect').addEventListener("change", (e) => {
  customTheme.lessonType = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customLessonType');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom lesson type input
document.getElementById('customLessonTypeInput').addEventListener("input", (e) => {
  if (document.getElementById('lessonTypeSelect').value === 'other') {
    customTheme.lessonType = 'custom:' + e.target.value;
  }
});

// Narrative style
storyStyleSelect.addEventListener("change", (e) => {
  customTheme.narrativeStyle = e.target.value;
  customTheme.storyStyle = e.target.value; // for backward compatibility
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customStoryStyle');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom narrative style input
document.getElementById('customStoryStyleInput').addEventListener("input", (e) => {
  if (storyStyleSelect.value === 'other') {
    customTheme.narrativeStyle = 'custom:' + e.target.value;
    customTheme.storyStyle = 'custom:' + e.target.value; // for backward compatibility
  }
});

document.getElementById('narratorSelect').addEventListener("change", (e) => {
  customTheme.narratorPerspective = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customNarrator');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom narrator perspective input
document.getElementById('customNarratorInput').addEventListener("input", (e) => {
  if (document.getElementById('narratorSelect').value === 'other') {
    customTheme.narratorPerspective = 'custom:' + e.target.value;
  }
});

document.getElementById('interactivityToggle').addEventListener("change", (e) => {
  customTheme.includeInteractivity = e.target.checked;
  playSelectSound(e.target.checked ? 600 : 400);
});

// Visual style
document.getElementById('artStyleSelect').addEventListener("change", (e) => {
  customTheme.artStyle = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customArtStyle');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom art style input
document.getElementById('customArtStyleInput').addEventListener("input", (e) => {
  if (document.getElementById('artStyleSelect').value === 'other') {
    customTheme.artStyle = 'custom:' + e.target.value;
  }
});

document.getElementById('colorSchemeSelect').addEventListener("change", (e) => {
  customTheme.colorScheme = e.target.value;
  // Show/hide custom input field if "other" is selected
  const customInput = document.getElementById('customColorScheme');
  if (e.target.value === 'other') {
    customInput.style.display = 'block';
  } else {
    customInput.style.display = 'none';
  }
  playSelectSound(350);
});

// Add event listener for custom color scheme input
document.getElementById('customColorSchemeInput').addEventListener("input", (e) => {
  if (document.getElementById('colorSchemeSelect').value === 'other') {
    customTheme.colorScheme = 'custom:' + e.target.value;
  }
});

customImageStyleInput.addEventListener("input", (e) => {
  customTheme.customImageStyle = e.target.value;
  customTheme.imageStyle = e.target.value; // for backward compatibility
});

// Image Prompt model selection handler
document.getElementById('imagePromptModelSelect').addEventListener("change", (e) => {
  const modelName = e.target.options[e.target.selectedIndex].text;
  updateStatus(`Image Prompt Model changed to ${modelName}`, false);
  setTimeout(() => {
    updateStatus("Ready for your imagination!", false);
  }, 2000);
  playSelectSound(500);
});

// Text model selection handler
textModelSelect.addEventListener("change", (e) => {
  selectedTextModel = e.target.value;
  updateStatus(`AI Model changed to ${textModelSelect.options[textModelSelect.selectedIndex].text}`, false);
  setTimeout(() => {
    updateStatus("Ready for your imagination!", false);
  }, 2000);
  playSelectSound(600);
});

// Save and reset buttons for custom story theme
document.getElementById("saveCustomTheme").addEventListener("click", () => {
  // Save custom theme settings from all form elements
  // For each select field, check if "other" is selected and use custom input if available
  
  // Story Genre
  const storyGenreSelect = document.getElementById('storyGenreSelect');
  if (storyGenreSelect.value === 'other') {
    const customValue = document.getElementById('customStoryGenreInput').value;
    customTheme.mainGenre = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.mainGenre = storyGenreSelect.value;
  }
  
  // Sub-genre
  const storySubgenreSelect = document.getElementById('storySubgenreSelect');
  if (storySubgenreSelect.value === 'other') {
    const customValue = document.getElementById('customStorySubgenreInput').value;
    customTheme.subGenre = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.subGenre = storySubgenreSelect.value;
  }
  
  // Main Character Type
  const mainCharacterSelect = document.getElementById('mainCharacterType');
  if (mainCharacterSelect.value === 'other') {
    const customValue = document.getElementById('customMainCharacterInput').value;
    customTheme.mainCharacterType = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.mainCharacterType = mainCharacterSelect.value;
  }
  
  // Character traits (no change needed as it's already a direct input)
  customTheme.characterTraits = document.getElementById('characterTraitsInput').value.split(',').map(trait => trait.trim()).filter(Boolean);
  customTheme.includeSidekick = document.getElementById('sidekickToggle').checked;
  
  // Setting
  const settingSelect = document.getElementById('settingSelect');
  if (settingSelect.value === 'other') {
    const customValue = document.getElementById('customSettingInput').value;
    customTheme.setting = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.setting = settingSelect.value;
  }
  
  // Time Period
  const timePeriodSelect = document.getElementById('timePeriodSelect');
  if (timePeriodSelect.value === 'other') {
    const customValue = document.getElementById('customTimePeriodInput').value;
    customTheme.timePeriod = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.timePeriod = timePeriodSelect.value;
  }
  
  // Weather
  const weatherSelect = document.getElementById('weatherSelect');
  if (weatherSelect.value === 'other') {
    const customValue = document.getElementById('customWeatherInput').value;
    customTheme.weather = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.weather = weatherSelect.value;
  }
  
  // Plot Focus
  const plotFocusSelect = document.getElementById('plotFocusSelect');
  if (plotFocusSelect.value === 'other') {
    const customValue = document.getElementById('customPlotFocusInput').value;
    customTheme.plotFocus = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.plotFocus = plotFocusSelect.value;
  }
  
  // Toggle values (no change needed)
  customTheme.includeSpecialPowers = document.getElementById('specialElementToggle').checked;
  customTheme.includeLesson = document.getElementById('lessonToggle').checked;
  
  // Lesson Type
  const lessonTypeSelect = document.getElementById('lessonTypeSelect');
  if (lessonTypeSelect.value === 'other') {
    const customValue = document.getElementById('customLessonTypeInput').value;
    customTheme.lessonType = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.lessonType = lessonTypeSelect.value;
  }
  
  // Narrative Style
  if (storyStyleSelect.value === 'other') {
    const customValue = document.getElementById('customStoryStyleInput').value;
    customTheme.narrativeStyle = customValue ? 'custom:' + customValue : 'other';
    customTheme.storyStyle = customTheme.narrativeStyle; // For backward compatibility
  } else {
    customTheme.narrativeStyle = storyStyleSelect.value;
    customTheme.storyStyle = storyStyleSelect.value; // For backward compatibility
  }
  
  // Narrator Perspective
  const narratorSelect = document.getElementById('narratorSelect');
  if (narratorSelect.value === 'other') {
    const customValue = document.getElementById('customNarratorInput').value;
    customTheme.narratorPerspective = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.narratorPerspective = narratorSelect.value;
  }
  
  // Interactivity toggle (no change needed)
  customTheme.includeInteractivity = document.getElementById('interactivityToggle').checked;
  
  // Art Style
  const artStyleSelect = document.getElementById('artStyleSelect');
  if (artStyleSelect.value === 'other') {
    const customValue = document.getElementById('customArtStyleInput').value;
    customTheme.artStyle = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.artStyle = artStyleSelect.value;
  }
  
  // Color Scheme
  const colorSchemeSelect = document.getElementById('colorSchemeSelect');
  if (colorSchemeSelect.value === 'other') {
    const customValue = document.getElementById('customColorSchemeInput').value;
    customTheme.colorScheme = customValue ? 'custom:' + customValue : 'other';
  } else {
    customTheme.colorScheme = colorSchemeSelect.value;
  }
  
  // Custom image style (already a direct input)
  customTheme.customImageStyle = customImageStyleInput.value;
  customTheme.imageStyle = customImageStyleInput.value; // For backward compatibility
  
  // Apply theme and show visual feedback
  applyTheme("custom");
  createConfetti(20);
  
  // Show confirmation
  updateStatus("Custom story theme saved!", false);
  setTimeout(() => {
    updateStatus("Ready for your imagination!", false);
  }, 2000);
});

document.getElementById("resetCustomTheme").addEventListener("click", () => {
  // Reset to default story theme values
  customTheme = {
    // Story genre
    mainGenre: "fantasy",
    subGenre: "none",
    
    // Characters
    mainCharacterType: "child",
    characterTraits: ["brave", "curious", "kind"],
    includeSidekick: true,
    
    // Setting
    setting: "magical",
    timePeriod: "present",
    weather: "sunny",
    
    // Plot
    plotFocus: "adventure",
    includeSpecialPowers: true,
    includeLesson: true,
    lessonType: "friendship",
    
    // Narrative
    narrativeStyle: "standard",
    narratorPerspective: "third",
    includeInteractivity: false,
    
    // Visual style
    artStyle: "storybook",
    colorScheme: "vibrant",
    customImageStyle: "",
    
    // Legacy properties for backward compatibility
    storyStyle: "standard",
    imageStyle: ""
  };
  
  // Update all form elements with reset values
  document.getElementById('storyGenreSelect').value = customTheme.mainGenre;
  document.getElementById('storySubgenreSelect').value = customTheme.subGenre;
  document.getElementById('mainCharacterType').value = customTheme.mainCharacterType;
  document.getElementById('characterTraitsInput').value = customTheme.characterTraits.join(', ');
  document.getElementById('sidekickToggle').checked = customTheme.includeSidekick;
  document.getElementById('settingSelect').value = customTheme.setting;
  document.getElementById('timePeriodSelect').value = customTheme.timePeriod;
  document.getElementById('weatherSelect').value = customTheme.weather;
  document.getElementById('plotFocusSelect').value = customTheme.plotFocus;
  document.getElementById('specialElementToggle').checked = customTheme.includeSpecialPowers;
  document.getElementById('lessonToggle').checked = customTheme.includeLesson;
  document.getElementById('lessonTypeContainer').style.display = customTheme.includeLesson ? 'block' : 'none';
  document.getElementById('lessonTypeSelect').value = customTheme.lessonType;
  storyStyleSelect.value = customTheme.narrativeStyle;
  document.getElementById('narratorSelect').value = customTheme.narratorPerspective;
  document.getElementById('interactivityToggle').checked = customTheme.includeInteractivity;
  document.getElementById('artStyleSelect').value = customTheme.artStyle;
  document.getElementById('colorSchemeSelect').value = customTheme.colorScheme;
  customImageStyleInput.value = customTheme.customImageStyle;
  
  // Visual feedback
  updateStatus("Story theme settings reset to defaults", false);
  setTimeout(() => {
    updateStatus("Ready for your imagination!", false);
  }, 2000);
  
  // Play a reset sound
  playSelectSound(300);
});

// Function to play a small selection sound
function playSelectSound(freq) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log("Sound effect failed to play", e);
  }
}

// Create some visual elements on load
createConfetti(20);
animateBlobs();

/****************************************
* MAIN LOGIC
****************************************/
async function startStoryGeneration() {
  const userPrompt = promptInput.value.trim();
  if (!userPrompt) {
    updateStatus("Please enter a story idea first!", false);
    shakeElement(promptInput);
    return;
  }
  
  if (isGenerating) return;
  isGenerating = true;
  
  // Reset state
  resetStory();
  generateBtn.disabled = true;
  updateStatus("Generating your magical story...", true);
  
  try {
    // Initialize audio context (must be initiated by user action)
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    playbackTimeOffset = audioContext.currentTime;
    
    // 1. Get entire story - search web if toggle is on
    let story;
    if (useWebSearch) {
      updateStatus("Searching the web for information...", true);
      // Show search overlay
      searchOverlay.style.display = 'flex';
      story = await fetchSearchBasedStory(userPrompt);
      // Hide search overlay when done
      searchOverlay.style.display = 'none';
    } else {
      story = await fetchFullStory(userPrompt);
    }
    
    updateStatus("Splitting story into chunks...", true);
    
    // 2. Split story into 1-2 paragraph chunks
    storyChunks = splitStoryIntoOneOrTwoParagraphs(story);
    totalChunks = storyChunks.length;
    updateProgress(0);
    
    // 3. Start preloading all chunks concurrently
    updateStatus("Preparing story magic...", true);
    preloadingStarted = true;
    preloadAllChunks();
    
    // 4. Process each chunk as they become ready
    currentChunkIndex = 0;
    await processNextChunk();
    
    // 5. Show completion message
    updateStatus("Your magical story is complete!", false);
    storyEnd.classList.add("active");
    generateBtn.disabled = false;
    createConfetti(50);
    
  } catch (err) {
    console.error("Story generation error:", err);
    updateStatus("Oh no! Story magic failed: " + err.message, false);
    generateBtn.disabled = false;
  }
  
  isGenerating = false;
}

// Function to fetch a story using web search
async function fetchSearchBasedStory(userPrompt) {
  // Generate current datetime and random seed
  const currentDatetime = new Date().toISOString();
  const searchSeed = Math.floor(Math.random() * 1000000);
  
  // First, use searchgpt to search for information
  const searchPayload = {
    model: "searchgpt", // Always use searchgpt for web search
    messages: [
      {
        role: "system", 
        content: `It's ${currentDatetime} today! Always use web tool before replying and perform websearch. Convert the UTC time accordingly to user's timezone if provided`
      },
      {
        role: "user", 
        content: `Perform search for: ${userPrompt}`
      }
    ],
    temperature: 1.0,
    top_p: 1.0,
    seed: searchSeed,
    private: true,
    nofeed: true,
    token: TOKEN,
    referer: REFERER,
    max_tokens: 128000
  };
  
  updateStatus("Searching the web for story ideas...", true);
  
  // First part - web search with retry logic
  let searchResults = "";
  const maxSearchRetries = 2;
  let searchRetryCount = 0;
  
  while (searchRetryCount <= maxSearchRetries) {
    try {
      const searchResp = await fetch(textEndpoint, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(searchPayload)
      });
      
      if (!searchResp.ok) {
        throw new Error(`Web search API error: ${searchResp.status}`);
      }
      
      const searchData = await searchResp.json();
      searchResults = searchData.choices?.[0]?.message?.content || "";
      
      if (!searchResults) {
        throw new Error("Empty search results");
      }
      
      break; // Success, exit loop
      
    } catch (err) {
      searchRetryCount++;
      
      if (searchRetryCount <= maxSearchRetries) {
        updateStatus(`Search retry ${searchRetryCount}/${maxSearchRetries}...`, true);
        await new Promise(resolve => setTimeout(resolve, 2000 * searchRetryCount));
      } else {
        throw new Error(`Web search failed after ${maxSearchRetries + 1} attempts: ${err.message}`);
      }
    }
  }
  
  // Display the selected model in the status
  const modelDisplayName = textModelSelect.options[textModelSelect.selectedIndex].text;
  updateStatus(`Creating a ${selectedTheme} story with ${modelDisplayName} based on search...`, true);
  
  // Get theme-specific prompt for the story based on search results
  let storyPrompt;
  if (selectedTheme === "custom") {
    // Build a comprehensive prompt using all the custom story theme settings
    
    // Narrative style/voice
    let narrativeStyle = "";
    const narrativeStyles = {
      "standard": "straightforward, clear narrative style",
      "poetic": "poetic, lyrical style with metaphors, rhythm, and evocative imagery",
      "dramatic": "dramatic, emotionally intense style with high stakes and conflict",
      "humorous": "humorous, light-hearted style with wit, wordplay, and amusing situations",
      "mysterious": "mysterious, intriguing style with enigmatic elements and subtle clues",
      "educational": "educational style that teaches while entertaining",
      "conversational": "conversational, casual tone that directly addresses the reader",
      "rhyming": "rhyming verse with consistent rhythm patterns"
    };
    narrativeStyle = narrativeStyles[customTheme.narrativeStyle || customTheme.storyStyle] || narrativeStyles.standard;
    
    // Narrator perspective
    let perspective = "";
    const perspectives = {
      "first": "first-person perspective (using 'I' or 'we')",
      "second": "second-person perspective (using 'you')",
      "third": "third-person perspective (using 'he', 'she', or 'they')"
    };
    perspective = perspectives[customTheme.narratorPerspective] || perspectives.third;
    
    // Character details
    let characterDescription = "";
    const characterTypes = {
      "child": "child protagonist",
      "adult": "adult character",
      "animal": "animal character",
      "magical": "magical being",
      "robot": "robot or AI character",
      "mythical": "mythical creature",
      "toy": "living toy character",
      "plant": "living plant character"
    };
    
    const mainCharacter = characterTypes[customTheme.mainCharacterType] || characterTypes.child;
    const traits = Array.isArray(customTheme.characterTraits) ? 
      customTheme.characterTraits.join(", ") : "brave, curious, kind";
    
    characterDescription = `The main character should be a ${mainCharacter} who is ${traits}`;
    
    if (customTheme.includeSidekick) {
      characterDescription += " and should have a friend or sidekick who accompanies them";
    }
    
    // Setting details
    const settings = {
      "magical": "magical fantasy world",
      "realistic": "realistic, everyday world",
      "forest": "enchanted forest",
      "ocean": "underwater ocean world",
      "space": "outer space",
      "city": "big city",
      "village": "small village",
      "castle": "castle or palace",
      "school": "school setting",
      "future": "futuristic world",
      "prehistoric": "prehistoric world"
    };
    
    const timePeriods = {
      "present": "present day",
      "past": "historical past",
      "future": "future time period",
      "timeless": "timeless/fantasy era"
    };
    
    const weathers = {
      "sunny": "sunny, bright atmosphere",
      "rainy": "rainy weather",
      "snowy": "snowy setting",
      "foggy": "foggy, misty atmosphere",
      "stormy": "stormy conditions",
      "nighttime": "nighttime setting",
      "varied": "changing weather throughout the story"
    };
    
    const settingDescription = `Set in a ${settings[customTheme.setting] || settings.magical} during ${timePeriods[customTheme.timePeriod] || timePeriods.present} with a ${weathers[customTheme.weather] || weathers.sunny}`;
    
    // Plot elements
    const plotFocuses = {
      "adventure": "adventure/journey",
      "friendship": "friendship building",
      "mystery": "solving a mystery",
      "challenge": "overcoming a challenge",
      "learning": "learning an important lesson",
      "helping": "helping others",
      "discovery": "making a discovery",
      "competition": "competition or contest"
    };
    
    let plotDescription = `The story should focus on ${plotFocuses[customTheme.plotFocus] || plotFocuses.adventure}`;
    
    if (customTheme.includeSpecialPowers) {
      plotDescription += " and include magical or special powers";
    }
    
    if (customTheme.includeLesson) {
      const lessons = {
        "friendship": "friendship and connection",
        "courage": "courage and bravery",
        "honesty": "honesty and truth",
        "kindness": "kindness and compassion",
        "perseverance": "perseverance and determination",
        "acceptance": "acceptance and understanding differences",
        "teamwork": "teamwork and cooperation",
        "creativity": "creativity and imagination",
        "gratitude": "gratitude and appreciation"
      };
      
      plotDescription += ` with a moral lesson about ${lessons[customTheme.lessonType] || lessons.friendship}`;
    }
    
    // Interactive elements
    let interactivityNote = "";
    if (customTheme.includeInteractivity) {
      interactivityNote = "Include some interactive elements like questions for the reader or choices the character could make.";
    }
    
    // Combine all elements into a comprehensive prompt
    storyPrompt = `I found this information: "${searchResults}". 
    
Based on this, create a story about "${userPrompt}" with these specific elements:

- Use a ${narrativeStyle} in ${perspective}.
- ${characterDescription}.
- ${settingDescription}.
- ${plotDescription}.
- Write 5-8 paragraphs with a clear beginning, middle, and end.
- The story should be engaging and appropriate for the target audience.
${interactivityNote ? '- ' + interactivityNote : ''}

Do not mention that this is based on search results. Focus on creating a cohesive, engaging narrative.`;
  
  } else {
    // Use theme-specific prompts
    const themesPrompts = {
      kids: `I found this information: "${searchResults}". Based on this, please create a fun, creative, kid-friendly story about "${userPrompt}". Make it 5-8 paragraphs long, with vibrant descriptions and engaging characters. Ensure it's appropriate for children. Do not mention that this is based on search results.`,
      adult: `I found this information: "${searchResults}". Based on this, create a thoughtful, nuanced story for adults about "${userPrompt}". Write an engaging narrative with 5-8 paragraphs that includes realistic characters, meaningful themes, and emotional depth. Avoid explicit content. Do not mention that this is based on search results.`,
      fun: `I found this information: "${searchResults}". Based on this, create a hilarious, entertaining story about "${userPrompt}". Make it witty and playful with humorous situations and amusing characters. The story should be 5-7 paragraphs long. Do not mention that this is based on search results.`,
      concise: `I found this information: "${searchResults}". Based on this, create a concise, impactful short story about "${userPrompt}". Write a tight, focused narrative of exactly 4 paragraphs with precise language. Do not mention that this is based on search results.`,
      spooky: `I found this information: "${searchResults}". Based on this, create a spooky, suspenseful story about "${userPrompt}". Write a mysterious tale with 5-8 paragraphs that builds tension and creates an eerie atmosphere. Make it appropriate for older children. Do not mention that this is based on search results.`,
      educational: `I found this information: "${searchResults}". Based on this, create an educational story about "${userPrompt}" that teaches facts while entertaining. Write 5-8 paragraphs that incorporate knowledge from the search in an engaging narrative. Do not mention that this is based on search results.`,
      fantasy: `I found this information: "${searchResults}". Based on this, create an epic fantasy story about "${userPrompt}". Write a magical tale with 5-8 paragraphs that includes fantastical elements like magic, mythical creatures, or enchanted objects. Do not mention that this is based on search results.`
    };
    storyPrompt = themesPrompts[selectedTheme] || themesPrompts.kids;
  }
  
  // Now convert the search results into a story using the selected model
  const storyFromSearchPayload = {
    model: selectedTextModel,
    messages: [{
      role: "user",
      content: storyPrompt
    }],
    store: true,
    seed: Math.floor(Math.random() * 1000000)
  };
  
  // Second part - story creation with retry logic
  const maxStoryRetries = 3;
  let storyRetryCount = 0;
  let lastError = null;
  
  while (storyRetryCount < maxStoryRetries) {
    try {
      const storyResp = await fetch(textEndpoint, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(storyFromSearchPayload)
      });
      
      if (!storyResp.ok) {
        throw new Error(`Story API error: ${storyResp.status}`);
      }
      
      const storyData = await storyResp.json();
      let story = storyData.choices?.[0]?.message?.content || "";
      
      if (!story) {
        throw new Error("Empty story response");
      }
      
      return cleanText(story);
      
    } catch (err) {
      lastError = err;
      storyRetryCount++;
      
      if (storyRetryCount < maxStoryRetries) {
        // Show retry message
        updateStatus(`Story creation retry ${storyRetryCount}/${maxStoryRetries}...`, true);
        
        // Exponential backoff: wait longer between retries
        const waitTime = Math.pow(2, storyRetryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // If we get here, all retries failed
  throw new Error(`Story creation failed after ${maxStoryRetries} attempts: ${lastError?.message}`);
}

// Function to preload all chunks concurrently
async function preloadAllChunks() {
  preloadedChunks = new Array(storyChunks.length);
  
  // Start preloading all chunks in parallel
  const preloadPromises = storyChunks.map((chunkText, index) => 
    preloadChunkAssets(chunkText, index)
  );
  
  // We don't await these promises here - they'll resolve in the background
  // This allows processing to begin as soon as the first chunk is ready
}

// Function to preload assets for a single chunk
async function preloadChunkAssets(chunkText, index) {
  try {
    // Prepare an object to store this chunk's preloaded assets
    const preloadedChunk = {
      text: chunkText,
      imageBlob: null,
      audioData: [],
      ready: false
    };
    
    // Store the preloaded chunk in the array (even before it's ready)
    preloadedChunks[index] = preloadedChunk;
    
    // Start preloading image and audio concurrently
    const [imageBlob] = await Promise.all([
      // Preload image with enhanced prompt generation
      (async () => {
        // Get a better image prompt using AI if this is chunk 0
        let prompt;
        if (index === 0) {
          prompt = await generateAIImagePrompt(chunkText);
        } else {
          prompt = buildImagePrompt(chunkText);
        }
        
        const imageSeed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${selectedImageModel}&seed=${imageSeed}&token=${TOKEN}&referer=${REFERER}&nologo=true&private=true`;
        return await fetchImageBlob(imageUrl);
      })(),
      
      // Preload audio with selected voice
      (async () => {
        const audioData = await prepareAudioData(chunkText);
        preloadedChunk.audioData = audioData;
      })()
    ]);
    
    // Store the preloaded image blob
    preloadedChunk.imageBlob = imageBlob;
    
    // Mark this chunk as ready
    preloadedChunk.ready = true;
    
    console.log(`Preloaded chunk ${index + 1} of ${storyChunks.length}`);
  } catch (err) {
    console.error(`Error preloading chunk ${index}:`, err);
    // Even if this preload fails, we'll handle it in the display function
  }
}

// Generate better image prompts using AI
async function generateAIImagePrompt(chunkText) {
  try {
    // Generate a seed to keep responses consistent
    const promptSeed = Math.floor(Math.random() * 1000000);
    
    // Use the selected image prompt model
    const selectedImagePromptModel = document.getElementById('imagePromptModelSelect').value;
    
    // Build payload using the selected model
    const promptPayload = {
      model: selectedImagePromptModel,
      messages: [{
        role: "system",
        content: "You are an expert at creating vivid, detailed image generation prompts that are perfect for children's book illustrations. DO NOT include any text or words in the image."
      }, {
        role: "user",
        content: `Create a detailed image generation prompt for a children's book illustration based on this story text: "${chunkText}". Focus on the main scene, characters, and visual elements. Make it colorful and engaging for kids. DO NOT include text, words, or writing in your prompt. The prompt should be under 100 words.`
      }],
      store: true,
      seed: promptSeed
    };
    
    const promptResp = await fetch(textEndpoint, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(promptPayload)
    });
    
    if (!promptResp.ok) {
      console.warn("AI prompt generation failed, using fallback method");
      return buildImagePrompt(chunkText);
    }
    
    const promptData = await promptResp.json();
    let aiPrompt = promptData.choices[0].message.content.trim();
    
    // Ensure the prompt doesn't have any text instructions
    aiPrompt = aiPrompt.replace(/include text|add text|with text|with words|with writing|text overlay|caption/gi, "no text");
    
    // Add some standard parameters for child-friendly images
    return `${aiPrompt}, children's book style, vibrant colors, high quality, detailed illustration, no text`;
  } catch (err) {
    console.error("AI image prompt generation failed:", err);
    // Fall back to the regular method
    return buildImagePrompt(chunkText);
  }
}

// Prepare audio and return data instead of storing in global queue
async function prepareAudioData(chunk) {
  return new Promise(async (resolve, reject) => {
    try {
      // Local audio queue for this chunk
      const chunkAudioQueue = [];
      
      // Generate random seed for audio
      const audioSeed = Math.floor(Math.random() * 1000000);
      
      // Build audio payload with the requested prefix
      const audioPrompt = `Repeat the following text word for word without any changes or corrections: ${chunk}`;
      const audioPayload = {
        model: "openai-audio",
        modalities: ["text", "audio"],
        audio: { voice: selectedVoice, format: "pcm16" },
        stream: true,
        messages: [{ role: "system", content: audioPrompt }],
        store: true,
        seed: audioSeed
      };
      
      const audioResp = await fetch(`${textEndpoint}/v1/chat/completions`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(audioPayload)
      });
      
      if (!audioResp.ok) throw new Error("Audio generation failed: " + audioResp.status);
      
      let buffer = "";
      const reader = audioResp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      // Process the streamed response and collect audio chunks
      async function processStream() {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            resolve(chunkAudioQueue); // Return the collected audio data
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              
              try {
                const jsonObj = JSON.parse(jsonStr);
                if (jsonObj.choices && jsonObj.choices[0] && jsonObj.choices[0].delta) {
                  const delta = jsonObj.choices[0].delta;
                  
                  // Store audio data in queue
                  if (delta.audio && delta.audio.data) {
                    const base64Data = delta.audio.data;
                    const bin = atob(base64Data);
                    const bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) {
                      bytes[i] = bin.charCodeAt(i);
                    }
                    chunkAudioQueue.push(bytes);
                  }
                }
              } catch (e) {
                console.error("JSON parse error:", e);
              }
            }
          }
          
          // Continue reading
          await processStream();
        } catch (e) {
          console.error("Stream reading error:", e);
          reject(e);
        }
      }
      
      // Start processing the stream
      await processStream();
      
    } catch (err) {
      console.error("Audio preparation error:", err);
      reject(err);
    }
  });
}

// Process chunks one by one, but use preloaded assets
async function processNextChunk() {
  if (currentChunkIndex >= storyChunks.length) return;
  
  try {
    // Update progress
    updateStatus(`Showing part ${currentChunkIndex + 1} of ${totalChunks}...`, true);
    updateProgress((currentChunkIndex / totalChunks) * 100);
    
    // Create card for this chunk
    const card = createChunkCard();
    storyContainer.appendChild(card);
    
    // Set card as active with animation
    setTimeout(() => card.classList.add("active"), 50);
    
    // Get image and text elements
    const imgContainer = card.querySelector(".chunkImage");
    const textContainer = card.querySelector(".chunkText");
    
    // Wait for this chunk to be preloaded if necessary
    await waitForChunkPreload(currentChunkIndex);
    
    // Get the preloaded chunk data
    const preloadedChunk = preloadedChunks[currentChunkIndex];
    
    try {
      // Display the preloaded image
      await displayPreloadedImage(preloadedChunk.imageBlob, imgContainer);
      
      // Use the preloaded audio data
      audioQueue = preloadedChunk.audioData;
      
      // Display text and play audio together
      await displayTextAndPlayAudio(preloadedChunk.text, textContainer);
      
      // Add emoticon based on text sentiment
      addEmoticon(textContainer, preloadedChunk.text);
      
      // Move to next chunk
      currentChunkIndex++;
      updateProgress((currentChunkIndex / totalChunks) * 100);
      
      // Process next chunk immediately if available
      if (currentChunkIndex < storyChunks.length) {
        processNextChunk(); // No await - start immediately
      }
    } catch (chunkErr) {
      console.error(`Error displaying chunk ${currentChunkIndex}:`, chunkErr);
      throw chunkErr;
    }
  } catch (err) {
    console.error(`Error processing chunk ${currentChunkIndex}:`, err);
    updateStatus("Something went wrong with the story magic!", false);
    throw err;
  }
}

// Function to wait for a specific chunk to be preloaded
async function waitForChunkPreload(index) {
  // Maximum time to wait for a chunk
  const maxWaitTime = 30000; // 30 seconds
  const startTime = Date.now();
  
  while (!preloadedChunks[index]?.ready) {
    // Check if we've exceeded the maximum wait time
    if (Date.now() - startTime > maxWaitTime) {
      // If we've waited too long, try to load the chunk on demand
      if (!preloadedChunks[index]) {
        preloadedChunks[index] = {
          text: storyChunks[index],
          imageBlob: null,
          audioData: [],
          ready: false
        };
        
        try {
          await preloadChunkAssets(storyChunks[index], index);
        } catch (err) {
          console.error(`Failed to load chunk ${index} on demand:`, err);
        }
        
        if (preloadedChunks[index].ready) break;
      }
      
      throw new Error(`Timeout waiting for chunk ${index} to preload`);
    }
    
    // Wait a short time before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Function to display a preloaded image
async function displayPreloadedImage(imageBlob, imgContainer) {
  try {
    imgContainer.innerHTML = "<p>Creating magical image...</p>";
    
    if (!imageBlob) {
      imgContainer.innerHTML = "<p>Image magic failed</p>";
      return;
    }
    
    const objectURL = URL.createObjectURL(imageBlob);
    
    // Clear loading indicator
    imgContainer.innerHTML = "";
    
    // Create and add image to container
    const imgElem = document.createElement("img");
    
    return new Promise((resolve, reject) => {
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!imgElem.complete) {
          console.warn("Image load timed out");
          imgContainer.innerHTML = "<p>Image magic took too long</p>";
          reject(new Error("Image load timed out"));
        }
      }, 5000); // Shorter timeout since image should be preloaded
      
      // Handle image load success
      imgElem.onload = () => {
        clearTimeout(timeout);
        
        // Add loaded class to trigger animation
        setTimeout(() => {
          imgElem.classList.add("loaded");
          resolve();
        }, 100);
      };
      
      // Handle image load error
      imgElem.onerror = () => {
        clearTimeout(timeout);
        console.error("Image failed to load");
        imgContainer.innerHTML = "<p>Image magic failed</p>";
        reject(new Error("Image failed to load"));
      };
      
      // Set src after attaching events
      imgElem.src = objectURL;
      imgElem.alt = "Story illustration";
      imgContainer.appendChild(imgElem);
    });
  } catch (err) {
    console.error("Image display error:", err);
    imgContainer.innerHTML = "<p>Image magic failed</p>";
    throw err;
  }
}

/****************************************
* HELPER FUNCTIONS
****************************************/
// Theme management functions
function applyTheme(themeName) {
  // Define theme configurations
  const themes = {
    kids: {
      primary: "#FF6B6B",
      secondary: "#4ECDC4",
      accent: "#FFD166",
      textColor: "#2E3C5A",
      backgroundGradient: "linear-gradient(135deg, #FFE5E5, #C9F9FF)",
      cardBackground: "white",
      headerBackground: "rgba(255,255,255,0.9)",
      headerBorder: "4px solid var(--primary)",
      storyPrompt: (prompt) => `Generate an immersive, creative story for kids: "${prompt}". Write a vibrant, engaging story that's 5-8 paragraphs long. Include vivid descriptions, emotion, and fun characters. Do not include any disclaimers or mention that this is based on a prompt.`,
      imageStyle: "colorful children's book, friendly characters, vibrant colors, playful"
    },
    adult: {
      primary: "#3A506B",
      secondary: "#5BC0BE",
      accent: "#E76F51",
      textColor: "#293241",
      backgroundGradient: "linear-gradient(135deg, #EAE2D6, #D5C3AA)",
      cardBackground: "#F8F8F8",
      headerBackground: "rgba(234, 226, 214, 0.95)",
      headerBorder: "4px solid var(--primary)",
      storyPrompt: (prompt) => `Create a thoughtful, nuanced story for adults based on: "${prompt}". Write an engaging narrative with 5-8 paragraphs that includes realistic characters, meaningful themes, and emotional depth. The story should be sophisticated but accessible, with descriptive language and a satisfying arc. Avoid explicit content or excessive darkness.`,
      imageStyle: "realistic, detailed, cinematic, dramatic lighting, mature themes, subtle tones"
    },
    fun: {
      primary: "#FF9A00",
      secondary: "#00C2A8",
      accent: "#FF579F",
      textColor: "#333333",
      backgroundGradient: "linear-gradient(135deg, #FCEF9C, #A9F0D1)",
      cardBackground: "white",
      headerBackground: "rgba(255,255,255,0.85)",
      headerBorder: "4px solid var(--primary)",
      storyPrompt: (prompt) => `Create a hilarious, entertaining story about: "${prompt}". Make it witty and playful with humorous situations, funny dialogue, and amusing characters. The story should be 5-7 paragraphs long, maintain a lighthearted tone throughout, and include some clever twists or comedic moments. Don't explain that it's meant to be funny - just make it naturally humorous!`,
      imageStyle: "cartoonish, exaggerated, bright colors, funny expressions, humorous, light-hearted"
    },
    concise: {
      primary: "#1A535C",
      secondary: "#4ECDC4",
      accent: "#FF6B6B",
      textColor: "#1A535C",
      backgroundGradient: "linear-gradient(135deg, #F7FFF7, #EBF5EE)",
      cardBackground: "white",
      headerBackground: "rgba(247, 255, 247, 0.95)",
      headerBorder: "4px solid var(--primary)",
      storyPrompt: (prompt) => `Create a concise, impactful short story about: "${prompt}". Write a tight, focused narrative of exactly 4 paragraphs with no wasted words. Use precise language, clear imagery, and meaningful details. The story should be elegant in its brevity while still delivering emotional impact and a complete narrative arc.`,
      imageStyle: "minimalist, clean lines, simple composition, elegant, uncluttered"
    },
    spooky: {
      primary: "#800020",
      secondary: "#540D6E",
      accent: "#F09D51",
      textColor: "#2D3142",
      backgroundGradient: "linear-gradient(135deg, #2D3142, #4F5D75)",
      cardBackground: "#EBEBEB",
      headerBackground: "rgba(45, 49, 66, 0.9)",
      headerBorder: "4px solid var(--primary)",
      storyPrompt: (prompt) => `Create a spooky, suspenseful story about: "${prompt}". Write a mysterious tale with 5-8 paragraphs that builds tension and creates an eerie atmosphere. Include enigmatic characters, strange occurrences, and an intriguing twist. Make it creepy but appropriate for older children and teens - no explicit horror, gore, or disturbing content.`,
      imageStyle: "mysterious, foggy, shadows, eerie lighting, suspenseful atmosphere, dark tones"
    },
    educational: {
      primary: "#3D5A80",
      secondary: "#98C1D9",
      accent: "#EE6C4D",
      textColor: "#293241",
      backgroundGradient: "linear-gradient(135deg, #E0FBFC, #C2DFE3)",
      cardBackground: "white",
      headerBackground: "rgba(224, 251, 252, 0.9)",
      headerBorder: "4px solid var(--primary)",
      storyPrompt: (prompt) => `Create an educational story about: "${prompt}". Write an engaging narrative that's 5-8 paragraphs long and seamlessly incorporates accurate facts and learning concepts. The story should be entertaining while teaching readers about the subject matter. Include characters who discover or demonstrate key information in an organic way. Make the educational content memorable through narrative.`,
      imageStyle: "informative, clear details, educational, accurate depictions, infographic style"
    },
    fantasy: {
      primary: "#845EC2",
      secondary: "#D65DB1",
      accent: "#FF9671",
      textColor: "#4B4453",
      backgroundGradient: "linear-gradient(135deg, #DCE9FF, #B8BBFF)",
      cardBackground: "rgba(255, 255, 255, 0.9)",
      headerBackground: "rgba(220, 233, 255, 0.9)",
      headerBorder: "4px solid var(--primary)",
      storyPrompt: (prompt) => `Create an epic fantasy story about: "${prompt}". Write a magical tale with 5-8 paragraphs that transports readers to a world of wonder and adventure. Include fantastical elements like magic, mythical creatures, heroic quests, or enchanted objects. The story should have rich worldbuilding details, fascinating characters, and an element of the extraordinary. Make it immersive and imaginative.`,
      imageStyle: "magical, fantastical creatures, glowing effects, otherworldly, epic scenery, mythical"
    },
    custom: {
      // For custom theme, we'll use the website theme variables for the UI
      primary: websiteTheme.primary,
      secondary: websiteTheme.secondary,
      accent: websiteTheme.accent,
      textColor: websiteTheme.textColor,
      backgroundGradient: websiteTheme.backgroundGradient,
      cardBackground: websiteTheme.cardBackground,
      headerBackground: websiteTheme.headerBackground,
      headerBorder: websiteTheme.headerBorder,
      // But for the story prompt, we'll use a custom generator based on all story theme settings
      storyPrompt: (prompt) => {
        // Narrative style/voice
        let narrativeStyle = "";
        const narrativeStyles = {
          "standard": "straightforward, clear narrative style",
          "poetic": "poetic, lyrical style with metaphors, rhythm, and evocative imagery",
          "dramatic": "dramatic, emotionally intense style with high stakes and conflict",
          "humorous": "humorous, light-hearted style with wit, wordplay, and amusing situations",
          "mysterious": "mysterious, intriguing style with enigmatic elements and subtle clues",
          "educational": "educational style that teaches while entertaining",
          "conversational": "conversational, casual tone that directly addresses the reader",
          "rhyming": "rhyming verse with consistent rhythm patterns"
        };
        narrativeStyle = narrativeStyles[customTheme.narrativeStyle || customTheme.storyStyle] || narrativeStyles.standard;
        
        // Narrator perspective
        let perspective = "";
        const perspectives = {
          "first": "first-person perspective (using 'I' or 'we')",
          "second": "second-person perspective (using 'you')",
          "third": "third-person perspective (using 'he', 'she', or 'they')"
        };
        perspective = perspectives[customTheme.narratorPerspective] || perspectives.third;
        
        // Character details
        let characterDescription = "";
        const characterTypes = {
          "child": "child protagonist",
          "adult": "adult character",
          "animal": "animal character",
          "magical": "magical being",
          "robot": "robot or AI character",
          "mythical": "mythical creature",
          "toy": "living toy character",
          "plant": "living plant character"
        };
        
        const mainCharacter = characterTypes[customTheme.mainCharacterType] || characterTypes.child;
        const traits = Array.isArray(customTheme.characterTraits) ? 
          customTheme.characterTraits.join(", ") : "brave, curious, kind";
        
        characterDescription = `The main character should be a ${mainCharacter} who is ${traits}`;
        
        if (customTheme.includeSidekick) {
          characterDescription += " and should have a friend or sidekick who accompanies them";
        }
        
        // Setting details
        const settings = {
          "magical": "magical fantasy world",
          "realistic": "realistic, everyday world",
          "forest": "enchanted forest",
          "ocean": "underwater ocean world",
          "space": "outer space",
          "city": "big city",
          "village": "small village",
          "castle": "castle or palace",
          "school": "school setting",
          "future": "futuristic world",
          "prehistoric": "prehistoric world"
        };
        
        const timePeriods = {
          "present": "present day",
          "past": "historical past",
          "future": "future time period",
          "timeless": "timeless/fantasy era"
        };
        
        const weathers = {
          "sunny": "sunny, bright atmosphere",
          "rainy": "rainy weather",
          "snowy": "snowy setting",
          "foggy": "foggy, misty atmosphere",
          "stormy": "stormy conditions",
          "nighttime": "nighttime setting",
          "varied": "changing weather throughout the story"
        };
        
        const settingDescription = `Set in a ${settings[customTheme.setting] || settings.magical} during ${timePeriods[customTheme.timePeriod] || timePeriods.present} with a ${weathers[customTheme.weather] || weathers.sunny}`;
        
        // Plot elements
        const plotFocuses = {
          "adventure": "adventure/journey",
          "friendship": "friendship building",
          "mystery": "solving a mystery",
          "challenge": "overcoming a challenge",
          "learning": "learning an important lesson",
          "helping": "helping others",
          "discovery": "making a discovery",
          "competition": "competition or contest"
        };
        
        let plotDescription = `The story should focus on ${plotFocuses[customTheme.plotFocus] || plotFocuses.adventure}`;
        
        if (customTheme.includeSpecialPowers) {
          plotDescription += " and include magical or special powers";
        }
        
        if (customTheme.includeLesson) {
          const lessons = {
            "friendship": "friendship and connection",
            "courage": "courage and bravery",
            "honesty": "honesty and truth",
            "kindness": "kindness and compassion",
            "perseverance": "perseverance and determination",
            "acceptance": "acceptance and understanding differences",
            "teamwork": "teamwork and cooperation",
            "creativity": "creativity and imagination",
            "gratitude": "gratitude and appreciation"
          };
          
          plotDescription += ` with a moral lesson about ${lessons[customTheme.lessonType] || lessons.friendship}`;
        }
        
        // Interactive elements
        let interactivityNote = "";
        if (customTheme.includeInteractivity) {
          interactivityNote = "Include some interactive elements like questions for the reader or choices the character could make.";
        }
        
        // Build the custom story prompt
        return `Create a story about "${prompt}" with these specific elements:

- Use a ${narrativeStyle} in ${perspective}.
- ${characterDescription}.
- ${settingDescription}.
- ${plotDescription}.
- Write 5-8 paragraphs with a clear beginning, middle, and end.
- The story should be engaging and appropriate for the target audience.
${interactivityNote ? '- ' + interactivityNote : ''}

Focus on creating a cohesive, engaging narrative with quality character development and a satisfying conclusion.`;
      },
      // Custom image style based on art style, color scheme, etc.
      imageStyle: () => {
        const artStyles = {
          storybook: "classic storybook illustration",
          cartoon: "cartoon style with bold outlines",
          watercolor: "soft watercolor painting",
          pixar: "3D animation style, rendered, polished",
          anime: "anime/manga style, stylized",
          retro: "vintage, retro illustration",
          realistic: "realistic, detailed render",
          minimalist: "minimalist, clean lines",
          pixel: "pixel art style, 8-bit inspired",
          comic: "comic book style with panels"
        };
        
        const colorSchemes = {
          vibrant: "vibrant, rich colors, colorful palette",
          pastel: "soft pastel colors, gentle tones",
          contrasting: "high contrast colors, bold palette",
          monochromatic: "monochromatic, shades of one color",
          dark: "dark mood, deep shadows, muted colors",
          bright: "bright, cheerful colors, sunny palette",
          earthy: "natural earthy tones, nature-inspired palette"
        };
        
        const artStyle = artStyles[customTheme.artStyle] || artStyles.storybook;
        const colorScheme = colorSchemes[customTheme.colorScheme] || colorSchemes.vibrant;
        const customInstructions = customTheme.customImageStyle || customTheme.imageStyle || "";
        
        return `${artStyle}, ${colorScheme}, ${customInstructions}`.trim();
      }
    }
  };
  
  // Get the theme configuration
  const theme = themes[themeName];
  
  // Apply CSS variables
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--secondary', theme.secondary);
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.documentElement.style.setProperty('--text-color', theme.textColor);
  document.documentElement.style.setProperty('--background-gradient', theme.backgroundGradient);
  document.documentElement.style.setProperty('--card-background', theme.cardBackground);
  document.documentElement.style.setProperty('--header-background', theme.headerBackground);
  document.documentElement.style.setProperty('--header-border', theme.headerBorder);
  
  // Store the selected theme
  selectedTheme = themeName;
  
  // Create theme-specific visual effects
  updateThemeVisuals(themeName);
}

// Function to apply all custom theme properties (for live preview)
function applyCustomThemeColors() {
  // Apply basic colors
  document.documentElement.style.setProperty('--primary', customTheme.primary);
  document.documentElement.style.setProperty('--secondary', customTheme.secondary);
  document.documentElement.style.setProperty('--accent', customTheme.accent);
  document.documentElement.style.setProperty('--text-color', customTheme.textColor);
  
  // Dynamic background gradient using explicit background colors
  const gradient = `linear-gradient(135deg, ${customTheme.bgColor1}, ${customTheme.bgColor2})`;
  document.documentElement.style.setProperty('--background-gradient', gradient);
  customTheme.backgroundGradient = gradient;
  
  // Background pattern
  document.documentElement.style.setProperty('--background-pattern', customTheme.backgroundPattern);
  
  // Background animation
  document.documentElement.style.setProperty('--background-animation', customTheme.backgroundAnimation);
  
  // Fonts
  document.documentElement.style.setProperty('--heading-font', customTheme.headingFont);
  document.documentElement.style.setProperty('--body-font', customTheme.bodyFont);
  
  // Text shadow
  document.documentElement.style.setProperty('--text-shadow', customTheme.textShadow);
  
  // Card border radius
  document.documentElement.style.setProperty('--card-border-radius', customTheme.cardBorderRadius);
  
  // Button style
  document.documentElement.style.setProperty('--button-style', customTheme.buttonStyle);
  
  // Special handling for glass button style
  if (customTheme.buttonStyle === 'transparent') {
    document.querySelectorAll('.promptRow button, .theme-actions button').forEach(button => {
      button.style.border = `2px solid ${customTheme.primary}`;
      button.style.color = customTheme.primary;
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      button.style.backdropFilter = 'blur(5px)';
    });
  } else {
    document.querySelectorAll('.promptRow button, .theme-actions button').forEach(button => {
      button.style.border = '';
      button.style.color = '';
      button.style.backgroundColor = '';
      button.style.backdropFilter = '';
    });
  }
  
  // Dynamic header background based on primary color
  const headerBg = customTheme.buttonStyle === 'transparent' ? 
    `rgba(${hexToRgb(adjustColor(customTheme.primary, 95))}, 0.7)` : 
    `rgba(${hexToRgb(adjustColor(customTheme.primary, 90))}, 0.9)`;
  document.documentElement.style.setProperty('--header-background', headerBg);
  customTheme.headerBackground = headerBg;
  
  // Create visual pulse effect to show changes
  createConfetti(5);
}

// Helper function to adjust color lightness
function adjustColor(hex, percent) {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  
  // Make color lighter
  r = Math.floor(r + (255 - r) * (percent / 100));
  g = Math.floor(g + (255 - g) * (percent / 100));
  b = Math.floor(b + (255 - b) * (percent / 100));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// Update visual effects based on theme
function updateThemeVisuals(themeName) {
  // Clear existing stars and confetti
  document.querySelectorAll('.star').forEach(star => star.remove());
  document.querySelectorAll('.confetti').forEach(confetti => confetti.remove());
  
  // Update blob colors based on theme
  const blobs = document.querySelectorAll('.blob');
  
  if (themeName === "kids") {
    // Default kids theme
    if (blobs.length >= 4) {
      blobs[0].style.background = "rgba(255,107,107,0.1)";
      blobs[1].style.background = "rgba(78,205,196,0.1)";
      blobs[2].style.background = "rgba(255,209,102,0.1)";
      blobs[3].style.background = "rgba(158,122,244,0.1)";
    }
    createStars(50);
  } 
  else if (themeName === "adult") {
    // Adult theme - more subtle blobs
    if (blobs.length >= 4) {
      blobs[0].style.background = "rgba(58,80,107,0.05)";
      blobs[1].style.background = "rgba(91,192,190,0.05)";
      blobs[2].style.background = "rgba(231,111,81,0.05)";
      blobs[3].style.background = "rgba(41,50,65,0.05)";
    }
    createStars(15); // Fewer stars for subtlety
  }
  else if (themeName === "fun") {
    // Fun theme - vibrant blobs
    if (blobs.length >= 4) {
      blobs[0].style.background = "rgba(255,154,0,0.15)";
      blobs[1].style.background = "rgba(0,194,168,0.15)";
      blobs[2].style.background = "rgba(255,87,159,0.15)";
      blobs[3].style.background = "rgba(252,239,156,0.15)";
    }
    createStars(80); // More stars for fun
    createConfetti(30); // Add confetti for fun theme
  }
  else if (themeName === "concise") {
    // Concise theme - minimal blobs
    if (blobs.length >= 4) {
      blobs[0].style.background = "rgba(26,83,92,0.05)";
      blobs[1].style.background = "rgba(78,205,196,0.05)";
      blobs[2].style.background = "rgba(255,107,107,0.05)";
      blobs[3].style.background = "rgba(247,255,247,0.05)";
    }
    createStars(10); // Minimal stars
  }
  else if (themeName === "spooky") {
    // Spooky theme - darker blobs
    if (blobs.length >= 4) {
      blobs[0].style.background = "rgba(128,0,32,0.1)";
      blobs[1].style.background = "rgba(84,13,110,0.1)";
      blobs[2].style.background = "rgba(240,157,81,0.08)";
      blobs[3].style.background = "rgba(45,49,66,0.1)";
    }
    createStars(100); // More stars for night effect
  }
  else if (themeName === "educational") {
    // Educational theme - clean blobs
    if (blobs.length >= 4) {
      blobs[0].style.background = "rgba(61,90,128,0.08)";
      blobs[1].style.background = "rgba(152,193,217,0.08)";
      blobs[2].style.background = "rgba(238,108,77,0.08)";
      blobs[3].style.background = "rgba(41,50,65,0.08)";
    }
    createStars(30);
  }
  else if (themeName === "fantasy") {
    // Fantasy theme - magical blobs
    if (blobs.length >= 4) {
      blobs[0].style.background = "rgba(132,94,194,0.15)";
      blobs[1].style.background = "rgba(214,93,177,0.15)";
      blobs[2].style.background = "rgba(255,150,113,0.15)";
      blobs[3].style.background = "rgba(75,68,83,0.15)";
    }
    createStars(120); // Many stars for magical effect
  }
  else if (themeName === "custom") {
    // Custom theme - use primary and secondary colors with reduced opacity
    if (blobs.length >= 4) {
      // Extract RGB components from hex
      const primary = hexToRgb(customTheme.primary);
      const secondary = hexToRgb(customTheme.secondary);
      const accent = hexToRgb(customTheme.accent);
      const text = hexToRgb(customTheme.textColor);
      
      blobs[0].style.background = `rgba(${primary}, 0.1)`;
      blobs[1].style.background = `rgba(${secondary}, 0.1)`;
      blobs[2].style.background = `rgba(${accent}, 0.1)`;
      blobs[3].style.background = `rgba(${text}, 0.1)`;
    }
    createStars(40);
  }
  
  // Animate blobs
  animateBlobs();
}

// Fetch entire story - with theme-specific prompt
async function fetchFullStory(userPrompt) {
  // Generate random seed for consistency
  const storySeed = Math.floor(Math.random() * 1000000);
  
  // Get theme-specific story prompt
  let storyPromptTemplate;
  
  if (selectedTheme === "custom") {
    // For custom theme, select prompt based on story style
    switch(customTheme.storyStyle) {
      case "poetic":
        storyPromptTemplate = (prompt) => `Create a poetic, lyrical story inspired by: "${prompt}". Write 5-7 paragraphs using rich, evocative language with metaphors, rhythm, and imagery. The story should flow with a poetic sensibility while still maintaining a narrative structure. Make it emotionally resonant and beautifully written.`;
        break;
      case "dramatic":
        storyPromptTemplate = (prompt) => `Create a dramatic, emotionally intense story about: "${prompt}". Write 5-8 paragraphs with high stakes, internal or external conflict, and strong character emotions. Build tension throughout the narrative and include a powerful climactic moment. The story should evoke a strong emotional response.`;
        break;
      case "humorous":
        storyPromptTemplate = (prompt) => `Create a humorous, light-hearted story about: "${prompt}". Write 5-7 paragraphs filled with wit, wordplay, amusing situations, or comedic misunderstandings. The story should maintain a consistently funny tone and bring a smile to the reader's face. Include entertainingly quirky characters or funny dialogue.`;
        break;
      case "mysterious":
        storyPromptTemplate = (prompt) => `Create an intriguing, mysterious story about: "${prompt}". Write 5-8 paragraphs with enigmatic elements, unanswered questions, and subtle clues. Build an atmosphere of suspense and curiosity. The story should keep readers engaged with its puzzling aspects while providing just enough information to follow along.`;
        break;
      default: // standard
        storyPromptTemplate = (prompt) => `Create an engaging story about: "${prompt}". Write 5-8 paragraphs with a clear beginning, middle, and end. Include compelling characters, descriptive language, and an interesting plot. The story should be well-crafted and entertaining.`;
    }
  } else {
    // Get theme-specific prompt for built-in themes
    const themes = {
      kids: (prompt) => `Generate an immersive, creative story for kids: "${prompt}". Write a vibrant, engaging story that's 5-8 paragraphs long. Include vivid descriptions, emotion, and fun characters. Do not include any disclaimers or mention that this is based on a prompt.`,
      adult: (prompt) => `Create a thoughtful, nuanced story for adults based on: "${prompt}". Write an engaging narrative with 5-8 paragraphs that includes realistic characters, meaningful themes, and emotional depth. The story should be sophisticated but accessible, with descriptive language and a satisfying arc. Avoid explicit content or excessive darkness.`,
      fun: (prompt) => `Create a hilarious, entertaining story about: "${prompt}". Make it witty and playful with humorous situations, funny dialogue, and amusing characters. The story should be 5-7 paragraphs long, maintain a lighthearted tone throughout, and include some clever twists or comedic moments. Don't explain that it's meant to be funny - just make it naturally humorous!`,
      concise: (prompt) => `Create a concise, impactful short story about: "${prompt}". Write a tight, focused narrative of exactly 4 paragraphs with no wasted words. Use precise language, clear imagery, and meaningful details. The story should be elegant in its brevity while still delivering emotional impact and a complete narrative arc.`,
      spooky: (prompt) => `Create a spooky, suspenseful story about: "${prompt}". Write a mysterious tale with 5-8 paragraphs that builds tension and creates an eerie atmosphere. Include enigmatic characters, strange occurrences, and an intriguing twist. Make it creepy but appropriate for older children and teens - no explicit horror, gore, or disturbing content.`,
      educational: (prompt) => `Create an educational story about: "${prompt}". Write an engaging narrative that's 5-8 paragraphs long and seamlessly incorporates accurate facts and learning concepts. The story should be entertaining while teaching readers about the subject matter. Include characters who discover or demonstrate key information in an organic way. Make the educational content memorable through narrative.`,
      fantasy: (prompt) => `Create an epic fantasy story about: "${prompt}". Write a magical tale with 5-8 paragraphs that transports readers to a world of wonder and adventure. Include fantastical elements like magic, mythical creatures, heroic quests, or enchanted objects. The story should have rich worldbuilding details, fascinating characters, and an element of the extraordinary. Make it immersive and imaginative.`
    };
    storyPromptTemplate = themes[selectedTheme];
  }
  
  // Use the theme-specific prompt template
  const contentPrompt = storyPromptTemplate(userPrompt);
  
  // Build payload using the selected text model
  const payload = {
    model: selectedTextModel,
    messages: [{
      role: "user",
      content: contentPrompt
    }],
    store: true,
    seed: storySeed
  };
  
  // Display the selected model in the status
  const modelDisplayName = textModelSelect.options[textModelSelect.selectedIndex].text;
  updateStatus(`Creating a ${selectedTheme} story with ${modelDisplayName}...`, true);
  
  // Try up to 3 times with exponential backoff
  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;
  
  while (retryCount < maxRetries) {
    try {
      const resp = await fetch(textEndpoint, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(payload)
      });
      
      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }
      
      const data = await resp.json();
      let story = data.choices?.[0]?.message?.content || "";
      
      if (!story) {
        throw new Error("Empty response from API");
      }
      
      return cleanText(story);
      
    } catch (err) {
      lastError = err;
      retryCount++;
      
      if (retryCount < maxRetries) {
        // Show retry message
        updateStatus(`Retrying... (${retryCount}/${maxRetries})`, true);
        
        // Exponential backoff: wait longer between retries
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // If we get here, all retries failed
  throw new Error(`Story creation failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// 2. Split story into 1-2 paragraph chunks
function splitStoryIntoOneOrTwoParagraphs(story) {
 // Split by blank lines
 let paragraphs = story.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
 if (!paragraphs.length) paragraphs = [story.trim()];
 
 // Make sure paragraphs aren't too long
 const MAX_CHARS = 500;
 let processedParagraphs = [];
 
 for (const p of paragraphs) {
   if (p.length <= MAX_CHARS) {
     processedParagraphs.push(p);
   } else {
     // Split long paragraph at sentence boundaries
     const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
     let currentChunk = "";
     
     for (const sentence of sentences) {
       if (currentChunk.length + sentence.length <= MAX_CHARS) {
         currentChunk += sentence;
       } else {
         if (currentChunk) processedParagraphs.push(currentChunk.trim());
         currentChunk = sentence;
       }
     }
     
     if (currentChunk) processedParagraphs.push(currentChunk.trim());
   }
 }
 
 // Group paragraphs into 1-2 paragraph chunks
 let finalChunks = [];
 for (let i = 0; i < processedParagraphs.length; i += 2) {
   if (i + 1 < processedParagraphs.length) {
     // Check if combining would make it too long
     const combined = processedParagraphs[i] + "\n\n" + processedParagraphs[i + 1];
     if (combined.length <= MAX_CHARS * 1.5) {
       finalChunks.push(combined);
     } else {
       finalChunks.push(processedParagraphs[i]);
       i--; // Process next paragraph separately
     }
   } else {
     // Last paragraph if odd count
     finalChunks.push(processedParagraphs[i]);
   }
 }
 
 return finalChunks;
}

// 3. Create a card for a story chunk
function createChunkCard() {
 const card = document.createElement("div");
 card.classList.add("chunkCard");
 
 // Image container
 const imgDiv = document.createElement("div");
 imgDiv.classList.add("chunkImage");
 card.appendChild(imgDiv);
 
 // Text container
 const textDiv = document.createElement("div");
 textDiv.classList.add("chunkText");
 card.appendChild(textDiv);
 
 return card;
}

// 4. Fetch and display image for a chunk with improved loading detection
async function fetchAndDisplayImage(chunkText, imgContainer) {
 try {
   // Show loading indicator
   imgContainer.innerHTML = "<p>Creating magical image...</p>";
   
   // Build a good prompt for the image
   const prompt = buildImagePrompt(chunkText);
   
   // Generate random seed for image
   const imageSeed = Math.floor(Math.random() * 1000000);
   
   // Generate image URL with random seed
   const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&seed=${imageSeed}&token=${TOKEN}&referer=${REFERER}&nologo=true&private=true`;
   
   // Fetch image
   const blob = await fetchImageBlob(imageUrl);
   const objectURL = URL.createObjectURL(blob);
   
   // Clear loading indicator
   imgContainer.innerHTML = "";
   
   // Create and add image to container
   const imgElem = document.createElement("img");
   
   // Create proper promise that resolves when image is loaded
   return new Promise((resolve, reject) => {
     // Set timeout to prevent hanging if image load never completes
     const timeout = setTimeout(() => {
       if (!imgElem.complete) {
         console.warn("Image load timed out");
         imgContainer.innerHTML = "<p>Image magic took too long</p>";
         reject(new Error("Image load timed out"));
       }
     }, 15000); // 15 second timeout
     
     // Handle image load success
     imgElem.onload = () => {
       // Clear the timeout since image loaded successfully
       clearTimeout(timeout);
       
       // Add loaded class to trigger animation
       setTimeout(() => {
         imgElem.classList.add("loaded");
         resolve();
       }, 100);
     };
     
     // Handle image load error
     imgElem.onerror = () => {
       clearTimeout(timeout);
       console.error("Image failed to load");
       imgContainer.innerHTML = "<p>Image magic failed</p>";
       reject(new Error("Image failed to load"));
     };
     
     // Set src after attaching events
     imgElem.src = objectURL;
     imgElem.alt = "Story illustration";
     imgContainer.appendChild(imgElem);
   });
 } catch (err) {
   console.error("Image generation error:", err);
   imgContainer.innerHTML = "<p>Image magic failed</p>";
   throw err;
 }
}

function buildImagePrompt(chunkText) {
  // Extract key elements from text for better image prompt
  let prompt = chunkText;
  
  // Limit prompt length
  if (prompt.length > 200) {
    // Try to find key nouns and descriptive phrases
    const keywords = extractKeywords(chunkText);
    prompt = keywords.join(", ");
  }
  
  // Generate the style description based on theme
  let themeStyle = "";
  let artStyle = "";
  let colorScheme = "";
  let setting = "";
  let customInstructions = "";
  
  if (selectedTheme === "custom") {
    // Use detailed custom story theme parameters
    
    // Art style
    const artStyles = {
      storybook: "classic storybook illustration",
      cartoon: "cartoon style with bold outlines",
      watercolor: "soft watercolor painting",
      pixar: "3D animation style, rendered, polished",
      anime: "anime/manga style, stylized",
      retro: "vintage, retro illustration",
      realistic: "realistic, detailed render",
      minimalist: "minimalist, clean lines",
      pixel: "pixel art style, 8-bit inspired",
      comic: "comic book style with panels"
    };
    artStyle = artStyles[customTheme.artStyle] || artStyles.storybook;
    
    // Color scheme
    const colorSchemes = {
      vibrant: "vibrant, rich colors, colorful palette",
      pastel: "soft pastel colors, gentle tones",
      contrasting: "high contrast colors, bold palette",
      monochromatic: "monochromatic, shades of one color",
      dark: "dark mood, deep shadows, muted colors",
      bright: "bright, cheerful colors, sunny palette",
      earthy: "natural earthy tones, nature-inspired palette"
    };
    colorScheme = colorSchemes[customTheme.colorScheme] || colorSchemes.vibrant;
    
    // Setting
    const settings = {
      magical: "magical fantasy world",
      realistic: "realistic environment",
      forest: "enchanted forest with tall trees",
      ocean: "underwater scene with marine life",
      space: "outer space with stars and planets",
      city: "city landscape with buildings",
      village: "cozy small village",
      castle: "grand castle or palace",
      school: "school setting with classroom elements",
      future: "futuristic setting with technology",
      prehistoric: "prehistoric setting with ancient elements"
    };
    setting = settings[customTheme.setting] || "";
    
    // Character type
    let characterType = "";
    if (customTheme.mainCharacterType) {
      const characterTypes = {
        child: "child protagonist",
        adult: "adult character",
        animal: "anthropomorphic animal character",
        magical: "magical being or creature",
        robot: "robot or AI character",
        mythical: "mythical creature",
        toy: "living toy character",
        plant: "living plant character"
      };
      characterType = characterTypes[customTheme.mainCharacterType] || "";
    }
    
    // Custom instructions from user input
    customInstructions = customTheme.customImageStyle || customTheme.imageStyle || "";
    
    // Combine all elements into a cohesive style description
    themeStyle = `${artStyle}, ${colorScheme}, ${setting ? `set in a ${setting}` : ""} 
      ${characterType ? `featuring a ${characterType}` : ""} 
      ${customInstructions}`.trim();
  } else {
    // Use pre-defined theme styles for built-in themes
    const themeStyles = {
      kids: "colorful children's book, friendly characters, vibrant colors, playful",
      adult: "realistic, detailed, cinematic, dramatic lighting, mature themes, subtle tones",
      fun: "cartoonish, exaggerated, bright colors, funny expressions, humorous, light-hearted",
      concise: "minimalist, clean lines, simple composition, elegant, uncluttered",
      spooky: "mysterious, foggy, shadows, eerie lighting, suspenseful atmosphere, dark tones",
      educational: "informative, clear details, educational, accurate depictions, infographic style",
      fantasy: "magical, fantastical creatures, glowing effects, otherworldly, epic scenery, mythical"
    };
    themeStyle = themeStyles[selectedTheme] || themeStyles.kids;
  }
  
  // Different styles based on the selected image model
  if (selectedImageModel === "turbo") {
    return `A detailed illustration showing: ${prompt}. ${themeStyle}, professional quality, no text.`;
  } else {
    return `An illustration in a storybook style: ${prompt}. ${themeStyle}, detailed artwork, digital art, crisp details, no text.`;
  }
}

function extractKeywords(text) {
  // Enhanced keyword extraction
  const words = text.split(/\s+/);
  
  // Find character names (capitalized words not at the start of sentences)
  const names = [];
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    for (let i = 1; i < words.length; i++) { // Skip first word of sentence
      const word = words[i];
      if (/^[A-Z][a-z]{2,}/.test(word)) {
        names.push(word);
      }
    }
  }
  
  // Get descriptive words (adjectives often end with these suffixes)
  const descriptors = words.filter(word => 
    /ful$|ous$|ing$|ant$|ent$|ive$|ly$|est$/.test(word.toLowerCase()) && 
    word.length > 4
  );
  
  // Get nouns (longer words not in the above categories)
  const longWords = words.filter(word => 
    word.length > 6 && 
    !descriptors.includes(word)
  );
  
  // Combine all unique keywords
  const uniqueKeywords = [...new Set([
    ...names, 
    ...descriptors.slice(0, 5), 
    ...longWords.slice(0, 5)
  ])];
  
  // Get some longer phrases too (potential scenes or objects)
  const phrases = text.match(/[A-Z]?[a-z]+\s+(and|the|a|of|in|on|with)\s+[a-z]+/g) || [];
  
  return [...uniqueKeywords.slice(0, 8), ...phrases.slice(0, 4)];
}

async function fetchImageBlob(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Image fetch error: " + resp.status);
  return resp.blob();
}

// New function to prepare audio in advance
async function prepareAudio(chunk) {
  return new Promise(async (resolve, reject) => {
    try {
      // Clear existing audio queue
      audioQueue = [];
      
      // Generate random seed for audio
      const audioSeed = Math.floor(Math.random() * 1000000);
      
      // Build audio payload with the requested prefix
      const audioPrompt = `Repeat the following text word for word without any changes or corrections: ${chunk}`;
      const audioPayload = {
        model: "openai-audio",
        modalities: ["text", "audio"],
        audio: { voice: selectedVoice, format: "pcm16" },
        stream: true,
        messages: [{ role: "system", content: audioPrompt }],
        store: true,
        seed: audioSeed
      };
      
      const audioResp = await fetch(`${textEndpoint}/v1/chat/completions`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(audioPayload)
      });
      
      if (!audioResp.ok) throw new Error("Audio generation failed: " + audioResp.status);
      
      let buffer = "";
      const reader = audioResp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      // Process the streamed response and collect audio chunks
      async function processStream() {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            resolve(); // Audio preparation complete
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              
              try {
                const jsonObj = JSON.parse(jsonStr);
                if (jsonObj.choices && jsonObj.choices[0] && jsonObj.choices[0].delta) {
                  const delta = jsonObj.choices[0].delta;
                  
                  // Store audio data in queue
                  if (delta.audio && delta.audio.data) {
                    const base64Data = delta.audio.data;
                    const bin = atob(base64Data);
                    const bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) {
                      bytes[i] = bin.charCodeAt(i);
                    }
                    audioQueue.push(bytes);
                  }
                }
              } catch (e) {
                console.error("JSON parse error:", e);
              }
            }
          }
          
          // Continue reading
          await processStream();
        } catch (e) {
          console.error("Stream reading error:", e);
          reject(e);
        }
      }
      
      // Start processing the stream
      await processStream();
      
    } catch (err) {
      console.error("Audio preparation error:", err);
      reject(err);
    }
  });
}

// Display text and play audio in sync with better timing
async function displayTextAndPlayAudio(chunk, textDiv) {
  return new Promise(async (resolve, reject) => {
    try {
      // Clear existing text and add typing cursor
      textDiv.textContent = "";
      const typingCursor = document.createElement("span");
      typingCursor.classList.add("typingCursor");
      textDiv.appendChild(typingCursor);
      
      // Initialize audio
      if (!audioContext || audioContext.state === "closed") {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } else if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      playbackTimeOffset = audioContext.currentTime;
      
      // If we have audio in queue, start playing and typing together
      if (audioQueue.length > 0) {
        // Start playing audio
        let audioIndex = 0;
        
        // Calculate approximate total audio duration
        const totalAudioDuration = audioQueue.reduce((total, chunk) => {
          return total + (chunk.byteLength / 2) / sampleRate;
        }, 0);
        
        // Calculate typing speed based on audio duration
        // Make text slightly ahead of audio to fix sync issue
        const typingDuration = totalAudioDuration * 0.97; 
        const charsPerSecond = chunk.length / typingDuration;
        
        // Start audio playback
        function playNextAudioChunk() {
          if (audioIndex >= audioQueue.length) return;
          
          const audioChunk = audioQueue[audioIndex++];
          const duration = playAudioChunk(audioChunk);
          
          if (audioIndex < audioQueue.length) {
            // Schedule next audio chunk with precise timing
            setTimeout(playNextAudioChunk, duration * 900); // Slightly slower to let text stay ahead
          }
        }
        
        // Start text typing with matched speed
        let charIndex = 0;
        function typeNextChar() {
          if (charIndex >= chunk.length) {
            typingCursor.remove();
            resolve();
            return;
          }
          
          const nextChar = chunk[charIndex++];
          typingCursor.insertAdjacentText("beforebegin", nextChar);
          
          // Calculate delay based on character type to match audio
          const baseDelay = 1000 / charsPerSecond;
          const delay = nextChar === "." || nextChar === "!" || nextChar === "?" ? baseDelay * 2.5 : 
                        nextChar === "," || nextChar === ";" ? baseDelay * 1.8 : 
                        baseDelay;
          
          setTimeout(typeNextChar, delay);
        }
        
        // Start text slightly before audio for better sync
        typeNextChar();
        
        // Start audio after a short delay
        setTimeout(playNextAudioChunk, 100);
      } else {
        // Fallback if no audio queue
        textDiv.textContent = chunk;
        resolve();
      }
      
    } catch (err) {
      console.error("Display and audio playback error:", err);
      textDiv.textContent = chunk; // Fallback
      resolve();
    }
  });
}

function playAudioChunk(pcmData) {
 if (!audioContext) return 0;
 
 try {
   const numSamples = pcmData.byteLength / 2;
   const floatData = new Float32Array(numSamples);
   const dataView = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
   
   // Convert PCM16 to float
   for (let i = 0; i < numSamples; i++) {
     const sample = dataView.getInt16(i * 2, true);
     floatData[i] = sample / 32768;
   }
   
   // Create buffer source
   const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
   audioBuffer.copyToChannel(floatData, 0);
   
   // Calculate timing
   const now = audioContext.currentTime;
   if (playbackTimeOffset < now) playbackTimeOffset = now;
   
   // Play the sound
   const source = audioContext.createBufferSource();
   source.buffer = audioBuffer;
   source.connect(audioContext.destination);
   source.start(playbackTimeOffset);
   
   // Update offset for next chunk
   const duration = audioBuffer.duration;
   playbackTimeOffset += duration;
   
   return duration;
 } catch (err) {
   console.error("Audio playback error:", err);
   return 0;
 }
}

// 6. Add emotion indicator based on text content
function addEmoticon(textContainer, text) {
 const emotions = [
   { keywords: ["happy", "joy", "laugh", "smile", "excited", "fun"], emoji: "😄" },
   { keywords: ["sad", "cry", "tear", "unhappy", "sorrow"], emoji: "😢" },
   { keywords: ["scared", "afraid", "fear", "terrify", "fright"], emoji: "😨" },
   { keywords: ["angry", "mad", "fury", "rage"], emoji: "😠" },
   { keywords: ["surprised", "shock", "amaze", "astonish"], emoji: "😲" },
   { keywords: ["love", "heart", "adore", "care"], emoji: "❤️" },
   { keywords: ["magic", "wizard", "spell", "enchant"], emoji: "✨" },
   { keywords: ["adventure", "explore", "journey", "quest"], emoji: "🧭" }
 ];
 
 // Default emoji if no match
 let emoji = "📖";
 
 // Find matching emotion
 const lowerText = text.toLowerCase();
 for (const emotion of emotions) {
   if (emotion.keywords.some(keyword => lowerText.includes(keyword))) {
     emoji = emotion.emoji;
     break;
   }
 }
 
 // Create emoticon element
 const emoticon = document.createElement("div");
 emoticon.classList.add("emoticon");
 emoticon.textContent = emoji;
 textContainer.appendChild(emoticon);
}

// 7. UI Helpers
function updateStatus(message, isLoading) {
 statusElem.textContent = message;
 if (isLoading) {
   statusElem.classList.add("loading");
 } else {
   statusElem.classList.remove("loading");
 }
}

function updateProgress(percent) {
 progressBar.style.width = `${percent}%`;
}

function resetStory() {
 storyContainer.innerHTML = "";
 storyEnd.classList.remove("active");
 updateProgress(0);
 currentChunkIndex = 0;
 totalChunks = 0;
 storyChunks = [];
 audioQueue = [];
 preloadedChunks = [];
 preloadingStarted = false;
 updateStatus("Ready for your imagination!", false);
 if (audioContext) {
   playbackTimeOffset = audioContext.currentTime;
 }
}

function shakeElement(element) {
 element.classList.add("shake");
 setTimeout(() => element.classList.remove("shake"), 500);
}

// 8. Visual effects
function createConfetti(count) {
 for (let i = 0; i < count; i++) {
   const confetti = document.createElement("div");
   confetti.classList.add("confetti");
   
   // Random properties
   const size = Math.random() * 8 + 5;
   const colors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#F9C80E", "#F86624"];
   const color = colors[Math.floor(Math.random() * colors.length)];
   const left = Math.random() * 100;
   const delay = Math.random() * 3;
   const duration = Math.random() * 3 + 2;
   
   // Apply styles
   confetti.style.width = `${size}px`;
   confetti.style.height = `${size}px`;
   confetti.style.backgroundColor = color;
   confetti.style.left = `${left}%`;
   confetti.style.animationDuration = `${duration}s`;
   confetti.style.animationDelay = `${delay}s`;
   
   // Random rotation
   confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
   
   // Different shapes
   const shapes = ["50%", "0%"];
   if (Math.random() > 0.5) {
     confetti.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)];
   }
   
   document.body.appendChild(confetti);
   
   // Remove after animation
   setTimeout(() => {
     confetti.remove();
   }, (duration + delay) * 1000);
 }
}

function animateBlobs() {
  const blobs = document.querySelectorAll('.blob');
  
  blobs.forEach(blob => {
    // Random movement with more interesting patterns
    const moveX = Math.random() * 15 - 7.5;
    const moveY = Math.random() * 15 - 7.5;
    const duration = Math.random() * 30 + 30;
    const scale = 0.9 + Math.random() * 0.3;
    
    blob.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 0.8 },
      { transform: `translate(${moveX}%, ${moveY}%) scale(${scale})`, opacity: 1 },
      { transform: 'translate(0, 0) scale(1)', opacity: 0.8 }
    ], {
      duration: duration * 1000,
      iterations: Infinity,
      easing: 'ease-in-out'
    });
  });
}

// Function to update settings animations
function updateSettingsAnimations() {
  // Add floating animations to settings icons
  const settingsItems = document.querySelectorAll('.settings-item');
  settingsItems.forEach((item, index) => {
    const delay = index * 0.2;
    item.style.animationDelay = `${delay}s`;
    item.classList.add('float');
  });
}

// 9. Text cleaning
function cleanText(str) {
  let out = str;
  // Remove common prefixes and formatting
  out = out.replace(/^(Sure!|Here's|Alright|Okay|Of course|Title:|Story:|).*/i, "");
  out = out.replace(/based on (your|the) prompt.*?:/gi, "");
  out = out.replace(/\*\*/g, "");
  out = out.replace(/\*/g, "");
  out = out.replace(/^"/, "").replace(/"$/, "");
  out = out.replace(/^Once upon a time,/, "Once upon a time,"); // Keep this phrase if it exists
  
  // Handle common AI text patterns
  out = out.replace(/As an AI language model.*?(?=\n|$)/gi, "");
  out = out.replace(/I'd be happy to.*?(?=\n|$)/gi, "");
  
  // Trim and handle multiple blank lines
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

// Start story pulse animation to attract attention
function pulseStartButton() {
  generateBtn.classList.add('pulse');
  setTimeout(() => {
    generateBtn.classList.remove('pulse');
  }, 2000);
  
  // Schedule next pulse
  setTimeout(pulseStartButton, 10000);
}

// Create twinkling stars in the background
function createStars(count) {
  // Clear existing stars
  if (starsContainer) starsContainer.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    
    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Random size
    const size = Math.random() * 4 + 2;
    
    // Random delay for twinkling effect
    const delay = Math.random() * 4;
    
    star.style.left = `${x}vw`;
    star.style.top = `${y}vh`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDelay = `${delay}s`;
    
    document.body.appendChild(star);
  }
}

// Initialize on load
document.addEventListener("DOMContentLoaded", function() {
  promptInput.focus();
  updateStatus("Type your story idea and click 'Create Story'!", false);
  
  // Apply the default theme
  applyTheme(selectedTheme);
  
  // Start button pulse animation after a delay
  setTimeout(pulseStartButton, 3000);
  
  // Update animations
  updateSettingsAnimations();
  
  // Create background stars
  createStars(50);
  
  // Occasionally create more confetti for fun
  setInterval(() => {
    if (Math.random() > 0.7 && !isGenerating) {
      createConfetti(5);
    }
  }, 8000);
});
