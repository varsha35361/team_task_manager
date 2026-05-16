import { useState } from "react";
import { 
  useListTasks, useCreateTask, useUpdateTask, useDeleteTask, getListTasksQueryKey,
  useGetTask, getGetTaskQueryKey,
  useListTaskComments, useCreateTaskComment, useDeleteComment, getListTaskCommentsQueryKey,
  useListProjects, useListMembers 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckSquare, Search, Filter, Trash2, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", color: "bg-slate-500" },
  { value: "in_progress", label: "In Progress", color: "bg-primary" },
  { value: "review", label: "Review", color: "bg-orange-500" },
  { value: "done", label: "Done", color: "bg-emerald-500" }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-blue-400" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-destructive" }
];

function TaskDetailPanel({ taskId, onClose }: { taskId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: task, isLoading: isTaskLoading } = useGetTask(taskId, {
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(taskId) }
  });
  
  const { data: comments, isLoading: isCommentsLoading } = useListTaskComments(taskId, {
    query: { enabled: !!taskId, queryKey: getListTaskCommentsQueryKey(taskId) }
  });

  const { data: members } = useListMembers();
  
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createComment = useCreateTaskComment();
  const deleteComment = useDeleteComment();

  const [newComment, setNewComment] = useState("");

  const handleStatusChange = (newStatus: string) => {
    updateTask.mutate({ id: taskId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this task?")) return;
    deleteTask.mutate({ id: taskId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: "Task deleted" });
        onClose();
      }
    });
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // Default to the first member as author for mockup purposes if no auth system exists
    const authorId = members?.[0]?.id;
    
    createComment.mutate({ id: taskId, data: { content: newComment, authorId } }, {
      onSuccess: () => {
        setNewComment("");
        queryClient.invalidateQueries({ queryKey: getListTaskCommentsQueryKey(taskId) });
      }
    });
  };
  
  const handleDeleteComment = (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    deleteComment.mutate({ id: commentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTaskCommentsQueryKey(taskId) });
      }
    });
  };

  if (isTaskLoading || !task) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="mb-6 px-6 pt-6 flex-shrink-0">
        <div className="flex items-start justify-between">
          <SheetTitle className="text-xl pr-4 leading-tight">{task.title}</SheetTitle>
          <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0 -mt-1" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-muted-foreground font-medium flex items-center">Status</div>
            <div>
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 py-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-muted-foreground font-medium flex items-center">Priority</div>
            <div>
              <Badge variant="outline" className="font-normal capitalize">
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color}`} />
                {task.priority}
              </Badge>
            </div>

            <div className="text-muted-foreground font-medium flex items-center">Project</div>
            <div className="flex items-center h-8">{task.project?.name || "None"}</div>

            <div className="text-muted-foreground font-medium flex items-center">Assignee</div>
            <div className="flex items-center h-8">
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                    style={{ backgroundColor: task.assignee.avatarColor }}
                  >
                    {task.assignee.name.charAt(0)}
                  </div>
                  <span>{task.assignee.name}</span>
                </div>
              ) : "Unassigned"}
            </div>
            
            <div className="text-muted-foreground font-medium flex items-center">Created</div>
            <div className="flex items-center h-8">{format(new Date(task.createdAt), 'MMM d, yyyy')}</div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Description</h4>
            {task.description ? (
              <div className="text-sm bg-muted/30 p-3 rounded-md border border-muted whitespace-pre-wrap">
                {task.description}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">No description provided.</div>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Comments
            </h4>
            
            <div className="space-y-4">
              {isCommentsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : comments?.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">No comments yet.</div>
              ) : (
                comments?.map(comment => (
                  <div key={comment.id} className="group relative bg-muted/20 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {comment.author ? (
                          <>
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                              style={{ backgroundColor: comment.author.avatarColor }}
                            >
                              {comment.author.name.charAt(0)}
                            </div>
                            <span className="text-xs font-medium">{comment.author.name}</span>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">System</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-background flex-shrink-0">
        <form onSubmit={handlePostComment} className="flex gap-2">
          <Input 
            value={newComment} 
            onChange={e => setNewComment(e.target.value)} 
            placeholder="Write a comment..." 
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newComment.trim() || createComment.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  
  const queryParams = {
    ...(filterStatus !== "all" && { status: filterStatus as any }),
    ...(filterPriority !== "all" && { priority: filterPriority as any }),
  };
  
  const { data: tasks, isLoading } = useListTasks(queryParams);
  const { data: projects } = useListProjects();
  const { data: members } = useListMembers();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<any>({
    title: "", description: "", status: "todo", priority: "medium", projectId: null, assigneeId: null
  });

  const handleCreateOpen = () => {
    setFormData({ title: "", description: "", status: "todo", priority: "medium", projectId: undefined, assigneeId: undefined });
    setIsCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    createTask.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setIsCreateOpen(false);
        toast({ title: "Task created" });
      }
    });
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateTask.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Track and manage all work items.</p>
        </div>

        <Button onClick={handleCreateOpen}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden border rounded-md bg-card shadow-sm">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : tasks?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <CheckSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>No tasks found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-y-auto h-full">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {tasks?.map(task => (
                  <tr 
                    key={task.id} 
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <td className="px-6 py-3 font-medium text-foreground">{task.title}</td>
                    <td className="px-6 py-3">
                      <Select 
                        value={task.status} 
                        onValueChange={(v) => {
                          // Stop propagation handled implicitly by Radix select
                          handleStatusChange(task.id, v);
                        }}
                      >
                        <SelectTrigger className="h-7 w-[130px] border-0 bg-transparent shadow-none px-2 hover:bg-muted focus:ring-0" onClick={e => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="outline" className="font-normal capitalize">
                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color}`} />
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{task.project?.name || "-"}</td>
                    <td className="px-6 py-3">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                            style={{ backgroundColor: task.assignee.avatarColor }}
                          >
                            {task.assignee.name.charAt(0)}
                          </div>
                          <span className="text-muted-foreground">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={formData.projectId?.toString()} onValueChange={v => setFormData({ ...formData, projectId: v === "none" ? undefined : parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={formData.assigneeId?.toString()} onValueChange={v => setFormData({ ...formData, assigneeId: v === "none" ? undefined : parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Add more details..." className="h-24" />
            </div>

            <Button type="submit" className="w-full" disabled={createTask.isPending}>
              Create Task
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL SIDE PANEL */}
      <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <SheetContent className="sm:max-w-md w-full p-0 flex flex-col">
          {selectedTaskId && (
            <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
