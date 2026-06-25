import React from "react";

interface PlaceholderViewProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  desc: string;
}

export function PlaceholderView({ icon: Icon, title, desc }: PlaceholderViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#F4F6F5" }}>
      <div className="text-center">
        <Icon size={40} color="#CBD5E1" />
        <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, color: "#94A3B8", marginTop: 12 }}>{title}</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#CBD5E1", marginTop: 6 }}>{desc}</p>
      </div>
    </div>
  );
}
