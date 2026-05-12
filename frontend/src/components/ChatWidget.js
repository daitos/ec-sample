import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

const CHATBOT_URL = process.env.REACT_APP_CHATBOT_URL || 'http://localhost:8000';
const SESSION_KEY = 'chatbot_session_id';

function ChatWidget({ onCartUpdate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 0,
            role: 'assistant',
            content: 'こんにちは！ショッピングアシスタントです。商品の検索やカートの管理をお手伝いします。',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // メッセージ追加時に自動スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        const sessionId = sessionStorage.getItem(SESSION_KEY);

        // ユーザーメッセージを即時表示
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${CHATBOT_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, session_id: sessionId }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            sessionStorage.setItem(SESSION_KEY, data.session_id);

            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            }]);

            // カート操作が行われた可能性があるため、カウンターを更新する
            if (onCartUpdate) {
                onCartUpdate();
            }
        } catch (error) {
            const errorMsg = error.name === 'AbortError'
                ? '応答がタイムアウトしました。再度お試しください。'
                : 'エラーが発生しました。しばらく時間をおいてから再度お試しください。';
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'error',
                content: errorMsg,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-widget">
            {/* フローティングボタン */}
            <button
                className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'チャットを閉じる' : 'チャットを開く'}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* チャットウィンドウ */}
            {isOpen && (
                <div className="chat-window" role="dialog" aria-label="ショッピングアシスタント">
                    <div className="chat-header">
                        <span className="chat-header-icon">🛒</span>
                        <span className="chat-header-title">ショッピングアシスタント</span>
                        <button
                            className="chat-close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="閉じる"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="chat-messages" role="log" aria-live="polite">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message message-${msg.role}`}>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message message-assistant">
                                <div className="message-content loading-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <textarea
                            className="chat-input"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="メッセージを入力... (Enterで送信)"
                            rows={1}
                            disabled={isLoading}
                            aria-label="メッセージ入力"
                        />
                        <button
                            className="chat-send-btn"
                            onClick={sendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            aria-label="送信"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatWidget;
