import SidebarClient from './SidebarClient'
import type { Dispatch, SetStateAction } from "react";
export interface SidebarProps {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  mobileToogleCollapsed: boolean;
  setMobileToogleCollapsed: Dispatch<SetStateAction<boolean>>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}
export default function Sidebar({ collapsed, setCollapsed,mobileToogleCollapsed,setMobileToogleCollapsed,activeConversationId,setActiveConversationId }: SidebarProps) {
  return (
    <div>
      <SidebarClient 
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      mobileToogleCollapsed={mobileToogleCollapsed}
  setMobileToogleCollapsed={setMobileToogleCollapsed}
   activeConversationId={activeConversationId}
  setActiveConversationId={setActiveConversationId}
      />
    </div>
  )
}
