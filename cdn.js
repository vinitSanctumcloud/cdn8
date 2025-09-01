(function () {
  // Configuration (to be passed when embedding or fetched from server)
  const config = {
    agentSlug: window.LinkaAiConfig?.agentSlug || 'default-agent',
    chatUrl: window.LinkaAiConfig?.chatUrl || 'https://example.com/chat',
    embedSize: {
      width: window.LinkaAiConfig?.embedSize?.width || '600px',
      height: window.LinkaAiConfig?.embedSize?.height || '600px',
    },
    apiUrl: 'https://api.tagwell.co/api/v4/ai-agent/get-agent/details/',
    closingMessage: window.LinkaAiConfig?.closingMessage || '', // New config for closing message
  };

  // Dynamic height and width adjustment
  const embedHeight =
    typeof config.embedSize.height === 'string'
      ? `${parseInt(config.embedSize.height, 10)}px`
      : `${config.embedSize.height}px`;
  const embedWidth =
    typeof config.embedSize.width === 'string'
      ? `${parseInt(config.embedSize.width, 10)}px`
      : `${config.embedSize.width}px`;

  // Create container
  const container = document.createElement('div');
  container.className = 'chat-container';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    --chat-width: ${embedWidth};
    --chat-height: ${embedHeight};
    width: 150px; /* Default to video width when chat is closed */
    max-width: 100%;
  `;

  // Create video wrapper (to contain video and label)
  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'video-wrapper';
  videoWrapper.style.cssText = `
    position: relative;
    width: 150px;
    height: 150px;
  `;

  // Create closing message input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'closing-message-wrapper';
  inputWrapper.style.cssText = `
    display: none;
    width: 100%;
    max-width: 300px;
    margin-top: 10px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  `;

  // CSS styles
  const styles = `
    .video-wrapper {
      position: relative;
      width: 150px;
      height: 150px;
    }
    .chat-label {
      position: absolute;
      bottom: 40%;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      color: #333;
      background: rgba(255, 255, 255, 0.8);
      padding: 3px 6px;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      transition: opacity 0.2s ease;
      width: 90%;
      max-width: 130px;
      z-index: 1001;
    }
    .chat-video {
      width: 150px;
      height: 150px;
      cursor: pointer;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    .chat-video:hover {
      transform: scale(1.05);
    }
    .chat-iframe {
      display: none;
      width: var(--chat-width) !important;
      height: var(--chat-height) !important;
      border: none;
      border-radius: 10px;
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 1000000;
      max-width: 100%;
      max-height: 100%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .chat-iframe.active {
      display: block;
    }
    .chat-container.active {
      width: var(--chat-width) !important;
      height: var(--chat-height) !important;
      z-index: 100000000;
    }
    .close-button {
      display: none;
      position: fixed;
      bottom: calc(-6px + var(--chat-height));
      right: 8px;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 18px;
      font-weight: bold;
      line-height: 32px;
      text-align: center;
      cursor: pointer;
      z-index: 9999;
      transition: transform 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }
    .close-button:hover {
      transform: scale(1.1);
    }
    .close-button.active {
      display: block;
    }
    .chat-video.hidden {
      display: none;
    }
    .video-wrapper.hidden {
      display: none;
    }
    .closing-message-wrapper {
      display: none;
    }
    .closing-message-wrapper.active {
      display: block;
    }
    .closing-message-label {
      font-size: 12px;
      font-weight: medium;
      color: #333;
      margin-bottom: 4px;
    }
    .closing-message-input {
      width: 100%;
      padding: 6px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      transition: border-color 0.2s ease;
    }
    .closing-message-input:focus {
      outline: none;
      border-color: #5a67d8;
      box-shadow: 0 0 0 2px rgba(90, 103, 216, 0.2);
    }
    .closing-message-counter {
      font-size: 12px;
      color: #666;
      text-align: right;
      margin-top: 4px;
    }
    .chat-loading {
      position: fixed;
      bottom: 180px;
      right: 20px;
      color: #333;
      font-size: 14px;
      z-index: 1000;
    }
    .error-message {
      position: fixed;
      bottom: 180px;
      right: 20px;
      color: #ff4d4f;
      font-size: 14px;
      z-index: 1000;
      display: none;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    @media (max-width: 640px) {
      .chat-iframe {
        width: 100% !important;
        height: 80vh !important;
        max-width: 100%;
        max-height: 100%;
      }
      .chat-container.active {
        width: 100% !important;
        height: 80vh !important;
      }
      .chat-container:not(.active) {
        width: 150px !important;
        max-width: 100%;
      }
      .chat-label {
        max-width: 100%;
      }
      .closing-message-wrapper {
        max-width: 100%;
      }
    }
  `;

  // Append styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create "Chat with me" label
  const chatLabel = document.createElement('div');
  chatLabel.className = 'chat-label';
  chatLabel.textContent = 'Chat with me';

  // Create video
  const video = document.createElement('video');
  video.className = 'chat-video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  const videoSource = document.createElement('source');
  videoSource.id = 'video-source';
  videoSource.type = 'video/mp4';
  video.appendChild(videoSource);

  // Create closing message input
  const closingMessageLabel = document.createElement('label');
  closingMessageLabel.className = 'closing-message-label';
  closingMessageLabel.textContent = 'Closing Message';
  closingMessageLabel.htmlFor = 'closing-message-input';

  const closingMessageInput = document.createElement('input');
  closingMessageInput.className = 'closing-message-input';
  closingMessageInput.id = 'closing-message-input';
  closingMessageInput.placeholder = 'Final Closing Message (Optional)';
  closingMessageInput.maxLength = 500;
  closingMessageInput.value = config.closingMessage;

  const closingMessageCounter = document.createElement('div');
  closingMessageCounter.className = 'closing-message-counter';
  closingMessageCounter.textContent = `${closingMessageInput.value.length}/500`;

  // Update counter on input
  closingMessageInput.addEventListener('input', () => {
    closingMessageCounter.textContent = `${closingMessageInput.value.length}/500`;
    // Send closing message to iframe
    iframe.contentWindow?.postMessage(
      { type: 'setClosingMessage', closingMessage: closingMessageInput.value },
      '*'
    );
  });

  // Append input elements to wrapper
  inputWrapper.appendChild(closingMessageLabel);
  inputWrapper.appendChild(closingMessageInput);
  inputWrapper.appendChild(closingMessageCounter);

  // Append label to video wrapper
  videoWrapper.appendChild(video);
  videoWrapper.appendChild(chatLabel);

  // Create other elements
  const iframe = document.createElement('iframe');
  iframe.className = 'chat-iframe';
  iframe.src = config.chatUrl;
  iframe.setAttribute('allowtransparency', 'true');

  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.textContent = 'X';

  const loading = document.createElement('div');
  loading.className = 'chat-loading';
  loading.textContent = 'Loading...';
  loading.style.display = 'none';

  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = 'Failed to load video. Please try again later.';

  // Append elements to container
  container.appendChild(videoWrapper);
  container.appendChild(inputWrapper);
  container.appendChild(loading);
  container.appendChild(iframe);
  container.appendChild(closeButton);
  container.appendChild(errorMessage);
  document.getElementById('linka-ai-chat-widget').appendChild(container);

  // Fetch video URL
  loading.style.display = 'block';
  fetch(`${config.apiUrl}${config.agentSlug}`)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (data.data?.ai_agent?.greeting_media_url) {
        videoSource.src = data.data.ai_agent.greeting_media_url;
        video.load();
        loading.style.display = 'none';
      } else {
        throw new Error('No video URL found');
      }
    })
    .catch((error) => {
      console.error('Error fetching video URL:', error);
      loading.style.display = 'none';
      errorMessage.style.display = 'block';
      setTimeout(() => (errorMessage.style.display = 'none'), 5000);
    });

  // Event listeners
  video.addEventListener('click', () => {
    iframe.classList.add('active');
    closeButton.classList.add('active');
    container.classList.add('active');
    videoWrapper.classList.add('hidden');
    inputWrapper.classList.add('active');
  });

  closeButton.addEventListener('click', () => {
    iframe.classList.remove('active');
    closeButton.classList.remove('active');
    container.classList.remove('active');
    videoWrapper.classList.remove('hidden');
    inputWrapper.classList.remove('active');
  });

  // Handle window resize
  const updateIframeSize = () => {
    const currentWidth = container.style.getPropertyValue('--chat-width') || embedWidth;
    const currentHeight = container.style.getPropertyValue('--chat-height') || embedHeight;
    iframe.style.width = window.innerWidth < 640 ? '100%' : currentWidth;
    iframe.style.height = window.innerWidth < 640 ? '80vh' : currentHeight;
    container.style.width = window.innerWidth < 640 ? (container.classList.contains('active') ? '100%' : '150px') : (container.classList.contains('active') ? currentWidth : '150px');
    container.style.height = window.innerWidth < 640 && container.classList.contains('active') ? '80vh' : 'auto';
    closeButton.style.bottom = window.innerWidth < 640 ? 'calc(-6px + 80vh)' : `calc(-6px + ${currentHeight})`;
    // Notify iframe content
    iframe.contentWindow?.postMessage({ type: 'setWidth', width: iframe.style.width }, '*');
    iframe.contentWindow?.postMessage({ type: 'setHeight', height: iframe.style.height }, '*');
    iframe.contentWindow?.postMessage({ type: 'setClosingMessage', closingMessage: closingMessageInput.value }, '*');
  };

  window.addEventListener('resize', updateIframeSize);

  // Listen for messages from iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'setWidth') {
      container.style.setProperty('--chat-width', event.data.width);
      updateIframeSize();
    } else if (event.data.type === 'setHeight') {
      container.style.setProperty('--chat-height', event.data.height);
      updateIframeSize();
    } else if (event.data.type === 'setClosingMessage') {
      closingMessageInput.value = event.data.closingMessage || '';
      closingMessageCounter.textContent = `${closingMessageInput.value.length}/500`;
    }
  });

  // Expose functions to update widget properties
  window.EarnLinksChatWidget = {
    setWidth: (newWidth) => {
      const widthValue = typeof newWidth === 'string' ? newWidth : `${newWidth}px`;
      container.style.setProperty('--chat-width', widthValue);
      updateIframeSize();
    },
    setHeight: (newHeight) => {
      const heightValue = typeof newHeight === 'string' ? newHeight : `${newHeight}px`;
      container.style.setProperty('--chat-height', heightValue);
      updateIframeSize();
    },
    setClosingMessage: (newMessage) => {
      closingMessageInput.value = newMessage.slice(0, 500); // Enforce 500-char limit
      closingMessageCounter.textContent = `${closingMessageInput.value.length}/500`;
      iframe.contentWindow?.postMessage(
        { type: 'setClosingMessage', closingMessage: closingMessageInput.value },
        '*'
      );
    },
  };

  // Initial size update and closing message setup
  updateIframeSize();
  closingMessageCounter.textContent = `${closingMessageInput.value.length}/500`;
})();