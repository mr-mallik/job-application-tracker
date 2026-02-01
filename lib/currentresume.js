// Generate a markdown resume from a user profile object
// Used as the default text in FullScreenDocumentEditor.jsx textarea when documentType is 'resume'
// Exports: getResumeMarkdown(userProfile)

function formatDate(date) {
	if (!date) return '';
	if (typeof date === 'string') return date;
	// Try to format as mm/yyyy
	const d = new Date(date);
	if (isNaN(d)) return '';
	return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getResumeMarkdown(profile = {}) {
	let md = '';

	// SUMMARY
	md += '# SUMMARY\n';
	if (profile.summary) {
		md += profile.summary + '\n\n';
	} else {
		md += 'Your professional summary...\n\n';
	}

    console.log('profile:', profile);

	// RELEVANT WORK EXPERIENCE
	md += '# RELEVANT WORK EXPERIENCE\n';
	if (Array.isArray(profile.experiences) && profile.experiences.length) {
		profile.experiences.forEach(exp => {
			const title = exp.title || 'Job Title';
			const company = exp.company || 'Company';
			const location = exp.location || '';
			const start = formatDate(exp.startDate);
			const end = exp.endDate ? formatDate(exp.endDate) : 'Present';
			md += `**${title} | ${company}${location ? ', ' + location : ''} | ${start} - ${end}**\n`;
			if (Array.isArray(exp.achievements) && exp.achievements.length) {
				exp.achievements.forEach(a => {
					if (a) md += `- ${a}\n`;
				});
			} else if (exp.description) {
				md += `- ${exp.description}\n`;
			} else {
				md += '- Achievement 1\n- Achievement 2\n';
			}
			md += '\n';
		});
	} else {
		md += '**Job Title | Company, Location | mm/yyyy - mm/yyyy**\n- Achievement 1\n- Achievement 2\n\n';
	}

	// EDUCATION
	md += '# EDUCATION\n';
    const educationItems = Array.isArray(profile.education)
        ? profile.education
        : profile.education && typeof profile.education === 'object'
            ? (
                    // If it's a single education object (has expected fields), wrap it.
                    (profile.education.degree ||
                    profile.education.institution ||
                    profile.education.startDate ||
                    profile.education.endDate ||
                    profile.education.location ||
                    profile.education.description)
                        ? [profile.education]
                        // Otherwise treat it as a map/object of entries.
                        : Object.values(profile.education)
                ).filter(Boolean)
            : [];

    if (educationItems.length) {
        educationItems.forEach(edu => {
            const degree = edu?.degree || 'Degree';
            const institution = edu?.institution || 'Institution';
            const location = edu?.location || '';
            const start = formatDate(edu?.startDate);
            const end = edu?.endDate ? formatDate(edu.endDate) : 'Present';
            md += `**${degree} | ${institution}${location ? ', ' + location : ''} | ${start} - ${end}**\n`;
            if (edu?.description) md += `- ${edu.description}\n`;
            md += '\n';
        });
    } else {
        md += '**Degree | Institution, Location | mm/yyyy - mm/yyyy**\n- Description\n\n';
    }

	// PROJECTS
	if (Array.isArray(profile.projects) && profile.projects.length) {
		md += '# PROJECTS\n';
		profile.projects.forEach(proj => {
			const name = proj.title || 'Project Name';
			const role = proj.role ? ` (${proj.role})` : '';
			md += `**${name}${role}**\n`;
			if (proj.description) md += `- ${proj.description}\n`;
			if (proj.technologies) md += `- Tech: ${proj.technologies}\n`;
			md += '\n';
		});
	}

	// SKILLS
	if (Array.isArray(profile.skills) && profile.skills.length) {
		md += '# SKILLS\n';
		md += profile.skills.map(s => `- ${s}`).join('\n') + '\n\n';
	}

	// CERTIFICATIONS
	if (Array.isArray(profile.certifications) && profile.certifications.length) {
		md += '# CERTIFICATIONS\n';
		profile.certifications.forEach(cert => {
			md += `- ${cert}\n`;
		});
		md += '\n';
	}

	// LANGUAGES
	if (Array.isArray(profile.languages) && profile.languages.length) {
		md += '# LANGUAGES\n';
		md += profile.languages.map(l => `- ${l}`).join('\n') + '\n\n';
	}

	// CONTACT (optional, usually in header, but for completeness)
	// Uncomment if you want to show contact at the end
	// if (profile.email || profile.phone || profile.linkedin || profile.portfolio) {
	//   md += '# CONTACT\n';
	//   if (profile.email) md += `- Email: ${profile.email}\n`;
	//   if (profile.phone) md += `- Phone: ${profile.phone}\n`;
	//   if (profile.linkedin) md += `- LinkedIn: ${profile.linkedin}\n`;
	//   if (profile.portfolio) md += `- Portfolio: ${profile.portfolio}\n`;
	//   md += '\n';
	// }

	return md.trim();
}

module.exports = { getResumeMarkdown };
