"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

/**
 * Properties interface for the ProjectDeleteConfirmationDialog component
 */
export interface ProjectDeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectName: string;
    onConfirm: () => void;
}

/**
 * ProjectDeleteConfirmationDialog component provides a secure confirmation dialog for project deletion
 *
 * This component implements a safety measure requiring users to type the project name to confirm deletion,
 * preventing accidental deletion of important data.
 *
 * @component
 * @param {ProjectDeleteConfirmationDialogProps} props - Component properties
 *
 * @example
 * // Basic usage
 * <ProjectDeleteConfirmationDialog
 *   open={isDeleteDialogOpen}
 *   onOpenChange={setIsDeleteDialogOpen}
 *   projectName="My Project"
 *   onConfirm={handleDeleteProject}
 * />
 */
export function ProjectDeleteConfirmationDialog({
    open,
    onOpenChange,
    projectName,
    onConfirm
}: ProjectDeleteConfirmationDialogProps) {
    const [confirmationText, setConfirmationText] = useState("");

    const handleConfirm = () => {
        if (confirmationText.trim() === projectName) {
            onConfirm();
            setConfirmationText("");
        }
    };

    return (
        <AlertDialog
            open={open}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    setConfirmationText("");
                }
                onOpenChange(newOpen);
            }}
        >
            <AlertDialogContent className="sm:max-w-130 p-5">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive text-lg">
                        Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <span className="block text-sm text-muted-foreground mb-4">
                            This action cannot be undone. This will permanently delete the project{" "}
                            <strong>{`"${projectName}"`}</strong> and all of its associated scripts,
                            graphs, and data. This action is irreversible.
                        </span>
                        <span className="block font-medium">
                            Please type{" "}
                            <span className="text-destructive">{`"${projectName}"`}</span> to confirm:
                        </span>
                        <Input
                            className="mt-2 py-4 px-2"
                            placeholder={projectName}
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            autoFocus
                        />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="cursor-pointer"
                        onClick={() => {
                            setConfirmationText("");
                            onOpenChange(false);
                        }}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={confirmationText.trim() !== projectName}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    >
                        I understand, delete project
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}