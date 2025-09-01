(function () {
  // Configuration (to be passed when embedding or fetched from server)
  const config = {
    agentSlug: window.EarnLinksConfig?.agentSlug || 'default-agent',
    chatUrl: window.EarnLinksConfig?.chatUrl || 'https://example.com/chat',
    embedSize: {
      width: window.EarnLinksConfig?.embedSize?.width || '600px',
      height: window.EarnLinksConfig?.embedSize?.height || '600px',
    },
    apiUrl: 'https://api.tagwell.co/api/v4/ai-agent/get-agent/details/',
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
    border: 2px solid white; /* White border when chat is closed */
    border-radius: 50%; /* Circular border for closed state */
  `;

  // Create video wrapper (to contain video and label)
  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'video-wrapper';
  videoWrapper.style.cssText = `
    position: relative;
    width: 150px;
    height: 150px;
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
      font-size: 12px; /* Smaller font to fit inside video */
      font-weight: bold;
      color: #333;
      background: rgba(255, 255, 255, 0.8); /* Low opacity */
      padding: 3px 6px;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Enhanced shadow */
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); /* Text shadow */
      transition: opacity 0.2s ease;
      width: 90%; /* Fit within video width */
      max-width: 130px; /* Slightly less than video width */
      z-index: 1001; /* Above video */
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
      border: none; /* Remove border when chat is open */
      border-radius: 10px; /* Match iframe border-radius when open */
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
        border: none; /* Ensure no border when open on small screens */
      }
      .chat-container:not(.active) {
        width: 150px !important;
        max-width: 100%;
        border: 2px solid white; /* White border when closed on small screens */
        border-radius: 50%; /* Circular border for closed state */
      }
      .chat-label {
        max-width: 100%; /* Full width on small screens when closed */
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
  container.appendChild(loading);
  container.appendChild(iframe);
  container.appendChild(closeButton);
  container.appendChild(errorMessage);
  document.getElementById('earnlinks-chat-widget').appendChild(container);

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
  });

  closeButton.addEventListener('click', () => {
    iframe.classList.remove('active');
    closeButton.classList.remove('active');
    container.classList.remove('active');
    videoWrapper.classList.remove('hidden');
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
    }
  });

  // Expose functions to update width and height dynamically
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
  };

  // Initial size update
  updateIframeSize();
})();