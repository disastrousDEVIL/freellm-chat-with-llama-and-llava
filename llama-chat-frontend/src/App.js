import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const LlamaVisionChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your local Llama vision model. You can send me text messages or attach images for me to analyze. What would you like to chat about?",
      timestamp: new Date()
    }
  ]);
  const [chatHistory, setChatHistory] = useState([]); // NEW: chat history for backend
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState({ available: false, checking: true });
  const [mode, setMode] = useState('best'); // NEW: mode state
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Check model status on component mount
  useEffect(() => {
    checkModelStatus();
    // Reset chat history on reload
    setChatHistory([]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const checkModelStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-model');
      const data = await response.json();
      setModelStatus({ ...data, checking: false });
    } catch (error) {
      setModelStatus({ 
        available: false, 
        checking: false, 
        error: 'Cannot connect to backend server' 
      });
    }
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: Date.now() + Math.random(),
            file: file,
            url: e.target.result,
            name: file.name
          };
          setSelectedImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && selectedImages.length === 0) return;
    if (isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      images: [...selectedImages],
      timestamp: new Date()
    };

    // Add to UI message list
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare chat history for backend: always end with user message
    let historyForBackend = [...chatHistory];
    // Remove trailing assistant message if present
    while (historyForBackend.length > 0 && historyForBackend[historyForBackend.length - 1].role === 'assistant') {
      historyForBackend.pop();
    }
    // Add the new user message
    historyForBackend.push({ role: 'user', content: inputMessage.trim() });

    // Add to chat history for local state (will append assistant after response)
    setChatHistory([...historyForBackend]);

    // Prepare form data
    const formData = new FormData();
    if (inputMessage.trim()) {
      formData.append('message', inputMessage.trim());
    }
    selectedImages.forEach((image, index) => {
      formData.append('images', image.file);
    });
    formData.append('mode', mode); // append mode
    formData.append('chat_history', JSON.stringify(historyForBackend)); // append chat history

    // Clear input
    setInputMessage('');
    setSelectedImages([]);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        // Add assistant reply to chat history (for next turn)
        setChatHistory(prev => [
          ...prev,
          { role: 'assistant', content: data.response }
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure your Llama model is running locally.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const StatusBadge = () => {
    if (modelStatus.checking) {
      return (
        <div className="flex items-center gap-2 text-yellow-600 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          Checking model...
        </div>
      );
    }

    if (modelStatus.available) {
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          Model ready
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        Model not available
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🦙</div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">FreeLLM Chat</h1>
              <StatusBadge />
            </div>
          </div>
          <button
            onClick={checkModelStatus}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}
            >
              {message.content && (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              )}
              
              {message.images && message.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {message.images.map((image) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.name}
                      className="rounded-lg max-w-full h-auto object-cover"
                    />
                  ))}
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t px-6 py-4">
        {/* Mode Selector */}
        <div className="mb-3 flex items-center gap-3">
          <label htmlFor="mode-select" className="text-sm font-medium text-gray-700">Mode:</label>
          <select
            id="mode-select"
            value={mode}
            onChange={e => setMode(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="best">Best (auto)</option>
            <option value="text">Text (llama3)</option>
            <option value="image">Image (llava)</option>
          </select>
        </div>
        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {selectedImages.map((image) => (
              <div key={image.id} className="relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            multiple
            accept="image/*"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={modelStatus.available ? "Type your message..." : "Model not available - check connection"}
            disabled={isLoading || !modelStatus.available}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows="1"
          />
          
          <button
            onClick={sendMessage}
            disabled={isLoading || !modelStatus.available || (!inputMessage.trim() && selectedImages.length === 0)}
            className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default LlamaVisionChat;