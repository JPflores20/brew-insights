import { useState } from "react";
import { cn } from "@/lib/utils";
import { Beer, FileSpreadsheet, Files, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
interface EmptyStateUploaderProps {
    loading: boolean;
    uploadProgress: number;
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
}
export function EmptyStateUploader({
    loading,
    uploadProgress,
    onFilesSelected,
    maxFiles = 4,
}: EmptyStateUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.dbf'));
        setPendingFiles(prev => [...prev, ...droppedFiles]);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.dbf'));
            setPendingFiles(prev => [...prev, ...newFiles]);
        }
        e.target.value = "";
    };

    const handleProcess = () => {
        if (pendingFiles.length > 0) {
            onFilesSelected(pendingFiles);
            setPendingFiles([]);
        }
    };

    const removeFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div
            className={cn(
                "relative flex min-h-[70vh] flex-col items-center justify-center space-y-6 text-center rounded-xl transition-all overflow-hidden p-8",
                loading ? "" : "border-2 border-dashed",
                !loading && isDragging
                    ? "border-amber-500 bg-amber-500/5 scale-[1.01]"
                    : "border-border",
                pendingFiles.length > 0 && !loading ? "border-solid border-amber-500/50 bg-amber-500/5" : ""
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
            ) : pendingFiles.length > 0 ? (
                <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto">
                        <Files className="h-10 w-10 text-primary" />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">
                            Archivos Seleccionados ({pendingFiles.length})
                        </h2>
                        <p className="text-muted-foreground">
                            Puedes añadir más archivos de otras carpetas o iniciar la carga ahora.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl max-h-[30vh] overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-2 text-left">
                            {pendingFiles.map((file, idx) => (
                                <div key={`${file.name}-${idx}`} className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700 text-xs">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button 
                                        onClick={() => removeFile(idx)}
                                        className="text-red-400 hover:text-red-300 ml-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <div className="relative">
                            <Button variant="outline" size="lg" className="border-amber-500/50 hover:bg-amber-500/10 gap-2">
                                <Upload className="h-4 w-4" />
                                Añadir Más
                                <input
                                    type="file"
                                    multiple
                                    accept=".dbf"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={handleFileInput}
                                />
                            </Button>
                        </div>
                        
                        <Button 
                            size="lg" 
                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg gap-2 px-8"
                            onClick={handleProcess}
                        >
                            <Beer className="h-4 w-4" />
                            Procesar {pendingFiles.length} Archivos
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setPendingFiles([])}
                        >
                            Cancelar
                        </Button>
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
                                : `Arrastra hasta ${maxFiles} archivos DBF aquí, o selecciona para empezar.`}
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Button
                                size="lg"
                                className={cn(
                                    "relative cursor-pointer hover:scale-105 transition-transform shadow-lg",
                                    isDragging ? "bg-amber-500 hover:bg-amber-600" : ""
                                )}
                            >
                                <Upload className="mr-2 h-5 w-5" />
                                Seleccionar Archivos (Max {maxFiles})
                                <input
                                    type="file"
                                    multiple
                                    accept=".dbf"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={handleFileInput}
                                />
                            </Button>
                        </div>
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
