import { useState } from "react";
import { useListMembers, useCreateMember, useUpdateMember, useDeleteMember, getListMembersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MoreVertical, Plus, Trash2, Pencil, Shield, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Members() {
  const { data: members, isLoading } = useListMembers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<{name: string; email: string; role: "admin" | "member" | "viewer"; avatarColor: string}>({ 
    name: "", 
    email: "", 
    role: "member",
    avatarColor: "#6366f1"
  });

  const handleOpenDialog = (member?: any) => {
    if (member) {
      setEditingId(member.id);
      setFormData({ name: member.name, email: member.email, role: member.role, avatarColor: member.avatarColor });
    } else {
      setEditingId(null);
      setFormData({ name: "", email: "", role: "member", avatarColor: `#${Math.floor(Math.random()*16777215).toString(16)}` });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingId) {
      updateMember.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          setIsOpen(false);
          toast({ title: "Member updated" });
        }
      });
    } else {
      createMember.mutate({ data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          setIsOpen(false);
          toast({ title: "Member invited" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Remove this member?")) return;
    deleteMember.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
        toast({ title: "Member removed" });
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage access and roles for your team.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Member" : "Invite Member"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMember.isPending || updateMember.isPending}>
                {editingId ? "Save Changes" : "Send Invite"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : members?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg border-muted">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">No team members</h3>
          <p className="text-muted-foreground mb-4">Invite people to collaborate on tasks.</p>
          <Button onClick={() => handleOpenDialog()} variant="outline">Invite Member</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members?.map(member => (
            <Card key={member.id} className="hover-elevate group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-none mb-1">{member.name}</h3>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-muted-foreground">
                      {member.role === 'admin' ? <Shield className="w-3 h-3 text-primary" /> : <User className="w-3 h-3" />}
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(member)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
