"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Dialog, { DialogVariant } from "@/components/Dialog";

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: DialogVariant;
    closeOnOverlay?: boolean;
}

interface AlertOptions {
    title: string;
    message: string;
    confirmText?: string;
    variant?: DialogVariant;
}

interface DialogContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

interface DialogState {
    isOpen: boolean;
    type: "confirm" | "alert";
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    variant: DialogVariant;
    closeOnOverlay: boolean;
    resolve: ((value: boolean) => void) | null;
}

const initialState: DialogState = {
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    confirmText: "确定",
    cancelText: "取消",
    variant: "default",
    closeOnOverlay: true,
    resolve: null,
};

export function DialogProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DialogState>(initialState);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                type: "confirm",
                title: options.title,
                message: options.message,
                confirmText: options.confirmText || "确定",
                cancelText: options.cancelText || "取消",
                variant: options.variant || "default",
                closeOnOverlay: options.closeOnOverlay ?? true,
                resolve,
            });
        });
    }, []);

    const alert = useCallback((options: AlertOptions): Promise<void> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                type: "alert",
                title: options.title,
                message: options.message,
                confirmText: options.confirmText || "确定",
                cancelText: "取消",
                variant: options.variant || "default",
                closeOnOverlay: true,
                resolve: () => resolve(),
            });
        });
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleClose = useCallback(() => {
        if (state.resolve) {
            state.resolve(false);
        }
        setState(initialState);
    }, [state.resolve]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleConfirm = useCallback(() => {
        if (state.resolve) {
            state.resolve(true);
        }
        setState(initialState);
    }, [state.resolve]);

    return (
        <DialogContext.Provider value={{ confirm, alert }}>
            {children}
            <Dialog
                isOpen={state.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={state.title}
                message={state.message}
                type={state.type}
                variant={state.variant}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
                closeOnOverlay={state.closeOnOverlay}
            />
        </DialogContext.Provider>
    );
}

export function useDialog(): DialogContextType {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error("useDialog must be used within a DialogProvider");
    }
    return context;
}
