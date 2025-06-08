import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  onNewChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isRefreshing, onRefresh, onNewChat }) => (
  <div className="shrink-0 h-14 flex items-center justify-between px-6">
    <div className="w-5" /> {/* Empty div for spacing */}
    <div className="absolute left-1/2 transform -translate-x-1/2">
      <h1 className="text-base font-medium text-gray-900">
        Chat With Content
      </h1>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onNewChat}
        className="p-2 rounded-lg text-gray-900 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="New Chat"
      >
        <svg className="w-5 h-5" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0,512) scale(0.1,-0.1)">
            <path d="M712 4835 c-205 -49 -390 -239 -431 -443 -8 -36 -11 -476 -11 -1410 0 -1495 -4 -1408 62 -1542 41 -82 161 -206 238 -245 124 -63 148 -67 390 -74 248 -7 261 -10 317 -75 43 -48 51 -81 56 -236 4 -102 10 -150 26 -194 59 -166 186 -274 367 -314 93 -20 189 -9 284 33 59 26 96 60 425 386 264 262 373 364 405 378 44 20 64 21 760 21 795 0 795 0 930 66 98 48 211 160 257 254 67 137 63 47 63 1543 0 934 -3 1373 -11 1409 -19 95 -85 213 -161 289 -75 75 -189 138 -286 158 -83 17 -3609 14 -3680 -4z m1936 -1077 c18 -11 41 -37 52 -59 18 -35 20 -59 20 -293 l0 -255 263 -3 c255 -3 263 -4 300 -27 51 -31 81 -91 74 -149 -5 -50 -29 -87 -77 -119 -32 -22 -40 -23 -296 -23 l-263 0 -3 -269 c-3 -255 -4 -271 -24 -298 -35 -48 -82 -73 -134 -73 -52 0 -99 25 -134 73 -20 27 -21 43 -24 298 l-3 269 -263 0 c-256 0 -264 1 -296 23 -77 52 -100 138 -58 211 45 77 58 81 356 84 l262 3 0 255 c0 232 2 258 19 293 24 45 39 59 88 77 45 16 96 10 141 -18z" fill="currentColor"/>
          </g>
        </svg>
      </button>
    </div>
  </div>
);

export default ChatHeader; 