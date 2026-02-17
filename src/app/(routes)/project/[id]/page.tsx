"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectsModel as Projects, ScriptsModel as Scripts } from "@/generated/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ProjectHeader } from "@/components/project/project-header";
import { ScriptList } from "@/components/project/script-list";
import { ScriptEditor } from "@/components/project/script-editor";


export default function ProjectPage() {
    const [project, setProject] = useState<Projects | null>(null);
    const [scripts, setScripts] = useState<Scripts[]>([]);
    const [selectedScript, setSelectedScript] = useState<Scripts | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const router = useRouter();
    const { id: projectId } = params;

    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [scriptToRename, setScriptToRename] = useState<Scripts | null>(null);
    const [scriptToDelete, setScriptToDelete] = useState<Scripts | null>(null);
    const [newScriptName, setNewScriptName] = useState("");
    const [renamedScriptName, setRenamedScriptName] = useState("");

    const fetchProjectAndScripts = useCallback(async () => {
        if (projectId) {
            setLoading(true);
            try {
                // Fetch project details
                const projectResponse = await fetch(`/api/projects/${projectId}`);
                if (!projectResponse.ok) throw new Error("Failed to fetch project");
                const projectData = await projectResponse.json();
                setProject(projectData);

                // Fetch scripts for the project
                const scriptsResponse = await fetch(`/api/projects/${projectId}/scripts`);
                if (!scriptsResponse.ok) throw new Error("Failed to fetch scripts");
                const scriptsData = await scriptsResponse.json();
                setScripts(scriptsData);

            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectAndScripts();
    }, [fetchProjectAndScripts]);

    // Dialog handlers
    const openCreateDialog = () => {
        setNewScriptName("");
        setCreateDialogOpen(true);
    };

    const openRenameDialog = (script: Scripts) => {
        setScriptToRename(script);
        setRenamedScriptName(script.name);
        setRenameDialogOpen(true);
    };

    const openDeleteDialog = (script: Scripts) => {
        setScriptToDelete(script);
        setDeleteDialogOpen(true);
    };


    // API call handlers
    const handleCreateScript = async () => {
        if (!newScriptName.trim() || !projectId) return;
        try {
            const response = await fetch('/api/scripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newScriptName, projectId }),
            });
            if (!response.ok) throw new Error('Failed to create script');
            await fetchProjectAndScripts(); // Re-fetch
            setCreateDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleRenameScript = async () => {
        if (!renamedScriptName.trim() || !scriptToRename) return;
        try {
            const response = await fetch(`/api/scripts/${scriptToRename.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: renamedScriptName }),
            });
            if (!response.ok) throw new Error('Failed to rename script');
            await fetchProjectAndScripts(); // Re-fetch
            setRenameDialogOpen(false);
            setScriptToRename(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleDeleteScript = async () => {
        if (!scriptToDelete) return;
        try {
            const response = await fetch(`/api/scripts/${scriptToDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete script');
            await fetchProjectAndScripts(); // Re-fetch
            if (selectedScript?.id === scriptToDelete.id) {
                setSelectedScript(null); // Clear selection if deleted
            }
            setDeleteDialogOpen(false);
            setScriptToDelete(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };


    if (loading) return <div>Loading project...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!project) return <div>Project not found.</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="flex flex-1 flex-col overflow-hidden">
                <ProjectHeader project={project} />
                <div className="flex flex-1 overflow-hidden">
                    <ScriptList
                        scripts={scripts}
                        selectedScript={selectedScript}
                        onSelectScript={setSelectedScript}
                        onCreateScript={openCreateDialog}
                        onRenameScript={openRenameDialog}
                        onDeleteScript={openDeleteDialog}
                    />
                    <ScriptEditor selectedScript={selectedScript} />
                </div>
            </div>

            {/* Create Script Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Script</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-script-name">Script Name</Label>
                        <Input id="new-script-name" value={newScriptName} onChange={(e) => setNewScriptName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateScript}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Script Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Script</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rename-script-name">New Script Name</Label>
                        <Input id="rename-script-name" value={renamedScriptName} onChange={(e) => setRenamedScriptName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenameScript}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Script Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the script "{scriptToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteScript}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="fixed inset-0 bg-linear-to-tr from-black via-transparent to-primary/8 pointer-events-none z-0"></div>
            <div className="fixed inset-0 grid-pattern pointer-events-none z-0"></div>
        </div>
    );
}
