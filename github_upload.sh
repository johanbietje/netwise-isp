#!/bin/bash

# Simple script to upload to GitHub
# Usage: ./github_upload.sh <username> <repo_name> <token>

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <github_username> <repo_name> <github_token>"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME=$2
GITHUB_TOKEN=$3

echo "Initializing git repository if needed..."
if [ ! -d .git ]; then
    git init
    echo "Git repository initialized."
else
    echo "Git repository already exists."
fi

echo "Adding all files to git..."
git add --all

echo "Creating commit..."
git commit -m "Initial commit: Netwise ISP Management System"

echo "Creating GitHub repository: $REPO_NAME..."
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d "{\"name\":\"$REPO_NAME\",\"private\":true,\"description\":\"Netwise ISP Management System - Comprehensive telecommunications and ISP management solution\"}"

echo "Adding remote origin..."
git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo ""
echo "Repository uploaded to GitHub successfully!"
echo "Your repository is available at: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo ""

exit 0