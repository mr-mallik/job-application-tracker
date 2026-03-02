#!/usr/bin/env node

/**
 * Update Contributors Script
 *
 * Automatically updates the Contributors section in README.md
 * based on git commit history.
 *
 * Usage: node scripts/update-contributors.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '..', 'README.md');
const START_MARKER = '<!-- ALL-CONTRIBUTORS-LIST:START -->';
const END_MARKER = '<!-- ALL-CONTRIBUTORS-LIST:END -->';

function getContributors() {
  try {
    // Get unique contributors from git log
    const output = execSync('git log --format="%aN|%aE|%aD" --all', { encoding: 'utf-8' });

    const contributorMap = new Map();

    output.split('\n').forEach((line) => {
      if (!line.trim()) return;

      const [name, email, date] = line.split('|');
      if (!name || !email) return;

      if (!contributorMap.has(email)) {
        contributorMap.set(email, {
          name: name.trim(),
          email: email.trim(),
          firstCommit: new Date(date),
          commits: 0,
        });
      }
      contributorMap.get(email).commits++;
    });

    // Sort by commit count (descending)
    return Array.from(contributorMap.values()).sort((a, b) => b.commits - a.commits);
  } catch (error) {
    console.error('Error fetching contributors:', error.message);
    return [];
  }
}

function generateContributorsBadges(contributors) {
  if (contributors.length === 0) {
    return 'No contributors found. Make your first commit!\n';
  }

  let markdown = `Thanks to these wonderful people who have contributed to this project:\n\n`;
  markdown += `<table>\n<tr>\n`;

  contributors.forEach((contributor, index) => {
    const emailHash = require('crypto')
      .createHash('md5')
      .update(contributor.email.toLowerCase().trim())
      .digest('hex');

    const avatar = `https://www.gravatar.com/avatar/${emailHash}?s=100&d=identicon`;

    markdown += `  <td align="center">
    <a href="mailto:${contributor.email}">
      <img src="${avatar}" width="80px;" alt="${contributor.name}"/><br />
      <sub><b>${contributor.name}</b></sub>
    </a><br />
    <sub>${contributor.commits} commit${contributor.commits !== 1 ? 's' : ''}</sub>
  </td>\n`;

    // New row every 5 contributors
    if ((index + 1) % 5 === 0 && index !== contributors.length - 1) {
      markdown += `</tr>\n<tr>\n`;
    }
  });

  markdown += `</tr>\n</table>\n`;
  return markdown;
}

function updateReadme() {
  try {
    // Read current README
    let readme = fs.readFileSync(README_PATH, 'utf-8');

    // Find marker positions
    const startIndex = readme.indexOf(START_MARKER);
    const endIndex = readme.indexOf(END_MARKER);

    if (startIndex === -1 || endIndex === -1) {
      console.error('ERROR: Could not find contributor markers in README.md');
      console.error('Make sure both markers exist:');
      console.error('  <!-- ALL-CONTRIBUTORS-LIST:START -->');
      console.error('  <!-- ALL-CONTRIBUTORS-LIST:END -->');
      process.exit(1);
    }

    // Get contributors and generate markdown
    const contributors = getContributors();
    console.log(`Found ${contributors.length} contributor(s)`);

    const contributorSection = generateContributorsBadges(contributors);

    // Update README content
    const before = readme.substring(0, startIndex + START_MARKER.length);
    const after = readme.substring(endIndex);
    const newReadme = `${before}\n${contributorSection}${after}`;

    // Write updated README
    fs.writeFileSync(README_PATH, newReadme, 'utf-8');
    console.log('✅ README.md updated successfully!');

    // Display contributors
    contributors.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} (${c.email}) - ${c.commits} commit(s)`);
    });
  } catch (error) {
    console.error('Error updating README:', error.message);
    process.exit(1);
  }
}

// Run the script
updateReadme();
