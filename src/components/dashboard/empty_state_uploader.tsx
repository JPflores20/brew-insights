import { useState } from "react";
import { cn } from "@/lib/utils";
import { Beer, FileSpreadsheet, Files, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateUploaderProps {
    loading: boolean;
    uploadProgress: number;
    onFilesSelected: (files: File[]) => void;
}

export function EmptyStateUploader({
    loading,
    uploadProgress,
    onFilesSelected,
}: EmptyStateUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!loading) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (loading) return;

        const droppedFiles = Array.from(e.dataTransfer.files);
        // Filter logic can be done here or in parent. Let's pass all and let parent decide or filter here.
        // Parent logic had filtering for .xlsx. I'll filter here to be safe or just pass.
        // The original code filtered in handleDrop.
        // Let's pass all files and let the parent handle validation/toasts?
        // Actually better to keep validation in parent?
        // Parent expects explicit calls.
        // Let's filter here to match the "Drag and drop" experience, but maybe pass all to `onFilesSelected` and let parent validate.
        onFilesSelected(droppedFiles);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFilesSelected(Array.from(files));
        }
        e.target.value = "";
    };

    return (
        <div
            className={cn(
                "relative flex h-[70vh] flex-col items-center justify-center space-y-6 text-center rounded-xl transition-all overflow-hidden",
                loading ? "" : "border-2 border-dashed",
                !loading && isDragging
                    ? "border-amber-500 bg-amber-500/5 scale-[1.02]"
                    : "border-border"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {loading ? (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
                    <div className="absolute inset-x-0 bottom-0 h-full w-full overflow-hidden rounded-xl">
                        <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 transition-all duration-300 ease-out"
                            style={{ height: `${uploadProgress}%` }}
                        >
                            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse"></div>
                        </div>
                        <div
                            className="absolute w-full h-12 bg-white/90 backdrop-blur-md transition-all duration-300 ease-out flex items-end overflow-hidden shadow-sm"
                            style={{
                                bottom: `${uploadProgress}%`,
                                opacity: uploadProgress > 0 ? 1 : 0,
                            }}
                        >
                            <div className="w-[200%] h-full bg-[radial-gradient(circle,white_60%,transparent_65%)] bg-[length:30px_60px] relative -top-4 animate-[spin_4s_linear_infinite] opacity-70"></div>
                            <div className="w-[200%] h-full bg-[radial-gradient(circle,white_60%,transparent_65%)] bg-[length:40px_50px] relative -top-2 -left-10 animate-[spin_3s_linear_reverse_infinite]"></div>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center space-y-4 p-8 rounded-2xl bg-background/20 backdrop-blur-md border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <Beer
                                className={cn(
                                    "h-20 w-20 text-amber-100 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]",
                                    uploadProgress >= 100 ? "animate-bounce" : "animate-pulse"
                                )}
                                strokeWidth={1.5}
                            />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold text-white drop-shadow-md">
                                {uploadProgress < 100
                                    ? "Mezclando ingredientes..."
                                    : "¡Salud! Datos listos."}
                            </h2>
                            <p className="text-xl text-white/90 font-mono font-bold drop-shadow-sm">
                                {Math.round(uploadProgress)}%
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div
                        className={cn(
                            "rounded-full p-6 transition-transform duration-300",
                            isDragging ? "bg-amber-500/20 scale-110" : "bg-primary/10"
                        )}
                    >
                        {isDragging ? (
                            <Files className="h-16 w-16 text-amber-500 animate-bounce" />
                        ) : (
                            <FileSpreadsheet className="h-16 w-16 text-primary" />
                        )}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Cargar Datos de Producción
                        </h1>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            {isDragging
                                ? "¡Suelta los archivos!"
                                : "Arrastra hasta 4 archivos DBF aquí, o selecciona para empezar."}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <Button
                            size="lg"
                            className={cn(
                                "relative cursor-pointer hover:scale-105 transition-transform shadow-lg",
                                isDragging ? "bg-amber-500 hover:bg-amber-600" : ""
                            )}
                        >
                            <Upload className="mr-2 h-5 w-5" />
                            Seleccionar Archivos (Max 4)
                            <input
                                type="file"
                                multiple
                                accept=".dbf"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={handleFileInput}
                            />
                        </Button>
                        {!isDragging && (
                            <p className="text-xs text-muted-foreground">
                                Soporta unicamente archivos .dbf
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
