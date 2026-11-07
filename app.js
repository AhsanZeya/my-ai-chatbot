/**
 * ChatGPT Clone for GitHub Pages
 * Free, client-side AI Chatbot with localStorage persistence
 */

// --- Model Catalogs ---
const PROVIDER_MODELS = {
  gemini: [
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Super Fast & High Availability)' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' }
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o mini (Fast & Affordable)' },
    { id: 'gpt-4o', name: 'GPT-4o (Flagship Model)' }
  ],
  openrouter: [
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free via OpenRouter)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' }
  ],
  demo: [
    { id: 'demo-assistant', name: 'Demo Mode (Simulated AI, No Key Needed)' }
  ]
};

// --- Default Configuration ---
const DEFAULT_SETTINGS = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.1-flash-lite',
  systemPrompt: 'You are a helpful, brilliant, and friendly AI assistant. Format your responses nicely with markdown when appropriate.',
  temperature: 0.7
};

// --- App State ---
const state = {
  settings: { ...DEFAULT_SETTINGS },
  chats: [],
  activeChatId: null,
  isGenerating: false,
  abortController: null,
  theme: 'dark'
};

// --- DOM Elements ---
const elements = {
  // Sidebar
  sidebar: document.getElementById('sidebar'),
  mobileOverlay: document.getElementById('mobile-overlay'),
  openSidebarBtn: document.getElementById('open-sidebar-btn'),
  closeSidebarBtn: document.getElementById('close-sidebar-btn'),
  newChatBtn: document.getElementById('new-chat-btn'),
  chatList: document.getElementById('chat-list'),
  openSettingsBtn: document.getElementById('open-settings-btn'),
  topSettingsBtn: document.getElementById('top-settings-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeIcon: document.getElementById('theme-icon'),
  themeText: document.getElementById('theme-text'),
  clearChatsBtn: document.getElementById('clear-chats-btn'),
  
  // Header
  activeModelName: document.getElementById('active-model-name'),
  
  // Messages Area
  chatMessages: document.getElementById('chat-messages'),
  welcomeScreen: document.getElementById('welcome-screen'),
  
  // Input Area
  chatInput: document.getElementById('chat-input'),
  sendBtn: document.getElementById('send-btn'),
  stopBtn: document.getElementById('stop-btn'),
  
  // Settings Modal
  settingsModal: document.getElementById('settings-modal'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  providerSelect: document.getElementById('provider-select'),
  apiKeyGroup: document.getElementById('api-key-group'),
  apiKeyInput: document.getElementById('api-key-input'),
  apiKeyHelpLink: document.getElementById('api-key-help-link'),
  toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
  eyeIcon: document.getElementById('eye-icon'),
  modelSelect: document.getElementById('model-select'),
  systemPromptInput: document.getElementById('system-prompt-input'),
  testKeyBtn: document.getElementById('test-key-btn'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  testConnectionStatus: document.getElementById('test-connection-status')
};

// --- Initialize Marked & Highlight.js ---
if (window.marked) {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
      if (window.hljs && lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (e) {}
      }
      return code;
    }
  });
}

// --- Persistence Helpers (localStorage) ---
function loadFromStorage() {
  try {
    const savedSettings = localStorage.getItem('chatgpt_clone_settings');
    if (savedSettings) {
      state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      // Auto-migrate retired or high-demand models to gemini-3.1-flash-lite
      if (['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-3.8-flash'].includes(state.settings.model)) {
        state.settings.model = 'gemini-3.1-flash-lite';
        saveSettingsToStorage();
      }
    }

    const savedChats = localStorage.getItem('chatgpt_clone_chats');
    if (savedChats) {
      state.chats = JSON.parse(savedChats);
    }

    const savedActiveId = localStorage.getItem('chatgpt_clone_active_id');
    if (savedActiveId && state.chats.some(c => c.id === savedActiveId)) {
      state.activeChatId = savedActiveId;
    } else if (state.chats.length > 0) {
      state.activeChatId = state.chats[0].id;
    }

    const savedTheme = localStorage.getItem('chatgpt_clone_theme');
    if (savedTheme) {
      state.theme = savedTheme;
    }
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
  }
}

function saveChatsToStorage() {
  try {
    localStorage.setItem('chatgpt_clone_chats', JSON.stringify(state.chats));
    if (state.activeChatId) {
      localStorage.setItem('chatgpt_clone_active_id', state.activeChatId);
    } else {
      localStorage.removeItem('chatgpt_clone_active_id');
    }
  } catch (err) {
    console.error('Failed to save chats:', err);
  }
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem('chatgpt_clone_settings', JSON.stringify(state.settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// --- Theme Management ---
function applyTheme(theme) {
  state.theme = theme;
  document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
  elements.themeText.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
  elements.themeIcon.setAttribute('data-lucide', theme === 'light' ? 'moon' : 'sun');
  localStorage.setItem('chatgpt_clone_theme', theme);
  lucide.createIcons();
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
}

// --- Chat Management ---
function createNewChat() {
  const newChat = {
    id: 'chat_' + Date.now(),
    title: 'New Chat',
    createdAt: new Date().toISOString(),
    messages: []
  };

  state.chats.unshift(newChat);
  state.activeChatId = newChat.id;
  saveChatsToStorage();
  renderChatList();
  renderMessages();
  elements.chatInput.focus();
  closeSidebarMobile();
}

function selectChat(chatId) {
  if (state.isGenerating) return;
  state.activeChatId = chatId;
  saveChatsToStorage();
  renderChatList();
  renderMessages();
  closeSidebarMobile();
}

function deleteChat(chatId, e) {
  if (e) e.stopPropagation();
  state.chats = state.chats.filter(c => c.id !== chatId);
  
  if (state.activeChatId === chatId) {
    state.activeChatId = state.chats.length > 0 ? state.chats[0].id : null;
  }
  
  saveChatsToStorage();
  renderChatList();
  renderMessages();
}

function clearAllChats() {
  if (state.chats.length === 0) return;
  if (!confirm('Are you sure you want to delete all chat history?')) return;
  
  state.chats = [];
  state.activeChatId = null;
  saveChatsToStorage();
  renderChatList();
  renderMessages();
}

function getActiveChat() {
  return state.chats.find(c => c.id === state.activeChatId);
}

// --- Render Chat List in Sidebar ---
function renderChatList() {
  elements.chatList.innerHTML = '';
  
  if (state.chats.length === 0) {
    elements.chatList.innerHTML = '<li class="chat-item" style="color:var(--text-muted); cursor:default;">No past conversations</li>';
    return;
  }

  state.chats.forEach(chat => {
    const li = document.createElement('li');
    li.className = `chat-item ${chat.id === state.activeChatId ? 'active' : ''}`;
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'chat-item-title';
    titleSpan.textContent = chat.title || 'Conversation';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'chat-item-delete';
    deleteBtn.title = 'Delete chat';
    deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width:14px;height:14px"></i>';
    deleteBtn.addEventListener('click', (e) => deleteChat(chat.id, e));

    li.appendChild(titleSpan);
    li.appendChild(deleteBtn);
    li.addEventListener('click', () => selectChat(chat.id));

    elements.chatList.appendChild(li);
  });

  lucide.createIcons();
}

// --- Render Messages in Main Chat Area ---
function renderMessages() {
  const currentChat = getActiveChat();

  if (!currentChat || currentChat.messages.length === 0) {
    elements.welcomeScreen.classList.remove('hidden');
    elements.chatMessages.querySelectorAll('.message-row').forEach(row => row.remove());
    return;
  }

  elements.welcomeScreen.classList.add('hidden');
  elements.chatMessages.querySelectorAll('.message-row').forEach(row => row.remove());

  currentChat.messages.forEach(msg => {
    appendMessageElement(msg.role, msg.content);
  });

  scrollToBottom();
}

function appendMessageElement(role, content = '', isStreaming = false) {
  elements.welcomeScreen.classList.add('hidden');

  const row = document.createElement('div');
  row.className = `message-row ${role === 'user' ? 'user-row' : 'bot-row'}`;

  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar bot-avatar';
    avatar.innerHTML = '🤖';
    row.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${isStreaming ? 'typing-cursor' : ''}`;
  
  if (role === 'user') {
    bubble.textContent = content;
  } else {
    bubble.innerHTML = renderMarkdown(content);
    attachCodeCopyButtons(bubble);
  }

  row.appendChild(bubble);

  if (role === 'user') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar user-avatar';
    avatar.innerHTML = '👤';
    row.appendChild(avatar);
  }

  elements.chatMessages.appendChild(row);
  scrollToBottom();

  return bubble;
}

function renderMarkdown(rawText) {
  if (!rawText) return '';
  if (window.marked) {
    return marked.parse(rawText);
  }
  return rawText.replace(/\n/g, '<br>');
}

function attachCodeCopyButtons(container) {
  const preBlocks = container.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    // Avoid double wrapping
    if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    const header = document.createElement('div');
    header.className = 'code-block-header';

    const code = pre.querySelector('code');
    let lang = 'code';
    if (code && code.className) {
      const match = code.className.match(/language-(\w+)/);
      if (match) lang = match[1];
    }
    header.innerHTML = `<span>${lang}</span>`;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy-code';
    copyBtn.innerHTML = '<i data-lucide="copy" style="width:13px;height:13px"></i> <span>Copy</span>';
    copyBtn.addEventListener('click', async () => {
      try {
        const textToCopy = code ? code.innerText : pre.innerText;
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px"></i> <span>Copied!</span>';
        lucide.createIcons();
        setTimeout(() => {
          copyBtn.innerHTML = '<i data-lucide="copy" style="width:13px;height:13px"></i> <span>Copy</span>';
          lucide.createIcons();
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    });

    header.appendChild(copyBtn);
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });

  lucide.createIcons();
}

function scrollToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// --- Auto-resize Textarea ---
function autoResizeInput() {
  const input = elements.chatInput;
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 180) + 'px';
  elements.sendBtn.disabled = input.value.trim().length === 0;
}

// --- Sending & AI Generation ---
async function handleSendMessage() {
  const text = elements.chatInput.value.trim();
  if (!text || state.isGenerating) return;

  // Ensure active chat exists
  if (!state.activeChatId) {
    const newChat = {
      id: 'chat_' + Date.now(),
      title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
      createdAt: new Date().toISOString(),
      messages: []
    };
    state.chats.unshift(newChat);
    state.activeChatId = newChat.id;
  }

  const currentChat = getActiveChat();

  // If first message in a "New Chat", auto-title it
  if (currentChat.messages.length === 0 && currentChat.title === 'New Chat') {
    currentChat.title = text.slice(0, 32) + (text.length > 32 ? '...' : '');
    renderChatList();
  }

  // Push user message
  currentChat.messages.push({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString()
  });

  saveChatsToStorage();
  appendMessageElement('user', text);

  // Clear input
  elements.chatInput.value = '';
  autoResizeInput();

  // Create empty bot bubble for streaming
  setGenerationState(true);
  const botBubble = appendMessageElement('assistant', '', true);

  try {
    state.abortController = new AbortController();
    let responseText = '';

    if (state.settings.provider === 'demo') {
      responseText = await streamDemoResponse(text, botBubble);
    } else if (state.settings.provider === 'gemini') {
      responseText = await streamGeminiResponse(currentChat.messages, botBubble);
    } else if (state.settings.provider === 'openai' || state.settings.provider === 'openrouter') {
      responseText = await streamOpenAICompatibleResponse(currentChat.messages, botBubble);
    }

    // Save final assistant message
    currentChat.messages.push({
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    });
    saveChatsToStorage();

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Generation stopped by user.');
    } else {
      console.error('AI generation error:', err);
      let errorMsg = `⚠️ **Error:** ${err.message || 'Failed to get response.'}`;
      if (!state.settings.apiKey && state.settings.provider !== 'demo') {
        errorMsg += '\n\n💡 *Tip: Please add your API key in Settings (gear icon in sidebar).*';
      }
      botBubble.innerHTML = renderMarkdown(errorMsg);
      currentChat.messages.push({
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toISOString()
      });
      saveChatsToStorage();
    }
  } finally {
    botBubble.classList.remove('typing-cursor');
    attachCodeCopyButtons(botBubble);
    setGenerationState(false);
  }
}

function setGenerationState(isGenerating) {
  state.isGenerating = isGenerating;
  if (isGenerating) {
    elements.sendBtn.classList.add('hidden');
    elements.stopBtn.classList.remove('hidden');
  } else {
    elements.sendBtn.classList.remove('hidden');
    elements.stopBtn.classList.add('hidden');
    state.abortController = null;
    autoResizeInput();
  }
}

function stopGeneration() {
  if (state.abortController) {
    state.abortController.abort();
  }
}

// --- Gemini Streaming Integration ---
async function streamGeminiResponse(messages, targetBubble) {
  const { apiKey, model, systemPrompt } = state.settings;

  if (!apiKey) {
    throw new Error('No Gemini API key provided. Open Settings to paste your free Google AI Studio key.');
  }

  // Format conversation for Gemini API
  // Gemini expects contents: [{ role: 'user' | 'model', parts: [{ text }] }]
  const contents = [];
  
  // Exclude the very last placeholder assistant message if present
  const validMessages = messages.filter(m => m.content && m.content.trim());

  validMessages.forEach(m => {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    });
  });

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: state.settings.temperature || 0.7
    }
  };

  if (systemPrompt && systemPrompt.trim()) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  let activeModel = model;
  let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  let response = await fetch(endpoint, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(requestBody),
    signal: state.abortController.signal
  });

  // If high demand or 503, automatically fallback to gemini-3.1-flash-lite
  if (!response.ok && (response.status === 503 || response.status === 429)) {
    if (activeModel !== 'gemini-3.1-flash-lite') {
      activeModel = 'gemini-3.1-flash-lite';
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody),
        signal: state.abortController.signal
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Gemini API returned status ${response.status}`;
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep last partial line

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith('data:')) continue;
      
      const jsonStr = cleanLine.replace(/^data:\s*/, '');
      if (jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (chunk) {
          accumulatedText += chunk;
          targetBubble.innerHTML = renderMarkdown(accumulatedText);
          scrollToBottom();
        }
      } catch (e) {
        // partial chunk, skip
      }
    }
  }

  return accumulatedText;
}

// --- OpenAI / OpenRouter Streaming Integration ---
async function streamOpenAICompatibleResponse(messages, targetBubble) {
  const { provider, apiKey, model, systemPrompt } = state.settings;

  if (!apiKey) {
    throw new Error(`No API key provided for ${provider}. Open Settings to add your key.`);
  }

  const isOpenRouter = provider === 'openrouter';
  const endpoint = isOpenRouter 
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const formattedMessages = [];
  if (systemPrompt && systemPrompt.trim()) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  messages.forEach(m => {
    if (m.content && m.content.trim()) {
      formattedMessages.push({ role: m.role, content: m.content });
    }
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  if (isOpenRouter) {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'ChatGPT Clone on GitHub Pages';
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: model,
      messages: formattedMessages,
      stream: true,
      temperature: state.settings.temperature || 0.7
    }),
    signal: state.abortController.signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `API returned status ${response.status}`;
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith('data:')) continue;
      const jsonStr = cleanLine.replace(/^data:\s*/, '');
      if (jsonStr === '[DONE]') break;

      try {
        const parsed = JSON.parse(jsonStr);
        const chunk = parsed.choices?.[0]?.delta?.content || '';
        if (chunk) {
          accumulatedText += chunk;
          targetBubble.innerHTML = renderMarkdown(accumulatedText);
          scrollToBottom();
        }
      } catch (e) {}
    }
  }

  return accumulatedText;
}

// --- Demo Mode Streaming (No Key Needed) ---
async function streamDemoResponse(userPrompt, targetBubble) {
  const simulatedResponse = `👋 **Hello! You are running in Demo Mode.**\n\nI can help you with anything! Since this website is hosted statically on **GitHub Pages**, here is how to get real AI answers:\n\n1. Click the **Settings (API Key)** button in the sidebar or top bar.\n2. Select **Google Gemini (Recommended - Free Tier)**.\n3. Grab a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and paste it.\n4. Save settings!\n\nHere is an example code block to demonstrate syntax highlighting:\n\`\`\`javascript\nfunction greet(name) {\n  console.log(\`Hello, \${name}! Your GitHub Pages chatbot is live! 🚀\`);\n}\ngreet("World");\n\`\`\`\n\n*Your question was:* "${userPrompt}"`;

  let accumulated = '';
  const words = simulatedResponse.split(' ');

  for (let i = 0; i < words.length; i++) {
    if (state.abortController.signal.aborted) break;
    accumulated += (i === 0 ? '' : ' ') + words[i];
    targetBubble.innerHTML = renderMarkdown(accumulated);
    scrollToBottom();
    await new Promise(r => setTimeout(r, 25));
  }

  return accumulated;
}

// --- Settings Modal Logic ---
function openSettingsModal() {
  elements.providerSelect.value = state.settings.provider;
  elements.apiKeyInput.value = state.settings.apiKey;
  elements.systemPromptInput.value = state.settings.systemPrompt;
  updateProviderUI();
  elements.modelSelect.value = state.settings.model;
  
  elements.testConnectionStatus.className = 'test-status hidden';
  elements.testConnectionStatus.textContent = '';

  elements.settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  elements.settingsModal.classList.add('hidden');
}

function updateProviderUI() {
  const provider = elements.providerSelect.value;
  const models = PROVIDER_MODELS[provider] || [];

  // Update models dropdown
  elements.modelSelect.innerHTML = '';
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    elements.modelSelect.appendChild(opt);
  });

  // Toggle API key group visibility for demo mode
  if (provider === 'demo') {
    elements.apiKeyGroup.classList.add('hidden');
  } else {
    elements.apiKeyGroup.classList.remove('hidden');
  }

  // Update help link
  if (provider === 'gemini') {
    elements.apiKeyHelpLink.href = 'https://aistudio.google.com/app/apikey';
    elements.apiKeyHelpLink.innerHTML = 'Get free Gemini key <i data-lucide="external-link"></i>';
    elements.apiKeyInput.placeholder = 'AIzaSy...';
  } else if (provider === 'openai') {
    elements.apiKeyHelpLink.href = 'https://platform.openai.com/api-keys';
    elements.apiKeyHelpLink.innerHTML = 'Get OpenAI key <i data-lucide="external-link"></i>';
    elements.apiKeyInput.placeholder = 'sk-...';
  } else if (provider === 'openrouter') {
    elements.apiKeyHelpLink.href = 'https://openrouter.ai/keys';
    elements.apiKeyHelpLink.innerHTML = 'Get OpenRouter key <i data-lucide="external-link"></i>';
    elements.apiKeyInput.placeholder = 'sk-or-...';
  }

  lucide.createIcons();
}

function saveSettings() {
  state.settings.provider = elements.providerSelect.value;
  state.settings.apiKey = elements.apiKeyInput.value.trim();
  state.settings.model = elements.modelSelect.value;
  state.settings.systemPrompt = elements.systemPromptInput.value.trim();

  saveSettingsToStorage();
  updateHeaderBadge();
  closeSettingsModal();
}

function updateHeaderBadge() {
  const provider = state.settings.provider;
  const modelId = state.settings.model;
  const list = PROVIDER_MODELS[provider] || [];
  const found = list.find(m => m.id === modelId);
  const displayName = found ? found.name.split(' (')[0] : modelId;
  
  elements.activeModelName.textContent = displayName;
}

async function testConnection() {
  const statusEl = elements.testConnectionStatus;
  statusEl.className = 'test-status';
  statusEl.textContent = 'Testing connection...';
  statusEl.classList.remove('hidden');

  const provider = elements.providerSelect.value;
  const apiKey = elements.apiKeyInput.value.trim();
  const model = elements.modelSelect.value;

  if (provider === 'demo') {
    statusEl.className = 'test-status success';
    statusEl.textContent = '✅ Demo mode is active. No API key needed!';
    return;
  }

  if (!apiKey) {
    statusEl.className = 'test-status error';
    statusEl.textContent = '❌ Please enter an API key first.';
    return;
  }

  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'x-goog-api-key': apiKey }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Status ${res.status}`);
      }
    } else {
      const endpoint = provider === 'openrouter' 
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Status ${res.status}`);
      }
    }

    statusEl.className = 'test-status success';
    statusEl.textContent = '✅ Connection successful! Your API key is working.';
  } catch (err) {
    statusEl.className = 'test-status error';
    statusEl.textContent = `❌ Connection failed: ${err.message}`;
  }
}

// --- Mobile Sidebar Controls ---
function openSidebarMobile() {
  elements.sidebar.classList.add('open');
  elements.mobileOverlay.classList.add('active');
}

function closeSidebarMobile() {
  elements.sidebar.classList.remove('open');
  elements.mobileOverlay.classList.remove('active');
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Sidebar actions
  elements.newChatBtn.addEventListener('click', createNewChat);
  elements.clearChatsBtn.addEventListener('click', clearAllChats);
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  elements.openSettingsBtn.addEventListener('click', openSettingsModal);
  elements.topSettingsBtn.addEventListener('click', openSettingsModal);

  // Mobile drawer
  elements.openSidebarBtn.addEventListener('click', openSidebarMobile);
  elements.closeSidebarBtn.addEventListener('click', closeSidebarMobile);
  elements.mobileOverlay.addEventListener('click', closeSidebarMobile);

  // Input & Send
  elements.chatInput.addEventListener('input', autoResizeInput);
  elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  elements.sendBtn.addEventListener('click', handleSendMessage);
  elements.stopBtn.addEventListener('click', stopGeneration);

  // Speech Recognition (Voice Input)
  const micBtn = document.getElementById('mic-btn');
  let recognition = null;
  let isRecording = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition && micBtn) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add('recording');
      micBtn.title = 'Listening... click to stop';
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      elements.chatInput.value = transcript;
      autoResizeInput();
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
    };

    function stopRecording() {
      isRecording = false;
      micBtn.classList.remove('recording');
      micBtn.title = 'Voice Input (Speech to text)';
    }

    micBtn.addEventListener('click', () => {
      if (!isRecording) {
        try {
          recognition.start();
        } catch (e) {
          stopRecording();
        }
      } else {
        recognition.stop();
        stopRecording();
      }
    });
  } else if (micBtn) {
    micBtn.style.display = 'none';
  }

  // Suggestions clicks
  document.querySelectorAll('.suggestion-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      elements.chatInput.value = prompt;
      autoResizeInput();
      handleSendMessage();
    });
  });

  // Settings Modal actions
  elements.closeModalBtn.addEventListener('click', closeSettingsModal);
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeSettingsModal();
  });
  elements.providerSelect.addEventListener('change', updateProviderUI);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.testKeyBtn.addEventListener('click', testConnection);

  // Export / Import Chats
  const exportBtn = document.getElementById('export-chats-btn');
  const importBtn = document.getElementById('import-chats-btn');
  const importFileInput = document.getElementById('import-file-input');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = JSON.stringify(state.chats, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            state.chats = [...imported, ...state.chats];
            // Remove duplicates by ID if any
            const unique = [];
            const ids = new Set();
            for (const c of state.chats) {
              if (!ids.has(c.id)) {
                ids.add(c.id);
                unique.push(c);
              }
            }
            state.chats = unique;
            if (state.chats.length > 0) state.activeChatId = state.chats[0].id;
            saveChatsToStorage();
            renderChatList();
            renderMessages();
            alert('Chats imported successfully!');
          } else {
            alert('Invalid chat file format.');
          }
        } catch (err) {
          alert('Failed to read file: ' + err.message);
        }
      };
      reader.readAsText(file);
      importFileInput.value = '';
    });
  }

  elements.toggleKeyVisibility.addEventListener('click', () => {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    lucide.createIcons();
  });
}

// --- Bootstrap ---
function init() {
  loadFromStorage();
  applyTheme(state.theme);
  updateHeaderBadge();
  renderChatList();
  renderMessages();
  setupEventListeners();
  autoResizeInput();
  lucide.createIcons();
}

window.addEventListener('DOMContentLoaded', init);
