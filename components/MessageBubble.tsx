import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/lib/types";
import { Inter } from "next/font/google";


const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function MessageBubble({
  msg,
  
}: {
  msg: ChatMessage;
  model: string;
}) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "4px 0",
      }}
      className={inter.className}
    > {msg.content ? (
      <div
        style={{
          maxWidth: "75%",
          padding: "12px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "#2900a3" : "",
          backdropFilter: isUser ? undefined : "blur(12px)",

          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.3)",
          fontSize: "15px",
          lineHeight: "1.5",
          wordBreak: "break-word",
          position: "relative",
        }}
        className={`my-2 text-primary-text`}
      >
       
          <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed text-[15px] tracking-wide">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-3 text-[15px]  font-normal">{children}</p>
                ),

                strong: ({ children }) => (
                  <strong className="font-semibold ">{children}</strong>
                ),

                em: ({ children }) => <em className="italic">{children}</em>,

                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition-all duration-150"
                  >
                    {children}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="inline-block ml-1 w-3.5 h-3.5 opacity-75 group-hover:opacity-100"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.293 2.293a1 1 0 011.414 0l4 4a1
            1 0 01-1.414 1.414L14 5.414V17a1 1 0 11-2
            0V5.414L9.707 7.707A1 1 0 018.293
            6.293l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                ),

                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic my-3 bg-blue-50/40 dark:bg-blue-950/30 rounded-md py-2">
                    {children}
                  </blockquote>
                ),

                ul: ({ children }) => (
                  <ul className="list-disc list-inside my-2 space-y-1 ">
                    {children}
                  </ul>
                ),

                ol: ({ children }) => (
                  <ol className="list-decimal list-inside my-2 space-y-1 ">
                    {children}
                  </ol>
                ),

                li: ({ children }) => <li className="pl-1">{children}</li>,

                code: ({
                  inline,
                  className,
                  children,
                }: {
                  inline?: boolean;
                  className?: string;
                  children?: React.ReactNode;
                }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return inline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 text-[14px] px-2 py-0.5 rounded-md font-medium text-gray-900 dark:text-gray-100">
                      {children}
                    </code>
                  ) : (
                    <pre className="relative bg-[#0d1117] text-gray-100 text-[14px] leading-relaxed font-mono rounded-xl p-4 shadow-inner border border-gray-800 my-3 overflow-x-auto">
                      {match && (
                        <div className="absolute top-2 right-3 text-[11px] text-gray-400 uppercase font-semibold">
                          {match[1]}
                        </div>
                      )}
                      <code className="whitespace-pre-wrap wrap-break-word">
                        {children}
                      </code>
                    </pre>
                  );
                },

                hr: () => (
                  <hr className="my-4 border-gray-200 dark:border-gray-700 rounded-full" />
                ),

                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-50 tracking-tight">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">
                    {children}
                  </h3>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>

          
          </div>
       
      </div>
 ) : (
          <div className="flex items-center gap-2 h-6 p-5">
            <div className="flex gap-1">
              <span className="dot animate-bounce delay-0"></span>
              <span className="dot animate-bounce delay-200"></span>
              <span className="dot animate-bounce delay-400"></span>
            </div>
          </div>
        )}
      <style jsx>{`
        .dot {
          display: inline-block;
          width: 15px;
          height: 15px;
          background: #fff;
          border-radius: 50%;
          margin-right: 2px;
        }
        .animate-bounce {
          animation: bounce 0.6s infinite alternate;
        }
        .delay-0 {
          animation-delay: 0s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        @keyframes bounce {
          from {
            transform: translateY(0);
            opacity: 0.6;
          }
          to {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
