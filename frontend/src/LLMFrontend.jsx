import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Settings, Activity, RefreshCw,
  AlertCircle, CheckCircle, Server, Menu, X,
  Bot, Clock, Upload, FileText, Image as ImageIcon,
  Stethoscope, Download, AlertTriangle, Sliders
} from 'lucide-react';

const LLMFrontend = () => {
  const [serverUrl, setServerUrl] = useState('http://192.168.31.116:8000');
  const [modelList, setModelList] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Medical imaging specific states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [medicalMode, setMedicalMode] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState('xray');
  const [clinicalQuestion, setClinicalQuestion] = useState('');
  const [reportTemplate, setReportTemplate] = useState('comprehensive');
 
  // Advanced medical prompting states
  const [useStructuredPrompting, setUseStructuredPrompting] = useState(true);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper function for file size formatting
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced medical prompt generation function
  const generateEnhancedMedicalPrompt = (selectedModel, medicalMode, selectedScanType, reportTemplate, clinicalQuestion, uploadedFiles, additionalInstructions) => {
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

    // Base system prompt for medical AI
    let systemPrompt = `You are a specialized radiology AI assistant trained to analyze medical images and generate professional radiology reports. You must follow strict medical reporting standards and provide structured, clinically relevant observations.

CRITICAL INSTRUCTIONS:
- Generate reports in standard radiology format
- Use professional medical terminology
- Be precise and objective in your observations
- Include all standard sections for the exam type
- Never make definitive diagnoses without proper clinical context
- Always recommend correlation with clinical findings when appropriate
- only report no other sentence
- the title should be shown once
- remove all the asterisk if present

`;

    // Scan-specific prompting
    const scanSpecificPrompts = {
      xray: {
        sections: ['LUNGS', 'HEART', 'MEDIASTINUM', 'BONES', 'SOFT TISSUES', 'PLEURA'],
        technique: 'Standard PA and lateral chest radiographs obtained in the upright position.',
      },
      ct: {
        sections: ['TECHNIQUE', 'FINDINGS', 'CONTRAST', 'ORGANS'],
        technique: 'Contrast-enhanced CT examination performed according to standard protocol.',
      },
      mri: {
        sections: ['TECHNIQUE', 'SEQUENCES', 'FINDINGS', 'SIGNAL_CHARACTERISTICS'],
        technique: 'MRI examination performed with multiple sequences according to standard protocol.',
      },
      ultrasound: {
        sections: ['TECHNIQUE', 'FINDINGS', 'MEASUREMENTS', 'DOPPLER'],
        technique: 'Real-time ultrasonographic examination performed according to standard protocol.',
      }
    };

    const scanConfig = scanSpecificPrompts[selectedScanType.toLowerCase()] || scanSpecificPrompts.xray;

    // Template-specific instructions
    const templateInstructions = {
      comprehensive: `Generate a complete, detailed radiology report with all standard sections. Include:
- Complete systematic evaluation of all anatomical structures
- Detailed findings for each organ system
- Comprehensive impression with differential considerations
- Specific recommendations for follow-up if indicated`,
     
      focused: `Generate a focused report emphasizing:
- Key pathological findings and their significance
- Clinical relevance of abnormal observations
- Targeted impression addressing the clinical question
- Specific actionable recommendations`,
     
      comparison: `Generate a comparison report that:
- Systematically compares current findings with prior studies
- Highlights interval changes (improved, stable, worse)
- Documents progression or resolution of findings
- Provides timeline-based recommendations`,
     
      emergency: `Generate an urgent radiology report focusing on:
- Life-threatening conditions requiring immediate attention
- Critical findings that need emergent intervention
- Clear, direct language for urgent communication
- Immediate actionable recommendations for clinical team`
    };

    // Build the structured prompt
    let structuredPrompt = systemPrompt;
   
    structuredPrompt += `EXAMINATION TYPE: ${selectedScanType.toUpperCase()}\n`;
    structuredPrompt += `REPORT TEMPLATE: ${reportTemplate.toUpperCase()}\n`;
    structuredPrompt += `DATE: ${currentDate}\n`;
    structuredPrompt += `TIME: ${currentTime}\n\n`;

    // Add clinical context
    if (clinicalQuestion && clinicalQuestion.trim()) {
      structuredPrompt += `CLINICAL QUESTION: ${clinicalQuestion}\n\n`;
    }

    // Add template-specific instructions
    structuredPrompt += `REPORT REQUIREMENTS:\n${templateInstructions[reportTemplate]}\n\n`;

    // Add scan-specific guidance
    if (selectedScanType.toLowerCase() === 'xray') {
      structuredPrompt += `SYSTEMATIC EVALUATION REQUIRED FOR:\n`;
      scanConfig.sections.forEach(section => {
        structuredPrompt += `- ${section}\n`;
      });
      structuredPrompt += `\n`;
    }

    // File information
    if (uploadedFiles && uploadedFiles.length > 0) {
      structuredPrompt += `UPLOADED FILES FOR ANALYSIS:\n`;
      uploadedFiles.forEach((file, index) => {
        structuredPrompt += `${index + 1}. ${file.name} (${formatFileSize(file.size)})\n`;
      });
      structuredPrompt += `\n`;
    }

    // Additional instructions
    if (additionalInstructions && additionalInstructions.trim()) {
      structuredPrompt += `ADDITIONAL INSTRUCTIONS:\n${additionalInstructions}\n\n`;
    }

    // Output format specification
    structuredPrompt += `OUTPUT FORMAT REQUIRED:
Generate a professional radiology report with the following exact structure:

RADIOLOGY REPORT

EXAMINATION: ${selectedScanType.toUpperCase()} examination
DATE: ${currentDate}
TIME: ${currentTime}

PATIENT INFORMATION:
- Name: [Patient Name]
- DOB: [Date of Birth]
- MRN: [Medical Record Number]
- Sex: [M/F]

CLINICAL HISTORY:
${clinicalQuestion || '[Clinical indication for examination]'}

TECHNIQUE:
${scanConfig.technique}

COMPARISON:
[Previous studies if available]

FINDINGS:

[Provide systematic, detailed findings organized by anatomical structures. For chest X-rays, use organ system headers like LUNGS:, HEART:, etc.]

IMPRESSION:

[Provide a concise summary of key findings and their clinical significance]

RECOMMENDATIONS:
[Include specific follow-up recommendations if indicated]

Radiologist: [Radiologist Name], MD
Date Reported: ${currentDate}
Signature: [Electronic Signature]

CRITICAL:
- Use this exact format structure
- Fill in all sections with appropriate medical content based on image analysis
- Use professional medical terminology
- Be specific and objective in observations
- Include normal findings to document complete evaluation
- Provide clinically relevant impression and recommendations
- remove asterisk if present `;

    return structuredPrompt;
  };

  // Post-processing function to ensure proper formatting
  const ensureReportFormat = (response) => {
    let formatted = response;
   
    // Ensure headers are properly formatted
    if (!formatted.includes('RADIOLOGY REPORT')) {
      formatted = 'RADIOLOGY REPORT\n\n' + formatted;
    }
   
    // Ensure proper section headers
    const sectionHeaders = ['FINDINGS:', 'IMPRESSION:'];
    sectionHeaders.forEach(header => {
      if (formatted.includes(header.replace('## ', '').replace(':', ''))) {
        formatted = formatted.replace(
          new RegExp(header.replace('## ', '').replace(':', ''), 'gi'),
          header
        );
      }
    });
   
    return formatted;
  };

  // Enhanced medical templates with more detailed instructions
  const medicalTemplates = {
    comprehensive: {
      name: 'Comprehensive Report',
      description: 'Complete systematic evaluation with detailed findings for all anatomical structures',
      focus: 'thorough documentation of all findings'
    },
    focused: {
      name: 'Focused Analysis',
      description: 'Targeted analysis emphasizing key pathological findings and clinical significance',
      focus: 'specific abnormalities and their clinical relevance'
    },
    comparison: {
      name: 'Comparison Study',
      description: 'Systematic comparison with prior studies highlighting interval changes',
      focus: 'progression, stability, or improvement of findings'
    },
    emergency: {
      name: 'Emergency Assessment',
      description: 'Urgent evaluation focusing on life-threatening conditions requiring immediate attention',
      focus: 'critical findings needing emergent intervention'
    }
  };

  // Enhanced sample clinical questions
  const sampleQuestions = {
    xray: [
      'Are there any signs of pneumonia, consolidation, or lung infection?',
      'Is there evidence of bone fractures or skeletal abnormalities?',
      'Are the heart size and cardiothoracic ratio within normal limits?',
      'Any signs of pneumothorax, pleural effusion, or lung collapse?',
      'Evaluate for signs of congestive heart failure or pulmonary edema',
      'Assess for foreign bodies or medical devices'
    ],
    mri: [
      'Are there any brain lesions, tumors, or space-occupying masses?',
      'What are the findings regarding white matter signal changes?',
      'Is there evidence of acute stroke, hemorrhage, or ischemia?',
      'Any signs of inflammation, infection, or demyelinating disease?',
      'Evaluate ventricular size and any signs of hydrocephalus',
      'Assess for structural abnormalities or developmental variants'
    ],
    ct: [
      'Are there signs of internal bleeding or active hemorrhage?',
      'What is the extent and pattern of trauma-related injuries?',
      'Any evidence of organ damage, laceration, or contusion?',
      'Are there signs of infection, abscess, or inflammatory changes?',
      'Evaluate for bowel obstruction or perforation',
      'Assess vascular structures for aneurysm or dissection'
    ],
    ultrasound: [
      'Are there any abnormal masses, cysts, or lesions identified?',
      'Is the organ structure, size, and echogenicity within normal limits?',
      'Any signs of fluid accumulation or inflammatory changes?',
      'What are the measurements and dimensions of relevant structures?',
      'Evaluate blood flow patterns and vascular patency',
      'Assess for gallstones, kidney stones, or other calcifications'
    ]
  };

  // Connection and model fetching functions
  const checkConnection = async () => {
    try {
      const response = await fetch(`${serverUrl}/health`);
      setConnectionStatus(response.ok ? 'connected' : 'error');
      setError(response.ok ? '' : 'Server responded with error');
    } catch (err) {
      setConnectionStatus('error');
      setError(`Unable to connect to server: ${err.message}`);
    }
  };

  const fetchModelsWithKeys = async () => {
    try {
      const modelData = [
        {
          id: 1,
          name: 'llama3',
          displayName:'Llama3',
          apiKey: 'in93dj39e39d39ei39ei3e3fle9de9die9',
          type: 'general',
          description: 'General purpose language model',
        },
        {
          id: 2,
          name: 'alibayram/medgemma',
          displayName:'MedGemma',
          apiKey: 'am94fdnnai93mfvhsm0wmdncj',
          type: 'medical',
          description: 'Specialized medical AI for radiology and clinical analysis',
        },
      ];

      setModelList(modelData);
      if (modelData.length > 0 && !selectedModel) {
        setSelectedModel(modelData[0]);
      }
      setError('');
    } catch (err) {
      setError(`Failed to fetch models: ${err.message}`);
    }
  };

  // File handling functions
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    setError('');

    try {
      const newFiles = await Promise.all(
        files.map(async (file) => {
          const validTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/tiff',
            'application/pdf',
          ];
         
          if (file.type && !validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dcm')) {
            throw new Error(
              `Invalid file type: ${file.type}. Please upload JPEG, PNG, TIFF, DICOM, or PDF files.`
            );
          }
         
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(
              `File ${file.name} is too large. Please upload files smaller than 10MB.`
            );
          }

          let base64Data = null;
          try {
            base64Data = await fileToBase64(file);
          } catch (err) {
            console.warn('Could not convert file to base64:', err);
          }

          return {
            id: Date.now() + Math.random(),
            file,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            uploadDate: new Date().toISOString(),
            base64Data,
          };
        })
      );

      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Enhanced medical prompt generation using the new system
  const generateMedicalPrompt = () => {
    if (selectedModel?.name === 'alibayram/medgemma' && medicalMode && useStructuredPrompting) {
      return generateEnhancedMedicalPrompt(
        selectedModel,
        medicalMode,
        selectedScanType,
        reportTemplate,
        clinicalQuestion,
        uploadedFiles,
        prompt
      );
    } else if (medicalMode) {
      // Fallback to simpler medical prompt structure
      let medicalPrompt = `Medical Imaging Analysis Request:\n\n`;
      medicalPrompt += `Scan Type: ${selectedScanType.toUpperCase()}\n`;
      medicalPrompt += `Report Template: ${reportTemplate}\n\n`;

      if (clinicalQuestion.trim()) {
        medicalPrompt += `Clinical Question: ${clinicalQuestion}\n\n`;
      }

      if (uploadedFiles.length > 0) {
        medicalPrompt += `Number of uploaded files: ${uploadedFiles.length}\n`;
        uploadedFiles.forEach((file, index) => {
          medicalPrompt += `File ${index + 1}: ${file.name} (${formatFileSize(file.size)})\n`;
        });
        medicalPrompt += '\n';
      }

      if (prompt.trim()) {
        medicalPrompt += `Additional Instructions: ${prompt}\n\n`;
      }

      medicalPrompt += `Please analyze the provided medical images and generate a detailed report.`;
      return medicalPrompt;
    }
   
    return prompt;
  };

  // Enhanced response generation with better error handling and post-processing
  const generateResponse = async () => {
    const finalPrompt = medicalMode ? generateMedicalPrompt() : prompt;

    // Validation
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }

    if (!finalPrompt.trim()) {
      setError('Please enter a prompt or instructions');
      return;
    }

    if (medicalMode && selectedModel?.name === 'alibayram/medgemma' && uploadedFiles.length === 0) {
      if (!prompt.trim() && !clinicalQuestion.trim()) {
        setError('Please either upload medical images or enter a medical question for analysis');
        return;
      }
    }

    setLoading(true);
    setError('');
    setResponse('');
    setStats(null);

    try {
      const endpoint = selectedModel?.name === 'alibayram/medgemma' && medicalMode
        ? `${serverUrl}/medgemma_generate`
        : `${serverUrl}/generate`;

      let requestBody;
      let headers = {
        'X-API-Key': selectedModel.apiKey,
      };

      if (medicalMode && uploadedFiles.length > 0) {
        const formData = new FormData();
        formData.append('prompt', finalPrompt);
        formData.append('model', selectedModel.name);
        formData.append('temperature', temperature.toString());
        formData.append('max_tokens', maxTokens.toString());
        formData.append('medical_mode', 'true');
        formData.append('scan_type', selectedScanType);
        formData.append('clinical_question', clinicalQuestion);
        formData.append('report_template', reportTemplate);
        formData.append('structured_prompting', useStructuredPrompting.toString());

        uploadedFiles.forEach((fileObj) => {
          formData.append('files', fileObj.file);
        });

        requestBody = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          prompt: finalPrompt,
          model: selectedModel.name,
          temperature: temperature,
          max_tokens: maxTokens,
          medical_mode: medicalMode,
          scan_type: selectedScanType,
          clinical_question: clinicalQuestion,
          report_template: reportTemplate,
          structured_prompting: useStructuredPrompting,
          custom_system_prompt: customSystemPrompt
        });
      }

      console.log('Sending request to:', endpoint);
      console.log('Final prompt length:', finalPrompt.length);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: requestBody,
      });

      if (res.status === 401) {
        setError('Invalid API key for selected model');
        return;
      }

      if (res.status === 404) {
        setError(`Endpoint not found: ${endpoint}. Please check if the server supports this endpoint.`);
        return;
      }

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMessage = `Server error: ${res.status} ${res.statusText}`;
       
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await res.text();
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
       
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      let data;
     
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textResponse = await res.text();
        data = { response: textResponse };
      }

      let responseText = data.response || data.message || data.text || 'No response received';
     
      // Apply post-processing for medical reports if structured prompting is enabled
      if (medicalMode && useStructuredPrompting && selectedModel?.name === 'alibayram/medgemma') {
        responseText = ensureReportFormat(responseText);
      }

      setResponse(responseText);

      if (data.stats || data.prompt_eval_count !== undefined) {
        setStats({
          promptTokens: data.prompt_eval_count || data.stats?.prompt_tokens || 0,
          responseTokens: data.eval_count || data.stats?.response_tokens || 0,
          totalDuration: data.total_duration || data.stats?.total_duration || 0,
        });
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateResponse();
    }
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    setMedicalMode(model.name === 'alibayram/medgemma');
    if (model.name !== 'alibayram/medgemma') {
      setUploadedFiles([]);
      setMedicalMode(false);
    }
  };

  // Effect hooks
  useEffect(() => {
    checkConnection();
  }, [serverUrl]);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchModelsWithKeys();
    }
  }, [connectionStatus]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDuration = (nano) => {
    if (!nano || nano === 0) return '0ms';
    const ms = nano / 1e6;
    return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;
  };

  return (
    <div className="min-h-screen bg-white text-black flex">
      {/* Model Selection Sidebar - Left */}
      <div
        className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-slate-900 border-r border-slate-300 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-300">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-lg font-semibold text-white">Available Models</h2>
                <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
                  {getStatusIcon()}
                  <span className="text-white">{connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarOpen ? (
            <div className="space-y-3">
              {modelList.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No models available</p>
                </div>
              ) : (
                modelList.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleModelChange(model)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedModel?.id === model.id
                        ? 'bg-white border-slate-600 text-black'
                        : 'bg-slate-800 border-slate-600 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {model.type === 'medical' ? (
                        <Stethoscope className={`w-5 h-5 ${selectedModel?.id === model.id ? 'text-black' : 'text-white'}`} />
                      ) : (
                        <Bot className={`w-5 h-5 ${selectedModel?.id === model.id ? 'text-black' : 'text-white'}`} />
                      )}
                      <h3 className={`font-semibold text-lg ${selectedModel?.id === model.id ? 'text-black' : 'text-white'}`}>{model.displayName}</h3>
                      {model.type === 'medical' && (
                        <span className={`px-2 py-1 text-xs rounded ${selectedModel?.id === model.id ? 'bg-black text-white' : 'bg-slate-600 text-slate-200'}`}>Medical</span>
                      )}
                    </div>

                    <p className={`text-sm mb-3 ${selectedModel?.id === model.id ? 'text-slate-600' : 'text-slate-300'}`}>{model.description}</p>

                    <div className="text-sm">
                      <div className={`mb-1 ${selectedModel?.id === model.id ? 'text-slate-600' : 'text-slate-300'}`}>API Key:</div>
                      <div className={`font-mono px-3 py-2 rounded text-xs break-all ${selectedModel?.id === model.id ? 'bg-slate-100 text-black' : 'bg-slate-900 text-slate-200'}`}>
                        {model.apiKey}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {modelList.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleModelChange(model)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedModel?.id === model.id
                      ? 'bg-white border-slate-600'
                      : 'bg-slate-800 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {model.type === 'medical' ? (
                    <Stethoscope className={`w-6 h-6 mx-auto ${selectedModel?.id === model.id ? 'text-black' : 'text-white'}`} />
                  ) : (
                    <Bot className={`w-6 h-6 mx-auto ${selectedModel?.id === model.id ? 'text-black' : 'text-white'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Center */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-300 bg-white">
          <h1 className="text-3xl font-bold text-black mb-2">
            BCT AI Studio On-Premise LLM Service
          </h1>
          {selectedModel && (
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>
                Active Model: <span className="text-black font-medium">{selectedModel.displayName}</span>
              </span>
              {medicalMode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full">
                  <Stethoscope className="w-4 h-4" />
                  <span>Medical Mode</span>
                  {useStructuredPrompting && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-slate-700 text-white rounded">
                      Enhanced
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`ml-auto flex items-center gap-2 px-3 py-1 text-xs rounded transition-colors ${
                  settingsOpen
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-black'
                }`}
              >
                <Settings className="w-3 h-3" />
                {settingsOpen ? 'Hide Settings' : 'Settings'}
              </button>
            </div>
          )}
        </div>

        {/* Main Area */}
        <div className="flex-1 p-6 bg-white">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Enhanced Medical Imaging Panel */}
            {medicalMode && (
              <div className="mb-6 bg-white rounded-xl border border-slate-300 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="w-5 h-5 text-black" />
                  <h2 className="text-lg font-semibold text-black">Medical Imaging Analysis</h2>
                  {useStructuredPrompting && (
                    <span className="px-2 py-1 text-xs bg-slate-900 text-white rounded">
                      Enhanced Mode
                    </span>
                  )}
                </div>

                {/* File Upload Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-black">Upload Medical Images</label>
                  <div
                    className="border-2 border-dashed border-slate-400 rounded-lg p-6 text-center hover:border-slate-600 transition-colors bg-slate-50"
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      handleFileUpload({ target: { files } });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept=".jpg,.jpeg,.png,.tiff,.dcm,.pdf"
                      multiple
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-600" />
                      <p className="text-black">Click to upload or drag and drop medical images</p>
                      <p className="text-sm text-slate-600">Supports: JPEG, PNG, TIFF, DICOM, PDF (Max 10MB per file)</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg transition-colors"
                      >
                        Choose Files
                      </button>
                    </div>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2 text-black">Uploaded Files ({uploadedFiles.length})</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="w-4 h-4 text-black" />
                              ) : (
                                <FileText className="w-4 h-4 text-black" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-black truncate max-w-48">{file.name}</p>
                              <p className="text-xs text-slate-600">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-slate-600 hover:text-black transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Clinical Question
                    {useStructuredPrompting && <span className="text-xs text-slate-600">(Enhanced prompting will structure this automatically)</span>}
                  </label>
                  <textarea
                    value={clinicalQuestion}
                    onChange={(e) => setClinicalQuestion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-black"
                    rows={2}
                    placeholder="Ask specific clinical questions about the scans..."
                  />
                  {sampleQuestions[selectedScanType] && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-600 mb-1">Sample questions for {selectedScanType.toUpperCase()}:</p>
                      <div className="flex flex-wrap gap-1">
                        {sampleQuestions[selectedScanType].slice(0, 4).map((question, index) => (
                          <button
                            key={index}
                            onClick={() => setClinicalQuestion(question)}
                            className="text-xs px-2 py-1 bg-slate-200 text-black rounded hover:bg-slate-300 transition-colors"
                            title={question}
                          >
                            {question.length > 35 ? question.substring(0, 35) + '...' : question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Chat / Response Panel */}
            <div className="flex-1 bg-white rounded-xl border border-slate-300 p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-black">
                {medicalMode ? 'Medical Analysis Interface' : 'Chat Interface'}
                {medicalMode && useStructuredPrompting && (
                  <span className="ml-2 text-sm text-slate-600">(Enhanced Report Generation)</span>
                )}
              </h2>

              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-black">
                  {medicalMode
                    ? useStructuredPrompting
                      ? 'Additional Instructions (Optional)'
                      : 'Additional Instructions'
                    : 'Your Prompt'
                  }
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 pr-12 bg-white border border-slate-400 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 resize-none text-black"
                    rows={4}
                    placeholder={
                      medicalMode
                        ? useStructuredPrompting
                          ? 'Add any specific instructions or context for the medical analysis. The system will automatically structure the prompt for optimal report generation.'
                          : 'Add any specific instructions or context for the medical analysis...'
                        : 'Type your prompt here... (Enter to send, Shift+Enter for newline)'
                    }
                    disabled={loading}
                  />
                  <button
                    onClick={generateResponse}
                    disabled={loading || !selectedModel}
                    className="absolute bottom-3 right-3 p-2 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
               
                {/* Prompt preview for medical mode with structured prompting */}
                {medicalMode && useStructuredPrompting && selectedModel?.name === 'alibayram/medgemma' && (
                  <div className="mt-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-600 hover:text-black">
                        Preview Enhanced Prompt Structure
                      </summary>
                      <div className="mt-2 p-3 bg-slate-100 rounded border text-black max-h-40 overflow-y-auto font-mono text-xs">
                        {generateMedicalPrompt().substring(0, 500)}...
                        <br />
                        <span className="text-slate-600">[Full structured prompt will be sent to model]</span>
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* Response Area */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-black">
                    {medicalMode ? 'Medical Analysis Report' : 'Response'}
                  </label>
                  {response && (
                    <button
                      onClick={() => {
                        const timestamp = new Date().toISOString().split('T')[0];
                        const filename = medicalMode
                          ? `medical-report-${selectedScanType}-${timestamp}.txt`
                          : `llm-response-${timestamp}.txt`;
                       
                        const blob = new Blob([response], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-black rounded transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download Report
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-[200px] p-4 bg-white text-black border border-slate-400 rounded-lg overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8 text-black">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      <span>
                        {medicalMode
                          ? useStructuredPrompting
                            ? 'Generating structured medical report...'
                            : 'Analyzing medical images...'
                          : 'Generating response...'
                        }
                      </span>
                    </div>
                  ) : response ? (
                    <div className={medicalMode && response.includes('RADIOLOGY REPORT') ? 'prose prose-slate max-w-none' : ''}>
                      <pre className="whitespace-pre-wrap text-black leading-relaxed font-sans">
                        {response}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-8">
                      {selectedModel
                        ? medicalMode
                          ? useStructuredPrompting
                            ? 'Upload images and/or add clinical questions. The system will generate a structured medical report automatically.'
                            : 'Upload images and/or add instructions, then press Send.'
                          : 'Response will appear here...'
                        : 'Select a model from the sidebar to begin'
                      }
                    </div>
                  )}
                </div>

                {/* Enhanced Stats */}
                {stats && (
                  <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-black" />
                      <span className="text-sm font-medium text-black">Generation Stats</span>
                    </div>
                    <div className="text-xs text-black space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Prompt tokens: {stats.promptTokens} | Response tokens: {stats.responseTokens} | Duration: {formatDuration(stats.totalDuration)}
                      </div>
                      {medicalMode && useStructuredPrompting && (
                        <div className="text-black">
                          Enhanced medical prompting enabled - structured report generated
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Connection helper */}
            {connectionStatus !== 'connected' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <div className="text-sm">
                  Unable to reach the backend. Ensure it runs with <code className="font-mono bg-yellow-100 px-1 rounded">--host 0.0.0.0</code>, the firewall allows inbound access to port 8000, and CORS is enabled.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Sidebar - Right */}
      <div
        className={`${settingsOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-900 border-l border-slate-300 flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Generation Settings</h2>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Server Configuration */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Server Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Server URL</label>
                <input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                  placeholder="http://localhost:8000"
                />
              </div>
              <button
                onClick={checkConnection}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white hover:bg-slate-200 text-black rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Test Connection
              </button>
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon()}
                <span className="text-white">
                  {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Generation Parameters */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Generation Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>More Focused</span>
                  <span>More Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2000)}
                  className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                  min="100"
                  max="8000"
                />
                <p className="text-xs text-slate-400 mt-1">Maximum number of tokens to generate</p>
              </div>
            </div>
          </div>

          {/* Medical Mode Settings */}
          {medicalMode && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Medical Analysis Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Scan Type</label>
                  <select
                    value={selectedScanType}
                    onChange={(e) => setSelectedScanType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg outline-none text-black text-sm"
                  >
                    <option value="xray">X-Ray</option>
                    <option value="mri">MRI</option>
                    <option value="ct">CT Scan</option>
                    <option value="ultrasound">Ultrasound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Report Template</label>
                  <select
                    value={reportTemplate}
                    onChange={(e) => setReportTemplate(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black border border-slate-400 rounded-lg outline-none text-sm"
                  >
                    {Object.entries(medicalTemplates).map(([key, template]) => (
                      <option key={key} value={key}>{template.name}</option>
                    ))}
                  </select>
                  {useStructuredPrompting && (
                    <p className="text-xs text-slate-400 mt-1">
                      Focus: {medicalTemplates[reportTemplate].focus}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Structured Prompting</label>
                    <p className="text-xs text-slate-400">Enhanced medical report formatting</p>
                  </div>
                  <button
                    onClick={() => setUseStructuredPrompting(!useStructuredPrompting)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      useStructuredPrompting ? 'bg-white' : 'bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 ${useStructuredPrompting ? 'bg-slate-900' : 'bg-white'} rounded-full top-1 transition-transform ${
                        useStructuredPrompting ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Advanced Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Custom System Prompt</label>
                <textarea
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 text-sm resize-none text-black"
                  rows={4}
                  placeholder="Enter custom system instructions (optional)..."
                />
                <p className="text-xs text-slate-400 mt-1">Override default system prompts with custom instructions</p>
              </div>
            </div>
          </div>

          {/* Reset Settings */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Reset</h3>
            <button
              onClick={() => {
                setTemperature(0.7);
                setMaxTokens(2000);
                setCustomSystemPrompt('');
                setSelectedScanType('xray');
                setReportTemplate('comprehensive');
                setUseStructuredPrompting(true);
              }}
              className="w-full px-3 py-2 text-sm bg-white hover:bg-slate-200 text-black rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMFrontend;