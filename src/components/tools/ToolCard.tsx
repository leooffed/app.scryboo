import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORIES, COLOR_CLASSES, type Tool } from "../../lib/tools-registry";

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Wrench;
  return <Icon className={className} />;
}

export function ToolCard({ tool }: { tool: Tool }) {
  const colors = COLOR_CLASSES[CATEGORIES[tool.category].color];
  return (
    <Link
      to={`/${tool.category}/${tool.slug}`}
      className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <ToolIcon name={tool.icon} className={`w-5 h-5 ${colors.text}`} />
        </span>
        <span className="flex gap-1">
          {tool.isPopular && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              Populaire
            </span>
          )}
          {tool.usesAI && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-600">
              IA
            </span>
          )}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{tool.name}</h3>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tool.description}</p>
    </Link>
  );
}
