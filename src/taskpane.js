/* global Office */

// Storage keys
const STORAGE_KEYS = {
    API_KEY: 'chatgpt_assistant_api_key',
    SYSTEM_INSTRUCTIONS: 'chatgpt_assistant_instructions',
    MODEL: 'chatgpt_assistant_model'
};

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `You are a helpful email assistant. You help users understand, summarize, and respond to emails professionally and efficiently. Be concise but thorough.`;

// State
let currentEmailContent = null;
let currentEmailSubject = null;
let currentEmailFrom = null;
let isComposing = false;
let currentUserName = null;
let currentUserEmail = null;

// Initialize Office
Office.onReady((info) => {
    if (info.host === Office.HostType.Outlook) {
        initializeApp();
    }
});

function initializeApp() {
    // Get current user info
    loadCurrentUser();

    // Check if settings are configured
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);

    if (!apiKey) {
        showSettingsPanel();
    } else {
        showMainPanel();
        loadEmailContent();
    }

    // Set up event listeners
    setupEventListeners();

    // Load saved settings into form
    loadSettingsIntoForm();
}

function loadCurrentUser() {
    // Get the current user's display name and email from the mailbox
    const userProfile = Office.context.mailbox.userProfile;
    if (userProfile) {
        currentUserName = userProfile.displayName || '';
        currentUserEmail = userProfile.emailAddress || '';
    }
}

function setupEventListeners() {
    // Settings
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('open-settings').addEventListener('click', showSettingsPanel);

    // Action buttons
    document.getElementById('btn-summarize').addEventListener('click', () => handleAction('summarize'));
    document.getElementById('btn-reply').addEventListener('click', () => handleAction('reply'));
    document.getElementById('btn-action-items').addEventListener('click', () => handleAction('action-items'));
    document.getElementById('btn-tone').addEventListener('click', () => handleAction('tone'));
    document.getElementById('btn-custom').addEventListener('click', handleCustomPrompt);

    // Response actions
    document.getElementById('btn-copy').addEventListener('click', copyResponse);
    document.getElementById('btn-insert').addEventListener('click', insertResponse);
}

function loadSettingsIntoForm() {
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
    const instructions = localStorage.getItem(STORAGE_KEYS.SYSTEM_INSTRUCTIONS) || '';
    const model = localStorage.getItem(STORAGE_KEYS.MODEL) || 'gpt-4o';

    document.getElementById('api-key').value = apiKey;
    document.getElementById('system-instructions').value = instructions;
    document.getElementById('model-select').value = model;
}

function saveSettings() {
    const apiKey = document.getElementById('api-key').value.trim();
    const instructions = document.getElementById('system-instructions').value.trim();
    const model = document.getElementById('model-select').value;

    if (!apiKey) {
        showError('Please enter your OpenAI API key.');
        return;
    }

    if (!apiKey.startsWith('sk-')) {
        showError('Invalid API key format. It should start with "sk-".');
        return;
    }

    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_INSTRUCTIONS, instructions);
    localStorage.setItem(STORAGE_KEYS.MODEL, model);

    showMainPanel();
    loadEmailContent();
    showToast('Settings saved successfully!');
}

function showSettingsPanel() {
    document.getElementById('settings-panel').classList.remove('hidden');
    document.getElementById('main-panel').classList.add('hidden');
}

function showMainPanel() {
    document.getElementById('settings-panel').classList.add('hidden');
    document.getElementById('main-panel').classList.remove('hidden');
}

function loadEmailContent() {
    const item = Office.context.mailbox.item;

    if (!item) {
        updateEmailInfo('No email selected', '');
        return;
    }

    // Check if we're reading or composing
    if (item.itemType === Office.MailboxEnums.ItemType.Message) {
        if (item.displayReplyForm) {
            // Reading mode
            isComposing = false;
            loadReadingEmail(item);
        } else {
            // Compose mode
            isComposing = true;
            loadComposingEmail(item);
        }
    }
}

function loadReadingEmail(item) {
    currentEmailSubject = item.subject || 'No Subject';
    currentEmailFrom = item.from ? item.from.displayName || item.from.emailAddress : 'Unknown';

    updateEmailInfo(currentEmailSubject, `From: ${currentEmailFrom}`);

    // Get email body
    item.body.getAsync(Office.CoercionType.Text, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            currentEmailContent = result.value;
        } else {
            currentEmailContent = 'Unable to load email content.';
        }
    });
}

function loadComposingEmail(item) {
    item.subject.getAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            currentEmailSubject = result.value || 'New Email';
        }
    });

    item.body.getAsync(Office.CoercionType.Text, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            currentEmailContent = result.value;
        }
    });

    updateEmailInfo('Composing Email', 'Draft mode');
}

function updateEmailInfo(subject, from) {
    document.querySelector('.email-subject').textContent = subject;
    document.querySelector('.email-from').textContent = from;
}

async function handleAction(action) {
    if (!currentEmailContent) {
        showError('No email content available. Please select an email.');
        return;
    }

    let prompt;
    switch (action) {
        case 'summarize':
            prompt = `Please provide a concise summary of this email. Highlight the key points, any requests made, and important details:\n\n${currentEmailContent}`;
            break;
        case 'reply':
            prompt = `Please draft a professional reply to this email. The reply should be appropriate for the context and tone of the original message. Do not include a sign-off or name at the end - the user will add their own signature. Do not include a Subject line - just the body of the reply.\n\nOriginal Email from ${currentEmailFrom}:\n${currentEmailContent}`;
            break;
        case 'action-items':
            prompt = `Please extract and list all action items, tasks, deadlines, or requests from this email in a clear bullet-point format:\n\n${currentEmailContent}`;
            break;
        case 'tone':
            prompt = `Please analyze the tone and sentiment of this email. Describe whether it's formal/informal, positive/negative/neutral, urgent/relaxed, and any other notable characteristics:\n\n${currentEmailContent}`;
            break;
        default:
            return;
    }

    await sendToChatGPT(prompt);
}

async function handleCustomPrompt() {
    const customPrompt = document.getElementById('custom-prompt').value.trim();

    if (!customPrompt) {
        showError('Please enter a custom prompt.');
        return;
    }

    const fullPrompt = currentEmailContent
        ? `Regarding this email:\n\n${currentEmailContent}\n\nUser request: ${customPrompt}`
        : customPrompt;

    await sendToChatGPT(fullPrompt);
}

async function sendToChatGPT(userPrompt) {
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const customInstructions = localStorage.getItem(STORAGE_KEYS.SYSTEM_INSTRUCTIONS) || '';
    const model = localStorage.getItem(STORAGE_KEYS.MODEL) || 'gpt-4o';

    if (!apiKey) {
        showError('API key not configured. Please go to settings.');
        showSettingsPanel();
        return;
    }

    showLoading(true);
    hideError();
    hideResponse();

    // Build system prompt
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    if (customInstructions) {
        systemPrompt += `\n\nAdditional instructions from user:\n${customInstructions}`;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0]?.message?.content || 'No response received.';

        showResponse(assistantMessage);

    } catch (error) {
        console.error('ChatGPT API Error:', error);
        showError(`Error: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function showResponse(content) {
    const responseSection = document.getElementById('response-section');
    const responseContent = document.getElementById('response-content');

    responseContent.textContent = content;
    responseSection.classList.remove('hidden');

    // Scroll response into view
    responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResponse() {
    document.getElementById('response-section').classList.add('hidden');
}

function copyResponse() {
    const responseContent = document.getElementById('response-content').textContent;

    navigator.clipboard.writeText(responseContent).then(() => {
        showToast('Copied to clipboard!');
    }).catch((err) => {
        console.error('Failed to copy:', err);
        showError('Failed to copy to clipboard.');
    });
}

function insertResponse() {
    const responseContent = document.getElementById('response-content').textContent;
    const item = Office.context.mailbox.item;

    if (!item) {
        showError('No email context available.');
        return;
    }

    // Check if we can insert (compose mode)
    if (item.body && item.body.setSelectedDataAsync) {
        item.body.setSelectedDataAsync(
            responseContent,
            { coercionType: Office.CoercionType.Text },
            (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    showToast('Inserted into email!');
                } else {
                    // Try to set the entire body if setSelectedDataAsync fails
                    item.body.setAsync(
                        responseContent,
                        { coercionType: Office.CoercionType.Text },
                        (setResult) => {
                            if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                                showToast('Content set in email body!');
                            } else {
                                showError('Unable to insert. Try copying instead.');
                            }
                        }
                    );
                }
            }
        );
    } else {
        // Reading mode - try to create a reply
        if (item.displayReplyForm) {
            item.displayReplyForm(responseContent);
            showToast('Reply form opened with content!');
        } else {
            showError('Unable to insert in reading mode. Try copying instead.');
        }
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const buttons = document.querySelectorAll('.btn-action, #btn-custom');

    if (show) {
        loading.classList.remove('hidden');
        buttons.forEach(btn => btn.disabled = true);
    } else {
        loading.classList.add('hidden');
        buttons.forEach(btn => btn.disabled = false);
    }
}

function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.success-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
