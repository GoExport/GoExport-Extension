# GitHub Actions Setup for CRX Releases

This document explains how to set up the GitHub Actions workflow to automatically build and release CRX files for the GoExport Chrome Extension.

## Prerequisites

Before the workflow can run successfully, you need to generate a private key and add it to your GitHub repository secrets.

## Step 1: Generate a Private Key

You need to generate a private RSA key that will be used to sign the CRX file. This ensures your extension has a consistent extension ID.

### On Linux/macOS:

```bash
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out private-key.pem
```

### On Windows (PowerShell):

If you have OpenSSL installed:

```powershell
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out private-key.pem
```

If you don't have OpenSSL, you can:

1. Install via Chocolatey: `choco install openssl`
2. Or use Git Bash (if Git is installed): Open Git Bash and run the Linux command above
3. Or use WSL (Windows Subsystem for Linux)

## Step 2: Add Private Key to GitHub Secrets

1. Open your private key file (`private-key.pem`) in a text editor
2. Copy the entire contents (including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines)
3. Go to your GitHub repository
4. Navigate to **Settings** → **Secrets and variables** → **Actions**
5. Click **New repository secret**
6. Name: `CRX_PRIVATE_KEY`
7. Value: Paste the entire contents of your private key file
8. Click **Add secret**

**IMPORTANT:**

- Keep your `private-key.pem` file secure and do NOT commit it to your repository
- Add `*.pem` to your `.gitignore` file to prevent accidental commits
- Store a backup of this key file securely - you'll need the same key for future releases to maintain the same extension ID

## Step 3: Create a Release

The workflow will automatically trigger when you:

### Option A: Push a Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Option B: Create a Release via GitHub UI

1. Go to your repository on GitHub
2. Click **Releases** → **Draft a new release**
3. Click **Choose a tag** and create a new tag (e.g., `v1.0.0`)
4. Fill in the release title and description
5. Click **Publish release**

## Workflow Details

The workflow will:

1. Checkout your code
2. Install the `crx3` Node.js package for building CRX files
3. Use your private key to sign the extension
4. Build the CRX file compatible with Chrome 87
5. Create a ZIP archive for manual installation
6. Generate SHA256 checksums for verification
7. Upload all files to the GitHub release

## What Gets Released

Each release will include:

- **GoExport-Extension-vX.X.X.crx**: The packaged extension file
- **GoExport-Extension-vX.X.X.zip**: A ZIP archive for manual "Load unpacked" installation
- **checksums.txt**: SHA256 checksums for file verification

## Chrome 87 Compatibility

The CRX file is built using the CRX3 format, which is compatible with Chrome 87 and newer versions. Since this is a Manifest V2 extension, it will work with older Chrome versions that still support Manifest V2.

## Troubleshooting

### Error: "secrets.CRX_PRIVATE_KEY is empty"

- Make sure you've added the `CRX_PRIVATE_KEY` secret to your repository as described in Step 2

### Error: "Invalid private key format"

- Ensure you copied the entire private key including the BEGIN and END lines
- Make sure there are no extra spaces or line breaks

### CRX file won't install

- Make sure you're using Chrome 87 or later
- Enable "Developer mode" in `chrome://extensions/`
- Try using the ZIP file with "Load unpacked" instead

## Security Notes

- Never commit your private key file to the repository
- Never share your private key publicly
- The private key in GitHub Secrets is encrypted and only accessible to workflow runs
- GitHub Actions will automatically clean up temporary files (including the private key) after the workflow completes
