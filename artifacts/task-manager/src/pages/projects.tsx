import { useState } from "react";
import { useListProjects, useCreateProject, useUpdateProject, useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderGit2, MoreVertical, Plus, Trash2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "", color: "#000000" });

  const handleOpenDialog = (project?: any) => {
    if (project) {
      setEditingId(project.id);
      setFormData({ name: project.name, description: project.description || "", color: project.color });
    } else {
      setEditingId(null);
      setFormData({ name: "", description: "", color: "#000000" });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      updateProject.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setIsOpen(false);
          toast({ title: "Project updated" });
        }
      });
    } else {
      createProject.mutate({ data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setIsOpen(false);
          toast({ title: "Project created" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure?")) return;
    deleteProject.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Project deleted" });
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your team's projects and initiatives.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Project" : "Create Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Project Name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-16 h-10 p-1" />
                  <Input value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createProject.isPending || updateProject.isPending}>
                Save Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg border-muted">
          <FolderGit2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first project to get started.</p>
          <Button onClick={() => handleOpenDialog()} variant="outline">Create Project</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map(project => (
            <Card key={project.id} className="hover-elevate group overflow-hidden border-t-4" style={{ borderTopColor: project.color }}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold truncate pr-4" title={project.name}>{project.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(project)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2 mt-1">{project.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground mt-4">
                  Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
