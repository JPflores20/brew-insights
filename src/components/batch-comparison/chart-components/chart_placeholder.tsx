import React from "react";

interface ChartPlaceholderProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    isUnderConstruction?: boolean;
}

export function ChartPlaceholder({
    icon,
    title,
    description,
    isUnderConstruction = false
}: ChartPlaceholderProps) {
    if (isUnderConstruction) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed border-muted/50">
                <div className="h-10 w-10 mb-4 opacity-20 flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="text-lg font-medium mb-1">{title}</h3>
                <p className="text-center text-sm max-w-md opacity-80">
                    {description}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground p-8 border-2 border-dashed border-muted rounded-lg">
            <div className="h-8 w-8 opacity-50 mb-2 flex items-center justify-center">
                {icon}
            </div>
            <p>{title}</p>
            <p className="text-sm mt-1">{description}</p>
        </div>
    );
}
