class WebSocketService {
  constructor() {
    this.socket = null;
    this.clientId = null;
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.isConnected = false;
    this.topics = new Set();
  }

  generateClientId() {
    return 'client-' + Math.random().toString(36).substr(2, 9);
  }

  connect() {
    if (this.socket && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    this.clientId = this.generateClientId();
    const wsUrl = `ws://${window.location.hostname}:8000/api/ws/${this.clientId}`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Resubscribe to all topics after reconnection
        this.topics.forEach(topic => {
          this.subscribe(topic);
        });
        
        this.emit('connect', { clientId: this.clientId });
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          // Handle different message types
          if (message.type && this.messageHandlers.has(message.type)) {
            this.messageHandlers.get(message.type).forEach(handler => {
              try {
                handler(message.data);
              } catch (error) {
                console.error('Error in message handler:', error);
              }
            });
          }
          
          // Also allow handling by topic
          if (message.topic && this.messageHandlers.has(`topic:${message.topic}`)) {
            this.messageHandlers.get(`topic:${message.topic}`).forEach(handler => {
              try {
                handler(message.data);
              } catch (error) {
                console.error('Error in topic handler:', error);
              }
            });
          }
          
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        this.isConnected = false;
        this.emit('disconnect', { event });
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', { error });
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      console.log('Reconnecting...');
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  subscribe(topic) {
    if (!this.isConnected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }
    
    this.topics.add(topic);
    this.sendMessage({
      type: 'subscribe',
      topic: topic
    });
  }

  unsubscribe(topic) {
    if (!this.isConnected) {
      return;
    }
    
    this.topics.delete(topic);
    this.sendMessage({
      type: 'unsubscribe',
      topic: topic
    });
  }

  on(event, callback) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event).push(callback);
    
    // Return cleanup function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.messageHandlers.has(event)) {
      const handlers = this.messageHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.messageHandlers.has(event)) {
      this.messageHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  sendMessage(message) {
    if (!this.isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

// Auto-connect when imported
if (typeof window !== 'undefined') {
  webSocketService.connect();
}
