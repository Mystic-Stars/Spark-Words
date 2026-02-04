"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useEffect, useCallback } from "react";

export type DialogVariant = "default" | "danger" | "success" | "warning";
export type DialogType = "confirm" | "alert";

export interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type?: DialogType;
    variant?: DialogVariant;
    confirmText?: string;
    cancelText?: string;
    closeOnOverlay?: boolean;
}

const variantStyles = {
    default: {
        icon: Info,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        buttonBg: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
    },
    danger: {
        icon: AlertTriangle,
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        buttonBg: "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600",
    },
    success: {
        icon: CheckCircle,
        iconBg: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
        buttonBg: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
    },
    warning: {
        icon: AlertTriangle,
        iconBg: "bg-amber-100 dark:bg-amber-900/30",
        iconColor: "text-amber-600 dark:text-amber-400",
        buttonBg: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
    },
};

export default function Dialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = "alert",
    variant = "default",
    confirmText = "确定",
    cancelText = "取消",
    closeOnOverlay = true,
}: DialogProps) {
    const styles = variantStyles[variant];
    const IconComponent = styles.icon;

    // Handle ESC key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Prevent body scroll when dialog is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleOverlayClick = () => {
        if (closeOnOverlay) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative border border-zinc-200/50 dark:border-zinc-800/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-150"
                            aria-label="关闭"
                        >
                            <X className="w-4 h-4" strokeWidth={2} />
                        </button>

                        {/* Content */}
                        <div className="p-6 pt-8">
                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div
                                    className={`w-14 h-14 rounded-full ${styles.iconBg} flex items-center justify-center`}
                                >
                                    <IconComponent
                                        className={`w-7 h-7 ${styles.iconColor}`}
                                        strokeWidth={2}
                                    />
                                </div>
                            </div>

                            {/* Title & Message */}
                            <div className="text-center mb-6">
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                    {title}
                                </h2>
                                <p className="text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div
                                className={`flex gap-3 ${type === "confirm" ? "flex-row" : "flex-col"
                                    }`}
                            >
                                {type === "confirm" && (
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 text-[14px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all duration-150"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={type === "confirm" ? handleConfirm : onClose}
                                    className={`flex-1 px-4 py-2.5 text-[14px] font-medium text-white ${styles.buttonBg} rounded-xl transition-all duration-150 shadow-lg shadow-blue-500/20`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
