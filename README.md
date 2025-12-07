# ChatGPT Email Assistant - Outlook Add-In

An Outlook Add-In that integrates with ChatGPT to help you summarize emails, draft replies, extract action items, and more.

## Features

- **Summarize Email** - Get a concise summary of any email
- **Draft Reply** - Generate professional replies based on email context
- **Extract Action Items** - Pull out tasks and deadlines from emails
- **Analyze Tone** - Understand the sentiment and tone of messages
- **Custom Prompts** - Ask ChatGPT anything about the current email
- **Custom Instructions** - Set up persistent instructions (e.g., your boss's writing style)
- **Insert Responses** - Directly insert ChatGPT responses into your email

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Microsoft Outlook (Desktop, Web, or Mobile)

## Quick Start

### 1. Generate SSL Certificates

Office Add-ins require HTTPS. Generate certificates using one of these methods:

**Option A: Using mkcert (Recommended)**
```bash
# Install mkcert: https://github.com/FiloSottile/mkcert
# On Windows with chocolatey:
choco install mkcert

# Or with scoop:
scoop install mkcert

# Then run:
mkcert -install
mkdir certs
cd certs
mkcert localhost
cd ..
```

**Option B: Using OpenSSL**
```bash
mkdir certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/localhost.key -out certs/localhost.crt \
  -subj "/CN=localhost"
```

### 2. Start the Development Server

```bash
cd outlook-chatgpt-addin
npm start
```

The server will run at `https://localhost:3000`

### 3. Sideload the Add-In

#### Outlook on the Web (outlook.com or outlook.office.com)
1. Open Outlook in your browser
2. Open any email
3. Click the **"..."** (More actions) button
4. Select **"Get Add-ins"**
5. Click **"My add-ins"** in the left sidebar
6. Scroll down to **"Custom add-ins"**
7. Click **"Add a custom add-in"** → **"Add from file..."**
8. Select the `manifest.xml` file from this project

#### Outlook Desktop (Windows)
1. Open Outlook
2. Go to **File** → **Manage Add-ins** (or **Home** → **Get Add-ins**)
3. Click **"My add-ins"**
4. Under **"Custom add-ins"**, click **"Add a custom add-in"** → **"Add from file..."**
5. Select the `manifest.xml` file

#### Outlook Desktop (Mac)
1. Open Outlook
2. Go to **Tools** → **Get Add-ins**
3. Click **"My add-ins"**
4. Click **"Add a custom add-in"** → **"Add from file..."**
5. Select the `manifest.xml` file

### 4. Configure Your API Key

1. Open an email in Outlook
2. Click the **"ChatGPT Assistant"** button in the ribbon
3. Enter your OpenAI API key
4. (Optional) Add custom instructions for ChatGPT
5. Click **"Save Settings"**

## Usage

1. **Open an email** in Outlook
2. **Click "ChatGPT Assistant"** in the ribbon/toolbar
3. **Choose an action:**
   - 📝 **Summarize** - Get a quick summary
   - ✉️ **Draft Reply** - Generate a response
   - ✅ **Action Items** - Extract tasks and deadlines
   - 🎭 **Analyze Tone** - Understand the email's sentiment
4. **Or enter a custom prompt** to ask anything about the email
5. **Copy or Insert** the response into your reply

## Custom Instructions

The "Custom Instructions" field lets you personalize ChatGPT's responses. Examples:

```
- My boss prefers formal language with bullet points
- Always sign off with "Best regards, [Name]"
- Keep replies under 3 paragraphs
- Use a friendly but professional tone
- Include relevant context from previous conversations
```

## Deploying to Multiple Machines

### Option 1: Shared Network Location
1. Host the add-in files on a shared network location
2. Update `manifest.xml` URLs to point to the shared location
3. Each user sideloads the same manifest

### Option 2: Centralized Deployment (Microsoft 365 Admin)
1. Go to Microsoft 365 Admin Center
2. Navigate to **Settings** → **Integrated apps**
3. Click **"Upload custom apps"**
4. Upload the `manifest.xml`
5. Assign to users/groups

### Option 3: SharePoint App Catalog
1. Create a SharePoint App Catalog
2. Upload the add-in package
3. Users can install from the catalog

## Project Structure

```
outlook-chatgpt-addin/
├── manifest.xml          # Office Add-in manifest
├── package.json          # Node.js package config
├── server.js             # HTTPS development server
├── generate-icons.js     # Icon generator script
├── src/
│   ├── taskpane.html     # Main UI
│   ├── taskpane.js       # Application logic
│   ├── styles.css        # Styling
│   └── functions.html    # Office functions file
├── assets/
│   └── icon-*.png        # Add-in icons
├── certs/                # SSL certificates (you create this)
│   ├── localhost.crt
│   └── localhost.key
└── README.md
```

## Troubleshooting

### "Add-in not loading"
- Ensure the server is running (`npm start`)
- Check that SSL certificates are valid
- Try clearing browser cache
- Make sure you're using HTTPS

### "API key invalid"
- Verify your OpenAI API key at https://platform.openai.com/api-keys
- Make sure the key starts with `sk-`
- Check that you have API credits available

### "Cannot insert into email"
- Insert only works in compose mode (when writing/replying)
- In reading mode, use "Copy" instead
- Try clicking "Reply" first, then using the add-in

### "CORS errors"
- The server includes CORS headers
- Make sure you're accessing via `https://localhost:3000`

## Security Notes

- API keys are stored in browser localStorage (per-device)
- Keys are never sent to any server except OpenAI
- For enterprise deployment, consider using Azure Key Vault
- The add-in only accesses the currently open email

## License

MIT License - Feel free to modify and distribute.

## Support

For issues or feature requests, please open an issue on GitHub.
