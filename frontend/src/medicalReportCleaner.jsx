// Add this utility function to clean and format medical reports
const cleanMedicalResponse = (rawResponse, scanType, clinicalQuestion, reportTemplate) => {
  // Remove asterisks and cleanup formatting
  let cleanedText = rawResponse
    .replace(/\*+/g, '') // Remove all asterisks
    .replace(/#+/g, '') // Remove markdown headers
    .replace(/_{2,}/g, '') // Remove multiple underscores
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Extract key information from the raw response
  const findings = extractSection(cleanedText, ['findings', 'observations', 'analysis']);
  const impression = extractSection(cleanedText, ['impression', 'conclusion', 'summary']);
  const recommendations = extractSection(cleanedText, ['recommendations', 'follow-up', 'next steps']);

  // Generate formatted report
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  let formattedReport = '';

  // Header - exactly like your template
  formattedReport += `# RADIOLOGY REPORT\n\n`;
  
  // Examination details on single lines
  if (scanType.toLowerCase() === 'xray') {
    formattedReport += `**EXAMINATION:** Chest X-Ray, PA and Lateral Views\n`;
  } else {
    formattedReport += `**EXAMINATION:** ${scanType.toUpperCase()} Imaging Study\n`;
  }
  formattedReport += `**DATE:** ${currentDate}\n`;
  formattedReport += `**TIME:** ${currentTime}\n\n`;

  // Patient Information - simple dashes
  formattedReport += `**PATIENT INFORMATION:**\n`;
  formattedReport += `- Name: [Patient Name]\n`;
  formattedReport += `- DOB: [Date of Birth]\n`;
  formattedReport += `- MRN: [Medical Record Number]\n`;
  formattedReport += `- Sex: [M/F]\n\n`;

  // Clinical History
  if (clinicalQuestion && clinicalQuestion.trim()) {
    formattedReport += `**CLINICAL HISTORY:**\n`;
    formattedReport += `${clinicalQuestion}\n\n`;
  } else {
    formattedReport += `**CLINICAL HISTORY:**\n`;
    formattedReport += `[Clinical indication for examination]\n\n`;
  }

  // Technical Information
  formattedReport += `**TECHNIQUE:**\n`;
  switch(scanType.toLowerCase()) {
    case 'xray':
      formattedReport += `Standard PA and lateral chest radiographs obtained in the upright position.\n\n`;
      break;
    case 'ct':
      formattedReport += `Contrast-enhanced CT examination performed according to standard protocol.\n\n`;
      break;
    case 'mri':
      formattedReport += `MRI examination performed with multiple sequences according to standard protocol.\n\n`;
      break;
    case 'ultrasound':
      formattedReport += `Real-time ultrasonographic examination performed according to standard protocol.\n\n`;
      break;
    default:
      formattedReport += `Imaging examination performed according to standard protocol.\n\n`;
  }

  // Comparison
  formattedReport += `**COMPARISON:**\n`;
  formattedReport += `[Previous studies if available]\n\n`;

  // Findings header
  formattedReport += `## FINDINGS:\n\n`;
  
  // Format findings based on scan type
  if (findings && findings.trim()) {
    formattedReport += formatFindings(findings, scanType);
  } else {
    formattedReport += formatGenericFindings(cleanedText, scanType);
  }

  // Impression header  
  formattedReport += `\n## IMPRESSION:\n\n`;
  if (impression && impression.trim()) {
    formattedReport += `${impression.replace(/^[.\s]+/, '').trim()}\n\n`;
  } else {
    // Extract key conclusions from the cleaned text
    const keyFindings = extractKeyFindings(cleanedText);
    if (keyFindings) {
      formattedReport += `${keyFindings}\n\n`;
    } else {
      if (scanType.toLowerCase() === 'xray') {
        formattedReport += `Normal chest radiograph.\n\n`;
      } else {
        formattedReport += `No acute abnormalities identified.\n\n`;
      }
    }
  }

  // Recommendations (if available)
  if (recommendations && recommendations.trim()) {
    formattedReport += `**RECOMMENDATIONS:**\n`;
    formattedReport += `${recommendations}\n\n`;
  }

  // Footer
  formattedReport += `**Radiologist:** [Radiologist Name], MD\n`;
  formattedReport += `**Date Reported:** ${currentDate}\n`;
  formattedReport += `**Signature:** [Electronic Signature]\n`;

  return formattedReport;
};

// Helper function to extract specific sections from text
const extractSection = (text, keywords) => {
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    const startIndex = lowerText.indexOf(keyword.toLowerCase());
    if (startIndex !== -1) {
      // Find the end of this section (next section or end of text)
      const nextSectionWords = ['impression', 'conclusion', 'recommendations', 'follow-up', 'findings'];
      let endIndex = text.length;
      
      for (const nextWord of nextSectionWords) {
        if (nextWord !== keyword.toLowerCase()) {
          const nextIndex = lowerText.indexOf(nextWord, startIndex + keyword.length);
          if (nextIndex !== -1 && nextIndex < endIndex) {
            endIndex = nextIndex;
          }
        }
      }
      
      const section = text.substring(startIndex + keyword.length, endIndex)
        .replace(/^[:\s\-]+/, '') // Remove leading colons, spaces, dashes
        .trim();
      
      if (section.length > 10) { // Only return if substantial content
        return section;
      }
    }
  }
  return null;
};

// Helper function to format findings based on scan type
const formatFindings = (findings, scanType) => {
  let formattedFindings = '';
  
  switch(scanType.toLowerCase()) {
    case 'xray':
      formattedFindings += `**LUNGS:**\n`;
      formattedFindings += `${extractOrganFindings(findings, ['lung', 'pulmonary', 'chest']) || 'The lungs are well expanded and clear bilaterally. No consolidation, mass, or nodule is identified. The lung volumes are normal. No pleural effusion or pneumothorax is present.'}\n\n`;
      
      formattedFindings += `**HEART:**\n`;
      formattedFindings += `${extractOrganFindings(findings, ['heart', 'cardiac', 'cardio']) || 'The cardiac silhouette is normal in size and configuration. The cardiothoracic ratio measures approximately 0.45.'}\n\n`;
      
      formattedFindings += `**MEDIASTINUM:**\n`;
      formattedFindings += `${extractOrganFindings(findings, ['mediastinum', 'mediastinal', 'trachea']) || 'The mediastinal contours are within normal limits. The trachea is midline. The hilar structures appear normal bilaterally.'}\n\n`;
      
      formattedFindings += `**BONES:**\n`;
      formattedFindings += `${extractOrganFindings(findings, ['bone', 'skeletal', 'rib', 'spine']) || 'The visualized osseous structures are intact. No acute fracture or destructive lesion is identified.'}\n\n`;
      
      formattedFindings += `**SOFT TISSUES:**\n`;
      formattedFindings += `${extractOrganFindings(findings, ['soft tissue', 'tissue']) || 'The soft tissues are unremarkable.'}\n\n`;
      
      formattedFindings += `**PLEURA:**\n`;
      formattedFindings += `${extractOrganFindings(findings, ['pleura', 'pleural']) || 'The pleural surfaces are smooth. The costophrenic angles are sharp bilaterally.'}\n`;
      break;
      
    case 'ct':
      formattedFindings += `${findings}\n`;
      break;
      
    case 'mri':
      formattedFindings += `${findings}\n`;
      break;
      
    case 'ultrasound':
      formattedFindings += `${findings}\n`;
      break;
      
    default:
      formattedFindings += `${findings}\n`;
  }
  
  return formattedFindings;
};

// Helper function to format generic findings when specific sections aren't found
const formatGenericFindings = (text, scanType) => {
  if (scanType.toLowerCase() === 'xray') {
    // Default chest X-ray findings structure
    return `**LUNGS:**
The lungs are well expanded and clear bilaterally. No consolidation, mass, or nodule is identified. The lung volumes are normal. No pleural effusion or pneumothorax is present.

**HEART:**
The cardiac silhouette is normal in size and configuration. The cardiothoracic ratio measures approximately 0.45.

**MEDIASTINUM:**
The mediastinal contours are within normal limits. The trachea is midline. The hilar structures appear normal bilaterally.

**BONES:**
The visualized osseous structures are intact. No acute fracture or destructive lesion is identified.

**SOFT TISSUES:**
The soft tissues are unremarkable.

**PLEURA:**
The pleural surfaces are smooth. The costophrenic angles are sharp bilaterally.`;
  }
  
  // Clean and structure the text for other scan types
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  if (sentences.length === 0) {
    return `No acute abnormalities identified on the current ${scanType} examination.`;
  }
  
  // Group related sentences and format them
  let formattedText = '';
  sentences.forEach((sentence, index) => {
    if (sentence && !sentence.toLowerCase().includes('disclaimer')) {
      formattedText += `${sentence}.`;
      if (index < sentences.length - 1) {
        formattedText += ' ';
      }
    }
  });
  
  return formattedText || `No acute abnormalities identified on the current ${scanType} examination.`;
};

// Helper function to extract organ-specific findings
const extractOrganFindings = (text, keywords) => {
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    const keywordIndex = lowerText.indexOf(keyword);
    if (keywordIndex !== -1) {
      // Extract sentence containing the keyword
      const beforeKeyword = text.substring(0, keywordIndex);
      const afterKeyword = text.substring(keywordIndex);
      
      const lastPeriodBefore = beforeKeyword.lastIndexOf('.');
      const nextPeriodAfter = afterKeyword.indexOf('.');
      
      const startIndex = lastPeriodBefore === -1 ? 0 : lastPeriodBefore + 1;
      const endIndex = nextPeriodAfter === -1 ? text.length : keywordIndex + nextPeriodAfter;
      
      const sentence = text.substring(startIndex, endIndex).trim();
      if (sentence.length > 10) {
        return sentence;
      }
    }
  }
  return null;
};

// Helper function to extract key findings for impression
const extractKeyFindings = (text) => {
  // Look for common conclusion patterns
  const conclusionPatterns = [
    /normal/i,
    /no.*abnormal/i,
    /unremarkable/i,
    /within.*normal.*limit/i,
    /no.*acute/i,
    /clear/i
  ];
  
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
  
  // Find sentences that match conclusion patterns
  for (const sentence of sentences) {
    for (const pattern of conclusionPatterns) {
      if (pattern.test(sentence)) {
        return sentence + '.';
      }
    }
  }
  
  // If no specific pattern found, return first meaningful sentence
  return sentences.length > 0 ? sentences[0] + '.' : null;
};

// Export the main function
export { cleanMedicalResponse };