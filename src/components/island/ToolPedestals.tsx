import React from 'react';
import {
  Layers,
  Scissors,
  LayoutGrid,
  Minimize2,
  Image as ImageIcon,
  FileImage,
  RotateCw,
  Hash,
} from 'lucide-react';
import { playClickSound } from '../../lib/audio/sound-effects';

export type ToolType =
  | 'merge'
  | 'split'
  | 'organize'
  | 'compress'
  | 'pdf-to-images'
  | 'images-to-pdf'
  | 'rotate'
  | 'page-numbers';

interface ToolItemDef {
  id: ToolType;
  title: string;
  subtitle: string;
  color: string;
  accent: string;
  icon: React.ReactNode;
}

const TOOLS: ToolItemDef[] = [
  {
    id: 'merge',
    title: 'Merge',
    subtitle: 'stick them together!',
    color: '#FF5CA8',
    accent: '#ffe5f1',
    icon: <Layers size={24} color="#FF5CA8" />,
  },
  {
    id: 'split',
    title: 'Split',
    subtitle: 'chop it up!',
    color: '#65B9FF',
    accent: '#e6f4ff',
    icon: <Scissors size={24} color="#65B9FF" />,
  },
  {
    id: 'organize',
    title: 'Organize',
    subtitle: 'reorder, delete, rotate',
    color: '#D6FF70',
    accent: '#f5ffd4',
    icon: <LayoutGrid size={24} color="#D6FF70" />,
  },
  {
    id: 'compress',
    title: 'Compress',
    subtitle: 'make it smaller!',
    color: '#FFA834',
    accent: '#fff2e0',
    icon: <Minimize2 size={24} color="#FFA834" />,
  },
  {
    id: 'pdf-to-images',
    title: 'PDF to Images',
    subtitle: 'turn pages into pics',
    color: '#BC79FF',
    accent: '#f3e6ff',
    icon: <ImageIcon size={24} color="#BC79FF" />,
  },
  {
    id: 'images-to-pdf',
    title: 'Images to PDF',
    subtitle: 'pics to pdf!',
    color: '#FFE600',
    accent: '#fffcd1',
    icon: <FileImage size={24} color="#FFE600" />,
  },
  {
    id: 'rotate',
    title: 'Rotate',
    subtitle: 'spin it!',
    color: '#FF5268',
    accent: '#ffe4e7',
    icon: <RotateCw size={24} color="#FF5268" />,
  },
  {
    id: 'page-numbers',
    title: 'Page Numbers',
    subtitle: 'add some numbers!',
    color: '#54F5E7',
    accent: '#e3fefa',
    icon: <Hash size={24} color="#54F5E7" />,
  },
];

interface ToolPedestalsProps {
  onSelectTool: (tool: ToolType) => void;
  activeTool: ToolType | null;
}

export const ToolPedestals: React.FC<ToolPedestalsProps> = ({
  onSelectTool,
  activeTool,
}) => {
  return (
    <div className="tool-pedestals-container">
      {TOOLS.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            className="tool-object-btn"
            style={{
              borderColor: isActive ? t.color : 'rgba(146, 91, 255, 0.4)',
              boxShadow: isActive ? `0 0 20px ${t.color}` : undefined,
            }}
            onClick={() => {
              playClickSound();
              onSelectTool(t.id);
            }}
            aria-label={`${t.title} - ${t.subtitle}`}
          >
            <div
              className="tool-icon-wrapper"
              style={{
                background: `radial-gradient(circle, ${t.color}22 0%, #151726 80%)`,
                border: `1.5px solid ${t.color}66`,
              }}
            >
              {t.icon}
            </div>
            <span className="tool-title" style={{ color: t.color }}>
              {t.title}
            </span>
            <span className="tool-subtitle">{t.subtitle}</span>
          </button>
        );
      })}
    </div>
  );
};
