import type { ReactNode } from 'react';

interface WindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Window({ title, onClose, children }: WindowProps) {
  return (
    <main className="window">
      <div className="title-bar">
        <div className="close-box" onClick={onClose} />
        <span className="title">{title}</span>
      </div>
      <div className="window-content">{children}</div>
    </main>
  );
}
