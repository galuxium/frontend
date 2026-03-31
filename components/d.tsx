import React, { useState, FormEvent, useRef } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import IconSend from "./AI/IconSend";


export default function Bar({
  onSend,
  disabled,
  scrollToBottom,
  autoScroll,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  scrollToBottom: () => void;
  autoScroll: boolean;
}) {
  const [value, setValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const txt = value.trim();
    if (!txt) return;
    onSend(txt);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // reset height after sending
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // auto-resize upwards
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // reset
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <form onSubmit={submit} className="w-full flex justify-center my-3">
         {!autoScroll && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-10 right-[10vw] w-7 h-7 flex flex-row items-center justify-center text-[#2e147e] bg-[#2000c1]/25 rounded-lg shadow-lg hover:bg-[#2000c1]/20 active:scale-90 duration-300  transition"
          >
            <ChevronDown />
          </button>
        )}
      <div
        className={`relative flex flex-row items-center lg:w-full max-w-3xl w-md rounded-2xl
        ${
          isFocused
            ? "border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.6)]"
            : "border-gray-700"
        } 
        bg-[#c7bfe9] 
        transition-all duration-300 ease-out flex-col-reverse`} // ✅ makes textarea grow upward
      >
        <div className="pl-5 text-[#2e147e] animate-pulse">
          <Sparkles size={20} />
        </div>

        <textarea
          ref={textareaRef}
          placeholder="Ask Galuxium AI anything..."
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={1}
          className="max-h-[25vh] overflow-y-auto w-full resize-none overflow-hidden py-4 px-5 text-[#2e147e] placeholder-[#2e147e] font-semibold 
          focus:outline-none text-lg"
          disabled={disabled}
        />

       
        <button
          type="submit"
          disabled={disabled}
          className="px-3 py-2 bg-[#2e147e] mx-3 text-white rounded-2xl active:scale-90 transition duration:200"
        >
          <IconSend />
        </button>
      </div>
        
      
    </form>
  );
}
