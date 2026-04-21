import React from "react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ChartCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    headerContent?: React.ReactNode;
    isUnderConstruction?: boolean;
}

export function ChartCard({
    title,
    description,
    icon,
    children,
    headerContent,
    isUnderConstruction = false
}: ChartCardProps) {
    return (
        <Card className={`bg-card border-border w-full p-6 transition-opacity ${isUnderConstruction ? 'opacity-80' : 'opacity-90 hover:opacity-100'}`}>
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${isUnderConstruction ? 'text-muted-foreground' : ''}`}>
                            {icon}
                            {title}
                        </CardTitle>
                        <CardDescription>
                            {description}
                        </CardDescription>
                    </div>
                    {headerContent}
                </div>
            </CardHeader>
            <div className="h-[340px] w-full">
                {children}
            </div>
        </Card>
    );
}
