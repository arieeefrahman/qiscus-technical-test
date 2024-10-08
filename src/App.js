import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Paperclip } from 'lucide-react';

const ChatInterface = () => {
  const [chatData, setChatData] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showChatList, setShowChatList] = useState(true);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetch('/chat-data.json')
      .then(response => response.json())
      .then(data => {
        setChatData(data);
        setActiveRoom(data.results[0]);
      });

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        setShowChatList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeRoom]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const updatedRoom = {
      ...activeRoom,
      comments: [
        ...activeRoom.comments,
        {
          id: Date.now(),
          type: 'text',
          message: newMessage,
          sender: 'customer@mail.com',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    setActiveRoom(updatedRoom);
    setNewMessage('');
    setChatData(prevData => ({
      ...prevData,
      results: prevData.results.map(room =>
        room.room.id === updatedRoom.room.id ? updatedRoom : room
      )
    }));
  };

  const getParticipantName = (email) => {
    const participant = activeRoom.room.participant.find(p => p.id === email);
    return participant ? participant.name : 'Unknown';
  };

  const renderMessage = (comment) => {
    const isCurrentUser = comment.sender === 'customer@mail.com';
    const senderName = getParticipantName(comment.sender);
    const timestamp = new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    switch (comment.type) {
      case 'text':
        return (
          <div className={`flex flex-col p-2 rounded-lg max-w-[75%] ${isCurrentUser ? 'bg-green-500 text-white self-end' : 'bg-gray-200 self-start'}`}>
            <p className="font-semibold text-base mb-1">{senderName}</p>
            <p className="text-base break-words">{comment.message}</p>
            <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
          </div>
        );
      case 'image':
        return (
          <div className={`p-2 rounded-lg max-w-[75%] ${isCurrentUser ? 'bg-green-500 text-white self-end' : 'bg-gray-200 self-start'}`}>
            <p className="font-semibold text-base mb-2">{senderName}</p>
            <img src={comment.file_url} alt={comment.file_name} className="w-full max-w-[400px] h-auto rounded-lg mb-1" />
            <p className="text-base break-words">{comment.message}</p>
            <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
          </div>
        );
      case 'video':
        return (
          <div className={`p-2 rounded-lg max-w-[75%] ${isCurrentUser ? 'bg-green-500 text-white self-end' : 'bg-gray-200 self-start'}`}>
            <p className="font-semibold text-base mb-2">{senderName}</p>
            <video src={comment.file_url} controls poster={comment.thumbnail_url} className="w-full max-w-[400px] h-auto rounded-lg mb-1" />
            <p className="text-base break-words">{comment.message}</p>
            <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
          </div>
        );
      case 'pdf':
        return (
          <div className={`p-2 rounded-lg max-w-[75%] ${isCurrentUser ? 'bg-green-500 text-white self-end' : 'bg-gray-200 self-start'}`}>
            <p className="font-semibold text-base mb-1">{senderName}</p>
            <a href={comment.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-green-500 text-base">
              <Paperclip className="mr-1" size={12} />
              <span className="truncate max-w-[180px]">{comment.file_name}</span>
            </a>
            <p className="text-base mt-1 break-words">{comment.message}</p>
            <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const isGroupChat = activeRoom?.room?.type === 'group';

if (!activeRoom) {
  return <div className="h-screen flex items-center justify-center">Loading...</div>;
}


  return (
    <div className="flex h-screen bg-gray-100 max-w-full overflow-hidden">
      {(showChatList || !isMobile) && (
        <div className={`${isMobile ? 'w-full' : 'w-64 md:w-1/4'} bg-slate-50 border overflow-y-auto`}>
          <div className="p-4">
            <h2 className={`${isMobile ? 'justify-center' : 'justify-start'} flex text-2xl font-bold mb-7 ml-2`}>Chat Rooms</h2>
            {chatData.results.map(room => (
              <div
                key={room.room.id}
                className={`flex items-center p-2 cursor-pointer rounded ${activeRoom.room.id === room.room.id ? 'bg-green-200' : ''}`}
                onClick={() => {
                  setActiveRoom(room);
                  if (isMobile) setShowChatList(false);
                }}
              >
                <img src={room.room.image_url} alt={room.room.name} className="w-10 h-10 rounded-full mr-3" />
                <span className="text-lg truncate">{room.room.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!isMobile || !showChatList) && (
        <div className="flex-1 flex flex-col h-full ">
          <div className="bg-white p-4 shadow flex items-center">
            {isMobile && (
              <button onClick={() => setShowChatList(true)} className="mr-4">
                <ArrowLeft size={24} />
              </button>
            )}
            <img src={activeRoom.room.image_url} alt={activeRoom.room.name} className="w-10 h-10 rounded-full mr-3" />

            <h2 className="text-xl font-bold truncate">{activeRoom.room.name}</h2>
            {isGroupChat && (
              <div className="ml-4">
                <span className="text-sm text-gray-600">Group Chat</span>
              </div>
            )}
          </div>

          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
            <div className="flex flex-col space-y-4">
              {activeRoom.comments.map(comment => (
                <div key={comment.id} className={`flex ${comment.sender === 'customer@mail.com' ? 'justify-end' : 'justify-start'}`}>
                  {renderMessage(comment)}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message here..."
              className="flex-1 border rounded-full px-4 py-2 mr-4 text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="p-2 bg-green-500 text-white rounded-full"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
