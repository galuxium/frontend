import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaTrash, } from "react-icons/fa";

type Conversation = {
  id: string;
  title: string;
  created_at?: string | null;
};

type Props = {
  c: Conversation;
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
};

export default function ConversationBubble({
  c,
  activeConversationId,
  setActiveConversationId,

  onDelete,

  
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement | null>(null);

  const MENU_WIDTH = 130;
  const MENU_HEIGHT = 120;

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".galuxium-menu")) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();

      let top = rect.top + window.scrollY + rect.height + 5;
      let left = rect.left + window.scrollX - MENU_WIDTH + rect.width - 105;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontally if overflowing
      if (left + MENU_WIDTH > viewportWidth) {
        left = viewportWidth - MENU_WIDTH - 8;
      }
      if (left < 0) {
        left = 8;
      }

      // Adjust vertically if overflowing
      if (top + MENU_HEIGHT > viewportHeight + window.scrollY) {
        top = rect.top + window.scrollY - MENU_HEIGHT +60;
      }
      if (top < 0) {
        top = 8;
      }

      setMenuPos({ top, left });
    }
    setShowMenu(true);
  };

  return (
    <>
      <div
        className={`group md:w-[14vw] w-[34vw] max-h-[15vh] cursor-pointer transition-all duration-200 
        ${activeConversationId === c.id
          ? "bg-[#f4f1ff] border-l-4 border-[#5C3BFF]"
          : "hover:bg-white/10 hover:shadow-md hover:shadow-indigo-500/20"
        }`}
      >
        <span className="font-semibold text-sm grid grid-cols-[90%_10%] items-center">
          <span className="py-2 px-5" onClick={() => setActiveConversationId(c.id)}>{c.title}</span>
          <div ref={iconRef}>
            <FaBars
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-indigo-800"
              onClick={handleMenuOpen}
            />
          </div>
        </span>
      </div>

      {showMenu && (
        <div
          className="fixed galuxium-menu bg-gradient-to-br from-gray-300 via-gray-300 to-gray-200 
          text-black font-semibold rounded-lg shadow-2xl px-2 py-1 animate-fadeIn"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            width: MENU_WIDTH,
          }}
        >
          <div className="flex flex-col gap-2 my-1">
           
            <button
              onClick={() => onDelete?.(c.id)}
              className="flex items-center gap-3 px-4 py-1 rounded-lg hover:bg-gray-300 hover:brightness-110 transition-all"
            >
              <FaTrash className="text-[#2000c1]" /> Delete
            </button>
          </div>
        </div>
      )}
    </>
  );
}
