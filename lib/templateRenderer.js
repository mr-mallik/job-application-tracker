/**
 * Template Renderer - Converts HTML templates to data-driven resumes
 * Loads actual template files and injects user data
 */

/**
 * Render template with user data
 * @param {string} templateId - Template identifier (harvard, 2columns)
 * @param {Object} blocks - Structured resume data
 * @returns {string} - Rendered HTML
 */
export function renderTemplate(templateId, blocks) {
  if (templateId === '2columns') {
    return render2ColumnsTemplate(blocks)
  }
  
  // Default to harvard
  return renderHarvardTemplate(blocks)
}

/**
 * Harvard template renderer
 */
function renderHarvardTemplate(data) {
  return `
    <div class="resume-template harvard" style="font-family: Arial, sans-serif; padding: 40px 60px; line-height: 1.5;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-family: Georgia, serif; font-size: 32px; margin: 0;">${data.name || ''}</h1>
        <div style="font-size: 14px; color: #555; margin: 4px 0;">${data.subtitle || ''}</div>
        <div style="font-size: 13px; color: #555;">
          ${[data.email, data.linkedin ? 'LinkedIn' : '', data.phone, data.location].filter(Boolean).join(' • ')}
        </div>
      </div>

      ${data.summary ? `
      <div style="margin-top: 30px;">
        <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Summary</h2>
        <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
        <p style="font-size: 14px; text-align: justify;">${data.summary}</p>
      </div>
      ` : ''}

      ${data.experiences && data.experiences.length > 0 ? `
      <div style="margin-top: 30px;">
        <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Experience</h2>
        <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
        ${data.experiences.map(exp => `
          <div style="margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 15px;">
              <span>${exp.company || ''}</span>
              <span>${exp.location || ''}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
              <span>${exp.title || ''}</span>
              <span>${exp.startDate || ''} – ${exp.endDate || ''}</span>
            </div>
            <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 14px;">
              ${exp.achievements ? exp.achievements.split('\n').filter(a => a.trim() && !a.trim().startsWith('#')).map(achievement => 
                `<li style="margin-bottom: 6px;">${achievement.trim().replace(/^[-•*]\s*/, '')}</li>`
              ).join('') : ''}
            </ul>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.education && data.education.length > 0 ? `
      <div style="margin-top: 30px;">
        <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Education</h2>
        <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
        ${data.education.map(edu => `
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
            <span><strong>${edu.institution || ''}</strong> — ${edu.degree || ''}${edu.grade ? ` (${edu.grade})` : ''}</span>
            <span>${edu.startDate || ''} – ${edu.endDate || ''}</span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${(data.skills && (data.skills.technical || data.skills.relevant || data.skills.other)) ? `
      <div style="margin-top: 30px;">
        <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Skills</h2>
        <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
        <div style="font-size: 14px;">
          ${[data.skills.technical, data.skills.relevant, data.skills.other].filter(Boolean).join(' · ')}
        </div>
      </div>
      ` : ''}

      ${data.courses && data.courses.length > 0 ? `
      <div style="margin-top: 30px;">
        <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Training / Courses</h2>
        <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
        <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 14px;">
          ${data.courses.map(course => `
            <li style="margin-bottom: 6px;"><strong>${course.title}</strong> — ${course.provider || 'Online'}</li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      ${data.achievements && data.achievements.length > 0 ? `
      <div style="margin-top: 30px;">
        <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Key Achievements</h2>
        <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
        <div style="display: flex; gap: 20px; font-size: 14px;">
          ${data.achievements.slice(0, 3).map(achievement => `
            <div style="flex: 1;">
              <strong>${achievement.title || ''}</strong><br>
              ${achievement.description || ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `
}

/**
 * Two Columns template renderer
 */
function render2ColumnsTemplate(data) {
  return `
    <div class="resume-template 2columns" style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.45; color: #2b2b2b;">
      <h1 style="font-size: 34px; margin: 0; color: #0a3ea1; letter-spacing: 1px;">${(data.name || '').toUpperCase()}</h1>
      <div style="font-size: 15px; color: #3d7eff; margin: 6px 0 10px 0;">${data.subtitle || ''}</div>
      <div style="font-size: 13px; color: #666; margin-bottom: 20px;">
        ${[data.email, data.linkedin ? 'LinkedIn' : '', data.phone, data.location].filter(Boolean).join(' • ')}
      </div>
      
      <div style="display: flex; gap: 40px;">
        <!-- LEFT COLUMN -->
        <div style="width: 32%;">
          ${data.achievements && data.achievements.length > 0 ? `
          <div style="font-size: 14px; letter-spacing: 1px; color: #666; margin: 30px 0 6px;">KEY ACHIEVEMENTS</div>
          <div style="border-bottom: 2px solid #bfc6d1; margin-bottom: 14px;"></div>
          ${data.achievements.slice(0, 4).map((achievement, idx) => {
            const icons = ['$', '⚙', '★', '👥']
            return `
            <div style="display: flex; gap: 12px; margin-bottom: 18px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: #eef3ff; display: flex; align-items: center; justify-content: center; color: #3d7eff; font-weight: bold; flex-shrink: 0;">${icons[idx] || '✓'}</div>
              <div>
                <h4 style="margin: 0; font-size: 14px; color: #0a3ea1;">${achievement.title || ''}</h4>
                <p style="margin: 4px 0 0; font-size: 13px; color: #555;">${achievement.description || ''}</p>
              </div>
            </div>
            `}).join('')}
          ` : ''}
          
          ${(data.skills && (data.skills.technical || data.skills.relevant || data.skills.other)) ? `
          <div style="font-size: 14px; letter-spacing: 1px; color: #666; margin: 30px 0 6px;">SKILLS</div>
          <div style="border-bottom: 2px solid #bfc6d1; margin-bottom: 14px;"></div>
          <div>
            ${[data.skills.technical, data.skills.relevant, data.skills.other]
              .filter(Boolean)
              .join(', ')
              .split(',')
              .map(skill => `<span style="display: inline-block; font-size: 13px; color: #0a3ea1; margin: 6px 0; border-bottom: 1px solid #cfd7e6; padding-bottom: 2px; width: 100%;">${skill.trim()}</span>`)
              .join('\n            ')}
          </div>
          ` : ''}
          
          ${data.courses && data.courses.length > 0 ? `
          <div style="font-size: 14px; letter-spacing: 1px; color: #666; margin: 30px 0 6px;">TRAINING / COURSES</div>
          <div style="border-bottom: 2px solid #bfc6d1; margin-bottom: 14px;"></div>
          ${data.courses.map(course => `
          <p style="font-size: 13px; margin: 0 0 12px 0;">
            <strong style="color: #3d7eff;">${course.title}</strong><br>
            ${course.provider || 'Online'}
          </p>
          `).join('')}
          ` : ''}
        </div>
        
        <!-- RIGHT COLUMN -->
        <div style="width: 68%;">
          ${data.summary ? `
          <div style="font-size: 14px; letter-spacing: 1px; color: #666; margin: 30px 0 6px;">SUMMARY</div>
          <div style="border-bottom: 2px solid #bfc6d1; margin-bottom: 14px;"></div>
          <div style="font-size: 14px; color: #444;">${data.summary}</div>
          ` : ''}
          
          ${data.experiences && data.experiences.length > 0 ? `
          <div style="font-size: 14px; letter-spacing: 1px; color: #666; margin: 30px 0 6px;">EXPERIENCE</div>
          <div style="border-bottom: 2px solid #bfc6d1; margin-bottom: 14px;"></div>
          ${data.experiences.map(exp => `
          <div style="margin-bottom: 22px;">
            <h3 style="margin: 0; font-size: 16px; color: #0a3ea1;">${exp.title || ''}</h3>
            <div style="font-size: 14px; color: #3d7eff; margin-bottom: 4px;">${exp.company || ''}</div>
            <div style="font-size: 12px; color: #777; margin-bottom: 6px;">${exp.startDate || ''} – ${exp.endDate || ''} | ${exp.location || ''}</div>
            <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 14px;">
              ${exp.achievements ? exp.achievements.split('\n').filter(a => a.trim() && !a.startsWith('#')).map(achievement => 
                `<li style="margin-bottom: 6px;">${achievement.trim().replace(/^[-•*]\s*/, '')}</li>`
              ).join('') : ''}
            </ul>
          </div>
          `).join('')}
          ` : ''}
          
          ${data.education && data.education.length > 0 ? `
          <div style="font-size: 14px; letter-spacing: 1px; color: #666; margin: 30px 0 6px;">EDUCATION</div>
          <div style="border-bottom: 2px solid #bfc6d1; margin-bottom: 14px;"></div>
          ${data.education.map(edu => `
          <div style="font-size: 14px; margin-bottom: 12px;">
            <strong>${edu.degree || ''}</strong>${edu.grade ? ` (${edu.grade})` : ''}<br>
            ${edu.institution || ''} (${edu.startDate || ''} – ${edu.endDate || ''})
          </div>
          `).join('')}
          ` : ''}
        </div>
      </div>
    </div>
  `
}
